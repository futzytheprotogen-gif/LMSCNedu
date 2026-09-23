import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibGuru, wajibGuruPemilik, tanganiErrorRbac } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: KonteksRute) {
  try {
    const sesi = await wajibGuru(request);
    const { id } = await params;

    const materi = await db.materi.findUnique({ where: { id } });
    if (!materi) {
      return NextResponse.json({ pesan: "Materi tidak ditemukan" }, { status: 404 });
    }
    wajibGuruPemilik(sesi, materi.guruId);

    const body = await request.json().catch(() => ({}));

    const materiTerupdate = await db.materi.update({
      where: { id },
      data: {
        judul: body.judul?.trim(),
        url: body.url?.trim(),
        tipe: body.tipe,
      },
    });

    return NextResponse.json({ data: materiTerupdate });
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

    const materi = await db.materi.findUnique({ where: { id } });
    if (!materi) {
      return NextResponse.json({ pesan: "Materi tidak ditemukan" }, { status: 404 });
    }
    wajibGuruPemilik(sesi, materi.guruId);

    await db.materi.delete({ where: { id } });

    return NextResponse.json({ pesan: "Materi berhasil dihapus" });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}