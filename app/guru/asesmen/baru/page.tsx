"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface MapelRingkas {
  id: string;
  nama: string;
}

export default function HalamanBuatAsesmen() {
  return (
    <Suspense fallback={<div style={estilo.loadingState}>Memuat formulir...</div>}>
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
      setPesanError("Judul dan mata pelajaran wajib diisi.");
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
      <div style={estilo.container}>
        {/* Navigasi Kembali */}
        <button
          type="button"
          onClick={() => router.back()}
          style={estilo.tombolKembali}
        >
          ← Kembali ke Kelas
        </button>

        {/* Banner Card Identitas CN Edu */}
        <div style={estilo.bannerHeader}>
          <span style={estilo.badgeHeader}>BUAT ASESMEN BARU</span>
          <h1 style={estilo.judulBanner}>
            {tipe === "KUIS" ? "Kuis Online" : "Ujian Online"}
          </h1>
          <p style={estilo.subjudulBanner}>
            Isi formulir berikut untuk menentukan kriteria dasar sebelum menyusun butir soal.
          </p>
        </div>

        {/* Container Kartu Formulir */}
        <div style={estilo.kartuForm}>
          {/* Tab Pilihan Tipe */}
          <div style={estilo.barisTab}>
            {(["KUIS", "UJIAN"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipe(t)}
                style={{
                  ...estilo.tab,
                  ...(tipe === t ? estilo.tabAktif : {}),
                }}
              >
                {t === "KUIS" ? "📝 Kuis" : "📋 Ujian Online"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={estilo.form}>
            {/* Input Judul */}
            <div style={estilo.fieldGroup}>
              <label style={estilo.label}>
                Judul Asesmen <span style={estilo.wajib}>*</span>
              </label>
              <input
                type="text"
                placeholder="Misal: Ulangan Harian Bab 1 - Struktur Data"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                style={estilo.input}
                required
              />
            </div>

            {/* Input Mapel */}
            <div style={estilo.fieldGroup}>
              <label style={estilo.label}>
                Mata Pelajaran <span style={estilo.wajib}>*</span>
              </label>
              <select
                value={mapelId}
                onChange={(e) => setMapelId(e.target.value)}
                style={estilo.select}
                required
              >
                <option value="">Pilih mata pelajaran...</option>
                {daftarMapel.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Durasi */}
            <div style={estilo.fieldGroup}>
              <label style={estilo.label}>
                Durasi Pengerjaan <span style={estilo.opsional}>(Opsional)</span>
              </label>
              <div style={estilo.inputDurasiWrapper}>
                <input
                  type="number"
                  min={1}
                  value={durasiMenit}
                  onChange={(e) => setDurasiMenit(e.target.value)}
                  style={estilo.input}
                  placeholder="Contoh: 60"
                />
                <span style={estilo.satuanDurasi}>Menit</span>
              </div>
            </div>

            {/* Catatan Otomatisasi Kelas */}
            {kelasIdAwal && (
              <div style={estilo.catatanKelas}>
                <span style={{ fontSize: "16px", marginRight: "8px" }}>💡</span>
                <div>
                  <strong>Terhubung Otomatis:</strong> Asesmen ini akan langsung dibagikan ke kelas yang sedang aktif. Anda tetap bisa menambahkan kelas lain dari menu detail nanti.
                </div>
              </div>
            )}

            {/* Alert Error */}
            {pesanError && (
              <div style={estilo.boxError}>
                ⚠️ {pesanError}
              </div>
            )}

            {/* Tombol Aksi */}
            <div style={estilo.barisAksi}>
              <button
                type="button"
                onClick={() => router.back()}
                style={estilo.tombolBatal}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={sedangProses}
                style={{
                  ...estilo.tombolSimpan,
                  ...(sedangProses ? estilo.tombolDisabled : {}),
                }}
              >
                {sedangProses ? "Membuat..." : "Buat & Lanjut Tambah Soal →"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const estilo = {
  halaman: {
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    padding: "32px 20px",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: "#0f172a",
  },
  loadingState: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    color: "#64748b",
    fontSize: "14px",
  },
  container: {
    maxWidth: "640px",
    margin: "0 auto",
  },
  tombolKembali: {
    background: "none",
    border: "none",
    color: "#2563eb",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    padding: "0 0 16px 0",
    display: "inline-block",
  },
  bannerHeader: {
    background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
    borderRadius: "16px",
    padding: "24px 28px",
    color: "#ffffff",
    marginBottom: "20px",
    boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.15)",
  },
  badgeHeader: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    opacity: 0.85,
    display: "block",
    marginBottom: "4px",
  },
  judulBanner: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 800,
    lineHeight: 1.2,
  },
  subjudulBanner: {
    margin: "6px 0 0 0",
    fontSize: "13px",
    opacity: 0.9,
    lineHeight: 1.4,
  },
  kartuForm: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
  },
  barisTab: {
    display: "flex",
    gap: "6px",
    marginBottom: "20px",
    backgroundColor: "#f1f5f9",
    borderRadius: "10px",
    padding: "4px",
  },
  tab: {
    flex: 1,
    padding: "10px 0",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "transparent",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  tabAktif: {
    backgroundColor: "#ffffff",
    color: "#2563eb",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "18px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#334155",
  },
  wajib: {
    color: "#ef4444",
  },
  opsional: {
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: 400,
  },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    color: "#0f172a",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
    backgroundColor: "#ffffff",
  },
  select: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    color: "#0f172a",
    outline: "none",
    width: "100%",
    backgroundColor: "#ffffff",
    cursor: "pointer",
  },
  inputDurasiWrapper: {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
  },
  satuanDurasi: {
    position: "absolute" as const,
    right: "14px",
    fontSize: "13px",
    color: "#64748b",
    fontWeight: 500,
    pointerEvents: "none" as const,
  },
  catatanKelas: {
    display: "flex",
    alignItems: "flex-start",
    fontSize: "12px",
    lineHeight: "1.5",
    color: "#1e40af",
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    padding: "12px 14px",
    borderRadius: "10px",
  },
  boxError: {
    fontSize: "13px",
    color: "#991b1b",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    padding: "10px 14px",
    borderRadius: "8px",
  },
  barisAksi: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "8px",
    paddingTop: "16px",
    borderTop: "1px solid #f1f5f9",
  },
  tombolBatal: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    color: "#475569",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  tombolSimpan: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
  },
  tombolDisabled: {
    opacity: 0.65,
    cursor: "not-allowed",
  },
};