import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibAdminSaja, tanganiErrorRbac } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

// POST /api/akun/[id]/mapel — tambah satu mapel ke daftar mapel yang
// diampu guru ini. Body: { mapelId: string }
export async function POST(request: NextRequest, { params }: KonteksRute) {
  try {
    await wajibAdminSaja(request);
    const { id: guruId } = await params;

    const body = await request.json().catch(() => null);
    const mapelId = body?.mapelId as string | undefined;

    if (!mapelId) {
      return NextResponse.json({ pesan: "mapelId wajib diisi" }, { status: 400 });
    }

    await db.guruMapel.create({ data: { guruId, mapelId } });

    return NextResponse.json({ pesan: "Mapel berhasil ditambahkan" }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { pesan: "Guru ini sudah mengampu mapel tsb" },
        { status: 409 }
      );
    }
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}