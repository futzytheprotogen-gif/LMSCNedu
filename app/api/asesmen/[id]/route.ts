import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibGuru, wajibGuruPemilik, tanganiErrorRbac } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: KonteksRute) {
  try {
    const sesi = await wajibGuru(request);
    const { id } = await params;

    const asesmen = await db.asesmen.findUnique({
      where: { id },
      include: {
        mapel: { select: { id: true, nama: true } },
        soal: {
          orderBy: { urutan: "asc" },
          include: { opsi: true },
        },
        kelasTujuan: { include: { kelas: { select: { id: true, judul: true } } } },
      },
    });

    if (!asesmen) {
      return NextResponse.json({ pesan: "Asesmen tidak ditemukan" }, { status: 404 });
    }
    wajibGuruPemilik(sesi, asesmen.guruId);

    return NextResponse.json({
      data: {
        id: asesmen.id,
        judul: asesmen.judul,
        tipe: asesmen.tipe,
        status: asesmen.status,
        durasiMenit: asesmen.durasiMenit,
        mapel: asesmen.mapel,
        soal: asesmen.soal,
        kelasTujuan: asesmen.kelasTujuan.map((kt) => kt.kelas),
      },
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

interface BodyEditAsesmen {
  judul?: string;
  durasiMenit?: number | null;
  finalisasi?: boolean; // true -> ubah status jadi SELESAI
}

export async function PATCH(request: NextRequest, { params }: KonteksRute) {
  try {
    const sesi = await wajibGuru(request);
    const { id } = await params;

    const asesmen = await db.asesmen.findUnique({ where: { id } });
    if (!asesmen) {
      return NextResponse.json({ pesan: "Asesmen tidak ditemukan" }, { status: 404 });
    }
    wajibGuruPemilik(sesi, asesmen.guruId);

    const body: BodyEditAsesmen = await request.json().catch(() => ({}));

    if (body.finalisasi) {
      const jumlahSoal = await db.soal.count({ where: { asesmenId: id } });
      if (jumlahSoal === 0) {
        return NextResponse.json(
          { pesan: "Tambahkan minimal 1 soal sebelum finalisasi" },
          { status: 400 }
        );
      }
    }

    const asesmenTerupdate = await db.asesmen.update({
      where: { id },
      data: {
        judul: body.judul?.trim(),
        durasiMenit: body.durasiMenit,
        status: body.finalisasi ? "SELESAI" : undefined,
      },
    });

    return NextResponse.json({ data: asesmenTerupdate });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

export async function DELETE(request: NextRequest, { params }: KonteksRute) {
  try {
    const sesi = await wajibGuru(request);
    const { id } = await params;

    const asesmen = await db.asesmen.findUnique({ where: { id } });
    if (!asesmen) {
      return NextResponse.json({ pesan: "Asesmen tidak ditemukan" }, { status: 404 });
    }
    wajibGuruPemilik(sesi, asesmen.guruId);

    await db.asesmen.delete({ where: { id } });

    return NextResponse.json({ pesan: "Asesmen berhasil dihapus" });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}