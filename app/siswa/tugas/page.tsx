"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import EmptyStateFox from "@/components/EmptyStateFox";
import responsive from "./page.module.css";

const WARNA_PRIMARY = "var(--cn-primary)";

interface KelasRingkas {
  id: string;
  judul: string;
}

interface TugasSiswa {
  id: string;
  judul: string;
  deskripsi: string;
  tipeLampiran: "PDF" | "LINK" | null;
  lampiran: string | null;
  guru: { id: string; nama: string };
  kelasTujuan: KelasRingkas[];
  dikirimAt: string;
  submission: { fileUrl: string; waktuKumpul: string } | null;
  status: "SUDAH" | "HARI_INI" | "BELUM";
}

export default function HalamanTugasSiswa() {
  const router = useRouter();
  const [daftarTugas, setDaftarTugas] = useState<TugasSiswa[]>([]);
  const [sedangMuat, setSedangMuat] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setSedangMuat(true);
    setError(null);

    try {
      const response = await fetch("/api/siswa/tugas");
      const data = await response.json();

      if (!response.ok) {
        setError(data.pesan ?? "Gagal memuat tugas.");
        setDaftarTugas([]);
        return;
      }

      setDaftarTugas(data.data ?? []);
    } catch {
      setError("Tidak dapat terhubung ke server.");
      setDaftarTugas([]);
    } finally {
      setSedangMuat(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void muat(); }, 0);
    return () => window.clearTimeout(timer);
  }, [muat]);

  const hariIni = useMemo(
    () => daftarTugas.filter((t) => t.status === "HARI_INI"),
    [daftarTugas]
  );
  const sudah = useMemo(
    () => daftarTugas.filter((t) => t.status === "SUDAH"),
    [daftarTugas]
  );
  const belum = useMemo(
    () => daftarTugas.filter((t) => t.status === "BELUM"),
    [daftarTugas]
  );
  const totalSelesai = sudah.length;
  const totalPerluDikerjakan = hariIni.length + belum.length;

  return (
    <div style={styles.page}>
      <main className={responsive.container} style={styles.container}>
        <header className={responsive.header} style={styles.header}>
          <div style={styles.breadcrumb}>Siswa <span>/</span> Tugas</div>
          <h1 style={styles.pageTitle}>Tugas</h1>
          <p style={styles.pageSubtitle}>
            Tugas yang dikirim guru ke kelasmu, dikelompokkan berdasarkan status pengumpulan.
          </p>
        </header>

        {!sedangMuat && !error && (
          <section className={responsive.summary} aria-label="Ringkasan tugas">
            <RingkasanTugas label="Total tugas" jumlah={daftarTugas.length} ikon="▤" />
            <RingkasanTugas label="Perlu dikerjakan" jumlah={totalPerluDikerjakan} ikon="◷" />
            <RingkasanTugas label="Sudah dikumpulkan" jumlah={totalSelesai} ikon="✓" />
          </section>
        )}

        {sedangMuat ? (
          <div style={styles.loadingBox}>Memuat tugas...</div>
        ) : error ? (
          <div style={styles.errorBox}>⚠️ {error}</div>
        ) : (
          <>
            <Kelompok
              eyebrow="AKTIVITAS TERBARU"
              title="Tugas Hari Ini"
              subtitle="Tugas baru yang dikirim hari ini, belum kamu kerjakan."
              daftar={hariIni}
              emptyText="Belum ada tugas baru hari ini."
              onBuka={(id) => router.push(`/siswa/tugas/${id}`)}
            />

            <Kelompok
              eyebrow="SELESAI"
              title="Sudah Dikerjakan"
              subtitle="Tugas yang sudah kamu kumpulkan."
              daftar={sudah}
              emptyText="Belum ada tugas yang kamu kumpulkan."
              onBuka={(id) => router.push(`/siswa/tugas/${id}`)}
            />

            <Kelompok
              eyebrow="PERLU DIKERJAKAN"
              title="Belum Dikerjakan"
              subtitle="Tugas lama yang belum kamu kumpulkan."
              daftar={belum}
              emptyText="Tidak ada tugas yang tertunda. Kerja bagus!"
              onBuka={(id) => router.push(`/siswa/tugas/${id}`)}
            />
          </>
        )}
      </main>
    </div>
  );
}

function Kelompok({
  eyebrow,
  title,
  subtitle,
  daftar,
  emptyText,
  onBuka,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  daftar: TugasSiswa[];
  emptyText: string;
  onBuka: (id: string) => void;
}) {
  return (
    <section className={responsive.section} style={styles.section}>
      <div className={responsive.sectionHeader} style={styles.sectionHeader}>
        <div>
          <div style={styles.sectionEyebrow}>{eyebrow}</div>
          <h2 style={styles.sectionTitle}>{title}</h2>
          <p style={styles.sectionSubtitle}>{subtitle}</p>
        </div>
        <span style={styles.countBadge}>{daftar.length} tugas</span>
      </div>

      {daftar.length === 0 ? (
        <div className={responsive.emptyState} style={styles.emptyState}>
          <EmptyStateFox compact />
          <p style={styles.emptyText}>{emptyText}</p>
        </div>
      ) : (
        <div className={responsive.taskList} style={styles.taskList}>
          {daftar.map((t) => (
            <KartuTugas key={t.id} t={t} onBuka={() => onBuka(t.id)} />
          ))}
        </div>
      )}
    </section>
  );
}

function RingkasanTugas({ label, jumlah, ikon }: { label: string; jumlah: number; ikon: string }) {
  return (
    <div className={responsive.summaryCard}>
      <span className={responsive.summaryIcon} aria-hidden="true">{ikon}</span>
      <span className={responsive.summaryText}>
        <span>{label}</span>
        <strong>{jumlah}</strong>
      </span>
    </div>
  );
}

function KartuTugas({ t, onBuka }: { t: TugasSiswa; onBuka: () => void }) {
  const tanggal = new Date(t.dikirimAt);

  return (
    <article
      className={responsive.taskCard}
      style={styles.taskCard}
      onClick={onBuka}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onBuka();
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`Buka tugas ${t.judul}`}
    >
      <div style={styles.taskIcon}>📝</div>

      <div style={styles.taskMain}>
        <div style={styles.taskTitleRow}>
          <h3 style={styles.taskTitle}>{t.judul}</h3>
          {t.status === "SUDAH" && <span style={styles.doneBadge}>Sudah dikumpulkan</span>}
        </div>

        <p style={styles.taskDescription}>{t.deskripsi}</p>

        <div className={responsive.taskMeta} style={styles.taskMeta}>
          <span>👤 {t.guru.nama}</span>
          <span>
            📅{" "}
            {tanggal.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          {t.lampiran && <span>{t.tipeLampiran === "PDF" ? "📄 PDF" : "🔗 Link"}</span>}
        </div>

        <div style={styles.chipRow}>
          {t.kelasTujuan.map((k) => (
            <span key={k.id} style={styles.classChip}>{k.judul}</span>
          ))}
        </div>
      </div>

      <span className={responsive.cardAction} aria-hidden="true">Buka tugas <span>→</span></span>
    </article>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, var(--cn-tint) 0%, var(--cn-surface) 42%, var(--cn-tint) 100%)",
    color: "var(--cn-coral-dark)",
  },
  container: {
    width: "100%",
    maxWidth: "1160px",
    margin: "0 auto",
    padding: "34px 24px 60px",
  },
  header: { marginBottom: "28px" },
  breadcrumb: { fontSize: "12px", color: "var(--cn-coral)", marginBottom: "8px", fontWeight: 600 },
  pageTitle: { margin: 0, fontSize: "28px", fontWeight: 800, color: "var(--cn-navy)", letterSpacing: "-0.6px" },
  pageSubtitle: { margin: "8px 0 0", fontSize: "13px", color: "var(--cn-coral)" },
  loadingBox: { padding: "40px", textAlign: "center" as const, color: "var(--cn-coral)", fontSize: "13px" },
  errorBox: {
    padding: "12px 14px",
    borderRadius: "10px",
    background: "var(--cn-danger-tint)",
    border: "1px solid var(--cn-danger-tint)",
    color: "var(--cn-danger)",
    fontSize: "12px",
  },
  section: { marginBottom: "34px" },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "12px",
  },
  sectionEyebrow: { fontSize: "10px", color: WARNA_PRIMARY, fontWeight: 800, letterSpacing: "1px" },
  sectionTitle: { margin: "4px 0 0", fontSize: "17px", fontWeight: 800, color: "var(--cn-navy)" },
  sectionSubtitle: { margin: "4px 0 0", fontSize: "12px", color: "var(--cn-coral)" },
  countBadge: {
    background: "var(--cn-tint)",
    color: WARNA_PRIMARY,
    borderRadius: "999px",
    padding: "5px 10px",
    fontSize: "11px",
    fontWeight: 700,
  },
  taskList: { display: "flex", flexDirection: "column" as const, gap: "10px" },
  taskCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    background: "var(--cn-surface)",
    border: "1px solid var(--cn-line)",
    borderRadius: "14px",
    padding: "18px",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(var(--cn-navy-rgb), 0.05)",
    transition: "border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
  },
  taskIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "var(--cn-tint)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },
  taskMain: { flex: 1, minWidth: 0 },
  taskTitleRow: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const },
  taskTitle: { margin: 0, fontSize: "14px", fontWeight: 800, color: "var(--cn-coral-dark)" },
  doneBadge: {
    padding: "3px 7px",
    borderRadius: "999px",
    fontSize: "9px",
    fontWeight: 800,
    color: "var(--cn-success)",
    background: "var(--cn-success-tint)",
  },
  taskDescription: {
    margin: "6px 0",
    color: "var(--cn-coral)",
    fontSize: "12px",
    lineHeight: 1.5,
    display: "-webkit-box" as const,
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },
  taskMeta: { display: "flex", gap: "12px", flexWrap: "wrap" as const, color: "var(--cn-coral)", fontSize: "10px", marginBottom: "8px" },
  chipRow: { display: "flex", gap: "5px", flexWrap: "wrap" as const },
  classChip: {
    padding: "3px 8px",
    borderRadius: "999px",
    background: "var(--cn-tint)",
    color: "var(--cn-primary)",
    fontSize: "10px",
    fontWeight: 700,
  },
  emptyState: {
    display: "grid",
    justifyItems: "center",
    gap: "8px",
    background: "var(--cn-surface)",
    border: "1px dashed var(--cn-line)",
    borderRadius: "16px",
    padding: "32px 20px",
    textAlign: "center" as const,
  },
  emptyText: { margin: 0, color: "var(--cn-muted)", fontSize: "12px" },
};