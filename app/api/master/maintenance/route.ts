import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tanganiErrorRbac, wajibMasterAdmin } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  try {
    const sesi = await wajibMasterAdmin(request);
    const body = await request.json().catch(() => null);
    if (typeof body?.enabled !== "boolean") {
      return NextResponse.json(
        { pesan: "Status maintenance harus berupa boolean." },
        { status: 400 }
      );
    }

    const message =
      typeof body.message === "string" ? body.message.trim().slice(0, 240) : "";
    const enabledValue = body.enabled ? "true" : "false";

    await db.$transaction(async (tx) => {
      await tx.systemSetting.upsert({
        where: { key: "maintenance.enabled" },
        update: { value: enabledValue },
        create: { key: "maintenance.enabled", value: enabledValue },
      });
      await tx.systemSetting.upsert({
        where: { key: "maintenance.message" },
        update: { value: message },
        create: { key: "maintenance.message", value: message },
      });
      await tx.securityAuditLog.create({
        data: {
          actorId: sesi.userId,
          actorNama: sesi.nama,
          actorRole: sesi.role,
          action: body.enabled ? "MAINTENANCE_ENABLED" : "MAINTENANCE_DISABLED",
          details: message || null,
        },
      });
    });

    return NextResponse.json({
      data: { enabled: body.enabled, message },
      pesan: body.enabled
        ? "Maintenance aktif. Data dan akun tetap tersimpan."
        : "Website kembali aktif.",
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Gagal mengubah status maintenance." }, { status: 500 })
    );
  }
}
