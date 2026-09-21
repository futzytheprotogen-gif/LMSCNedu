"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const WARNA_PRIMARY = "#2196f3";

interface MapelRingkas {
  id: string;
  nama: string;
}

export default function HalamanBuatAsesmen() {
  return (
    <Suspense fallback={<div style={estilo.halaman}>Memuat...</div>}>
      <FormulirBuatAsesmen />
    </Suspense>
  );
}

function FormulirBuatAsesmen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tipeAwal = searchParams.get("tipe") === "UJIAN" ? "UJIAN" : "KUIS";
  const kelasIdAwal = searchParams.get("kelasId");

  const [tipe, setTipe] = useState<"KUIS" | "UJIAN">(tipeAwal);
  const [judul, setJudul] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [durasiMenit, setDurasiMenit] = useState("");
  const [daftarMapel, setDaftarMapel] = useState<MapelRingkas[]>([]);
  const [sedangProses, setSedangProses] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/guru/mapel")
      .then((r) => r.json())
      .then((data) => setDaftarMapel(data.data ?? []));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPesanError(null);

    if (!judul.trim() || !mapelId) {
      setPesanError("Judul dan mapel wajib diisi");
      return;
    }

    setSedangProses(true);
    try {
      const response = await fetch("/api/asesmen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: judul.trim(),
          tipe,
          mapelId,
          durasiMenit: durasiMenit ? Number(durasiMenit) : undefined,
          kelasIds: kelasIdAwal ? [kelasIdAwal] : undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setPesanError(data.pesan ?? "Gagal membuat asesmen");
        return;
      }

      router.push(`/guru/asesmen/${data.data.id}`);
    } catch {
      setPesanError("Tidak bisa terhubung ke server, coba lagi.");
    } finally {
      setSedangProses(false);
    }
  }

  return (
    <div style={estilo.halaman}>
      <h1 style={estilo.judulHalaman}>Buat Asesmen</h1>

      <div style={estilo.baris_tab}>
        {(["KUIS", "UJIAN"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipe(t)}
            style={{ ...estilo.tab, ...(tipe === t ? estilo.tab_aktif : {}) }}
          >
            {t === "KUIS" ? "Kuis" : "Ujian Online"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={estilo.form}>
        <label style={estilo.label}>
          Judul
          <input
            type="text"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            style={estilo.input}
            required
          />
        </label>

        <label style={estilo.label}>
          Mata Pelajaran
          <select
            value={mapelId}
            onChange={(e) => setMapelId(e.target.value)}
            style={estilo.input}
            required
          >
            <option value="">Pilih mapel...</option>
            {daftarMapel.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nama}
              </option>
            ))}
          </select>
        </label>

        <label style={estilo.label}>
          Durasi (menit)
          <input
            type="number"
            min={1}
            value={durasiMenit}
            onChange={(e) => setDurasiMenit(e.target.value)}
            style={estilo.input}
            placeholder="Contoh: 60"
          />
        </label>

        {kelasIdAwal && (
          <p style={estilo.catatanKelas}>
            Asesmen ini otomatis akan dikirim ke kelas yang tadi kamu buka. Kamu
            bisa tambah kelas lain lagi nanti dari halaman detail asesmen.
          </p>
        )}

        {pesanError && <p style={estilo.pesan_error}>{pesanError}</p>}

        <button type="submit" disabled={sedangProses} style={estilo.tombol}>
          {sedangProses ? "Membuat..." : "Buat & Lanjut Tambah Soal"}
        </button>
      </form>
    </div>
  );
}

const estilo = {
  halaman: { padding: "24px", backgroundColor: "#ffffff", minHeight: "100vh", maxWidth: "480px" },
  judulHalaman: { margin: "0 0 16px 0", fontSize: "22px", fontWeight: 700, color: "#000000" },
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
  form: { display: "flex", flexDirection: "column" as const, gap: "16px" },
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
  catatanKelas: {
    fontSize: "12px",
    color: "#6b7280",
    backgroundColor: "#f9fafb",
    padding: "10px 12px",
    borderRadius: "8px",
    margin: 0,
  },
  pesan_error: { color: "#dc2626", fontSize: "13px", margin: 0 },
  tombol: {
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