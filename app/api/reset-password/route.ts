import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

// ------------------------------------------------------------
// POST /api/reset-password — publik, langkah terakhir alur lupa
// password. Body: { tipeAkun, identifier, otp, passwordBaru,
// konfirmasiPasswordBaru }
//
// Validasi OTP DIULANG di sini (bukan cuma percaya /api/verify-otp
// tadi) — supaya orang gak bisa curang manggil endpoint ini langsung
// tanpa OTP valid, walau udah lewat /api/verify-otp di step
// sebelumnya. Laporan TIDAK dihapus di sini — tetap nunggu admin
// klik "Selesai" di dashboard-nya (sesuai spesifikasi).
// ------------------------------------------------------------

const PESAN_GAGAL = "Kode OTP tidak valid atau sudah kadaluarsa";
const PANJANG_MINIMAL_PASSWORD = 8;

interface BodyResetPassword {
  tipeAkun?: "GURU" | "SISWA";
  identifier?: string;
  otp?: string;
  passwordBaru?: string;
  konfirmasiPasswordBaru?: string;
}

export async function POST(request: NextRequest) {
  let body: BodyResetPassword;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ pesan: "Body request tidak valid" }, { status: 400 });
  }

  const { tipeAkun, identifier, otp, passwordBaru, konfirmasiPasswordBaru } = body;

  if (!tipeAkun || !identifier || !otp || !passwordBaru || !konfirmasiPasswordBaru) {
    return NextResponse.json({ pesan: "Semua field wajib diisi" }, { status: 400 });
  }
  if (passwordBaru.length < PANJANG_MINIMAL_PASSWORD) {
    return NextResponse.json(
      { pesan: `Password minimal ${PANJANG_MINIMAL_PASSWORD} karakter` },
      { status: 400 }
    );
  }
  if (passwordBaru !== konfirmasiPasswordBaru) {
    return NextResponse.json({ pesan: "Konfirmasi password tidak cocok" }, { status: 400 });
  }

  let idBigInt: bigint;
  try {
    idBigInt = BigInt(identifier);
  } catch {
    return NextResponse.json({ pesan: PESAN_GAGAL }, { status: 400 });
  }

  const laporan =
    tipeAkun === "GURU"
      ? await db.laporanLupaPassword.findFirst({
          where: { tipeAkun: "GURU", guru: { nik: idBigInt }, status: "DITERIMA" },
          include: { guru: true },
          orderBy: { createdAt: "desc" },
        })
      : await db.laporanLupaPassword.findFirst({
          where: { tipeAkun: "SISWA", siswa: { nis: idBigInt }, status: "DITERIMA" },
          include: { siswa: true },
          orderBy: { createdAt: "desc" },
        });

  if (
    !laporan ||
    !laporan.otp ||
    !laporan.otpExpiredAt ||
    laporan.otp !== otp ||
    laporan.otpExpiredAt.getTime() < Date.now()
  ) {
    return NextResponse.json({ pesan: PESAN_GAGAL }, { status: 400 });
  }

  const passwordHash = await hashPassword(passwordBaru);

  if (tipeAkun === "GURU" && laporan.guruId) {
    await db.guru.update({
      where: { id: laporan.guruId },
      data: { password: passwordHash, passwordSementara: false },
    });
  } else if (tipeAkun === "SISWA" && laporan.siswaId) {
    await db.siswa.update({
      where: { id: laporan.siswaId },
      data: { password: passwordHash, passwordSementara: false },
    });
  } else {
    return NextResponse.json({ pesan: PESAN_GAGAL }, { status: 400 });
  }

  return NextResponse.json({
    pesan: "Password berhasil diubah. Silakan login dengan password baru kamu.",
  });
}