"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

interface KelasSiswa {
  id: string;
  judul: string;
  deskripsi: string | null;
  aktivitasTerbaru: { id: string; tipe: "PENGUMUMAN" | "MATERI" | "TUGAS" | "ASESMEN"; judul: string; createdAt: string }[];
}

interface TugasSiswa {
  id: string;
  judul: string;
  status: "SUDAH" | "HARI_INI" | "BELUM";
  dikirimAt: string;
  guru: { nama: string };
  kelasTujuan: { id: string; judul: string }[];
}

interface AsesmenSiswa {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  mapel: string;
  submission: { nilai: number | null } | null;
}

interface RingkasanSiswa {
  kelas: KelasSiswa[];
  tugas: TugasSiswa[];
  asesmen: AsesmenSiswa[];
}

export default function BerandaSiswa() {
  const [ringkasan, setRingkasan] = useState<RingkasanSiswa>({ kelas: [], tugas: [], asesmen: [] });
  const [sedangMuat, setSedangMuat] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const muat = useCallback(async () => {
    try {
      const responses = await Promise.all([
        fetch("/api/siswa/kelas", { cache: "no-store" }),
        fetch("/api/siswa/tugas", { cache: "no-store" }),
        fetch("/api/siswa/asesmen", { cache: "no-store" }),
      ]);
      const payloads = await Promise.all(responses.map((response) => response.json()));
      const gagal = responses.findIndex((response) => !response.ok);
      if (gagal >= 0) throw new Error(payloads[gagal].pesan ?? "Gagal memuat ringkasan.");
      setRingkasan({
        kelas: payloads[0].data ?? [],
        tugas: payloads[1].data ?? [],
        asesmen: payloads[2].data ?? [],
      });
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tidak dapat terhubung ke server.");
    } finally {
      setSedangMuat(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void muat(); }, 0);
    return () => window.clearTimeout(timer);
  }, [muat]);

  const tugasBelum = ringkasan.tugas.filter((item) => item.status !== "SUDAH");
  const asesmenBelum = ringkasan.asesmen.filter((item) => !item.submission);
  const aktivitasTerbaru = ringkasan.kelas
    .flatMap((kelas) => kelas.aktivitasTerbaru.map((aktivitas) => ({ ...aktivitas, kelasId: kelas.id, kelasJudul: kelas.judul })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>CN EDU · SISWA</p>
            <h1>Ringkasan belajar</h1>
            <p>Semua kelas dan pekerjaanmu, satu tempat.</p>
          </div>
          <Link className={styles.primaryLink} href="/siswa/kelas">Buka kelas <span aria-hidden="true">→</span></Link>
        </header>

        {sedangMuat ? (
          <div className={styles.loading} role="status">Memuat ringkasan belajar...</div>
        ) : error ? (
          <div className={styles.error} role="alert">
            <p>{error}</p>
            <button type="button" onClick={muat}>Coba lagi</button>
          </div>
        ) : (
          <>
            <section className={styles.stats} aria-label="Ringkasan aktivitas">
              <Link href="/siswa/kelas"><strong>{ringkasan.kelas.length}</strong><span>Kelas diikuti</span></Link>
              <Link href="/siswa/tugas"><strong>{tugasBelum.length}</strong><span>Tugas perlu dikerjakan</span></Link>
              <Link href="/siswa/asesmen"><strong>{asesmenBelum.length}</strong><span>Asesmen menunggu</span></Link>
            </section>

            <div className={styles.columns}>
              <section className={styles.section}>
                <div className={styles.sectionHeading}>
                  <div><p className={styles.sectionEyebrow}>TINDAKAN BERIKUTNYA</p><h2>Tugas yang perlu dikerjakan</h2></div>
                  <Link href="/siswa/tugas">Semua tugas <span aria-hidden="true">→</span></Link>
                </div>
                {tugasBelum.length ? (
                  <div className={styles.items}>
                    {tugasBelum.slice(0, 4).map((item) => (
                      <Link className={styles.item} href={`/siswa/tugas/${item.id}`} key={item.id}>
                        <span className={styles.itemMark}>T</span>
                        <span className={styles.itemText}><strong>{item.judul}</strong><small>{item.guru.nama} · {item.kelasTujuan.map((kelas) => kelas.judul).join(", ")}</small></span>
                        <span className={item.status === "HARI_INI" ? styles.today : styles.pending}>{item.status === "HARI_INI" ? "Baru" : "Belum"}</span>
                      </Link>
                    ))}
                  </div>
                ) : <p className={styles.empty}>Tidak ada tugas yang tertunda.</p>}

                <div className={styles.sectionHeadingSecondary}>
                  <div><p className={styles.sectionEyebrow}>ASESMEN</p><h2>Siap dikerjakan</h2></div>
                  <Link href="/siswa/asesmen">Semua asesmen <span aria-hidden="true">→</span></Link>
                </div>
                {asesmenBelum.length ? (
                  <div className={styles.items}>
                    {asesmenBelum.slice(0, 4).map((item) => (
                      <Link className={styles.item} href={`/siswa/asesmen/${item.id}`} key={item.id}>
                        <span className={styles.examMark}>{item.tipe === "UJIAN" ? "U" : "K"}</span>
                        <span className={styles.itemText}><strong>{item.judul}</strong><small>{item.mapel}</small></span>
                        <span className={styles.pending}>Mulai</span>
                      </Link>
                    ))}
                  </div>
                ) : <p className={styles.empty}>Tidak ada asesmen yang menunggu.</p>}
              </section>

              <aside className={styles.section}>
                <div className={styles.sectionHeading}>
                  <div><p className={styles.sectionEyebrow}>KELAS SAYA</p><h2>Ruang kelas</h2></div>
                  <Link href="/siswa/kelas">Lihat semua <span aria-hidden="true">→</span></Link>
                </div>
                {ringkasan.kelas.length ? (
                  <div className={styles.classList}>
                    {ringkasan.kelas.slice(0, 5).map((kelas) => (
                      <Link className={styles.classItem} href={`/siswa/kelas/${kelas.id}`} key={kelas.id}>
                        <span className={styles.classMark}>{kelas.judul.charAt(0).toUpperCase()}</span>
                        <span><strong>{kelas.judul}</strong><small>{kelas.aktivitasTerbaru.length ? `${kelas.aktivitasTerbaru.length} aktivitas terbaru` : "Belum ada aktivitas"}</small></span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    ))}
                  </div>
                ) : <p className={styles.empty}>Kamu belum tergabung di kelas.</p>}
                <Link className={styles.profileLink} href="/profil/saya">Perbarui profil <span aria-hidden="true">→</span></Link>
              </aside>
            </div>

            <section className={styles.activitySection}>
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.sectionEyebrow}>DARI KELASMU</p>
                  <h2>Aktivitas terbaru</h2>
                </div>
                <Link href="/siswa/kelas">Lihat semua kelas <span aria-hidden="true">→</span></Link>
              </div>
              {aktivitasTerbaru.length ? (
                <div className={styles.activityList}>
                  {aktivitasTerbaru.map((aktivitas) => (
                    <Link
                      className={styles.activityItem}
                      href={aktivitas.tipe === "TUGAS"
                        ? `/siswa/tugas/${aktivitas.id}`
                        : aktivitas.tipe === "ASESMEN"
                          ? `/siswa/asesmen/${aktivitas.id}`
                          : `/siswa/kelas/${aktivitas.kelasId}`}
                      key={`${aktivitas.kelasId}-${aktivitas.tipe}-${aktivitas.id}`}
                    >
                      <span className={styles.activityMark}>
                        {aktivitas.tipe === "PENGUMUMAN" ? "P" : aktivitas.tipe === "MATERI" ? "M" : aktivitas.tipe === "TUGAS" ? "T" : "A"}
                      </span>
                      <span className={styles.activityText}>
                        <small>{LABEL_AKTIVITAS[aktivitas.tipe]} · {aktivitas.kelasJudul}</small>
                        <strong>{aktivitas.judul}</strong>
                      </span>
                      <time dateTime={aktivitas.createdAt}>
                        {new Date(aktivitas.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </time>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>Belum ada aktivitas dari kelasmu.</p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

const LABEL_AKTIVITAS: Record<KelasSiswa["aktivitasTerbaru"][number]["tipe"], string> = {
  PENGUMUMAN: "Pengumuman",
  MATERI: "Materi baru",
  TUGAS: "Tugas baru",
  ASESMEN: "Asesmen baru",
};