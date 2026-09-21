"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const WARNA_PRIMARY = "#2196f3";

type Mode = "LAPOR" | "OTP";
type TipeAkun = "GURU" | "SISWA";

export default function HalamanLupaPassword() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("LAPOR");
  const [tipeAkun, setTipeAkun] = useState<TipeAkun>("SISWA");

  // Form lapor
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [alasan, setAlasan] = useState("");

  // Form OTP + password baru
  const [otp, setOtp] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPasswordBaru, setKonfirmasiPasswordBaru] = useState("");

  const [sedangProses, setSedangProses] = useState(false);
  const [pesanInfo, setPesanInfo] = useState<string | null>(null);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [resetBerhasil, setResetBerhasil] = useState(false);

  async function handleLapor(event: FormEvent) {
    event.preventDefault();
    setSedangProses(true);
    setPesanError(null);
    setPesanInfo(null);

    try {
      const response = await fetch("/api/lupa-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipeAkun, identifier, email, tanggalLahir, alasan }),
      });
      const data = await response.json();

      if (!response.ok) {
        setPesanError(data.pesan ?? "Gagal mengirim laporan");
        return;
      }
      setPesanInfo(data.pesan);
    } catch {
      setPesanError("Tidak bisa terhubung ke server, coba lagi.");
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
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setPesanError(data.pesan ?? "Gagal mengubah password");
        return;
      }
      setResetBerhasil(true);
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

  return (
    <div style={estilo.halaman}>
      <div style={estilo.kartu}>
        <h1 style={estilo.judul}>
          {mode === "LAPOR" ? "Lupa Password" : "Masukkan Kode OTP"}
        </h1>
        <p style={estilo.subjudul}>
          {mode === "LAPOR"
            ? "Isi data kamu, laporan akan diteruskan ke admin sekolah untuk diverifikasi."
            : "Cek email kamu untuk kode OTP dari admin, lalu buat password baru."}
        </p>

        <div style={estilo.baris_tab}>
          {(["SISWA", "GURU"] as TipeAkun[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTipeAkun(tab)}
              style={{ ...estilo.tab, ...(tipeAkun === tab ? estilo.tab_aktif : {}) }}
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
                style={estilo.input}
              />
            </label>
            <label style={estilo.label}>
              Tanggal Lahir
              <input
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                required
                style={estilo.input}
              />
            </label>
            <label style={estilo.label}>
              Alasan
              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                rows={3}
                required
                style={estilo.textarea}
              />
            </label>

            {pesanError && <p style={estilo.pesan_error}>{pesanError}</p>}

            <button type="submit" disabled={sedangProses} style={estilo.tombol}>
              {sedangProses ? "Mengirim..." : "Kirim Laporan"}
            </button>
          </form>
        )}

        {mode === "LAPOR" && pesanInfo && (
          <div style={estilo.kotakInfo}>
            <p>{pesanInfo}</p>
            <button
              type="button"
              onClick={() => pindahMode("OTP")}
              style={estilo.linkKecil}
            >
              Sudah dapat kode OTP dari admin?
            </button>
          </div>
        )}

        {mode === "OTP" && !resetBerhasil && (
          <form onSubmit={handleReset} style={estilo.form}>
            <label style={estilo.label}>
              {tipeAkun === "SISWA" ? "NIS" : "NIK"}
              <input
                type="text"
                inputMode="numeric"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                style={estilo.input}
              />
            </label>
            <label style={estilo.label}>
              Kode OTP
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
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
          style={estilo.linkBawah}
        >
          {mode === "LAPOR" ? "Sudah punya kode OTP?" : "Belum lapor? Isi form laporan"}
        </button>

        <button type="button" onClick={() => router.push("/login")} style={estilo.linkBawah}>
          ← Kembali ke Login
        </button>
      </div>
    </div>
  );
}

const estilo = {
  halaman: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    padding: "16px",
  },
  kartu: {
    width: "100%",
    maxWidth: "400px",
    padding: "32px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  judul: {
    color: "#000000",
    fontSize: "20px",
    fontWeight: 700,
    marginBottom: "8px",
    textAlign: "center" as const,
  },
  subjudul: {
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "20px",
    textAlign: "center" as const,
    lineHeight: 1.5,
  },
  baris_tab: {
    display: "flex",
    gap: "4px",
    marginBottom: "20px",
    backgroundColor: "#f3f4f6",
    borderRadius: "8px",
    padding: "4px",
  },
  tab: {
    flex: 1,
    padding: "8px 0",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "transparent",
    color: "#374151",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  tab_aktif: { backgroundColor: WARNA_PRIMARY, color: "#ffffff" },
  form: { display: "flex", flexDirection: "column" as const, gap: "14px" },
  label: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#000000",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    color: "#000000",
    outline: "none",
  },
  textarea: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    color: "#000000",
    outline: "none",
    resize: "vertical" as const,
    fontFamily: "inherit",
  },
  pesan_error: { color: "#dc2626", fontSize: "13px", margin: 0 },
  tombol: {
    marginTop: "6px",
    padding: "10px 0",
    borderRadius: "8px",
    border: "none",
    backgroundColor: WARNA_PRIMARY,
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },
  kotakInfo: {
    textAlign: "center" as const,
    fontSize: "14px",
    color: "#000000",
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
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
    color: "#6b7280",
    fontSize: "12px",
    cursor: "pointer",
    marginTop: "16px",
  },
};