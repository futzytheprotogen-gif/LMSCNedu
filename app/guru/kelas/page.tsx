"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MonitoringCharts, { type DataGrafik } from "@/components/MonitoringCharts";

const WARNA = {
  primary: "var(--cn-primary)",
  primaryDark: "var(--cn-primary)",
  primarySoft: "var(--cn-tint)",
  text: "var(--cn-coral-dark)",
  secondary: "var(--cn-text)",
  muted: "var(--cn-muted)",
  border: "var(--cn-line)",
  background: "var(--cn-tint)",
  white: "var(--cn-surface)",
};

interface MapelRingkas {
  id: string;
  nama: string;
}

interface KelasGuruRingkas {
  id: string;
  judul: string;
  deskripsi: string | null;
  jumlahSiswa: number;
  mapel: MapelRingkas[];
}

interface TrenNilaiGuru {
  label: string;
  nilai: number | null;
  jumlah: number;
}

export default function HalamanKelasGuru() {
  const router = useRouter();

  const [daftarKelas, setDaftarKelas] = useState<KelasGuruRingkas[]>([]);
  const [sedangMuat, setSedangMuat] = useState(true);
  const [kataKunci, setKataKunci] = useState("");
  const [trenNilai, setTrenNilai] = useState<TrenNilaiGuru[]>([]);

  useEffect(() => {
    async function muatKelas() {
      try {
        const response = await fetch("/api/guru/kelas");
        const data = await response.json();

        if (response.ok) {
          setDaftarKelas(data.data ?? []);
        }
      } catch (error) {
        console.error("Gagal memuat kelas:", error);
      } finally {
        setSedangMuat(false);
      }
    }

    muatKelas();
  }, []);

  useEffect(() => {
    fetch("/api/guru/monitoring", { cache: "no-store" })
      .then((response) => response.json())
      .then((hasil) => {
        if (Array.isArray(hasil.data?.trenNilai)) setTrenNilai(hasil.data.trenNilai);
      })
      .catch((error) => console.error("Gagal memuat tren nilai:", error));
  }, []);

  const totalSiswa = useMemo(() => {
    return daftarKelas.reduce(
      (total, kelas) => total + kelas.jumlahSiswa,
      0
    );
  }, [daftarKelas]);

  const kelasTampil = useMemo(() => {
    const keyword = kataKunci.toLowerCase().trim();

    if (!keyword) return daftarKelas;

    return daftarKelas.filter((kelas) => {
      const cocokJudul = kelas.judul.toLowerCase().includes(keyword);

      const cocokDeskripsi =
        kelas.deskripsi?.toLowerCase().includes(keyword) ?? false;

      const cocokMapel = kelas.mapel.some((mapel) =>
        mapel.nama.toLowerCase().includes(keyword)
      );

      return cocokJudul || cocokDeskripsi || cocokMapel;
    });
  }, [daftarKelas, kataKunci]);

  const dataDonat: DataGrafik[] = daftarKelas.map((kelas, indeks) => ({
    label: kelas.judul,
    nilai: kelas.jumlahSiswa,
    warna: ["#2563eb", "#0f766e", "#8b5cf6", "#f59e0b", "#ec4899"][indeks % 5],
  }));
  const dataPai: DataGrafik[] = [
    { label: "1 mata pelajaran", nilai: daftarKelas.filter((kelas) => kelas.mapel.length === 1).length, warna: "#0f766e" },
    { label: "2 mata pelajaran", nilai: daftarKelas.filter((kelas) => kelas.mapel.length === 2).length, warna: "#f59e0b" },
    { label: "3+ mata pelajaran", nilai: daftarKelas.filter((kelas) => kelas.mapel.length >= 3).length, warna: "#8b5cf6" },
  ].filter((item) => item.nilai > 0);

  return (
    <div style={estilo.halaman}>
      {/* HEADER */}
      <div style={estilo.header}>
        <div>
          <div style={estilo.eyebrow}>
            RUANG GURU
          </div>

          <h1 style={estilo.judulHalaman}>
            Kelas Saya
          </h1>

          <p style={estilo.subjudul}>
            Kelola dan pantau kelas yang sedang kamu ajar.
          </p>
        </div>
      </div>

      {/* SUMMARY */}
      {!sedangMuat && daftarKelas.length > 0 && (
        <div style={estilo.summaryGrid}>
          <div style={estilo.summaryCard}>
            <div style={estilo.summaryIcon}>
              <span>▦</span>
            </div>

            <div>
              <p style={estilo.summaryLabel}>Total Kelas</p>
              <h2 style={estilo.summaryValue}>
                {daftarKelas.length}
              </h2>
            </div>
          </div>

          <div style={estilo.summaryCard}>
            <div style={estilo.summaryIcon}>
              <span>♙</span>
            </div>

            <div>
              <p style={estilo.summaryLabel}>Total Siswa</p>
              <h2 style={estilo.summaryValue}>
                {totalSiswa}
              </h2>
            </div>
          </div>

          <div style={estilo.summaryCard}>
            <div style={estilo.summaryIcon}>
              <span>◈</span>
            </div>

            <div>
              <p style={estilo.summaryLabel}>Mata Pelajaran</p>
              <h2 style={estilo.summaryValue}>
                {new Set(
                  daftarKelas.flatMap((kelas) =>
                    kelas.mapel.map((mapel) => mapel.id)
                  )
                ).size}
              </h2>
            </div>
          </div>
        </div>
      )}

      {!sedangMuat && daftarKelas.length > 0 && (
        <MonitoringCharts
          judul="Pemantauan kelas"
          deskripsi="Sebaran siswa, cakupan mapel, dan tren nilai asesmen enam bulan terakhir."
          dataDonat={dataDonat}
          judulDonat="Siswa per kelas"
          satuanDonat="siswa"
          dataPai={dataPai}
          judulPai="Cakupan mapel per kelas"
          satuanPai="kelas"
          dataTren={trenNilai}
          judulTren="Rata-rata nilai selesai"
          satuanTren="nilai"
        />
      )}

      {/* TOOLBAR */}
      {!sedangMuat && daftarKelas.length > 0 && (
        <div style={estilo.toolbar}>
          <div>
            <h2 style={estilo.judulSection}>
              Daftar Kelas
            </h2>

            <p style={estilo.keteranganSection}>
              Pilih kelas untuk melihat detail dan aktivitas siswa.
            </p>
          </div>

          <div style={estilo.searchWrapper}>
            <span style={estilo.searchIcon}>⌕</span>

            <input
              type="text"
              placeholder="Cari kelas atau mapel..."
              value={kataKunci}
              onChange={(e) => setKataKunci(e.target.value)}
              style={estilo.searchInput}
            />
          </div>
        </div>
      )}

      {/* LOADING */}
      {sedangMuat && (
        <div style={estilo.loadingContainer}>
          <div style={estilo.loadingCircle}></div>

          <p style={estilo.pesanMuat}>
            Memuat daftar kelas...
          </p>
        </div>
      )}

      {/* EMPTY */}
      {!sedangMuat && daftarKelas.length === 0 && (
        <div style={estilo.emptyState}>
          <div style={estilo.emptyIcon}>
            ▦
          </div>

          <h3 style={estilo.emptyTitle}>
            Belum ada kelas
          </h3>

          <p style={estilo.emptyText}>
            Kamu belum ditugaskan untuk mengajar di kelas mana pun.
          </p>
        </div>
      )}

      {/* SEARCH EMPTY */}
      {!sedangMuat &&
        daftarKelas.length > 0 &&
        kelasTampil.length === 0 && (
          <div style={estilo.emptyState}>
            <div style={estilo.emptyIcon}>
              ⌕
            </div>

            <h3 style={estilo.emptyTitle}>
              Kelas tidak ditemukan
            </h3>

            <p style={estilo.emptyText}>
              Coba gunakan kata kunci lain untuk mencari kelas atau
              mata pelajaran.
            </p>
          </div>
        )}

      {/* CLASS GRID */}
      {!sedangMuat && kelasTampil.length > 0 && (
        <div style={estilo.grid}>
          {kelasTampil.map((kelas) => (
            <button
              key={kelas.id}
              type="button"
              onClick={() =>
                router.push(`/guru/kelas/${kelas.id}`)
              }
              style={estilo.kartu}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 30px rgba(var(--cn-primary-rgb), 0.12)";
                e.currentTarget.style.borderColor =
                  "var(--cn-tint)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform =
                  "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 14px rgba(var(--cn-navy-rgb), 0.05)";
                e.currentTarget.style.borderColor =
                  WARNA.border;
              }}
            >
              {/* CARD TOP */}
              <div style={estilo.cardTop}>
                <div style={estilo.iconKelas}>
                  {kelas.judul.charAt(0).toUpperCase()}
                </div>

                <div style={estilo.arrow}>
                  →
                </div>
              </div>

              {/* TITLE */}
              <div style={estilo.cardContent}>
                <h3 style={estilo.judulKartu}>
                  {kelas.judul}
                </h3>

                <p style={estilo.deskripsiKartu}>
                  {kelas.deskripsi ||
                    "Tidak ada deskripsi kelas."}
                </p>

                {/* MAPEL */}
                <div style={estilo.mapelContainer}>
                  {kelas.mapel.slice(0, 3).map((mapel) => (
                    <span
                      key={mapel.id}
                      style={estilo.chip}
                    >
                      {mapel.nama}
                    </span>
                  ))}

                  {kelas.mapel.length > 3 && (
                    <span style={estilo.chipMore}>
                      +{kelas.mapel.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* CARD FOOTER */}
              <div style={estilo.cardFooter}>
                <div style={estilo.siswaInfo}>
                  <div style={estilo.siswaIcon}>
                    ♙
                  </div>

                  <div>
                    <span style={estilo.siswaLabel}>
                      Siswa
                    </span>

                    <strong style={estilo.siswaJumlah}>
                      {kelas.jumlahSiswa}
                    </strong>
                  </div>
                </div>

                <span style={estilo.bukaKelas}>
                  Buka Kelas
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const estilo = {
  halaman: {
    minHeight: "100vh",
    backgroundColor: WARNA.background,
    padding: "32px",
    color: WARNA.text,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },

  eyebrow: {
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "1.2px",
    color: WARNA.primary,
    marginBottom: "7px",
  },

  judulHalaman: {
    margin: 0,
    fontSize: "28px",
    lineHeight: 1.2,
    fontWeight: 800,
    color: WARNA.text,
    letterSpacing: "-0.5px",
  },

  subjudul: {
    margin: "7px 0 0",
    fontSize: "14px",
    color: WARNA.secondary,
  },

  /* SUMMARY */

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
  },

  summaryCard: {
    backgroundColor: WARNA.white,
    border: `1px solid ${WARNA.border}`,
    borderRadius: "14px",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow:
      "0 3px 12px rgba(var(--cn-navy-rgb), 0.035)",
  },

  summaryIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    backgroundColor: WARNA.primarySoft,
    color: WARNA.primary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
    fontWeight: 700,
    flexShrink: 0,
  },

  summaryLabel: {
    margin: 0,
    fontSize: "12px",
    color: WARNA.secondary,
    fontWeight: 500,
  },

  summaryValue: {
    margin: "3px 0 0",
    fontSize: "22px",
    lineHeight: 1,
    fontWeight: 800,
    color: WARNA.text,
  },

  /* TOOLBAR */

  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "18px",
  },

  judulSection: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 750,
    color: WARNA.text,
  },

  keteranganSection: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: WARNA.secondary,
  },

  searchWrapper: {
    width: "270px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: WARNA.white,
    border: `1px solid ${WARNA.border}`,
    borderRadius: "9px",
    padding: "0 12px",
  },

  searchIcon: {
    color: WARNA.muted,
    fontSize: "19px",
    lineHeight: 1,
  },

  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "12px",
    color: WARNA.text,
  },

  /* GRID */

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(270px, 1fr))",
    gap: "18px",
  },

  kartu: {
    width: "100%",
    minHeight: "265px",
    textAlign: "left" as const,
    border: `1px solid ${WARNA.border}`,
    borderRadius: "16px",
    padding: "0",
    backgroundColor: WARNA.white,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
    transition:
      "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
    boxShadow:
      "0 4px 14px rgba(var(--cn-navy-rgb), 0.05)",
  },

  cardTop: {
    height: "76px",
    padding: "16px",
    background:
      "linear-gradient(135deg, var(--cn-primary) 0%, var(--cn-primary) 100%)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  iconKelas: {
    width: "42px",
    height: "42px",
    borderRadius: "11px",
    backgroundColor: "rgba(var(--cn-white-rgb), 0.18)",
    border: "1px solid rgba(var(--cn-white-rgb), 0.25)",
    color: "var(--cn-surface)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: 800,
  },

  arrow: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: "rgba(var(--cn-white-rgb), 0.16)",
    color: "var(--cn-surface)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
  },

  cardContent: {
    padding: "17px 17px 12px",
    flex: 1,
  },

  judulKartu: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 750,
    color: WARNA.text,
    lineHeight: 1.35,
  },

  deskripsiKartu: {
    margin: "6px 0 12px",
    fontSize: "12px",
    color: WARNA.secondary,
    lineHeight: 1.5,
    minHeight: "36px",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },

  mapelContainer: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "6px",
  },

  chip: {
    fontSize: "10px",
    fontWeight: 700,
    color: WARNA.primaryDark,
    backgroundColor: WARNA.primarySoft,
    borderRadius: "6px",
    padding: "5px 8px",
  },

  chipMore: {
    fontSize: "10px",
    fontWeight: 700,
    color: WARNA.secondary,
    backgroundColor: "var(--cn-coral-tint)",
    borderRadius: "6px",
    padding: "5px 8px",
  },

  /* FOOTER */

  cardFooter: {
    borderTop: `1px solid var(--cn-coral-tint)`,
    padding: "12px 17px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  siswaInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  siswaIcon: {
    width: "29px",
    height: "29px",
    borderRadius: "8px",
    backgroundColor: "var(--cn-coral-tint)",
    color: WARNA.secondary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
  },

  siswaLabel: {
    display: "block",
    fontSize: "9px",
    color: WARNA.muted,
    marginBottom: "1px",
  },

  siswaJumlah: {
    display: "block",
    fontSize: "12px",
    color: WARNA.text,
    fontWeight: 700,
  },

  bukaKelas: {
    fontSize: "11px",
    fontWeight: 700,
    color: WARNA.primary,
  },

  /* LOADING */

  loadingContainer: {
    padding: "70px 20px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingCircle: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: `3px solid ${WARNA.primarySoft}`,
    borderTopColor: WARNA.primary,
    marginBottom: "12px",
    animation: "spin 0.8s linear infinite",
  },

  pesanMuat: {
    margin: 0,
    fontSize: "13px",
    color: WARNA.secondary,
  },

  /* EMPTY */

  emptyState: {
    backgroundColor: WARNA.white,
    border: `1px dashed ${WARNA.border}`,
    borderRadius: "16px",
    padding: "65px 20px",
    textAlign: "center" as const,
  },

  emptyIcon: {
    width: "55px",
    height: "55px",
    margin: "0 auto 14px",
    borderRadius: "15px",
    backgroundColor: WARNA.primarySoft,
    color: WARNA.primary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
  },

  emptyTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 750,
    color: WARNA.text,
  },

  emptyText: {
    maxWidth: "420px",
    margin: "7px auto 0",
    fontSize: "12px",
    lineHeight: 1.6,
    color: WARNA.secondary,
  },
};