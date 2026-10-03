import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibKurikulum, tanganiErrorRbac } from "@/lib/rbac";

type Periode = "semua" | "30hari";

function kunci(kelasId: string, guruId: string) {
  return `${kelasId}:${guruId}`;
}

function bulatkan(nilai: number) {
  return Math.round(nilai * 100) / 100;
}

export async function GET(request: NextRequest) {
  try {
    await wajibKurikulum(request);

    const periodeMasuk = request.nextUrl.searchParams.get("periode");
    if (periodeMasuk && periodeMasuk !== "semua" && periodeMasuk !== "30hari") {
      return NextResponse.json(
        { pesan: "Periode harus 'semua' atau '30hari'" },
        { status: 400 }
      );
    }

    const periode: Periode = periodeMasuk === "30hari" ? "30hari" : "semua";
    const mulaiPeriode = periode === "30hari"
      ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      : null;

    const daftarKelas = await db.kelas.findMany({
      orderBy: { judul: "asc" },
      select: {
        id: true,
        judul: true,
        guru: {
          select: {
            guru: { select: { id: true, nama: true } },
            mapel: { select: { nama: true } },
          },
        },
      },
    });

    const kelasIds = daftarKelas.map((kelas) => kelas.id);
    const filterWaktu = mulaiPeriode ? { gte: mulaiPeriode } : undefined;

    const [daftarSubmission, asesmenKelas, daftarMateri, daftarTugasKelas] =
      await Promise.all([
        db.submissionAsesmen.findMany({
          where: {
            kelasId: { in: kelasIds },
            waktuSelesai: { not: null },
            nilai: { not: null },
          },
          select: {
            kelasId: true,
            asesmenId: true,
            siswaId: true,
            nilai: true,
            siswa: { select: { id: true, nama: true } },
          },
        }),
        db.asesmenKelas.findMany({
          where: { kelasId: { in: kelasIds } },
          select: {
            kelasId: true,
            asesmen: {
              select: { id: true, guruId: true, createdAt: true },
            },
          },
        }),
        db.materi.findMany({
          where: {
            kelasId: { in: kelasIds },
            ...(filterWaktu ? { createdAt: filterWaktu } : {}),
          },
          select: { kelasId: true, guruId: true },
        }),
        db.tugasKelas.findMany({
          where: {
            kelasId: { in: kelasIds },
            ...(filterWaktu ? { dikirimAt: filterWaktu } : {}),
          },
          select: {
            kelasId: true,
            tugas: { select: { guruId: true } },
          },
        }),
      ]);

    const nilaiPerAsesmenKelas = new Map<string, { jumlah: number; total: number }>();
    const nilaiPerSiswaKelas = new Map<
      string,
      { id: string; nama: string; jumlah: number; total: number }
    >();
    const nilaiPerKelas = new Map<string, { jumlah: number; total: number; siswa: Set<string> }>();

    for (const submission of daftarSubmission) {
      const nilai = submission.nilai;
      if (nilai === null) continue;

      const kunciKelasAsesmen = `${submission.kelasId}:${submission.asesmenId}`;
      const nilaiAsesmen = nilaiPerAsesmenKelas.get(kunciKelasAsesmen) ?? { jumlah: 0, total: 0 };
      nilaiAsesmen.jumlah += 1;
      nilaiAsesmen.total += nilai;
      nilaiPerAsesmenKelas.set(kunciKelasAsesmen, nilaiAsesmen);

      const kunciSiswa = `${submission.kelasId}:${submission.siswaId}`;
      const nilaiSiswa = nilaiPerSiswaKelas.get(kunciSiswa) ?? {
        id: submission.siswa.id,
        nama: submission.siswa.nama,
        jumlah: 0,
        total: 0,
      };
      nilaiSiswa.jumlah += 1;
      nilaiSiswa.total += nilai;
      nilaiPerSiswaKelas.set(kunciSiswa, nilaiSiswa);

      const nilaiKelas = nilaiPerKelas.get(submission.kelasId) ?? {
        jumlah: 0,
        total: 0,
        siswa: new Set<string>(),
      };
      nilaiKelas.jumlah += 1;
      nilaiKelas.total += nilai;
      nilaiKelas.siswa.add(submission.siswaId);
      nilaiPerKelas.set(submission.kelasId, nilaiKelas);
    }

    const kinerjaGuru = new Map<string, { totalNilai: number; jumlahNilai: number; jumlahAktivitas: number }>();
    for (const kelas of daftarKelas) {
      for (const relasi of kelas.guru) {
        kinerjaGuru.set(kunci(kelas.id, relasi.guru.id), {
          totalNilai: 0,
          jumlahNilai: 0,
          jumlahAktivitas: 0,
        });
      }
    }

    for (const relasi of asesmenKelas) {
      const metrik = kinerjaGuru.get(kunci(relasi.kelasId, relasi.asesmen.guruId));
      if (!metrik) continue;

      const nilai = nilaiPerAsesmenKelas.get(`${relasi.kelasId}:${relasi.asesmen.id}`);
      if (nilai) {
        metrik.totalNilai += nilai.total;
        metrik.jumlahNilai += nilai.jumlah;
      }
      if (!mulaiPeriode || relasi.asesmen.createdAt >= mulaiPeriode) {
        metrik.jumlahAktivitas += 1;
      }
    }

    for (const materi of daftarMateri) {
      const metrik = kinerjaGuru.get(kunci(materi.kelasId, materi.guruId));
      if (metrik) metrik.jumlahAktivitas += 1;
    }

    for (const tugas of daftarTugasKelas) {
      const metrik = kinerjaGuru.get(kunci(tugas.kelasId, tugas.tugas.guruId));
      if (metrik) metrik.jumlahAktivitas += 1;
    }

    const hasilKelas = daftarKelas.map((kelas) => {
      const ringkasanNilai = nilaiPerKelas.get(kelas.id);
      const siswaDenganNilai = Array.from(nilaiPerSiswaKelas.entries())
        .filter(([kunciSiswa]) => kunciSiswa.startsWith(`${kelas.id}:`))
        .map(([, siswa]) => ({
          id: siswa.id,
          nama: siswa.nama,
          rataRata: siswa.total / siswa.jumlah,
        }));

      const siswaTerurut = siswaDenganNilai.sort((a, b) => a.rataRata - b.rataRata || a.nama.localeCompare(b.nama, "id"));
      const daftarGuru = kelas.guru.map((relasi) => {
        const metrik = kinerjaGuru.get(kunci(kelas.id, relasi.guru.id)) ?? {
          totalNilai: 0,
          jumlahNilai: 0,
          jumlahAktivitas: 0,
        };
        const rataRataNilai = metrik.jumlahNilai ? metrik.totalNilai / metrik.jumlahNilai : null;
        const skorKeaktifan = Math.min(metrik.jumlahAktivitas * 10, 100);
        // Bobot 70/30 dapat disesuaikan sesuai kebijakan penilaian sekolah.
        const skorKinerja = ((rataRataNilai ?? 0) * 0.7) + (skorKeaktifan * 0.3);

        return {
          id: relasi.guru.id,
          nama: relasi.guru.nama,
          mapel: relasi.mapel.nama,
          rataRataNilai: rataRataNilai === null ? null : bulatkan(rataRataNilai),
          jumlahAktivitas: metrik.jumlahAktivitas,
          skorKeaktifan,
          skorKinerja: bulatkan(skorKinerja),
        };
      });

      const rataRataNilaiKelas = ringkasanNilai
        ? ringkasanNilai.total / ringkasanNilai.jumlah
        : null;
      const rataRataKinerjaGuru = daftarGuru.length
        ? daftarGuru.reduce((total, guru) => total + guru.skorKinerja, 0) / daftarGuru.length
        : null;
      const komponenSkor = [rataRataNilaiKelas, rataRataKinerjaGuru]
        .filter((nilai): nilai is number => nilai !== null);
      const skorKeseluruhanKelas = komponenSkor.length
        ? bulatkan(komponenSkor.reduce((total, nilai) => total + nilai, 0) / komponenSkor.length)
        : 0;

      return {
        id: kelas.id,
        judul: kelas.judul,
        rataRataNilaiKelas: rataRataNilaiKelas === null ? null : bulatkan(rataRataNilaiKelas),
        totalSiswaMengerjakan: ringkasanNilai?.siswa.size ?? 0,
        siswaTertinggi: siswaTerurut.length
          ? { ...siswaTerurut[siswaTerurut.length - 1], rataRata: bulatkan(siswaTerurut[siswaTerurut.length - 1].rataRata) }
          : null,
        siswaTerendah: siswaTerurut.length
          ? { ...siswaTerurut[0], rataRata: bulatkan(siswaTerurut[0].rataRata) }
          : null,
        guru: daftarGuru,
        skorKeseluruhanKelas,
      };
    }).sort((a, b) => b.skorKeseluruhanKelas - a.skorKeseluruhanKelas || a.judul.localeCompare(b.judul, "id"));

    const kelasTerbaik = hasilKelas[0];
    const kelasTerendah = hasilKelas[hasilKelas.length - 1];

    return NextResponse.json({
      data: {
        periode,
        kelas: hasilKelas,
        ringkasan: {
          kelasTerbaik: kelasTerbaik
            ? { id: kelasTerbaik.id, judul: kelasTerbaik.judul, skor: kelasTerbaik.skorKeseluruhanKelas }
            : null,
          kelasTerendah: kelasTerendah
            ? { id: kelasTerendah.id, judul: kelasTerendah.judul, skor: kelasTerendah.skorKeseluruhanKelas }
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Gagal memuat rekap nilai kurikulum:", error);
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}