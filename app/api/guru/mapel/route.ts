import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibGuru, tanganiErrorRbac } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const sesi = await wajibGuru(request);

    const mapelDiampu = await db.guruMapel.findMany({
      where: { guruId: sesi.userId },
      include: { mapel: { select: { id: true, nama: true } } },
    });

    return NextResponse.json({ data: mapelDiampu.map((m) => m.mapel) });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}