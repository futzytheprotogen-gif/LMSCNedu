import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibGuru, tanganiErrorRbac } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    await wajibGuru(request);
    const kelasId = request.nextUrl.searchParams.get("kelasId");
    if (!kelasId) {
      return NextResponse.json({ pesan: "kelasId wajib diisi" }, { status: 400 });
    }

    const daftarMateri = await db.materi.findMany({
      where: { kelasId },
      orderBy: { createdAt: "desc" },
      include: { guru: { select: { id: true, nama: true } } },
    });

    return NextResponse.json({ data: daftarMateri });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

interface BodyBuatMateri {
  kelasId?: string;
  judul?: string;
  tipe?: "PDF" | "LINK";
  url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const sesi = await wajibGuru(request);

    const body: BodyBuatMateri = await request.json().catch(() => ({}));
    const { kelasId, judul, tipe, url } = body;

    if (!kelasId || !judul?.trim() || !tipe || !url?.trim()) {
      return NextResponse.json(
        { pesan: "kelasId, judul, tipe, dan url wajib diisi" },
        { status: 400 }
      );
    }

    const mengajarDiKelas = await db.kelasGuru.findFirst({
      where: { kelasId, guruId: sesi.userId },
    });
    if (!mengajarDiKelas) {
      return NextResponse.json(
        { pesan: "Kamu tidak mengajar di kelas ini" },
        { status: 403 }
      );
    }

    const materiBaru = await db.materi.create({
      data: {
        kelasId,
        guruId: sesi.userId,
        judul: judul.trim(),
        tipe,
        url: url.trim(),
      },
    });

    return NextResponse.json({ data: materiBaru }, { status: 201 });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}