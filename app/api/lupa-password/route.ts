import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibAdminSaja, tanganiErrorRbac } from "@/lib/rbac";
import {
  buatKodeOtp,
  EMAIL_OTP_TERSEDIA,
  hashTokenPermintaanOtp,
  hashKodeOtp,
  hitungWaktuKadaluarsaOtp,
  kirimEmailOtp,
} from "@/lib/email";

// ------------------------------------------------------------
// POST /api/lupa-password — form "Ubah Password" di halaman login
// Body: { tipeAkun: "GURU"|"SISWA", identifier: string (NIK/NIS),
//         email: string, alasan?: string, accessToken: string }
//
// PENTING (anti-enumeration): respons yang dibalikin SELALU SAMA
// baik datanya cocok atau tidak — supaya endpoint ini gak bisa
// dipakai buat nebak-nebak NIS/NIK/email orang lain.
// ------------------------------------------------------------

const PESAN_GENERIK =
  "Jika data sesuai, kode OTP akan dikirim ke email terdaftar. Jika email tidak masuk, admin sekolah akan membantu melalui laporan.";

interface BodyLaporLupaPassword {
  tipeAkun?: "GURU" | "SISWA";
  identifier?: string;
  email?: string;
  alasan?: string;
  accessToken?: string;
}

export async function POST(request: NextRequest) {
  let body: BodyLaporLupaPassword;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ pesan: "Body request tidak valid" }, { status: 400 });
  }

  const { tipeAkun, identifier, email, alasan, accessToken } = body;

  if (
    (tipeAkun !== "GURU" && tipeAkun !== "SISWA") ||
    !identifier?.trim() ||
    !email?.trim() ||
    !accessToken ||
    !/^[a-f\d]{64}$/i.test(accessToken) ||
    (alasan?.trim().length ?? 0) > 1000
  ) {
    return NextResponse.json({ pesan: "Data permintaan lupa password tidak valid" }, { status: 400 });
  }

  let idBigInt: bigint;
  try {
    idBigInt = BigInt(identifier.trim());
  } catch {
    return NextResponse.json({ pesan: PESAN_GENERIK });
  }

  const emailNormal = email.trim().toLowerCase();
  if (
    emailNormal.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormal)
  ) {
    return NextResponse.json({ pesan: PESAN_GENERIK });
  }

  try {
    const akun =
      tipeAkun === "GURU"
        ? await db.guru.findUnique({
            where: { nik: idBigInt },
            select: { id: true, nama: true, email: true, tanggalLahir: true },
          })
        : await db.siswa.findUnique({
            where: { nis: idBigInt },
            select: { id: true, nama: true, email: true, tanggalLahir: true },
          });

    if (
      akun &&
      akun.email.trim().toLowerCase() === emailNormal
    ) {
      const recentLimit = new Date(Date.now() - 60 * 60 * 1000);
      const requestCount = await db.laporanLupaPassword.count({
        where: {
          ...(tipeAkun === "GURU" ? { guruId: akun.id } : { siswaId: akun.id }),
          createdAt: { gte: recentLimit },
        },
      });

      if (requestCount < 5) {
        const laporan = await db.laporanLupaPassword.create({
          data: {
            tipeAkun,
            ...(tipeAkun === "GURU" ? { guruId: akun.id } : { siswaId: akun.id }),
            email: akun.email,
            nikNisInput: identifier.trim(),
            tanggalLahir: akun.tanggalLahir,
            otpAccessTokenHash: hashTokenPermintaanOtp(accessToken),
            alasan:
              alasan?.trim() ||
              "Permintaan pemulihan password melalui verifikasi email terdaftar.",
          },
          select: { id: true },
        });

        if (EMAIL_OTP_TERSEDIA) {
          const otp = buatKodeOtp();
          const otpExpiredAt = hitungWaktuKadaluarsaOtp();
          try {
            await kirimEmailOtp({
              email: akun.email,
              nama: akun.nama,
              kodeOtp: otp,
              tipeAkun,
            });
            await db.laporanLupaPassword.update({
              where: { id: laporan.id },
              data: {
                status: "DITERIMA",
                otp: hashKodeOtp(otp),
                otpEncrypted: null,
                otpExpiredAt,
              },
            });
          } catch (error) {
            console.error("Pengiriman OTP otomatis gagal; laporan diteruskan ke admin:", error);
            await db.laporanLupaPassword.update({
              where: { id: laporan.id },
              data: {
                status: "DITOLAK",
                otp: null,
                otpEncrypted: null,
                otpExpiredAt: null,
              },
            });
          }
        } else {
          await db.laporanLupaPassword.update({
            where: { id: laporan.id },
            data: {
              status: "DITOLAK",
              otp: null,
              otpEncrypted: null,
              otpExpiredAt: null,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error("Gagal memproses permintaan lupa password:", error);
    return NextResponse.json(
      { pesan: "Layanan pemulihan password sedang bermasalah. Coba lagi nanti." },
      { status: 503 }
    );
  }

  return NextResponse.json({ pesan: PESAN_GENERIK });
}

// ------------------------------------------------------------
// GET /api/lupa-password — daftar laporan buat tab "Laporan" Admin
// ------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    await wajibAdminSaja(request);

    await db.laporanLupaPassword.deleteMany({
      where: {
        status: { in: ["DITOLAK", "SELESAI"] },
        createdAt: { lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
      },
    });

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
        status: l.status === "MENUNGGU" ? "DITOLAK" : l.status,
        bisaOtpManual: l.otpAccessTokenHash !== null,
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

// DELETE /api/lupa-password
// Hapus satu atau semua riwayat terminal. Laporan Menunggu/Diterima tetap aman.
export async function DELETE(request: NextRequest) {
  try {
    await wajibAdminSaja(request);
    let body: { ids?: unknown; semua?: unknown };
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    if (body.semua === true) {
      const hasil = await db.laporanLupaPassword.deleteMany({
        where: { status: { in: ["DITOLAK", "SELESAI"] } },
      });
      return NextResponse.json({
        pesan: `${hasil.count} riwayat laporan berhasil dihapus.`,
        count: hasil.count,
      });
    }

    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ pesan: "Tidak ada riwayat yang dipilih." }, { status: 400 });
    }

    const ids = body.ids.filter((id): id is string => typeof id === "string" && id.length > 0);
    if (ids.length === 0) {
      return NextResponse.json({ pesan: "Tidak ada riwayat yang valid dipilih." }, { status: 400 });
    }

    const hasil = await db.laporanLupaPassword.deleteMany({
      where: {
        id: { in: ids },
        status: { in: ["DITOLAK", "SELESAI"] },
      },
    });
    return NextResponse.json({
      pesan: `${hasil.count} riwayat laporan berhasil dihapus.`,
      count: hasil.count,
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}