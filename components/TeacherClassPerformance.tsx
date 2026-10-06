"use client";

import styles from "./TeacherClassPerformance.module.css";

export interface PeringkatNilai {
  id: string;
  nama: string;
  nilaiRataRata: number;
  jumlahAsesmen: number;
}

export interface PeringkatTugas {
  id: string;
  nama: string;
  jumlahDikumpulkan: number;
  jumlahDitugaskan: number;
  persentase: number;
}

export interface DataPerformaGuru {
  ringkasan: {
    rataRataNilai: number | null;
    nilaiTertinggi: number | null;
    siswaNilaiTertinggi: string | null;
    tingkatPengumpulanTugas: number | null;
    jumlahTugasDikumpulkan: number;
    jumlahTugasDitugaskan: number;
  };
  peringkatNilai: PeringkatNilai[];
  peringkatTugas: PeringkatTugas[];
}

function formatNilai(nilai: number | null) {
  return nilai === null ? "—" : nilai.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

function KartuRingkasan({
  label,
  nilai,
  detail,
}: {
  label: string;
  nilai: string;
  detail: string;
}) {
  return (
    <article className={styles.summaryCard}>
      <span>{label}</span>
      <strong>{nilai}</strong>
      <small>{detail}</small>
    </article>
  );
}

export default function TeacherClassPerformance({
  data,
  sedangMuat,
  error,
}: {
  data: DataPerformaGuru | null;
  sedangMuat: boolean;
  error: string | null;
}) {
  const ringkasan = data?.ringkasan;

  return (
    <section className={styles.section} aria-label="Pemantauan performa siswa">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>PEMANTAUAN</span>
          <h2>Performa siswa</h2>
        </div>
        <p>Ringkasan nilai asesmen dan kedisiplinan pengumpulan tugas di kelas yang kamu ajar.</p>
      </header>

      <div className={styles.summaryGrid}>
        <KartuRingkasan
          label="Rata-rata nilai asesmen"
          nilai={formatNilai(ringkasan?.rataRataNilai ?? null)}
          detail="Dari seluruh asesmen yang sudah dinilai"
        />
        <KartuRingkasan
          label="Nilai tertinggi"
          nilai={formatNilai(ringkasan?.nilaiTertinggi ?? null)}
          detail={ringkasan?.siswaNilaiTertinggi ?? "Belum ada nilai"}
        />
        <KartuRingkasan
          label="Tugas dikumpulkan"
          nilai={ringkasan?.tingkatPengumpulanTugas === null || !ringkasan
            ? "—"
            : `${ringkasan.tingkatPengumpulanTugas}%`}
          detail={ringkasan
            ? `${ringkasan.jumlahTugasDikumpulkan} dari ${ringkasan.jumlahTugasDitugaskan} penugasan siswa`
            : "Menghitung pengumpulan tugas"}
        />
      </div>

      <div className={styles.rankingGrid}>
        <article className={styles.rankingCard}>
          <header>
            <div className={styles.iconScore} aria-hidden="true">★</div>
            <div><h3>Rata-rata nilai tertinggi</h3><p>Peringkat berdasarkan asesmen yang sudah dinilai</p></div>
          </header>
          {error ? (
            <p className={styles.error} role="alert">{error}</p>
          ) : sedangMuat ? (
            <p className={styles.empty}>Memuat peringkat nilai...</p>
          ) : data?.peringkatNilai.length ? (
            <ol className={styles.list}>
              {data.peringkatNilai.map((siswa, indeks) => (
                <li key={siswa.id}>
                  <span className={styles.rank}>{indeks + 1}</span>
                  <div className={styles.studentInfo}>
                    <div className={styles.studentLine}>
                      <strong>{siswa.nama}</strong>
                      <span>{formatNilai(siswa.nilaiRataRata)}</span>
                    </div>
                    <div className={styles.track} role="progressbar" aria-label={`Rata-rata nilai ${siswa.nama}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.max(0, siswa.nilaiRataRata))}>
                      <span className={styles.scoreBar} style={{ width: `${Math.min(100, Math.max(0, siswa.nilaiRataRata))}%` }} />
                    </div>
                    <small>{siswa.jumlahAsesmen} asesmen dinilai</small>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.empty}>Belum ada asesmen yang dinilai.</p>
          )}
        </article>

        <article className={styles.rankingCard}>
          <header>
            <div className={styles.iconTask} aria-hidden="true">✓</div>
            <div><h3>Paling rajin mengumpulkan tugas</h3><p>Peringkat berdasarkan persentase tugas yang dikumpulkan</p></div>
          </header>
          {error ? (
            <p className={styles.error} role="alert">{error}</p>
          ) : sedangMuat ? (
            <p className={styles.empty}>Memuat aktivitas tugas...</p>
          ) : data?.peringkatTugas.length ? (
            <ol className={styles.list}>
              {data.peringkatTugas.map((siswa, indeks) => (
                <li key={siswa.id}>
                  <span className={styles.rank}>{indeks + 1}</span>
                  <div className={styles.studentInfo}>
                    <div className={styles.studentLine}>
                      <strong>{siswa.nama}</strong>
                      <span>{siswa.persentase}%</span>
                    </div>
                    <div className={styles.track} role="progressbar" aria-label={`Pengumpulan tugas ${siswa.nama}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={siswa.persentase}>
                      <span className={styles.taskBar} style={{ width: `${siswa.persentase}%` }} />
                    </div>
                    <small>{siswa.jumlahDikumpulkan} dari {siswa.jumlahDitugaskan} tugas</small>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.empty}>Belum ada tugas yang dikirim ke kelas.</p>
          )}
        </article>
      </div>
    </section>
  );
}
