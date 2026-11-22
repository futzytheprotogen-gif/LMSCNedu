import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibAdminSaja, tanganiErrorRbac } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

// POST /api/lupa-password/[id]/selesai
// Dipanggil admin sebagai penanda penyelesaian manual.
export async function POST(request: NextRequest, { params }: KonteksRute) {
  try {
    await wajibAdminSaja(request);
    const { id } = await params;

    await db.laporanLupaPassword.update({
      where: { id },
      data: {
        status: "SELESAI",
        otp: null,
        otpEncrypted: null,
        otpExpiredAt: null,
        otpAccessTokenHash: null,
      },
    });

    return NextResponse.json({ pesan: "Laporan ditandai selesai" });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}