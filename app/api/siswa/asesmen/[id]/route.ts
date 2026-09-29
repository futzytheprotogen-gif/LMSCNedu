import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tanganiErrorRbac, wajibSiswa } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

interface JawabanInput {
  soalId: string;
  opsiIds?: string[];
  jawabanEssay?: string;
}

interface BodySubmit {
  jawaban?: JawabanInput[];
}

async function ambilKeanggotaanSiswa(siswaId: string) {
  return db.kelasSiswa.findMany({
    where: { siswaId },
    select: { kelasId: true },
  });
}

export async function GET(request: NextRequest, { params }: KonteksRute) {
  try {
    const sesi = await wajibSiswa(request);
    const { id } = await params;
    const keanggotaan = await ambilKeanggotaanSiswa(sesi.userId);
    const kelasIds = keanggotaan.map((item) => item.kelasId);

    const asesmen = await db.asesmen.findFirst({
      where: {
        id,
        status: "SELESAI",
        kelasTujuan: { some: { kelasId: { in: kelasIds } } },
      },
      include: {
        mapel: { select: { nama: true } },
        guru: { select: { nama: true } },
        soal: {
          orderBy: { urutan: "asc" },
          include: { opsi: { select: { id: true, teks: true } } },
        },
        kelasTujuan: {
          where: { kelasId: { in: kelasIds } },
          select: { kelas: { select: { id: true, judul: true } } },
        },
        submission: {
          where: { siswaId: sesi.userId },
          select: { nilai: true, waktuSelesai: true },
        },
      },
    });

    if (!asesmen) {
      return NextResponse.json({ pesan: "Asesmen tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: asesmen.id,
        judul: asesmen.judul,
        tipe: asesmen.tipe,
        durasiMenit: asesmen.durasiMenit,
        mapel: asesmen.mapel.nama,
        guru: asesmen.guru.nama,
        kelasTujuan: asesmen.kelasTujuan.map(({ kelas }) => kelas),
        soal: asesmen.soal,
        submission: asesmen.submission[0]
          ? {
              nilai: asesmen.submission[0].nilai,
              waktuSelesai: asesmen.submission[0].waktuSelesai?.toISOString() ?? null,
            }
          : null,
      },
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

export async function POST(request: NextRequest, { params }: KonteksRute) {
  try {
    const sesi = await wajibSiswa(request);
    const { id } = await params;
    const body: BodySubmit = await request.json().catch(() => ({}));
    const keanggotaan = await ambilKeanggotaanSiswa(sesi.userId);
    const kelasIds = keanggotaan.map((item) => item.kelasId);

    const asesmen = await db.asesmen.findFirst({
      where: {
        id,
        status: "SELESAI",
        kelasTujuan: { some: { kelasId: { in: kelasIds } } },
      },
      include: {
        soal: { orderBy: { urutan: "asc" }, include: { opsi: true } },
        kelasTujuan: {
          where: { kelasId: { in: kelasIds } },
          select: { kelasId: true },
        },
        submission: { where: { siswaId: sesi.userId }, select: { id: true } },
      },
    });

    if (!asesmen) {
      return NextResponse.json({ pesan: "Asesmen tidak ditemukan" }, { status: 404 });
    }
    if (asesmen.submission.length > 0) {
      return NextResponse.json({ pesan: "Asesmen ini sudah kamu kumpulkan" }, { status: 409 });
    }
    if (
      !Array.isArray(body.jawaban) ||
      body.jawaban.length !== asesmen.soal.length ||
      body.jawaban.some(
        (item) =>
          !item ||
          typeof item.soalId !== "string" ||
          (item.jawabanEssay !== undefined && typeof item.jawabanEssay !== "string") ||
          (item.opsiIds !== undefined &&
            (!Array.isArray(item.opsiIds) || item.opsiIds.some((opsiId) => typeof opsiId !== "string")))
      )
    ) {
      return NextResponse.json({ pesan: "Semua soal wajib dijawab" }, { status: 400 });
    }

    const jawabanBySoal = new Map(body.jawaban.map((item) => [item.soalId, item]));
    if (jawabanBySoal.size !== asesmen.soal.length) {
      return NextResponse.json({ pesan: "Jawaban soal tidak valid" }, { status: 400 });
    }

    let jumlahBenar = 0;
    let jumlahObjektif = 0;
    let adaEssay = false;
    const jawabanTersimpan = [];

    for (const soal of asesmen.soal) {
      const jawaban = jawabanBySoal.get(soal.id);
      if (!jawaban) {
        return NextResponse.json({ pesan: "Jawaban soal tidak valid" }, { status: 400 });
      }

      if (soal.tipe === "ESSAY") {
        const jawabanEssay = jawaban.jawabanEssay?.trim();
        if (!jawabanEssay) {
          return NextResponse.json({ pesan: "Semua soal wajib dijawab" }, { status: 400 });
        }
        adaEssay = true;
        jawabanTersimpan.push({ soalId: soal.id, jawabanEssay, opsiIds: [] as string[] });
        continue;
      }

      const opsiIds = jawaban.opsiIds ?? [];
      const opsiValid = new Set(soal.opsi.map((opsi) => opsi.id));
      if (
        opsiIds.length === 0 ||
        new Set(opsiIds).size !== opsiIds.length ||
        opsiIds.some((opsiId) => !opsiValid.has(opsiId)) ||
        (soal.tipe === "PILIHAN_GANDA" && opsiIds.length !== 1)
      ) {
        return NextResponse.json({ pesan: "Pilihan jawaban tidak valid" }, { status: 400 });
      }

      const benar = soal.opsi.filter((opsi) => opsi.benar).map((opsi) => opsi.id);
      if (
        opsiIds.length === benar.length &&
        opsiIds.every((opsiId) => benar.includes(opsiId))
      ) {
        jumlahBenar += 1;
      }
      jumlahObjektif += 1;
      jawabanTersimpan.push({ soalId: soal.id, jawabanEssay: null, opsiIds });
    }

    const submission = await db.submissionAsesmen.create({
      data: {
        asesmenId: asesmen.id,
        siswaId: sesi.userId,
        kelasId: asesmen.kelasTujuan[0].kelasId,
        waktuSelesai: new Date(),
        nilai: adaEssay || jumlahObjektif === 0
          ? null
          : Math.round((jumlahBenar / jumlahObjektif) * 100),
        jawaban: {
          create: jawabanTersimpan.map((item) => ({
            soalId: item.soalId,
            jawabanEssay: item.jawabanEssay,
            opsiDipilih: item.opsiIds.length
              ? { create: item.opsiIds.map((opsiId) => ({ opsiId })) }
              : undefined,
          })),
        },
      },
    });

    return NextResponse.json(
      { data: { nilai: submission.nilai, waktuSelesai: submission.waktuSelesai } },
      { status: 201 }
    );
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}