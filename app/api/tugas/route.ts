import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibGuru, tanganiErrorRbac } from "@/lib/rbac";

// GET /api/tugas — semua tugas milik guru yang login, lengkap sama
// daftar kelas tujuan (kalau ada). Guru sendiri yang misahin
// "Hari Ini" vs "Riwayat" di frontend berdasarkan createdAt.
export async function GET(request: NextRequest) {
  try {
    const sesi = await wajibGuru(request);

    const daftarTugas = await db.tugas.findMany({
      where: { guruId: sesi.userId },
      orderBy: { createdAt: "desc" },
      include: {
        kelasTujuan: { include: { kelas: { select: { id: true, judul: true } } } },
      },
    });

    return NextResponse.json({
      data: daftarTugas.map((t) => ({
        id: t.id,
        judul: t.judul,
        deskripsi: t.deskripsi,
        tipeLampiran: t.tipeLampiran,
        lampiran: t.lampiran,
        createdAt: t.createdAt,
        kelasTujuan: t.kelasTujuan.map((kt) => kt.kelas),
      })),
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

// POST /api/tugas — Body: { judul, deskripsi, tipeLampiran?: "PDF"|"LINK",
//   lampiran?: string, kelasIds?: string[] }
// kelasIds opsional — kalau kosong, tugas kesimpen sebagai draft
// (belum kekirim ke kelas manapun, siswa belum lihat apa-apa)
interface BodyBuatTugas {
  judul?: string;
  deskripsi?: string;
  tipeLampiran?: "PDF" | "LINK";
  lampiran?: string;
  kelasIds?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const sesi = await wajibGuru(request);

    const body: BodyBuatTugas = await request.json().catch(() => ({}));
    const { judul, deskripsi, tipeLampiran, lampiran, kelasIds } = body;

    if (!judul?.trim() || !deskripsi?.trim()) {
      return NextResponse.json(
        { pesan: "judul dan deskripsi wajib diisi" },
        { status: 400 }
      );
    }

    // Kalau langsung kirim ke kelas pas dibuat, pastikan guru beneran
    // ngajar di semua kelas yang dipilih
    if (kelasIds?.length) {
      const jumlahKelasValid = await db.kelasGuru.count({
        where: { guruId: sesi.userId, kelasId: { in: kelasIds } },
      });
      if (jumlahKelasValid === 0) {
        return NextResponse.json(
          { pesan: "Kamu tidak mengajar di kelas yang dipilih" },
          { status: 403 }
        );
      }
    }

    const tugasBaru = await db.tugas.create({
      data: {
        judul: judul.trim(),
        deskripsi: deskripsi.trim(),
        tipeLampiran: tipeLampiran ?? null,
        lampiran: lampiran || null,
        guruId: sesi.userId,
        kelasTujuan: kelasIds?.length
          ? { create: kelasIds.map((kelasId) => ({ kelasId })) }
          : undefined,
      },
    });

    return NextResponse.json({ data: tugasBaru }, { status: 201 });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}