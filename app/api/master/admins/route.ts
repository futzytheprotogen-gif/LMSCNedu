import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { tanganiErrorRbac, wajibMasterAdmin } from "@/lib/rbac";

const ROLE_YANG_DAPAT_DIBUAT = ["ADMIN", "KEPSEK", "KURIKULUM"] as const;
type RoleYangDapatDibuat = (typeof ROLE_YANG_DAPAT_DIBUAT)[number];

function emailDuplikat(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function GET(request: NextRequest) {
  try {
    await wajibMasterAdmin(request);
    const daftar = await db.admin.findMany({
      orderBy: [{ role: "asc" }, { nama: "asc" }],
      select: { id: true, email: true, nama: true, role: true, createdAt: true },
    });
    return NextResponse.json({ data: daftar });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Gagal memuat akun administrator." }, { status: 500 })
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sesi = await wajibMasterAdmin(request);
    const body = await request.json().catch(() => null);
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const nama = typeof body?.nama === "string" ? body.nama.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const role = body?.role as RoleYangDapatDibuat;

    if (!email || !nama || !ROLE_YANG_DAPAT_DIBUAT.includes(role)) {
      return NextResponse.json(
        { pesan: "Nama, email, dan role administrator yang valid wajib diisi." },
        { status: 400 }
      );
    }
    if (password.length < 12) {
      return NextResponse.json(
        { pesan: "Password administrator minimal 12 karakter." },
        { status: 400 }
      );
    }

    const [adminDenganEmail, guruDenganEmail, siswaDenganEmail] = await Promise.all([
      db.admin.findUnique({ where: { email }, select: { id: true } }),
      db.guru.findUnique({ where: { email }, select: { id: true } }),
      db.siswa.findUnique({ where: { email }, select: { id: true } }),
    ]);
    if (adminDenganEmail || guruDenganEmail || siswaDenganEmail) {
      return NextResponse.json(
        { pesan: "Email sudah digunakan oleh akun lain." },
        { status: 409 }
      );
    }

    const akun = await db.$transaction(async (tx) => {
      const created = await tx.admin.create({
        data: { email, nama, role, password: await hashPassword(password) },
        select: { id: true, email: true, nama: true, role: true, createdAt: true },
      });
      await tx.securityAuditLog.create({
        data: {
          actorId: sesi.userId,
          actorNama: sesi.nama,
          actorRole: sesi.role,
          action: "ADMIN_ACCOUNT_CREATED",
          details: `${created.role}: ${created.email}`,
        },
      });
      return created;
    });

    return NextResponse.json({ data: akun }, { status: 201 });
  } catch (error) {
    if (emailDuplikat(error)) {
      return NextResponse.json(
        { pesan: "Email sudah digunakan oleh akun lain." },
        { status: 409 }
      );
    }
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Gagal membuat akun administrator." }, { status: 500 })
    );
  }
}
