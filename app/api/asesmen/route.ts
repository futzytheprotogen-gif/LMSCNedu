import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibGuru, tanganiErrorRbac } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const sesi = await wajibGuru(request);

    const daftarAsesmen = await db.asesmen.findMany({
      where: { guruId: sesi.userId },
      orderBy: { createdAt: "desc" },
      include: {
        mapel: { select: { nama: true } },
        _count: { select: { soal: true, kelasTujuan: true } },
      },
    });

    return NextResponse.json({
      data: daftarAsesmen.map((a) => ({
        id: a.id,
        judul: a.judul,
        tipe: a.tipe,
        status: a.status,
        durasiMenit: a.durasiMenit,
        mapel: a.mapel.nama,
        jumlahSoal: a._count.soal,
        jumlahKelasTujuan: a._count.kelasTujuan,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

interface BodyBuatAsesmen {
  judul?: string;
  tipe?: "KUIS" | "UJIAN";
  mapelId?: string;
  durasiMenit?: number;
  kelasIds?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const sesi = await wajibGuru(request);

    const body: BodyBuatAsesmen = await request.json().catch(() => ({}));
    const { judul, tipe, mapelId, durasiMenit, kelasIds } = body;

    if (!judul?.trim() || !tipe || !mapelId) {
      return NextResponse.json(
        { pesan: "judul, tipe, dan mapelId wajib diisi" },
        { status: 400 }
      );
    }

    const asesmenBaru = await db.asesmen.create({
      data: {
        judul: judul.trim(),
        tipe,
        mapelId,
        guruId: sesi.userId,
        durasiMenit: durasiMenit ?? null,
        status: "PROSES",
        kelasTujuan: kelasIds?.length
          ? { create: kelasIds.map((kelasId) => ({ kelasId })) }
          : undefined,
      },
    });

    return NextResponse.json({ data: asesmenBaru }, { status: 201 });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}