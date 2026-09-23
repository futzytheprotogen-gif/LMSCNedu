import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;

    const tugas = await db.tugas.findUnique({
      where: {
        id,
      },

      include: {
        kelasTujuan: {
          include: {
            kelas: {
              include: {
                siswa: {
                  include: {
                    siswa: true,
                  },
                },
              },
            },
          },
        },

        submission: {
          include: {
            siswa: true,
          },
          orderBy: {
            waktuKumpul: "desc",
          },
        },
      },
    });

    if (!tugas) {
      return NextResponse.json(
        {
          pesan: "Tugas tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Gabungkan semua siswa dari semua kelas
     * yang menjadi tujuan tugas.
     */
    const mapSiswa = new Map<
      string,
      {
        id: string;
        nama: string;
        nis: string;
      }
    >();

    for (const tujuan of tugas.kelasTujuan) {
      for (const anggota of tujuan.kelas.siswa) {
        const siswa = anggota.siswa;

        mapSiswa.set(siswa.id, {
          id: siswa.id,
          nama: siswa.nama,
          nis: siswa.nis.toString(),
        });
      }
    }

    /*
     * Buat map submission berdasarkan siswa.
     */
    const mapSubmission = new Map(
      tugas.submission.map((submission) => [
        submission.siswaId,
        submission,
      ])
    );

    const daftarSiswa = Array.from(
      mapSiswa.values()
    )
      .map((siswa) => {
        const submission = mapSubmission.get(
          siswa.id
        );

        return {
          id: siswa.id,
          nama: siswa.nama,
          nis: siswa.nis,

          status: submission
            ? ("SUDAH" as const)
            : ("BELUM" as const),

          fileUrl: submission?.fileUrl ?? null,

          waktuKumpul:
            submission?.waktuKumpul
              ?.toISOString() ?? null,
        };
      })
      .sort((a, b) =>
        a.nama.localeCompare(
          b.nama,
          "id"
        )
      );

    const sudahMengumpulkan =
      daftarSiswa.filter(
        (siswa) =>
          siswa.status === "SUDAH"
      ).length;

    const belumMengumpulkan =
      daftarSiswa.length -
      sudahMengumpulkan;

    return NextResponse.json({
      data: {
        tugas: {
          id: tugas.id,
          judul: tugas.judul,
        },

        totalSiswa: daftarSiswa.length,

        sudahMengumpulkan,

        belumMengumpulkan,

        siswa: daftarSiswa,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/tugas/[id]/pengumpulan:",
      error
    );

    return NextResponse.json(
      {
        pesan:
          "Gagal mengambil data pengumpulan tugas.",
      },
      {
        status: 500,
      }
    );
  }
}