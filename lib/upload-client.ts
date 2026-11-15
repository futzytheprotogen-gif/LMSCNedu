"use client";

import { upload } from "@vercel/blob/client";
import {
  UKURAN_MAKSIMAL_UPLOAD_BYTES,
  type FolderUpload,
} from "./upload-config";

export async function unggahFileDariBrowser(
  file: File,
  folder: FolderUpload
): Promise<string> {
  if (file.size > UKURAN_MAKSIMAL_UPLOAD_BYTES) {
    throw new Error("Ukuran file melebihi batas maksimal 10MB.");
  }

  const namaAman = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const pathname = `${folder}/${Date.now()}-${crypto.randomUUID()}-${namaAman}`;

  if (process.env.NODE_ENV === "production") {
    const blob = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
      multipart: file.size > 5 * 1024 * 1024,
    });
    return blob.url;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.pesan ?? "Gagal mengunggah file.");
  }
  if (typeof data?.url !== "string") {
    throw new Error("Server tidak mengembalikan alamat file.");
  }

  return data.url;
}
