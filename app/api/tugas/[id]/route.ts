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

    const tugas = await db.tugas.findUnique({
      where: { id },
      include: {
        kelasTujuan: { include: { kelas: { select: { id: true, judul: true } } } },
        submission: { select: { id: true, siswaId: true } },
      },
    });
    if (!tugas) {
      return NextResponse.json({ pesan: "Tugas tidak ditemukan" }, { status: 404 });
    }
    wajibGuruPemilik(sesi, tugas.guruId);

    return NextResponse.json({
      data: {
        id: tugas.id,
        judul: tugas.judul,
        deskripsi: tugas.deskripsi,
        tipeLampiran: tugas.tipeLampiran,
        lampiran: tugas.lampiran,
        createdAt: tugas.createdAt,
        kelasTujuan: tugas.kelasTujuan.map((kt) => kt.kelas),
        jumlahSubmission: tugas.submission.length,
      },
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

interface BodyEditTugas {
  judul?: string;
  deskripsi?: string;
  tipeLampiran?: "PDF" | "LINK" | null;
  lampiran?: string | null;
}

export async function PATCH(request: NextRequest, { params }: KonteksRute) {
  try {
    const sesi = await wajibGuru(request);
    const { id } = await params;

    const tugas = await db.tugas.findUnique({ where: { id } });
    if (!tugas) {
      return NextResponse.json({ pesan: "Tugas tidak ditemukan" }, { status: 404 });
    }
    wajibGuruPemilik(sesi, tugas.guruId);

    const body: BodyEditTugas = await request.json().catch(() => ({}));

    const tugasTerupdate = await db.tugas.update({
      where: { id },
      data: {
        judul: body.judul?.trim(),
        deskripsi: body.deskripsi?.trim(),
        tipeLampiran: body.tipeLampiran,
        lampiran: body.lampiran,
      },
    });

    return NextResponse.json({ data: tugasTerupdate });
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
    const { id } = await params;

    const tugas = await db.tugas.findUnique({ where: { id } });
    if (!tugas) {
      return NextResponse.json({ pesan: "Tugas tidak ditemukan" }, { status: 404 });
    }
    wajibGuruPemilik(sesi, tugas.guruId);

    await db.tugas.delete({ where: { id } });

    return NextResponse.json({ pesan: "Tugas berhasil dihapus" });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}