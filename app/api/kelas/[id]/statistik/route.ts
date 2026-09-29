import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tanganiErrorRbac, wajibAdminTier } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: KonteksRute) {
  try {
    await wajibAdminTier(request);
    const { id } = await params;

    const kelas = await db.kelas.findUnique({
      where: { id },
      select: {
        siswa: {
          select: { siswa: { select: { id: true, nama: true } } },
        },
        guru: {
          select: { guru: { select: { id: true, nama: true } } },
        },
        tugas: {
          select: { tugas: { select: { id: true, guruId: true } } },
        },
        asesmen: {
          where: { asesmen: { status: "SELESAI" } },
          select: { asesmen: { select: { id: true, guruId: true } } },
        },
        materi: { select: { guruId: true } },
      },
    });

    if (!kelas) {
      return NextResponse.json({ pesan: "Kelas tidak ditemukan" }, { status: 404 });
    }

    const tugas = kelas.tugas.map(({ tugas }) => tugas);
    const asesmen = kelas.asesmen.map(({ asesmen }) => asesmen);
    const tugasIds = tugas.map((item) => item.id);
    const asesmenIds = asesmen.map((item) => item.id);
    const siswa = kelas.siswa.map(({ siswa }) => siswa);
    const siswaIds = new Set(siswa.map((item) => item.id));

    const [submissionTugas, submissionAsesmen] = await Promise.all([
      db.submissionTugas.findMany({
        where: { tugasId: { in: tugasIds } },
        select: { tugasId: true, siswaId: true },
      }),
      db.submissionAsesmen.findMany({
        where: {
          asesmenId: { in: asesmenIds },
          siswaId: { in: Array.from(siswaIds) },
        },
        select: { asesmenId: true, siswaId: true },
      }),
    ]);

    const aktivitasSiswaSelesai = new Map<string, number>();
    for (const submission of [...submissionTugas, ...submissionAsesmen]) {
      if (siswaIds.has(submission.siswaId)) {
        aktivitasSiswaSelesai.set(
          submission.siswaId,
          (aktivitasSiswaSelesai.get(submission.siswaId) ?? 0) + 1
        );
      }
    }

    const totalAktivitas = tugas.length + asesmen.length;
    const aktivitasSiswa = totalAktivitas
      ? siswa
          .map((item) => ({
            label: item.nama.split(/\s+/)[0],
            nilai: Math.round(
              ((aktivitasSiswaSelesai.get(item.id) ?? 0) / totalAktivitas) * 100
            ),
          }))
          .sort((a, b) => a.label.localeCompare(b.label, "id"))
      : [];

    const guruUnik = new Map(
      kelas.guru.map(({ guru }) => [guru.id, guru])
    );
    const jumlahAktivitasGuru = new Map<string, number>();
    const catatAktivitasGuru = (guruId: string) => {
      jumlahAktivitasGuru.set(
        guruId,
        (jumlahAktivitasGuru.get(guruId) ?? 0) + 1
      );
    };

    tugas.forEach((item) => catatAktivitasGuru(item.guruId));
    asesmen.forEach((item) => catatAktivitasGuru(item.guruId));
    kelas.materi.forEach((item) => catatAktivitasGuru(item.guruId));

    const aktivitasGuru = Array.from(guruUnik.values())
      .map((guru) => ({
        label: guru.nama,
        jumlah: jumlahAktivitasGuru.get(guru.id) ?? 0,
      }))
      .filter((item) => item.jumlah > 0)
      .sort((a, b) => b.jumlah - a.jumlah);

    return NextResponse.json({ data: { aktivitasSiswa, aktivitasGuru } });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}