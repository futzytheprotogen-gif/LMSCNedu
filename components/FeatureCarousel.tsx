"use client";

import { useState, type KeyboardEvent } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import styles from "./FeatureCarousel.module.css";

interface FiturCarousel {
  judul: string;
  deskripsi: string;
}

const LABEL_FITUR = ["RUANG BELAJAR", "ALUR PENILAIAN", "PANTAU CAPAIAN", "KENDALI AKADEMIK"];
const ITEM_VISUAL = [
  ["Materi Bahasa Inggris", "Modul · Unit 04", "Tautan referensi", "Dibagikan ke 12 PPLG 2"],
  ["Kuis Basis Data", "Pilihan ganda · 20 soal", "Tugas praktikum", "Tenggat Jumat, 16.00"],
  ["Rata-rata kelas", "Pemrograman Web", "Nilai tertinggi", "Nilai perlu perhatian"],
  ["Kelas dan akun", "Penugasan guru", "Ringkasan aktivitas", "Laporan akses"],
];

export default function FeatureCarousel({ fitur }: { fitur: FiturCarousel[] }) {
  const [indeks, setIndeks] = useState(0);
  const [arah, setArah] = useState(1);
  const kurangiGerak = useReducedMotion();
  const fiturAktif = fitur[indeks];
  const barisVisual = ITEM_VISUAL[indeks % ITEM_VISUAL.length];

  function pindahKe(indeksBaru: number) {
    const indeksAman = (indeksBaru + fitur.length) % fitur.length;
    setArah(indeksAman > indeks ? 1 : -1);
    setIndeks(indeksAman);
  }

  function aturTombolKeyboard(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      pindahKe(indeks + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      pindahKe(indeks - 1);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <section className={styles.section} aria-label="Fitur CN Edu">
        <header className={styles.heading}>
          <div>
            <span className={styles.eyebrow}>SATU ALUR YANG TERHUBUNG</span>
            <h2>Semua kebutuhan belajar, satu ruang.</h2>
          </div>
          <p>Geser untuk melihat bagaimana setiap proses bekerja di CN Edu.</p>
        </header>

        <div
          aria-roledescription="carousel"
          className={styles.carousel}
          onKeyDown={aturTombolKeyboard}
          tabIndex={0}
        >
          <AnimatePresence initial={false} mode="wait" custom={arah}>
            <motion.article
              aria-label={`${indeks + 1} dari ${fitur.length}: ${fiturAktif.judul}`}
              className={styles.slide}
              custom={arah}
              exit="keluar"
              initial="masuk"
              key={fiturAktif.judul}
              variants={{
                masuk: (nilaiArah: number) => ({ opacity: 0, x: (kurangiGerak ? 0 : nilaiArah * 38) }),
                tampil: { opacity: 1, x: 0 },
                keluar: (nilaiArah: number) => ({ opacity: 0, x: (kurangiGerak ? 0 : nilaiArah * -38) }),
              }}
              animate="tampil"
              transition={{ duration: kurangiGerak ? 0.12 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className={styles.visual}
                aria-hidden="true"
                drag={kurangiGerak ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.16}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -55) pindahKe(indeks + 1);
                  else if (info.offset.x > 55) pindahKe(indeks - 1);
                }}
              >
                <div className={styles.visualTopbar}>
                  <div className={styles.brand}><span>CN</span><b>CN Edu</b></div>
                  <div className={styles.address}><i /> ruang-kelas / {fiturAktif.judul.toLowerCase()}</div>
                  <span className={styles.avatar}>S</span>
                </div>
                <div className={styles.workspace}>
                  <aside className={styles.visualNav}>
                    <span className={styles.navActive}>▦ <b>Kelas</b></span>
                    <span>▤ <b>Materi</b></span>
                    <span>◷ <b>Aktivitas</b></span>
                    <span>◌ <b>Nilai</b></span>
                    <div className={styles.navUser}><i /> Portal sekolah</div>
                  </aside>
                  <div className={styles.visualContent}>
                    <div className={styles.visualTitle}>
                      <div><span>{LABEL_FITUR[indeks % LABEL_FITUR.length]}</span><h3>{fiturAktif.judul}</h3></div>
                      <span className={styles.visualDate}>Tahun ajaran 2026/2027</span>
                    </div>
                    <div className={styles.visualRows}>
                      {barisVisual.map((item, baris) => (
                        <motion.div
                          animate={{ opacity: 1, y: 0 }}
                          className={styles.visualRow}
                          initial={{ opacity: 0, y: 6 }}
                          key={`${fiturAktif.judul}-${item}`}
                          transition={{ delay: 0.06 + baris * 0.045, duration: 0.22 }}
                        >
                          <span className={`${styles.rowIcon} ${baris === 1 ? styles.rowIconGreen : baris === 2 ? styles.rowIconAmber : ""}`}>
                            {baris === 0 ? "▱" : baris === 1 ? "✓" : baris === 2 ? "↗" : "•"}
                          </span>
                          <span className={styles.rowText}><b>{item}</b><small>{baris === 0 ? "Diperbarui hari ini" : "Tersedia untuk kelas"}</small></span>
                          <span className={styles.rowArrow}>↗</span>
                        </motion.div>
                      ))}
                    </div>
                    <div className={styles.visualFooter}><span><i /> Sinkron dengan kelas</span><span>Terakhir diperbarui · baru saja</span></div>
                  </div>
                </div>
              </motion.div>

              <div className={styles.copy}>
                <span className={styles.count}>{String(indeks + 1).padStart(2, "0")} <i>/</i> {String(fitur.length).padStart(2, "0")}</span>
                <h3>{fiturAktif.judul}</h3>
                <p>{fiturAktif.deskripsi}</p>
                <div className={styles.controls}>
                  <button aria-label="Fitur sebelumnya" className={styles.arrowButton} onClick={() => pindahKe(indeks - 1)} type="button">←</button>
                  <button aria-label="Fitur berikutnya" className={styles.arrowButton} onClick={() => pindahKe(indeks + 1)} type="button">→</button>
                  <div className={styles.progress} aria-hidden="true"><span style={{ width: `${((indeks + 1) / fitur.length) * 100}%` }} /></div>
                </div>
              </div>
            </motion.article>
          </AnimatePresence>
        </div>
        <p className={styles.hint}>Gunakan tombol, tombol panah keyboard, atau geser panel</p>
      </section>
    </MotionConfig>
  );
}