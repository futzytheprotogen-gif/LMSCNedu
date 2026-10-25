import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibAdminSaja, tanganiErrorRbac } from "@/lib/rbac";
import {
  buatKodeOtp,
  EMAIL_OTP_TERSEDIA,
  hashKodeOtp,
  hitungWaktuKadaluarsaOtp,
  kirimEmailOtp,
} from "@/lib/resend";

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
    const body = await request.json().catch(() => ({}));
    const mode = body?.mode === "MANUAL" ? "MANUAL" : "EMAIL";

    const laporan = await db.laporanLupaPassword.findUnique({
      where: { id },
      select: {
        id: true,
        tipeAkun: true,
        email: true,
        status: true,
        guru: { select: { nama: true, email: true } },
        siswa: { select: { nama: true, email: true } },
      },
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
    const emailAkun = laporan.guru?.email ?? laporan.siswa?.email;
    if (!nama || !emailAkun) {
      return NextResponse.json(
        { pesan: "Akun terkait laporan ini sudah tidak ada" },
        { status: 400 }
      );
    }
    if (emailAkun.trim().toLowerCase() !== laporan.email.trim().toLowerCase()) {
      return NextResponse.json(
        { pesan: "Email akun telah berubah. Minta pengguna mengirim laporan baru." },
        { status: 409 }
      );
    }

    const otp = buatKodeOtp();
    const otpExpiredAt = hitungWaktuKadaluarsaOtp();

    if (mode === "EMAIL") {
      if (!EMAIL_OTP_TERSEDIA) {
        return NextResponse.json(
          { pesan: "Pengiriman email belum dikonfigurasi. Gunakan opsi OTP manual." },
          { status: 503 }
        );
      }

      try {
        await kirimEmailOtp({
          email: emailAkun,
          nama,
          kodeOtp: otp,
          tipeAkun: laporan.tipeAkun,
        });
      } catch (error) {
        console.error("Gagal mengirim ulang OTP email:", error);
        return NextResponse.json(
          {
            pesan:
              "Email gagal dikirim dan kode lama tidak diubah. Periksa konfigurasi email atau gunakan opsi OTP manual.",
          },
          { status: 502 }
        );
      }
    }

    await db.laporanLupaPassword.update({
      where: { id },
      data: { status: "DITERIMA", otp: hashKodeOtp(otp), otpExpiredAt },
    });

    if (mode === "MANUAL") {
      return NextResponse.json({
        pesan: "OTP dibuat. Sampaikan kode ini langsung kepada pemilik akun.",
        kodeOtp: otp,
      });
    }

    return NextResponse.json({ pesan: "OTP berhasil dikirim ke email pelapor" });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}