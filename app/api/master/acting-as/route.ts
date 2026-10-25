import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  buatToken,
  NAMA_COOKIE_AKSES_MASTER,
  verifikasiToken,
  type PayloadSesi,
  type RoleAplikasi,
} from "@/lib/auth";
import { tanganiErrorRbac, wajibMasterAdmin } from "@/lib/rbac";

const UMUR_AKSES_DETIK = 60 * 60;
const ROLE_AKSES: RoleAplikasi[] = ["ADMIN", "KEPSEK", "KURIKULUM", "GURU", "SISWA"];
const TUJUAN_ROLE: Record<RoleAplikasi, string> = {
  MASTER_ADMIN: "/master",
  ADMIN: "/admin/kelas",
  KEPSEK: "/kepsek/kelas",
  KURIKULUM: "/kurikulum/kelas",
  GURU: "/guru/kelas",
  SISWA: "/siswa",
};

function setCookieAkses(response: NextResponse, token: string) {
  response.cookies.set(NAMA_COOKIE_AKSES_MASTER, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UMUR_AKSES_DETIK,
  });
}

function hapusCookieAkses(response: NextResponse) {
  response.cookies.set(NAMA_COOKIE_AKSES_MASTER, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function GET(request: NextRequest) {
  try {
    const master = await wajibMasterAdmin(request);
    const [admins, guru, siswa] = await Promise.all([
      db.admin.findMany({
        where: { role: { in: ["ADMIN", "KEPSEK", "KURIKULUM"] } },
        select: { id: true, nama: true, email: true, role: true },
        orderBy: { nama: "asc" },
      }),
      db.guru.findMany({
        select: { id: true, nama: true, email: true },
        orderBy: { nama: "asc" },
      }),
      db.siswa.findMany({
        select: { id: true, nama: true, email: true },
        orderBy: { nama: "asc" },
      }),
    ]);

    const accounts = [
      ...admins.map((account) => ({ ...account, role: account.role as RoleAplikasi })),
      ...guru.map((account) => ({ ...account, role: "GURU" as const })),
      ...siswa.map((account) => ({ ...account, role: "SISWA" as const })),
    ].sort((a, b) => a.nama.localeCompare(b.nama, "id"));
    const accessToken = request.cookies.get(NAMA_COOKIE_AKSES_MASTER)?.value;
    const accessSession = accessToken ? await verifikasiToken(accessToken) : null;
    const active =
      accessSession?.actingAs &&
      accessSession.masterActorId === master.userId
        ? {
            nama: accessSession.nama,
            role: accessSession.role,
          }
        : null;

    return NextResponse.json({ data: accounts, active });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Gagal memuat akun untuk akses sementara." }, { status: 500 })
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const master = await wajibMasterAdmin(request);
    const body = await request.json().catch(() => null);
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const role = body?.role as RoleAplikasi;
    if (!userId || !ROLE_AKSES.includes(role)) {
      return NextResponse.json({ pesan: "Pilih akun dan role yang valid." }, { status: 400 });
    }

    let target: { id: string; nama: string; role: RoleAplikasi } | null = null;
    if (role === "ADMIN" || role === "KEPSEK" || role === "KURIKULUM") {
      const account = await db.admin.findFirst({
        where: { id: userId, role },
        select: { id: true, nama: true },
      });
      if (account) target = { ...account, role };
    } else if (role === "GURU") {
      const account = await db.guru.findUnique({
        where: { id: userId },
        select: { id: true, nama: true },
      });
      if (account) target = { ...account, role };
    } else if (role === "SISWA") {
      const account = await db.siswa.findUnique({
        where: { id: userId },
        select: { id: true, nama: true },
      });
      if (account) target = { ...account, role };
    }

    if (!target) {
      return NextResponse.json({ pesan: "Akun tidak ditemukan atau role akun sudah berubah." }, { status: 404 });
    }

    const payload: PayloadSesi = {
      userId: target.id,
      role: target.role,
      nama: target.nama,
      passwordSementara: false,
      actingAs: true,
      masterActorId: master.userId,
      masterActorNama: master.nama,
    };
    const token = await buatToken(payload, "1h");
    const currentToken = request.cookies.get(NAMA_COOKIE_AKSES_MASTER)?.value;
    const currentSession = currentToken ? await verifikasiToken(currentToken) : null;
    if (
      currentSession?.actingAs &&
      currentSession.masterActorId === master.userId
    ) {
      await db.securityAuditLog.create({
        data: {
          actorId: master.userId,
          actorNama: master.nama,
          actorRole: "MASTER_ADMIN",
          action: "MASTER_ACTING_AS_ENDED",
          details: `${currentSession.role}: ${currentSession.nama} (${currentSession.userId}); switched account`,
        },
      });
    }
    await db.securityAuditLog.create({
      data: {
        actorId: master.userId,
        actorNama: master.nama,
        actorRole: "MASTER_ADMIN",
        action: "MASTER_ACTING_AS_STARTED",
        details: `${target.role}: ${target.nama} (${target.id})`,
      },
    });

    const response = NextResponse.json({
      data: { role: target.role, nama: target.nama },
      redirect: TUJUAN_ROLE[target.role],
    });
    setCookieAkses(response, token);
    return response;
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Gagal memulai akses sementara." }, { status: 500 })
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const master = await wajibMasterAdmin(request);
    const token = request.cookies.get(NAMA_COOKIE_AKSES_MASTER)?.value;
    const active = token ? await verifikasiToken(token) : null;
    if (active?.actingAs && active.masterActorId === master.userId) {
      await db.securityAuditLog.create({
        data: {
          actorId: master.userId,
          actorNama: master.nama,
          actorRole: "MASTER_ADMIN",
          action: "MASTER_ACTING_AS_ENDED",
          details: `${active.role}: ${active.nama} (${active.userId})`,
        },
      });
    }

    const response = NextResponse.json({ redirect: "/master" });
    hapusCookieAkses(response);
    return response;
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Gagal mengakhiri akses sementara." }, { status: 500 })
    );
  }
}
