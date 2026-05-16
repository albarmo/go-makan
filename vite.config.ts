import { defineConfig, loadEnv } from "vite";
import { nitroV2Plugin as nitro } from "@solidjs/vite-plugin-nitro-2";
import { solidStart } from "@solidjs/start/config";

export default defineConfig(({ mode }) => {
  // Load all .env vars (no prefix filter) into process.env
  // so server-side code (DB, etc.) can access them via process.env
  const env = loadEnv(mode, process.cwd(), "");
  Object.entries(env).forEach(([key, value]) => {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  });

  const isVercel = process.env.VERCEL === "1";

  return {
    plugins: [
      solidStart(),
      nitro(isVercel ? { preset: "vercel" } : {}),
    ],
  };
});
