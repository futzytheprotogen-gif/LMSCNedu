import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tanganiErrorRbac, wajibSiswa } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const sesi = await wajibSiswa(request);
    const keanggotaan = await db.kelasSiswa.findMany({
      where: { siswaId: sesi.userId },
      select: { kelasId: true },
    });
    const kelasIds = keanggotaan.map((item) => item.kelasId);

    if (kelasIds.length === 0) return NextResponse.json({ data: [] });

    const asesmen = await db.asesmen.findMany({
      where: {
        status: "SELESAI",
        kelasTujuan: { some: { kelasId: { in: kelasIds } } },
      },
      orderBy: { createdAt: "desc" },
      include: {
        mapel: { select: { nama: true } },
        guru: { select: { id: true, nama: true } },
        soal: { select: { id: true } },
        kelasTujuan: {
          where: { kelasId: { in: kelasIds } },
          select: { kelas: { select: { id: true, judul: true } } },
        },
        submission: {
          where: { siswaId: sesi.userId },
          select: { waktuSelesai: true },
        },
      },
    });

    return NextResponse.json({
      data: asesmen.map((item) => ({
        id: item.id,
        judul: item.judul,
        tipe: item.tipe,
        durasiMenit: item.durasiMenit,
        mapel: item.mapel.nama,
        guru: item.guru,
        jumlahSoal: item.soal.length,
        kelasTujuan: item.kelasTujuan.map(({ kelas }) => kelas),
        submission: item.submission[0]
          ? {
              waktuSelesai: item.submission[0].waktuSelesai?.toISOString() ?? null,
            }
          : null,
      })),
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}