import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  buatToken,
  verifikasiPassword,
  halamanDashboard,
  NAMA_COOKIE_SESI,
  type PayloadSesi,
  type RoleAplikasi,
} from "@/lib/auth";

// ------------------------------------------------------------
// POST /api/auth — login
// Body: { tipeAkun: "ADMIN" | "GURU" | "SISWA", identifier: string, password: string }
//
// - tipeAkun "ADMIN" mewakili portal login Admin/Kepsek/Kurikulum
//   (login pakai email); role sebenarnya (ADMIN/KEPSEK/KURIKULUM)
//   ditentukan dari kolom `role` di tabel Admin setelah ditemukan.
// - tipeAkun "GURU" login pakai NIK, "SISWA" login pakai NIS.
//
// Pesan error SENGAJA digeneralisir ("identifier/password salah")
// tanpa bilang bagian mana yang salah — pola yang sama seperti
// anti-enumeration di alur lupa password.
// ------------------------------------------------------------

const PESAN_GAGAL_LOGIN = "Email/NIK/NIS atau password salah";
const UMUR_COOKIE_DETIK = 8 * 60 * 60; // samakan dengan UMUR_TOKEN di lib/auth.ts (8h)

interface BodyLogin {
  tipeAkun?: "ADMIN" | "GURU" | "SISWA";
  identifier?: string;
  password?: string;
}

export async function POST(request: NextRequest) {
  let body: BodyLogin;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ pesan: "Body request tidak valid" }, { status: 400 });
  }

  const { tipeAkun, identifier, password } = body;

  if (!tipeAkun || !identifier || !password) {
    return NextResponse.json(
      { pesan: "tipeAkun, identifier, dan password wajib diisi" },
      { status: 400 }
    );
  }

  let payload: PayloadSesi | null = null;

  try {
    if (tipeAkun === "ADMIN") {
      const akun = await db.admin.findUnique({ where: { email: identifier } });
      if (!akun) return NextResponse.json({ pesan: PESAN_GAGAL_LOGIN }, { status: 401 });

      const passwordCocok = await verifikasiPassword(password, akun.password);
      if (!passwordCocok) {
        return NextResponse.json({ pesan: PESAN_GAGAL_LOGIN }, { status: 401 });
      }

      payload = {
        userId: akun.id,
        role: akun.role as RoleAplikasi, // ADMIN | KEPSEK | KURIKULUM
        nama: akun.nama,
        // Admin/Kepsek/Kurikulum tidak pernah punya passwordSementara
        passwordSementara: false,
      };
    } else if (tipeAkun === "GURU") {
      const nik = konversiKeBigInt(identifier);
      if (nik === null) {
        return NextResponse.json({ pesan: PESAN_GAGAL_LOGIN }, { status: 401 });
      }

      const akun = await db.guru.findUnique({ where: { nik } });
      if (!akun) return NextResponse.json({ pesan: PESAN_GAGAL_LOGIN }, { status: 401 });

      const passwordCocok = await verifikasiPassword(password, akun.password);
      if (!passwordCocok) {
        return NextResponse.json({ pesan: PESAN_GAGAL_LOGIN }, { status: 401 });
      }

      payload = {
        userId: akun.id,
        role: "GURU",
        nama: akun.nama,
        passwordSementara: akun.passwordSementara,
      };
    } else if (tipeAkun === "SISWA") {
      const nis = konversiKeBigInt(identifier);
      if (nis === null) {
        return NextResponse.json({ pesan: PESAN_GAGAL_LOGIN }, { status: 401 });
      }

      const akun = await db.siswa.findUnique({ where: { nis } });
      if (!akun) return NextResponse.json({ pesan: PESAN_GAGAL_LOGIN }, { status: 401 });

      const passwordCocok = await verifikasiPassword(password, akun.password);
      if (!passwordCocok) {
        return NextResponse.json({ pesan: PESAN_GAGAL_LOGIN }, { status: 401 });
      }

      payload = {
        userId: akun.id,
        role: "SISWA",
        nama: akun.nama,
        passwordSementara: akun.passwordSementara,
      };
    } else {
      return NextResponse.json({ pesan: "tipeAkun tidak dikenali" }, { status: 400 });
    }
  } catch (error) {
    console.error("Gagal proses login:", error);
    return NextResponse.json(
      { pesan: "Terjadi kesalahan di server, coba lagi" },
      { status: 500 }
    );
  }

  const token = await buatToken(payload);

  // passwordSementara = true -> tetap login (cookie diset), tapi
  // frontend/middleware yang nanti maksa redirect ke
  // /ganti-password-awal sebelum bisa akses halaman lain.
  const tujuanRedirect = payload.passwordSementara
    ? "/ganti-password-awal"
    : halamanDashboard(payload.role);

  const response = NextResponse.json({
    role: payload.role,
    nama: payload.nama,
    passwordSementara: payload.passwordSementara,
    redirect: tujuanRedirect,
  });

  response.cookies.set(NAMA_COOKIE_SESI, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UMUR_COOKIE_DETIK,
  });

  return response;
}

// ------------------------------------------------------------
// DELETE /api/auth — logout (hapus cookie sesi)
// ------------------------------------------------------------

export async function DELETE() {
  const response = NextResponse.json({ pesan: "Berhasil logout" });

  response.cookies.set(NAMA_COOKIE_SESI, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

// ------------------------------------------------------------
// Helper: NIK/NIS dikirim frontend sebagai string, tapi kolomnya
// BigInt di database. Kalau usernya iseng masukin huruf, BigInt()
// bakal throw — kita tangkap dan anggap "tidak ditemukan" (401),
// bukan 400, biar polanya tetap konsisten anti-enumeration.
// ------------------------------------------------------------

function konversiKeBigInt(nilai: string): bigint | null {
  try {
    return BigInt(nilai);
  } catch {
    return null;
  }
}