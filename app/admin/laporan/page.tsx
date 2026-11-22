"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAppConfirm } from "@/components/ConfirmDialogProvider";

const WARNA = {
  primary: "var(--cn-primary)",
  primaryDark: "var(--cn-primary)",
  primarySoft: "var(--cn-tint)",

  text: "var(--cn-coral-dark)",
  textSecondary: "var(--cn-coral)",
  muted: "var(--cn-coral)",

  background: "var(--cn-tint)",
  white: "var(--cn-surface)",
  border: "var(--cn-line)",

  warning: "var(--cn-coral)",
  warningSoft: "var(--cn-coral-tint)",

  danger: "var(--cn-danger)",
  dangerDark: "var(--cn-danger)",
  dangerSoft: "var(--cn-danger-tint)",

  success: "var(--cn-success)",
  successSoft: "var(--cn-success-tint)",

  purple: "var(--cn-coral)",
  purpleSoft: "var(--cn-tint)",
};

interface Laporan {
  id: string;
  tipeAkun: "GURU" | "SISWA";
  namaPelapor: string;
  email: string;
  nikNisInput: string;
  alasan: string;
  status: "DITERIMA" | "DITOLAK" | "SELESAI";
  bisaOtpManual?: boolean;
  createdAt: string;
}

const LABEL_STATUS: Record<Laporan["status"], string> = {
  DITERIMA: "Diterima",
  DITOLAK: "Ditolak",
  SELESAI: "Selesai",
};

export default function HalamanLaporan() {
  const konfirmasi = useAppConfirm();
  const [daftarLaporan, setDaftarLaporan] = useState<Laporan[]>([]);
  const [sedangMuat, setSedangMuat] = useState(true);
  const [sedangProsesId, setSedangProsesId] = useState<string | null>(null);
  const [pesanAksi, setPesanAksi] = useState<{
    id: string;
    pesan: string;
    error: boolean;
  } | null>(null);

  const [pencarian, setPencarian] = useState("");
  const [filterStatus, setFilterStatus] = useState<"SEMUA" | Laporan["status"]>(
    "SEMUA"
  );
  const filterWrapperRef = useRef<HTMLDivElement | null>(null);
  const filterButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [filterIndicator, setFilterIndicator] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);

  const filterOrder: Array<"SEMUA" | Laporan["status"]> = [
    "SEMUA",
    "DITERIMA",
    "DITOLAK",
    "SELESAI",
  ];

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
    const timer = window.setTimeout(() => {
      void muatLaporan();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [muatLaporan]);

  async function kirimOtp(id: string) {
    setSedangProsesId(id);
    setPesanAksi(null);

    try {
      const response = await fetch(`/api/lupa-password/${id}/kirim-otp`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.pesan ?? "Gagal mengirim OTP.");

      setPesanAksi({ id, pesan: data.pesan, error: false });
      await muatLaporan();
    } catch (error) {
      console.error(error);
      setPesanAksi({
        id,
        pesan: error instanceof Error ? error.message : "Gagal mengirim OTP.",
        error: true,
      });
    } finally {
      setSedangProsesId(null);
    }
  }

  async function buatOtpManual(id: string) {
    setSedangProsesId(id);
    setPesanAksi(null);

    try {
      const response = await fetch(`/api/lupa-password/${id}/kirim-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "MANUAL" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.pesan ?? "Gagal membuat OTP.");

      setPesanAksi({ id, pesan: data.pesan, error: false });
      await muatLaporan();
    } catch (error) {
      console.error(error);
      setPesanAksi({
        id,
        pesan: error instanceof Error ? error.message : "Gagal membuat OTP.",
        error: true,
      });
    } finally {
      setSedangProsesId(null);
    }
  }

  async function tolakLaporan(id: string) {
    if (!(await konfirmasi({
      title: "Tolak laporan ini?",
      message: "Laporan akan ditandai Ditolak dan tetap tersimpan dalam riwayat.",
      confirmLabel: "Tolak laporan",
    }))) return;

    setSedangProsesId(id);
    setPesanAksi(null);

    try {
      const response = await fetch(`/api/lupa-password/${id}/tolak`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.pesan ?? "Gagal menolak laporan.");

      setPesanAksi({ id, pesan: data.pesan, error: false });
      await muatLaporan();
    } catch (error) {
      console.error(error);
      setPesanAksi({
        id,
        pesan: error instanceof Error ? error.message : "Gagal menolak laporan.",
        error: true,
      });
    } finally {
      setSedangProsesId(null);
    }
  }

  async function selesaikanLaporan(id: string) {
    if (!(await konfirmasi({
      title: "Selesaikan laporan?",
      message: "Laporan akan ditandai Selesai dan tetap tersimpan dalam riwayat.",
      confirmLabel: "Tandai selesai",
      tone: "primary",
    }))) {
      return;
    }

    setSedangProsesId(id);
    setPesanAksi(null);

    try {
      const response = await fetch(`/api/lupa-password/${id}/selesai`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.pesan ?? "Gagal menyelesaikan laporan.");

      setPesanAksi({ id, pesan: data.pesan, error: false });
      await muatLaporan();
    } catch (error) {
      console.error(error);
      setPesanAksi({
        id,
        pesan: error instanceof Error ? error.message : "Gagal menyelesaikan laporan.",
        error: true,
      });
    } finally {
      setSedangProsesId(null);
    }
  }

  // =========================
  // STATISTIK
  // =========================

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

  const daftarRiwayat = daftarLaporan.filter(
    (laporan) => laporan.status === "DITOLAK" || laporan.status === "SELESAI"
  );
  const semuaRiwayatDipilih =
    daftarRiwayat.length > 0 &&
    daftarRiwayat.every((laporan) => selectedHistoryIds.includes(laporan.id));

  function togglePilihanRiwayat(id: string) {
    setSelectedHistoryIds((ids) =>
      ids.includes(id) ? ids.filter((selectedId) => selectedId !== id) : [...ids, id]
    );
  }

  function toggleSemuaRiwayat() {
    setSelectedHistoryIds(() =>
      semuaRiwayatDipilih ? [] : daftarRiwayat.map((laporan) => laporan.id)
    );
  }

  async function hapusRiwayat(ids: string[], semua = false) {
    if (semua) {
      if (
        !(await konfirmasi({
          title: "Hapus semua riwayat?",
          message: "Riwayat berstatus Ditolak dan Selesai akan dihapus permanen.",
          confirmLabel: "Hapus semua",
          tone: "danger",
        }))
      ) return;
    } else if (
      !(await konfirmasi({
        title: "Hapus riwayat pilihan?",
        message: `${ids.length} riwayat akan dihapus permanen.`,
        confirmLabel: "Hapus riwayat",
        tone: "danger",
      }))
    ) return;

    setPesanAksi(null);
    try {
      const response = await fetch("/api/lupa-password", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(semua ? { semua: true } : { ids }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.pesan ?? "Gagal menghapus riwayat.");

      setSelectedHistoryIds([]);
      setPesanAksi({ id: "riwayat", pesan: data.pesan, error: false });
      await muatLaporan();
    } catch (error) {
      setPesanAksi({
        id: "riwayat",
        pesan: error instanceof Error ? error.message : "Gagal menghapus riwayat.",
        error: true,
      });
    }
  }

  useEffect(() => {
    const activeKey = filterStatus;
    const activeButton = filterButtonRefs.current[activeKey];
    const wrapper = filterWrapperRef.current;

    if (!activeButton || !wrapper) return;

    const updateIndicator = () => {
      const wrapperRect = wrapper.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      setFilterIndicator({
        left: buttonRect.left - wrapperRect.left + wrapper.scrollLeft,
        width: buttonRect.width,
        opacity: 1,
      });
    };

    const frame = window.requestAnimationFrame(updateIndicator);
    window.addEventListener("resize", updateIndicator);
    wrapper.addEventListener("scroll", updateIndicator);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateIndicator);
      wrapper.removeEventListener("scroll", updateIndicator);
    };
  }, [filterStatus]);

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
          type="button"
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

          <div style={estilo.panelHeaderAksi}>
            {daftarRiwayat.length > 0 && (
              <>
                <label style={estilo.checkboxAllLabel}>
                  <input
                    type="checkbox"
                    checked={semuaRiwayatDipilih}
                    onChange={toggleSemuaRiwayat}
                  />
                  Pilih semua riwayat
                </label>
                {selectedHistoryIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void hapusRiwayat(selectedHistoryIds)}
                    style={estilo.tombolHapusPilihan}
                  >
                    Hapus {selectedHistoryIds.length}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void hapusRiwayat([], true)}
                  style={estilo.tombolHapusSemua}
                >
                  Hapus semua riwayat
                </button>
              </>
            )}
            <div style={estilo.totalBadge}>
              {laporanTampil.length} laporan
            </div>
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

          <div ref={filterWrapperRef} style={estilo.filterWrapper}>
            <div
              style={{
                ...estilo.filterIndicator,
                left: filterIndicator.left,
                width: filterIndicator.width,
                opacity: filterIndicator.opacity,
              }}
            />

            {filterOrder.map((status) => {
              const label =
                status === "SEMUA"
                  ? "Semua"
                  : status === "DITERIMA"
                    ? "Diterima"
                    : status === "DITOLAK"
                      ? "Ditolak"
                      : "Selesai";

              const isActive = filterStatus === status;

              return (
                <button
                  key={status}
                  ref={(node) => {
                    filterButtonRefs.current[status] = node;
                  }}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  aria-pressed={isActive}
                  style={{
                    ...estilo.filterButton,
                    ...(isActive ? estilo.filterAktif : {}),
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  {label}
                </button>
              );
            })}
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
                    borderLeft: `4px solid ${statusStyle.color}`,
                  }}
                >
                  {/* HEADER KARTU */}
                  <div style={estilo.headerKartu}>
                    {(laporan.status === "DITOLAK" || laporan.status === "SELESAI") && (
                      <label
                        title="Pilih riwayat laporan"
                        style={estilo.checkboxRiwayat}
                      >
                        <input
                          type="checkbox"
                          checked={selectedHistoryIds.includes(laporan.id)}
                          onChange={() => togglePilihanRiwayat(laporan.id)}
                        />
                      </label>
                    )}
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

                    <div style={estilo.aksiStatusKartu}>
                      {(laporan.status === "DITOLAK" || laporan.status === "SELESAI") && (
                        <button
                          type="button"
                          onClick={() => void hapusRiwayat([laporan.id])}
                          style={estilo.tombolHapusKartu}
                          title="Hapus riwayat satu laporan"
                        >
                          Hapus
                        </button>
                      )}
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
                        {LABEL_STATUS[laporan.status] ?? "Status tidak diketahui"}
                      </span>
                    </div>
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
                  {(laporan.status === "DITERIMA" ||
                    laporan.status === "DITOLAK") && (
                    <div style={estilo.footerKartu}>
                      <span style={estilo.petunjuk}>
                        {laporan.status === "DITOLAK"
                          ? "Email otomatis tidak terkirim. Buat OTP manual agar pemohon dapat melanjutkan."
                          : "OTP aktif. Pemohon dapat menggunakan kode dari email atau kode manual."}
                      </span>

                      <div style={estilo.aksi}>
                        {laporan.status === "DITERIMA" && (
                          <>
                            <button
                              type="button"
                              onClick={() => kirimOtp(laporan.id)}
                              disabled={
                                sedangProsesId === laporan.id
                              }
                              style={estilo.tombolSecondary}
                            >
                              ↻ Kirim Ulang OTP
                            </button>

                            {laporan.bisaOtpManual !== false && (
                              <button
                                type="button"
                                onClick={() => buatOtpManual(laporan.id)}
                                disabled={sedangProsesId === laporan.id}
                                style={estilo.tombolSecondary}
                              >
                                Buat OTP Manual
                              </button>
                            )}

                            <button
                              type="button"
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

                            <button
                              type="button"
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
                        {laporan.status === "DITOLAK" && laporan.bisaOtpManual !== false && (
                          <button
                            type="button"
                            onClick={() => buatOtpManual(laporan.id)}
                            disabled={sedangProsesId === laporan.id}
                            style={estilo.tombolPrimary}
                          >
                            Buat OTP Manual
                          </button>
                        )}
                      </div>
                      {pesanAksi?.id === laporan.id && (
                        <p
                          aria-live="polite"
                          style={{
                            ...estilo.pesanAksi,
                            color: pesanAksi.error ? WARNA.danger : WARNA.success,
                          }}
                        >
                          {pesanAksi.pesan}
                        </p>
                      )}
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

    default:
      return {
        background: WARNA.primarySoft,
        color: WARNA.primaryDark,
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
    backgroundColor: "transparent",
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
    boxShadow: "0 2px 6px rgba(var(--cn-navy-rgb), 0.04)",
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
    boxShadow: "0 3px 12px rgba(var(--cn-navy-rgb), 0.03)",
  },

  panelHeader: {
    padding: "20px 22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    borderBottom: `1px solid ${WARNA.border}`,
  },
  panelHeaderAksi: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap" as const,
    gap: "8px",
  },
  checkboxAllLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: WARNA.text,
    fontSize: "11px",
    fontWeight: 700,
  },
  checkboxRiwayat: {
    display: "inline-flex",
    alignSelf: "center",
    cursor: "pointer",
  },
  tombolHapusPilihan: {
    border: `1px solid ${WARNA.danger}`,
    borderRadius: "8px",
    padding: "8px 10px",
    color: WARNA.danger,
    backgroundColor: WARNA.dangerSoft,
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },
  tombolHapusSemua: {
    border: "none",
    borderRadius: "8px",
    padding: "8px 10px",
    color: WARNA.white,
    backgroundColor: WARNA.danger,
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
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
    backgroundColor: "var(--cn-tint)",
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
    position: "relative" as const,
    display: "flex",
    gap: "5px",
    flexWrap: "nowrap" as const,
    maxWidth: "100%",
    overflowX: "auto" as const,
    scrollbarWidth: "none" as const,
    padding: "2px",
    borderRadius: "10px",
    backgroundColor: "rgb(var(--cn-primary-rgb) / 4%)",
  },

  filterIndicator: {
    position: "absolute" as const,
    top: "2px",
    left: 0,
    height: "calc(100% - 4px)",
    borderRadius: "8px",
    backgroundColor: WARNA.primarySoft,
    boxShadow: "0 4px 10px rgb(var(--cn-primary-rgb) / 8%)",
    transition: "left 0.28s ease, width 0.28s ease, opacity 0.2s ease",
    zIndex: 1,
  },

  filterButton: {
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
    border: "none",
    backgroundColor: "transparent",
    color: WARNA.textSecondary,
    borderRadius: "8px",
    padding: "7px 10px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    lineHeight: 1.2,
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "all 0.2s ease",
    minWidth: "78px",
  },

  filterAktif: {
    color: WARNA.primaryDark,
    border: "none",
    backgroundColor: `${WARNA.primarySoft}`,
    boxShadow: "0 4px 10px rgb(var(--cn-primary-rgb) / 8%)",
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
    flex: 1,
  },
  aksiStatusKartu: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "7px",
  },
  tombolHapusKartu: {
    border: `1px solid ${WARNA.danger}`,
    borderRadius: "7px",
    padding: "6px 8px",
    color: WARNA.danger,
    backgroundColor: WARNA.dangerSoft,
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
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
    backgroundColor: "var(--cn-tint)",
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
    backgroundColor: "var(--cn-tint)",
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
    color: "var(--cn-coral-dark)",
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
    borderTop: `1px solid var(--cn-coral-tint)`,
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

  pesanAksi: {
    flexBasis: "100%",
    margin: "4px 0 0",
    fontSize: "12px",
    fontWeight: 600,
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
    border: `1px solid var(--cn-tint)`,
    backgroundColor: WARNA.primarySoft,
    color: WARNA.primaryDark,
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },

  tombolDangerOutline: {
    border: `1px solid var(--cn-danger-tint)`,
    backgroundColor: WARNA.white,
    color: WARNA.dangerDark,
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },

  tombolSuccess: {
    border: `1px solid var(--cn-success-tint)`,
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
    border: "3px solid var(--cn-tint)",
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