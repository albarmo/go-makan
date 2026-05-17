import { action } from "@solidjs/router";

export interface ImageUploadResult {
  url: string;
  fileId: string;
  thumbnailUrl: string;
}

export const uploadImageAction = action(async (formData: FormData) => {
  "use server";

  const { default: ImageKit } = await import("imagekit");
  const { Buffer } = await import("node:buffer");
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

  if (!urlEndpoint || !publicKey || !privateKey) {
    throw new Error(
      "ImageKit env vars missing: IMAGEKIT_URL_ENDPOINT, IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY",
    );
  }

  const file = formData.get("file");
  const folder = String(formData.get("folder") ?? "").trim();

  if (!(file instanceof File)) {
    throw new Error("File upload tidak ditemukan.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Hanya file gambar yang didukung.");
  }

  const bytes = await file.arrayBuffer();
  const ik = new ImageKit({ urlEndpoint, publicKey, privateKey });
  const safeFileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

  const uploaded = await ik.upload({
    file: Buffer.from(bytes),
    fileName: safeFileName,
    folder: folder || undefined,
    useUniqueFileName: true,
  });

  return {
    url: uploaded.url,
    fileId: uploaded.fileId,
    thumbnailUrl: uploaded.thumbnailUrl,
  } satisfies ImageUploadResult;
});
