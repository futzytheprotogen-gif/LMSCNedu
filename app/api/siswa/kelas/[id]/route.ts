import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibSiswa, tanganiErrorRbac, ForbiddenError } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

interface ItemFeed {
  tipe: "PENGUMUMAN" | "MATERI" | "TUGAS" | "ASESMEN";
  id: string;
  judul: string;
  isi?: string;
  oleh: { id: string; nama: string } | null;
  createdAt: string;
  extra?: Record<string, unknown>;
}

// ------------------------------------------------------------
// GET /api/siswa/kelas/[id]
// Detail kelas (info, guru per mapel, teman sekelas) + feed
// gabungan pengumuman/materi/tugas/asesmen, diurutkan terbaru.
// Hanya bisa diakses siswa yang benar-benar ikut kelas ini.
// ------------------------------------------------------------

export async function GET(request: NextRequest, { params }: KonteksRute) {
  try {
    const sesi = await wajibSiswa(request);
    const { id } = await params;

    const keanggotaan = await db.kelasSiswa.findFirst({
      where: { kelasId: id, siswaId: sesi.userId },
    });
    if (!keanggotaan) {
      throw new ForbiddenError("Kamu tidak mengikuti kelas ini");
    }

    const kelas = await db.kelas.findUnique({
      where: { id },
      include: {
        siswa: {
          include: { siswa: { select: { id: true, nama: true, fotoProfil: true } } },
        },
        guru: {
          include: {
            guru: { select: { id: true, nama: true, fotoProfil: true } },
            mapel: { select: { id: true, nama: true } },
          },
        },
        pengumuman: {
          orderBy: { createdAt: "desc" },
          include: { guru: { select: { id: true, nama: true, fotoProfil: true } } },
        },
        materi: {
          orderBy: { createdAt: "desc" },
          include: { guru: { select: { id: true, nama: true } } },
        },
        tugas: {
          orderBy: { dikirimAt: "desc" },
          include: {
            tugas: {
              select: {
                id: true,
                judul: true,
                deskripsi: true,
                tipeLampiran: true,
                lampiran: true,
                guru: { select: { id: true, nama: true } },
                submission: {
                  where: { siswaId: sesi.userId },
                  select: { fileUrl: true, waktuKumpul: true },
                },
              },
            },
          },
        },
        asesmen: {
          where: { asesmen: { status: "SELESAI" } },
          include: {
            asesmen: {
              select: {
                id: true,
                judul: true,
                tipe: true,
                durasiMenit: true,
                updatedAt: true,
                mapel: { select: { nama: true } },
                submission: {
                  where: { siswaId: sesi.userId },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!kelas) {
      return NextResponse.json({ pesan: "Kelas tidak ditemukan" }, { status: 404 });
    }

    const feed: ItemFeed[] = [];

    for (const p of kelas.pengumuman) {
      feed.push({
        tipe: "PENGUMUMAN",
        id: p.id,
        judul: "Pengumuman",
        isi: p.isi,
        oleh: p.guru,
        createdAt: p.createdAt.toISOString(),
        extra: { gambar: p.gambar },
      });
    }

    for (const m of kelas.materi) {
      feed.push({
        tipe: "MATERI",
        id: m.id,
        judul: m.judul,
        oleh: m.guru,
        createdAt: m.createdAt.toISOString(),
        extra: { tipeMateri: m.tipe, url: m.url },
      });
    }

    for (const tk of kelas.tugas) {
      const t = tk.tugas;
      feed.push({
        tipe: "TUGAS",
        id: t.id,
        judul: t.judul,
        isi: t.deskripsi,
        oleh: t.guru,
        createdAt: tk.dikirimAt.toISOString(),
        extra: {
          tipeLampiran: t.tipeLampiran,
          lampiran: t.lampiran,
          sudahDikumpulkan: t.submission.length > 0,
        },
      });
    }

    for (const ak of kelas.asesmen) {
      const a = ak.asesmen;
      feed.push({
        tipe: "ASESMEN",
        id: a.id,
        judul: `${a.tipe === "KUIS" ? "Kuis" : "Ujian Online"}: ${a.judul}`,
        oleh: null,
        createdAt: a.updatedAt.toISOString(),
        extra: {
          mapel: a.mapel.nama,
          durasiMenit: a.durasiMenit,
          sudahDikerjakan: a.submission.length > 0,
        },
      });
    }

    feed.sort(
      (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()
    );

    return NextResponse.json({
        data: {
        id: kelas.id,
        judul: kelas.judul,
        deskripsi: kelas.deskripsi,
        kodeKelas: kelas.kodeKelas,
        siswa: kelas.siswa.map((ks) => ks.siswa),
        guru: gabungkanGuruPerMapel(kelas.guru),
        feed,
      },
    });

function gabungkanGuruPerMapel(
  kelasGuru: {
    guru: { id: string; nama: string; fotoProfil: string | null };
    mapel: { id: string; nama: string };
  }[]
) {
  const peta = new Map<
    string,
    { id: string; nama: string; fotoProfil: string | null; mapel: { id: string; nama: string }[] }
  >();

  for (const kg of kelasGuru) {
    const existing = peta.get(kg.guru.id);
    if (existing) {
      existing.mapel.push(kg.mapel);
    } else {
      peta.set(kg.guru.id, { ...kg.guru, mapel: [kg.mapel] });
    }
  }

  return Array.from(peta.values());
}

  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}