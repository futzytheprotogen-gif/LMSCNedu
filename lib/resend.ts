import { Resend } from "resend";

// ------------------------------------------------------------
// Dipakai khusus untuk alur "Lupa Password" (lihat catatan di
// /areas/project-lms-sekolah.md bagian Autentikasi & Login):
// admin klik "Terima & Kirim OTP" di tab Laporan -> OTP 4 digit
// digenerate & dikirim ke email siswa/guru lewat Resend, berlaku
// 10 menit, dan bisa dikirim ulang selama laporan masih "Diterima".
// ------------------------------------------------------------

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  throw new Error(
    "RESEND_API_KEY belum diatur di .env — wajib diisi sebelum fitur email jalan."
  );
}

const resend = new Resend(RESEND_API_KEY);

// Ganti ke domain sekolah yang sudah diverifikasi di dashboard Resend
// kalau sudah production. Selama masih pakai domain sandbox Resend,
// email cuma bisa terkirim ke alamat yang didaftarkan di akun Resend.
const EMAIL_PENGIRIM =
  process.env.RESEND_FROM_EMAIL ?? "CN Edu <onboarding@resend.dev>";

export const MENIT_KADALUARSA_OTP = 10;

// ------------------------------------------------------------
// Generate kode OTP 4 digit (dipanggil route handler saat admin
// klik "Terima & Kirim OTP" atau "Kirim Ulang OTP")
// ------------------------------------------------------------

export function buatKodeOtp(): string {
  // 1000-9999, selalu 4 digit, tidak pernah diawali 0 (biar gak
  // ambigu kalau ditampilkan sebagai angka di suatu tempat)
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function hitungWaktuKadaluarsaOtp(): Date {
  return new Date(Date.now() + MENIT_KADALUARSA_OTP * 60 * 1000);
}

// ------------------------------------------------------------
// Kirim email OTP
// ------------------------------------------------------------

interface ParamKirimOtp {
  email: string;
  nama: string;
  kodeOtp: string;
  tipeAkun: "GURU" | "SISWA";
}

export async function kirimEmailOtp({
  email,
  nama,
  kodeOtp,
  tipeAkun,
}: ParamKirimOtp): Promise<void> {
  const labelAkun = tipeAkun === "GURU" ? "guru" : "siswa";

  const { error } = await resend.emails.send({
    from: EMAIL_PENGIRIM,
    to: email,
    subject: "Kode OTP Reset Password — CN Edu",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2196f3;">Reset Password CN Edu</h2>
        <p>Halo ${nama},</p>
        <p>
          Kami menerima permintaan reset password untuk akun ${labelAkun}
          kamu di CN Edu. Gunakan kode berikut untuk melanjutkan:
        </p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2196f3; text-align: center; margin: 24px 0;">
          ${kodeOtp}
        </p>
        <p>
          Kode ini berlaku selama <strong>${MENIT_KADALUARSA_OTP} menit</strong>.
          Kalau kamu tidak merasa meminta reset password, abaikan email
          ini — akun kamu tetap aman.
        </p>
        <p style="color: #888; font-size: 12px; margin-top: 32px;">
          Email otomatis dari sistem CN Edu, mohon tidak dibalas.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Gagal mengirim email OTP: ${error.message}`);
  }
}