import { apiClient } from "./client";
import SparkMD5 from "spark-md5";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Types
export interface DirectUploadResponse {
  direct_upload: {
    url: string;
    headers: Record<string, string>;
  };
  blob_signed_id: string;
  blob_id: number;
}

export interface UploadedImage {
  signed_id: string;
  url: string;
  filename: string;
}

// Calculate MD5 checksum for file (required by Active Storage)
// Returns Base64-encoded MD5 hash
async function calculateChecksum(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const spark = new SparkMD5.ArrayBuffer();
  spark.append(arrayBuffer);
  const rawHash = spark.end(true); // true = return raw binary string
  return btoa(rawHash);
}

/**
 * Request a direct upload URL from the API
 */
async function createDirectUpload(file: File): Promise<DirectUploadResponse> {
  const checksum = await calculateChecksum(file);

  const response = await apiClient<DirectUploadResponse>("/direct_uploads", {
    method: "POST",
    body: {
      blob: {
        filename: file.name,
        byte_size: file.size,
        checksum: checksum,
        content_type: file.type,
      },
    },
  });

  return response;
}

/**
 * Upload file directly to storage using the presigned URL
 */
async function uploadToStorage(
  file: File,
  directUpload: DirectUploadResponse
): Promise<void> {
  const { url, headers } = directUpload.direct_upload;

  // For local disk storage, the URL is relative to the API server
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

  const response = await fetch(fullUrl, {
    method: "PUT",
    headers: {
      ...headers,
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
}

/**
 * Upload an image file and return the blob signed_id for attaching to a note
 *
 * Flow:
 * 1. Request direct upload URL from API (with file metadata)
 * 2. Upload file directly to storage using presigned URL
 * 3. Return blob signed_id for attaching to note
 */
export async function uploadImage(file: File): Promise<UploadedImage> {
  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      `Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(", ")}`
    );
  }

  // Validate file size (30MB max)
  const maxSize = 30 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size is 30MB.`);
  }

  // Step 1: Get direct upload URL
  const directUpload = await createDirectUpload(file);

  // Step 2: Upload to storage
  await uploadToStorage(file, directUpload);

  // Step 3: Return the signed_id for attaching to note
  return {
    signed_id: directUpload.blob_signed_id,
    url: `${API_BASE_URL}/rails/active_storage/blobs/redirect/${directUpload.blob_signed_id}/${encodeURIComponent(file.name)}`,
    filename: file.name,
  };
}

/**
 * Get the URL for an uploaded image blob
 */
export function getImageUrl(signedId: string, filename: string): string {
  return `${API_BASE_URL}/rails/active_storage/blobs/redirect/${signedId}/${encodeURIComponent(filename)}`;
}
