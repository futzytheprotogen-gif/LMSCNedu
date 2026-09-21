import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

// ------------------------------------------------------------
// Dipakai oleh:
// - Guru: Generate Nilai (per kelas / gabungan semua kelas tujuan asesmen)
// - Admin / Kepsek / Kurikulum: Generate Nilai dari asesmen guru manapun
//
// Format kolom hasil unduhan (sudah disepakati di spesifikasi):
// Nama, NIS, Kelas/Jurusan, Mata Pelajaran, Nilai
// ------------------------------------------------------------

export interface BarisNilai {
  nama: string;
  // NIS di-string-kan di sini (BigInt di Prisma) supaya aman dipakai
  // di Excel & tidak kena masalah presisi angka besar.
  nis: string;
  kelasJurusan: string;
  mapel: string;
  nilai: number | null; // null = belum dinilai (misal masih ada soal Essay)
}

const KOLOM_NILAI: Partial<ExcelJS.Column>[] = [
  { header: "Nama", key: "nama", width: 28 },
  { header: "NIS", key: "nis", width: 15 },
  { header: "Kelas/Jurusan", key: "kelasJurusan", width: 18 },
  { header: "Mata Pelajaran", key: "mapel", width: 30 },
  { header: "Nilai", key: "nilai", width: 10 },
];

function isiSheetNilai(sheet: ExcelJS.Worksheet, baris: BarisNilai[]) {
  sheet.columns = KOLOM_NILAI;
  sheet.getRow(1).font = { bold: true };
  sheet.addRows(
    baris.map((b) => ({
      nama: b.nama,
      nis: b.nis,
      kelasJurusan: b.kelasJurusan,
      mapel: b.mapel,
      nilai: b.nilai ?? "",
    }))
  );
}

// Nama sheet Excel maksimal 31 karakter & tidak boleh ada karakter
// \ / ? * [ ] : — kelas seperti "12 PPLG 2" aman, tapi tetap disanitasi
// jaga-jaga kalau judul kelas custom bikin sheet name jadi invalid.
function sanitasiNamaSheet(nama: string): string {
  return nama.replace(/[\\/?*[\]:]/g, "-").substring(0, 31);
}

// ------------------------------------------------------------
// 1. Generate nilai untuk SATU kelas (tombol "Generate" di samping
//    tabel nilai rata-rata per kelas)
// ------------------------------------------------------------

export async function buatWorkbookNilaiSatuKelas(
  namaKelas: string,
  baris: BarisNilai[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sanitasiNamaSheet(namaKelas));
  isiSheetNilai(sheet, baris);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// ------------------------------------------------------------
// 2. Generate nilai untuk SEMUA kelas tujuan sekaligus (tombol
//    "Generate Semua Nilai" di halaman jawaban asesmen) — tiap kelas
//    jadi sheet terpisah dalam satu file
// ------------------------------------------------------------

export interface KelompokNilaiPerKelas {
  namaKelas: string;
  baris: BarisNilai[];
}

export async function buatWorkbookNilaiSemuaKelas(
  kelompok: KelompokNilaiPerKelas[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const namaSheetTerpakai = new Set<string>();

  for (const { namaKelas, baris } of kelompok) {
    // Hindari nama sheet duplikat (mis. dua kelas kebetulan sama-sama
    // "12 PPLG 2" gara-gara sanitasi memotong nama jadi identik)
    let namaSheet = sanitasiNamaSheet(namaKelas);
    let penomor = 2;
    while (namaSheetTerpakai.has(namaSheet)) {
      namaSheet = `${sanitasiNamaSheet(namaKelas).substring(0, 28)} (${penomor})`;
      penomor += 1;
    }
    namaSheetTerpakai.add(namaSheet);

    const sheet = workbook.addWorksheet(namaSheet);
    isiSheetNilai(sheet, baris);
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// ------------------------------------------------------------
// 3. Bungkus Buffer jadi NextResponse siap didownload browser
// ------------------------------------------------------------

export function responseFileExcel(
  buffer: Buffer,
  namaFile: string
): NextResponse {
  const namaFileAman = namaFile.endsWith(".xlsx")
    ? namaFile
    : `${namaFile}.xlsx`;

  // Buffer Node bertipe Buffer<ArrayBufferLike> (bisa ArrayBuffer atau
  // SharedArrayBuffer), sedangkan BodyInit milik Response/NextResponse
  // cuma mau terima Uint8Array<ArrayBuffer>. Bungkus ulang jadi
  // Uint8Array baru supaya TypeScript yakin tipenya cocok.
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${namaFileAman}"`,
    },
  });
}