import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ------------------------------------------------------------
// POST /api/verify-otp
// Body: { tipeAkun: "GURU"|"SISWA", identifier: string, otp: string }
//
// Endpoint ini publik (dipanggil dari halaman login, sebelum user
// login) — makanya TIDAK pakai wajibLogin/rbac. Cuma ngecek validitas
// OTP, belum ganti password apa-apa. reset-password nanti tetap
// validasi ulang OTP-nya sendiri (jangan percaya begitu saja hasil
// dari endpoint ini), jadi endpoint ini murni buat UX — kasih tau
// user di step ini aja kalau kodenya salah, sebelum dia isi form
// password baru.
// ------------------------------------------------------------

const PESAN_GAGAL = "Kode OTP tidak valid atau sudah kadaluarsa";

interface BodyVerifyOtp {
  tipeAkun?: "GURU" | "SISWA";
  identifier?: string;
  otp?: string;
}

export async function POST(request: NextRequest) {
  let body: BodyVerifyOtp;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ pesan: "Body request tidak valid" }, { status: 400 });
  }

  const { tipeAkun, identifier, otp } = body;

  if (!tipeAkun || !identifier || !otp) {
    return NextResponse.json({ pesan: "Semua field wajib diisi" }, { status: 400 });
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
          orderBy: { createdAt: "desc" },
        })
      : await db.laporanLupaPassword.findFirst({
          where: { tipeAkun: "SISWA", siswa: { nis: idBigInt }, status: "DITERIMA" },
          orderBy: { createdAt: "desc" },
        });

  if (!laporan || !laporan.otp || !laporan.otpExpiredAt) {
    return NextResponse.json({ pesan: PESAN_GAGAL }, { status: 400 });
  }
  if (laporan.otp !== otp) {
    return NextResponse.json({ pesan: PESAN_GAGAL }, { status: 400 });
  }
  if (laporan.otpExpiredAt.getTime() < Date.now()) {
    return NextResponse.json({ pesan: PESAN_GAGAL }, { status: 400 });
  }

  return NextResponse.json({ pesan: "Kode OTP valid, silakan buat password baru" });
}