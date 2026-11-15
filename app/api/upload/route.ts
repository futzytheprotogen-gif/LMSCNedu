import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { wajibLogin, tanganiErrorRbac } from "@/lib/rbac";
import { unggahFile, FileTerlaluBesarError } from "@/lib/blob";
import {
  FOLDER_UPLOAD_DIIZINKAN,
  UKURAN_MAKSIMAL_UPLOAD_BYTES,
} from "@/lib/upload-config";

// ------------------------------------------------------------
// POST /api/upload — melayani client upload Blob dan fallback multipart
// lokal, dipakai role manapun yang sudah login.
//
// Body: multipart/form-data dengan field:
// - "file": File (wajib)
// - "folder": string (wajib) — dari daftar FOLDER_DIIZINKAN di bawah,
//   biar orang gak bisa nulis folder sembarangan di Blob store kita
//
// Response: { url: string }
// ------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    await wajibLogin(request);

    if (request.headers.get("content-type")?.includes("application/json")) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json(
          { pesan: "Penyimpanan file belum dikonfigurasi di server (BLOB_READ_WRITE_TOKEN)." },
          { status: 503 }
        );
      }

      const body: unknown = await request.json();
      if (
        !body ||
        typeof body !== "object" ||
        !("type" in body) ||
        (body.type !== "blob.generate-client-token" &&
          body.type !== "blob.upload-completed")
      ) {
        return NextResponse.json({ pesan: "Permintaan upload tidak valid." }, { status: 400 });
      }

      const result = await handleUpload({
        request,
        body: body as HandleUploadBody,
        onBeforeGenerateToken: async (pathname) => {
          const cocok = /^([^/]+)\/([^/]+)$/.exec(pathname);
          const folder = cocok?.[1];
          const namaFile = cocok?.[2];
          if (
            !folder ||
            !namaFile ||
            namaFile.startsWith(".") ||
            !FOLDER_UPLOAD_DIIZINKAN.some((folderDiizinkan) => folderDiizinkan === folder) ||
            (folder !== "foto-profil" && !namaFile.toLowerCase().endsWith(".pdf"))
          ) {
            throw new Error("Folder atau nama file tidak diizinkan.");
          }

          return {
            allowedContentTypes: folder === "foto-profil" ? ["image/*"] : ["application/pdf"],
            maximumSizeInBytes: UKURAN_MAKSIMAL_UPLOAD_BYTES,
            addRandomSuffix: false,
          };
        },
      });

      return NextResponse.json(result);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder");

    if (!(file instanceof File)) {
      return NextResponse.json({ pesan: "File wajib disertakan" }, { status: 400 });
    }
    if (
      typeof folder !== "string" ||
      !FOLDER_UPLOAD_DIIZINKAN.some((folderDiizinkan) => folderDiizinkan === folder)
    ) {
      return NextResponse.json(
        { pesan: `folder wajib salah satu dari: ${FOLDER_UPLOAD_DIIZINKAN.join(", ")}` },
        { status: 400 }
      );
    }

    const url = await unggahFile(file, { folder });

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    if (error instanceof FileTerlaluBesarError) {
      return NextResponse.json({ pesan: error.message }, { status: 400 });
    }

    const responRbac = tanganiErrorRbac(error);
    if (responRbac) return responRbac;

    // Error yang bukan dari RBAC (misal dari Vercel Blob) dicatat di
    // terminal supaya penyebab aslinya kelihatan.
    console.error("Upload gagal:", error);

    return NextResponse.json(
      {
        pesan:
          process.env.NODE_ENV === "production"
            ? "Terjadi kesalahan di server"
            : `Upload gagal: ${error instanceof Error ? error.message : "kesalahan tidak diketahui"}`,
      },
      { status: 500 }
    );
  }
}