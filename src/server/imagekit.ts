import { query } from "@solidjs/router";
import ImageKit from "imagekit";

function getImageKit() {
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

  if (!urlEndpoint || !publicKey || !privateKey) {
    throw new Error(
      "ImageKit env vars missing: IMAGEKIT_URL_ENDPOINT, IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY"
    );
  }

  return new ImageKit({ urlEndpoint, publicKey, privateKey });
}

export interface ImageKitAuth {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
}

export const getImageKitAuth = query(async (): Promise<ImageKitAuth> => {
  "use server";
  const ik = getImageKit();
  const auth = ik.getAuthenticationParameters();
  return {
    ...auth,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
  };
}, "imagekitAuth");
