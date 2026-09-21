import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibAdminSaja, tanganiErrorRbac } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

// ------------------------------------------------------------
// GET /api/kelas/[id]/guru?mapelId=xxx
// Daftar guru yang mengampu mapel tsb dan BELUM mengajar mapel itu
// di kelas ini (guru yang sama boleh ngajar mapel lain di kelas
// yang sama, makanya dicek kombinasi guru+mapel, bukan guru doang)
// ------------------------------------------------------------

export async function GET(request: NextRequest, { params }: KonteksRute) {
  try {
    await wajibAdminSaja(request);
    const { id: kelasId } = await params;

    const mapelId = request.nextUrl.searchParams.get("mapelId");
    if (!mapelId) {
      return NextResponse.json({ pesan: "mapelId wajib diisi" }, { status: 400 });
    }

    const guruTersedia = await db.guru.findMany({
      where: {
        mapelDiampu: { some: { mapelId } },
        kelasDiajar: { none: { kelasId, mapelId } },
      },
      select: { id: true, nama: true, fotoProfil: true },
      orderBy: { nama: "asc" },
    });

    return NextResponse.json({ data: guruTersedia });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

// ------------------------------------------------------------
// POST /api/kelas/[id]/guru — tambah guru + mapel yang diampu ke
// kelas ini. Body: { guruId: string, mapelId: string }
// ------------------------------------------------------------

export async function POST(request: NextRequest, { params }: KonteksRute) {
  try {
    await wajibAdminSaja(request);
    const { id: kelasId } = await params;

    const body = await request.json().catch(() => null);
    const guruId = body?.guruId as string | undefined;
    const mapelId = body?.mapelId as string | undefined;

    if (!guruId || !mapelId) {
      return NextResponse.json(
        { pesan: "guruId dan mapelId wajib diisi" },
        { status: 400 }
      );
    }

    await db.kelasGuru.create({
      data: { kelasId, guruId, mapelId },
    });

    return NextResponse.json({ pesan: "Guru berhasil ditambahkan" }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { pesan: "Guru ini sudah mengajar mapel tsb di kelas ini" },
        { status: 409 }
      );
    }
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}