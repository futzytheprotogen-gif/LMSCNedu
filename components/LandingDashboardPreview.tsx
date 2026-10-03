"use client";

import { useState } from "react";
import styles from "./LandingDashboardPreview.module.css";

const TAMPILAN_ROLE = [
  {
    role: "Admin",
    ikon: "A",
    judul: "Ringkasan sekolah",
    sapaan: "Selamat datang, Admin",
    navigasi: ["Ringkasan", "Kelas", "Akun", "Laporan"],
    statistik: [
      { label: "Kelas aktif", nilai: "24", keterangan: "+2 bulan ini" },
      { label: "Akun terdaftar", nilai: "384", keterangan: "Guru dan siswa" },
      { label: "Perlu ditinjau", nilai: "03", keterangan: "Laporan baru" },
    ],
    aktivitas: ["Akun siswa baru dibuat", "Kelas Pemrograman Web diperbarui", "Laporan lupa password masuk"],
  },
  {
    role: "Kepsek",
    ikon: "K",
    judul: "Pemantauan sekolah",
    sapaan: "Seluruh aktivitas, satu pandangan",
    navigasi: ["Kelas", "Siswa", "Guru"],
    statistik: [
      { label: "Kelas terpantau", nilai: "24", keterangan: "Semua jurusan" },
      { label: "Siswa aktif", nilai: "312", keterangan: "Tahun ajaran ini" },
      { label: "Guru pengampu", nilai: "28", keterangan: "Lintas kelas" },
    ],
    aktivitas: ["Periksa komposisi siswa per kelas", "Lihat penugasan guru dan mapel", "Baca pengumuman kelas terbaru"],
  },
  {
    role: "Kurikulum",
    ikon: "U",
    judul: "Analisis capaian belajar",
    sapaan: "Pantau hasil belajar lintas kelas",
    navigasi: ["Kelas", "Siswa", "Guru", "Rekap nilai"],
    statistik: [
      { label: "Rata-rata sekolah", nilai: "82,4", keterangan: "Nilai asesmen" },
      { label: "Kelas terpantau", nilai: "24", keterangan: "Urut berdasarkan skor" },
      { label: "Periode aktif", nilai: "30 hari", keterangan: "Bisa disesuaikan" },
    ],
    aktivitas: ["Bandingkan rata-rata tiap kelas", "Tinjau capaian siswa tertinggi dan terendah", "Pantau aktivitas guru per mapel"],
  },
  {
    role: "Guru",
    ikon: "G",
    judul: "Ruang mengajar",
    sapaan: "Kelas dan pekerjaan hari ini",
    navigasi: ["Kelas", "Asesmen", "Tugas"],
    statistik: [
      { label: "Kelas diampu", nilai: "04", keterangan: "Tahun ajaran ini" },
      { label: "Pengumpulan baru", nilai: "18", keterangan: "Perlu diperiksa" },
      { label: "Asesmen aktif", nilai: "02", keterangan: "Siap dikerjakan" },
    ],
    aktivitas: ["12 PPLG 2 · 18 pengumpulan tugas", "10 DKV 1 · asesmen pilihan ganda", "12 PPLG 1 · materi baru"],
  },
  {
    role: "Siswa",
    ikon: "S",
    judul: "Ruang belajar",
    sapaan: "Semua yang perlu dikerjakan",
    navigasi: ["Ringkasan", "Kelas", "Asesmen", "Tugas"],
    statistik: [
      { label: "Kelas diikuti", nilai: "05", keterangan: "Semua mapel" },
      { label: "Tugas tertunda", nilai: "02", keterangan: "Cek tenggat" },
      { label: "Asesmen baru", nilai: "01", keterangan: "Siap dikerjakan" },
    ],
    aktivitas: ["Tugas Pemrograman Web · 12 PPLG 2", "Kuis Basis Data · 12 PPLG 2", "Materi baru · Matematika"],
  },
] as const;

export default function LandingDashboardPreview() {
  const [roleAktif, setRoleAktif] = useState(0);
  const tampilan = TAMPILAN_ROLE[roleAktif];

  return (
    <section className={styles.preview} aria-label="Pratinjau dashboard CN Edu">
      <div className={styles.previewIntro}>
        <div>
          <span className={styles.previewEyebrow}>SATU PLATFORM, TIAP PERAN TERHUBUNG</span>
          <h2>Lihat ruang kerjamu.</h2>
        </div>
        <p>Pilih role untuk melihat cuplikan dashboardnya.</p>
      </div>

      <div className={styles.roleTabs} role="tablist" aria-label="Pilih pratinjau role">
        {TAMPILAN_ROLE.map((item, index) => (
          <button
            aria-selected={roleAktif === index}
            className={`${styles.roleTab} ${roleAktif === index ? styles.roleTabActive : ""}`}
            id={`preview-tab-${index}`}
            key={item.role}
            onClick={() => setRoleAktif(index)}
            role="tab"
            type="button"
            aria-controls="preview-panel"
          >
            <span>{item.ikon}</span>{item.role}
          </button>
        ))}
      </div>

      <div
        aria-labelledby={`preview-tab-${roleAktif}`}
        className={styles.window}
        id="preview-panel"
        role="tabpanel"
        key={tampilan.role}
      >
        <div className={styles.windowBar}>
          <div className={styles.windowBrand}><span>CN</span><strong>CN Edu</strong></div>
          <div className={styles.windowAddress}><i /> cne.edu.id / {tampilan.role.toLowerCase()}</div>
          <div className={styles.windowProfile}><b>{tampilan.ikon}</b><span>{tampilan.role}</span></div>
        </div>
        <div className={styles.appFrame}>
          <aside className={styles.appSidebar}>
            <div className={styles.sidebarLabel}>MENU UTAMA</div>
            {tampilan.navigasi.map((item, index) => (
              <div className={`${styles.sidebarItem} ${index === 0 ? styles.sidebarItemActive : ""}`} key={item}>
                <span>{["▦", "▤", "♙", "↗"][index % 4]}</span>{item}
              </div>
            ))}
            <div className={styles.sidebarFoot}><span>{tampilan.ikon}</span> Portal {tampilan.role}</div>
          </aside>
          <div className={styles.appContent}>
            <div className={styles.appBreadcrumb}>CN Edu <span>/</span> {tampilan.judul}</div>
            <div className={styles.appHeading}>
              <div><h3>{tampilan.judul}</h3><p>{tampilan.sapaan}</p></div>
              <span className={styles.dateMark}>Hari ini <b>03 Okt 2026</b></span>
            </div>
            <div className={styles.statGrid}>
              {tampilan.statistik.map((statistik, index) => (
                <div className={styles.statCard} key={statistik.label}>
                  <div className={styles.statCardHead}><span>{["▦", "♙", "↗"][index]}</span><small>{statistik.label}</small></div>
                  <strong>{statistik.nilai}</strong>
                  <small className={styles.statCaption}>{statistik.keterangan}</small>
                </div>
              ))}
            </div>
            <div className={styles.activityPanel}>
              <div className={styles.activityHead}><strong>Aktivitas terbaru</strong><span>Perbarui ↗</span></div>
              {tampilan.aktivitas.map((aktivitas, index) => (
                <div className={styles.activityRow} key={aktivitas}>
                  <span className={`${styles.activityIcon} ${index === 1 ? styles.activityIconGreen : ""}`}>{index + 1}</span>
                  <span>{aktivitas}</span>
                  <time>{index === 0 ? "Baru saja" : `${(index + 1) * 12} menit`}</time>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className={styles.previewNote}>Cuplikan tampilan · Konten berubah sesuai role dan hak akses.</p>
    </section>
  );
}