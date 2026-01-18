import { apiClient } from "./client";
import SparkMD5 from "spark-md5";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Allowed file types (must match API's Note::ALLOWED_FILE_TYPES)
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];
const ALLOWED_TEXT_TYPES = ["text/plain", "text/csv", "application/json"];
const ALLOWED_ARCHIVE_TYPES = ["application/zip"];

const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
  ...ALLOWED_TEXT_TYPES,
  ...ALLOWED_ARCHIVE_TYPES,
];

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB

// Types
export interface DirectUploadResponse {
  direct_upload: {
    url: string;
    headers: Record<string, string>;
  };
  blob_signed_id: string;
  blob_id: number;
}

export interface UploadedFile {
  signed_id: string;
  url: string;
  filename: string;
  content_type: string;
}

/** @deprecated Use UploadedFile instead */
export type UploadedImage = UploadedFile;

/**
 * Check if a content type is an image type
 */
export function isImageType(contentType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(contentType);
}

/**
 * Generate Markdown syntax for an uploaded file
 * - Images: ![filename](url)
 * - PDF: [📄 filename](url)
 * - Other files: [📎 filename](url)
 */
export function generateFileMarkdown(file: UploadedFile): string {
  if (isImageType(file.content_type)) {
    return `![${file.filename}](${file.url})`;
  }

  const icon = file.content_type === "application/pdf" ? "📄" : "📎";
  return `[${icon} ${file.filename}](${file.url})`;
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
 * Upload a file and return the blob signed_id for attaching to a note
 *
 * Flow:
 * 1. Request direct upload URL from API (with file metadata)
 * 2. Upload file directly to storage using presigned URL
 * 3. Return blob signed_id for attaching to note
 */
export async function uploadFile(file: File): Promise<UploadedFile> {
  // Validate file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is 30MB.`);
  }

  // Step 1: Get direct upload URL
  const directUpload = await createDirectUpload(file);

  // Step 2: Upload to storage
  await uploadToStorage(file, directUpload);

  // Step 3: Return the uploaded file info
  return {
    signed_id: directUpload.blob_signed_id,
    url: `${API_BASE_URL}/rails/active_storage/blobs/redirect/${directUpload.blob_signed_id}/${encodeURIComponent(file.name)}`,
    filename: file.name,
    content_type: file.type,
  };
}

/**
 * Upload an image file (legacy alias for uploadFile)
 * @deprecated Use uploadFile instead
 */
export async function uploadImage(file: File): Promise<UploadedFile> {
  return uploadFile(file);
}

/**
 * Get the URL for an uploaded file blob
 */
export function getFileUrl(signedId: string, filename: string): string {
  return `${API_BASE_URL}/rails/active_storage/blobs/redirect/${signedId}/${encodeURIComponent(filename)}`;
}

/**
 * @deprecated Use getFileUrl instead
 */
export function getImageUrl(signedId: string, filename: string): string {
  return getFileUrl(signedId, filename);
}

/**
 * Get the accept attribute value for file input
 * Returns a comma-separated list of allowed MIME types
 */
export function getAllowedFileTypesAccept(): string {
  return ALLOWED_FILE_TYPES.join(",");
}

/**
 * Detach (delete) a file attachment from a note
 *
 * @param noteId - The note ID
 * @param signedId - The attachment's signed_id
 */
export async function detachFile(
  noteId: string,
  signedId: string
): Promise<void> {
  await apiClient(`/notes/${noteId}/attachments/${signedId}`, {
    method: "DELETE",
  });
}
