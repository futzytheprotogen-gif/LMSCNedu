import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import nodemailer from "nodemailer";

// ------------------------------------------------------------
// Dipakai khusus untuk alur "Lupa Password" (lihat catatan di
// /areas/project-lms-sekolah.md bagian Autentikasi & Login):
// Permintaan yang datanya cocok mengirim OTP otomatis; admin juga dapat
// mengirim ulang lewat email atau membuat OTP manual. Kode berlaku 1 menit.
// ------------------------------------------------------------

const GMAIL_USER = process.env.GMAIL_USER?.trim();
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
const transporter = GMAIL_USER && GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    })
  : null;

export const MENIT_KADALUARSA_OTP_EMAIL = 10;
export const MENIT_KADALUARSA_OTP_MANUAL = 1;
export const EMAIL_OTP_TERSEDIA = Boolean(transporter);

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

function kunciEnkripsiOtp(): Buffer {
  const rahasia = process.env.JWT_SECRET?.trim();
  if (!rahasia) throw new Error("JWT_SECRET wajib tersedia untuk melindungi OTP.");
  return createHash("sha256")
    .update("cnedu-manual-otp-encryption:")
    .update(rahasia)
    .digest();
}

export function hashTokenPermintaanOtp(token: string): string {
  return createHash("sha256")
    .update("cnedu-otp-notification-access:")
    .update(token)
    .digest("hex");
}

export function enkripsiKodeOtp(kodeOtp: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", kunciEnkripsiOtp(), iv);
  const ciphertext = Buffer.concat([cipher.update(kodeOtp, "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function dekripsiKodeOtp(enkripsi: string): string {
  const [versi, ivEncoded, tagEncoded, ciphertextEncoded, ...sisa] = enkripsi.split(".");
  if (versi !== "v1" || !ivEncoded || !tagEncoded || !ciphertextEncoded || sisa.length > 0) {
    throw new Error("Format notifikasi OTP tidak valid.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    kunciEnkripsiOtp(),
    Buffer.from(ivEncoded, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
  const kodeOtp = Buffer.concat([
    decipher.update(Buffer.from(ciphertextEncoded, "base64url")),
    decipher.final(),
  ]).toString("utf8");

  if (!/^\d{6}$/.test(kodeOtp)) {
    throw new Error("Kode OTP terenkripsi tidak valid.");
  }
  return kodeOtp;
}

export function cocokkanKodeOtp(kodeOtp: string, hashTersimpan: string): boolean {
  if (!/^[a-f\d]{64}$/i.test(hashTersimpan)) return false;
  const hashInput = Buffer.from(hashKodeOtp(kodeOtp), "hex");
  const hashTersimpanBuffer = Buffer.from(hashTersimpan, "hex");
  return timingSafeEqual(hashInput, hashTersimpanBuffer);
}

export function hitungWaktuKadaluarsaOtp(mode: "EMAIL" | "MANUAL" = "EMAIL"): Date {
  const menit = mode === "MANUAL"
    ? MENIT_KADALUARSA_OTP_MANUAL
    : MENIT_KADALUARSA_OTP_EMAIL;
  return new Date(Date.now() + menit * 60 * 1000);
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
  if (!transporter || !GMAIL_USER) {
    throw new Error("GMAIL_USER dan GMAIL_APP_PASSWORD belum diatur; email OTP tidak tersedia.");
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

  await transporter.sendMail({
    from: {
      name: "CN Edu",
      address: GMAIL_USER,
    },
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
          Kode ini berlaku selama <strong>${MENIT_KADALUARSA_OTP_EMAIL} menit</strong>.
          Kalau kamu tidak merasa meminta reset password, abaikan email
          ini — akun kamu tetap aman.
        </p>
        <p style="color: #888; font-size: 12px; margin-top: 32px;">
          Email otomatis dari sistem CN Edu, mohon tidak dibalas.
        </p>
      </div>
    `,
  });
}