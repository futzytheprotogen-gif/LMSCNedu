"use client";

import { useEffect, useState, useCallback } from "react";

const WARNA = {
  primary: "#2196f3",
  primaryDark: "#1976d2",
  primarySoft: "#e8f3fe",

  text: "#111827",
  textSecondary: "#64748b",
  muted: "#94a3b8",

  background: "#f7f9fc",
  white: "#ffffff",
  border: "#e5e7eb",

  warning: "#f59e0b",
  warningSoft: "#fff7e6",

  danger: "#ef4444",
  dangerDark: "#dc2626",
  dangerSoft: "#fee2e2",

  success: "#16a34a",
  successSoft: "#dcfce7",

  purple: "#7c3aed",
  purpleSoft: "#ede9fe",
};

interface Laporan {
  id: string;
  tipeAkun: "GURU" | "SISWA";
  namaPelapor: string;
  email: string;
  nikNisInput: string;
  alasan: string;
  status: "MENUNGGU" | "DITERIMA" | "DITOLAK" | "SELESAI";
  createdAt: string;
}

const LABEL_STATUS: Record<Laporan["status"], string> = {
  MENUNGGU: "Menunggu",
  DITERIMA: "OTP Terkirim",
  DITOLAK: "Ditolak",
  SELESAI: "Selesai",
};

export default function HalamanLaporan() {
  const [daftarLaporan, setDaftarLaporan] = useState<Laporan[]>([]);
  const [sedangMuat, setSedangMuat] = useState(true);
  const [sedangProsesId, setSedangProsesId] = useState<string | null>(null);

  const [pencarian, setPencarian] = useState("");
  const [filterStatus, setFilterStatus] = useState<"SEMUA" | Laporan["status"]>(
    "SEMUA"
  );

  const muatLaporan = useCallback(async () => {
    try {
      setSedangMuat(true);

      const response = await fetch("/api/lupa-password", {
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok) {
        setDaftarLaporan(data.data ?? []);
      }
    } catch (error) {
      console.error("Gagal memuat laporan:", error);
    } finally {
      setSedangMuat(false);
    }
  }, []);

  useEffect(() => {
    muatLaporan();
  }, [muatLaporan]);

  async function kirimOtp(id: string) {
    setSedangProsesId(id);

    try {
      await fetch(`/api/lupa-password/${id}/kirim-otp`, {
        method: "POST",
      });

      await muatLaporan();
    } catch (error) {
      console.error(error);
    } finally {
      setSedangProsesId(null);
    }
  }

  async function tolakLaporan(id: string) {
    if (!confirm("Tolak dan hapus laporan ini?")) return;

    setSedangProsesId(id);

    try {
      await fetch(`/api/lupa-password/${id}/tolak`, {
        method: "POST",
      });

      await muatLaporan();
    } catch (error) {
      console.error(error);
    } finally {
      setSedangProsesId(null);
    }
  }

  async function selesaikanLaporan(id: string) {
    if (
      !confirm(
        "Tandai laporan ini selesai?\n\nLaporan akan dihapus dari daftar."
      )
    ) {
      return;
    }

    setSedangProsesId(id);

    try {
      await fetch(`/api/lupa-password/${id}/selesai`, {
        method: "POST",
      });

      await muatLaporan();
    } catch (error) {
      console.error(error);
    } finally {
      setSedangProsesId(null);
    }
  }

  // =========================
  // STATISTIK
  // =========================

  const jumlahMenunggu = daftarLaporan.filter(
    (l) => l.status === "MENUNGGU"
  ).length;

  const jumlahDiterima = daftarLaporan.filter(
    (l) => l.status === "DITERIMA"
  ).length;

  const jumlahSiswa = daftarLaporan.filter(
    (l) => l.tipeAkun === "SISWA"
  ).length;

  const jumlahGuru = daftarLaporan.filter(
    (l) => l.tipeAkun === "GURU"
  ).length;

  // =========================
  // FILTER
  // =========================

  const laporanTampil = daftarLaporan.filter((laporan) => {
    const cocokStatus =
      filterStatus === "SEMUA" || laporan.status === filterStatus;

    const teks = pencarian.toLowerCase();

    const cocokPencarian =
      laporan.namaPelapor.toLowerCase().includes(teks) ||
      laporan.email.toLowerCase().includes(teks) ||
      laporan.nikNisInput.toLowerCase().includes(teks) ||
      laporan.alasan.toLowerCase().includes(teks);

    return cocokStatus && cocokPencarian;
  });

  return (
    <div style={estilo.halaman}>
      {/* =====================================
          HEADER
      ====================================== */}
      <div style={estilo.headerHalaman}>
        <div>
          <div style={estilo.breadcrumb}>ADMIN / LAPORAN</div>

          <h1 style={estilo.judulHalaman}>Laporan Lupa Password</h1>

          <p style={estilo.subjudul}>
            Kelola permintaan bantuan akun dari guru dan siswa.
          </p>
        </div>

        <button
          onClick={muatLaporan}
          disabled={sedangMuat}
          style={estilo.tombolRefresh}
        >
          <span style={estilo.iconRefresh}>↻</span>
          {sedangMuat ? "Memuat..." : "Refresh"}
        </button>
      </div>

      {/* =====================================
          STATISTIK
      ====================================== */}
      <div style={estilo.statistikGrid}>
        <div style={estilo.kartuStat}>
          <div
            style={{
              ...estilo.iconStat,
              backgroundColor: WARNA.primarySoft,
            }}
          >
            📋
          </div>

          <div>
            <span style={estilo.labelStat}>Total Laporan</span>
            <strong style={estilo.nilaiStat}>{daftarLaporan.length}</strong>
          </div>
        </div>

        <div
          style={{
            ...estilo.kartuStat,
            borderColor:
              jumlahMenunggu > 0 ? "#fcd34d" : WARNA.border,
          }}
        >
          <div
            style={{
              ...estilo.iconStat,
              backgroundColor: WARNA.warningSoft,
            }}
          >
            🔔
          </div>

          <div>
            <span style={estilo.labelStat}>Menunggu</span>

            <div style={estilo.barisNilai}>
              <strong style={estilo.nilaiStat}>{jumlahMenunggu}</strong>

              {jumlahMenunggu > 0 && (
                <span style={estilo.badgeBaru}>BARU</span>
              )}
            </div>
          </div>
        </div>

        <div style={estilo.kartuStat}>
          <div
            style={{
              ...estilo.iconStat,
              backgroundColor: WARNA.primarySoft,
            }}
          >
            👨‍🎓
          </div>

          <div>
            <span style={estilo.labelStat}>Laporan Siswa</span>
            <strong style={estilo.nilaiStat}>{jumlahSiswa}</strong>
          </div>
        </div>

        <div style={estilo.kartuStat}>
          <div
            style={{
              ...estilo.iconStat,
              backgroundColor: WARNA.purpleSoft,
            }}
          >
            👨‍🏫
          </div>

          <div>
            <span style={estilo.labelStat}>Laporan Guru</span>
            <strong style={estilo.nilaiStat}>{jumlahGuru}</strong>
          </div>
        </div>
      </div>

      {/* =====================================
          AREA LAPORAN
      ====================================== */}
      <div style={estilo.panel}>
        {/* PANEL HEADER */}
        <div style={estilo.panelHeader}>
          <div>
            <h2 style={estilo.judulPanel}>Daftar Laporan</h2>

            <p style={estilo.deskripsiPanel}>
              Permintaan pemulihan password yang masuk ke sistem.
            </p>
          </div>

          <div style={estilo.totalBadge}>
            {laporanTampil.length} laporan
          </div>
        </div>

        {/* SEARCH + FILTER */}
        <div style={estilo.toolbar}>
          <div style={estilo.searchWrapper}>
            <span style={estilo.iconSearch}>⌕</span>

            <input
              type="text"
              value={pencarian}
              onChange={(e) => setPencarian(e.target.value)}
              placeholder="Cari nama, email, NIS/NIK..."
              style={estilo.inputSearch}
            />
          </div>

          <div style={estilo.filterWrapper}>
            <button
              onClick={() => setFilterStatus("SEMUA")}
              style={{
                ...estilo.filterButton,
                ...(filterStatus === "SEMUA"
                  ? estilo.filterAktif
                  : {}),
              }}
            >
              Semua
            </button>

            <button
              onClick={() => setFilterStatus("MENUNGGU")}
              style={{
                ...estilo.filterButton,
                ...(filterStatus === "MENUNGGU"
                  ? estilo.filterAktif
                  : {}),
              }}
            >
              Menunggu
              {jumlahMenunggu > 0 && (
                <span style={estilo.filterBadge}>{jumlahMenunggu}</span>
              )}
            </button>

            <button
              onClick={() => setFilterStatus("DITERIMA")}
              style={{
                ...estilo.filterButton,
                ...(filterStatus === "DITERIMA"
                  ? estilo.filterAktif
                  : {}),
              }}
            >
              Diterima
            </button>

            <button
              onClick={() => setFilterStatus("DITOLAK")}
              style={{
                ...estilo.filterButton,
                ...(filterStatus === "DITOLAK"
                  ? estilo.filterAktif
                  : {}),
              }}
            >
              Ditolak
            </button>

            <button
              onClick={() => setFilterStatus("SELESAI")}
              style={{
                ...estilo.filterButton,
                ...(filterStatus === "SELESAI"
                  ? estilo.filterAktif
                  : {}),
              }}
            >
              Selesai
            </button>
          </div>
        </div>

        {/* =====================================
            LOADING
        ====================================== */}
        {sedangMuat && (
          <div style={estilo.loadingBox}>
            <div style={estilo.spinner} />
            <p>Memuat laporan...</p>
          </div>
        )}

        {/* =====================================
            EMPTY
        ====================================== */}
        {!sedangMuat && laporanTampil.length === 0 && (
          <div style={estilo.emptyBox}>
            <div style={estilo.emptyIcon}>✓</div>

            <h3 style={estilo.emptyTitle}>
              {daftarLaporan.length === 0
                ? "Belum ada laporan"
                : "Laporan tidak ditemukan"}
            </h3>

            <p style={estilo.emptyText}>
              {daftarLaporan.length === 0
                ? "Belum ada permintaan lupa password yang masuk."
                : "Coba ubah kata pencarian atau filter status."}
            </p>
          </div>
        )}

        {/* =====================================
            LIST LAPORAN
        ====================================== */}
        {!sedangMuat && laporanTampil.length > 0 && (
          <div style={estilo.daftar}>
            {laporanTampil.map((laporan) => {
              const statusStyle = gayaStatus(laporan.status);

              return (
                <div
                  key={laporan.id}
                  style={{
                    ...estilo.kartuLaporan,
                    borderLeft:
                      laporan.status === "MENUNGGU"
                        ? `4px solid ${WARNA.warning}`
                        : `4px solid ${statusStyle.color}`,
                  }}
                >
                  {/* HEADER KARTU */}
                  <div style={estilo.headerKartu}>
                    <div style={estilo.identitas}>
                      <div
                        style={{
                          ...estilo.avatar,
                          backgroundColor:
                            laporan.tipeAkun === "GURU"
                              ? WARNA.purpleSoft
                              : WARNA.primarySoft,
                          color:
                            laporan.tipeAkun === "GURU"
                              ? WARNA.purple
                              : WARNA.primary,
                        }}
                      >
                        {laporan.namaPelapor
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <div style={estilo.namaBaris}>
                          <strong style={estilo.namaPelapor}>
                            {laporan.namaPelapor}
                          </strong>

                          <span
                            style={{
                              ...estilo.badgeTipe,
                              color:
                                laporan.tipeAkun === "GURU"
                                  ? WARNA.purple
                                  : WARNA.primary,
                              backgroundColor:
                                laporan.tipeAkun === "GURU"
                                  ? WARNA.purpleSoft
                                  : WARNA.primarySoft,
                            }}
                          >
                            {laporan.tipeAkun === "GURU"
                              ? "Guru"
                              : "Siswa"}
                          </span>
                        </div>

                        <span style={estilo.waktu}>
                          {formatTanggal(laporan.createdAt)}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        ...estilo.badgeStatus,
                        backgroundColor: statusStyle.background,
                        color: statusStyle.color,
                      }}
                    >
                      <span
                        style={{
                          ...estilo.dotStatus,
                          backgroundColor: statusStyle.color,
                        }}
                      />
                      {LABEL_STATUS[laporan.status]}
                    </span>
                  </div>

                  {/* INFO */}
                  <div style={estilo.infoGrid}>
                    <div style={estilo.infoItem}>
                      <span style={estilo.infoLabel}>Email</span>
                      <span style={estilo.infoValue}>
                        {laporan.email}
                      </span>
                    </div>

                    <div style={estilo.infoItem}>
                      <span style={estilo.infoLabel}>
                        {laporan.tipeAkun === "SISWA" ? "NIS" : "NIK"}
                      </span>

                      <span style={estilo.infoValue}>
                        {laporan.nikNisInput}
                      </span>
                    </div>
                  </div>

                  {/* ALASAN */}
                  <div style={estilo.alasanBox}>
                    <span style={estilo.alasanLabel}>
                      Alasan laporan
                    </span>

                    <p style={estilo.alasan}>
                      {laporan.alasan || "Tidak ada alasan yang diberikan."}
                    </p>
                  </div>

                  {/* ACTION */}
                  {(laporan.status === "MENUNGGU" ||
                    laporan.status === "DITERIMA") && (
                    <div style={estilo.footerKartu}>
                      <span style={estilo.petunjuk}>
                        {laporan.status === "MENUNGGU"
                          ? "Perlu tindakan admin."
                          : "OTP sudah dikirim ke pengguna."}
                      </span>

                      <div style={estilo.aksi}>
                        {laporan.status === "MENUNGGU" && (
                          <>
                            <button
                              onClick={() => kirimOtp(laporan.id)}
                              disabled={
                                sedangProsesId === laporan.id
                              }
                              style={{
                                ...estilo.tombolPrimary,
                                opacity:
                                  sedangProsesId === laporan.id
                                    ? 0.6
                                    : 1,
                              }}
                            >
                              {sedangProsesId === laporan.id
                                ? "Memproses..."
                                : "✓ Terima & Kirim OTP"}
                            </button>

                            <button
                              onClick={() =>
                                tolakLaporan(laporan.id)
                              }
                              disabled={
                                sedangProsesId === laporan.id
                              }
                              style={estilo.tombolDangerOutline}
                            >
                              Tolak
                            </button>
                          </>
                        )}

                        {laporan.status === "DITERIMA" && (
                          <>
                            <button
                              onClick={() => kirimOtp(laporan.id)}
                              disabled={
                                sedangProsesId === laporan.id
                              }
                              style={estilo.tombolSecondary}
                            >
                              ↻ Kirim Ulang OTP
                            </button>

                            <button
                              onClick={() =>
                                selesaikanLaporan(laporan.id)
                              }
                              disabled={
                                sedangProsesId === laporan.id
                              }
                              style={estilo.tombolSuccess}
                            >
                              ✓ Selesai
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   STATUS STYLE
========================================================= */

function gayaStatus(status: Laporan["status"]) {
  switch (status) {
    case "MENUNGGU":
      return {
        background: WARNA.warningSoft,
        color: "#b45309",
      };

    case "DITERIMA":
      return {
        background: WARNA.primarySoft,
        color: WARNA.primaryDark,
      };

    case "DITOLAK":
      return {
        background: WARNA.dangerSoft,
        color: WARNA.dangerDark,
      };

    case "SELESAI":
      return {
        background: WARNA.successSoft,
        color: WARNA.success,
      };
  }
}

/* =========================================================
   FORMAT TANGGAL
========================================================= */

function formatTanggal(tanggal: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(tanggal));
  } catch {
    return tanggal;
  }
}

/* =========================================================
   STYLE
========================================================= */

const estilo = {
  halaman: {
    minHeight: "100vh",
    backgroundColor: WARNA.background,
    padding: "28px",
    boxSizing: "border-box" as const,
  },

  headerHalaman: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "24px",
  },

  breadcrumb: {
    fontSize: "11px",
    fontWeight: 700,
    color: WARNA.primary,
    letterSpacing: "0.08em",
    marginBottom: "7px",
  },

  judulHalaman: {
    margin: 0,
    fontSize: "27px",
    lineHeight: 1.2,
    fontWeight: 800,
    color: WARNA.text,
  },

  subjudul: {
    margin: "7px 0 0",
    fontSize: "14px",
    color: WARNA.textSecondary,
  },

  tombolRefresh: {
    border: `1px solid ${WARNA.border}`,
    backgroundColor: WARNA.white,
    color: WARNA.text,
    borderRadius: "9px",
    padding: "10px 15px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
  },

  iconRefresh: {
    fontSize: "18px",
    lineHeight: 1,
    color: WARNA.primary,
  },

  statistikGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
    marginBottom: "22px",
  },

  kartuStat: {
    backgroundColor: WARNA.white,
    border: `1px solid ${WARNA.border}`,
    borderRadius: "14px",
    padding: "17px",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    minHeight: "72px",
    boxSizing: "border-box" as const,
  },

  iconStat: {
    width: "43px",
    height: "43px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
    flexShrink: 0,
  },

  labelStat: {
    display: "block",
    color: WARNA.textSecondary,
    fontSize: "12px",
    marginBottom: "3px",
  },

  nilaiStat: {
    display: "block",
    color: WARNA.text,
    fontSize: "23px",
    lineHeight: 1,
    fontWeight: 800,
  },

  barisNilai: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
  },

  badgeBaru: {
    backgroundColor: WARNA.dangerSoft,
    color: WARNA.dangerDark,
    fontSize: "9px",
    fontWeight: 800,
    padding: "3px 6px",
    borderRadius: "999px",
  },

  panel: {
    backgroundColor: WARNA.white,
    border: `1px solid ${WARNA.border}`,
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 3px 12px rgba(15, 23, 42, 0.03)",
  },

  panelHeader: {
    padding: "20px 22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    borderBottom: `1px solid ${WARNA.border}`,
  },

  judulPanel: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 800,
    color: WARNA.text,
  },

  deskripsiPanel: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: WARNA.textSecondary,
  },

  totalBadge: {
    fontSize: "11px",
    fontWeight: 700,
    color: WARNA.primaryDark,
    backgroundColor: WARNA.primarySoft,
    borderRadius: "999px",
    padding: "6px 10px",
    whiteSpace: "nowrap" as const,
  },

  toolbar: {
    padding: "15px 22px",
    backgroundColor: "#fbfcfe",
    borderBottom: `1px solid ${WARNA.border}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap" as const,
  },

  searchWrapper: {
    width: "min(360px, 100%)",
    height: "39px",
    backgroundColor: WARNA.white,
    border: `1px solid ${WARNA.border}`,
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    padding: "0 11px",
    boxSizing: "border-box" as const,
  },

  iconSearch: {
    fontSize: "21px",
    color: WARNA.muted,
    marginRight: "7px",
    transform: "rotate(-20deg)",
  },

  inputSearch: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "13px",
    color: WARNA.text,
  },

  filterWrapper: {
    display: "flex",
    gap: "5px",
    flexWrap: "wrap" as const,
  },

  filterButton: {
    border: "1px solid transparent",
    backgroundColor: "transparent",
    color: WARNA.textSecondary,
    borderRadius: "8px",
    padding: "7px 10px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },

  filterAktif: {
    backgroundColor: WARNA.primarySoft,
    color: WARNA.primaryDark,
    borderColor: "#cce5fc",
  },

  filterBadge: {
    backgroundColor: WARNA.danger,
    color: WARNA.white,
    minWidth: "16px",
    height: "16px",
    borderRadius: "999px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "9px",
  },

  daftar: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    padding: "18px 22px 22px",
  },

  kartuLaporan: {
    border: `1px solid ${WARNA.border}`,
    borderRadius: "13px",
    padding: "17px 18px",
    backgroundColor: WARNA.white,
    boxSizing: "border-box" as const,
  },

  headerKartu: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
  },

  identitas: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: 800,
    flexShrink: 0,
  },

  namaBaris: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    flexWrap: "wrap" as const,
  },

  namaPelapor: {
    fontSize: "14px",
    fontWeight: 800,
    color: WARNA.text,
  },

  badgeTipe: {
    fontSize: "9px",
    fontWeight: 800,
    padding: "4px 7px",
    borderRadius: "999px",
  },

  waktu: {
    display: "block",
    fontSize: "11px",
    color: WARNA.muted,
    marginTop: "3px",
  },

  badgeStatus: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 9px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 800,
    whiteSpace: "nowrap" as const,
  },

  dotStatus: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "9px",
    marginTop: "15px",
  },

  infoItem: {
    backgroundColor: "#f8fafc",
    borderRadius: "9px",
    padding: "9px 11px",
  },

  infoLabel: {
    display: "block",
    fontSize: "9px",
    fontWeight: 700,
    color: WARNA.muted,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    marginBottom: "3px",
  },

  infoValue: {
    display: "block",
    fontSize: "12px",
    color: WARNA.text,
    fontWeight: 600,
    wordBreak: "break-word" as const,
  },

  alasanBox: {
    marginTop: "10px",
    padding: "10px 12px",
    backgroundColor: "#f8fafc",
    borderRadius: "9px",
  },

  alasanLabel: {
    display: "block",
    fontSize: "10px",
    fontWeight: 700,
    color: WARNA.textSecondary,
    marginBottom: "4px",
  },

  alasan: {
    margin: 0,
    color: "#374151",
    fontSize: "12px",
    lineHeight: 1.55,
  },

  footerKartu: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginTop: "14px",
    paddingTop: "13px",
    borderTop: `1px solid #f1f5f9`,
    flexWrap: "wrap" as const,
  },

  petunjuk: {
    fontSize: "11px",
    color: WARNA.muted,
  },

  aksi: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap" as const,
  },

  tombolPrimary: {
    border: "none",
    backgroundColor: WARNA.primary,
    color: WARNA.white,
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },

  tombolSecondary: {
    border: `1px solid #bfdbfe`,
    backgroundColor: WARNA.primarySoft,
    color: WARNA.primaryDark,
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },

  tombolDangerOutline: {
    border: `1px solid #fecaca`,
    backgroundColor: WARNA.white,
    color: WARNA.dangerDark,
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },

  tombolSuccess: {
    border: `1px solid #bbf7d0`,
    backgroundColor: WARNA.successSoft,
    color: WARNA.success,
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },

  loadingBox: {
    minHeight: "280px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    color: WARNA.textSecondary,
    fontSize: "13px",
  },

  spinner: {
    width: "28px",
    height: "28px",
    border: "3px solid #dbeafe",
    borderTop: `3px solid ${WARNA.primary}`,
    borderRadius: "50%",
    marginBottom: "10px",
  },

  emptyBox: {
    minHeight: "300px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
    padding: "30px",
  },

  emptyIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "50%",
    backgroundColor: WARNA.successSoft,
    color: WARNA.success,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: 800,
    marginBottom: "12px",
  },

  emptyTitle: {
    margin: 0,
    color: WARNA.text,
    fontSize: "16px",
    fontWeight: 800,
  },

  emptyText: {
    margin: "6px 0 0",
    color: WARNA.muted,
    fontSize: "12px",
  },
};