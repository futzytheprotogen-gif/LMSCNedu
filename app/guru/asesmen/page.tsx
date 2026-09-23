"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const WARNA = {
  primary: "#2196f3",
  primaryDark: "#1976d2",
  primarySoft: "#e8f3fe",

  background: "#f7f9fc",
  white: "#ffffff",

  text: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",

  border: "#e5e7eb",

  green: "#16a34a",
  greenSoft: "#dcfce7",

  orange: "#d97706",
  orangeSoft: "#fef3c7",

  red: "#ef4444",
  redSoft: "#fee2e2",
};

interface AsesmenRingkas {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  status: "PROSES" | "SELESAI";
  mapel: string;
  jumlahSoal: number;
  jumlahKelasTujuan: number;
}

type FilterStatus = "SEMUA" | "PROSES" | "SELESAI";

export default function HalamanAsesmenGuru() {
  const router = useRouter();

  const [daftar, setDaftar] = useState<AsesmenRingkas[]>([]);
  const [sedangMuat, setSedangMuat] = useState(true);
  const [kataKunci, setKataKunci] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("SEMUA");

  // State untuk konfirmasi hapus
  const [asesmenDiHapus, setAsesmenDiHapus] = useState<AsesmenRingkas | null>(null);
  const [sedangMenghapus, setSedangMenghapus] = useState(false);

  useEffect(() => {
    fetch("/api/asesmen")
      .then((r) => r.json())
      .then((data) => setDaftar(data.data ?? []))
      .catch(() => setDaftar([]))
      .finally(() => setSedangMuat(false));
  }, []);

  // Fungsi untuk menangani proses hapus
  const tanganiHapus = async () => {
    if (!asesmenDiHapus) return;

    setSedangMenghapus(true);
    try {
      const res = await fetch(`/api/asesmen/${asesmenDiHapus.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDaftar((prev) => prev.filter((a) => a.id !== asesmenDiHapus.id));
        setAsesmenDiHapus(null);
      } else {
        alert("Gagal menghapus asesmen. Silakan coba lagi.");
      }
    } catch {
      alert("Terjadi kesalahan saat menghapus asesmen.");
    } finally {
      setSedangMenghapus(false);
    }
  };

  const totalProses = daftar.filter((a) => a.status === "PROSES").length;

  const totalSelesai = daftar.filter((a) => a.status === "SELESAI").length;

  const daftarTampil = useMemo(() => {
    return daftar.filter((a) => {
      const cocokStatus =
        filterStatus === "SEMUA" || a.status === filterStatus;

      const query = kataKunci.toLowerCase().trim();

      const cocokPencarian =
        !query ||
        a.judul.toLowerCase().includes(query) ||
        a.mapel.toLowerCase().includes(query);

      return cocokStatus && cocokPencarian;
    });
  }, [daftar, filterStatus, kataKunci]);

  return (
    <div style={estilo.halaman}>
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div style={estilo.header}>
        <div>
          <div style={estilo.labelHalaman}>RUANG GURU</div>

          <h1 style={estilo.judulHalaman}>Asesmen</h1>

          <p style={estilo.subjudul}>
            Kelola kuis dan ujian online untuk siswa.
          </p>
        </div>

        <button
          onClick={() => router.push("/guru/asesmen/baru")}
          style={estilo.tombolBuat}
        >
          <span style={estilo.iconPlus}>+</span>
          Buat Asesmen
        </button>
      </div>

      {/* =====================================================
          STATISTIK
      ====================================================== */}

      <div style={estilo.statistik}>
        <StatCard
          icon="📝"
          label="Total Asesmen"
          nilai={daftar.length}
          warna="blue"
        />

        <StatCard
          icon="⏳"
          label="Sedang Proses"
          nilai={totalProses}
          warna="orange"
        />

        <StatCard
          icon="✓"
          label="Selesai"
          nilai={totalSelesai}
          warna="green"
        />
      </div>

      {/* =====================================================
          TOOLBAR
      ====================================================== */}

      <div style={estilo.toolbar}>
        <div style={estilo.searchWrapper}>
          <span style={estilo.searchIcon}>🔍</span>

          <input
            type="text"
            value={kataKunci}
            onChange={(e) => setKataKunci(e.target.value)}
            placeholder="Cari asesmen atau mata pelajaran..."
            style={estilo.searchInput}
          />

          {kataKunci && (
            <button
              onClick={() => setKataKunci("")}
              style={estilo.tombolClear}
              type="button"
            >
              ✕
            </button>
          )}
        </div>

        <div style={estilo.filterGroup}>
          <FilterButton
            aktif={filterStatus === "SEMUA"}
            onClick={() => setFilterStatus("SEMUA")}
          >
            Semua
          </FilterButton>

          <FilterButton
            aktif={filterStatus === "PROSES"}
            onClick={() => setFilterStatus("PROSES")}
          >
            Proses
          </FilterButton>

          <FilterButton
            aktif={filterStatus === "SELESAI"}
            onClick={() => setFilterStatus("SELESAI")}
          >
            Selesai
          </FilterButton>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      {sedangMuat ? (
        <div style={estilo.loading}>
          <div style={estilo.loadingIcon}>⟳</div>
          <p>Memuat asesmen...</p>
        </div>
      ) : (
        <>
          <div style={estilo.headerDaftar}>
            <div>
              <h2 style={estilo.judulDaftar}>Daftar Asesmen</h2>

              <p style={estilo.infoDaftar}>
                {daftarTampil.length} asesmen ditampilkan
              </p>
            </div>
          </div>

          {daftarTampil.length === 0 ? (
            <EmptyState
              adaData={daftar.length > 0}
              onReset={() => {
                setKataKunci("");
                setFilterStatus("SEMUA");
              }}
              onBuat={() => router.push("/guru/asesmen/baru")}
            />
          ) : (
            <div style={estilo.grid}>
              {daftarTampil.map((a) => (
                <KartuAsesmen
                  key={a.id}
                  a={a}
                  onKlik={() => router.push(`/guru/asesmen/${a.id}`)}
                  onHapus={() => setAsesmenDiHapus(a)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* =====================================================
          MODAL KONFIRMASI HAPUS
      ====================================================== */}

      {asesmenDiHapus && (
        <div style={estilo.modalOverlay}>
          <div style={estilo.modalContainer}>
            <div style={estilo.modalIcon}>🗑️</div>
            <h3 style={estilo.modalJudul}>Hapus Asesmen</h3>
            <p style={estilo.modalTeks}>
              Apakah Anda yakin ingin menghapus asesmen{" "}
              <strong>"{asesmenDiHapus.judul}"</strong>? Tindakan ini tidak
              dapat dibatalkan.
            </p>
            <div style={estilo.modalAksi}>
              <button
                type="button"
                onClick={() => setAsesmenDiHapus(null)}
                disabled={sedangMenghapus}
                style={estilo.tombolBatal}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={tanganiHapus}
                disabled={sedangMenghapus}
                style={estilo.tombolKonfirmasiHapus}
              >
                {sedangMenghapus ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon,
  label,
  nilai,
  warna,
}: {
  icon: string;
  label: string;
  nilai: number;
  warna: "blue" | "orange" | "green";
}) {
  const konfigurasi = {
    blue: {
      background: WARNA.primarySoft,
      iconColor: WARNA.primary,
    },

    orange: {
      background: WARNA.orangeSoft,
      iconColor: WARNA.orange,
    },

    green: {
      background: WARNA.greenSoft,
      iconColor: WARNA.green,
    },
  };

  const config = konfigurasi[warna];

  return (
    <div style={estilo.statCard}>
      <div
        style={{
          ...estilo.statIcon,
          backgroundColor: config.background,
          color: config.iconColor,
        }}
      >
        {icon}
      </div>

      <div style={estilo.statContent}>
        <span style={estilo.statLabel}>{label}</span>

        <strong style={estilo.statValue}>{nilai}</strong>
      </div>
    </div>
  );
}

/* ============================================================
   FILTER BUTTON
============================================================ */

function FilterButton({
  aktif,
  onClick,
  children,
}: {
  aktif: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        ...estilo.filterButton,
        ...(aktif ? estilo.filterButtonAktif : {}),
      }}
    >
      {children}
    </button>
  );
}

/* ============================================================
   KARTU ASESMEN
============================================================ */

function KartuAsesmen({
  a,
  onKlik,
  onHapus,
}: {
  a: AsesmenRingkas;
  onKlik: () => void;
  onHapus: () => void;
}) {
  const adalahKuis = a.tipe === "KUIS";

  return (
    <div style={estilo.kartuWrapper}>
      <button onClick={onKlik} type="button" style={estilo.kartu}>
        {/* Garis warna di atas kartu */}
        <div
          style={{
            ...estilo.garisKartu,
            backgroundColor: adalahKuis ? WARNA.primary : "#70c1c4",
          }}
        />

        {/* Header */}
        <div style={estilo.kartuHeader}>
          <div
            style={{
              ...estilo.iconAsesmen,
              backgroundColor: adalahKuis ? WARNA.primarySoft : "#e8f8f7",
            }}
          >
            {adalahKuis ? "📝" : "📋"}
          </div>

          <span
            style={{
              ...estilo.badgeTipe,
              color: adalahKuis ? WARNA.primary : "#378b8e",
              backgroundColor: adalahKuis ? WARNA.primarySoft : "#e8f8f7",
            }}
          >
            {adalahKuis ? "Kuis" : "Ujian Online"}
          </span>

          <span
            style={{
              ...estilo.statusDot,
              backgroundColor:
                a.status === "PROSES" ? WARNA.orange : WARNA.green,
            }}
          />
        </div>

        {/* Judul */}
        <div style={estilo.kartuBody}>
          <h3 style={estilo.judulKartu}>{a.judul}</h3>

          <p style={estilo.mapelKartu}>{a.mapel}</p>
        </div>

        {/* Informasi */}
        <div style={estilo.infoKartu}>
          <div style={estilo.infoItem}>
            <span style={estilo.infoIcon}>❓</span>

            <div>
              <span style={estilo.infoLabel}>Soal</span>

              <strong style={estilo.infoValue}>{a.jumlahSoal}</strong>
            </div>
          </div>

          <div style={estilo.pemisah} />

          <div style={estilo.infoItem}>
            <span style={estilo.infoIcon}>👥</span>

            <div>
              <span style={estilo.infoLabel}>Kelas</span>

              <strong style={estilo.infoValue}>{a.jumlahKelasTujuan}</strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={estilo.kartuFooter}>
          <span
            style={{
              ...estilo.statusText,
              color: a.status === "PROSES" ? WARNA.orange : WARNA.green,
            }}
          >
            <span
              style={{
                ...estilo.statusIndicator,
                backgroundColor:
                  a.status === "PROSES" ? WARNA.orange : WARNA.green,
              }}
            />

            {a.status === "PROSES" ? "Sedang dibuat" : "Sudah selesai"}
          </span>

          <span style={estilo.panah}>→</span>
        </div>
      </button>

      {/* Tombol Hapus */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onHapus();
        }}
        title="Hapus Asesmen"
        style={estilo.tombolHapusKartu}
      >
        🗑️
      </button>
    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
  adaData,
  onReset,
  onBuat,
}: {
  adaData: boolean;
  onReset: () => void;
  onBuat: () => void;
}) {
  return (
    <div style={estilo.emptyState}>
      <div style={estilo.emptyIcon}>{adaData ? "🔍" : "📝"}</div>

      <h3 style={estilo.emptyTitle}>
        {adaData ? "Asesmen tidak ditemukan" : "Belum ada asesmen"}
      </h3>

      <p style={estilo.emptyText}>
        {adaData
          ? "Coba ubah kata pencarian atau filter yang digunakan."
          : "Buat kuis atau ujian online pertama untuk kelasmu."}
      </p>

      {adaData ? (
        <button onClick={onReset} style={estilo.emptyButton} type="button">
          Reset Filter
        </button>
      ) : (
        <button onClick={onBuat} style={estilo.emptyButton} type="button">
          + Buat Asesmen
        </button>
      )}
    </div>
  );
}

/* ============================================================
   STYLE
============================================================ */

const estilo = {
  halaman: {
    minHeight: "100vh",
    padding: "28px",
    backgroundColor: WARNA.background,
    boxSizing: "border-box" as const,
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px",
  },

  labelHalaman: {
    fontSize: "11px",
    fontWeight: 800,
    color: WARNA.primary,
    letterSpacing: "0.08em",
    marginBottom: "5px",
  },

  judulHalaman: {
    margin: 0,
    fontSize: "27px",
    lineHeight: 1.2,
    fontWeight: 800,
    color: WARNA.text,
    letterSpacing: "-0.03em",
  },

  subjudul: {
    margin: "6px 0 0",
    fontSize: "13px",
    color: WARNA.textSecondary,
  },

  tombolBuat: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    border: "none",
    borderRadius: "9px",
    padding: "10px 15px",
    backgroundColor: WARNA.primary,
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(33, 150, 243, 0.18)",
  },

  iconPlus: {
    fontSize: "18px",
    lineHeight: 1,
    fontWeight: 400,
  },

  // ==========================================================
  // STATISTIK
  // ==========================================================

  statistik: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "22px",
  },

  statCard: {
    backgroundColor: WARNA.white,
    border: `1px solid ${WARNA.border}`,
    borderRadius: "13px",
    padding: "15px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
  },

  statIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    flexShrink: 0,
  },

  statContent: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },

  statLabel: {
    fontSize: "11px",
    color: WARNA.textSecondary,
    fontWeight: 600,
  },

  statValue: {
    fontSize: "21px",
    color: WARNA.text,
    fontWeight: 800,
  },

  // ==========================================================
  // TOOLBAR
  // ==========================================================

  toolbar: {
    backgroundColor: WARNA.white,
    border: `1px solid ${WARNA.border}`,
    borderRadius: "12px",
    padding: "11px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "22px",
  },

  searchWrapper: {
    flex: 1,
    maxWidth: "500px",
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
  },

  searchIcon: {
    position: "absolute" as const,
    left: "12px",
    fontSize: "13px",
    pointerEvents: "none" as const,
  },

  searchInput: {
    width: "100%",
    height: "38px",
    boxSizing: "border-box" as const,
    border: `1px solid ${WARNA.border}`,
    borderRadius: "8px",
    outline: "none",
    padding: "0 38px",
    fontSize: "12px",
    color: WARNA.text,
    backgroundColor: "#fafbfc",
  },

  tombolClear: {
    position: "absolute" as const,
    right: "8px",
    width: "25px",
    height: "25px",
    border: "none",
    borderRadius: "50%",
    backgroundColor: "#eef0f3",
    color: WARNA.textSecondary,
    cursor: "pointer",
    fontSize: "10px",
  },

  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    backgroundColor: "#f3f5f8",
    borderRadius: "8px",
    padding: "3px",
  },

  filterButton: {
    border: "none",
    backgroundColor: "transparent",
    color: WARNA.textSecondary,
    borderRadius: "6px",
    padding: "7px 12px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  filterButtonAktif: {
    backgroundColor: WARNA.white,
    color: WARNA.primary,
    boxShadow: "0 1px 4px rgba(15, 23, 42, 0.08)",
  },

  // ==========================================================
  // DAFTAR
  // ==========================================================

  headerDaftar: {
    marginBottom: "13px",
  },

  judulDaftar: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 800,
    color: WARNA.text,
  },

  infoDaftar: {
    margin: "3px 0 0",
    fontSize: "11px",
    color: WARNA.textMuted,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
    gap: "15px",
  },

  // ==========================================================
  // KARTU
  // ==========================================================

  kartuWrapper: {
    position: "relative" as const,
  },

  kartu: {
    position: "relative" as const,
    overflow: "hidden",
    width: "100%",
    minWidth: 0,
    textAlign: "left" as const,
    border: `1px solid ${WARNA.border}`,
    borderRadius: "14px",
    backgroundColor: WARNA.white,
    padding: "17px",
    paddingRight: "42px",
    cursor: "pointer",
    boxSizing: "border-box" as const,
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.035)",
    transition:
      "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
  },

  tombolHapusKartu: {
    position: "absolute" as const,
    top: "14px",
    right: "12px",
    zIndex: 2,
    border: "none",
    backgroundColor: "transparent",
    borderRadius: "6px",
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "13px",
    opacity: 0.7,
    transition: "opacity 0.2s, background-color 0.2s",
  },

  garisKartu: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    height: "3px",
  },

  kartuHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "15px",
  },

  iconAsesmen: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
  },

  badgeTipe: {
    fontSize: "10px",
    fontWeight: 800,
    padding: "5px 8px",
    borderRadius: "999px",
  },

  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    marginLeft: "auto",
  },

  kartuBody: {
    marginBottom: "15px",
  },

  judulKartu: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.4,
    fontWeight: 800,
    color: WARNA.text,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
  },

  mapelKartu: {
    margin: "5px 0 0",
    fontSize: "12px",
    color: WARNA.textSecondary,
    fontWeight: 500,
  },

  infoKartu: {
    display: "flex",
    alignItems: "center",
    padding: "10px",
    borderRadius: "9px",
    backgroundColor: "#f7f9fc",
    marginBottom: "13px",
  },

  infoItem: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "7px",
  },

  infoIcon: {
    fontSize: "12px",
  },

  infoLabel: {
    display: "block",
    fontSize: "9px",
    color: WARNA.textMuted,
    marginBottom: "1px",
  },

  infoValue: {
    display: "block",
    fontSize: "12px",
    color: WARNA.text,
    fontWeight: 800,
  },

  pemisah: {
    width: "1px",
    height: "25px",
    backgroundColor: WARNA.border,
    margin: "0 8px",
  },

  kartuFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statusText: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "10px",
    fontWeight: 700,
  },

  statusIndicator: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },

  panah: {
    color: WARNA.primary,
    fontSize: "18px",
    fontWeight: 500,
  },

  // ==========================================================
  // LOADING
  // ==========================================================

  loading: {
    minHeight: "250px",
    backgroundColor: WARNA.white,
    border: `1px solid ${WARNA.border}`,
    borderRadius: "13px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    color: WARNA.textSecondary,
    fontSize: "12px",
  },

  loadingIcon: {
    fontSize: "25px",
    marginBottom: "8px",
    color: WARNA.primary,
  },

  // ==========================================================
  // EMPTY
  // ==========================================================

  emptyState: {
    minHeight: "280px",
    backgroundColor: WARNA.white,
    border: `1px dashed #d7dce3`,
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
    padding: "30px",
    boxSizing: "border-box" as const,
  },

  emptyIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "14px",
    backgroundColor: WARNA.primarySoft,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
    marginBottom: "12px",
  },

  emptyTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 800,
    color: WARNA.text,
  },

  emptyText: {
    maxWidth: "360px",
    margin: "6px 0 15px",
    fontSize: "12px",
    lineHeight: 1.5,
    color: WARNA.textSecondary,
  },

  emptyButton: {
    border: "none",
    borderRadius: "8px",
    padding: "9px 14px",
    backgroundColor: WARNA.primary,
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  // ==========================================================
  // MODAL
  // ==========================================================

  modalOverlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(17, 24, 39, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    padding: "20px",
  },

  modalContainer: {
    backgroundColor: WARNA.white,
    borderRadius: "16px",
    padding: "24px",
    maxWidth: "400px",
    width: "100%",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    textAlign: "center" as const,
  },

  modalIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: WARNA.redSoft,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    margin: "0 auto 14px",
  },

  modalJudul: {
    margin: "0 0 8px",
    fontSize: "17px",
    fontWeight: 800,
    color: WARNA.text,
  },

  modalTeks: {
    margin: "0 0 20px",
    fontSize: "13px",
    color: WARNA.textSecondary,
    lineHeight: 1.5,
  },

  modalAksi: {
    display: "flex",
    gap: "10px",
  },

  tombolBatal: {
    flex: 1,
    padding: "10px",
    border: `1px solid ${WARNA.border}`,
    borderRadius: "8px",
    backgroundColor: WARNA.white,
    color: WARNA.text,
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  tombolKonfirmasiHapus: {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: WARNA.red,
    color: WARNA.white,
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
};