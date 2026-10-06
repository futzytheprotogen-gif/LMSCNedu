import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tanganiErrorRbac, wajibGuru, wajibGuruPemilik } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: KonteksRute) {
  try {
    const sesi = await wajibGuru(request);
    const { id } = await params;
    const asesmen = await db.asesmen.findUnique({
      where: { id },
      include: {
        soal: {
          orderBy: { urutan: "asc" },
          select: { id: true, tipe: true, pertanyaan: true, opsi: { select: { id: true, teks: true, benar: true } } },
        },
      },
    });

    if (!asesmen) {
      return NextResponse.json({ pesan: "Asesmen tidak ditemukan" }, { status: 404 });
    }
    wajibGuruPemilik(sesi, asesmen.guruId);

    const submissions = await db.submissionAsesmen.findMany({
      where: { asesmenId: id },
      orderBy: { waktuSelesai: "desc" },
      include: {
        siswa: { select: { id: true, nama: true, nis: true } },
        jawaban: {
          include: {
            opsiDipilih: { include: { opsi: { select: { id: true, teks: true } } } },
          },
        },
        catatanIntegritas: {
          orderBy: { terdeteksiPada: "asc" },
          select: { id: true, jenis: true, terdeteksiPada: true, createdAt: true },
        },
      },
    });

    return NextResponse.json({
      data: {
        id: asesmen.id,
        judul: asesmen.judul,
        status: asesmen.status,
        soal: asesmen.soal,
        pengumpulan: submissions.map((submission) => ({
          id: submission.id,
          nilai: submission.nilai,
          waktuSelesai: submission.waktuSelesai?.toISOString() ?? null,
          integritasDicatat: submission.integritasDicatat,
          siswa: { ...submission.siswa, nis: submission.siswa.nis.toString() },
          catatanIntegritas: submission.catatanIntegritas.map((catatan) => ({
            ...catatan,
            terdeteksiPada: catatan.terdeteksiPada.toISOString(),
            createdAt: catatan.createdAt.toISOString(),
          })),
          jawaban: asesmen.soal.map((soal) => {
            const jawaban = submission.jawaban.find((item) => item.soalId === soal.id);
            return {
              soalId: soal.id,
              jawabanEssay: jawaban?.jawabanEssay ?? null,
              opsiDipilih: jawaban?.opsiDipilih.map(({ opsi }) => opsi) ?? [],
            };
          }),
        })),
      },
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

interface BodyNilai {
  submissionId?: string;
  nilai?: number;
}

export async function PATCH(request: NextRequest, { params }: KonteksRute) {
  try {
    const sesi = await wajibGuru(request);
    const { id } = await params;
    const asesmen = await db.asesmen.findUnique({ where: { id } });
    if (!asesmen) {
      return NextResponse.json({ pesan: "Asesmen tidak ditemukan" }, { status: 404 });
    }
    wajibGuruPemilik(sesi, asesmen.guruId);

    const body: BodyNilai = await request.json().catch(() => ({}));
    if (
      !body.submissionId ||
      typeof body.nilai !== "number" ||
      !Number.isFinite(body.nilai) ||
      body.nilai < 0 ||
      body.nilai > 100
    ) {
      return NextResponse.json({ pesan: "Nilai harus berupa angka dari 0 sampai 100" }, { status: 400 });
    }

    const submission = await db.submissionAsesmen.findFirst({
      where: { id: body.submissionId, asesmenId: id },
      select: { id: true },
    });
    if (!submission) {
      return NextResponse.json({ pesan: "Pengumpulan tidak ditemukan" }, { status: 404 });
    }

    const hasil = await db.submissionAsesmen.update({
      where: { id: submission.id },
      data: { nilai: body.nilai },
      select: { id: true, nilai: true },
    });

    return NextResponse.json({ data: hasil });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}