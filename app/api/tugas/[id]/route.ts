import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  wajibLogin,
  wajibGuru,
  wajibGuruPemilik,
  tanganiErrorRbac,
  ForbiddenError,
} from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: KonteksRute) {
  try {
    const sesi = await wajibLogin(request);
    const { id } = await params;

    const tugas = await db.tugas.findUnique({
      where: { id },
      include: {
        guru: { select: { id: true, nama: true } },
        kelasTujuan: { include: { kelas: { select: { id: true, judul: true } } } },
        submission: {
          select: { id: true, siswaId: true, fileUrl: true, waktuKumpul: true },
        },
      },
    });
    if (!tugas) {
      return NextResponse.json({ pesan: "Tugas tidak ditemukan" }, { status: 404 });
    }

    // ----- GURU: pemilik tugas -----
    if (sesi.role === "GURU") {
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
    }

    // ----- SISWA: hanya kalau tugas dikirim ke kelas yang diikutinya -----
    if (sesi.role === "SISWA") {
      const kelasTujuanIds = tugas.kelasTujuan.map((kt) => kt.kelas.id);

      const siswaIkutKelas = kelasTujuanIds.length
        ? await db.kelasSiswa.findFirst({
            where: { siswaId: sesi.userId, kelasId: { in: kelasTujuanIds } },
          })
        : null;

      if (!siswaIkutKelas) {
        throw new ForbiddenError("Tugas ini tidak dikirim ke kelasmu");
      }

      const submissionSaya = tugas.submission.find(
        (s) => s.siswaId === sesi.userId
      );

      return NextResponse.json({
        data: {
          id: tugas.id,
          judul: tugas.judul,
          deskripsi: tugas.deskripsi,
          tipeLampiran: tugas.tipeLampiran,
          lampiran: tugas.lampiran,
          createdAt: tugas.createdAt,
          guru: tugas.guru,
          kelasTujuan: tugas.kelasTujuan.map((kt) => kt.kelas),
          submission: submissionSaya
            ? {
                fileUrl: submissionSaya.fileUrl,
                waktuKumpul: submissionSaya.waktuKumpul,
              }
            : null,
        },
      });
    }

    // Admin/Kepsek/Kurikulum belum ada kebutuhan lihat detail tugas
    throw new ForbiddenError();
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