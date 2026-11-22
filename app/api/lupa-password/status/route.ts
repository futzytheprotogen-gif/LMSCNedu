import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dekripsiKodeOtp, hashTokenPermintaanOtp } from "@/lib/email";

interface BodyStatusOtp {
  accessToken?: string;
}

export async function POST(request: NextRequest) {
  let body: BodyStatusOtp;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ pesan: "Body request tidak valid." }, { status: 400 });
  }

  const { accessToken } = body;
  if (!accessToken || !/^[a-f\d]{64}$/i.test(accessToken)) {
    return NextResponse.json({ pesan: "Sesi permintaan tidak valid." }, { status: 400 });
  }

  try {
    const laporan = await db.laporanLupaPassword.findUnique({
      where: { otpAccessTokenHash: hashTokenPermintaanOtp(accessToken) },
      select: {
        status: true,
        otp: true,
        otpEncrypted: true,
        otpExpiredAt: true,
      },
    });

    if (
      !laporan ||
      laporan.status !== "DITERIMA" ||
      !laporan.otp ||
      !laporan.otpEncrypted ||
      !laporan.otpExpiredAt ||
      laporan.otpExpiredAt.getTime() < Date.now()
    ) {
      return NextResponse.json({ status: "BELUM_ADA_OTP" });
    }

    return NextResponse.json({
      status: "OTP_MANUAL",
      kodeOtp: dekripsiKodeOtp(laporan.otpEncrypted),
    });
  } catch (error) {
    console.error("Gagal memeriksa notifikasi OTP manual:", error);
    return NextResponse.json(
      { pesan: "Notifikasi OTP belum dapat diperiksa." },
      { status: 500 }
    );
  }
}
