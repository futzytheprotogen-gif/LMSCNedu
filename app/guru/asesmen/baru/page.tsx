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
  const [fileWord, setFileWord] = useState<File | null>(null);
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
      const isiRequest = fileWord ? new FormData() : null;
      if (isiRequest && fileWord) {
        isiRequest.set("file", fileWord);
        isiRequest.set("judul", judul.trim());
        isiRequest.set("tipe", tipe);
        isiRequest.set("mapelId", mapelId);
        if (durasiMenit) isiRequest.set("durasiMenit", durasiMenit);
        if (kelasIdAwal) isiRequest.set("kelasIds", kelasIdAwal);
      }

      const response = await fetch(fileWord ? "/api/asesmen/import" : "/api/asesmen", {
        method: "POST",
        headers: fileWord ? undefined : { "Content-Type": "application/json" },
        body: isiRequest ?? JSON.stringify({
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

            <div style={estilo.fieldGroup}>
              <label style={estilo.label} htmlFor="file-word-asesmen">Impor soal dari Word (.docx)</label>
              <input
                id="file-word-asesmen"
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => setFileWord(event.target.files?.[0] ?? null)}
                style={estilo.inputFile}
              />
              <p style={estilo.petunjukImpor}>
                Tulis soal dengan nomor (1. Pertanyaan). Opsi gunakan A. sampai H.; tambahkan “Kunci: B” untuk pilihan ganda, “Tipe: CHECKBOX” dan “Kunci: A, C” untuk jawaban jamak, atau “Tipe: ESSAY” tanpa opsi. Maksimal 5 MB.
              </p>
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
                {sedangProses ? "Memproses..." : fileWord ? "Impor Soal & Buat Asesmen" : "Buat & Lanjut Tambah Soal →"}
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
    backgroundColor: "var(--cn-tint)",
    minHeight: "100vh",
    padding: "32px 20px",
    fontFamily: "inherit",
    color: "var(--cn-navy)",
  },
  loadingState: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    color: "var(--cn-coral)",
    fontSize: "14px",
  },
  container: {
    maxWidth: "640px",
    margin: "0 auto",
  },
  tombolKembali: {
    background: "none",
    border: "none",
    color: "var(--cn-primary)",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    padding: "0 0 16px 0",
    display: "inline-block",
  },
  bannerHeader: {
    background: "linear-gradient(135deg, var(--cn-primary) 0%, var(--cn-primary) 100%)",
    borderRadius: "16px",
    padding: "24px 28px",
    color: "var(--cn-surface)",
    marginBottom: "20px",
    boxShadow: "0 10px 15px -3px rgba(var(--cn-primary-rgb), 0.15)",
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
    backgroundColor: "var(--cn-surface)",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid var(--cn-coral-tint)",
    boxShadow: "0 1px 3px 0 rgba(var(--cn-navy-rgb), 0.05)",
  },
  barisTab: {
    display: "flex",
    gap: "6px",
    marginBottom: "20px",
    backgroundColor: "var(--cn-coral-tint)",
    borderRadius: "10px",
    padding: "4px",
  },
  tab: {
    flex: 1,
    padding: "10px 0",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "transparent",
    color: "var(--cn-coral)",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  tabAktif: {
    backgroundColor: "var(--cn-surface)",
    color: "var(--cn-primary)",
    boxShadow: "0 1px 3px rgba(var(--cn-navy-rgb), 0.08)",
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
    color: "var(--cn-coral-dark)",
  },
  wajib: {
    color: "var(--cn-danger)",
  },
  opsional: {
    fontSize: "12px",
    color: "var(--cn-coral)",
    fontWeight: 400,
  },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid var(--cn-coral)",
    fontSize: "14px",
    color: "var(--cn-navy)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
    backgroundColor: "var(--cn-surface)",
  },
  inputFile: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--cn-line)",
    color: "var(--cn-text)",
    fontSize: "13px",
    width: "100%",
    backgroundColor: "var(--cn-surface)",
  },
  petunjukImpor: {
    margin: 0,
    color: "var(--cn-muted)",
    fontSize: "12px",
    lineHeight: 1.6,
  },
  select: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid var(--cn-coral)",
    fontSize: "14px",
    color: "var(--cn-navy)",
    outline: "none",
    width: "100%",
    backgroundColor: "var(--cn-surface)",
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
    color: "var(--cn-coral)",
    fontWeight: 500,
    pointerEvents: "none" as const,
  },
  catatanKelas: {
    display: "flex",
    alignItems: "flex-start",
    fontSize: "12px",
    lineHeight: "1.5",
    color: "var(--cn-primary-dark)",
    backgroundColor: "var(--cn-tint)",
    border: "1px solid var(--cn-tint)",
    padding: "12px 14px",
    borderRadius: "10px",
  },
  boxError: {
    fontSize: "13px",
    color: "var(--cn-danger)",
    backgroundColor: "var(--cn-danger-tint)",
    border: "1px solid var(--cn-danger-tint)",
    padding: "10px 14px",
    borderRadius: "8px",
  },
  barisAksi: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "8px",
    paddingTop: "16px",
    borderTop: "1px solid var(--cn-coral-tint)",
  },
  tombolBatal: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid var(--cn-coral)",
    backgroundColor: "var(--cn-surface)",
    color: "var(--cn-coral)",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  tombolSimpan: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "var(--cn-primary)",
    color: "var(--cn-surface)",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(var(--cn-primary-rgb), 0.2)",
  },
  tombolDisabled: {
    opacity: 0.65,
    cursor: "not-allowed",
  },
};