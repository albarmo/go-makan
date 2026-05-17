// Patches @solidjs/vite-plugin-nitro-2 to fix Vercel deployment.
// Root cause: Nitropack uses H3 v1 where event.req is a raw Node.js
// IncomingMessage (url = '/role', path-only). The virtual entry passes it
// to SolidStart's H3 v2 which calls new URL('/role') → throws Invalid URL.
// Fix: reconstruct a full URL + buffer the body before creating the Request.

const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@solidjs',
  'vite-plugin-nitro-2',
  'dist',
  'index.js',
);

if (!fs.existsSync(filePath)) {
  console.log('[patch] @solidjs/vite-plugin-nitro-2 not found, skipping.');
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf-8');

const ORIGINAL = `\`import { fromWebHandler } from 'h3'
                                  import handler from '\${ssrEntryFile}'
                                  export default fromWebHandler(handler.fetch)\``;

const PATCHED = `\`import handler from '\${ssrEntryFile}'
                                  function readBody(nodeReq) {
                                    return new Promise((resolve, reject) => {
                                      const chunks = [];
                                      nodeReq.on('data', (c) => chunks.push(c));
                                      nodeReq.on('end', () => resolve(Buffer.concat(chunks)));
                                      nodeReq.on('error', reject);
                                    });
                                  }
                                  export default async function(event) {
                                    const nodeReq = event.node?.req || event.req;
                                    const h = typeof nodeReq?.headers === 'object' ? nodeReq.headers : {};
                                    const host = h.host || h[':authority'] || 'localhost';
                                    const proto = h['x-forwarded-proto'] || (nodeReq?.socket?.encrypted ? 'https' : 'http');
                                    const url = proto + '://' + host + (nodeReq?.url || '/');
                                    const headers = {};
                                    for (const [k, v] of Object.entries(h)) {
                                      if (v != null) headers[k] = Array.isArray(v) ? v.join(', ') : String(v);
                                    }
                                    const method = nodeReq?.method || 'GET';
                                    const reqInit = { method, headers: new Headers(headers) };
                                    if (method !== 'GET' && method !== 'HEAD' && nodeReq) {
                                      const body = await readBody(nodeReq);
                                      if (body.length > 0) reqInit.body = body;
                                    }
                                    const request = new Request(url, reqInit);
                                    return handler.fetch(request, event.context || event);
                                  }\``;

if (content.includes("fromWebHandler(handler.fetch)")) {
  content = content.replace(ORIGINAL, PATCHED);
  fs.writeFileSync(filePath, content);
  console.log('[patch] Applied Vercel URL fix to @solidjs/vite-plugin-nitro-2');
} else if (content.includes("readBody(nodeReq)")) {
  console.log('[patch] Already patched, skipping.');
} else {
  console.warn('[patch] WARNING: Could not find patch target. Package may have been updated.');
}
