import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { cocokkanKodeOtp, hashKodeOtp } from "@/lib/resend";

// ------------------------------------------------------------
// POST /api/reset-password — publik, langkah terakhir alur lupa
// password. Body: { tipeAkun, identifier, otp, passwordBaru,
// konfirmasiPasswordBaru }
//
// OTP divalidasi di sini dan dikonsumsi atomically bersama perubahan
// password supaya kode tidak dapat dipakai ulang atau bersamaan.
// ------------------------------------------------------------

const PESAN_GAGAL = "Kode OTP tidak valid atau sudah kadaluarsa";
const PANJANG_MINIMAL_PASSWORD = 8;

interface BodyResetPassword {
  tipeAkun?: "GURU" | "SISWA";
  identifier?: string;
  otp?: string;
  passwordBaru?: string;
  konfirmasiPasswordBaru?: string;
}

export async function POST(request: NextRequest) {
  let body: BodyResetPassword;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ pesan: "Body request tidak valid" }, { status: 400 });
  }

  const { tipeAkun, identifier, otp, passwordBaru, konfirmasiPasswordBaru } = body;

  if (
    (tipeAkun !== "GURU" && tipeAkun !== "SISWA") ||
    !identifier ||
    !otp ||
    !passwordBaru ||
    !konfirmasiPasswordBaru
  ) {
    return NextResponse.json({ pesan: "Semua field wajib diisi" }, { status: 400 });
  }
  if (passwordBaru.length < PANJANG_MINIMAL_PASSWORD) {
    return NextResponse.json(
      { pesan: `Password minimal ${PANJANG_MINIMAL_PASSWORD} karakter` },
      { status: 400 }
    );
  }
  if (passwordBaru !== konfirmasiPasswordBaru) {
    return NextResponse.json({ pesan: "Konfirmasi password tidak cocok" }, { status: 400 });
  }
  if (!/^\d{6}$/.test(otp)) {
    return NextResponse.json({ pesan: PESAN_GAGAL }, { status: 400 });
  }

  let idBigInt: bigint;
  try {
    idBigInt = BigInt(identifier);
  } catch {
    return NextResponse.json({ pesan: PESAN_GAGAL }, { status: 400 });
  }

  const laporan =
    tipeAkun === "GURU"
      ? await db.laporanLupaPassword.findFirst({
          where: { tipeAkun: "GURU", guru: { nik: idBigInt }, status: "DITERIMA" },
          include: { guru: true },
          orderBy: { createdAt: "desc" },
        })
      : await db.laporanLupaPassword.findFirst({
          where: { tipeAkun: "SISWA", siswa: { nis: idBigInt }, status: "DITERIMA" },
          include: { siswa: true },
          orderBy: { createdAt: "desc" },
        });

  if (
    !laporan ||
    !laporan.otp ||
    !laporan.otpExpiredAt ||
    !cocokkanKodeOtp(otp, laporan.otp) ||
    laporan.otpExpiredAt.getTime() < Date.now()
  ) {
    return NextResponse.json({ pesan: PESAN_GAGAL }, { status: 400 });
  }

  const passwordHash = await hashPassword(passwordBaru);

  if (
    (tipeAkun === "GURU" && !laporan.guruId) ||
    (tipeAkun === "SISWA" && !laporan.siswaId)
  ) {
    return NextResponse.json({ pesan: PESAN_GAGAL }, { status: 400 });
  }

  const berhasilReset = await db.$transaction(async (tx) => {
    const otpDipakai = await tx.laporanLupaPassword.updateMany({
      where: {
        id: laporan.id,
        status: "DITERIMA",
        otp: hashKodeOtp(otp),
        otpExpiredAt: { gte: new Date() },
      },
      data: { otp: null, otpExpiredAt: null },
    });
    if (otpDipakai.count !== 1) return false;

    if (tipeAkun === "GURU" && laporan.guruId) {
      await tx.guru.update({
        where: { id: laporan.guruId },
        data: { password: passwordHash, passwordSementara: false },
      });
    } else if (tipeAkun === "SISWA" && laporan.siswaId) {
      await tx.siswa.update({
        where: { id: laporan.siswaId },
        data: { password: passwordHash, passwordSementara: false },
      });
    }
    return true;
  });

  if (!berhasilReset) {
    return NextResponse.json({ pesan: PESAN_GAGAL }, { status: 400 });
  }

  return NextResponse.json({
    pesan: "Password berhasil diubah. Silakan login dengan password baru kamu.",
  });
}