import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { wajibAdminSaja, tanganiErrorRbac } from "@/lib/rbac";
import { responseFileExcel } from "@/lib/excel";

export const runtime = "nodejs";

const HEADER = [
  "Tipe Akun",
  "Email",
  "NIS/NIK",
  "Nama",
  "Tanggal Lahir",
  "Jenis Kelamin",
  "Rombel",
  "Mata Pelajaran",
];

interface HasilBaris {
  baris: number;
  pesan: string;
}

function bacaSel(row: ExcelJS.Row, kolom: number): string | number | Date {
  const nilai = row.getCell(kolom).value;
  if (nilai instanceof Date || typeof nilai === "number") return nilai;
  if (typeof nilai === "object" && nilai !== null && "text" in nilai) {
    return String(nilai.text ?? "").trim();
  }
  return String(nilai ?? "").trim();
}

function tanggalValid(nilai: string | number | Date): Date | null {
  if (nilai instanceof Date) {
    return Number.isNaN(nilai.getTime()) ? null : nilai;
  }
  if (typeof nilai === "number") {
    const tanggal = new Date(Date.UTC(1899, 11, 30) + nilai * 86_400_000);
    return Number.isNaN(tanggal.getTime()) ? null : tanggal;
  }

  const teks = nilai.trim();
  const iso = teks.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const lokal = teks.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  const bagian = iso
    ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    : lokal
      ? [Number(lokal[3]), Number(lokal[2]), Number(lokal[1])]
      : null;
  if (!bagian) return null;

  const [tahun, bulan, hari] = bagian;
  const tanggal = new Date(Date.UTC(tahun, bulan - 1, hari));
  if (tanggal.getUTCFullYear() !== tahun || tanggal.getUTCMonth() !== bulan - 1 || tanggal.getUTCDate() !== hari) {
    return null;
  }
  return tanggal;
}

function normalisasiHeader(value: string) {
  return value.trim().toLocaleLowerCase("id-ID");
}

export async function GET(request: NextRequest) {
  try {
    await wajibAdminSaja(request);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Akun");
    sheet.columns = HEADER.map((header) => ({ header, width: header.length + 8 }));
    sheet.getRow(1).font = { bold: true };
    sheet.getColumn(3).numFmt = "@";
    const petunjuk = workbook.addWorksheet("Petunjuk");
    petunjuk.addRows([
      ["Kolom", "Ketentuan"],
      ["Tipe Akun", "Wajib: SISWA atau GURU."],
      ["Email", "Wajib dan harus unik."],
      ["NIS/NIK", "Wajib angka minimal 4 digit. Format sebagai teks agar nol di depan tetap ada."],
      ["Nama", "Wajib."],
      ["Tanggal Lahir", "Wajib, gunakan format YYYY-MM-DD atau tanggal Excel."],
      ["Jenis Kelamin", "Opsional: L atau P."],
      ["Rombel", "Wajib untuk siswa, gunakan nama rombel yang tersedia di sistem."],
      ["Mata Pelajaran", "Wajib untuk guru, pisahkan beberapa nama mapel dengan koma."],
      ["Password awal", "Otomatis menggunakan NIS/NIK."],
      ["Batas impor", "Maksimal 200 baris data per file. Baris tidak valid dilewati dan dilaporkan."],
      ["Contoh siswa", "SISWA | siswa@sekolah.sch.id | 001234 | Nama Siswa | 2010-01-01 | L | 12 PPLG 1 | (kosong)"],
      ["Contoh guru", "GURU | guru@sekolah.sch.id | 19870001 | Nama Guru | 1987-01-01 | P | (kosong) | Matematika, Bahasa Indonesia"],
    ]);
    petunjuk.columns = [{ width: 22 }, { width: 92 }];
    petunjuk.getRow(1).font = { bold: true };
    return responseFileExcel(Buffer.from(await workbook.xlsx.writeBuffer()), "template-import-akun");
  } catch (error) {
    return tanganiErrorRbac(error) ?? NextResponse.json({ pesan: "Terjadi kesalahan di server." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await wajibAdminSaja(request);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json({ pesan: "Pilih file Excel berformat .xlsx." }, { status: 400 });
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ pesan: "Ukuran file harus lebih dari 0 dan maksimal 5 MB." }, { status: 400 });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.actualRowCount < 2) {
      return NextResponse.json({ pesan: "File Excel belum memiliki baris data." }, { status: 400 });
    }
    if (sheet.actualRowCount > 201) {
      return NextResponse.json({ pesan: "Maksimal 200 akun dapat diimpor dalam satu file." }, { status: 400 });
    }

    const kolom = new Map<string, number>();
    sheet.getRow(1).eachCell((cell, index) => kolom.set(normalisasiHeader(cell.text), index));
    const indeks = HEADER.map((header) => kolom.get(normalisasiHeader(header)));
    if (indeks.some((index) => index === undefined)) {
      return NextResponse.json({ pesan: `Header wajib: ${HEADER.join(", ")}.` }, { status: 400 });
    }
    const [kolomTipe, kolomEmail, kolomNomor, kolomNama, kolomTanggal, kolomGender, kolomRombel, kolomMapel] = indeks as number[];
    const [daftarRombel, daftarMapel] = await Promise.all([
      db.rombelAkademik.findMany({ select: { id: true, label: true } }),
      db.mataPelajaran.findMany({ select: { id: true, nama: true } }),
    ]);
    const rombelByNama = new Map(daftarRombel.map((item) => [item.label.trim().toLocaleLowerCase("id-ID"), item]));
    const mapelByNama = new Map(daftarMapel.map((item) => [item.nama.trim().toLocaleLowerCase("id-ID"), item]));
    const emailTerpakai = new Set<string>();
    const nomorTerpakai = new Set<string>();
    const gagal: HasilBaris[] = [];
    let berhasil = 0;

    for (let nomorBaris = 2; nomorBaris <= sheet.rowCount; nomorBaris += 1) {
      const row = sheet.getRow(nomorBaris);
      const adaData = [kolomTipe, kolomEmail, kolomNomor, kolomNama, kolomTanggal, kolomGender, kolomRombel, kolomMapel]
        .some((index) => String(bacaSel(row, index)).trim() !== "");
      if (!adaData) continue;

      try {
        const tipe = String(bacaSel(row, kolomTipe)).toUpperCase();
        const email = String(bacaSel(row, kolomEmail)).toLowerCase();
        const nomorIdentitas = String(bacaSel(row, kolomNomor)).trim();
        const nama = String(bacaSel(row, kolomNama)).trim();
        const tanggalLahir = tanggalValid(bacaSel(row, kolomTanggal));
        const gender = String(bacaSel(row, kolomGender)).toUpperCase();
        const rombelNama = String(bacaSel(row, kolomRombel)).trim();
        const namaMapel = String(bacaSel(row, kolomMapel)).split(",").map((item) => item.trim()).filter(Boolean);

        if (tipe !== "SISWA" && tipe !== "GURU") throw new Error("Tipe akun harus SISWA atau GURU.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email tidak valid.");
        if (!/^\d{4,}$/.test(nomorIdentitas)) throw new Error("NIS/NIK harus berupa angka minimal 4 digit.");
        if (!nama) throw new Error("Nama wajib diisi.");
        if (!tanggalLahir) throw new Error("Tanggal lahir tidak valid.");
        if (gender && gender !== "L" && gender !== "P") throw new Error("Jenis kelamin hanya boleh L atau P.");
        if (emailTerpakai.has(email) || nomorTerpakai.has(`${tipe}:${nomorIdentitas}`)) throw new Error("Email atau NIS/NIK duplikat di dalam file.");

        const identitas = BigInt(nomorIdentitas);
        const password = await hashPassword(identitas.toString());
        const dataUmum = {
          email,
          nama,
          tanggalLahir,
          jenisKelamin: gender ? gender as "L" | "P" : null,
          password,
          passwordSementara: true,
        };

        if (tipe === "SISWA") {
          const rombel = rombelByNama.get(rombelNama.toLocaleLowerCase("id-ID"));
          if (!rombel) throw new Error(`Rombel “${rombelNama}” tidak ditemukan.`);
          const sudahAda = await db.siswa.findFirst({
            where: { OR: [{ email }, { nis: identitas }] },
            select: { id: true },
          });
          if (sudahAda) throw new Error("Email atau NIS sudah terdaftar.");
          await db.siswa.create({ data: { ...dataUmum, nis: identitas, rombelId: rombel.id } });
        } else {
          if (namaMapel.length === 0) throw new Error("Guru wajib memiliki minimal satu mata pelajaran.");
          const mapel = namaMapel.map((label) => mapelByNama.get(label.toLocaleLowerCase("id-ID")));
          if (mapel.some((item) => !item)) throw new Error("Satu atau lebih mata pelajaran tidak ditemukan.");
          const mapelUnik = Array.from(new Map(mapel.map((item) => [item!.id, item!])).values());
          const sudahAda = await db.guru.findFirst({
            where: { OR: [{ email }, { nik: identitas }] },
            select: { id: true },
          });
          if (sudahAda) throw new Error("Email atau NIK sudah terdaftar.");
          await db.guru.create({
            data: {
              ...dataUmum,
              nik: identitas,
              mapelDiampu: { create: mapelUnik.map((item) => ({ mapelId: item.id })) },
            },
          });
        }

        emailTerpakai.add(email);
        nomorTerpakai.add(`${tipe}:${nomorIdentitas}`);
        berhasil += 1;
      } catch (error) {
        gagal.push({
          baris: nomorBaris,
          pesan: error instanceof Error ? error.message : "Data baris tidak dapat disimpan.",
        });
      }
    }

    return NextResponse.json({
      berhasil,
      gagal,
      pesan: `${berhasil} akun berhasil dibuat; ${gagal.length} baris perlu diperbaiki. Password awal menggunakan NIS/NIK.`,
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "File Excel tidak dapat diproses atau terjadi kesalahan di server." }, { status: 500 })
    );
  }
}