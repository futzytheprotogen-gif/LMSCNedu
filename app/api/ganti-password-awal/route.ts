import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibLogin, tanganiErrorRbac } from "@/lib/rbac";
import {
  hashPassword,
  buatToken,
  halamanDashboard,
  NAMA_COOKIE_SESI,
  type PayloadSesi,
} from "@/lib/auth";

// ------------------------------------------------------------
// POST /api/ganti-password-awal
// Body: { passwordBaru: string, konfirmasiPasswordBaru: string }
//
// Khusus Guru & Siswa yang passwordSementara-nya masih true.
// Setelah berhasil, cookie sesi DIGANTI dengan token baru yang
// passwordSementara: false — kalau ini gak dilakukan, proxy.ts bakal
// terus-terusan mental balik ke halaman ini walau password di
// database udah keupdate (karena proxy baca dari cookie, bukan
// query ulang ke db tiap request).
// ------------------------------------------------------------

interface BodyGantiPasswordAwal {
  passwordBaru?: string;
  konfirmasiPasswordBaru?: string;
}

const UMUR_COOKIE_DETIK = 8 * 60 * 60; // samakan dengan app/api/auth/route.ts
const PANJANG_MINIMAL_PASSWORD = 8;

export async function POST(request: NextRequest) {
  try {
    const sesi = await wajibLogin(request);

    if (sesi.role !== "GURU" && sesi.role !== "SISWA") {
      return NextResponse.json(
        { pesan: "Endpoint ini khusus akun Guru & Siswa" },
        { status: 400 }
      );
    }

    let body: BodyGantiPasswordAwal;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ pesan: "Body request tidak valid" }, { status: 400 });
    }

    const { passwordBaru, konfirmasiPasswordBaru } = body;

    if (!passwordBaru || !konfirmasiPasswordBaru) {
      return NextResponse.json(
        { pesan: "Password baru & konfirmasi wajib diisi" },
        { status: 400 }
      );
    }
    if (passwordBaru.length < PANJANG_MINIMAL_PASSWORD) {
      return NextResponse.json(
        { pesan: `Password minimal ${PANJANG_MINIMAL_PASSWORD} karakter` },
        { status: 400 }
      );
    }
    if (passwordBaru !== konfirmasiPasswordBaru) {
      return NextResponse.json(
        { pesan: "Konfirmasi password tidak cocok" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(passwordBaru);

    if (sesi.role === "GURU") {
      await db.guru.update({
        where: { id: sesi.userId },
        data: { password: passwordHash, passwordSementara: false },
      });
    } else {
      await db.siswa.update({
        where: { id: sesi.userId },
        data: { password: passwordHash, passwordSementara: false },
      });
    }

    // Sign ulang token dengan passwordSementara: false, biar proxy.ts
    // gak nyangkut terus di halaman ini
    const payloadBaru: PayloadSesi = {
      userId: sesi.userId,
      role: sesi.role,
      nama: sesi.nama,
      passwordSementara: false,
    };
    const tokenBaru = await buatToken(payloadBaru);

    const response = NextResponse.json({
      pesan: "Password berhasil diubah",
      redirect: halamanDashboard(sesi.role),
    });

    response.cookies.set(NAMA_COOKIE_SESI, tokenBaru, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: UMUR_COOKIE_DETIK,
    });

    return response;
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}