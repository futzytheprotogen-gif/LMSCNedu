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
              select: { fileUrl: true, waktuKumpul: true },
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
        guru: { id: string; nama: string };
        kelasTujuan: { id: string; judul: string }[];
        dikirimPalingBaru: Date;
        submission: { fileUrl: string; waktuKumpul: string } | null;
      }
    >();

    for (const tk of tugasKelas) {
      const submission = tk.tugas.submission[0]
        ? {
            fileUrl: tk.tugas.submission[0].fileUrl,
            waktuKumpul: tk.tugas.submission[0].waktuKumpul.toISOString(),
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
          guru: tk.tugas.guru,
          kelasTujuan: [tk.kelas],
          dikirimPalingBaru: tk.dikirimAt,
          submission,
        });
      }
    }

    const hariIni = new Date().toDateString();

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