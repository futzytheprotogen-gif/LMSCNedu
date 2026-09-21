import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibAdminSaja, tanganiErrorRbac } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

// ------------------------------------------------------------
// Semua endpoint di sini WAJIB query string ?tipe=SISWA atau
// ?tipe=GURU — soalnya Siswa & Guru itu 2 tabel Prisma yang beda,
// bukan satu tabel "Akun" gabungan, jadi kita perlu tau duluan mau
// query ke tabel yang mana sebelum bisa cari id-nya.
// ------------------------------------------------------------

function ambilTipe(request: NextRequest): "SISWA" | "GURU" | null {
  const tipe = request.nextUrl.searchParams.get("tipe");
  return tipe === "SISWA" || tipe === "GURU" ? tipe : null;
}

// ------------------------------------------------------------
// GET /api/akun/[id]?tipe=SISWA|GURU
// ------------------------------------------------------------

export async function GET(request: NextRequest, { params }: KonteksRute) {
  try {
    await wajibAdminSaja(request);
    const { id } = await params;
    const tipe = ambilTipe(request);

    if (!tipe) {
      return NextResponse.json({ pesan: "Query param 'tipe' wajib" }, { status: 400 });
    }

    if (tipe === "SISWA") {
      const siswa = await db.siswa.findUnique({
        where: { id },
        include: { rombel: true, kelasDiikuti: { include: { kelas: true } } },
      });
      if (!siswa) return NextResponse.json({ pesan: "Siswa tidak ditemukan" }, { status: 404 });
      return NextResponse.json({
        data: { ...siswa, nis: siswa.nis.toString(), nisn: siswa.nisn?.toString() ?? null },
      });
    }

    const guru = await db.guru.findUnique({
      where: { id },
      include: {
        mapelDiampu: { include: { mapel: true } },
        kelasDiajar: { include: { kelas: true, mapel: true } },
      },
    });
    if (!guru) return NextResponse.json({ pesan: "Guru tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ data: { ...guru, nik: guru.nik.toString() } });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

// ------------------------------------------------------------
// PATCH /api/akun/[id]?tipe=SISWA|GURU
// Sesuai aturan: email/NIS/NIK/jurusan dikunci dari sisi siswa/guru
// sendiri, tapi ADMIN boleh ubah semuanya lewat endpoint ini
// (termasuk nama, deskripsi, foto — field yang siswa/guru sendiri
// juga boleh edit lewat halaman profil masing-masing, endpoint beda).
// ------------------------------------------------------------

interface BodyEditAkun {
  nama?: string;
  deskripsi?: string;
  fotoProfil?: string;
  jenisKelamin?: "L" | "P";
  email?: string;
  rombelId?: string; // khusus siswa
  nis?: string; // khusus siswa
  tanggalLahir?: string; // ISO date string, siswa & guru
}

export async function PATCH(request: NextRequest, { params }: KonteksRute) {
  try {
    await wajibAdminSaja(request);
    const { id } = await params;
    const tipe = ambilTipe(request);

    if (!tipe) {
      return NextResponse.json({ pesan: "Query param 'tipe' wajib" }, { status: 400 });
    }

    let body: BodyEditAkun;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ pesan: "Body request tidak valid" }, { status: 400 });
    }

    if (tipe === "SISWA") {
      let nisBigInt: bigint | undefined;
      if (body.nis !== undefined) {
        try {
          nisBigInt = BigInt(body.nis);
        } catch {
          return NextResponse.json({ pesan: "NIS harus berupa angka" }, { status: 400 });
        }
      }

      const siswaTerupdate = await db.siswa.update({
        where: { id },
        data: {
          nama: body.nama?.trim(),
          deskripsi: body.deskripsi?.trim(),
          fotoProfil: body.fotoProfil,
          jenisKelamin: body.jenisKelamin,
          email: body.email,
          rombelId: body.rombelId,
          nis: nisBigInt,
          tanggalLahir: body.tanggalLahir ? new Date(body.tanggalLahir) : undefined,
        },
      });
      return NextResponse.json({
        data: { ...siswaTerupdate, nis: siswaTerupdate.nis.toString() },
      });
    }

    const guruTerupdate = await db.guru.update({
      where: { id },
      data: {
        nama: body.nama?.trim(),
        deskripsi: body.deskripsi?.trim(),
        fotoProfil: body.fotoProfil,
        jenisKelamin: body.jenisKelamin,
        email: body.email,
      },
    });
    return NextResponse.json({
      data: { ...guruTerupdate, nik: guruTerupdate.nik.toString() },
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

// ------------------------------------------------------------
// DELETE /api/akun/[id]?tipe=SISWA|GURU
// ------------------------------------------------------------

export async function DELETE(request: NextRequest, { params }: KonteksRute) {
  try {
    await wajibAdminSaja(request);
    const { id } = await params;
    const tipe = ambilTipe(request);

    if (!tipe) {
      return NextResponse.json({ pesan: "Query param 'tipe' wajib" }, { status: 400 });
    }

    if (tipe === "SISWA") {
      await db.siswa.delete({ where: { id } });
    } else {
      await db.guru.delete({ where: { id } });
    }

    return NextResponse.json({ pesan: "Akun berhasil dihapus" });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}