"use client";

import { useCallback, useEffect, useState } from "react";
import MonitoringCharts, { type DataGrafik } from "@/components/MonitoringCharts";
import EmptyStateFox from "@/components/EmptyStateFox";
import styles from "./page.module.css";

type Periode = "semua" | "30hari";

interface SiswaNilai {
  id: string;
  nama: string;
  rataRata: number;
}

interface GuruNilai {
  id: string;
  nama: string;
  mapel: string;
  rataRataNilai: number | null;
  jumlahAktivitas: number;
  skorKeaktifan: number;
  skorKinerja: number;
}

interface KelasNilai {
  id: string;
  judul: string;
  rataRataNilaiKelas: number | null;
  totalSiswaMengerjakan: number;
  siswaTertinggi: SiswaNilai | null;
  siswaTerendah: SiswaNilai | null;
  guru: GuruNilai[];
  skorKeseluruhanKelas: number;
}

interface DataRekap {
  periode: Periode;
  kelas: KelasNilai[];
  ringkasan: {
    kelasTerbaik: { id: string; judul: string; skor: number } | null;
    kelasTerendah: { id: string; judul: string; skor: number } | null;
  };
}

function formatNilai(nilai: number | null) {
  return nilai === null ? "Belum ada nilai" : nilai.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

function lebarBar(nilai: number) {
  return `${Math.max(0, Math.min(100, nilai))}%`;
}

export default function HalamanRekapNilai() {
  const [periode, setPeriode] = useState<Periode>("semua");
  const [rekap, setRekap] = useState<DataRekap | null>(null);
  const [sedangMuat, setSedangMuat] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setSedangMuat(true);
    setError(null);
    try {
      const response = await fetch(`/api/kurikulum/rekap-nilai?periode=${periode}`, { cache: "no-store" });
      const hasil = await response.json();
      if (!response.ok) throw new Error(hasil.pesan ?? "Gagal memuat rekap nilai.");
      setRekap(hasil.data as DataRekap);
    } catch (tertangkap) {
      setError(tertangkap instanceof Error ? tertangkap.message : "Tidak dapat terhubung ke server.");
    } finally {
      setSedangMuat(false);
    }
  }, [periode]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void muat(); }, 0);
    return () => window.clearTimeout(timer);
  }, [muat]);

  const adaNilai = rekap?.kelas.some((kelas) => kelas.rataRataNilaiKelas !== null) ?? false;
  const kelasRekap = rekap?.kelas ?? [];
  const dataDonat: DataGrafik[] = kelasRekap.map((kelas, indeks) => ({
    label: kelas.judul,
    nilai: kelas.totalSiswaMengerjakan,
    warna: ["#2563eb", "#0f766e", "#8b5cf6", "#f59e0b", "#ec4899", "#dc2626"][indeks % 6],
  }));
  const dataPie: DataGrafik[] = [
    { label: "Di bawah 70", nilai: kelasRekap.filter((kelas) => kelas.rataRataNilaiKelas !== null && kelas.rataRataNilaiKelas < 70).length, warna: "#ef4444" },
    { label: "70–84", nilai: kelasRekap.filter((kelas) => kelas.rataRataNilaiKelas !== null && kelas.rataRataNilaiKelas >= 70 && kelas.rataRataNilaiKelas < 85).length, warna: "#f59e0b" },
    { label: "85 ke atas", nilai: kelasRekap.filter((kelas) => kelas.rataRataNilaiKelas !== null && kelas.rataRataNilaiKelas >= 85).length, warna: "#16a34a" },
    { label: "Belum ada nilai", nilai: kelasRekap.filter((kelas) => kelas.rataRataNilaiKelas === null).length, warna: "#dc2626" },
  ].filter((item) => item.nilai > 0);
  const dataTren: DataGrafik[] = kelasRekap.map((kelas) => ({
    label: kelas.judul,
    nilai: kelas.rataRataNilaiKelas,
  }));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>Kurikulum <span>/</span> Rekap Nilai</div>
          <h1>Rekap Nilai</h1>
          <p>Bandingkan capaian siswa dan kinerja pengajar di setiap kelas.</p>
        </div>
        <label className={styles.periodFilter}>
          <span>Periode aktivitas</span>
          <select value={periode} onChange={(event) => setPeriode(event.target.value as Periode)}>
            <option value="semua">Semua Waktu</option>
            <option value="30hari">30 Hari Terakhir</option>
          </select>
        </label>
      </header>

      {sedangMuat ? (
        <>
          <div className={styles.summaryGrid}>
            {[0, 1].map((item) => <div className={styles.summarySkeleton} key={item} />)}
          </div>
          <div className={styles.classList}>
            {[0, 1, 2].map((item) => <div className={styles.classSkeleton} key={item}><i /><b /><b /></div>)}
          </div>
        </>
      ) : error ? (
        <section className={styles.errorState} role="alert">
          <span>!</span>
          <h2>Rekap belum dapat dimuat</h2>
          <p>{error}</p>
          <button type="button" onClick={() => void muat()}>Coba lagi</button>
        </section>
      ) : rekap ? (
        <>
          <section className={styles.summaryGrid} aria-label="Ringkasan kelas">
            <article className={`${styles.summaryCard} ${styles.bestCard}`}>
              <div className={styles.summaryTop}><span className={styles.summaryIcon}>↗</span><span>KELAS TERBAIK</span></div>
              {rekap.ringkasan.kelasTerbaik ? <>
                <h2>{rekap.ringkasan.kelasTerbaik.judul}</h2>
                <p>Skor keseluruhan tertinggi</p>
                <strong>{formatNilai(rekap.ringkasan.kelasTerbaik.skor)}<small> / 100</small></strong>
              </> : <div className={styles.summaryEmpty}>Belum ada kelas untuk dibandingkan.</div>}
            </article>
            <article className={`${styles.summaryCard} ${styles.attentionCard}`}>
              <div className={styles.summaryTop}><span className={styles.summaryIcon}>◎</span><span>KELAS PERLU PERHATIAN</span></div>
              {rekap.ringkasan.kelasTerendah ? <>
                <h2>{rekap.ringkasan.kelasTerendah.judul}</h2>
                <p>Skor keseluruhan terendah</p>
                <strong>{formatNilai(rekap.ringkasan.kelasTerendah.skor)}<small> / 100</small></strong>
              </> : <div className={styles.summaryEmpty}>Belum ada kelas untuk dibandingkan.</div>}
            </article>
          </section>

          {!adaNilai && (
            <div className={styles.noGrades}>
              <span>i</span>
              <p><strong>Belum ada data nilai selesai.</strong> Peringkat nilai siswa akan muncul setelah asesmen dinilai.</p>
            </div>
          )}

          <MonitoringCharts
            judul="Capaian akademik"
            deskripsi="Distribusi pengerjaan, rentang rata-rata, dan perbandingan nilai setiap kelas."
            dataDonat={dataDonat}
            judulDonat="Porsi siswa mengerjakan"
            satuanDonat="siswa"
            dataPai={dataPie}
            judulPai="Distribusi rentang nilai"
            satuanPai="kelas"
            dataTren={dataTren}
            judulTren="Rata-rata nilai per kelas"
            satuanTren="nilai"
          />

          {rekap.kelas.length ? (
            <section className={styles.rankingSection}>
              <div className={styles.sectionHeader}>
                <div><span>PERBANDINGAN</span><h2>Kinerja kelas</h2></div>
                <small>{rekap.kelas.length} kelas <i /> {periode === "semua" ? "Semua waktu" : "30 hari terakhir"}</small>
              </div>
              <div className={styles.classList}>
                {rekap.kelas.map((kelas, urutan) => (
                  <article className={styles.classCard} key={kelas.id}>
                    <div className={styles.classHeader}>
                      <div className={styles.classIdentity}>
                        <span className={styles.rank}>#{String(urutan + 1).padStart(2, "0")}</span>
                        <div><h3>{kelas.judul}</h3><p>{kelas.totalSiswaMengerjakan} siswa mengerjakan asesmen</p></div>
                      </div>
                      <div className={styles.scoreValue}>{formatNilai(kelas.skorKeseluruhanKelas)}<small>/100</small></div>
                    </div>
                    <div className={styles.scoreTrack} role="progressbar" aria-label={`Skor keseluruhan ${kelas.judul}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(kelas.skorKeseluruhanKelas)}>
                      <span style={{ width: lebarBar(kelas.skorKeseluruhanKelas) }} />
                    </div>

                    <div className={styles.metricsGrid}>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>RATA-RATA KELAS</span>
                        <strong>{formatNilai(kelas.rataRataNilaiKelas)}{kelas.rataRataNilaiKelas !== null && <small> / 100</small>}</strong>
                      </div>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>NILAI TERTINGGI</span>
                        {kelas.siswaTertinggi ? <strong>{formatNilai(kelas.siswaTertinggi.rataRata)}<small> · {kelas.siswaTertinggi.nama}</small></strong> : <strong className={styles.unavailable}>Belum ada</strong>}
                      </div>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>NILAI TERENDAH</span>
                        {kelas.siswaTerendah ? <strong>{formatNilai(kelas.siswaTerendah.rataRata)}<small> · {kelas.siswaTerendah.nama}</small></strong> : <strong className={styles.unavailable}>Belum ada</strong>}
                      </div>
                    </div>

                    <div className={styles.teacherSection}>
                      <div className={styles.teacherHeading}><h4>Kinerja guru</h4><span>{kelas.guru.length} pengampu</span></div>
                      {kelas.guru.length ? <div className={styles.teacherList}>{kelas.guru.map((guru) => (
                        <div className={styles.teacherRow} key={`${guru.id}-${guru.mapel}`}>
                          <div className={styles.teacherName}><span>{guru.nama.charAt(0).toUpperCase()}</span><div><strong>{guru.nama}</strong><small>{guru.mapel}</small></div></div>
                          <div className={styles.teacherMetrics}><span>{guru.jumlahAktivitas} aktivitas</span><small>Nilai {formatNilai(guru.rataRataNilai)}</small></div>
                          <div className={styles.teacherScore}><strong>{formatNilai(guru.skorKinerja)}</strong><small>/ 100</small><div className={styles.teacherTrack}><span style={{ width: lebarBar(guru.skorKinerja) }} /></div></div>
                        </div>
                      ))}</div> : <p className={styles.noTeacher}>Belum ada guru yang ditugaskan ke kelas ini.</p>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <div className={styles.emptyState}><EmptyStateFox /><h2>Belum ada kelas</h2><p>Daftar perbandingan akan tampil setelah kelas tersedia.</p></div>
          )}
        </>
      ) : null}
    </div>
  );
}