import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibAdminSaja, tanganiErrorRbac } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

// ------------------------------------------------------------
// GET /api/kelas/[id]/siswa?rombelId=xxx
// Daftar siswa dalam satu rombel (kelas jurusan) yang BELUM
// tergabung di kelas ini — dipakai buat isi pilihan pas admin klik
// "Tambah Siswa" (pilih rombel dulu, baru muncul daftar siswanya).
// ------------------------------------------------------------

export async function GET(request: NextRequest, { params }: KonteksRute) {
  try {
    await wajibAdminSaja(request);
    const { id: kelasId } = await params;

    const rombelId = request.nextUrl.searchParams.get("rombelId");
    if (!rombelId) {
      return NextResponse.json({ pesan: "rombelId wajib diisi" }, { status: 400 });
    }

    const siswaTersedia = await db.siswa.findMany({
      where: {
        rombelId,
        kelasDiikuti: { none: { kelasId } },
      },
      select: { id: true, nama: true, nis: true, fotoProfil: true },
      orderBy: { nama: "asc" },
    });

    return NextResponse.json({
      data: siswaTersedia.map((s) => ({ ...s, nis: s.nis.toString() })),
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

// ------------------------------------------------------------
// POST /api/kelas/[id]/siswa — tambah satu siswa ke kelas
// Body: { siswaId: string }
// ------------------------------------------------------------

export async function POST(request: NextRequest, { params }: KonteksRute) {
  try {
    await wajibAdminSaja(request);
    const { id: kelasId } = await params;

    const body = await request.json().catch(() => null);
    const inputIds: unknown[] = Array.isArray(body?.siswaIds)
      ? body.siswaIds
      : body?.siswaId
        ? [body.siswaId]
        : [];

    const siswaIds: string[] = inputIds
      .filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
      .map((value: string) => value.trim());

    if (siswaIds.length === 0) {
      return NextResponse.json({ pesan: "siswaId atau siswaIds wajib diisi" }, { status: 400 });
    }

    const siswaSudahAda = await db.kelasSiswa.findMany({
      where: {
        kelasId,
        siswaId: { in: siswaIds },
      },
      select: { siswaId: true },
    });

    const siswaIdSet = new Set<string>(siswaSudahAda.map((item) => item.siswaId));
    const siswaBaru: string[] = siswaIds.filter((siswaId: string) => !siswaIdSet.has(siswaId));

    if (siswaBaru.length === 0) {
      return NextResponse.json({
        pesan: "Semua siswa yang dipilih sudah terdaftar di kelas ini",
        data: { ditambahkan: 0 },
      }, { status: 200 });
    }

    await db.kelasSiswa.createMany({
      data: siswaBaru.map((siswaId: string) => ({ kelasId, siswaId })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      pesan: siswaBaru.length === 1 ? "Siswa berhasil ditambahkan" : `${siswaBaru.length} siswa berhasil ditambahkan`,
      data: { ditambahkan: siswaBaru.length },
    }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { pesan: "Siswa ini sudah ada di kelas" },
        { status: 409 }
      );
    }

    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}