import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibGuru, tanganiErrorRbac } from "@/lib/rbac";

// POST /api/pengumuman — Body: { kelasId: string, isi: string, gambar?: string }
// Cuma Guru yang boleh posting, dan cuma di kelas tempat dia ngajar.
export async function POST(request: NextRequest) {
  try {
    const sesi = await wajibGuru(request);

    const body = await request.json().catch(() => null);
    const kelasId = body?.kelasId as string | undefined;
    const isi = (body?.isi as string | undefined)?.trim();
    const gambar = body?.gambar as string | undefined;

    if (!kelasId || !isi) {
      return NextResponse.json({ pesan: "kelasId dan isi wajib diisi" }, { status: 400 });
    }

    const keanggotaan = await db.kelasGuru.findFirst({
      where: { kelasId, guruId: sesi.userId },
    });
    if (!keanggotaan) {
      return NextResponse.json(
        { pesan: "Kamu tidak mengajar di kelas ini" },
        { status: 403 }
      );
    }

    const pengumuman = await db.pengumuman.create({
      data: { kelasId, guruId: sesi.userId, isi, gambar: gambar || null },
    });

    return NextResponse.json({ data: pengumuman }, { status: 201 });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}