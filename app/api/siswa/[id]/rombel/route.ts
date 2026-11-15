import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tanganiErrorRbac, wajibRole } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: KonteksRute) {
  try {
    await wajibRole(request, ["ADMIN", "MASTER_ADMIN", "KURIKULUM"]);
    const { id } = await params;
    const input: unknown = await request.json().catch(() => null);
    if (
      !input ||
      typeof input !== "object" ||
      !("rombelId" in input) ||
      typeof input.rombelId !== "string" ||
      !input.rombelId.trim()
    ) {
      return NextResponse.json({ pesan: "Rombel tujuan wajib dipilih." }, { status: 400 });
    }

    const [siswa, rombel] = await Promise.all([
      db.siswa.findUnique({ where: { id }, select: { id: true } }),
      db.rombelAkademik.findUnique({
        where: { id: input.rombelId },
        select: { id: true, label: true },
      }),
    ]);
    if (!siswa) {
      return NextResponse.json({ pesan: "Siswa tidak ditemukan." }, { status: 404 });
    }
    if (!rombel) {
      return NextResponse.json({ pesan: "Rombel tujuan tidak ditemukan." }, { status: 404 });
    }

    const siswaDipindah = await db.siswa.update({
      where: { id },
      data: { rombelId: rombel.id },
      select: { id: true, nama: true, rombel: { select: { id: true, label: true } } },
    });
    return NextResponse.json({ data: siswaDipindah });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Perpindahan rombel gagal." }, { status: 500 })
    );
  }
}
