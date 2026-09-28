import api from "../lib/api";
import { UploadType } from "./upload";

type PresignedUploadResponse = {
  uploadUrl: string;
  fileUrl: string;
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

  const xhr = new XMLHttpRequest();

  await new Promise<void>((resolve, reject) => {
    xhr.open("PUT", data.uploadUrl);
    xhr.setRequestHeader("Content-Type", mimeType);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 upload failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("S3 network error"));

    xhr.send({
      uri: fileUri,
      name: originalName,
      type: mimeType,
    } as any);
  });

  return data.fileUrl;
};