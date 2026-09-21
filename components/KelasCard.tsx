"use client";

import { useState } from "react";

export interface DataKelasCard {
  id: string;
  judul: string;
  deskripsi: string | null;
  kodeKelas: string;
  jumlahSiswa: number;
}

interface PropsKelasCard {
  kelas: DataKelasCard;
  onKlik: () => void;
}

const WARNA_PRIMARY = "#2196f3";

export default function KelasCard({ kelas, onKlik }: PropsKelasCard) {
  const [tersalin, setTersalin] = useState(false);

  async function salinLinkUndangan(event: React.MouseEvent) {
    // Cegah klik tombol salin ikut memicu onKlik (buka detail kelas)
    event.stopPropagation();

    const linkUndangan = `${window.location.origin}/gabung-kelas/${kelas.kodeKelas}`;
    try {
      await navigator.clipboard.writeText(linkUndangan);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 2000);
    } catch {
      // Fallback kalau Clipboard API diblokir browser (mis. bukan https)
      window.prompt("Salin link undangan ini secara manual:", linkUndangan);
    }
  }

  return (
    <div onClick={onKlik} style={estilo.kartu}>
      <h3 style={estilo.judul}>{kelas.judul}</h3>

      {kelas.deskripsi && <p style={estilo.deskripsi}>{kelas.deskripsi}</p>}

      <div style={estilo.baris_info}>
        <span style={estilo.badge}>
          {kelas.jumlahSiswa} siswa
        </span>
        <span style={estilo.kode_kelas}>{kelas.kodeKelas}</span>
      </div>

      <button onClick={salinLinkUndangan} style={estilo.tombol_salin} type="button">
        {tersalin ? "Link tersalin!" : "Salin Link Undangan"}
      </button>
    </div>
  );
}

const estilo = {
  kartu: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
    cursor: "pointer",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    transition: "box-shadow 0.15s",
  },
  judul: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 700,
    color: "#000000",
  },
  deskripsi: {
    margin: 0,
    fontSize: "13px",
    color: "#6b7280",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },
  baris_info: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
  },
  badge: {
    backgroundColor: "#e8f3fe",
    color: WARNA_PRIMARY,
    padding: "2px 8px",
    borderRadius: "999px",
    fontWeight: 600,
  },
  kode_kelas: {
    color: "#9ca3af",
    fontFamily: "monospace",
  },
  tombol_salin: {
    marginTop: "4px",
    padding: "6px 0",
    borderRadius: "6px",
    border: `1px solid ${WARNA_PRIMARY}`,
    backgroundColor: "transparent",
    color: WARNA_PRIMARY,
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },
};