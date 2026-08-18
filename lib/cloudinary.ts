import { getCloudinarySignature } from "@/actions/cloudinary";

export interface CloudinaryUploadResult {
  success: true;
  url: string;
  publicId: string;
  originalFilename: string;
}

export interface CloudinaryUploadError {
  success: false;
  error: string;
}

/**
 * Uploads single or multiple files directly to Cloudinary using signed requests.
 *
 * @param files Single File or File array
 * @param folder Cloudinary target folder path (e.g. "avatars" or "products/jackets")
 * @returns Promise resolving to an array of upload results
 */
export async function handleUpload(
  files: File | File[],
  folder: string = "uploads",
): Promise<(CloudinaryUploadResult | CloudinaryUploadError)[]> {
  const fileArray = Array.isArray(files) ? files : [files];

  if (fileArray.length === 0) {
    return [];
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "";

  if (!cloudName) {
    throw new Error(
      "Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME environment variable.",
    );
  }

  const uploadSingleFile = async (
    file: File,
  ): Promise<CloudinaryUploadResult | CloudinaryUploadError> => {
    const paramsToSign = { folder };
    const { ok, timestamp, signature } =
      await getCloudinarySignature(paramsToSign);

    if (!ok || !timestamp || !signature) {
      return {
        success: false,
        error: "Failed to get signature",
      };
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: data.error?.message || `Failed to upload ${file.name}`,
      };
    }

    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
      originalFilename: file.name,
    };
  };

  return Promise.all(fileArray.map((file) => uploadSingleFile(file)));
}

/*
 SAMPLE USAGE
 
 "use client";

import { useState, ChangeEvent } from "react";
import { handleUpload, CloudinaryUploadResult } from "@/lib/cloudinary";

export default function CustomUploadUI() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<CloudinaryUploadResult[]>([]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const onSubmit = async () => {
    if (files.length === 0) return;

    try {
      setUploading(true);
      // Works seamlessly with array or single file
      const uploadedData = await handleUpload(files, "user-gallery");
      setResults(uploadedData);
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg max-w-md">
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm"
      />

      <button
        onClick={onSubmit}
        disabled={uploading || files.length === 0}
        className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
      >
        {uploading ? "Uploading..." : `Upload ${files.length} file(s)`}
      </button>

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="font-semibold text-green-600">Successfully Uploaded:</p>
          <ul className="list-disc pl-5 text-sm">
            {results.map((res) => (
              <li key={res.publicId}>
                <a href={res.url} target="_blank" rel="noreferrer" className="underline">
                  {res.originalFilename}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
 */
