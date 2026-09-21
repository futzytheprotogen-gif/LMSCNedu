import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibGuru, tanganiErrorRbac } from "@/lib/rbac";

// GET /api/guru/kelas — kelas tempat guru yang login ini ngajar,
// beserta mapel yang dia ampu di tiap kelas itu (bisa lebih dari 1
// mapel per kelas kalau dia ngajar >1 mapel di kelas yang sama)
export async function GET(request: NextRequest) {
  try {
    const sesi = await wajibGuru(request);

    const kelasGuru = await db.kelasGuru.findMany({
      where: { guruId: sesi.userId },
      include: {
        kelas: { include: { _count: { select: { siswa: true } } } },
        mapel: { select: { id: true, nama: true } },
      },
    });

    // Satu kelas bisa muncul >1 kali di kelasGuru (kalau guru ngajar
    // >1 mapel di kelas yang sama) — digabung jadi satu entri per
    // kelas dengan daftar mapel
    const peta = new Map<
      string,
      { id: string; judul: string; deskripsi: string | null; jumlahSiswa: number; mapel: string[] }
    >();

    for (const kg of kelasGuru) {
      const existing = peta.get(kg.kelas.id);
      if (existing) {
        existing.mapel.push(kg.mapel.nama);
      } else {
        peta.set(kg.kelas.id, {
          id: kg.kelas.id,
          judul: kg.kelas.judul,
          deskripsi: kg.kelas.deskripsi,
          jumlahSiswa: kg.kelas._count.siswa,
          mapel: [kg.mapel.nama],
        });
      }
    }

    return NextResponse.json({ data: Array.from(peta.values()) });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}