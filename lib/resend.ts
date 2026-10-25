import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { Resend } from "resend";

// ------------------------------------------------------------
// Dipakai khusus untuk alur "Lupa Password" (lihat catatan di
// /areas/project-lms-sekolah.md bagian Autentikasi & Login):
// Permintaan yang datanya cocok mengirim OTP otomatis; admin juga dapat
// mengirim ulang lewat email atau membuat OTP manual. Kode berlaku 10 menit.
// ------------------------------------------------------------

const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim();
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Ganti ke domain sekolah yang sudah diverifikasi di dashboard Resend
// kalau sudah production. Selama masih pakai domain sandbox Resend,
// email cuma bisa terkirim ke alamat yang didaftarkan di akun Resend.
const EMAIL_PENGIRIM =
  process.env.RESEND_FROM_EMAIL ?? "CN Edu <onboarding@resend.dev>";

export const MENIT_KADALUARSA_OTP = 10;
export const EMAIL_OTP_TERSEDIA = Boolean(resend);

// ------------------------------------------------------------
// Generate kode OTP enam digit dengan sumber acak kriptografis.
// ------------------------------------------------------------

export function buatKodeOtp(): string {
  return randomInt(100000, 1000000).toString();
}

export function hashKodeOtp(kodeOtp: string): string {
  const rahasia = process.env.JWT_SECRET?.trim();
  if (!rahasia) throw new Error("JWT_SECRET wajib tersedia untuk melindungi OTP.");
  return createHmac("sha256", rahasia)
    .update("cnedu-password-reset:")
    .update(kodeOtp)
    .digest("hex");
}

export function cocokkanKodeOtp(kodeOtp: string, hashTersimpan: string): boolean {
  if (!/^[a-f\d]{64}$/i.test(hashTersimpan)) return false;
  const hashInput = Buffer.from(hashKodeOtp(kodeOtp), "hex");
  const hashTersimpanBuffer = Buffer.from(hashTersimpan, "hex");
  return timingSafeEqual(hashInput, hashTersimpanBuffer);
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
  if (!resend) {
    throw new Error("RESEND_API_KEY belum diatur; email OTP tidak tersedia.");
  }

  const labelAkun = tipeAkun === "GURU" ? "guru" : "siswa";
  const namaAman = nama.replace(/[&<>"']/g, (karakter) => {
    const entitas: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entitas[karakter];
  });

  const { error } = await resend.emails.send({
    from: EMAIL_PENGIRIM,
    to: email,
    subject: "Kode OTP Reset Password — CN Edu",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1677ff;">Reset Password CN Edu</h2>
        <p>Halo ${namaAman},</p>
        <p>
          Kami menerima permintaan reset password untuk akun ${labelAkun}
          kamu di CN Edu. Gunakan kode berikut untuk melanjutkan:
        </p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1677ff; text-align: center; margin: 24px 0;">
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