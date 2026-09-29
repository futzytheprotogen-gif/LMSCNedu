"use client";

import { useState, type FormEvent } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function HalamanUploadMateri() {
  return (
    <Suspense fallback={<div style={{ padding: "32px 20px", color: "var(--cn-muted)" }}>Memuat formulir materi...</div>}>
      <FormUploadMateri />
    </Suspense>
  );
}

function FormUploadMateri() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kelasId = searchParams.get("kelasId");

  const [judul, setJudul] = useState("");
  const [tipe, setTipe] = useState<"LINK" | "PDF">("LINK");
  const [link, setLink] = useState("");
  const [fileTerpilih, setFileTerpilih] = useState<File | null>(null);
  const [sedangUpload, setSedangUpload] = useState(false);
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPesanError(null);

    if (!kelasId) {
      setPesanError("Kelas tujuan tidak diketahui. Buka dari detail kelas.");
      return;
    }
    if (!judul.trim()) {
      setPesanError("Judul wajib diisi");
      return;
    }
    if (tipe === "LINK" && !link.trim()) {
      setPesanError("Link wajib diisi");
      return;
    }
    if (tipe === "PDF" && !fileTerpilih) {
      setPesanError("Pilih file PDF terlebih dahulu");
      return;
    }

    setSedangSimpan(true);
    let urlAkhir = link;

    try {
      if (tipe === "PDF" && fileTerpilih) {
        setSedangUpload(true);
        const formData = new FormData();
        formData.append("file", fileTerpilih);
        formData.append("folder", "materi");
        const responseUpload = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const dataUpload = await responseUpload.json();
        setSedangUpload(false);

        if (!responseUpload.ok) {
          setPesanError(dataUpload.pesan ?? "Gagal upload file");
          setSedangSimpan(false);
          return;
        }
        urlAkhir = dataUpload.url;
      }

      const response = await fetch("/api/materi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kelasId,
          judul: judul.trim(),
          tipe,
          url: urlAkhir,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setPesanError(data.pesan ?? "Gagal menyimpan materi");
        return;
      }

      router.push(`/guru/kelas/${kelasId}`);
    } catch {
      setPesanError("Tidak bisa terhubung ke server, coba lagi.");
    } finally {
      setSedangSimpan(false);
      setSedangUpload(false);
    }
  }

  return (
    <div style={estilo.halaman}>
      <div style={estilo.wrapper}>
        {/* Navigation / Header */}
        <div style={estilo.header}>
          <button
            type="button"
            onClick={() => router.back()}
            style={estilo.btnKembali}
          >
            ← Kembali
          </button>
          <h1 style={estilo.judulHalaman}>Upload Materi</h1>
          <p style={estilo.subJudul}>
            Tambahkan tautan atau dokumen PDF sebagai materi pembelajaran siswa.
          </p>
        </div>

        {/* Warning State jika kelasId tidak ada */}
        {!kelasId && (
          <div style={estilo.alertWarning}>
            <span style={estilo.alertIcon}>⚠️</span>
            <div>
              <strong>Kelas Tidak Terdeteksi</strong>
              <p style={estilo.alertTeks}>
                Akses halaman ini melalui tombol &quot;Upload Materi&quot; pada
                halaman detail kelas.
              </p>
            </div>
          </div>
        )}

        {/* Form Main Container */}
        <form onSubmit={handleSubmit} style={estilo.formCard}>
          {/* Input Judul */}
          <div style={estilo.fieldGroup}>
            <label htmlFor="judul-materi" style={estilo.label}>
              Judul Materi <span style={estilo.required}>*</span>
            </label>
            <input
              id="judul-materi"
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Modul Pembelajaran Bab 2"
              style={estilo.input}
              disabled={!kelasId || sedangSimpan}
            />
          </div>

          {/* Toggle Type Selector */}
          <div style={estilo.fieldGroup}>
            <label style={estilo.label}>
              Tipe Lampiran <span style={estilo.required}>*</span>
            </label>
            <div style={estilo.segmentContainer}>
              <button
                type="button"
                onClick={() => setTipe("LINK")}
                style={{
                  ...estilo.segmentItem,
                  ...(tipe === "LINK" ? estilo.segmentItemActive : {}),
                }}
                disabled={!kelasId || sedangSimpan}
              >
                🔗 Tautan Link
              </button>
              <button
                type="button"
                onClick={() => setTipe("PDF")}
                style={{
                  ...estilo.segmentItem,
                  ...(tipe === "PDF" ? estilo.segmentItemActive : {}),
                }}
                disabled={!kelasId || sedangSimpan}
              >
                📄 Dokumen PDF
              </button>
            </div>
          </div>

          {/* Input Content Specific */}
          {tipe === "LINK" ? (
            <div style={estilo.fieldGroup}>
              <label htmlFor="link-materi" style={estilo.label}>
                URL Tautan <span style={estilo.required}>*</span>
              </label>
              <input
                id="link-materi"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://drive.google.com/... atau tautan materi"
                style={estilo.input}
                disabled={!kelasId || sedangSimpan}
              />
            </div>
          ) : (
            <div style={estilo.fieldGroup}>
              <label style={estilo.label}>
                File PDF <span style={estilo.required}>*</span>
              </label>
              <div style={estilo.dropzone}>
                <input
                  type="file"
                  id="pdf-upload"
                  accept="application/pdf"
                  onChange={(e) =>
                    setFileTerpilih(e.target.files?.[0] ?? null)
                  }
                  style={estilo.hiddenFileInput}
                  disabled={!kelasId || sedangSimpan}
                />
                <label htmlFor="pdf-upload" style={estilo.dropzoneLabel}>
                  <span style={estilo.dropzoneIcon}>📁</span>
                  <span style={estilo.dropzoneText}>
                    {fileTerpilih ? "Ganti file PDF" : "Pilih file PDF dari komputer"}
                  </span>
                  <span style={estilo.dropzoneSub}>Ukuran file standar PDF</span>
                </label>
              </div>

              {fileTerpilih && (
                <div style={estilo.filePreview}>
                  <div style={estilo.fileInfo}>
                    <span style={estilo.fileName}>{fileTerpilih.name}</span>
                    <span style={estilo.fileSize}>
                      {(fileTerpilih.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFileTerpilih(null)}
                    style={estilo.btnHapusFile}
                    title="Hapus file"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error Banner */}
          {pesanError && (
            <div style={estilo.errorBox}>
              <span style={{ fontSize: "14px" }}>⚠️</span>
              <span>{pesanError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={estilo.actionRow}>
            <button
              type="button"
              onClick={() => router.back()}
              style={estilo.btnBatal}
              disabled={sedangSimpan}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={sedangSimpan || !kelasId}
              style={{
                ...estilo.btnSubmit,
                ...(sedangSimpan || !kelasId ? estilo.btnDisabled : {}),
              }}
            >
              {sedangUpload
                ? "Mengunggah File..."
                : sedangSimpan
                ? "Menyimpan..."
                : "Simpan & Publikasikan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const COLOR = {
  bg: "var(--cn-tint)",
  cardBg: "var(--cn-surface)",
  textMain: "var(--cn-navy)",
  textMuted: "var(--cn-coral)",
  border: "var(--cn-coral-tint)",
  primary: "var(--cn-primary)",
  primaryHover: "var(--cn-primary)",
  primaryBg: "var(--cn-tint)",
  danger: "var(--cn-danger)",
  dangerBg: "var(--cn-danger-tint)",
  warning: "var(--cn-coral)",
  warningBg: "var(--cn-coral-tint)",
};

const estilo = {
  halaman: {
    minHeight: "100vh",
    backgroundColor: COLOR.bg,
    padding: "40px 16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  },
  wrapper: {
    width: "100%",
    maxWidth: "520px",
  },
  header: {
    marginBottom: "24px",
  },
  btnKembali: {
    background: "none",
    border: "none",
    padding: 0,
    fontSize: "13px",
    fontWeight: 600,
    color: COLOR.textMuted,
    cursor: "pointer",
    marginBottom: "12px",
    display: "inline-block",
  },
  judulHalaman: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
    color: COLOR.textMain,
    letterSpacing: "-0.01em",
  },
  subJudul: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: COLOR.textMuted,
    lineHeight: 1.4,
  },
  alertWarning: {
    display: "flex",
    gap: "12px",
    padding: "14px",
    borderRadius: "10px",
    backgroundColor: COLOR.warningBg,
    border: `1px solid ${COLOR.warning}30`,
    color: COLOR.warning,
    marginBottom: "20px",
    fontSize: "13px",
  },
  alertIcon: {
    fontSize: "18px",
    lineHeight: 1,
  },
  alertTeks: {
    margin: "2px 0 0 0",
    fontSize: "12px",
    color: COLOR.textMuted,
  },
  formCard: {
    backgroundColor: COLOR.cardBg,
    borderRadius: "12px",
    border: `1px solid ${COLOR.border}`,
    boxShadow: "0 1px 3px 0 rgba(var(--cn-navy-rgb), 0.05)",
    padding: "24px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: COLOR.textMain,
  },
  required: {
    color: COLOR.danger,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: `1px solid ${COLOR.border}`,
    fontSize: "13px",
    color: COLOR.textMain,
    backgroundColor: "var(--cn-surface)",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  segmentContainer: {
    display: "flex",
    backgroundColor: "var(--cn-coral-tint)",
    padding: "3px",
    borderRadius: "8px",
    gap: "4px",
  },
  segmentItem: {
    flex: 1,
    padding: "8px 0",
    fontSize: "12px",
    fontWeight: 600,
    border: "none",
    borderRadius: "6px",
    backgroundColor: "transparent",
    color: COLOR.textMuted,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  segmentItemActive: {
    backgroundColor: "var(--cn-surface)",
    color: COLOR.primary,
    boxShadow: "0 1px 2px rgba(var(--cn-navy-rgb), 0.05)",
  },
  dropzone: {
    border: `1px dashed ${COLOR.border}`,
    borderRadius: "8px",
    padding: "20px",
    textAlign: "center" as const,
    backgroundColor: COLOR.bg,
    cursor: "pointer",
    position: "relative" as const,
  },
  hiddenFileInput: {
    display: "none",
  },
  dropzoneLabel: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "4px",
    cursor: "pointer",
  },
  dropzoneIcon: {
    fontSize: "24px",
    marginBottom: "4px",
  },
  dropzoneText: {
    fontSize: "13px",
    fontWeight: 600,
    color: COLOR.primary,
  },
  dropzoneSub: {
    fontSize: "11px",
    color: COLOR.textMuted,
  },
  filePreview: {
    marginTop: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    backgroundColor: COLOR.primaryBg,
    borderRadius: "8px",
    border: `1px solid ${COLOR.primary}20`,
  },
  fileInfo: {
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
  fileName: {
    fontSize: "12px",
    fontWeight: 600,
    color: COLOR.textMain,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "340px",
  },
  fileSize: {
    fontSize: "11px",
    color: COLOR.textMuted,
  },
  btnHapusFile: {
    background: "none",
    border: "none",
    color: COLOR.textMuted,
    cursor: "pointer",
    fontSize: "14px",
    padding: "4px 8px",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    backgroundColor: COLOR.dangerBg,
    border: `1px solid ${COLOR.danger}20`,
    borderRadius: "8px",
    color: COLOR.danger,
    fontSize: "12px",
    fontWeight: 500,
  },
  actionRow: {
    display: "flex",
    gap: "10px",
    marginTop: "4px",
  },
  btnBatal: {
    flex: 1,
    padding: "10px 0",
    borderRadius: "8px",
    border: `1px solid ${COLOR.border}`,
    backgroundColor: "var(--cn-surface)",
    color: COLOR.textMuted,
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  btnSubmit: {
    flex: 2,
    padding: "10px 0",
    borderRadius: "8px",
    border: "none",
    backgroundColor: COLOR.primary,
    color: "var(--cn-surface)",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(var(--cn-navy-rgb), 0.05)",
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};