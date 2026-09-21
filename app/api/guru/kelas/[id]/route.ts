import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibGuru, tanganiErrorRbac } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

// GET /api/guru/kelas/[id] — detail kelas, TAPI cuma boleh diakses
// kalau guru yang login itu beneran ngajar di kelas ini (KelasGuru
// harus ada barisnya). Ini beda sama endpoint admin yang bisa akses
// kelas manapun.
export async function GET(request: NextRequest, { params }: KonteksRute) {
  try {
    const sesi = await wajibGuru(request);
    const { id } = await params;

    const keanggotaan = await db.kelasGuru.findFirst({
      where: { kelasId: id, guruId: sesi.userId },
    });
    if (!keanggotaan) {
      return NextResponse.json(
        { pesan: "Kamu tidak mengajar di kelas ini" },
        { status: 403 }
      );
    }

    const kelas = await db.kelas.findUnique({
      where: { id },
      include: {
        siswa: {
          include: {
            siswa: { select: { id: true, nama: true, nis: true, fotoProfil: true } },
          },
        },
        guru: {
          include: {
            guru: { select: { id: true, nama: true, fotoProfil: true } },
            mapel: { select: { id: true, nama: true } },
          },
        },
        pengumuman: {
          orderBy: { createdAt: "desc" },
          include: { guru: { select: { id: true, nama: true } } },
        },
      },
    });

    if (!kelas) {
      return NextResponse.json({ pesan: "Kelas tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: kelas.id,
        judul: kelas.judul,
        deskripsi: kelas.deskripsi,
        kodeKelas: kelas.kodeKelas,
        siswa: kelas.siswa.map((ks) => ({ ...ks.siswa, nis: ks.siswa.nis.toString() })),
        guru: kelas.guru.map((kg) => ({ ...kg.guru, mapel: kg.mapel })),
        pengumuman: kelas.pengumuman,
      },
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}