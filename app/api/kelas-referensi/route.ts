import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibAdminSaja, tanganiErrorRbac } from "@/lib/rbac";

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
    await wajibAdminSaja(request);

    const [rombel, mapel] = await Promise.all([
      db.rombelAkademik.findMany({
        orderBy: [{ angkatan: "asc" }, { jurusan: "asc" }, { variasi: "asc" }],
      }),
      db.mataPelajaran.findMany({ orderBy: { nama: "asc" } }),
    ]);

    return NextResponse.json({ data: { rombel, mapel } });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}