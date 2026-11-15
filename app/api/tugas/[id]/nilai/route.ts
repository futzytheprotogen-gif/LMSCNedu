import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibGuru, wajibGuruPemilik, tanganiErrorRbac } from "@/lib/rbac";
import { buatWorkbookNilaiSemuaKelas, responseFileExcel, type BarisNilai } from "@/lib/excel";

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
        kelasTujuan: {
          include: {
            kelas: {
              select: {
                id: true,
                judul: true,
                siswa: {
                  include: {
                    siswa: {
                      select: {
                        id: true,
                        nama: true,
                        nis: true,
                        rombel: { select: { label: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        submission: {
          select: {
            siswaId: true,
            nilai: true,
            siswa: {
              select: {
                nama: true,
                nis: true,
                rombel: { select: { label: true } },
              },
            },
          },
        },
      },
    });
    if (!tugas) {
      return NextResponse.json({ pesan: "Tugas tidak ditemukan." }, { status: 404 });
    }
    wajibGuruPemilik(sesi, tugas.guruId);

    const nilaiBySiswa = new Map(tugas.submission.map((item) => [item.siswaId, item.nilai]));
    const siswaTerdata = new Set<string>();
    const kelompok = tugas.kelasTujuan.map(({ kelas }) => {
      const baris: BarisNilai[] = [];
      for (const { siswa } of kelas.siswa) {
        if (siswaTerdata.has(siswa.id)) continue;
        siswaTerdata.add(siswa.id);
        baris.push({
          nama: siswa.nama,
          nis: siswa.nis.toString(),
          kelasJurusan: kelas.judul || siswa.rombel.label,
          mapel: `Tugas: ${tugas.judul}`,
          nilai: nilaiBySiswa.get(siswa.id) ?? null,
        });
      }
      return { namaKelas: kelas.judul, baris };
    });

    if (kelompok.length === 0) {
      kelompok.push({
        namaKelas: "Semua Siswa",
        baris: tugas.submission.map((item): BarisNilai => ({
          nama: item.siswa.nama,
          nis: item.siswa.nis.toString(),
          kelasJurusan: item.siswa.rombel.label,
          mapel: `Tugas: ${tugas.judul}`,
          nilai: item.nilai,
        })),
      });
    }

    const buffer = await buatWorkbookNilaiSemuaKelas(kelompok);
    const namaAman = tugas.judul
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "tugas";
    return responseFileExcel(buffer, `rekap-${namaAman}`);
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "File rekap tugas tidak dapat dibuat." }, { status: 500 })
    );
  }
}
