"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const WARNA_PRIMARY = "var(--cn-primary)";

interface DetailTugas {
  id: string;
  judul: string;
  deskripsi: string;
  tipeLampiran: "PDF" | "LINK" | null;
  lampiran: string | null;
  createdAt: string;
  guru: { id: string; nama: string };
  kelasTujuan: { id: string; judul: string }[];
  submission: { fileUrl: string; waktuKumpul: string } | null;
}

export default function DetailTugasSiswa() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [tugas, setTugas] = useState<DetailTugas | null>(null);
  const [sedangMuat, setSedangMuat] = useState(true);
  const [errorMuat, setErrorMuat] = useState<string | null>(null);

  const [fileTerpilih, setFileTerpilih] = useState<File | null>(null);
  const [sedangKirim, setSedangKirim] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setSedangMuat(true);
    setErrorMuat(null);

    try {
      const response = await fetch(`/api/tugas/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        setErrorMuat(data.pesan ?? "Gagal memuat tugas.");
        return;
      }

      setTugas(data.data);
    } catch {
      setErrorMuat("Tidak dapat terhubung ke server.");
    } finally {
      setSedangMuat(false);
    }
  }, [params.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void muat(); }, 0);
    return () => window.clearTimeout(timer);
  }, [muat]);

  async function kirimJawaban() {
    if (!fileTerpilih) {
      setPesanError("Pilih file PDF jawabanmu terlebih dahulu.");
      return;
    }

    setSedangKirim(true);
    setPesanError(null);

    try {
      const formData = new FormData();
      formData.append("file", fileTerpilih);
      formData.append("folder", "jawaban-tugas");

      const responseUpload = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const dataUpload = await responseUpload.json();

      if (!responseUpload.ok) {
        setPesanError(dataUpload.pesan ?? "Gagal upload file.");
        return;
      }

      const responseSubmit = await fetch(`/api/tugas/${params.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: dataUpload.url }),
      });
      const dataSubmit = await responseSubmit.json();

      if (!responseSubmit.ok) {
        setPesanError(dataSubmit.pesan ?? "Gagal mengirim jawaban.");
        return;
      }

      setFileTerpilih(null);
      await muat();
    } catch {
      setPesanError("Tidak dapat terhubung ke server.");
    } finally {
      setSedangKirim(false);
    }
  }

  if (sedangMuat) {
    return <div style={styles.centerBox}>Memuat tugas...</div>;
  }

  if (errorMuat || !tugas) {
    return (
      <div style={styles.centerBox}>
        <p style={{ color: "var(--cn-danger)" }}>⚠️ {errorMuat ?? "Tugas tidak ditemukan."}</p>
        <button type="button" onClick={() => router.push("/siswa/tugas")} style={styles.backButton}>
          ← Kembali ke Tugas
        </button>
      </div>
    );
  }

  const sudahKumpul = !!tugas.submission;
  const tanggal = new Date(tugas.createdAt);

  return (
    <div style={styles.page}>
      <main style={styles.container}>
        <button type="button" onClick={() => router.push("/siswa/tugas")} style={styles.backLink}>
          ← Kembali ke Tugas
        </button>

        <article style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h1 style={styles.title}>{tugas.judul}</h1>
              <div style={styles.meta}>
                <span>👤 {tugas.guru.nama}</span>
                <span>
                  📅{" "}
                  {tanggal.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div style={styles.chipRow}>
                {tugas.kelasTujuan.map((k) => (
                  <span key={k.id} style={styles.classChip}>{k.judul}</span>
                ))}
              </div>
            </div>

            {sudahKumpul && <span style={styles.doneBadge}>Sudah Dikumpulkan</span>}
          </div>

          <p style={styles.description}>{tugas.deskripsi}</p>

          {tugas.lampiran && (
            <a href={tugas.lampiran} target="_blank" rel="noreferrer" style={styles.attachmentButton}>
              {tugas.tipeLampiran === "PDF" ? "📄 Lihat Lampiran PDF" : "🔗 Buka Link Lampiran"}
            </a>
          )}

          <div style={styles.divider} />

          <h2 style={styles.sectionTitle}>Jawabanmu</h2>

          {sudahKumpul && tugas.submission && (
            <div style={styles.submissionInfo}>
              <span>
                Terkumpul{" "}
                {new Date(tugas.submission.waktuKumpul).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                ·{" "}
                {new Date(tugas.submission.waktuKumpul).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <a href={tugas.submission.fileUrl} target="_blank" rel="noreferrer" style={styles.fileLink}>
                📎 Lihat file yang dikumpulkan
              </a>
            </div>
          )}

          <label style={styles.uploadLabel}>
            <span>{sudahKumpul ? "Ganti file jawaban (opsional)" : "Upload jawaban (PDF)"}</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFileTerpilih(e.target.files?.[0] ?? null)}
              style={styles.fileInput}
            />
          </label>

          {fileTerpilih && <div style={styles.fileInfo}>📄 {fileTerpilih.name}</div>}

          {pesanError && <div style={styles.errorBox}>⚠️ {pesanError}</div>}

          <button
            type="button"
            onClick={kirimJawaban}
            disabled={sedangKirim}
            style={styles.submitButton}
          >
            {sedangKirim ? "Mengirim..." : sudahKumpul ? "Kumpulkan Ulang" : "Kumpulkan Tugas"}
          </button>
        </article>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, var(--cn-tint) 0%, var(--cn-surface) 42%, var(--cn-tint) 100%)",
    color: "var(--cn-coral-dark)",
  },
  container: { width: "100%", maxWidth: "720px", margin: "0 auto", padding: "34px 24px 60px" },
  centerBox: {
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    color: "var(--cn-coral)",
    fontSize: "13px",
  },
  backButton: {
    border: "1px solid var(--cn-coral-tint)",
    background: "var(--cn-surface)",
    color: "var(--cn-coral)",
    borderRadius: "9px",
    padding: "9px 14px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  backLink: {
    border: "none",
    background: "transparent",
    color: WARNA_PRIMARY,
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: "16px",
    padding: 0,
  },
  card: {
    background: "var(--cn-surface)",
    border: "1px solid var(--cn-tint)",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 8px 26px rgba(var(--cn-navy-rgb), 0.04)",
  },
  cardHeader: { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" },
  title: { margin: 0, fontSize: "20px", fontWeight: 800, color: "var(--cn-navy)" },
  meta: { display: "flex", gap: "12px", color: "var(--cn-coral)", fontSize: "11px", margin: "8px 0" },
  chipRow: { display: "flex", gap: "5px", flexWrap: "wrap" as const },
  classChip: {
    padding: "3px 8px",
    borderRadius: "999px",
    background: "var(--cn-tint)",
    color: "var(--cn-primary)",
    fontSize: "10px",
    fontWeight: 700,
  },
  doneBadge: {
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 800,
    color: "var(--cn-success)",
    background: "var(--cn-success-tint)",
    whiteSpace: "nowrap" as const,
  },
  description: { margin: "16px 0", color: "var(--cn-coral-dark)", fontSize: "13px", lineHeight: 1.7, whiteSpace: "pre-wrap" as const },
  attachmentButton: {
    display: "inline-block",
    textDecoration: "none",
    border: "1px solid var(--cn-tint)",
    background: "var(--cn-tint)",
    color: "var(--cn-primary-dark)",
    borderRadius: "9px",
    padding: "9px 13px",
    fontSize: "12px",
    fontWeight: 700,
  },
  divider: { height: "1px", background: "var(--cn-coral-tint)", margin: "20px 0" },
  sectionTitle: { margin: "0 0 12px", fontSize: "15px", fontWeight: 800, color: "var(--cn-navy)" },
  submissionInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    padding: "12px",
    borderRadius: "10px",
    background: "var(--cn-success-tint)",
    border: "1px solid var(--cn-success-tint)",
    color: "var(--cn-success)",
    fontSize: "12px",
    marginBottom: "14px",
  },
  fileLink: { color: "var(--cn-success)", fontWeight: 700, textDecoration: "underline" },
  uploadLabel: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
    color: "var(--cn-coral-dark)",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "8px",
  },
  fileInput: { fontSize: "12px", color: "var(--cn-coral)" },
  fileInfo: {
    marginBottom: "12px",
    padding: "8px 10px",
    borderRadius: "8px",
    background: "var(--cn-tint)",
    color: "var(--cn-coral)",
    fontSize: "11px",
  },
  errorBox: {
    padding: "10px 12px",
    borderRadius: "9px",
    background: "var(--cn-danger-tint)",
    border: "1px solid var(--cn-danger-tint)",
    color: "var(--cn-danger)",
    fontSize: "11px",
    marginBottom: "14px",
  },
  submitButton: {
    width: "100%",
    border: "none",
    borderRadius: "10px",
    padding: "13px",
    background: WARNA_PRIMARY,
    color: "var(--cn-surface)",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(var(--cn-primary-rgb), 0.22)",
  },
};