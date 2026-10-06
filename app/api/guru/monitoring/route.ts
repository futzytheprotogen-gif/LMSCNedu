import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibGuru, tanganiErrorRbac } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const sesi = await wajibGuru(request);
    const kelasGuru = await db.kelasGuru.findMany({
      where: { guruId: sesi.userId },
      select: { kelasId: true },
    });
    const kelasIds = [...new Set(kelasGuru.map((kelas) => kelas.kelasId))];

    if (kelasIds.length === 0) {
      return NextResponse.json({
        data: {
          ringkasan: {
            rataRataNilai: null,
            nilaiTertinggi: null,
            siswaNilaiTertinggi: null,
            tingkatPengumpulanTugas: null,
            jumlahTugasDikumpulkan: 0,
            jumlahTugasDitugaskan: 0,
          },
          peringkatNilai: [],
          peringkatTugas: [],
        },
      });
    }

    const [siswaKelas, daftarSubmissionNilai, daftarTugas] = await Promise.all([
      db.kelasSiswa.findMany({
        where: { kelasId: { in: kelasIds } },
        select: {
          kelasId: true,
          siswaId: true,
          siswa: { select: { nama: true } },
        },
      }),
      db.submissionAsesmen.findMany({
        where: {
          asesmen: {
            is: {
              guruId: sesi.userId,
              status: "SELESAI",
              kelasTujuan: { some: { kelasId: { in: kelasIds } } },
            },
          },
          waktuSelesai: { not: null },
          nilai: { not: null },
        },
        select: {
          siswaId: true,
          nilai: true,
          siswa: { select: { nama: true } },
        },
      }),
      db.tugas.findMany({
        where: {
          guruId: sesi.userId,
          kelasTujuan: { some: { kelasId: { in: kelasIds } } },
        },
        select: {
          kelasTujuan: { select: { kelasId: true } },
          submission: { select: { siswaId: true } },
        },
      }),
    ]);

    const namaSiswa = new Map<string, string>();
    const siswaPerKelas = new Map<string, Set<string>>();
    for (const keanggotaan of siswaKelas) {
      namaSiswa.set(keanggotaan.siswaId, keanggotaan.siswa.nama);
      const siswaDiKelas = siswaPerKelas.get(keanggotaan.kelasId) ?? new Set<string>();
      siswaDiKelas.add(keanggotaan.siswaId);
      siswaPerKelas.set(keanggotaan.kelasId, siswaDiKelas);
    }

    const nilaiSiswa = new Map<string, { nama: string; total: number; jumlah: number }>();
    let totalNilai = 0;
    let jumlahNilai = 0;
    let nilaiTertinggi: number | null = null;
    let siswaNilaiTertinggi: string | null = null;
    for (const submission of daftarSubmissionNilai) {
      if (submission.nilai === null) continue;
      const dataSiswa = nilaiSiswa.get(submission.siswaId) ?? {
        nama: submission.siswa.nama,
        total: 0,
        jumlah: 0,
      };
      dataSiswa.total += submission.nilai;
      dataSiswa.jumlah += 1;
      nilaiSiswa.set(submission.siswaId, dataSiswa);
      totalNilai += submission.nilai;
      jumlahNilai += 1;
      if (nilaiTertinggi === null || submission.nilai > nilaiTertinggi) {
        nilaiTertinggi = submission.nilai;
        siswaNilaiTertinggi = submission.siswa.nama;
      }
    }

    const tugasSiswa = new Map<string, { dikumpulkan: number; ditugaskan: number }>();
    for (const siswaId of namaSiswa.keys()) {
      tugasSiswa.set(siswaId, { dikumpulkan: 0, ditugaskan: 0 });
    }

    for (const tugas of daftarTugas) {
      const siswaDitugasi = new Set(
        tugas.kelasTujuan.flatMap(({ kelasId }) => [...(siswaPerKelas.get(kelasId) ?? [])])
      );
      const siswaSudahMengumpulkan = new Set(tugas.submission.map((item) => item.siswaId));
      for (const siswaId of siswaDitugasi) {
        const dataSiswa = tugasSiswa.get(siswaId);
        if (!dataSiswa) continue;
        dataSiswa.ditugaskan += 1;
        if (siswaSudahMengumpulkan.has(siswaId)) dataSiswa.dikumpulkan += 1;
      }
    }

    const peringkatNilai = [...nilaiSiswa.entries()]
      .map(([id, data]) => ({
        id,
        nama: data.nama,
        nilaiRataRata: Math.round((data.total / data.jumlah) * 100) / 100,
        jumlahAsesmen: data.jumlah,
      }))
      .sort((a, b) => b.nilaiRataRata - a.nilaiRataRata || b.jumlahAsesmen - a.jumlahAsesmen || a.nama.localeCompare(b.nama, "id"))
      .slice(0, 5);

    const peringkatTugas = [...tugasSiswa.entries()]
      .map(([id, data]) => ({
        id,
        nama: namaSiswa.get(id) ?? "Siswa",
        jumlahDikumpulkan: data.dikumpulkan,
        jumlahDitugaskan: data.ditugaskan,
        persentase: data.ditugaskan ? Math.round((data.dikumpulkan / data.ditugaskan) * 100) : 0,
      }))
      .filter((siswa) => siswa.jumlahDitugaskan > 0)
      .sort((a, b) => b.persentase - a.persentase || b.jumlahDikumpulkan - a.jumlahDikumpulkan || a.nama.localeCompare(b.nama, "id"))
      .slice(0, 5);

    const jumlahTugasDikumpulkan = [...tugasSiswa.values()].reduce((total, data) => total + data.dikumpulkan, 0);
    const jumlahTugasDitugaskan = [...tugasSiswa.values()].reduce((total, data) => total + data.ditugaskan, 0);

    return NextResponse.json({
      data: {
        ringkasan: {
          rataRataNilai: jumlahNilai ? Math.round((totalNilai / jumlahNilai) * 100) / 100 : null,
          nilaiTertinggi,
          siswaNilaiTertinggi,
          tingkatPengumpulanTugas: jumlahTugasDitugaskan
            ? Math.round((jumlahTugasDikumpulkan / jumlahTugasDitugaskan) * 100)
            : null,
          jumlahTugasDikumpulkan,
          jumlahTugasDitugaskan,
        },
        peringkatNilai,
        peringkatTugas,
      },
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}