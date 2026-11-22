"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import BackAction from "@/components/BackAction";
import styles from "./page.module.css";

const WARNA_PRIMARY = "var(--cn-primary)";

type Mode = "LAPOR" | "OTP";
type TipeAkun = "GURU" | "SISWA";

interface PermintaanOtp {
  accessToken: string;
  tipeAkun: TipeAkun;
  identifier: string;
  kodeOtp?: string;
}

const KUNCI_PERMINTAAN_OTP = "cnedu:permintaan-otp";

interface KonteksRole {
  identifier: string;
  email: string;
  alasan: string;
  mode: Mode;
  otp: string;
  passwordBaru: string;
  konfirmasiPasswordBaru: string;
  permintaanOtp: PermintaanOtp | null;
  kodeOtpNotifikasi: string | null;
  statusNotifikasi: string | null;
  pesanInfo: string | null;
  pesanError: string | null;
  resetBerhasil: boolean;
}

function konteksKosong(): KonteksRole {
  return {
    identifier: "",
    email: "",
    alasan: "",
    mode: "LAPOR",
    otp: "",
    passwordBaru: "",
    konfirmasiPasswordBaru: "",
    permintaanOtp: null,
    kodeOtpNotifikasi: null,
    statusNotifikasi: null,
    pesanInfo: null,
    pesanError: null,
    resetBerhasil: false,
  };
}

function hapusPermintaanTersimpan() {
  try {
    window.sessionStorage.removeItem(KUNCI_PERMINTAAN_OTP);
  } catch {
    return;
  }
}

export default function HalamanLupaPassword() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("LAPOR");
  const [tipeAkun, setTipeAkun] = useState<TipeAkun>("SISWA");

  // Form lapor
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [alasan, setAlasan] = useState("");

  // Form OTP + password baru
  const [otp, setOtp] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPasswordBaru, setKonfirmasiPasswordBaru] = useState("");

  const [sedangProses, setSedangProses] = useState(false);
  const [pesanInfo, setPesanInfo] = useState<string | null>(null);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [resetBerhasil, setResetBerhasil] = useState(false);
  const [permintaanOtp, setPermintaanOtp] = useState<PermintaanOtp | null>(null);
  const [kodeOtpNotifikasi, setKodeOtpNotifikasi] = useState<string | null>(null);
  const [statusNotifikasi, setStatusNotifikasi] = useState<string | null>(null);
  const konteksRoleRef = useRef<Record<TipeAkun, KonteksRole>>({
    SISWA: konteksKosong(),
    GURU: konteksKosong(),
  });
  const tipeAkunAktifRef = useRef<TipeAkun>("SISWA");

  function simpanPermintaanPerRole(role: TipeAkun, permintaan: PermintaanOtp) {
    try {
      let tersimpan: Partial<Record<TipeAkun, PermintaanOtp>> = {};
      const raw = window.sessionStorage.getItem(KUNCI_PERMINTAAN_OTP);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === "object" && ("SISWA" in parsed || "GURU" in parsed)) {
          tersimpan = parsed as Partial<Record<TipeAkun, PermintaanOtp>>;
        } else if (parsed && typeof parsed === "object" && "accessToken" in parsed) {
          const lama = parsed as PermintaanOtp;
          tersimpan[lama.tipeAkun] = lama;
        }
      }
      tersimpan[role] = permintaan;
      window.sessionStorage.setItem(KUNCI_PERMINTAAN_OTP, JSON.stringify(tersimpan));
    } catch {
      return;
    }
  }

  function simpanOtpRole(role: TipeAkun, kodeOtp: string) {
    try {
      let tersimpan: Partial<Record<TipeAkun, PermintaanOtp>> = {};
      const raw = window.sessionStorage.getItem(KUNCI_PERMINTAAN_OTP);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === "object" && ("SISWA" in parsed || "GURU" in parsed)) {
          tersimpan = parsed as Partial<Record<TipeAkun, PermintaanOtp>>;
        } else if (parsed && typeof parsed === "object" && "accessToken" in parsed) {
          const lama = parsed as PermintaanOtp;
          tersimpan[lama.tipeAkun] = lama;
        }
      }
      const permintaan = tersimpan[role];
      if (!permintaan) return;
      tersimpan[role] = { ...permintaan, kodeOtp };
      window.sessionStorage.setItem(KUNCI_PERMINTAAN_OTP, JSON.stringify(tersimpan));
    } catch {
      return;
    }
  }

  function hapusPermintaanRole(role: TipeAkun) {
    try {
      const raw = window.sessionStorage.getItem(KUNCI_PERMINTAAN_OTP);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && ("SISWA" in parsed || "GURU" in parsed)) {
        const tersimpan = parsed as Partial<Record<TipeAkun, PermintaanOtp>>;
        delete tersimpan[role];
        if (tersimpan.SISWA || tersimpan.GURU) {
          window.sessionStorage.setItem(KUNCI_PERMINTAAN_OTP, JSON.stringify(tersimpan));
        } else {
          window.sessionStorage.removeItem(KUNCI_PERMINTAAN_OTP);
        }
      } else if (parsed && typeof parsed === "object" && "tipeAkun" in parsed) {
        if ((parsed as PermintaanOtp).tipeAkun === role) {
          window.sessionStorage.removeItem(KUNCI_PERMINTAAN_OTP);
        }
      }
    } catch {
      return;
    }
  }

  useEffect(() => {
    let masihAktif = true;
    let tersimpan: string | null;
    try {
      tersimpan = window.sessionStorage.getItem(KUNCI_PERMINTAAN_OTP);
    } catch {
      return;
    }
    if (!tersimpan) return;

    try {
      const parsed: unknown = JSON.parse(tersimpan);
      const permintaanPerRole: Partial<Record<TipeAkun, PermintaanOtp>> =
        parsed && typeof parsed === "object" && ("SISWA" in parsed || "GURU" in parsed)
          ? parsed as Partial<Record<TipeAkun, PermintaanOtp>>
          : parsed && typeof parsed === "object" && "accessToken" in parsed
            ? (() => {
                const lama = parsed as PermintaanOtp;
                return { [lama.tipeAkun]: lama } as Partial<Record<TipeAkun, PermintaanOtp>>;
              })()
            : {};

      void Promise.resolve().then(() => {
        if (!masihAktif) return;
        let peranAktif: TipeAkun = "SISWA";
        let peranDitemukan = false;
        for (const role of ["SISWA", "GURU"] as TipeAkun[]) {
          const permintaan = permintaanPerRole[role];
          if (
            permintaan &&
            /^[a-f\d]{64}$/i.test(permintaan.accessToken) &&
            (permintaan.tipeAkun === "GURU" || permintaan.tipeAkun === "SISWA") &&
            permintaan.identifier
          ) {
            konteksRoleRef.current[role] = {
              ...konteksKosong(),
              identifier: permintaan.identifier,
              permintaanOtp: permintaan,
              ...(permintaan.kodeOtp && /^\d{6}$/.test(permintaan.kodeOtp)
                ? {
                    mode: "OTP",
                    otp: permintaan.kodeOtp,
                    kodeOtpNotifikasi: permintaan.kodeOtp,
                  }
                : {
                    pesanInfo:
                      "Permintaan masih diproses. Jika admin membuat OTP manual, kode akan muncul di halaman ini.",
                    statusNotifikasi:
                      "Halaman ini memeriksa notifikasi OTP secara otomatis.",
                  }),
            };
            if (!peranDitemukan || role === "SISWA") {
              peranAktif = role;
            }
            peranDitemukan = true;
          }
        }

        const konteks = konteksRoleRef.current[peranAktif];
        tipeAkunAktifRef.current = peranAktif;
        setTipeAkun(peranAktif);
        setIdentifier(konteks.identifier);
        setEmail(konteks.email);
        setAlasan(konteks.alasan);
        setMode(konteks.mode);
        setOtp(konteks.otp);
        setPasswordBaru(konteks.passwordBaru);
        setKonfirmasiPasswordBaru(konteks.konfirmasiPasswordBaru);
        setPermintaanOtp(konteks.permintaanOtp);
        setKodeOtpNotifikasi(konteks.kodeOtpNotifikasi);
        setStatusNotifikasi(konteks.statusNotifikasi);
        setPesanInfo(konteks.pesanInfo);
        setPesanError(konteks.pesanError);
        setResetBerhasil(konteks.resetBerhasil);
      });
    } catch {
      hapusPermintaanTersimpan();
    }

    return () => {
      masihAktif = false;
    };
  }, []);

  useEffect(() => {
    if (!permintaanOtp) return;
    const { accessToken, tipeAkun: tipeAkunPermintaan, identifier: identifierPermintaan } =
      permintaanOtp;

    let masihAktif = true;
    let timer: ReturnType<typeof setTimeout>;

    async function cekNotifikasiOtp() {
      try {
        const response = await fetch("/api/lupa-password/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
        });
        const data = await response.json();
        if (!masihAktif) return;
        if (!response.ok) throw new Error(data.pesan ?? "Notifikasi OTP belum dapat diperiksa.");

        if (data.status === "OTP_MANUAL" && /^\d{6}$/.test(data.kodeOtp)) {
          const konteksSekarang = konteksRoleRef.current[tipeAkunPermintaan];
          const konteksOtp: KonteksRole = {
            ...konteksSekarang,
            identifier: identifierPermintaan,
            mode: "OTP",
            otp: data.kodeOtp,
            kodeOtpNotifikasi: data.kodeOtp,
            permintaanOtp: { accessToken, tipeAkun: tipeAkunPermintaan, identifier: identifierPermintaan },
            pesanInfo: null,
            pesanError: null,
            statusNotifikasi: null,
          };
          konteksRoleRef.current[tipeAkunPermintaan] = konteksOtp;
          simpanOtpRole(tipeAkunPermintaan, data.kodeOtp);

          if (tipeAkunAktifRef.current === tipeAkunPermintaan) {
            setTipeAkun(tipeAkunPermintaan);
            setIdentifier(identifierPermintaan);
            setOtp(data.kodeOtp);
            setKodeOtpNotifikasi(data.kodeOtp);
            setMode("OTP");
            setPesanInfo(null);
            setPesanError(null);
            setStatusNotifikasi(null);
          }
          return;
        }

        setStatusNotifikasi(
          "Jika admin membuat OTP manual, kode akan muncul otomatis di halaman ini."
        );
      } catch {
        if (!masihAktif) return;
        setStatusNotifikasi("Notifikasi belum dapat diperiksa. Sistem akan mencoba kembali.");
      }

      if (masihAktif) {
        timer = setTimeout(() => void cekNotifikasiOtp(), 2000);
      }
    }

    void cekNotifikasiOtp();
    return () => {
      masihAktif = false;
      clearTimeout(timer);
    };
  }, [permintaanOtp]);

  async function handleLapor(event: FormEvent) {
    event.preventDefault();
    setSedangProses(true);
    setPesanError(null);
    setPesanInfo(null);

    try {
      const bytes = new Uint8Array(32);
      window.crypto.getRandomValues(bytes);
      const permintaanBaru: PermintaanOtp = {
        accessToken: Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(""),
        tipeAkun,
        identifier: identifier.trim(),
      };
      konteksRoleRef.current[tipeAkun] = {
        identifier: identifier.trim(),
        email: email.trim(),
        alasan: alasan.trim(),
        mode: "LAPOR",
        otp: "",
        passwordBaru: "",
        konfirmasiPasswordBaru: "",
        permintaanOtp: permintaanBaru,
        kodeOtpNotifikasi: null,
        statusNotifikasi:
          "Jika admin membuat OTP manual, kode akan muncul otomatis di halaman ini.",
        pesanInfo: null,
        pesanError: null,
        resetBerhasil: false,
      };
      setPermintaanOtp(permintaanBaru);
      setKodeOtpNotifikasi(null);
      setStatusNotifikasi(
        "Jika admin membuat OTP manual, kode akan muncul otomatis di halaman ini."
      );
      try {
        simpanPermintaanPerRole(tipeAkun, permintaanBaru);
      } catch {
        setStatusNotifikasi("Biarkan halaman ini tetap terbuka agar notifikasi OTP dapat diterima.");
      }

      const response = await fetch("/api/lupa-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipeAkun,
          identifier,
          email,
          alasan,
          accessToken: permintaanBaru.accessToken,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setPermintaanOtp(null);
        setStatusNotifikasi(null);
        hapusPermintaanRole(tipeAkun);
        setPesanError(data.pesan ?? "Gagal mengirim laporan");
        return;
      }
      setPesanInfo(data.pesan);
    } catch {
      setPesanError("Tidak bisa terhubung ke server, coba lagi.");
      setStatusNotifikasi("Jika laporan sudah terkirim, halaman ini tetap memeriksa notifikasi OTP manual.");
    } finally {
      setSedangProses(false);
    }
  }

  async function handleReset(event: FormEvent) {
    event.preventDefault();
    setSedangProses(true);
    setPesanError(null);

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipeAkun,
          identifier,
          otp,
          passwordBaru,
          konfirmasiPasswordBaru,
          accessToken: permintaanOtp?.accessToken,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setPesanError(data.pesan ?? "Gagal mengubah password");
        return;
      }
      setResetBerhasil(true);
      setPermintaanOtp(null);
      setKodeOtpNotifikasi(null);
      setStatusNotifikasi(null);
      konteksRoleRef.current[tipeAkun] = {
        ...konteksKosong(),
        identifier,
        email,
        mode: "OTP",
        resetBerhasil: true,
      };
      hapusPermintaanRole(tipeAkun);
    } catch {
      setPesanError("Tidak bisa terhubung ke server, coba lagi.");
    } finally {
      setSedangProses(false);
    }
  }

  function pindahMode(m: Mode) {
    setMode(m);
    setPesanError(null);
    setPesanInfo(null);
    setResetBerhasil(false);
  }

  function pindahJenisAkun(tab: TipeAkun) {
    if (tab === tipeAkun) return;

    konteksRoleRef.current[tipeAkun] = {
      identifier,
      email,
      alasan,
      mode,
      otp,
      passwordBaru,
      konfirmasiPasswordBaru,
      permintaanOtp,
      kodeOtpNotifikasi,
      statusNotifikasi,
      pesanInfo,
      pesanError,
      resetBerhasil,
    };

    const konteks = konteksRoleRef.current[tab];
    tipeAkunAktifRef.current = tab;
    setTipeAkun(tab);
    setIdentifier(konteks.identifier);
    setEmail(konteks.email);
    setAlasan(konteks.alasan);
    setMode(konteks.mode);
    setOtp(konteks.otp);
    setPasswordBaru(konteks.passwordBaru);
    setKonfirmasiPasswordBaru(konteks.konfirmasiPasswordBaru);
    setPermintaanOtp(konteks.permintaanOtp);
    setKodeOtpNotifikasi(konteks.kodeOtpNotifikasi);
    setStatusNotifikasi(konteks.statusNotifikasi);
    setPesanInfo(konteks.pesanInfo);
    setPesanError(konteks.pesanError);
    setResetBerhasil(konteks.resetBerhasil);
  }

  return (
    <div id="lupa-password-page" className={styles.halaman}>
      <main className={styles.kartu} aria-labelledby="judul-lupa-password">
        <BackAction as="button" onClick={() => router.push("/login")} className={styles.tombolBack}>
          Kembali ke Login
        </BackAction>

        <div className={styles.header}>
          <span className={styles.eyebrow}>Pemulihan Akun</span>
          <h1 id="judul-lupa-password" className={styles.judul}>
          {mode === "LAPOR" ? "Lupa Password" : "Masukkan Kode OTP"}
          </h1>
          <p className={styles.subjudul}>
          {mode === "LAPOR"
            ? "Isi NIS/NIK dan email terdaftar. OTP dikirim lewat email; jika perlu, admin bisa membuat kode yang muncul di halaman ini."
            : "Masukkan kode OTP 6 digit dari email terdaftar atau dari admin sekolah, lalu buat password baru."}
          </p>
        </div>

        <div className={styles.barisTab} role="tablist" aria-label="Jenis akun">
          {(["SISWA", "GURU"] as TipeAkun[]).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={tipeAkun === tab}
              onClick={() => pindahJenisAkun(tab)}
              className={`${styles.tab} ${tipeAkun === tab ? styles.tabAktif : ""}`}
            >
              {tab === "SISWA" ? "Siswa" : "Guru"}
            </button>
          ))}
        </div>

        {mode === "LAPOR" && !pesanInfo && (
          <form onSubmit={handleLapor} style={estilo.form}>
            <label style={estilo.label}>
              {tipeAkun === "SISWA" ? "NIS" : "NIK"}
              <input
                type="text"
                inputMode="numeric"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder={tipeAkun === "SISWA" ? "Contoh: 2712008" : "Contoh: 3216..."}
                style={estilo.input}
              />
            </label>
            <label style={estilo.label}>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nama@email.com"
                style={estilo.input}
              />
            </label>
            <label style={estilo.label}>
              Alasan <span style={estilo.opsional}>(opsional)</span>
              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                rows={3}
                placeholder="Tuliskan kendala singkat..."
                style={estilo.textarea}
              />
            </label>

            {pesanError && <p style={estilo.pesan_error}>{pesanError}</p>}
            {statusNotifikasi && (
              <p role="status" style={estilo.statusNotifikasi}>
                {statusNotifikasi}
              </p>
            )}

            <button type="submit" disabled={sedangProses} style={estilo.tombol}>
              {sedangProses ? "Mengirim..." : "Kirim Laporan"}
            </button>
          </form>
        )}

        {mode === "LAPOR" && pesanInfo && (
          <div style={estilo.kotakInfo}>
            <p>{pesanInfo}</p>
            {statusNotifikasi && (
              <p role="status" style={estilo.statusNotifikasi}>
                {statusNotifikasi}
              </p>
            )}
            <button
              type="button"
              onClick={() => pindahMode("OTP")}
              style={estilo.linkKecil}
            >
              Sudah menerima kode OTP?
            </button>
            <button
              type="button"
              onClick={() => {
                setPesanInfo(null);
                setPesanError(null);
              }}
              style={estilo.linkKecil}
            >
              Belum menerima email? Kirim permintaan lagi
            </button>
          </div>
        )}

        {mode === "OTP" && !resetBerhasil && (
          <>
            {kodeOtpNotifikasi && (
              <div role="status" style={estilo.notifikasiOtp}>
                <span style={estilo.notifikasiOtpLabel}>OTP MANUAL DARI ADMIN</span>
                <strong>{kodeOtpNotifikasi}</strong>
                <p>Kode sudah terisi otomatis dan berlaku selama 1 menit.</p>
              </div>
            )}
            <form onSubmit={handleReset} style={estilo.form}>
              <label style={estilo.label}>
                {tipeAkun === "SISWA" ? "NIS" : "NIK"}
                <input
                  type="text"
                  inputMode="numeric"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder={tipeAkun === "SISWA" ? "Contoh: 2712008" : "Contoh: 3216..."}
                  style={estilo.input}
                />
              </label>
              <label style={estilo.label}>
                Kode OTP
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  placeholder="••••••"
                  style={estilo.input}
                />
              </label>
              <label style={estilo.label}>
                Password Baru
                <input
                  type="password"
                  value={passwordBaru}
                  onChange={(e) => setPasswordBaru(e.target.value)}
                  minLength={8}
                  required
                  style={estilo.input}
                />
              </label>
              <label style={estilo.label}>
                Konfirmasi Password Baru
                <input
                  type="password"
                  value={konfirmasiPasswordBaru}
                  onChange={(e) => setKonfirmasiPasswordBaru(e.target.value)}
                  minLength={8}
                  required
                  style={estilo.input}
                />
              </label>

              {pesanError && <p style={estilo.pesan_error}>{pesanError}</p>}

              <button type="submit" disabled={sedangProses} style={estilo.tombol}>
                {sedangProses ? "Menyimpan..." : "Ganti Password"}
              </button>
            </form>
          </>
        )}

        {mode === "OTP" && resetBerhasil && (
          <div style={estilo.kotakInfo}>
            <p>Password berhasil diubah. Silakan login dengan password baru kamu.</p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              style={estilo.tombol}
            >
              Ke Halaman Login
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => pindahMode(mode === "LAPOR" ? "OTP" : "LAPOR")}
          className={styles.modeLink}
        >
          {mode === "LAPOR" ? "Sudah punya kode OTP?" : "Belum lapor? Isi form laporan"}
        </button>
      </main>
    </div>
  );
}

const estilo = {
  halaman: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--cn-surface)",
    padding: "16px",
  },
  kartu: {
    width: "100%",
    maxWidth: "400px",
    padding: "32px",
    borderRadius: "12px",
    border: "1px solid var(--cn-line)",
    boxShadow: "0 2px 12px rgba(var(--cn-navy-rgb), 0.06)",
  },
  judul: {
    color: "var(--cn-navy)",
    fontSize: "20px",
    fontWeight: 700,
    marginBottom: "8px",
    textAlign: "center" as const,
  },
  subjudul: {
    color: "var(--cn-text)",
    fontSize: "13px",
    marginBottom: "20px",
    textAlign: "center" as const,
    lineHeight: 1.5,
  },
  baris_tab: {
    display: "flex",
    gap: "4px",
    marginBottom: "20px",
    backgroundColor: "var(--cn-coral-tint)",
    borderRadius: "8px",
    padding: "4px",
  },
  tab: {
    flex: 1,
    padding: "8px 0",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "transparent",
    color: "var(--cn-coral-dark)",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  tab_aktif: { backgroundColor: WARNA_PRIMARY, color: "var(--cn-surface)" },
  form: { display: "flex", flexDirection: "column" as const, gap: "14px" },
  label: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--cn-navy)",
  },
  opsional: {
    color: "var(--cn-muted)",
    fontSize: "11px",
    fontWeight: 400,
  },
  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--cn-line)",
    fontSize: "14px",
    color: "var(--cn-navy)",
    outline: "none",
  },
  textarea: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--cn-line)",
    fontSize: "14px",
    color: "var(--cn-navy)",
    outline: "none",
    resize: "vertical" as const,
    fontFamily: "inherit",
  },
  pesan_error: { color: "var(--cn-danger)", fontSize: "13px", margin: 0 },
  tombol: {
    marginTop: "6px",
    padding: "10px 0",
    borderRadius: "8px",
    border: "none",
    backgroundColor: WARNA_PRIMARY,
    color: "var(--cn-surface)",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },
  kotakInfo: {
    textAlign: "center" as const,
    fontSize: "14px",
    color: "var(--cn-navy)",
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  statusNotifikasi: {
    margin: 0,
    padding: "10px 12px",
    borderRadius: "8px",
    backgroundColor: "var(--cn-tint)",
    color: "var(--cn-text)",
    fontSize: "12px",
    lineHeight: 1.5,
  },
  notifikasiOtp: {
    display: "grid",
    justifyItems: "center",
    gap: "6px",
    marginBottom: "16px",
    padding: "14px",
    border: "1px solid var(--cn-success-tint)",
    borderRadius: "10px",
    backgroundColor: "var(--cn-success-tint)",
    color: "var(--cn-navy)",
    textAlign: "center" as const,
  },
  notifikasiOtpLabel: {
    color: "var(--cn-success)",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.08em",
  },
  linkKecil: {
    background: "none",
    border: "none",
    color: WARNA_PRIMARY,
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
  },
  linkBawah: {
    display: "block",
    width: "100%",
    textAlign: "center" as const,
    background: "none",
    border: "none",
    color: "var(--cn-text)",
    fontSize: "12px",
    cursor: "pointer",
    marginTop: "16px",
  },
};