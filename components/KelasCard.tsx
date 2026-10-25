"use client";

export interface DataKelasCard {
  id: string;
  judul: string;
  deskripsi: string | null;
  jumlahSiswa: number;
  createdAt?: string;
}

interface PropsKelasCard {
  kelas: DataKelasCard;
  onKlik: () => void;
}

const WARNA_PRIMARY = "var(--cn-primary)";

export default function KelasCard({ kelas, onKlik }: PropsKelasCard) {
  return (
    <div onClick={onKlik} style={estilo.kartu}>
      <h3 style={estilo.judul}>{kelas.judul}</h3>

      {kelas.deskripsi && <p style={estilo.deskripsi}>{kelas.deskripsi}</p>}

      <div style={estilo.baris_info}>
        <span style={estilo.badge}>
          {kelas.jumlahSiswa} siswa
        </span>
      </div>
    </div>
  );
}

const estilo = {
  kartu: {
    border: "1px solid var(--cn-line)",
    borderRadius: "12px",
    padding: "16px",
    cursor: "pointer",
    backgroundColor: "var(--cn-surface)",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    transition: "box-shadow 0.15s",
  },
  judul: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 700,
    color: "var(--cn-text)",
  },
  deskripsi: {
    margin: 0,
    fontSize: "13px",
    color: "var(--cn-muted)",
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
    backgroundColor: "var(--cn-tint)",
    color: WARNA_PRIMARY,
    padding: "2px 8px",
    borderRadius: "999px",
    fontWeight: 600,
  },
};