import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibAdminTier, tanganiErrorRbac } from "@/lib/rbac";

// ------------------------------------------------------------
// GET /api/kelas-referensi — dipakai buat isi dropdown di:
// - Tab Buat Akun (pilih jurusan/rombel siswa, pilih mapel guru)
// - Detail Kelas -> Tambah Siswa (pilih rombel dulu) & Tambah Guru
//   (pilih mapel dulu)
// Cuma Admin yang butuh data ini (satu-satunya yang bisa nambah
// akun/anggota kelas), jadi dibatasi Admin saja.
// ------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    await wajibAdminTier(request);

    const [jurusan, rombel, mapel] = await Promise.all([
      db.jurusanAkademik.findMany({
        orderBy: { nama: "asc" },
        include: { _count: { select: { rombel: true } } },
      }),
      db.rombelAkademik.findMany({
        orderBy: [{ angkatan: "asc" }, { jurusan: { nama: "asc" } }, { variasi: "asc" }],
        include: {
          jurusan: { select: { id: true, nama: true } },
          _count: { select: { siswa: true } },
        },
      }),
      db.mataPelajaran.findMany({
        orderBy: { nama: "asc" },
        include: {
          _count: {
            select: { guruPengampu: true, kelasGuru: true, asesmen: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      data: {
        jurusan: jurusan.map(({ _count, ...item }) => ({
          ...item,
          jumlahRombel: _count.rombel,
        })),
        rombel: rombel.map(({ _count, ...item }) => ({
          ...item,
          jurusanId: item.jurusanId,
          jurusan: item.jurusan?.nama ?? null,
          jumlahSiswa: _count.siswa,
        })),
        mapel: mapel.map(({ _count, ...item }) => ({
          ...item,
          jumlahPenggunaan:
            _count.guruPengampu + _count.kelasGuru + _count.asesmen,
        })),
      },
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}