"use client";

import { useEffect, useState, useCallback } from "react";

const WARNA_PRIMARY = "#2196f3";

interface Laporan {
  id: string;
  tipeAkun: "GURU" | "SISWA";
  namaPelapor: string;
  email: string;
  nikNisInput: string;
  alasan: string;
  status: "MENUNGGU" | "DITERIMA" | "DITOLAK" | "SELESAI";
  createdAt: string;
}

const LABEL_STATUS: Record<Laporan["status"], string> = {
  MENUNGGU: "Menunggu",
  DITERIMA: "OTP Terkirim",
  DITOLAK: "Ditolak",
  SELESAI: "Selesai",
};

export default function HalamanLaporan() {
  const [daftarLaporan, setDaftarLaporan] = useState<Laporan[]>([]);
  const [sedangMuat, setSedangMuat] = useState(true);
  const [sedangProsesId, setSedangProsesId] = useState<string | null>(null);

  const muatLaporan = useCallback(async () => {
    setSedangMuat(true);
    const response = await fetch("/api/lupa-password");
    const data = await response.json();
    if (response.ok) setDaftarLaporan(data.data);
    setSedangMuat(false);
  }, []);

  useEffect(() => {
    muatLaporan();
  }, [muatLaporan]);

  async function kirimOtp(id: string) {
    setSedangProsesId(id);
    await fetch(`/api/lupa-password/${id}/kirim-otp`, { method: "POST" });
    await muatLaporan();
    setSedangProsesId(null);
  }

  async function tolakLaporan(id: string) {
    if (!confirm("Tolak & hapus laporan ini?")) return;
    setSedangProsesId(id);
    await fetch(`/api/lupa-password/${id}/tolak`, { method: "POST" });
    await muatLaporan();
    setSedangProsesId(null);
  }

  async function selesaikanLaporan(id: string) {
    if (!confirm("Tandai laporan ini selesai? Laporan akan dihapus dari daftar.")) return;
    setSedangProsesId(id);
    await fetch(`/api/lupa-password/${id}/selesai`, { method: "POST" });
    await muatLaporan();
    setSedangProsesId(null);
  }

  return (
    <div style={estilo.halaman}>
      <h1 style={estilo.judulHalaman}>Laporan Lupa Password</h1>

      {sedangMuat && <p style={estilo.pesanMuat}>Memuat...</p>}
      {!sedangMuat && daftarLaporan.length === 0 && (
        <p style={estilo.pesanKosong}>Belum ada laporan masuk.</p>
      )}

      <div style={estilo.daftar}>
        {daftarLaporan.map((l) => (
          <div key={l.id} style={estilo.kartuLaporan}>
            <div style={estilo.headerKartu}>
              <div>
                <strong style={estilo.namaPelapor}>{l.namaPelapor}</strong>
                <span style={estilo.badgeTipe}>
                  {l.tipeAkun === "GURU" ? "Guru" : "Siswa"}
                </span>
              </div>
              <span style={{ ...estilo.badgeStatus, ...warnaBadgeStatus(l.status) }}>
                {LABEL_STATUS[l.status]}
              </span>
            </div>

            <div style={estilo.infoGrid}>
              <span>Email: {l.email}</span>
              <span>{l.tipeAkun === "SISWA" ? "NIS" : "NIK"}: {l.nikNisInput}</span>
            </div>
            <p style={estilo.alasan}>&quot;{l.alasan}&quot;</p>

            <div style={estilo.aksi}>
              {l.status === "MENUNGGU" && (
                <>
                  <button
                    onClick={() => kirimOtp(l.id)}
                    disabled={sedangProsesId === l.id}
                    style={estilo.tombolTerima}
                  >
                    Terima & Kirim OTP
                  </button>
                  <button
                    onClick={() => tolakLaporan(l.id)}
                    disabled={sedangProsesId === l.id}
                    style={estilo.tombolTolak}
                  >
                    Tolak
                  </button>
                </>
              )}
              {l.status === "DITERIMA" && (
                <>
                  <button
                    onClick={() => kirimOtp(l.id)}
                    disabled={sedangProsesId === l.id}
                    style={estilo.tombolTerima}
                  >
                    Kirim Ulang OTP
                  </button>
                  <button
                    onClick={() => selesaikanLaporan(l.id)}
                    disabled={sedangProsesId === l.id}
                    style={estilo.tombolSelesai}
                  >
                    Selesai
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function warnaBadgeStatus(status: Laporan["status"]) {
  switch (status) {
    case "MENUNGGU":
      return { backgroundColor: "#fef3c7", color: "#92400e" };
    case "DITERIMA":
      return { backgroundColor: "#e8f3fe", color: WARNA_PRIMARY };
    case "DITOLAK":
      return { backgroundColor: "#fee2e2", color: "#991b1b" };
    case "SELESAI":
      return { backgroundColor: "#dcfce7", color: "#166534" };
  }
}

const estilo = {
  halaman: { padding: "24px", backgroundColor: "#ffffff", minHeight: "100vh" },
  judulHalaman: { margin: "0 0 16px 0", fontSize: "22px", fontWeight: 700, color: "#000000" },
  pesanMuat: { color: "#6b7280", fontSize: "14px" },
  pesanKosong: { color: "#9ca3af", fontSize: "14px" },
  daftar: { display: "flex", flexDirection: "column" as const, gap: "12px" },
  kartuLaporan: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  },
  headerKartu: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  namaPelapor: { fontSize: "14px", color: "#000000", marginRight: "8px" },
  badgeTipe: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#6b7280",
    backgroundColor: "#f3f4f6",
    padding: "2px 8px",
    borderRadius: "999px",
  },
  badgeStatus: {
    fontSize: "11px",
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: "999px",
  },
  infoGrid: {
    display: "flex",
    gap: "16px",
    fontSize: "12px",
    color: "#6b7280",
    flexWrap: "wrap" as const,
  },
  alasan: {
    fontSize: "13px",
    color: "#374151",
    fontStyle: "italic" as const,
    margin: 0,
  },
  aksi: { display: "flex", gap: "8px" },
  tombolTerima: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#ffffff",
    backgroundColor: WARNA_PRIMARY,
    border: "none",
    borderRadius: "6px",
    padding: "6px 12px",
    cursor: "pointer",
  },
  tombolTolak: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#dc2626",
    background: "none",
    border: "1px solid #dc2626",
    borderRadius: "6px",
    padding: "6px 12px",
    cursor: "pointer",
  },
  tombolSelesai: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#16a34a",
    background: "none",
    border: "1px solid #16a34a",
    borderRadius: "6px",
    padding: "6px 12px",
    cursor: "pointer",
  },
};