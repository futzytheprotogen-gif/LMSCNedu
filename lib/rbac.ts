import { NextRequest, NextResponse } from "next/server";
import {
  NAMA_COOKIE_SESI,
  verifikasiToken,
  ROLE_ADMIN_TIER,
  type PayloadSesi,
  type RoleAplikasi,
} from "./auth";

// ------------------------------------------------------------
// Ringkasan aturan akses (lihat area /areas/project-lms-sekolah.md
// bagian "Aturan lintas role" untuk detail lengkapnya):
//
// - GET kelas/siswa/guru/nilai      -> ADMIN, KEPSEK, KURIKULUM
// - POST/PATCH/DELETE kelas & akun  -> ADMIN saja
// - Kelola laporan lupa password    -> ADMIN saja
// - Post/edit/hapus Pengumuman      -> GURU saja (pembuatnya sendiri)
// - Buat/edit/hapus Materi          -> GURU saja (pembuatnya sendiri)
// - Buat/edit/hapus Asesmen & Soal  -> GURU saja (pembuatnya sendiri)
// - Reset/hapus Nilai               -> GURU pembuat asesmen saja
// - Buat/edit/hapus/kirim Tugas     -> GURU saja (pembuatnya sendiri)
// - Submit jawaban Asesmen/Tugas    -> SISWA saja
// - Lihat jawaban & generate nilai  -> ADMIN, KEPSEK, KURIKULUM, GURU (miliknya)
// ------------------------------------------------------------

export class UnauthorizedError extends Error {
  constructor(pesan = "Belum login / sesi tidak valid") {
    super(pesan);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(pesan = "Tidak punya akses ke resource ini") {
    super(pesan);
    this.name = "ForbiddenError";
  }
}

// ------------------------------------------------------------
// Ambil & validasi sesi dari cookie
// ------------------------------------------------------------

export async function ambilSesi(
  request: NextRequest
): Promise<PayloadSesi | null> {
  const token = request.cookies.get(NAMA_COOKIE_SESI)?.value;
  if (!token) return null;
  return verifikasiToken(token);
}

// Dipakai di awal tiap route handler yang butuh login (hampir semua,
// kecuali /api/auth dan /api/lupa-password).
export async function wajibLogin(request: NextRequest): Promise<PayloadSesi> {
  const sesi = await ambilSesi(request);
  if (!sesi) throw new UnauthorizedError();
  return sesi;
}

// Dipakai kalau endpoint cuma boleh diakses role tertentu, misal
// wajibRole(request, ["ADMIN"]) atau wajibRole(request, ROLE_ADMIN_TIER)
export async function wajibRole(
  request: NextRequest,
  roleDiizinkan: RoleAplikasi[]
): Promise<PayloadSesi> {
  const sesi = await wajibLogin(request);
  if (!roleDiizinkan.includes(sesi.role)) {
    throw new ForbiddenError(
      `Role ${sesi.role} tidak diizinkan mengakses endpoint ini`
    );
  }
  return sesi;
}

// ------------------------------------------------------------
// Shortcut per role / kelompok role
// ------------------------------------------------------------

export const wajibAdminSaja = (request: NextRequest) =>
  wajibRole(request, ["ADMIN"]);

// GET kelas/siswa/guru/nilai — boleh 3 role "Admin Tier"
export const wajibAdminTier = (request: NextRequest) =>
  wajibRole(request, ROLE_ADMIN_TIER);

export const wajibGuru = (request: NextRequest) =>
  wajibRole(request, ["GURU"]);

export const wajibSiswa = (request: NextRequest) =>
  wajibRole(request, ["SISWA"]);

// ------------------------------------------------------------
// Cek kepemilikan resource (bukan cuma role, tapi "punya dia sendiri?")
// Data pembandingnya (mis. asesmen.guruId) diambil route handler dari
// database SEBELUM manggil fungsi ini — rbac.ts sendiri tidak query db.
// ------------------------------------------------------------

export function wajibPemilik(
  sesi: PayloadSesi,
  pemilikId: string,
  pesan = "Kamu bukan pemilik resource ini"
): void {
  if (sesi.userId !== pemilikId) {
    throw new ForbiddenError(pesan);
  }
}

// Guru boleh edit/hapus asesmen/materi/pengumuman/tugas HANYA jika dia
// pembuatnya. Dipakai setelah wajibGuru(request).
export function wajibGuruPemilik(sesi: PayloadSesi, guruIdPemilik: string) {
  wajibPemilik(sesi, guruIdPemilik, "Kamu bukan guru pembuat resource ini");
}

// ------------------------------------------------------------
// Konversi error di atas jadi NextResponse — dipakai di catch block
// tiap route handler:
//
//   try {
//     const sesi = await wajibAdminSaja(request);
//     ...
//   } catch (error) {
//     return tanganiErrorRbac(error);
//   }
// ------------------------------------------------------------

export function tanganiErrorRbac(error: unknown): NextResponse | null {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ pesan: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ pesan: error.message }, { status: 403 });
  }
  return null; // bukan error rbac -> biar route handler yang nangani sendiri
}