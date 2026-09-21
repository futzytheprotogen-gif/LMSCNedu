import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibAdminTier, wajibAdminSaja, tanganiErrorRbac } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

// ------------------------------------------------------------
// GET /api/kelas/[id] — detail kelas: siswa, guru+mapel, pengumuman
// Diakses Admin Tier (Admin/Kepsek/Kurikulum) — read-only untuk
// Kepsek/Kurikulum diatur di frontend (endpoint ini cuma baca).
// ------------------------------------------------------------

export async function GET(request: NextRequest, { params }: KonteksRute) {
  try {
    await wajibAdminTier(request);
    const { id } = await params;

    const kelas = await db.kelas.findUnique({
      where: { id },
      include: {
        siswa: {
          include: {
            siswa: {
              select: {
                id: true,
                nama: true,
                nis: true,
                fotoProfil: true,
                deskripsi: true,
                tanggalLahir: true,
              },
            },
          },
        },
        guru: {
          include: {
            guru: {
              select: { id: true, nama: true, fotoProfil: true },
            },
            mapel: { select: { id: true, nama: true } },
          },
        },
        pengumuman: {
          orderBy: { createdAt: "desc" },
          include: {
            guru: { select: { id: true, nama: true, fotoProfil: true } },
          },
        },
      },
    });

    if (!kelas) {
      return NextResponse.json({ pesan: "Kelas tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: kelas.id,
        judul: kelas.judul,
        deskripsi: kelas.deskripsi,
        kodeKelas: kelas.kodeKelas,
        siswa: kelas.siswa.map((ks) => ({
          ...ks.siswa,
          nis: ks.siswa.nis.toString(),
        })),
        guru: kelas.guru.map((kg) => ({
          ...kg.guru,
          mapel: kg.mapel,
        })),
        pengumuman: kelas.pengumuman,
      },
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

// ------------------------------------------------------------
// PATCH /api/kelas/[id] — edit judul/deskripsi (Admin saja)
// ------------------------------------------------------------

interface BodyEditKelas {
  judul?: string;
  deskripsi?: string;
}

export async function PATCH(request: NextRequest, { params }: KonteksRute) {
  try {
    await wajibAdminSaja(request);
    const { id } = await params;

    let body: BodyEditKelas;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ pesan: "Body request tidak valid" }, { status: 400 });
    }

    const dataUpdate: BodyEditKelas = {};
    if (body.judul !== undefined) {
      const judul = body.judul.trim();
      if (!judul) {
        return NextResponse.json({ pesan: "Judul kelas tidak boleh kosong" }, { status: 400 });
      }
      dataUpdate.judul = judul;
    }
    if (body.deskripsi !== undefined) {
      dataUpdate.deskripsi = body.deskripsi.trim();
    }

    const kelasTerupdate = await db.kelas.update({
      where: { id },
      data: dataUpdate,
    });

    return NextResponse.json({ data: kelasTerupdate });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

// ------------------------------------------------------------
// DELETE /api/kelas/[id] — hapus kelas (Admin saja)
// Relasi (KelasSiswa, KelasGuru, Pengumuman, Materi, AsesmenKelas,
// TugasKelas) semua onDelete: Cascade di schema, jadi otomatis ikut
// terhapus tanpa perlu dihapus manual satu-satu di sini.
// ------------------------------------------------------------

export async function DELETE(request: NextRequest, { params }: KonteksRute) {
  try {
    await wajibAdminSaja(request);
    const { id } = await params;

    await db.kelas.delete({ where: { id } });

    return NextResponse.json({ pesan: "Kelas berhasil dihapus" });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}