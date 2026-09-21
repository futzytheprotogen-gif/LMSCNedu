import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibAdminSaja, tanganiErrorRbac } from "@/lib/rbac";

// ------------------------------------------------------------
// POST /api/lupa-password — form "Ubah Password" di halaman login
// Body: { tipeAkun: "GURU"|"SISWA", identifier: string (NIK/NIS),
//         email: string, tanggalLahir: string, alasan: string }
//
// PENTING (anti-enumeration): respons yang dibalikin SELALU SAMA
// baik datanya cocok atau tidak — supaya endpoint ini gak bisa
// dipakai buat nebak-nebak NIS/NIK/email orang lain. Laporan cuma
// beneran dibuat kalau data match; kalau tidak, kita diam-diam
// gak nyimpen apa-apa tapi tetap balikin pesan sukses yang sama.
// ------------------------------------------------------------

const PESAN_GENERIK =
  "Jika data yang kamu masukkan sesuai, laporan sudah diteruskan ke admin sekolah.";

interface BodyLaporLupaPassword {
  tipeAkun?: "GURU" | "SISWA";
  identifier?: string;
  email?: string;
  tanggalLahir?: string;
  alasan?: string;
}

export async function POST(request: NextRequest) {
  let body: BodyLaporLupaPassword;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ pesan: "Body request tidak valid" }, { status: 400 });
  }

  const { tipeAkun, identifier, email, tanggalLahir, alasan } = body;

  if (!tipeAkun || !identifier || !email || !tanggalLahir || !alasan) {
    return NextResponse.json({ pesan: "Semua field wajib diisi" }, { status: 400 });
  }

  try {
    let idBigInt: bigint;
    try {
      idBigInt = BigInt(identifier);
    } catch {
      return NextResponse.json({ pesan: PESAN_GENERIK });
    }

    const tanggalLahirInput = new Date(tanggalLahir);

    if (tipeAkun === "GURU") {
      const guru = await db.guru.findUnique({ where: { nik: idBigInt } });
      if (
        guru &&
        guru.email.toLowerCase() === email.toLowerCase() &&
        samaTanggal(guru.tanggalLahir, tanggalLahirInput)
      ) {
        await db.laporanLupaPassword.create({
          data: {
            tipeAkun: "GURU",
            guruId: guru.id,
            email,
            nikNisInput: identifier,
            tanggalLahir: tanggalLahirInput,
            alasan,
          },
        });
      }
    } else if (tipeAkun === "SISWA") {
      const siswa = await db.siswa.findUnique({ where: { nis: idBigInt } });
      if (
        siswa &&
        siswa.email.toLowerCase() === email.toLowerCase() &&
        samaTanggal(siswa.tanggalLahir, tanggalLahirInput)
      ) {
        await db.laporanLupaPassword.create({
          data: {
            tipeAkun: "SISWA",
            siswaId: siswa.id,
            email,
            nikNisInput: identifier,
            tanggalLahir: tanggalLahirInput,
            alasan,
          },
        });
      }
    }
  } catch (error) {
    console.error("Gagal proses laporan lupa password:", error);
  }

  return NextResponse.json({ pesan: PESAN_GENERIK });
}

function samaTanggal(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

// ------------------------------------------------------------
// GET /api/lupa-password — daftar laporan buat tab "Laporan" Admin
// ------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    await wajibAdminSaja(request);

    const daftarLaporan = await db.laporanLupaPassword.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        guru: { select: { nama: true } },
        siswa: { select: { nama: true } },
      },
    });

    return NextResponse.json({
      data: daftarLaporan.map((l) => ({
        id: l.id,
        tipeAkun: l.tipeAkun,
        namaPelapor: l.guru?.nama ?? l.siswa?.nama ?? "(akun tidak ditemukan)",
        email: l.email,
        nikNisInput: l.nikNisInput,
        alasan: l.alasan,
        status: l.status,
        createdAt: l.createdAt,
      })),
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}