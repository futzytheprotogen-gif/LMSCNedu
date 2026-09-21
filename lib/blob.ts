import { put, del } from "@vercel/blob";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// ------------------------------------------------------------
// Dipakai buat semua fitur yang butuh upload file: lampiran Tugas
// (PDF), Materi (PDF), dan foto profil selfie. Butuh
// BLOB_READ_WRITE_TOKEN di .env (didapat dari dashboard Vercel ->
// Storage -> Blob, setelah bikin Blob store buat project ini).
//
// Kenapa nama file dikasih timestamp + random di depan: biar gak ada
// tabrakan nama kalau dua orang upload file dengan nama yang sama
// persis di waktu yang hampir bersamaan.
// ------------------------------------------------------------

const UKURAN_MAKSIMAL_BYTES = 10 * 1024 * 1024; // 10 MB

export class FileTerlaluBesarError extends Error {
  constructor() {
    super(`Ukuran file melebihi batas maksimal ${UKURAN_MAKSIMAL_BYTES / 1024 / 1024}MB`);
    this.name = "FileTerlaluBesarError";
  }
}

function buatNamaFileUnik(namaAsli: string): string {
  const acak = Math.random().toString(36).slice(2, 8);
  const namaAman = namaAsli.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `${Date.now()}-${acak}-${namaAman}`;
}

interface OpsiUnggah {
  // Sub-folder logis di dalam Blob store, biar rapi kelompoknya.
  // Contoh: "lampiran-tugas", "materi", "foto-profil"
  folder: string;
}

export async function unggahFile(file: File, opsi: OpsiUnggah): Promise<string> {
  if (file.size > UKURAN_MAKSIMAL_BYTES) {
    throw new FileTerlaluBesarError();
  }

  const namaFile = `${opsi.folder}/${buatNamaFileUnik(file.name)}`;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const lokasiFile = path.join(process.cwd(), "public", "uploads", namaFile);
    await mkdir(path.dirname(lokasiFile), { recursive: true });
    await writeFile(lokasiFile, Buffer.from(await file.arrayBuffer()));
    return `/uploads/${namaFile}`;
  }

  const hasil = await put(namaFile, file, {
    access: "public",
    addRandomSuffix: false, // kita udah bikin nama unik sendiri di atas
  });

  return hasil.url;
}

export async function hapusFile(url: string): Promise<void> {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN && url.startsWith("/uploads/")) {
      const namaFile = url.slice("/uploads/".length);
      const lokasiFile = path.join(process.cwd(), "public", "uploads", namaFile);
      await unlink(lokasiFile);
      return;
    }

    await del(url);
  } catch (error) {
    // File mungkin udah kehapus duluan atau URL-nya invalid — jangan
    // sampai bikin request utama (misal hapus Tugas) gagal cuma
    // gara-gara ini, cukup dicatat di log server
    console.error("Gagal menghapus file dari Blob:", error);
  }
}