import api from "../lib/api";
import { UploadType } from "./upload";

export const uploadToS3 = async (
  fileUri: string,
  uploadType: UploadType
): Promise<string> => {
  try {
    const fileName = fileUri.split("/").pop() || "image.jpg";

    const extension = fileName.split(".").pop()?.toLowerCase();

    const mimeType =
      extension === "png"
        ? "image/png"
        : extension === "jpg" || extension === "jpeg"
        ? "image/jpeg"
        : "image/jpeg";

    // ✅ 1. Get presigned URL
    const { data } = await api.post("/s3/presigned-upload", {
      mimeType,
      originalName: fileName,
      uploadType,
    });

    const { uploadUrl, fileUrl } = data;
    const upload = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open("PUT", uploadUrl);

      xhr.setRequestHeader("Content-Type", mimeType);

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(true);
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error"));

      xhr.send({
        uri: fileUri,
        type: mimeType,
        name: fileName,
      } as any);
    });

    return fileUrl;
  } catch (err) {
    console.log("🚨 S3 Upload Error:", err);
    throw err;
  }
};