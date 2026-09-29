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
    const asesmen = await db.asesmen.findUnique({
      where: { id },
      include: {
        mapel: { select: { nama: true } },
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
            kelasId: true,
            nilai: true,
            siswa: { select: { nama: true, nis: true, rombel: { select: { label: true } } } },
          },
        },
      },
    });

    if (!asesmen) return NextResponse.json({ pesan: "Asesmen tidak ditemukan." }, { status: 404 });
    wajibGuruPemilik(sesi, asesmen.guruId);

    const nilaiBySiswaKelas = new Map(
      asesmen.submission.map((item) => [`${item.kelasId}:${item.siswaId}`, item.nilai])
    );
    const kelompok = asesmen.kelasTujuan.map(({ kelas }) => ({
      namaKelas: kelas.judul,
      baris: kelas.siswa.map(({ siswa }): BarisNilai => ({
        nama: siswa.nama,
        nis: siswa.nis.toString(),
        kelasJurusan: kelas.judul,
        mapel: asesmen.mapel.nama,
        nilai: nilaiBySiswaKelas.get(`${kelas.id}:${siswa.id}`) ?? null,
      })),
    }));

    if (kelompok.length === 0) {
      kelompok.push({
        namaKelas: "Semua Siswa",
        baris: asesmen.submission.map((submission): BarisNilai => ({
          nama: submission.siswa.nama,
          nis: submission.siswa.nis.toString(),
          kelasJurusan: submission.siswa.rombel.label,
          mapel: asesmen.mapel.nama,
          nilai: submission.nilai,
        })),
      });
    }

    const buffer = await buatWorkbookNilaiSemuaKelas(kelompok);
    const namaAman = asesmen.judul
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "asesmen";
    return responseFileExcel(buffer, `rekap-${namaAman}`);
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "File rekap tidak dapat dibuat." }, { status: 500 })
    );
  }
}