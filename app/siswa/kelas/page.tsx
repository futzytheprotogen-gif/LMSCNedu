"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { hitungAktivitasBaru } from "@/lib/notifikasiSiswa";

const WARNA_PRIMARY = "var(--cn-primary)";

interface AktivitasRingkas {
  tipe: "PENGUMUMAN" | "MATERI" | "TUGAS" | "ASESMEN";
  id: string;
  judul: string;
  createdAt: string;
}

interface KelasSiswa {
  id: string;
  judul: string;
  deskripsi: string | null;
  kodeKelas: string;
  jumlahSiswa: number;
  aktivitasTerbaru: AktivitasRingkas[];
}

const IKON_TIPE: Record<AktivitasRingkas["tipe"], string> = {
  PENGUMUMAN: "📢",
  MATERI: "📘",
  TUGAS: "📝",
  ASESMEN: "🧪",
};

const LABEL_TIPE: Record<AktivitasRingkas["tipe"], string> = {
  PENGUMUMAN: "Pengumuman",
  MATERI: "Materi",
  TUGAS: "Tugas",
  ASESMEN: "Asesmen",
};

// Variasi warna kelas mengikuti palet CN Edu: blue, navy, dan coral.
const GRADIENTS = [
  "linear-gradient(135deg, var(--cn-primary) 0%, var(--cn-primary-dark) 100%)",
  "linear-gradient(135deg, var(--cn-primary) 0%, var(--cn-navy) 100%)",
  "linear-gradient(135deg, var(--cn-coral) 0%, var(--cn-coral) 100%)",
  "linear-gradient(135deg, var(--cn-cyan) 0%, var(--cn-primary) 100%)",
  "linear-gradient(135deg, var(--cn-navy) 0%, var(--cn-coral) 100%)",
];

function gradientUntuk(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % GRADIENTS.length;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export default function HalamanKelasSiswa() {
  const router = useRouter();
  const [daftarKelas, setDaftarKelas] = useState<KelasSiswa[]>([]);
  const [sedangMuat, setSedangMuat] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pencarian, setPencarian] = useState("");
  const [kartuHover, setKartuHover] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setSedangMuat(true);
    setError(null);

    try {
      const response = await fetch("/api/siswa/kelas");
      const data = await response.json();

      if (!response.ok) {
        setError(data.pesan ?? "Gagal memuat kelas.");
        return;
      }

      setDaftarKelas(data.data ?? []);
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setSedangMuat(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void muat(); }, 0);
    return () => window.clearTimeout(timer);
  }, [muat]);

  const kelasTerfilter = useMemo(() => {
    const keyword = pencarian.trim().toLowerCase();
    if (!keyword) return daftarKelas;

    return daftarKelas.filter((kelas) => {
      const cocokJudul = kelas.judul.toLowerCase().includes(keyword);
      const cocokDeskripsi = kelas.deskripsi?.toLowerCase().includes(keyword) ?? false;
      return cocokJudul || cocokDeskripsi;
    });
  }, [daftarKelas, pencarian]);

  const totalNotifSemua = useMemo(
    () =>
      daftarKelas.reduce(
        (jumlah, kelas) => jumlah + hitungAktivitasBaru(kelas.id, kelas.aktivitasTerbaru),
        0
      ),
    [daftarKelas]
  );

  return (
    <div style={styles.page}>
      <div style={styles.backgroundGlowOne} />
      <div style={styles.backgroundGlowTwo} />

      <main style={styles.container}>
        <header style={styles.header}>
          <div>
            <div style={styles.breadcrumb}>
              Siswa <span>/</span> Kelas
            </div>
            <h1 style={styles.pageTitle}>Kelas Saya</h1>
            <p style={styles.pageSubtitle}>
              Kelas yang kamu ikuti, lengkap dengan aktivitas terbaru.
            </p>
          </div>

          {!sedangMuat && daftarKelas.length > 0 && (
            <div style={styles.statsPill}>
              <div style={styles.statItem}>
                <strong style={styles.statValue}>{daftarKelas.length}</strong>
                <span style={styles.statLabel}>Kelas</span>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.statItem}>
                <strong
                  style={{
                    ...styles.statValue,
                    color: totalNotifSemua > 0 ? "var(--cn-danger)" : "var(--cn-navy)",
                  }}
                >
                  {totalNotifSemua}
                </strong>
                <span style={styles.statLabel}>Baru</span>
              </div>
            </div>
          )}
        </header>

        {!sedangMuat && daftarKelas.length > 0 && (
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon}>⌕</span>
            <input
              value={pencarian}
              onChange={(e) => setPencarian(e.target.value)}
              placeholder="Cari kelas..."
              style={styles.searchInput}
            />
            {pencarian && (
              <button
                type="button"
                onClick={() => setPencarian("")}
                style={styles.clearButton}
                aria-label="Bersihkan pencarian"
              >
                ×
              </button>
            )}
          </div>
        )}

        {sedangMuat ? (
          <div style={styles.grid}>
            {[1, 2, 3].map((n) => (
              <div key={n} style={styles.skeletonCard}>
                <div style={styles.skeletonHeader} />
                <div style={styles.skeletonBody}>
                  <div style={styles.skeletonLine} />
                  <div style={{ ...styles.skeletonLine, width: "60%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={styles.errorBox}>
            <span>⚠️</span>
            <div>
              <strong>Gagal memuat kelas</strong>
              <p style={styles.errorText}>{error}</p>
            </div>
            <button type="button" onClick={muat} style={styles.retryButton}>
              Coba Lagi
            </button>
          </div>
        ) : daftarKelas.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIconWrap}>
              <span style={styles.emptyIcon}>🏫</span>
            </div>
            <strong style={styles.emptyTitle}>Kamu belum tergabung di kelas manapun</strong>
            <p style={styles.emptyText}>
              Minta admin menambahkanmu, atau gunakan link undangan dari guru.
            </p>
          </div>
        ) : kelasTerfilter.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIconWrap}>
              <span style={styles.emptyIcon}>🔎</span>
            </div>
            <strong style={styles.emptyTitle}>Kelas tidak ditemukan</strong>
            <p style={styles.emptyText}>Coba gunakan kata kunci pencarian yang berbeda.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {kelasTerfilter.map((kelas) => {
              const jumlahBaru = hitungAktivitasBaru(kelas.id, kelas.aktivitasTerbaru);
              const aktivitasPalingBaru = kelas.aktivitasTerbaru[0];
              const dihover = kartuHover === kelas.id;

              return (
                <article
                  key={kelas.id}
                  style={{
                    ...styles.card,
                    ...(dihover ? styles.cardHover : {}),
                  }}
                  onClick={() => router.push(`/siswa/kelas/${kelas.id}`)}
                  onMouseEnter={() => setKartuHover(kelas.id)}
                  onMouseLeave={() => setKartuHover(null)}
                >
                  <div
                    style={{
                      ...styles.cardBanner,
                      background: gradientUntuk(kelas.id),
                    }}
                  >
                    <div style={styles.cardIconWrap}>
                      <span style={styles.cardIcon}>{kelas.judul.charAt(0).toUpperCase()}</span>
                    </div>

                    {jumlahBaru > 0 && (
                      <span style={styles.badge} title={`${jumlahBaru} aktivitas baru`}>
                        {jumlahBaru > 9 ? "9+" : jumlahBaru} baru
                      </span>
                    )}

                    <span
                      style={{
                        ...styles.cardArrow,
                        transform: dihover ? "translateX(3px)" : "translateX(0)",
                      }}
                    >
                      →
                    </span>
                  </div>

                  <div style={styles.cardBody}>
                    <h3 style={styles.cardTitle}>{kelas.judul}</h3>

                    {kelas.deskripsi && (
                      <p style={styles.cardDescription}>{kelas.deskripsi}</p>
                    )}

                    <div style={styles.cardMeta}>
                      <span style={styles.metaChip}>👥 {kelas.jumlahSiswa} siswa</span>
                    </div>

                    <div style={styles.cardDivider} />

                    {aktivitasPalingBaru ? (
                      <div style={styles.previewActivity}>
                        <span style={styles.previewIcon}>
                          {IKON_TIPE[aktivitasPalingBaru.tipe]}
                        </span>
                        <div style={styles.previewTextWrap}>
                          <span style={styles.previewTipe}>
                            {LABEL_TIPE[aktivitasPalingBaru.tipe]}
                          </span>
                          <span style={styles.previewText}>{aktivitasPalingBaru.judul}</span>
                        </div>
                      </div>
                    ) : (
                      <div style={styles.previewEmpty}>
                        <span>💤</span> Belum ada aktivitas.
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, var(--cn-tint) 0%, var(--cn-surface) 42%, var(--cn-tint) 100%)",
    position: "relative" as const,
    overflow: "hidden" as const,
    color: "var(--cn-coral-dark)",
  },
  backgroundGlowOne: {
    position: "absolute" as const,
    width: "420px",
    height: "420px",
    borderRadius: "50%",
    background: "rgba(var(--cn-primary-rgb), 0.07)",
    top: "-180px",
    right: "-120px",
    pointerEvents: "none" as const,
  },
  backgroundGlowTwo: {
    position: "absolute" as const,
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    background: "rgba(var(--cn-primary-rgb), 0.045)",
    bottom: "10%",
    left: "-180px",
    pointerEvents: "none" as const,
  },
  container: {
    width: "100%",
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "34px 24px 60px",
    position: "relative" as const,
    zIndex: 1,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    flexWrap: "wrap" as const,
    marginBottom: "20px",
  },
  breadcrumb: { fontSize: "12px", color: "var(--cn-coral)", marginBottom: "8px", fontWeight: 600 },
  pageTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 800,
    color: "var(--cn-navy)",
    letterSpacing: "-0.6px",
  },
  pageSubtitle: { margin: "8px 0 0", fontSize: "13px", color: "var(--cn-coral)" },
  statsPill: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    background: "var(--cn-surface)",
    border: "1px solid var(--cn-tint)",
    borderRadius: "16px",
    padding: "12px 20px",
    boxShadow: "0 6px 20px rgba(var(--cn-navy-rgb), 0.04)",
  },
  statItem: { display: "flex", flexDirection: "column" as const, alignItems: "center" },
  statValue: { fontSize: "20px", fontWeight: 800, color: "var(--cn-navy)", lineHeight: 1 },
  statLabel: { fontSize: "10px", color: "var(--cn-coral)", fontWeight: 700, marginTop: "3px" },
  statDivider: { width: "1px", height: "28px", background: "var(--cn-tint)" },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "var(--cn-surface)",
    border: "1px solid var(--cn-tint)",
    borderRadius: "13px",
    padding: "10px 14px",
    marginBottom: "22px",
    maxWidth: "360px",
    boxShadow: "0 4px 14px rgba(var(--cn-navy-rgb), 0.03)",
  },
  searchIcon: { color: "var(--cn-coral)", fontSize: "18px" },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "13px",
    color: "var(--cn-navy)",
  },
  clearButton: {
    border: "none",
    background: "var(--cn-coral-tint)",
    color: "var(--cn-coral)",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    fontSize: "13px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "18px",
  },
  card: {
    background: "var(--cn-surface)",
    border: "1px solid var(--cn-tint)",
    borderRadius: "18px",
    cursor: "pointer",
    overflow: "hidden",
    boxShadow: "0 6px 20px rgba(var(--cn-navy-rgb), 0.035)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  cardHover: {
    transform: "translateY(-4px)",
    boxShadow: "0 16px 34px rgba(var(--cn-primary-rgb), 0.16)",
  },
  cardBanner: {
    position: "relative" as const,
    height: "84px",
    padding: "16px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardIconWrap: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "rgba(var(--cn-white-rgb), 0.2)",
    border: "1px solid rgba(var(--cn-white-rgb), 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardIcon: { color: "var(--cn-surface)", fontSize: "18px", fontWeight: 800 },
  badge: {
    position: "absolute" as const,
    top: "12px",
    right: "44px",
    background: "var(--cn-danger)",
    color: "var(--cn-surface)",
    fontSize: "10px",
    fontWeight: 800,
    padding: "4px 9px",
    borderRadius: "999px",
    boxShadow: "0 3px 10px rgba(var(--cn-danger-rgb), 0.35)",
    whiteSpace: "nowrap" as const,
  },
  cardArrow: {
    color: "var(--cn-surface)",
    fontSize: "17px",
    fontWeight: 700,
    transition: "transform 0.2s ease",
    alignSelf: "center",
  },
  cardBody: { padding: "16px 17px 18px" },
  cardTitle: { margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--cn-navy)" },
  cardDescription: {
    margin: "7px 0 0",
    color: "var(--cn-coral)",
    fontSize: "12px",
    lineHeight: 1.5,
    display: "-webkit-box" as const,
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },
  cardMeta: { display: "flex", gap: "8px", marginTop: "12px" },
  metaChip: {
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--cn-primary)",
    background: "var(--cn-tint)",
    borderRadius: "999px",
    padding: "5px 10px",
  },
  cardDivider: { height: "1px", background: "var(--cn-coral-tint)", margin: "14px 0 12px" },
  previewActivity: { display: "flex", alignItems: "flex-start", gap: "9px" },
  previewIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "9px",
    background: "var(--cn-tint)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    flexShrink: 0,
  },
  previewTextWrap: { minWidth: 0, display: "flex", flexDirection: "column" as const },
  previewTipe: { fontSize: "9px", fontWeight: 800, color: WARNA_PRIMARY, letterSpacing: "0.3px" },
  previewText: {
    fontSize: "12px",
    color: "var(--cn-coral-dark)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    marginTop: "1px",
  },
  previewEmpty: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "var(--cn-coral)",
    fontSize: "11px",
    fontStyle: "italic" as const,
  },
  skeletonCard: {
    background: "var(--cn-surface)",
    border: "1px solid var(--cn-tint)",
    borderRadius: "18px",
    overflow: "hidden",
  },
  skeletonHeader: { height: "84px", background: "var(--cn-coral-tint)" },
  skeletonBody: { padding: "16px 17px 18px", display: "flex", flexDirection: "column" as const, gap: "10px" },
  skeletonLine: { height: "10px", borderRadius: "6px", background: "var(--cn-coral-tint)", width: "85%" },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px 18px",
    borderRadius: "14px",
    background: "var(--cn-danger-tint)",
    border: "1px solid var(--cn-danger-tint)",
    color: "var(--cn-danger)",
  },
  errorText: { margin: "2px 0 0", fontSize: "12px" },
  retryButton: {
    marginLeft: "auto",
    border: "1px solid var(--cn-danger-tint)",
    background: "var(--cn-surface)",
    color: "var(--cn-danger)",
    borderRadius: "9px",
    padding: "8px 14px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
  },
  emptyState: {
    background: "var(--cn-surface)",
    border: "1px dashed var(--cn-coral-tint)",
    borderRadius: "18px",
    padding: "50px 20px",
    textAlign: "center" as const,
    color: "var(--cn-coral-dark)",
  },
  emptyIconWrap: {
    width: "56px",
    height: "56px",
    margin: "0 auto 12px",
    borderRadius: "16px",
    background: "var(--cn-tint)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: { fontSize: "24px" },
  emptyTitle: { fontSize: "14px", color: "var(--cn-navy)" },
  emptyText: { margin: "6px 0 0", color: "var(--cn-coral)", fontSize: "12px" },
};