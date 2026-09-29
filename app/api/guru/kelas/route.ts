import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibGuru, tanganiErrorRbac } from "@/lib/rbac";

// ------------------------------------------------------------
// GET /api/guru/kelas — daftar kelas tempat guru yang login
// mengajar (minimal satu mapel). Dipakai untuk dropdown "Kirim
// ke Kelas" di Tugas & Asesmen, dan untuk tab "Kelas" Guru.
// ------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const sesi = await wajibGuru(request);

    const kelasGuru = await db.kelasGuru.findMany({
      where: { guruId: sesi.userId },
      include: {
        kelas: {
          select: {
            id: true,
            judul: true,
            deskripsi: true,
            kodeKelas: true,
            _count: { select: { siswa: true } },
          },
        },
        mapel: { select: { id: true, nama: true } },
      },
    });

    // Satu guru bisa punya beberapa baris KelasGuru untuk kelas yang
    // sama (mapel berbeda) — gabungkan supaya kelasnya tidak dobel,
    // tapi tetap kumpulkan semua mapel yang diampu di kelas itu.
    const petaKelas = new Map<
      string,
      {
        id: string;
        judul: string;
        deskripsi: string | null;
        kodeKelas: string;
        jumlahSiswa: number;
        mapel: { id: string; nama: string }[];
      }
    >();

    for (const kg of kelasGuru) {
      const existing = petaKelas.get(kg.kelas.id);

      if (existing) {
        existing.mapel.push(kg.mapel);
      } else {
        petaKelas.set(kg.kelas.id, {
          id: kg.kelas.id,
          judul: kg.kelas.judul,
          deskripsi: kg.kelas.deskripsi,
          kodeKelas: kg.kelas.kodeKelas,
          jumlahSiswa: kg.kelas._count.siswa,
          mapel: [kg.mapel],
        });
      }
    }

    const data = Array.from(petaKelas.values()).sort((a, b) =>
      a.judul.localeCompare(b.judul)
    );

    return NextResponse.json({ data });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}