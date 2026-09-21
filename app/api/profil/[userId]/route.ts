import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibLogin, tanganiErrorRbac } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ userId: string }>;
}

// GET /api/profil/[userId] — lihat profil orang lain (read-only).
// Aturan: siapapun yang udah login boleh lihat profil siapapun
// (sesuai spesifikasi "Guru dan Siswa bisa saling kunjungi profil").
//
// Karena Guru/Siswa/Admin itu 3 tabel terpisah dan id-nya cuid acak
// (praktis gak mungkin nabrak), kita coba cari di tabel Guru dulu,
// kalau gak ketemu baru Siswa, baru Admin.
export async function GET(request: NextRequest, { params }: KonteksRute) {
  try {
    await wajibLogin(request);
    const { userId } = await params;

    const guru = await db.guru.findUnique({
      where: { id: userId },
      include: { mapelDiampu: { include: { mapel: { select: { nama: true } } } } },
    });
    if (guru) {
      return NextResponse.json({
        data: {
          id: guru.id,
          role: "GURU",
          nama: guru.nama,
          fotoProfil: guru.fotoProfil,
          deskripsi: guru.deskripsi,
          jenisKelamin: guru.jenisKelamin,
          mapelDiampu: guru.mapelDiampu.map((m) => m.mapel.nama),
        },
      });
    }

    const siswa = await db.siswa.findUnique({
      where: { id: userId },
      include: { rombel: { select: { label: true } } },
    });
    if (siswa) {
      return NextResponse.json({
        data: {
          id: siswa.id,
          role: "SISWA",
          nama: siswa.nama,
          nis: siswa.nis.toString(),
          fotoProfil: siswa.fotoProfil,
          deskripsi: siswa.deskripsi,
          jenisKelamin: siswa.jenisKelamin,
          rombel: siswa.rombel.label,
        },
      });
    }

    const admin = await db.admin.findUnique({ where: { id: userId } });
    if (admin) {
      return NextResponse.json({
        data: {
          id: admin.id,
          role: admin.role,
          nama: admin.nama,
          fotoProfil: admin.fotoProfil,
          deskripsi: admin.deskripsi,
        },
      });
    }

    return NextResponse.json({ pesan: "Profil tidak ditemukan" }, { status: 404 });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}