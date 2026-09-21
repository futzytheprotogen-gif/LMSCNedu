import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibAdminSaja, tanganiErrorRbac } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string; mapelid: string }>;
}

export async function DELETE(request: NextRequest, { params }: KonteksRute) {
  try {
    await wajibAdminSaja(request);
    const { id: guruId, mapelid: mapelId } = await params;

    await db.guruMapel.delete({
      where: { guruId_mapelId: { guruId, mapelId } },
    });

    return NextResponse.json({ pesan: "Mapel berhasil dihapus dari guru ini" });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}