import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { wajibAdminTier, wajibAdminSaja, tanganiErrorRbac } from "@/lib/rbac";

// ------------------------------------------------------------
// GET /api/kelas — daftar semua kelas (buat tab "Buat Kelas" Admin,
// dan tab "Kelas" read-only Kepsek/Kurikulum)
// ------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    await wajibAdminTier(request);

    const daftarKelas = await db.kelas.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { siswa: true } },
      },
    });

    return NextResponse.json({
      data: daftarKelas.map((kelas) => ({
        id: kelas.id,
        judul: kelas.judul,
        deskripsi: kelas.deskripsi,
        kodeKelas: kelas.kodeKelas,
        jumlahSiswa: kelas._count.siswa,
        createdAt: kelas.createdAt,
      })),
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

// ------------------------------------------------------------
// POST /api/kelas — buat kelas baru (Admin saja)
// Body: { judul: string, deskripsi?: string }
// ------------------------------------------------------------

interface BodyBuatKelas {
  judul?: string;
  deskripsi?: string;
}

export async function POST(request: NextRequest) {
  try {
    await wajibAdminSaja(request);

    let body: BodyBuatKelas;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ pesan: "Body request tidak valid" }, { status: 400 });
    }

    const judul = body.judul?.trim();
    if (!judul) {
      return NextResponse.json({ pesan: "Judul kelas wajib diisi" }, { status: 400 });
    }

    const kodeKelas = await buatKodeKelasUnik();

    const kelasBaru = await db.kelas.create({
      data: {
        judul,
        deskripsi: body.deskripsi?.trim() || null,
        kodeKelas,
      },
    });

    return NextResponse.json({ data: kelasBaru }, { status: 201 });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

// ------------------------------------------------------------
// Kode kelas 8 karakter hex (mis. "A3F9C102"), dipakai buat link
// undangan. Dicek unik dulu ke db sebelum dipakai (kans tabrakan
// sangat kecil, tapi tetap dijaga).
// ------------------------------------------------------------

async function buatKodeKelasUnik(): Promise<string> {
  for (let percobaan = 0; percobaan < 5; percobaan++) {
    const kode = randomBytes(4).toString("hex").toUpperCase();
    const sudahAda = await db.kelas.findUnique({ where: { kodeKelas: kode } });
    if (!sudahAda) return kode;
  }
  throw new Error("Gagal generate kode kelas unik, coba lagi");
}