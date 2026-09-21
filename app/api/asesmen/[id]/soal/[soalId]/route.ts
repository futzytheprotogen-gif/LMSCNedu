import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibGuru, wajibGuruPemilik, tanganiErrorRbac } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string; soalId: string }>;
}

interface BodyEditSoal {
  pertanyaan?: string;
  gambar?: string;
  opsi?: { id?: string; teks: string; benar: boolean }[];
}

// PATCH /api/asesmen/[id]/soal/[soalId]
// Untuk simplicity, edit opsi jawaban dilakukan dengan cara hapus
// semua opsi lama lalu buat ulang dari body — lebih gampang dari
// nge-diff satu-satu opsi mana yang berubah/dihapus/ditambah.
export async function PATCH(request: NextRequest, { params }: KonteksRute) {
  try {
    const sesi = await wajibGuru(request);
    const { id, soalId } = await params;

    const asesmen = await db.asesmen.findUnique({ where: { id } });
    if (!asesmen) {
      return NextResponse.json({ pesan: "Asesmen tidak ditemukan" }, { status: 404 });
    }
    wajibGuruPemilik(sesi, asesmen.guruId);

    const soal = await db.soal.findUnique({ where: { id: soalId } });
    if (!soal || soal.asesmenId !== id) {
      return NextResponse.json({ pesan: "Soal tidak ditemukan" }, { status: 404 });
    }

    const body: BodyEditSoal = await request.json().catch(() => ({}));

    await db.$transaction(async (tx) => {
      await tx.soal.update({
        where: { id: soalId },
        data: {
          pertanyaan: body.pertanyaan?.trim(),
          gambar: body.gambar,
        },
      });

      if (body.opsi && soal.tipe !== "ESSAY") {
        await tx.opsiJawaban.deleteMany({ where: { soalId } });
        await tx.opsiJawaban.createMany({
          data: body.opsi.map((o) => ({ soalId, teks: o.teks, benar: o.benar })),
        });
      }
    });

    const soalTerupdate = await db.soal.findUnique({
      where: { id: soalId },
      include: { opsi: true },
    });

    return NextResponse.json({ data: soalTerupdate });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

export async function DELETE(request: NextRequest, { params }: KonteksRute) {
  try {
    const sesi = await wajibGuru(request);
    const { id, soalId } = await params;

    const asesmen = await db.asesmen.findUnique({ where: { id } });
    if (!asesmen) {
      return NextResponse.json({ pesan: "Asesmen tidak ditemukan" }, { status: 404 });
    }
    wajibGuruPemilik(sesi, asesmen.guruId);

    await db.soal.delete({ where: { id: soalId } });

    return NextResponse.json({ pesan: "Soal berhasil dihapus" });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}