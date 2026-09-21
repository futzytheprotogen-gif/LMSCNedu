import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibAdminSaja, tanganiErrorRbac } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

// POST /api/lupa-password/[id]/selesai
// Dipanggil admin setelah siswa/guru berhasil ganti password pakai
// OTP-nya. Laporan baru dihapus di sini, bukan otomatis saat
// reset-password berhasil (sesuai spesifikasi: laporan tetap ada di
// tab Laporan sampai admin klik "Selesai").
export async function POST(request: NextRequest, { params }: KonteksRute) {
  try {
    await wajibAdminSaja(request);
    const { id } = await params;

    await db.laporanLupaPassword.delete({ where: { id } });

    return NextResponse.json({ pesan: "Laporan ditandai selesai & dihapus" });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}