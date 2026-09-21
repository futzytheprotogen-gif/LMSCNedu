"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const WARNA_PRIMARY = "#2196f3";

interface AsesmenRingkas {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  status: "PROSES" | "SELESAI";
  mapel: string;
  jumlahSoal: number;
  jumlahKelasTujuan: number;
}

export default function HalamanAsesmenGuru() {
  const router = useRouter();
  const [daftar, setDaftar] = useState<AsesmenRingkas[]>([]);
  const [sedangMuat, setSedangMuat] = useState(true);

  useEffect(() => {
    fetch("/api/asesmen")
      .then((r) => r.json())
      .then((data) => setDaftar(data.data ?? []))
      .finally(() => setSedangMuat(false));
  }, []);

  const proses = daftar.filter((a) => a.status === "PROSES");
  const selesai = daftar.filter((a) => a.status === "SELESAI");

  return (
    <div style={estilo.halaman}>
      <div style={estilo.header}>
        <h1 style={estilo.judulHalaman}>Asesmen</h1>
        <button
          onClick={() => router.push("/guru/asesmen/baru")}
          style={estilo.tombolBuat}
        >
          + Buat Asesmen
        </button>
      </div>

      {sedangMuat && <p style={estilo.pesanMuat}>Memuat...</p>}

      {!sedangMuat && (
        <>
          <section style={estilo.seksi}>
            <h2 style={estilo.judulSeksi}>
              Proses <span style={estilo.badgeCount}>{proses.length}</span>
            </h2>
            {proses.length === 0 && (
              <p style={estilo.pesanKosong}>Tidak ada asesmen yang sedang dibuat.</p>
            )}
            <div style={estilo.daftar}>
              {proses.map((a) => (
                <KartuAsesmen key={a.id} a={a} onKlik={() => router.push(`/guru/asesmen/${a.id}`)} />
              ))}
            </div>
          </section>

          <section style={estilo.seksi}>
            <h2 style={estilo.judulSeksi}>
              Selesai <span style={estilo.badgeCount}>{selesai.length}</span>
            </h2>
            {selesai.length === 0 && (
              <p style={estilo.pesanKosong}>Belum ada asesmen yang difinalisasi.</p>
            )}
            <div style={estilo.daftar}>
              {selesai.map((a) => (
                <KartuAsesmen key={a.id} a={a} onKlik={() => router.push(`/guru/asesmen/${a.id}`)} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function KartuAsesmen({ a, onKlik }: { a: AsesmenRingkas; onKlik: () => void }) {
  return (
    <button onClick={onKlik} style={estilo.kartu}>
      <div>
        <div style={estilo.judulKartu}>{a.judul}</div>
        <div style={estilo.subKartu}>
          {a.tipe === "KUIS" ? "Kuis" : "Ujian Online"} · {a.mapel} · {a.jumlahSoal} soal
        </div>
      </div>
      <span style={estilo.badgeKelas}>{a.jumlahKelasTujuan} kelas</span>
    </button>
  );
}

const estilo = {
  halaman: { padding: "24px", backgroundColor: "#ffffff", minHeight: "100vh" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  judulHalaman: { margin: 0, fontSize: "22px", fontWeight: 700, color: "#000000" },
  tombolBuat: {
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: WARNA_PRIMARY,
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  pesanMuat: { color: "#6b7280", fontSize: "14px" },
  pesanKosong: { color: "#9ca3af", fontSize: "13px" },
  seksi: { marginBottom: "28px" },
  judulSeksi: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#000000",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  badgeCount: {
    fontSize: "12px",
    fontWeight: 700,
    color: WARNA_PRIMARY,
    backgroundColor: "#e8f3fe",
    padding: "2px 8px",
    borderRadius: "999px",
  },
  daftar: { display: "flex", flexDirection: "column" as const, gap: "8px" },
  kartu: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    textAlign: "left" as const,
    width: "100%",
  },
  judulKartu: { fontSize: "14px", fontWeight: 700, color: "#000000" },
  subKartu: { fontSize: "12px", color: "#6b7280", marginTop: "2px" },
  badgeKelas: { fontSize: "11px", fontWeight: 600, color: "#6b7280" },
};