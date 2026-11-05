import api from "../lib/api";
import { UploadType } from "./upload";

type PresignedUploadResponse = {
  uploadUrl: string;
  fileUrl: string;
};

const toLocalPath = (uri: string): string => {
  if (!uri.startsWith("file://")) return uri;
  const path = uri.replace("file://", "");
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
};

const getBlobUtil = (): any | null => {
  try {
    // Lazy require so the app does not crash if the native module is not built yet
    const mod = require("react-native-blob-util");
    const util = mod?.default ?? mod;
    return util?.fetch && util?.wrap ? util : null;
  } catch {
    return null;
  }
};

class S3StatusError extends Error {}

// PRIMARY: stream the file from disk (most reliable on Android)
const putWithBlobUtil = async (
  url: string,
  uri: string,
  mimeType: string
) => {
  const BlobUtil = getBlobUtil();
  if (!BlobUtil) throw new Error("BLOB_UTIL_UNAVAILABLE");

  const res = await BlobUtil.fetch(
    "PUT",
    url,
    { "Content-Type": mimeType },
    BlobUtil.wrap(toLocalPath(uri))
  );

  const status = res.info().status;
  console.log("S3 PUT (blob-util) status:", status);

  if (status < 200 || status >= 300) {
    let body = "";
    try {
      body = res.text();
    } catch {}
    console.log("S3 error body:", body);
    throw new S3StatusError(`S3 upload failed: ${status}`);
  }
};

// FALLBACK: fetch + blob
const putWithFetch = async (
  url: string,
  uri: string,
  mimeType: string
) => {
  const blob = await (await fetch(uri)).blob();

  if (!blob || blob.size === 0) {
    throw new Error("Selected image could not be read (empty file).");
  }

  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: blob,
  });

  console.log("S3 PUT (fetch) status:", res.status);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.log("S3 error body:", text);
    throw new S3StatusError(`S3 upload failed: ${res.status}`);
  }
};

export const uploadToS3 = async (
  fileUri: string,
  uploadType: UploadType,
  extra?: Record<string, any>,
  fileName?: string,
  mimeType = "image/jpeg"
): Promise<string> => {
  const originalName =
    fileName || fileUri.split("/").pop()?.split("?")[0] || "image.jpg";

  // Same request body as the web app
  const { data } = await api.post<PresignedUploadResponse>(
    "/s3/presigned-upload",
    {
      mimeType,
      originalName,
      uploadType,
      ...(extra ?? {}),
    }
  );

  if (!data?.uploadUrl || !data?.fileUrl) {
    throw new Error("Missing S3 upload URL or file URL.");
  }

  try {
    await putWithBlobUtil(data.uploadUrl, fileUri, mimeType);
  } catch (error: any) {
    // Real S3 HTTP errors (400/403) should not be retried
    if (error instanceof S3StatusError) throw error;

    console.log("blob-util upload failed, trying fetch:", error?.message);
    await putWithFetch(data.uploadUrl, fileUri, mimeType);
  }

  return data.fileUrl;
};