"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ClassMonitoringCharts from "@/components/ClassMonitoringCharts";
import EmptyStateFox from "@/components/EmptyStateFox";
import styles from "./AdminTierViews.module.css";

interface DaftarKelas {
  id: string;
  judul: string;
  deskripsi: string | null;
  kodeKelas: string;
  jumlahSiswa: number;
  createdAt: string;
}

interface SiswaRingkas {
  id: string;
  nama: string;
  email: string;
  nis: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P" | null;
  fotoProfil: string | null;
  rombel: { id: string; label: string };
}

interface GuruRingkas {
  id: string;
  nama: string;
  email: string;
  nik: string;
  jenisKelamin: "L" | "P" | null;
  deskripsi: string | null;
  fotoProfil: string | null;
  mapelDiampu: { mapel: { id: string; nama: string } }[];
  kelasDiajar: { kelas: { id: string; judul: string }; mapel: { id: string; nama: string } }[];
}

interface DetailKelas {
  id: string;
  judul: string;
  deskripsi: string | null;
  kodeKelas: string;
  siswa: { id: string; nama: string; nis: string; fotoProfil: string | null }[];
  guru: { id: string; nama: string; fotoProfil: string | null; mapel: { id: string; nama: string } }[];
  pengumuman: { id: string; isi: string; createdAt: string; guru: { id: string; nama: string } }[];
}

interface HasilMuat<T> {
  data: T | null;
  error: string | null;
  sedangMuat: boolean;
  muat: () => Promise<void>;
}

const DAFTAR_SISWA_KOSONG: SiswaRingkas[] = [];
const DAFTAR_GURU_KOSONG: GuruRingkas[] = [];

function useMuat<T>(url: string): HasilMuat<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sedangMuat, setSedangMuat] = useState(true);

  const muat = useCallback(async () => {
    setSedangMuat(true);
    setError(null);
    try {
      const response = await fetch(url, { cache: "no-store" });
      const hasil = await response.json();
      if (!response.ok) throw new Error(hasil.pesan ?? "Gagal memuat data.");
      setData(hasil.data as T);
    } catch (tertangkap) {
      setError(tertangkap instanceof Error ? tertangkap.message : "Tidak dapat terhubung ke server.");
    } finally {
      setSedangMuat(false);
    }
  }, [url]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void muat(); }, 0);
    return () => window.clearTimeout(timer);
  }, [muat]);

  return { data, error, sedangMuat, muat };
}

function HeaderHalaman({ peran, bagian, judul, deskripsi }: { peran: string; bagian: string; judul: string; deskripsi: string }) {
  return (
    <header className={styles.header}>
      <div>
        <div className={styles.breadcrumb}>{peran} <span>/</span> {bagian}</div>
        <h1 className={styles.title}>{judul}</h1>
        <p className={styles.subtitle}>{deskripsi}</p>
      </div>
      <span className={styles.readOnly}><span /> Data sekolah</span>
    </header>
  );
}

function StatusMuat({ sedangMuat, error, muat, anak }: { sedangMuat: boolean; error: string | null; muat: () => void; anak: React.ReactNode }) {
  if (sedangMuat) {
    return (
      <div className={styles.skeletonGrid} aria-label="Memuat data">
        {[0, 1, 2].map((item) => <div className={styles.skeleton} key={item}><i /><b /><b /></div>)}
      </div>
    );
  }
  if (error) {
    return (
      <section className={styles.stateBox} role="alert">
        <span className={styles.stateIcon}>!</span>
        <h2>Data belum dapat dimuat</h2>
        <p>{error}</p>
        <button className={styles.secondaryButton} onClick={muat} type="button">Coba lagi</button>
      </section>
    );
  }
  return anak;
}

export function DaftarKelasAdminTier({ peran, awalan }: { peran: string; awalan: string }) {
  const { data: kelas, error, sedangMuat, muat } = useMuat<DaftarKelas[]>("/api/kelas");
  const [pencarian, setPencarian] = useState("");
  const kelasTerfilter = useMemo(() => {
    const kata = pencarian.trim().toLowerCase();
    return (kelas ?? []).filter((item) => !kata || `${item.judul} ${item.deskripsi ?? ""}`.toLowerCase().includes(kata));
  }, [kelas, pencarian]);

  return (
    <div className={styles.page}>
      <HeaderHalaman peran={peran} bagian="Kelas" judul="Daftar Kelas" deskripsi="Lihat kelas pembelajaran dan ringkasan anggotanya." />
      {!sedangMuat && kelas?.length ? <ClassMonitoringCharts daftarKelas={kelas} peran={peran} /> : null}
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span aria-hidden="true">⌕</span>
          <input onChange={(event) => setPencarian(event.target.value)} placeholder="Cari nama atau deskripsi kelas..." value={pencarian} />
        </label>
        <span className={styles.count}>{sedangMuat ? "Memuat..." : `${kelas?.length ?? 0} kelas`}</span>
      </div>
      <StatusMuat sedangMuat={sedangMuat} error={error} muat={() => void muat()} anak={
        kelas?.length ? kelasTerfilter.length ? (
          <div className={styles.classGrid}>
            {kelasTerfilter.map((item, index) => (
              <Link className={styles.classCard} href={`${awalan}/kelas/${item.id}`} key={item.id} style={{ animationDelay: `${index * 45}ms` }}>
                <div className={styles.classAccent}><span>{item.judul.trim().charAt(0).toUpperCase()}</span><b aria-hidden="true">↗</b></div>
                <div className={styles.classBody}>
                  <h2>{item.judul}</h2>
                  <p>{item.deskripsi || "Belum ada deskripsi kelas."}</p>
                  <div className={styles.cardMeta}><span>♙ {item.jumlahSiswa} siswa</span><span>Kode {item.kodeKelas}</span></div>
                </div>
              </Link>
            ))}
          </div>
        ) : <div className={styles.empty}>Kelas tidak ditemukan. Coba kata kunci lain.</div>
          : <div className={styles.empty}><EmptyStateFox /><strong>Belum ada kelas</strong><p>Data kelas akan tampil di sini setelah tersedia.</p></div>
      } />
    </div>
  );
}

export function DetailKelasAdminTier({ peran, awalan, id }: { peran: string; awalan: string; id: string }) {
  const { data: kelas, error, sedangMuat, muat } = useMuat<DetailKelas>(`/api/kelas/${id}`);

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} href={`${awalan}/kelas`}>← <span>Kembali ke daftar kelas</span></Link>
      <StatusMuat sedangMuat={sedangMuat} error={error} muat={() => void muat()} anak={kelas ? (
        <>
          <HeaderHalaman peran={peran} bagian="Kelas" judul={kelas.judul} deskripsi={kelas.deskripsi || "Ringkasan anggota dan aktivitas kelas."} />
          <div className={styles.detailStats}>
            <div><span>Total siswa</span><strong>{kelas.siswa.length}</strong></div>
            <div><span>Guru pengampu</span><strong>{kelas.guru.length}</strong></div>
            <div><span>Pengumuman</span><strong>{kelas.pengumuman.length}</strong></div>
          </div>
          <section className={styles.section}>
            <div className={styles.sectionHeading}><div><span>01</span><h2>Siswa</h2></div><b>{kelas.siswa.length}</b></div>
            {kelas.siswa.length ? <div className={styles.peopleGrid}>{kelas.siswa.map((siswa) => <article className={styles.person} key={siswa.id}><span className={styles.avatar}>{siswa.nama.charAt(0).toUpperCase()}</span><div><strong>{siswa.nama}</strong><small>NIS {siswa.nis}</small></div></article>)}</div> : <p className={styles.sectionEmpty}>Belum ada siswa terdaftar.</p>}
          </section>
          <section className={styles.section}>
            <div className={styles.sectionHeading}><div><span>02</span><h2>Guru pengampu</h2></div><b>{kelas.guru.length}</b></div>
            {kelas.guru.length ? <div className={styles.peopleGrid}>{kelas.guru.map((guru) => <article className={styles.person} key={`${guru.id}-${guru.mapel.id}`}><span className={`${styles.avatar} ${styles.teacherAvatar}`}>{guru.nama.charAt(0).toUpperCase()}</span><div><strong>{guru.nama}</strong><small>{guru.mapel.nama}</small></div></article>)}</div> : <p className={styles.sectionEmpty}>Belum ada guru pengampu.</p>}
          </section>
          <section className={styles.section}>
            <div className={styles.sectionHeading}><div><span>03</span><h2>Pengumuman</h2></div><b>{kelas.pengumuman.length}</b></div>
            {kelas.pengumuman.length ? <div className={styles.announcementList}>{kelas.pengumuman.map((item) => <article className={styles.announcement} key={item.id}><div className={styles.announcementMeta}><strong>{item.guru.nama}</strong><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}</time></div><p>{item.isi}</p></article>)}</div> : <p className={styles.sectionEmpty}>Belum ada pengumuman.</p>}
          </section>
        </>
      ) : null} />
    </div>
  );
}

export function DaftarOrangAdminTier({ peran, bagian }: { peran: string; bagian: "Siswa" | "Guru" }) {
  const tipe = bagian === "Siswa" ? "SISWA" : "GURU";
  const { data, error, sedangMuat, muat } = useMuat<SiswaRingkas[] | GuruRingkas[]>(`/api/akun?tipe=${tipe}`);
  const [pencarian, setPencarian] = useState("");
  const siswa = bagian === "Siswa" ? (data as SiswaRingkas[] | null) ?? DAFTAR_SISWA_KOSONG : DAFTAR_SISWA_KOSONG;
  const guru = bagian === "Guru" ? (data as GuruRingkas[] | null) ?? DAFTAR_GURU_KOSONG : DAFTAR_GURU_KOSONG;
  const hasilSiswa = useMemo(() => {
    const kata = pencarian.trim().toLowerCase();
    return siswa.filter((item) => !kata || `${item.nama} ${item.email} ${item.nis} ${item.rombel.label}`.toLowerCase().includes(kata));
  }, [siswa, pencarian]);
  const hasilGuru = useMemo(() => {
    const kata = pencarian.trim().toLowerCase();
    return guru.filter((item) => {
      const mapel = item.mapelDiampu.map((baris) => baris.mapel.nama).join(" ");
      const kelas = item.kelasDiajar.map((baris) => baris.kelas.judul).join(" ");
      return !kata || `${item.nama} ${item.email} ${mapel} ${kelas}`.toLowerCase().includes(kata);
    });
  }, [guru, pencarian]);
  const jumlah = bagian === "Siswa" ? siswa.length : guru.length;

  return (
    <div className={styles.page}>
      <HeaderHalaman peran={peran} bagian={bagian} judul={`Daftar ${bagian}`} deskripsi={bagian === "Siswa" ? "Seluruh akun siswa dan rombel akademiknya." : "Seluruh guru, mata pelajaran, dan kelas yang diajar."} />
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span aria-hidden="true">⌕</span>
          <input onChange={(event) => setPencarian(event.target.value)} placeholder={`Cari nama, ${bagian === "Siswa" ? "NIS, rombel" : "mapel, kelas"}...`} value={pencarian} />
        </label>
        <span className={styles.count}>{sedangMuat ? "Memuat..." : `${jumlah} ${bagian.toLowerCase()}`}</span>
      </div>
      <StatusMuat sedangMuat={sedangMuat} error={error} muat={() => void muat()} anak={jumlah ? (
        bagian === "Siswa" ? hasilSiswa.length ? (
          <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Nama</th><th>NIS</th><th>Email</th><th>Rombel</th></tr></thead><tbody>{hasilSiswa.map((item) => <tr key={item.id}><td><span className={styles.tableName}><span className={styles.avatar}>{item.nama.charAt(0).toUpperCase()}</span><strong>{item.nama}</strong></span></td><td>{item.nis}</td><td>{item.email}</td><td><span className={styles.tag}>{item.rombel.label}</span></td></tr>)}</tbody></table></div>
        ) : <div className={styles.empty}>Siswa tidak ditemukan. Coba kata kunci lain.</div>
          : hasilGuru.length ? (
            <div className={styles.peopleList}>{hasilGuru.map((item) => <article className={styles.teacherRow} key={item.id}><span className={`${styles.avatar} ${styles.teacherAvatar}`}>{item.nama.charAt(0).toUpperCase()}</span><div className={styles.teacherMain}><strong>{item.nama}</strong><small>{item.email}</small><div className={styles.tagList}>{item.mapelDiampu.map(({ mapel }) => <span className={styles.tag} key={mapel.id}>{mapel.nama}</span>)}</div></div><div className={styles.teacherClasses}><small>KELAS DIAJAR</small><span>{item.kelasDiajar.length ? item.kelasDiajar.map((baris) => `${baris.kelas.judul} · ${baris.mapel.nama}`).join(", ") : "Belum ditugaskan"}</span></div></article>)}</div>
          ) : <div className={styles.empty}>Guru tidak ditemukan. Coba kata kunci lain.</div>
      ) : <div className={styles.empty}><EmptyStateFox /><strong>Belum ada data {bagian.toLowerCase()}</strong><p>Data akun akan tampil di sini setelah tersedia.</p></div>} />
    </div>
  );
}