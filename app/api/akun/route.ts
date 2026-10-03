import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibAdminSaja, wajibAdminTier, tanganiErrorRbac } from "@/lib/rbac";
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

function adalahDuplikat(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

interface BodyBuatAkun {
  tipeAkun?: "SISWA" | "GURU" | "KEPSEK" | "KURIKULUM";
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
  // Kepsek / Kurikulum
  password?: string;
  konfirmasiPassword?: string;
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
    if (body.tipeAkun === "KEPSEK" || body.tipeAkun === "KURIKULUM") {
      return await buatAkunAdminTier(body);
    }
    return NextResponse.json(
      { pesan: "tipeAkun wajib diisi: SISWA, GURU, KEPSEK, atau KURIKULUM" },
      { status: 400 }
    );
  } catch (error) {
    if (adalahDuplikat(error)) {
      return NextResponse.json(
        { pesan: "Email, NIS, atau NIK sudah digunakan oleh akun lain" },
        { status: 409 }
      );
    }
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

  const [siswaDenganNis, siswaDenganEmail, guruDenganEmail, adminDenganEmail] = await Promise.all([
    db.siswa.findUnique({ where: { nis: nisBigInt }, select: { id: true } }),
    db.siswa.findUnique({ where: { email }, select: { id: true } }),
    db.guru.findUnique({ where: { email }, select: { id: true } }),
    db.admin.findUnique({ where: { email }, select: { id: true } }),
  ]);
  if (siswaDenganNis) {
    return NextResponse.json({ pesan: "NIS sudah digunakan oleh siswa lain" }, { status: 409 });
  }
  if (siswaDenganEmail || guruDenganEmail || adminDenganEmail) {
    return NextResponse.json({ pesan: "Email sudah digunakan oleh akun lain" }, { status: 409 });
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

  const [guruDenganNik, siswaDenganEmail, guruDenganEmail, adminDenganEmail] = await Promise.all([
    db.guru.findUnique({ where: { nik: nikBigInt }, select: { id: true } }),
    db.siswa.findUnique({ where: { email }, select: { id: true } }),
    db.guru.findUnique({ where: { email }, select: { id: true } }),
    db.admin.findUnique({ where: { email }, select: { id: true } }),
  ]);
  if (guruDenganNik) {
    return NextResponse.json({ pesan: "NIK sudah digunakan oleh guru lain" }, { status: 409 });
  }
  if (siswaDenganEmail || guruDenganEmail || adminDenganEmail) {
    return NextResponse.json({ pesan: "Email sudah digunakan oleh akun lain" }, { status: 409 });
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
    await wajibAdminTier(request);

    const tipe = request.nextUrl.searchParams.get("tipe");

    if (tipe === "SISWA") {
      const daftarSiswa = await db.siswa.findMany({
        select: {
          id: true,
          email: true,
          nis: true,
          nisn: true,
          nama: true,
          tanggalLahir: true,
          jenisKelamin: true,
          fotoProfil: true,
          deskripsi: true,
          rombel: { select: { id: true, label: true } },
        },
        orderBy: { nama: "asc" },
      });
      return NextResponse.json({
        data: daftarSiswa.map((s) => ({ ...s, nis: s.nis.toString(), nisn: s.nisn?.toString() ?? null })),
      });
    }

    if (tipe === "GURU") {
      const daftarGuru = await db.guru.findMany({
        select: {
          id: true,
          email: true,
          nik: true,
          nama: true,
          tanggalLahir: true,
          jenisKelamin: true,
          fotoProfil: true,
          deskripsi: true,
          mapelDiampu: {
            select: { mapel: { select: { id: true, nama: true } } },
          },
          kelasDiajar: {
            select: {
              kelas: { select: { id: true, judul: true } },
              mapel: { select: { id: true, nama: true } },
            },
          },
        },
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

async function buatAkunAdminTier(body: BodyBuatAkun) {
  const role = body.tipeAkun;
  if (role !== "KEPSEK" && role !== "KURIKULUM") {
    return NextResponse.json({ pesan: "Role admin tier tidak valid" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const nama = body.nama?.trim();
  const password = body.password ?? "";

  if (!email || !nama || !password || !body.konfirmasiPassword) {
    return NextResponse.json(
      { pesan: "Nama, email, password, dan konfirmasi password wajib diisi" },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { pesan: "Password minimal terdiri dari 8 karakter" },
      { status: 400 }
    );
  }
  if (password !== body.konfirmasiPassword) {
    return NextResponse.json(
      { pesan: "Konfirmasi password tidak sama" },
      { status: 400 }
    );
  }

  const [adminDenganEmail, guruDenganEmail, siswaDenganEmail] = await Promise.all([
    db.admin.findUnique({ where: { email }, select: { id: true } }),
    db.guru.findUnique({ where: { email }, select: { id: true } }),
    db.siswa.findUnique({ where: { email }, select: { id: true } }),
  ]);
  if (adminDenganEmail || guruDenganEmail || siswaDenganEmail) {
    return NextResponse.json(
      { pesan: "Email sudah digunakan oleh akun lain" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const akunBaru = await db.admin.create({
    data: {
      email,
      nama,
      password: passwordHash,
      role,
      deskripsi: body.deskripsi?.trim() || null,
    },
    select: { id: true, email: true, nama: true, role: true },
  });

  return NextResponse.json(
    {
      data: akunBaru,
      pesan: `Akun ${role === "KEPSEK" ? "Kepsek" : "Kurikulum"} berhasil dibuat.`,
    },
    { status: 201 }
  );
}