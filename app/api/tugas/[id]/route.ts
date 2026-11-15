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
          select: {
            id: true,
            siswaId: true,
            fileUrl: true,
            waktuKumpul: true,
            nilai: true,
            catatanNilai: true,
          },
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
          deadlineAt: tugas.deadlineAt?.toISOString() ?? null,
          susulanAktif: tugas.susulanAktif,
          deadlineSusulan: tugas.deadlineSusulan?.toISOString() ?? null,
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
      const sekarang = new Date();
      const bolehKumpul = !tugas.deadlineAt ||
        sekarang <= tugas.deadlineAt ||
        (tugas.susulanAktif && !!tugas.deadlineSusulan && sekarang <= tugas.deadlineSusulan);

      return NextResponse.json({
        data: {
          id: tugas.id,
          judul: tugas.judul,
          deskripsi: tugas.deskripsi,
          tipeLampiran: tugas.tipeLampiran,
          lampiran: tugas.lampiran,
          deadlineAt: tugas.deadlineAt?.toISOString() ?? null,
          susulanAktif: tugas.susulanAktif,
          deadlineSusulan: tugas.deadlineSusulan?.toISOString() ?? null,
          bolehKumpul,
          createdAt: tugas.createdAt,
          guru: tugas.guru,
          kelasTujuan: tugas.kelasTujuan.map((kt) => kt.kelas),
          submission: submissionSaya
            ? {
                fileUrl: submissionSaya.fileUrl,
                waktuKumpul: submissionSaya.waktuKumpul,
                nilai: submissionSaya.nilai,
                catatanNilai: submissionSaya.catatanNilai,
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
  deadlineAt?: string | null;
  susulanAktif?: boolean;
  deadlineSusulan?: string | null;
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
    if (body.susulanAktif !== undefined && typeof body.susulanAktif !== "boolean") {
      return NextResponse.json({ pesan: "Pengaturan deadline susulan tidak valid." }, { status: 400 });
    }

    function bacaTanggal(value: string | null | undefined) {
      if (value === undefined) return null;
      if (value === null || value === "") return null;
      const tanggal = new Date(value);
      return Number.isNaN(tanggal.getTime()) ? undefined : tanggal;
    }

    const deadlineAt = body.deadlineAt === undefined ? tugas.deadlineAt : bacaTanggal(body.deadlineAt);
    const deadlineSusulan = body.deadlineSusulan === undefined
      ? tugas.deadlineSusulan
      : bacaTanggal(body.deadlineSusulan);
    const susulanAktif = body.susulanAktif ?? tugas.susulanAktif;
    if (deadlineAt === undefined || deadlineSusulan === undefined) {
      return NextResponse.json({ pesan: "Format deadline tidak valid." }, { status: 400 });
    }
    if (
      susulanAktif &&
      (!deadlineAt || !deadlineSusulan || deadlineSusulan <= deadlineAt)
    ) {
      return NextResponse.json(
        { pesan: "Deadline susulan harus diisi dan berada setelah deadline utama." },
        { status: 400 }
      );
    }

    const tugasTerupdate = await db.tugas.update({
      where: { id },
      data: {
        judul: body.judul?.trim(),
        deskripsi: body.deskripsi?.trim(),
        tipeLampiran: body.tipeLampiran,
        lampiran: body.lampiran,
        deadlineAt,
        susulanAktif,
        deadlineSusulan: susulanAktif ? deadlineSusulan : null,
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