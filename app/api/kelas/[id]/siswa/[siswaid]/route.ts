import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibAdminSaja, tanganiErrorRbac } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string; siswaid: string }>;
}

export async function DELETE(request: NextRequest, { params }: KonteksRute) {
  try {
    await wajibAdminSaja(request);
    const { id: kelasId, siswaid: siswaId } = await params;

    if (!siswaId) {
      return NextResponse.json({ pesan: "siswaId wajib diisi" }, { status: 400 });
    }

    await db.kelasSiswa.delete({
      where: {
        kelasId_siswaId: {
          kelasId,
          siswaId,
        },
      },
    });

    return NextResponse.json({ pesan: "Siswa berhasil dikeluarkan dari kelas" }, { status: 200 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2025") {
      return NextResponse.json({ pesan: "Siswa tidak ditemukan di kelas ini" }, { status: 404 });
    }

    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}
