import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import bcrypt from "bcryptjs";

// ------------------------------------------------------------
// PENTING: file ini akan diimpor oleh middleware.ts, yang jalan di
// Edge Runtime (bukan Node.js biasa). Edge Runtime TIDAK BISA
// menjalankan Prisma Client (lib/db.ts) atau library berbasis
// Node native lainnya.
//
// Karena itu lib/auth.ts SENGAJA hanya berisi hal-hal yang edge-safe:
// - "jose" untuk sign/verify JWT -> memang didesain buat Edge Runtime
// - "bcryptjs" untuk hash/compare password -> pure JavaScript, aman
//
// Query ke database (cari akun berdasarkan email/NIK/NIS, dsb) TIDAK
// boleh ditaruh di sini. Itu dilakukan langsung di
// app/api/auth/route.ts (jalan di Node.js runtime), yang boleh
// import lib/db.ts. middleware.ts sendiri cukup import
// verifikasiToken() dari file ini untuk baca cookie sesi.
// ------------------------------------------------------------

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET belum diatur di .env — wajib diisi sebelum auth bisa jalan."
  );
}

const KUNCI_RAHASIA = new TextEncoder().encode(JWT_SECRET);
const UMUR_TOKEN = "8h";

export const NAMA_COOKIE_SESI = "cnedu_session";

export type RoleAplikasi = "ADMIN" | "KEPSEK" | "KURIKULUM" | "GURU" | "SISWA";

// Role yang setara "Admin Tier" — dipakai rbac.ts nanti untuk endpoint
// GET yang boleh diakses ketiganya (kelas, siswa, guru, nilai).
export const ROLE_ADMIN_TIER: RoleAplikasi[] = ["ADMIN", "KEPSEK", "KURIKULUM"];

export interface PayloadSesi extends JWTPayload {
  userId: string;
  role: RoleAplikasi;
  nama: string;
  // Kalau true, semua route selain halaman ganti-password-awal harus
  // ditolak dulu (dipaksa redirect) — cuma relevan buat GURU & SISWA.
  passwordSementara?: boolean;
}

// ------------------------------------------------------------
// JWT (jose) — edge-safe
// ------------------------------------------------------------

export async function buatToken(payload: PayloadSesi): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(UMUR_TOKEN)
    .sign(KUNCI_RAHASIA);
}

export async function verifikasiToken(
  token: string
): Promise<PayloadSesi | null> {
  try {
    const { payload } = await jwtVerify(token, KUNCI_RAHASIA);
    return payload as PayloadSesi;
  } catch {
    // Token tidak valid / kadaluarsa / secret tidak cocok
    return null;
  }
}

// ------------------------------------------------------------
// Password (bcryptjs) — edge-safe
// ------------------------------------------------------------

const SALT_ROUNDS = 10;

export async function hashPassword(passwordAsli: string): Promise<string> {
  return bcrypt.hash(passwordAsli, SALT_ROUNDS);
}

export async function verifikasiPassword(
  passwordInput: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(passwordInput, passwordHash);
}

// ------------------------------------------------------------
// Helper kecil lain
// ------------------------------------------------------------

// Dipakai setelah login sukses (atau di middleware) untuk tentukan
// halaman dashboard tujuan tiap role.
export function halamanDashboard(role: RoleAplikasi): string {
  switch (role) {
    case "ADMIN":
      return "/admin/kelas";
    case "KEPSEK":
      return "/kepsek/kelas";
    case "KURIKULUM":
      return "/kurikulum/kelas";
    case "GURU":
      return "/guru/kelas";
    case "SISWA":
      return "/siswa/kelas";
  }
}

export function isAdminTier(role: RoleAplikasi): boolean {
  return ROLE_ADMIN_TIER.includes(role);
}