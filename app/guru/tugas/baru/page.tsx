"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const WARNA = {
  primary: "#2196f3",
  primaryDark: "#1976d2",
  primarySoft: "#e8f3fe",
  background: "#f8fafc",
  white: "#ffffff",
  text: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  border: "#e2e8f0",
  borderHover: "#cbd5e1",
  red: "#ef4444",
  redSoft: "#fef2f2",
};

export default function HalamanBuatTugasCepat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kelasId = searchParams.get("kelasId");

  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [pakaiLampiran, setPakaiLampiran] = useState(false);
  const [tipeLampiran, setTipeLampiran] = useState<"PDF" | "LINK">("LINK");
  const [lampiran, setLampiran] = useState("");
  const [fileTerpilih, setFileTerpilih] = useState<File | null>(null);
  const [sedangUpload, setSedangUpload] = useState(false);
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPesanError(null);

    if (!judul.trim() || !deskripsi.trim()) {
      setPesanError("Judul dan deskripsi wajib diisi.");
      return;
    }
    if (pakaiLampiran && tipeLampiran === "PDF" && !fileTerpilih) {
      setPesanError("Silakan pilih file PDF terlebih dahulu.");
      return;
    }

    setSedangSimpan(true);
    let urlLampiranAkhir = lampiran;

    try {
      if (pakaiLampiran && tipeLampiran === "PDF" && fileTerpilih) {
        setSedangUpload(true);
        const formData = new FormData();
        formData.append("file", fileTerpilih);
        formData.append("folder", "lampiran-tugas");
        const responseUpload = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const dataUpload = await responseUpload.json();
        setSedangUpload(false);

        if (!responseUpload.ok) {
          setPesanError(dataUpload.pesan ?? "Gagal mengunggah file.");
          setSedangSimpan(false);
          return;
        }
        urlLampiranAkhir = dataUpload.url;
      }

      const response = await fetch("/api/tugas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: judul.trim(),
          deskripsi: deskripsi.trim(),
          tipeLampiran: pakaiLampiran ? tipeLampiran : undefined,
          lampiran: pakaiLampiran ? urlLampiranAkhir : undefined,
          kelasIds: kelasId ? [kelasId] : undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setPesanError(data.pesan ?? "Gagal membuat tugas.");
        return;
      }

      router.push(kelasId ? `/guru/kelas/${kelasId}` : "/guru/tugas");
    } catch {
      setPesanError("Gagal terhubung ke server. Silakan coba lagi.");
    } finally {
      setSedangSimpan(false);
      setSedangUpload(false);
    }
  }

  return (
    <div style={estilo.halaman}>
      <div style={estilo.container}>
        {/* Header Section */}
        <div style={estilo.header}>
          <button
            type="button"
            onClick={() => router.back()}
            style={estilo.tombolKembali}
          >
            ← Kembali
          </button>
          <span style={estilo.badgeLabel}>RUANG GURU</span>
          <h1 style={estilo.judulHalaman}>Buat Tugas Baru</h1>
          <p style={estilo.subjudulHalaman}>
            Berikan tugas atau instruksi pembelajaran untuk siswa.
          </p>
        </div>

        {/* Notifikasi Kelas Terpilih */}
        {kelasId && (
          <div style={estilo.catatanKelas}>
            <span style={estilo.iconInfo}>ℹ️</span>
            <div>
              <strong>Tugas Terhubung</strong>
              <p style={estilo.teksCatatan}>
                Tugas ini akan otomatis dikirimkan ke kelas yang sedang aktif.
              </p>
            </div>
          </div>
        )}

        {/* Form Kartu Utama */}
        <form onSubmit={handleSubmit} style={estilo.kartuForm}>
          {/* Input Judul */}
          <div style={estilo.grupInput}>
            <label style={estilo.label}>
              Judul Tugas <span style={estilo.wajib}>*</span>
            </label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Tugas Latihan Bab 3 Matematika"
              style={estilo.input}
            />
          </div>

          {/* Input Deskripsi */}
          <div style={estilo.grupInput}>
            <label style={estilo.label}>
              Deskripsi & Instruksi <span style={estilo.wajib}>*</span>
            </label>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={4}
              placeholder="Tuliskan instruksi pengerjaan tugas secara rinci di sini..."
              style={estilo.textarea}
            />
          </div>

          <div style={estilo.garisPemisah} />

          {/* Sakelar Lampiran */}
          <div style={estilo.seksiLampiran}>
            <label style={estilo.labelCheckbox}>
              <input
                type="checkbox"
                checked={pakaiLampiran}
                onChange={(e) => setPakaiLampiran(e.target.checked)}
                style={estilo.checkbox}
              />
              <span style={estilo.teksCheckbox}>Sertakan File atau Link Lampiran</span>
            </label>

            {pakaiLampiran && (
              <div style={estilo.areaLampiran}>
                {/* Tab Pilihan Tipe Lampiran */}
                <div style={estilo.barisTab}>
                  {(["LINK", "PDF"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipeLampiran(t)}
                      style={{
                        ...estilo.tabKecil,
                        ...(tipeLampiran === t ? estilo.tabKecilAktif : {}),
                      }}
                    >
                      {t === "LINK" ? "🔗 Tautan (Link)" : "📄 File PDF"}
                    </button>
                  ))}
                </div>

                {/* Field Tautan/Link */}
                {tipeLampiran === "LINK" && (
                  <input
                    type="url"
                    value={lampiran}
                    onChange={(e) => setLampiran(e.target.value)}
                    placeholder="https://drive.google.com/... atau link materi"
                    style={estilo.input}
                  />
                )}

                {/* Field Upload PDF */}
                {tipeLampiran === "PDF" && (
                  <div style={estilo.boxUpload}>
                    <input
                      type="file"
                      id="upload-pdf"
                      accept="application/pdf"
                      onChange={(e) =>
                        setFileTerpilih(e.target.files?.[0] ?? null)
                      }
                      style={{ display: "none" }}
                    />
                    <label htmlFor="upload-pdf" style={estilo.labelUpload}>
                      <span style={{ fontSize: "20px" }}>📁</span>
                      <span>
                        {fileTerpilih
                          ? "Ganti file PDF"
                          : "Klik untuk memilih file PDF"}
                      </span>
                    </label>
                    {fileTerpilih && (
                      <div style={estilo.infoFile}>
                        <span style={estilo.namaFile}>📄 {fileTerpilih.name}</span>
                        <span style={estilo.ukuranFile}>
                          {(fileTerpilih.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pesan Kesalahan */}
          {pesanError && (
            <div style={estilo.boxError}>
              <span>⚠️</span> {pesanError}
            </div>
          )}

          {/* Tombol Aksi */}
          <div style={estilo.areaTombol}>
            <button
              type="button"
              onClick={() => router.back()}
              style={estilo.tombolBatal}
              disabled={sedangSimpan}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={sedangSimpan}
              style={{
                ...estilo.tombolSubmit,
                ...(sedangSimpan ? estilo.tombolDisabled : {}),
              }}
            >
              {sedangUpload
                ? "Mengunggah Lampiran..."
                : sedangSimpan
                ? "Menyimpan Tugas..."
                : "Buat Tugas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const estilo = {
  halaman: {
    minHeight: "100vh",
    backgroundColor: WARNA.background,
    padding: "32px 16px",
    display: "flex",
    justifyContent: "center",
    boxSizing: "border-box" as const,
  },
  container: {
    width: "100%",
    maxWidth: "560px",
  },
  header: {
    marginBottom: "20px",
  },
  tombolKembali: {
    background: "none",
    border: "none",
    color: WARNA.textSecondary,
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    marginBottom: "12px",
    display: "inline-block",
  },
  badgeLabel: {
    display: "block",
    fontSize: "11px",
    fontWeight: 800,
    color: WARNA.primary,
    letterSpacing: "0.08em",
    marginBottom: "4px",
  },
  judulHalaman: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 800,
    color: WARNA.text,
    letterSpacing: "-0.02em",
  },
  subjudulHalaman: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: WARNA.textSecondary,
  },
  catatanKelas: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    backgroundColor: WARNA.primarySoft,
    border: `1px solid ${WARNA.primary}30`,
    borderRadius: "12px",
    padding: "12px 16px",
    marginBottom: "20px",
  },
  iconInfo: {
    fontSize: "16px",
    marginTop: "2px",
  },
  teksCatatan: {
    margin: "2px 0 0 0",
    fontSize: "12px",
    color: WARNA.textSecondary,
  },
  kartuForm: {
    backgroundColor: WARNA.white,
    borderRadius: "16px",
    border: `1px solid ${WARNA.border}`,
    padding: "24px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },
  grupInput: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 700,
    color: WARNA.text,
  },
  wajib: {
    color: WARNA.red,
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: `1px solid ${WARNA.border}`,
    fontSize: "13px",
    color: WARNA.text,
    backgroundColor: WARNA.white,
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s ease",
  },
  textarea: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: `1px solid ${WARNA.border}`,
    fontSize: "13px",
    color: WARNA.text,
    backgroundColor: WARNA.white,
    outline: "none",
    resize: "vertical" as const,
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
    lineHeight: 1.5,
  },
  garisPemisah: {
    height: "1px",
    backgroundColor: WARNA.border,
    margin: "4px 0",
  },
  seksiLampiran: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  labelCheckbox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    userSelect: "none" as const,
  },
  checkbox: {
    width: "16px",
    height: "16px",
    accentColor: WARNA.primary,
    cursor: "pointer",
  },
  teksCheckbox: {
    fontSize: "13px",
    fontWeight: 600,
    color: WARNA.text,
  },
  areaLampiran: {
    backgroundColor: "#f8fafc",
    padding: "14px",
    borderRadius: "12px",
    border: `1px solid ${WARNA.border}`,
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  barisTab: {
    display: "flex",
    gap: "6px",
    backgroundColor: "#e2e8f0",
    borderRadius: "8px",
    padding: "3px",
  },
  tabKecil: {
    flex: 1,
    padding: "8px 0",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "transparent",
    color: WARNA.textSecondary,
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.18s ease",
  },
  tabKecilAktif: {
    backgroundColor: WARNA.white,
    color: WARNA.primary,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  boxUpload: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  labelUpload: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px",
    border: `1px dashed ${WARNA.primary}`,
    borderRadius: "10px",
    backgroundColor: WARNA.primarySoft,
    color: WARNA.primaryDark,
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  infoFile: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    backgroundColor: WARNA.white,
    borderRadius: "8px",
    border: `1px solid ${WARNA.border}`,
  },
  namaFile: {
    fontSize: "12px",
    color: WARNA.text,
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    maxWidth: "280px",
  },
  ukuranFile: {
    fontSize: "11px",
    color: WARNA.textMuted,
  },
  boxError: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: WARNA.redSoft,
    color: WARNA.red,
    padding: "10px 14px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: 600,
  },
  areaTombol: {
    display: "flex",
    gap: "10px",
    marginTop: "8px",
  },
  tombolBatal: {
    flex: 1,
    padding: "11px 0",
    borderRadius: "10px",
    border: `1px solid ${WARNA.border}`,
    backgroundColor: WARNA.white,
    color: WARNA.textSecondary,
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },
  tombolSubmit: {
    flex: 2,
    padding: "11px 0",
    borderRadius: "10px",
    border: "none",
    backgroundColor: WARNA.primary,
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(33, 150, 243, 0.2)",
    transition: "background-color 0.2s ease",
  },
  tombolDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
};