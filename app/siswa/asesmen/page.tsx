"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

interface AsesmenSiswa {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  durasiMenit: number | null;
  mapel: string;
  guru: { id: string; nama: string };
  jumlahSoal: number;
  kelasTujuan: { id: string; judul: string }[];
  submission: { waktuSelesai: string | null } | null;
}

type FilterAsesmen = "SEMUA" | "BELUM" | "SELESAI";

export default function HalamanAsesmenSiswa() {
  const [asesmen, setAsesmen] = useState<AsesmenSiswa[]>([]);
  const [sedangMuat, setSedangMuat] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterAsesmen>("BELUM");
  const [pencarian, setPencarian] = useState("");

  const muat = useCallback(async () => {
    setSedangMuat(true);
    setError(null);

    try {
      const response = await fetch("/api/siswa/asesmen", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.pesan ?? "Gagal memuat asesmen.");
      setAsesmen(Array.isArray(data.data) ? data.data : []);
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

  const asesmenTerfilter = useMemo(() => {
    const keyword = pencarian.trim().toLocaleLowerCase("id");
    return asesmen.filter((item) => {
      const sesuaiFilter =
        filter === "SEMUA" ||
        (filter === "SELESAI" ? Boolean(item.submission) : !item.submission);
      const sesuaiPencarian =
        !keyword ||
        `${item.judul} ${item.mapel} ${item.guru.nama} ${item.kelasTujuan.map((kelas) => kelas.judul).join(" ")}`
          .toLocaleLowerCase("id")
          .includes(keyword);
      return sesuaiFilter && sesuaiPencarian;
    });
  }, [asesmen, filter, pencarian]);

  const belumDikerjakan = asesmen.filter((item) => !item.submission).length;
  const selesai = asesmen.length - belumDikerjakan;

  return (
    <div className={styles.page}>
      <main className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>RUANG BELAJAR</p>
            <h1>Asesmen</h1>
            <p className={styles.subtitle}>Kuis dan ujian yang dibagikan ke kelasmu.</p>
          </div>
          <div className={styles.summary} aria-label="Ringkasan asesmen">
            <div><strong>{belumDikerjakan}</strong><span>Belum dikerjakan</span></div>
            <div><strong>{selesai}</strong><span>Selesai</span></div>
          </div>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.filters} aria-label="Filter asesmen">
            {([
              ["BELUM", "Belum dikerjakan"],
              ["SEMUA", "Semua"],
              ["SELESAI", "Selesai"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                className={filter === value ? styles.filterActive : styles.filter}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <label className={styles.search}>
            <span aria-hidden="true">⌕</span>
            <input
              value={pencarian}
              onChange={(event) => setPencarian(event.target.value)}
              placeholder="Cari asesmen atau mapel"
              aria-label="Cari asesmen atau mata pelajaran"
            />
          </label>
        </div>

        {sedangMuat ? (
          <div className={styles.state} role="status">Memuat asesmen...</div>
        ) : error ? (
          <div className={styles.stateError} role="alert">
            <p>{error}</p>
            <button type="button" onClick={muat}>Coba lagi</button>
          </div>
        ) : asesmen.length === 0 ? (
          <div className={styles.state}>
            <strong>Belum ada asesmen</strong>
            <p>Asesmen yang sudah diterbitkan guru akan muncul di sini.</p>
            <Link href="/siswa/kelas">Lihat kelas</Link>
          </div>
        ) : asesmenTerfilter.length === 0 ? (
          <div className={styles.state}>
            <strong>Tidak ada asesmen yang cocok</strong>
            <p>Ubah filter atau kata kunci pencarian.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {asesmenTerfilter.map((item) => (
              <Link
                className={styles.assessment}
                href={`/siswa/asesmen/${item.id}`}
                key={item.id}
              >
                <span className={item.tipe === "UJIAN" ? styles.examMark : styles.quizMark}>
                  {item.tipe === "UJIAN" ? "U" : "K"}
                </span>
                <span className={styles.assessmentBody}>
                  <span className={styles.assessmentTitle}>{item.judul}</span>
                  <span className={styles.assessmentMeta}>
                    {item.mapel} <span aria-hidden="true">·</span> {item.guru.nama}
                    <span aria-hidden="true">·</span> {item.jumlahSoal} soal
                    {item.durasiMenit ? <><span aria-hidden="true">·</span> {item.durasiMenit} menit</> : null}
                  </span>
                  <span className={styles.classList}>
                    {item.kelasTujuan.map((kelas) => <span key={kelas.id}>{kelas.judul}</span>)}
                  </span>
                </span>
                <span className={item.submission ? styles.completed : styles.pending}>
                  {item.submission ? "Selesai" : "Kerjakan"}
                </span>
                <span className={styles.arrow} aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}