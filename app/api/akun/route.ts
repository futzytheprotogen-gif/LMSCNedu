import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibAdminSaja, tanganiErrorRbac } from "@/lib/rbac";
import { hashPassword } from "@/lib/auth";

// ------------------------------------------------------------
// POST /api/akun — form "Buat Akun" (toggle Guru/Siswa di frontend)
// Body Siswa: { tipeAkun: "SISWA", email, nis, tanggalLahir,
//   nama?, deskripsi?, jenisKelamin?, fotoProfil?, rombelId,
//   kelasIds?: string[] }
// Body Guru: { tipeAkun: "GURU", email, nik, nama, tanggalLahir,
//   deskripsi?, jenisKelamin?, fotoProfil?, mapelIds: string[],
//   kelasIds?: string[] }
//
// CATATAN DESAIN: kalau Guru langsung dimasukkan ke beberapa kelas
// pas dibuat (kelasIds diisi), tiap kelas itu di-assign mapel
// PERTAMA dari mapelIds sebagai default. Kalau guru itu ngajar mapel
// beda-beda di tiap kelas, pengaturan presisinya dilakukan belakangan
// lewat "Tambah Guru" di halaman detail kelas (yang udah lebih
// spesifik: pilih guru + mapel per kelas satu-satu).
// ------------------------------------------------------------

const PANJANG_MINIMAL_PASSWORD_DEFAULT = 4; // NIK/NIS pendek pun tetap jalan, bcrypt gak keberatan

interface BodyBuatAkun {
  tipeAkun?: "SISWA" | "GURU";
  email?: string;
  nama?: string;
  tanggalLahir?: string;
  deskripsi?: string;
  jenisKelamin?: "L" | "P";
  fotoProfil?: string;
  // Siswa
  nis?: string;
  rombelId?: string;
  // Guru
  nik?: string;
  mapelIds?: string[];
  // Sama-sama opsional
  kelasIds?: string[];
}

export async function POST(request: NextRequest) {
  try {
    await wajibAdminSaja(request);

    let body: BodyBuatAkun;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ pesan: "Body request tidak valid" }, { status: 400 });
    }

    if (body.tipeAkun === "SISWA") {
      return await buatAkunSiswa(body);
    }
    if (body.tipeAkun === "GURU") {
      return await buatAkunGuru(body);
    }
    return NextResponse.json(
      { pesan: "tipeAkun wajib diisi: SISWA atau GURU" },
      { status: 400 }
    );
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

async function buatAkunSiswa(body: BodyBuatAkun) {
  const { email, nis, tanggalLahir, rombelId } = body;

  if (!email || !nis || !tanggalLahir || !rombelId) {
    return NextResponse.json(
      { pesan: "email, nis, tanggalLahir, dan rombelId wajib diisi" },
      { status: 400 }
    );
  }

  let nisBigInt: bigint;
  try {
    nisBigInt = BigInt(nis);
  } catch {
    return NextResponse.json({ pesan: "NIS harus berupa angka" }, { status: 400 });
  }

  if (nisBigInt.toString().length < PANJANG_MINIMAL_PASSWORD_DEFAULT) {
    return NextResponse.json({ pesan: "NIS terlalu pendek" }, { status: 400 });
  }

  const passwordHash = await hashPassword(nisBigInt.toString());

  const siswaBaru = await db.siswa.create({
    data: {
      email,
      nis: nisBigInt,
      nama: body.nama?.trim() || "Siswa Baru",
      tanggalLahir: new Date(tanggalLahir),
      deskripsi: body.deskripsi?.trim() || null,
      jenisKelamin: body.jenisKelamin ?? null,
      fotoProfil: body.fotoProfil ?? null,
      password: passwordHash,
      passwordSementara: true,
      rombelId,
      kelasDiikuti: body.kelasIds?.length
        ? { create: body.kelasIds.map((kelasId) => ({ kelasId })) }
        : undefined,
    },
  });

  return NextResponse.json(
    {
      data: { id: siswaBaru.id, nama: siswaBaru.nama, nis: siswaBaru.nis.toString() },
      pesan: "Akun siswa berhasil dibuat. Password default = NIS.",
    },
    { status: 201 }
  );
}

async function buatAkunGuru(body: BodyBuatAkun) {
  const { email, nik, nama, tanggalLahir, mapelIds } = body;

  if (!email || !nik || !nama || !tanggalLahir || !mapelIds?.length) {
    return NextResponse.json(
      { pesan: "email, nik, nama, tanggalLahir, dan minimal 1 mapelIds wajib diisi" },
      { status: 400 }
    );
  }

  let nikBigInt: bigint;
  try {
    nikBigInt = BigInt(nik);
  } catch {
    return NextResponse.json({ pesan: "NIK harus berupa angka" }, { status: 400 });
  }

  if (nikBigInt.toString().length < PANJANG_MINIMAL_PASSWORD_DEFAULT) {
    return NextResponse.json({ pesan: "NIK terlalu pendek" }, { status: 400 });
  }

  const passwordHash = await hashPassword(nikBigInt.toString());
  const mapelUtama = mapelIds[0];

  const guruBaru = await db.guru.create({
    data: {
      email,
      nik: nikBigInt,
      nama: nama.trim(),
      tanggalLahir: new Date(tanggalLahir),
      deskripsi: body.deskripsi?.trim() || null,
      jenisKelamin: body.jenisKelamin ?? null,
      fotoProfil: body.fotoProfil ?? null,
      password: passwordHash,
      passwordSementara: true,
      mapelDiampu: { create: mapelIds.map((mapelId) => ({ mapelId })) },
      kelasDiajar: body.kelasIds?.length
        ? {
            create: body.kelasIds.map((kelasId) => ({
              kelasId,
              mapelId: mapelUtama,
            })),
          }
        : undefined,
    },
  });

  return NextResponse.json(
    {
      data: { id: guruBaru.id, nama: guruBaru.nama, nik: guruBaru.nik.toString() },
      pesan: "Akun guru berhasil dibuat. Password default = NIK.",
    },
    { status: 201 }
  );
}

// ------------------------------------------------------------
// GET /api/akun?tipe=SISWA|GURU — list akun, buat tab
// "Daftar Siswa" / "Daftar Guru" (belum dipakai frontend-nya sekarang,
// disiapin duluan)
// ------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    await wajibAdminSaja(request);

    const tipe = request.nextUrl.searchParams.get("tipe");

    if (tipe === "SISWA") {
      const daftarSiswa = await db.siswa.findMany({
        include: { rombel: { select: { id: true, label: true } } },
        orderBy: { nama: "asc" },
      });
      return NextResponse.json({
        data: daftarSiswa.map((s) => ({ ...s, nis: s.nis.toString(), nisn: s.nisn?.toString() ?? null })),
      });
    }

    if (tipe === "GURU") {
      const daftarGuru = await db.guru.findMany({
        include: { mapelDiampu: { include: { mapel: true } } },
        orderBy: { nama: "asc" },
      });
      return NextResponse.json({
        data: daftarGuru.map((g) => ({ ...g, nik: g.nik.toString() })),
      });
    }

    return NextResponse.json(
      { pesan: "Query param 'tipe' wajib: SISWA atau GURU" },
      { status: 400 }
    );
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}