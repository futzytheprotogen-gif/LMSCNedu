import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tanganiErrorRbac, wajibMasterAdmin } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    await wajibMasterAdmin(request);

    const [jumlahAdmin, jumlahGuru, jumlahSiswa, jumlahKelas, konfigurasi, audit] =
      await Promise.all([
        db.admin.count(),
        db.guru.count(),
        db.siswa.count(),
        db.kelas.count(),
        db.systemSetting.findMany({
          where: { key: { in: ["maintenance.enabled", "maintenance.message"] } },
          select: { key: true, value: true },
        }),
        db.securityAuditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true,
            actorNama: true,
            actorRole: true,
            action: true,
            details: true,
            createdAt: true,
          },
        }),
      ]);

    const settings = Object.fromEntries(
      konfigurasi.map(({ key, value }) => [key, value])
    );

    return NextResponse.json({
      data: {
        counts: {
          admin: jumlahAdmin,
          guru: jumlahGuru,
          siswa: jumlahSiswa,
          kelas: jumlahKelas,
        },
        maintenance: {
          enabled: settings["maintenance.enabled"] === "true",
          message: settings["maintenance.message"] ?? "",
        },
        audit,
      },
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Gagal memuat ringkasan Master Admin." }, { status: 500 })
    );
  }
}
