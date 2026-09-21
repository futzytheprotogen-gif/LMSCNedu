import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibAdminSaja, tanganiErrorRbac } from "@/lib/rbac";
import { buatKodeOtp, hitungWaktuKadaluarsaOtp, kirimEmailOtp } from "@/lib/resend";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

// POST /api/lupa-password/[id]/kirim-otp
// Dipakai untuk "Terima & Kirim OTP" (laporan MENUNGGU -> DITERIMA)
// maupun "Kirim Ulang OTP" (laporan udah DITERIMA) — dua-duanya sama
// aja actionnya: generate OTP baru & kirim ulang emailnya.
export async function POST(request: NextRequest, { params }: KonteksRute) {
  try {
    await wajibAdminSaja(request);
    const { id } = await params;

    const laporan = await db.laporanLupaPassword.findUnique({
      where: { id },
      include: { guru: true, siswa: true },
    });

    if (!laporan) {
      return NextResponse.json({ pesan: "Laporan tidak ditemukan" }, { status: 404 });
    }
    if (laporan.status === "DITOLAK" || laporan.status === "SELESAI") {
      return NextResponse.json(
        { pesan: "Laporan ini sudah ditolak/selesai, tidak bisa dikirim OTP lagi" },
        { status: 400 }
      );
    }

    const nama = laporan.guru?.nama ?? laporan.siswa?.nama;
    if (!nama) {
      return NextResponse.json(
        { pesan: "Akun terkait laporan ini sudah tidak ada" },
        { status: 400 }
      );
    }

    const otp = buatKodeOtp();
    const otpExpiredAt = hitungWaktuKadaluarsaOtp();

    await db.laporanLupaPassword.update({
      where: { id },
      data: { status: "DITERIMA", otp, otpExpiredAt },
    });

    await kirimEmailOtp({
      email: laporan.email,
      nama,
      kodeOtp: otp,
      tipeAkun: laporan.tipeAkun,
    });

    return NextResponse.json({ pesan: "OTP berhasil dikirim ke email pelapor" });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}