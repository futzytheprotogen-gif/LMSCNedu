import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibGuru, wajibGuruPemilik, tanganiErrorRbac } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: KonteksRute) {
  try {
    const sesi = await wajibGuru(request);
    const { id } = await params;

    const asesmen = await db.asesmen.findUnique({ where: { id } });
    if (!asesmen) {
      return NextResponse.json({ pesan: "Asesmen tidak ditemukan" }, { status: 404 });
    }
    wajibGuruPemilik(sesi, asesmen.guruId);

    const daftarSoal = await db.soal.findMany({
      where: { asesmenId: id },
      orderBy: { urutan: "asc" },
      include: { opsi: true },
    });

    return NextResponse.json({ data: daftarSoal });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

// POST /api/asesmen/[id]/soal
// Body: { tipe: "PILIHAN_GANDA"|"CHECKBOX"|"ESSAY", pertanyaan: string,
//         gambar?: string, opsi?: { teks: string, benar: boolean }[] }
interface OpsiInput {
  teks: string;
  benar: boolean;
}
interface BodyTambahSoal {
  tipe?: "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";
  pertanyaan?: string;
  gambar?: string;
  opsi?: OpsiInput[];
}

export async function POST(request: NextRequest, { params }: KonteksRute) {
  try {
    const sesi = await wajibGuru(request);
    const { id } = await params;

    const asesmen = await db.asesmen.findUnique({ where: { id } });
    if (!asesmen) {
      return NextResponse.json({ pesan: "Asesmen tidak ditemukan" }, { status: 404 });
    }
    wajibGuruPemilik(sesi, asesmen.guruId);

    const body: BodyTambahSoal = await request.json().catch(() => ({}));
    const { tipe, pertanyaan, gambar, opsi } = body;

    if (!tipe || !pertanyaan?.trim()) {
      return NextResponse.json(
        { pesan: "tipe dan pertanyaan wajib diisi" },
        { status: 400 }
      );
    }

    if (tipe === "PILIHAN_GANDA") {
      const jumlahBenar = opsi?.filter((o) => o.benar).length ?? 0;
      if (!opsi || opsi.length < 2 || jumlahBenar !== 1) {
        return NextResponse.json(
          { pesan: "Pilihan Ganda butuh minimal 2 opsi dengan TEPAT 1 jawaban benar" },
          { status: 400 }
        );
      }
    }
    if (tipe === "CHECKBOX") {
      const jumlahBenar = opsi?.filter((o) => o.benar).length ?? 0;
      if (!opsi || opsi.length < 2 || jumlahBenar < 1) {
        return NextResponse.json(
          { pesan: "Checkbox butuh minimal 2 opsi dengan minimal 1 jawaban benar" },
          { status: 400 }
        );
      }
    }

    const urutanTerakhir = await db.soal.count({ where: { asesmenId: id } });

    const soalBaru = await db.soal.create({
      data: {
        asesmenId: id,
        tipe,
        pertanyaan: pertanyaan.trim(),
        gambar: gambar || null,
        urutan: urutanTerakhir,
        opsi:
          tipe !== "ESSAY" && opsi
            ? { create: opsi.map((o) => ({ teks: o.teks, benar: o.benar })) }
            : undefined,
      },
      include: { opsi: true },
    });

    return NextResponse.json({ data: soalBaru }, { status: 201 });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}