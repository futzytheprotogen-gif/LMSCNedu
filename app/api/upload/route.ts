import { NextRequest, NextResponse } from "next/server";
import { wajibLogin, tanganiErrorRbac } from "@/lib/rbac";
import { unggahFile, FileTerlaluBesarError } from "@/lib/blob";

// ------------------------------------------------------------
// POST /api/upload — endpoint generik, dipakai role manapun yang
// udah login (Guru upload lampiran Tugas/Materi, Siswa upload
// jawaban Tugas, siapapun upload foto profil).
//
// Body: multipart/form-data dengan field:
// - "file": File (wajib)
// - "folder": string (wajib) — dari daftar FOLDER_DIIZINKAN di bawah,
//   biar orang gak bisa nulis folder sembarangan di Blob store kita
//
// Response: { url: string }
// ------------------------------------------------------------

const FOLDER_DIIZINKAN = ["lampiran-tugas", "materi", "foto-profil", "jawaban-tugas"];

export async function POST(request: NextRequest) {
  try {
    await wajibLogin(request);

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder");

    if (!(file instanceof File)) {
      return NextResponse.json({ pesan: "File wajib disertakan" }, { status: 400 });
    }
    if (typeof folder !== "string" || !FOLDER_DIIZINKAN.includes(folder)) {
      return NextResponse.json(
        { pesan: `folder wajib salah satu dari: ${FOLDER_DIIZINKAN.join(", ")}` },
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