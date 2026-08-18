"use server";

import { v2 as cloudinary } from "cloudinary";
import { checkPermission } from "@/features/auth/lib/permissions";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function getCloudinarySignature(
  paramsToSign: Record<string, string>,
) {
  const { user } = await checkPermission();

  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const timestamp = Math.round(new Date().getTime() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    { ...paramsToSign, timestamp },
    process.env.CLOUDINARY_API_SECRET!,
  );

  return { ok: true, timestamp, signature };
}

export const deleteImage = async (
  imageUrl: string | null,
): Promise<boolean> => {
  if (!imageUrl) return false;

  const { user } = await checkPermission();

  if (!user) {
    return false;
  }

  const path = imageUrl.split("/upload/");

  if (path.length !== 2) {
    return false;
  }

  const publicId = path[1]
    .replace(/^v\d+\//, "")
    .replace(/\.[^/.]+(?=$|\?)/, "");

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });

    return result.result === "ok";
  } catch (error) {
    return false;
  }
};
