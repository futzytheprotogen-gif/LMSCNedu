import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tanganiErrorRbac, wajibMasterAdmin } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

const ROLE_ADMIN_BIASA = ["ADMIN", "KEPSEK", "KURIKULUM"] as const;
type RoleAdminBiasa = (typeof ROLE_ADMIN_BIASA)[number];

export async function PATCH(request: NextRequest, { params }: KonteksRute) {
  try {
    const sesi = await wajibMasterAdmin(request);
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const role = body?.role as RoleAdminBiasa;

    if (!ROLE_ADMIN_BIASA.includes(role)) {
      return NextResponse.json(
        { pesan: "Role hanya dapat diubah menjadi ADMIN, KEPSEK, atau KURIKULUM." },
        { status: 400 }
      );
    }

    const target = await db.admin.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });
    if (!target) {
      return NextResponse.json({ pesan: "Akun administrator tidak ditemukan." }, { status: 404 });
    }
    if (target.role === "MASTER_ADMIN") {
      return NextResponse.json(
        { pesan: "Akun Master Admin dilindungi dan tidak dapat diubah dari panel ini." },
        { status: 403 }
      );
    }

    const updated = await db.$transaction(async (tx) => {
      const account = await tx.admin.update({
        where: { id },
        data: { role },
        select: { id: true, email: true, nama: true, role: true, createdAt: true },
      });
      await tx.securityAuditLog.create({
        data: {
          actorId: sesi.userId,
          actorNama: sesi.nama,
          actorRole: sesi.role,
          action: "ADMIN_ROLE_CHANGED",
          details: `${target.email}: ${target.role} -> ${account.role}`,
        },
      });
      return account;
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Gagal mengubah role administrator." }, { status: 500 })
    );
  }
}
