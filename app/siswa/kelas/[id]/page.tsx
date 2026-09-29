"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { hitungAktivitasBaru, tandaiSudahDilihat, type TipeAktivitasSiswa } from "@/lib/notifikasiSiswa";
import layout from "./page.module.css";

const WARNA_PRIMARY = "var(--cn-primary)";

interface ItemFeed {
  tipe: "PENGUMUMAN" | "MATERI" | "TUGAS" | "ASESMEN";
  id: string;
  judul: string;
  isi?: string;
  oleh: { id: string; nama: string } | null;
  createdAt: string;
  extra?: Record<string, unknown>;
}

interface DetailKelas {
  id: string;
  judul: string;
  deskripsi: string | null;
  kodeKelas: string;
  siswa: { id: string; nama: string; fotoProfil: string | null }[];
  guru: { id: string; nama: string; fotoProfil: string | null; mapel: { id: string; nama: string }[] }[];
  feed: ItemFeed[];
}

const IKON_TIPE: Record<ItemFeed["tipe"], string> = {
  PENGUMUMAN: "📢",
  MATERI: "📘",
  TUGAS: "📝",
  ASESMEN: "🧪",
};

const LABEL_KATEGORI: Record<ItemFeed["tipe"], string> = {
  PENGUMUMAN: "pengumuman",
  MATERI: "materi",
  TUGAS: "tugas",
  ASESMEN: "asesmen",
};

export default function DetailKelasSiswa() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [kelas, setKelas] = useState<DetailKelas | null>(null);
  const [sedangMuat, setSedangMuat] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabAktif, setTabAktif] = useState<"FEED" | "GURU" | "SISWA">("FEED");
  const [filterFeed, setFilterFeed] = useState<"SEMUA" | TipeAktivitasSiswa>("SEMUA");

  const muat = useCallback(async () => {
    setSedangMuat(true);
    setError(null);

    try {
      const response = await fetch(`/api/siswa/kelas/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.pesan ?? "Gagal memuat kelas.");
        return;
      }

      setKelas(data.data);
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setSedangMuat(false);
    }
  }, [params.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void muat(); }, 0);
    return () => window.clearTimeout(timer);
  }, [muat]);

  function pilihKategoriFeed(kategori: "SEMUA" | TipeAktivitasSiswa) {
    setFilterFeed(kategori);
    if (kategori !== "SEMUA") tandaiSudahDilihat(params.id, kategori);
  }

  if (sedangMuat) {
    return <div style={styles.centerBox}>Memuat kelas...</div>;
  }

  if (error || !kelas) {
    return (
      <div style={styles.centerBox}>
        <p style={{ color: "var(--cn-danger)" }}>⚠️ {error ?? "Kelas tidak ditemukan."}</p>
        <button type="button" onClick={() => router.push("/siswa/kelas")} style={styles.backButton}>
          ← Kembali ke Kelas
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <main className={layout.container} style={styles.container}>
        <button type="button" onClick={() => router.push("/siswa/kelas")} style={styles.backLink}>
          ← Kembali ke Kelas
        </button>

        <header style={styles.classHeader}>
          <h1 style={styles.title}>{kelas.judul}</h1>
          {kelas.deskripsi && <p style={styles.description}>{kelas.deskripsi}</p>}
          <div style={styles.meta}>
            <span>👥 {kelas.siswa.length} siswa</span>
            <span>👨‍🏫 {kelas.guru.length} guru</span>
          </div>
        </header>

        <div style={styles.tabs}>
          {(
            [
              ["FEED", "Feed"],
              ["GURU", `Guru (${kelas.guru.length})`],
              ["SISWA", `Teman Sekelas (${kelas.siswa.length})`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTabAktif(value)}
              style={{
                ...styles.tabButton,
                ...(tabAktif === value ? styles.tabButtonActive : {}),
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tabAktif === "FEED" && (
          <>
            <div className={layout.feedHeading}>
              <div>
                <p>AKTIVITAS KELAS</p>
                <h2>Materi, tugas, dan pengumuman</h2>
              </div>
              <span>{kelas.feed.length} aktivitas</span>
            </div>
            <div className={layout.feedCategories} role="group" aria-label="Filter kategori aktivitas">
              {([
                ["SEMUA", "Semua"],
                ["PENGUMUMAN", "Pengumuman"],
                ["MATERI", "Materi"],
                ["TUGAS", "Tugas"],
                ["ASESMEN", "Asesmen"],
              ] as const).map(([kategori, label]) => {
                const jumlahBaru = kategori === "SEMUA"
                  ? hitungAktivitasBaru(kelas.id, kelas.feed)
                  : hitungAktivitasBaru(kelas.id, kelas.feed, kategori);
                return (
                  <button
                    className={filterFeed === kategori ? layout.categoryActive : layout.categoryButton}
                    key={kategori}
                    type="button"
                    aria-pressed={filterFeed === kategori}
                    onClick={() => pilihKategoriFeed(kategori)}
                  >
                    {label}
                    {jumlahBaru > 0 && (
                      <span className={layout.unreadBadge} aria-label={`${jumlahBaru} aktivitas baru`}>
                        {jumlahBaru > 99 ? "99+" : jumlahBaru}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className={layout.feedList} style={styles.feedList}>
              {kelas.feed.filter((item) => filterFeed === "SEMUA" || item.tipe === filterFeed).length === 0 ? (
                <div style={styles.emptyState}>
                  {filterFeed === "SEMUA"
                    ? "Belum ada aktivitas. Materi, tugas, dan pengumuman dari guru akan muncul di sini."
                    : `Belum ada ${LABEL_KATEGORI[filterFeed]} di kelas ini.`}
                </div>
              ) : (
                kelas.feed.filter((item) => filterFeed === "SEMUA" || item.tipe === filterFeed).map((item) => (
                  <ItemFeedCard key={`${item.tipe}-${item.id}`} item={item} router={router} />
                ))
              )}
            </div>
          </>
        )}

        {tabAktif === "GURU" && (
          <div style={styles.peopleList}>
            {kelas.guru.map((g) => (
              <div key={g.id} style={styles.personRow}>
                <div style={styles.avatar}>
                  {g.fotoProfil ? (
                    <img src={g.fotoProfil} alt="" style={styles.avatarImg} />
                  ) : (
                    g.nama.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <strong style={styles.personName}>{g.nama}</strong>
                  <div style={styles.chipRow}>
                    {g.mapel.map((m) => (
                      <span key={m.id} style={styles.chip}>{m.nama}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tabAktif === "SISWA" && (
          <div style={styles.peopleList}>
            {kelas.siswa.map((s) => (
              <div
                key={s.id}
                style={styles.personRow}
                onClick={() => router.push(`/profil/${s.id}`)}
              >
                <div style={styles.avatar}>
                  {s.fotoProfil ? (
                    <img src={s.fotoProfil} alt="" style={styles.avatarImg} />
                  ) : (
                    s.nama.charAt(0).toUpperCase()
                  )}
                </div>
                <strong style={styles.personName}>{s.nama}</strong>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ItemFeedCard({
  item,
  router,
}: {
  item: ItemFeed;
  router: ReturnType<typeof useRouter>;
}) {
  const tanggal = new Date(item.createdAt);
  const bisaDiklik = item.tipe === "TUGAS" || item.tipe === "ASESMEN";

  return (
    <article
      style={{ ...styles.feedCard, cursor: bisaDiklik ? "pointer" : "default" }}
      onClick={() => {
        if (item.tipe === "TUGAS") router.push(`/siswa/tugas/${item.id}`);
        if (item.tipe === "ASESMEN") router.push(`/siswa/asesmen/${item.id}`);
      }}
    >
      <div style={styles.feedIcon}>{IKON_TIPE[item.tipe]}</div>

      <div style={styles.feedMain}>
        <div style={styles.feedTop}>
          <span style={styles.feedTipe}>{LABEL_TIPE[item.tipe]}</span>
          <span style={styles.feedWaktu}>
            {tanggal.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}{" "}
            ·{" "}
            {tanggal.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        <h3 style={styles.feedTitle}>{item.judul}</h3>

        {item.isi && <p style={styles.feedText}>{item.isi}</p>}

        {item.oleh && <span style={styles.feedOleh}>Oleh {item.oleh.nama}</span>}

        {item.tipe === "TUGAS" && (
          <span
            style={{
              ...styles.statusChip,
              ...(item.extra?.sudahDikumpulkan ? styles.statusDone : styles.statusPending),
            }}
          >
            {item.extra?.sudahDikumpulkan ? "✓ Sudah dikumpulkan" : "⏳ Belum dikumpulkan"}
          </span>
        )}

        {item.tipe === "ASESMEN" && (
          <span
            style={{
              ...styles.statusChip,
              ...(item.extra?.sudahDikerjakan ? styles.statusDone : styles.statusPending),
            }}
          >
            {item.extra?.sudahDikerjakan ? "✓ Sudah dikerjakan" : "Kerjakan sekarang"}
          </span>
        )}

        {item.tipe === "MATERI" && typeof item.extra?.url === "string" && (
          <a
            href={item.extra.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={styles.materiLink}
          >
            {item.extra.tipeMateri === "PDF" ? "📄 Buka PDF" : "🔗 Buka Link"}
          </a>
        )}
      </div>
    </article>
  );
}

const LABEL_TIPE: Record<ItemFeed["tipe"], string> = {
  PENGUMUMAN: "Pengumuman",
  MATERI: "Materi Baru",
  TUGAS: "Tugas Baru",
  ASESMEN: "Asesmen Baru",
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, var(--cn-tint) 0%, var(--cn-surface) 42%, var(--cn-tint) 100%)",
    color: "var(--cn-coral-dark)",
  },
  container: { width: "100%", maxWidth: "760px", margin: "0 auto", padding: "34px 24px 60px" },
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
  classHeader: { marginBottom: "18px" },
  title: { margin: 0, fontSize: "24px", fontWeight: 800, color: "var(--cn-navy)" },
  description: { margin: "8px 0 0", color: "var(--cn-coral)", fontSize: "13px", lineHeight: 1.6 },
  meta: { display: "flex", gap: "14px", color: "var(--cn-coral)", fontSize: "12px", marginTop: "10px" },
  tabs: {
    display: "flex",
    gap: "4px",
    padding: "4px",
    background: "var(--cn-coral-tint)",
    borderRadius: "11px",
    marginBottom: "20px",
    width: "fit-content",
  },
  tabButton: {
    border: "none",
    background: "transparent",
    color: "var(--cn-coral)",
    borderRadius: "8px",
    padding: "8px 14px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  tabButtonActive: {
    background: "var(--cn-surface)",
    color: WARNA_PRIMARY,
    boxShadow: "0 2px 7px rgba(var(--cn-navy-rgb), 0.08)",
  },
  feedList: { display: "flex", flexDirection: "column" as const, gap: "12px" },
  emptyState: {
    padding: "40px 20px",
    textAlign: "center" as const,
    color: "var(--cn-coral)",
    fontSize: "12px",
    background: "var(--cn-surface)",
    border: "1px dashed var(--cn-coral-tint)",
    borderRadius: "16px",
  },
  feedCard: {
    display: "flex",
    gap: "13px",
    background: "var(--cn-surface)",
    border: "1px solid var(--cn-tint)",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 5px 18px rgba(var(--cn-navy-rgb), 0.03)",
  },
  feedIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "11px",
    background: "var(--cn-tint)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
    flexShrink: 0,
  },
  feedMain: { flex: 1, minWidth: 0 },
  feedTop: { display: "flex", justifyContent: "space-between", marginBottom: "4px" },
  feedTipe: { fontSize: "10px", fontWeight: 800, color: WARNA_PRIMARY, letterSpacing: "0.4px" },
  feedWaktu: { fontSize: "10px", color: "var(--cn-coral)" },
  feedTitle: { margin: "2px 0 6px", fontSize: "14px", fontWeight: 800, color: "var(--cn-coral-dark)" },
  feedText: { margin: "0 0 8px", color: "var(--cn-coral)", fontSize: "12px", lineHeight: 1.6 },
  feedOleh: { display: "block", color: "var(--cn-coral)", fontSize: "10px", marginBottom: "8px" },
  statusChip: {
    display: "inline-block",
    padding: "4px 9px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 800,
  },
  statusDone: { background: "var(--cn-success-tint)", color: "var(--cn-success)" },
  statusPending: { background: "var(--cn-coral-tint)", color: "var(--cn-coral)" },
  materiLink: {
    display: "inline-block",
    marginTop: "8px",
    textDecoration: "none",
    color: "var(--cn-primary-dark)",
    fontSize: "11px",
    fontWeight: 700,
  },
  peopleList: { display: "flex", flexDirection: "column" as const, gap: "8px" },
  personRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "var(--cn-surface)",
    border: "1px solid var(--cn-tint)",
    borderRadius: "13px",
    padding: "12px 14px",
    cursor: "pointer",
  },
  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "11px",
    background: "var(--cn-tint)",
    color: WARNA_PRIMARY,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 800,
    overflow: "hidden",
    flexShrink: 0,
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" as const },
  personName: { fontSize: "13px", color: "var(--cn-coral-dark)" },
  chipRow: { display: "flex", gap: "5px", flexWrap: "wrap" as const, marginTop: "4px" },
  chip: {
    padding: "3px 8px",
    borderRadius: "999px",
    background: "var(--cn-tint)",
    color: "var(--cn-primary)",
    fontSize: "10px",
    fontWeight: 700,
  },
};