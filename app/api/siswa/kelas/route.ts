import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibSiswa, tanganiErrorRbac } from "@/lib/rbac";

interface AktivitasRingkas {
  tipe: "PENGUMUMAN" | "MATERI" | "TUGAS" | "ASESMEN";
  id: string;
  judul: string;
  createdAt: string;
}

// ------------------------------------------------------------
// GET /api/siswa/kelas
// Daftar kelas yang diikuti siswa, masing-masing dilampiri 10
// aktivitas terbaru (gabungan pengumuman/materi/tugas/asesmen)
// supaya frontend bisa hitung badge notif pakai localStorage.
// ------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const sesi = await wajibSiswa(request);

    const keanggotaan = await db.kelasSiswa.findMany({
      where: { siswaId: sesi.userId },
      include: {
        kelas: {
          select: {
            id: true,
            judul: true,
            deskripsi: true,
            kodeKelas: true,
            _count: { select: { siswa: true } },
          },
        },
      },
    });

    const kelasIds = keanggotaan.map((k) => k.kelasId);

    if (kelasIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const [pengumuman, materi, tugasKelas, asesmenKelas] = await Promise.all([
      db.pengumuman.findMany({
        where: { kelasId: { in: kelasIds } },
        select: { id: true, kelasId: true, isi: true, createdAt: true },
      }),
      db.materi.findMany({
        where: { kelasId: { in: kelasIds } },
        select: { id: true, kelasId: true, judul: true, createdAt: true },
      }),
      db.tugasKelas.findMany({
        where: { kelasId: { in: kelasIds } },
        select: {
          kelasId: true,
          dikirimAt: true,
          tugas: { select: { id: true, judul: true } },
        },
      }),
      db.asesmenKelas.findMany({
        where: { kelasId: { in: kelasIds }, asesmen: { status: "SELESAI" } },
        select: {
          kelasId: true,
          asesmen: { select: { id: true, judul: true, tipe: true, updatedAt: true } },
        },
      }),
    ]);

    const aktivitasPerKelas = new Map<string, AktivitasRingkas[]>();

    function tambah(kelasId: string, item: AktivitasRingkas) {
      const daftar = aktivitasPerKelas.get(kelasId) ?? [];
      daftar.push(item);
      aktivitasPerKelas.set(kelasId, daftar);
    }

    for (const p of pengumuman) {
      tambah(p.kelasId, {
        tipe: "PENGUMUMAN",
        id: p.id,
        judul: p.isi.length > 60 ? p.isi.slice(0, 60) + "…" : p.isi,
        createdAt: p.createdAt.toISOString(),
      });
    }
    for (const m of materi) {
      tambah(m.kelasId, {
        tipe: "MATERI",
        id: m.id,
        judul: m.judul,
        createdAt: m.createdAt.toISOString(),
      });
    }
    for (const tk of tugasKelas) {
      tambah(tk.kelasId, {
        tipe: "TUGAS",
        id: tk.tugas.id,
        judul: tk.tugas.judul,
        createdAt: tk.dikirimAt.toISOString(),
      });
    }
    for (const ak of asesmenKelas) {
      tambah(ak.kelasId, {
        tipe: "ASESMEN",
        id: ak.asesmen.id,
        judul: `${ak.asesmen.tipe === "KUIS" ? "Kuis" : "Ujian"}: ${ak.asesmen.judul}`,
        createdAt: ak.asesmen.updatedAt.toISOString(),
      });
    }

    const data = keanggotaan.map((k) => {
      const aktivitas = (aktivitasPerKelas.get(k.kelasId) ?? []).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return {
        id: k.kelas.id,
        judul: k.kelas.judul,
        deskripsi: k.kelas.deskripsi,
        kodeKelas: k.kelas.kodeKelas,
        jumlahSiswa: k.kelas._count.siswa,
        aktivitasTerbaru: aktivitas.slice(0, 10),
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}