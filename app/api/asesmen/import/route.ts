import mammoth from "mammoth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibGuru, tanganiErrorRbac } from "@/lib/rbac";

export const runtime = "nodejs";

type TipeSoal = "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";

interface SoalTerurai {
  tipe?: TipeSoal;
  pertanyaan: string;
  opsi: { label: string; teks: string }[];
  kunci: string[];
}

function parseSoal(teks: string): { soal: SoalTerurai[]; error: string | null } {
  const soal: SoalTerurai[] = [];
  let aktif: SoalTerurai | null = null;
  const mulaiSoal = /^(?:soal\s*)?\d+\s*[.):\-]\s*(.+)$/i;
  const mulaiOpsi = /^([A-H])\s*[.):]\s*(.+)$/i;

  const simpanAktif = () => {
    if (aktif) soal.push(aktif);
  };

  for (const barisMentah of teks.split(/\r?\n/)) {
    const baris = barisMentah.trim();
    if (!baris) continue;

    const cocokSoal = baris.match(mulaiSoal);
    if (cocokSoal) {
      simpanAktif();
      aktif = { pertanyaan: cocokSoal[1].trim(), opsi: [], kunci: [] };
      continue;
    }
    if (!aktif) continue;

    const cocokTipe = baris.match(/^tipe\s*:\s*(.+)$/i);
    if (cocokTipe) {
      const tipe = cocokTipe[1].trim().toUpperCase().replace(/[ -]+/g, "_");
      if (["PILIHAN_GANDA", "PG"].includes(tipe)) aktif.tipe = "PILIHAN_GANDA";
      else if (tipe === "CHECKBOX") aktif.tipe = "CHECKBOX";
      else if (tipe === "ESSAY") aktif.tipe = "ESSAY";
      else return { soal: [], error: `Tipe soal tidak dikenal: ${cocokTipe[1]}` };
      continue;
    }

    const cocokKunci = baris.match(/^kunci(?:\s+jawaban)?\s*:\s*(.+)$/i);
    if (cocokKunci) {
      aktif.kunci = cocokKunci[1]
        .toUpperCase()
        .split(/[,;\s]+/)
        .filter(Boolean);
      continue;
    }

    const cocokOpsi = baris.match(mulaiOpsi);
    if (cocokOpsi) {
      aktif.opsi.push({ label: cocokOpsi[1].toUpperCase(), teks: cocokOpsi[2].trim() });
      continue;
    }

    const opsiTerakhir = aktif.opsi.at(-1);
    if (opsiTerakhir) opsiTerakhir.teks = `${opsiTerakhir.teks} ${baris}`;
    else aktif.pertanyaan = `${aktif.pertanyaan} ${baris}`;
  }
  simpanAktif();

  if (soal.length === 0) {
    return { soal: [], error: "Tidak ada soal bernomor yang ditemukan di dokumen." };
  }

  for (const [index, item] of soal.entries()) {
    item.tipe ??= item.opsi.length ? "PILIHAN_GANDA" : "ESSAY";
    const nomor = index + 1;
    if (!item.pertanyaan.trim()) return { soal: [], error: `Pertanyaan nomor ${nomor} kosong.` };
    if (item.tipe === "ESSAY") {
      if (item.opsi.length || item.kunci.length) {
        return { soal: [], error: `Soal essay nomor ${nomor} tidak boleh memiliki opsi atau kunci jawaban.` };
      }
      continue;
    }
    if (item.opsi.length < 2) {
      return { soal: [], error: `Soal nomor ${nomor} harus memiliki minimal 2 opsi.` };
    }
    if (new Set(item.opsi.map((opsi) => opsi.label)).size !== item.opsi.length) {
      return { soal: [], error: `Label opsi soal nomor ${nomor} tidak boleh duplikat.` };
    }
    if (!item.kunci.length || item.kunci.some((label) => !item.opsi.some((opsi) => opsi.label === label))) {
      return { soal: [], error: `Kunci jawaban soal nomor ${nomor} harus cocok dengan label opsi.` };
    }
    if (item.tipe === "PILIHAN_GANDA" && item.kunci.length !== 1) {
      return { soal: [], error: `Soal pilihan ganda nomor ${nomor} harus memiliki tepat satu kunci.` };
    }
  }

  return { soal, error: null };
}

export async function POST(request: NextRequest) {
  try {
    const sesi = await wajibGuru(request);
    const formData = await request.formData();
    const file = formData.get("file");
    const judul = formData.get("judul");
    const tipe = formData.get("tipe");
    const mapelId = formData.get("mapelId");
    const durasiRaw = formData.get("durasiMenit");
    const kelasIdsRaw = formData.get("kelasIds");

    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".docx")) {
      return NextResponse.json({ pesan: "Pilih file Word berformat .docx." }, { status: 400 });
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ pesan: "Ukuran file harus lebih dari 0 dan maksimal 5 MB." }, { status: 400 });
    }
    if (typeof judul !== "string" || !judul.trim() || (tipe !== "KUIS" && tipe !== "UJIAN") || typeof mapelId !== "string" || !mapelId) {
      return NextResponse.json({ pesan: "Judul, tipe asesmen, dan mata pelajaran wajib diisi." }, { status: 400 });
    }

    const hasilEkstraksi = await mammoth.extractRawText({
      buffer: Buffer.from(await file.arrayBuffer()),
    });
    if (hasilEkstraksi.value.length > 1_000_000) {
      return NextResponse.json({ pesan: "Isi dokumen terlalu panjang untuk diimpor." }, { status: 400 });
    }

    const hasilParse = parseSoal(hasilEkstraksi.value);
    if (hasilParse.error) {
      return NextResponse.json({ pesan: hasilParse.error }, { status: 400 });
    }

    const durasiMenit = durasiRaw ? Number(durasiRaw) : null;
    if (durasiMenit !== null && (!Number.isInteger(durasiMenit) || durasiMenit < 1)) {
      return NextResponse.json({ pesan: "Durasi harus berupa bilangan bulat minimal 1 menit." }, { status: 400 });
    }
    const kelasIds = typeof kelasIdsRaw === "string" && kelasIdsRaw ? [kelasIdsRaw] : [];

    const asesmen = await db.asesmen.create({
      data: {
        judul: judul.trim(),
        tipe,
        mapelId,
        guruId: sesi.userId,
        durasiMenit,
        status: "PROSES",
        kelasTujuan: kelasIds.length ? { create: kelasIds.map((kelasId) => ({ kelasId })) } : undefined,
        soal: {
          create: hasilParse.soal.map((item, urutan) => ({
            tipe: item.tipe!,
            pertanyaan: item.pertanyaan.trim(),
            urutan,
            opsi: item.tipe === "ESSAY" ? undefined : {
              create: item.opsi.map((opsi) => ({
                teks: opsi.teks,
                benar: item.kunci.includes(opsi.label),
              })),
            },
          })),
        },
      },
    });

    return NextResponse.json({ data: asesmen, jumlahSoal: hasilParse.soal.length }, { status: 201 });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "File Word tidak dapat diproses atau terjadi kesalahan di server." }, { status: 500 })
    );
  }
}