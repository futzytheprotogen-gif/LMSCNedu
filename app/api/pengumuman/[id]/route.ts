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

    const pengumuman = await db.pengumuman.findUnique({ where: { id } });
    if (!pengumuman) {
      return NextResponse.json({ pesan: "Pengumuman tidak ditemukan" }, { status: 404 });
    }
    wajibGuruPemilik(sesi, pengumuman.guruId);

    const body = await request.json().catch(() => null);
    const isi = (body?.isi as string | undefined)?.trim();
    if (!isi) {
      return NextResponse.json({ pesan: "isi wajib diisi" }, { status: 400 });
    }

    const pengumumanTerupdate = await db.pengumuman.update({
      where: { id },
      data: { isi, gambar: body?.gambar ?? pengumuman.gambar },
    });

    return NextResponse.json({ data: pengumumanTerupdate });
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

    const pengumuman = await db.pengumuman.findUnique({ where: { id } });
    if (!pengumuman) {
      return NextResponse.json({ pesan: "Pengumuman tidak ditemukan" }, { status: 404 });
    }
    wajibGuruPemilik(sesi, pengumuman.guruId);

    await db.pengumuman.delete({ where: { id } });

    return NextResponse.json({ pesan: "Pengumuman berhasil dihapus" });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}