"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const WARNA_PRIMARY = "#2196f3";

export default function HalamanGantiPasswordAwal() {
  const router = useRouter();

  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPasswordBaru, setKonfirmasiPasswordBaru] = useState("");
  const [sedangProses, setSedangProses] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPesanError(null);
    setSedangProses(true);

    try {
      const response = await fetch("/api/ganti-password-awal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordBaru, konfirmasiPasswordBaru }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPesanError(data.pesan ?? "Gagal mengubah password, coba lagi");
        return;
      }

      router.push(data.redirect);
      router.refresh();
    } catch {
      setPesanError("Tidak bisa terhubung ke server, coba lagi.");
    } finally {
      setSedangProses(false);
    }
  }

  return (
    <div style={estilo.halaman}>
      <div style={estilo.kartu}>
        <h1 style={estilo.judul}>Buat Password Baru</h1>
        <p style={estilo.subjudul}>
          Ini login pertama kamu. Demi keamanan, ganti dulu password default
          sebelum lanjut ke dashboard.
        </p>

        <form onSubmit={handleSubmit} style={estilo.form}>
          <label style={estilo.label}>
            Password Baru
            <input
              type="password"
              value={passwordBaru}
              onChange={(e) => setPasswordBaru(e.target.value)}
              placeholder="Minimal 8 karakter"
              required
              minLength={8}
              style={estilo.input}
            />
          </label>

          <label style={estilo.label}>
            Konfirmasi Password Baru
            <input
              type="password"
              value={konfirmasiPasswordBaru}
              onChange={(e) => setKonfirmasiPasswordBaru(e.target.value)}
              placeholder="Ulangi password baru"
              required
              minLength={8}
              style={estilo.input}
            />
          </label>

          {pesanError && <p style={estilo.pesan_error}>{pesanError}</p>}

          <button type="submit" disabled={sedangProses} style={estilo.tombol}>
            {sedangProses ? "Menyimpan..." : "Simpan & Lanjutkan"}
          </button>
        </form>
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
    maxWidth: "380px",
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
    color: "#4b5563",
    fontSize: "13px",
    marginBottom: "20px",
    textAlign: "center" as const,
    lineHeight: 1.5,
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "14px",
  },
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
  pesan_error: {
    color: "#dc2626",
    fontSize: "13px",
    margin: 0,
  },
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
};