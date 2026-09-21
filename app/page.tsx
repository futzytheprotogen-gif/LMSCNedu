import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "CN Edu — Sistem Belajar Terpadu untuk SMK",
  description:
    "CN Edu menyatukan materi, tugas, ujian, dan nilai sekolah dalam satu tempat untuk Admin, Kepala Sekolah, Kurikulum, Guru, dan Siswa.",
};

const FITUR = [
  {
    judul: "Materi Pembelajaran",
    deskripsi:
      "Guru mengunggah materi dalam bentuk PDF atau tautan langsung ke kelasnya masing-masing. Siswa membukanya kapan saja tanpa perlu grup chat terpisah.",
  },
  {
    judul: "Tugas & Asesmen",
    deskripsi:
      "Kuis, ujian online, dan tugas dibuat dalam satu alur yang sama. Soal pilihan ganda dinilai otomatis, essay tetap bisa diperiksa manual oleh guru.",
  },
  {
    judul: "Penilaian",
    deskripsi:
      "Nilai per mapel, per kelas, dan per jurusan terkumpul otomatis dari hasil asesmen. Tinggal diunduh ke Excel saat dibutuhkan untuk rapor.",
  },
  {
    judul: "Manajemen Akademik",
    deskripsi:
      "Admin mengatur kelas, akun, dan penugasan guru dari satu dashboard. Kepala Sekolah dan Kurikulum memantau tanpa harus minta laporan manual.",
  },
];

const ROLE = [
  {
    inisial: "A",
    nama: "Admin",
    deskripsi: "Mengelola akun, kelas, dan menangani laporan lupa password.",
  },
  {
    inisial: "K",
    nama: "Kepala Sekolah",
    deskripsi: "Memantau seluruh kelas dan nilai tanpa perlu mengubah data apa pun.",
  },
  {
    inisial: "U",
    nama: "Kurikulum",
    deskripsi: "Meninjau asesmen dan capaian akademik di semua jurusan.",
  },
  {
    inisial: "G",
    nama: "Guru",
    deskripsi: "Membuat materi, tugas, dan asesmen untuk kelas yang diampu.",
  },
  {
    inisial: "S",
    nama: "Siswa",
    deskripsi: "Belajar, mengerjakan tugas, dan melihat pengumuman kelas.",
  },
];

const JURUSAN = ["DKV", "TJKT", "PPLG", "Pemasaran", "MPLB"];

export default function HalamanBeranda() {
  return (
    <div className={styles.wadah}>
      {/* Toggle nav mobile murni CSS, tanpa JS */}
      <input type="checkbox" id="nav-toggle" className={styles.navToggleInput} />

      <header className={styles.navbar}>
        <div className={styles.navbarInner}>
          <span className={styles.logo}>CN Edu</span>

          <nav className={styles.navLinks}>
            <a href="#fitur">Fitur</a>
            <a href="#role">Role</a>
            <a href="#kenapa">Kenapa CN Edu</a>
          </nav>

          <div className={styles.navActions}>
            <Link href="/login" className={styles.tombolMasukKecil}>
              Masuk
            </Link>
            <label htmlFor="nav-toggle" className={styles.hamburger} aria-label="Buka menu">
              <span />
              <span />
              <span />
            </label>
          </div>
        </div>

        <div className={styles.navMobileMenu}>
          <a href="#fitur">Fitur</a>
          <a href="#role">Role</a>
          <a href="#kenapa">Kenapa CN Edu</a>
          <Link href="/login">Masuk</Link>
        </div>
      </header>

      {/* ---- HERO ---- */}
      <section className={styles.hero}>
        <div className={styles.heroTeks}>
          <h1 className={styles.heroJudul}>
            Satu sistem untuk semua urusan belajar-mengajar di sekolah kamu.
          </h1>
          <p className={styles.heroSub}>
            CN Edu menyatukan materi, tugas, ujian, dan nilai dalam satu tempat —
            supaya guru tidak perlu bolak-balik grup chat, dan admin tidak perlu
            rekap manual dari kertas.
          </p>
          <div className={styles.heroTombol}>
            <Link href="/login" className={styles.tombolUtama}>
              Masuk ke akun
            </Link>
            <a href="#fitur" className={styles.tombolSekunder}>
              Lihat fitur
            </a>
          </div>
        </div>

        <div className={styles.heroVisual} aria-hidden="true">
          <div className={styles.mockupWindow}>
            <div className={styles.mockupBar}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.mockupBody}>
              <div className={styles.mockupSidebar}>
                <div className={styles.mockupSidebarItemAktif} />
                <div className={styles.mockupSidebarItem} />
                <div className={styles.mockupSidebarItem} />
                <div className={styles.mockupSidebarItem} />
              </div>
              <div className={styles.mockupKonten}>
                <div className={styles.mockupKartuKelas}>
                  <div className={styles.mockupKartuTitik} />
                  <div className={styles.mockupKartuGarisPanjang} />
                  <div className={styles.mockupKartuGarisPendek} />
                </div>
                <div className={styles.mockupKartuKelas}>
                  <div className={styles.mockupKartuTitik} />
                  <div className={styles.mockupKartuGarisPanjang} />
                  <div className={styles.mockupKartuGarisPendek} />
                </div>
                <div className={styles.mockupKartuKelas}>
                  <div className={styles.mockupKartuTitik} />
                  <div className={styles.mockupKartuGarisPanjang} />
                  <div className={styles.mockupKartuGarisPendek} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- STATS ---- */}
      <section className={styles.statsWadah}>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statAngka}>5</span>
            <span className={styles.statLabel}>Role berbeda, satu sistem</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statAngka}>5</span>
            <span className={styles.statLabel}>Jurusan didukung</span>
          </div>
          <div className={styles.statItem}>
            <span className={`${styles.statAngka} ${styles.statAngkaSorot}`}>63</span>
            <span className={styles.statLabel}>Kelas jurusan tersedia</span>
          </div>
        </div>
      </section>

      {/* ---- APA ITU ---- */}
      <section className={styles.tentang}>
        <h2 className={styles.judulSeksi}>
          Materi, tugas, dan nilai sering tercecer di tempat berbeda-beda.
        </h2>
        <p className={styles.paragrafTentang}>
          Materi dikirim lewat grup WhatsApp, tugas dikumpulkan lewat Google
          Form, nilai direkap manual di Excel — ketiganya jarang nyambung satu
          sama lain. CN Edu dibangun supaya guru dan siswa cukup buka satu
          aplikasi untuk urusan itu semua, dan admin punya gambaran utuh tanpa
          perlu menghubungi tiap guru satu per satu.
        </p>
      </section>

      {/* ---- FITUR ---- */}
      <section className={styles.fitur} id="fitur">
        <h2 className={styles.judulSeksi}>Yang bisa dilakukan di CN Edu</h2>

        <div className={styles.daftarFitur}>
          {FITUR.map((f, i) => (
            <div
              key={f.judul}
              className={`${styles.baFitur} ${i % 2 === 1 ? styles.baFiturTerbalik : ""}`}
            >
              <div className={styles.fiturTeks}>
                <h3 className={styles.fiturJudul}>{f.judul}</h3>
                <p className={styles.fiturDeskripsi}>{f.deskripsi}</p>
              </div>
              <div className={styles.fiturVisual} aria-hidden="true">
                <div className={styles.fiturVisualBlok} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- ROLE ---- */}
      <section className={styles.roleSeksi} id="role">
        <h2 className={styles.judulSeksiTerang}>Dibuat untuk semua yang terlibat</h2>
        <p className={styles.subSeksiTerang}>
          Tiap orang di sekolah dapat akses yang sesuai dengan tanggung jawabnya
          — tidak lebih, tidak kurang.
        </p>

        <div className={styles.daftarRole}>
          {ROLE.map((r) => (
            <div key={r.nama} className={styles.kartuRole}>
              <span className={styles.inisialRole}>{r.inisial}</span>
              <div>
                <h3 className={styles.namaRole}>{r.nama}</h3>
                <p className={styles.deskripsiRole}>{r.deskripsi}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- KENAPA ---- */}
      <section className={styles.kenapa} id="kenapa">
        <h2 className={styles.judulSeksi}>Kenapa sekolah pindah ke CN Edu</h2>

        <div className={styles.perbandingan}>
          <div className={styles.kolomSebelum}>
            <span className={styles.labelKolom}>Cara lama</span>
            <ul>
              <li>Materi tersebar di grup WhatsApp dan Google Drive</li>
              <li>Nilai direkap manual, rawan salah input</li>
              <li>Kepala sekolah harus minta laporan satu-satu ke guru</li>
              <li>Password siswa dan guru sering lupa tanpa cara aman untuk reset</li>
            </ul>
          </div>
          <div className={styles.kolomSesudah}>
            <span className={styles.labelKolom}>Dengan CN Edu</span>
            <ul>
              <li>Materi dan tugas ada di kelasnya masing-masing</li>
              <li>Nilai pilihan ganda dihitung otomatis dari sistem</li>
              <li>Kepala Sekolah dan Kurikulum bisa memantau langsung, kapan saja</li>
              <li>Reset password lewat OTP yang diverifikasi admin sekolah</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ---- JURUSAN ---- */}
      <section className={styles.jurusanSeksi}>
        <h2 className={styles.judulSeksi}>Mendukung semua jurusan di SMK</h2>
        <div className={styles.daftarJurusan}>
          {JURUSAN.map((j) => (
            <span key={j} className={styles.chipJurusan}>
              {j}
            </span>
          ))}
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className={styles.cta}>
        <h2 className={styles.ctaJudul}>Siap mulai pakai CN Edu?</h2>
        <p className={styles.ctaSub}>
          Masuk dengan akun yang sudah didaftarkan admin sekolah kamu.
        </p>
        <Link href="/login" className={styles.tombolUtama}>
          Masuk sekarang
        </Link>
      </section>

      <footer className={styles.footer}>
        <span>CN Edu — Sistem Belajar Terpadu</span>
        <span className={styles.footerTitik}>·</span>
        <span>Dibuat untuk kebutuhan belajar-mengajar sekolah</span>
      </footer>
    </div>
  );
}