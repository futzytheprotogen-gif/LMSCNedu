import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibGuru, wajibGuruPemilik, tanganiErrorRbac } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

// POST /api/asesmen/[id]/kirim-ke-kelas — Body: { kelasId: string }
export async function POST(request: NextRequest, { params }: KonteksRute) {
  try {
    const sesi = await wajibGuru(request);
    const { id } = await params;

    const asesmen = await db.asesmen.findUnique({ where: { id } });
    if (!asesmen) {
      return NextResponse.json({ pesan: "Asesmen tidak ditemukan" }, { status: 404 });
    }
    wajibGuruPemilik(sesi, asesmen.guruId);

    const body = await request.json().catch(() => null);
    const kelasId = body?.kelasId as string | undefined;
    if (!kelasId) {
      return NextResponse.json({ pesan: "kelasId wajib diisi" }, { status: 400 });
    }

    // Guru cuma boleh kirim asesmen ke kelas tempat dia sendiri ngajar
    const mengajarDiKelas = await db.kelasGuru.findFirst({
      where: { kelasId, guruId: sesi.userId },
    });
    if (!mengajarDiKelas) {
      return NextResponse.json(
        { pesan: "Kamu tidak mengajar di kelas ini" },
        { status: 403 }
      );
    }

    await db.asesmenKelas.create({ data: { asesmenId: id, kelasId } });

    return NextResponse.json({ pesan: "Asesmen berhasil dikirim ke kelas" }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { pesan: "Asesmen ini sudah dikirim ke kelas tsb" },
        { status: 409 }
      );
    }
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}