import { NextRequest, NextResponse } from "next/server";
import { wajibLogin, tanganiErrorRbac } from "@/lib/rbac";

// GET /api/sesi — balikin userId/role/nama dari cookie sesi yang lagi
// aktif. Dipakai frontend buat tau "siapa saya" tanpa perlu decode
// JWT di client (cookie-nya httpOnly, sengaja gak bisa dibaca JS) —
// misal buat nentuin apakah suatu pengumuman/tugas/asesmen itu milik
// sendiri (tampilkan tombol edit/hapus) atau bukan.
export async function GET(request: NextRequest) {
  try {
    const sesi = await wajibLogin(request);
    return NextResponse.json({
      data: { userId: sesi.userId, role: sesi.role, nama: sesi.nama },
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}