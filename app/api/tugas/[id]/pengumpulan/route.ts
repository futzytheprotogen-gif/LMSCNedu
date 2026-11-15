import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tanganiErrorRbac, wajibGuru, wajibGuruPemilik } from "@/lib/rbac";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const sesi = await wajibGuru(request);
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
    wajibGuruPemilik(sesi, tugas.guruId);

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
          submissionId: submission?.id ?? null,
          nilai: submission?.nilai ?? null,
          catatanNilai: submission?.catatanNilai ?? null,

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
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Gagal mengambil data pengumpulan tugas." }, { status: 500 })
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const sesi = await wajibGuru(request);
    const { id } = await params;
    const tugas = await db.tugas.findUnique({ where: { id }, select: { id: true, guruId: true } });
    if (!tugas) {
      return NextResponse.json({ pesan: "Tugas tidak ditemukan." }, { status: 404 });
    }
    wajibGuruPemilik(sesi, tugas.guruId);

    const body: unknown = await request.json().catch(() => null);
    if (
      !body ||
      typeof body !== "object" ||
      !("submissionId" in body) ||
      typeof body.submissionId !== "string" ||
      !("nilai" in body) ||
      typeof body.nilai !== "number" ||
      !Number.isFinite(body.nilai) ||
      body.nilai < 0 ||
      body.nilai > 100 ||
      ("catatanNilai" in body && body.catatanNilai !== null && typeof body.catatanNilai !== "string")
    ) {
      return NextResponse.json(
        { pesan: "Submission dan nilai 0–100 wajib diisi; catatan harus berupa teks." },
        { status: 400 }
      );
    }

    const pengumpulan = await db.submissionTugas.findFirst({
      where: { id: body.submissionId, tugasId: id },
      select: { id: true },
    });
    if (!pengumpulan) {
      return NextResponse.json({ pesan: "Pengumpulan tidak ditemukan." }, { status: 404 });
    }

    const data = await db.submissionTugas.update({
      where: { id: pengumpulan.id },
      data: {
        nilai: body.nilai,
        catatanNilai: "catatanNilai" in body
          ? typeof body.catatanNilai === "string" ? body.catatanNilai.trim() || null : null
          : undefined,
      },
      select: { id: true, nilai: true, catatanNilai: true },
    });
    return NextResponse.json({ data });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Gagal menyimpan nilai tugas." }, { status: 500 })
    );
  }
}