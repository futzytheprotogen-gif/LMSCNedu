import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibSiswa, tanganiErrorRbac } from "@/lib/rbac";

// ------------------------------------------------------------
// GET /api/siswa/tugas
// Mengembalikan semua tugas yang dikirim ke kelas-kelas yang
// diikuti siswa yang login, masing-masing sudah diberi label
// status: "SUDAH" (siswa ini sudah submit), "HARI_INI" (dikirim
// hari ini & belum submit), atau "BELUM" (sudah lama & belum submit).
// ------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const sesi = await wajibSiswa(request);

    const kelasSiswa = await db.kelasSiswa.findMany({
      where: { siswaId: sesi.userId },
      select: { kelasId: true },
    });
    const kelasIds = kelasSiswa.map((k) => k.kelasId);

    if (kelasIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const tugasKelas = await db.tugasKelas.findMany({
      where: { kelasId: { in: kelasIds } },
      include: {
        kelas: { select: { id: true, judul: true } },
        tugas: {
          include: {
            guru: { select: { id: true, nama: true } },
            submission: {
              where: { siswaId: sesi.userId },
            select: { fileUrl: true, waktuKumpul: true, nilai: true, catatanNilai: true },
            },
          },
        },
      },
      orderBy: { dikirimAt: "desc" },
    });

    // Satu tugas bisa dikirim ke lebih dari satu kelas yang diikuti
    // siswa yang sama — gabungkan supaya tidak dobel di UI.
    const petaTugas = new Map<
      string,
      {
        id: string;
        judul: string;
        deskripsi: string;
        tipeLampiran: "PDF" | "LINK" | null;
        lampiran: string | null;
        deadlineAt: Date | null;
        susulanAktif: boolean;
        deadlineSusulan: Date | null;
        guru: { id: string; nama: string };
        kelasTujuan: { id: string; judul: string }[];
        dikirimPalingBaru: Date;
        submission: {
          fileUrl: string;
          waktuKumpul: string;
          nilai: number | null;
          catatanNilai: string | null;
        } | null;
      }
    >();

    for (const tk of tugasKelas) {
      const submission = tk.tugas.submission[0]
        ? {
            fileUrl: tk.tugas.submission[0].fileUrl,
            waktuKumpul: tk.tugas.submission[0].waktuKumpul.toISOString(),
            nilai: tk.tugas.submission[0].nilai,
            catatanNilai: tk.tugas.submission[0].catatanNilai,
          }
        : null;

      const existing = petaTugas.get(tk.tugas.id);

      if (existing) {
        existing.kelasTujuan.push(tk.kelas);
        if (tk.dikirimAt > existing.dikirimPalingBaru) {
          existing.dikirimPalingBaru = tk.dikirimAt;
        }
      } else {
        petaTugas.set(tk.tugas.id, {
          id: tk.tugas.id,
          judul: tk.tugas.judul,
          deskripsi: tk.tugas.deskripsi,
          tipeLampiran: tk.tugas.tipeLampiran,
          lampiran: tk.tugas.lampiran,
          deadlineAt: tk.tugas.deadlineAt,
          susulanAktif: tk.tugas.susulanAktif,
          deadlineSusulan: tk.tugas.deadlineSusulan,
          guru: tk.tugas.guru,
          kelasTujuan: [tk.kelas],
          dikirimPalingBaru: tk.dikirimAt,
          submission,
        });
      }
    }

    const hariIni = new Date().toDateString();
    const sekarang = new Date();

    const data = Array.from(petaTugas.values())
      .map((t) => {
        let status: "SUDAH" | "HARI_INI" | "BELUM";

        if (t.submission) {
          status = "SUDAH";
        } else if (t.dikirimPalingBaru.toDateString() === hariIni) {
          status = "HARI_INI";
        } else {
          status = "BELUM";
        }

        return {
          id: t.id,
          judul: t.judul,
          deskripsi: t.deskripsi,
          tipeLampiran: t.tipeLampiran,
          lampiran: t.lampiran,
          deadlineAt: t.deadlineAt?.toISOString() ?? null,
          susulanAktif: t.susulanAktif,
          deadlineSusulan: t.deadlineSusulan?.toISOString() ?? null,
          statusDeadline: !t.deadlineAt
            ? "TANPA_DEADLINE" as const
            : sekarang <= t.deadlineAt
              ? "TERBUKA" as const
              : t.susulanAktif && t.deadlineSusulan && sekarang <= t.deadlineSusulan
                ? "SUSULAN" as const
                : "TUTUP" as const,
          guru: t.guru,
          kelasTujuan: t.kelasTujuan,
          dikirimAt: t.dikirimPalingBaru.toISOString(),
          submission: t.submission,
          status,
        };
      })
      .sort(
        (a, b) => new Date(b.dikirimAt).getTime() - new Date(a.dikirimAt).getTime()
      );

    return NextResponse.json({ data });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}