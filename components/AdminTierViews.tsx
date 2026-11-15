"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ClassMonitoringCharts from "@/components/ClassMonitoringCharts";
import EmptyStateFox from "@/components/EmptyStateFox";
import UiIcon, { type UiIconName } from "@/components/UiIcon";
import BackAction from "@/components/BackAction";
import { useAppConfirm } from "@/components/ConfirmDialogProvider";
import styles from "./AdminTierViews.module.css";

interface DaftarKelas {
  id: string;
  judul: string;
  deskripsi: string | null;
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

interface RombelAkademik {
  id: string;
  label: string;
}

interface DetailKelas {
  id: string;
  judul: string;
  deskripsi: string | null;
  siswa: { id: string; nama: string; nis: string; fotoProfil: string | null }[];
  guru: { id: string; nama: string; fotoProfil: string | null; mapel: { id: string; nama: string } }[];
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
  const ikonBagian: Record<string, UiIconName> = {
    Kelas: "classroom",
    Siswa: "students",
    Guru: "teacher",
    "Rekap Nilai": "chart",
  };
  return (
    <header className={styles.header}>
      <div>
        <div className={styles.breadcrumb}>{peran} <span>/</span> {bagian}</div>
        <h1 className={styles.title}><UiIcon className={styles.headerMark} name={ikonBagian[bagian] ?? "classroom"} /><span>{judul}</span></h1>
        <p className={styles.subtitle}>{deskripsi}</p>
      </div>
      <span className={styles.readOnly}><span /> Data sekolah</span>
    </header>
  );
}

function RingkasanKartu({ label, nilai, keterangan, icon, indeks }: { label: string; nilai: string | number; keterangan: string; icon: UiIconName; indeks: number }) {
  return (
    <article className={styles.summaryCard} style={{ animationDelay: `${indeks * 55}ms` }}>
      <span className={styles.summaryIcon}><UiIcon className={styles.summaryGlyph} name={icon} /></span>
      <div className={styles.summaryContent}>
        <span>{label}</span>
        <strong>{nilai}</strong>
        <small>{keterangan}</small>
      </div>
    </article>
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
        <span className={styles.stateIcon}><UiIcon className={styles.stateGlyph} name="info" /></span>
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
  const totalSiswa = (kelas ?? []).reduce((total, item) => total + item.jumlahSiswa, 0);
  const kelasTerisi = (kelas ?? []).filter((item) => item.jumlahSiswa > 0).length;

  return (
    <div className={styles.page}>
      <HeaderHalaman peran={peran} bagian="Kelas" judul="Daftar Kelas" deskripsi="Lihat kelas pembelajaran dan ringkasan anggotanya." />
      <div className={styles.summaryGrid}>
        <RingkasanKartu label="Total kelas" nilai={sedangMuat ? "…" : kelas?.length ?? 0} keterangan="Kelas pembelajaran terdaftar" icon="classroom" indeks={0} />
        <RingkasanKartu label="Keanggotaan siswa" nilai={sedangMuat ? "…" : totalSiswa} keterangan="Siswa terdaftar di kelas" icon="students" indeks={1} />
        <RingkasanKartu label="Kelas berisi siswa" nilai={sedangMuat ? "…" : kelasTerisi} keterangan="Kelas dengan anggota aktif" icon="layers" indeks={2} />
      </div>
      {!sedangMuat && kelas?.length ? <ClassMonitoringCharts daftarKelas={kelas} peran={peran} /> : null}
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <UiIcon className={styles.searchGlyph} name="search" />
          <input onChange={(event) => setPencarian(event.target.value)} placeholder="Cari nama atau deskripsi kelas..." value={pencarian} />
        </label>
        <span className={styles.count}>{sedangMuat ? "Memuat..." : `${kelas?.length ?? 0} kelas`}</span>
      </div>
      <StatusMuat sedangMuat={sedangMuat} error={error} muat={() => void muat()} anak={
        kelas?.length ? kelasTerfilter.length ? (
          <div className={styles.classGrid}>
            {kelasTerfilter.map((item, index) => (
              <Link className={styles.classCard} href={`${awalan}/kelas/${item.id}`} key={item.id} style={{ animationDelay: `${index * 45}ms` }}>
                <div className={styles.classAccent}><span><UiIcon className={styles.classGlyph} name="classroom" /></span><b aria-hidden="true">↗</b></div>
                <div className={styles.classBody}>
                  <h2>{item.judul}</h2>
                  <p>{item.deskripsi || "Belum ada deskripsi kelas."}</p>
                  <div className={styles.cardMeta}><span><UiIcon className={styles.cardMetaGlyph} name="students" /> {item.jumlahSiswa} siswa</span></div>
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
      <BackAction as="link" href={`${awalan}/kelas`}>Kembali ke daftar kelas</BackAction>
      <StatusMuat sedangMuat={sedangMuat} error={error} muat={() => void muat()} anak={kelas ? (
        <>
          <HeaderHalaman peran={peran} bagian="Kelas" judul={kelas.judul} deskripsi={kelas.deskripsi || "Ringkasan anggota dan aktivitas kelas."} />
          <div className={styles.detailStats}>
            <div><span className={styles.detailStatIcon}><UiIcon className={styles.detailStatGlyph} name="students" /></span><div className={styles.detailStatText}><span>Total siswa</span><strong>{kelas.siswa.length}</strong></div></div>
            <div><span className={styles.detailStatIcon}><UiIcon className={styles.detailStatGlyph} name="teacher" /></span><div className={styles.detailStatText}><span>Guru pengampu</span><strong>{kelas.guru.length}</strong></div></div>
          </div>
          <section className={styles.section}>
            <div className={styles.sectionHeading}><div><span className={styles.sectionIcon}><UiIcon className={styles.sectionGlyph} name="students" /></span><h2>Siswa</h2></div><b>{kelas.siswa.length}</b></div>
            {kelas.siswa.length ? <div className={styles.peopleGrid}>{kelas.siswa.map((siswa) => <article className={styles.person} key={siswa.id}><span className={styles.avatar}>{siswa.nama.charAt(0).toUpperCase()}</span><div><strong>{siswa.nama}</strong><small>NIS {siswa.nis}</small></div></article>)}</div> : <p className={styles.sectionEmpty}>Belum ada siswa terdaftar.</p>}
          </section>
          <section className={styles.section}>
            <div className={styles.sectionHeading}><div><span className={styles.sectionIcon}><UiIcon className={styles.sectionGlyph} name="teacher" /></span><h2>Guru pengampu</h2></div><b>{kelas.guru.length}</b></div>
            {kelas.guru.length ? <div className={styles.peopleGrid}>{kelas.guru.map((guru) => <article className={styles.person} key={`${guru.id}-${guru.mapel.id}`}><span className={`${styles.avatar} ${styles.teacherAvatar}`}>{guru.nama.charAt(0).toUpperCase()}</span><div><strong>{guru.nama}</strong><small>{guru.mapel.nama}</small></div></article>)}</div> : <p className={styles.sectionEmpty}>Belum ada guru pengampu.</p>}
          </section>
        </>
      ) : null} />
    </div>
  );
}

export function DaftarOrangAdminTier({ peran, bagian }: { peran: string; bagian: "Siswa" | "Guru" }) {
  const konfirmasi = useAppConfirm();
  const tipe = bagian === "Siswa" ? "SISWA" : "GURU";
  const { data, error, sedangMuat, muat } = useMuat<SiswaRingkas[] | GuruRingkas[]>(`/api/akun?tipe=${tipe}`);
  const [pencarian, setPencarian] = useState("");
  const [rombelAkademik, setRombelAkademik] = useState<RombelAkademik[]>([]);
  const [pilihanRombel, setPilihanRombel] = useState<Record<string, string>>({});
  const [siswaDipindah, setSiswaDipindah] = useState<string | null>(null);
  const [errorPindah, setErrorPindah] = useState<string | null>(null);
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
  const jumlahRombelAktif = new Set(siswa.map((item) => item.rombel.id)).size;
  const jumlahMapelDiampu = new Set(guru.flatMap((item) => item.mapelDiampu.map(({ mapel }) => mapel.id))).size;
  const jumlahKelasDiajar = new Set(guru.flatMap((item) => item.kelasDiajar.map(({ kelas }) => kelas.id))).size;
  const ringkasan: { label: string; nilai: string | number; keterangan: string; icon: UiIconName }[] = bagian === "Siswa"
    ? [
        { label: "Total siswa", nilai: siswa.length, keterangan: "Akun siswa terdaftar", icon: "students" },
        { label: "Rombel terisi", nilai: jumlahRombelAktif, keterangan: "Rombel dengan siswa", icon: "layers" },
        { label: "Rata-rata per rombel", nilai: jumlahRombelAktif ? (siswa.length / jumlahRombelAktif).toFixed(1) : "0", keterangan: "Siswa pada tiap rombel", icon: "chart" },
      ]
    : [
        { label: "Total guru", nilai: guru.length, keterangan: "Akun pengajar terdaftar", icon: "teacher" },
        { label: "Mata pelajaran", nilai: jumlahMapelDiampu, keterangan: "Mapel yang diampu", icon: "book" },
        { label: "Kelas diajar", nilai: jumlahKelasDiajar, keterangan: "Kelas dengan pengajar", icon: "classroom" },
      ];

  useEffect(() => {
    if (bagian !== "Siswa" || peran !== "Kurikulum") return;
    let aktif = true;
    fetch("/api/kelas-referensi", { cache: "no-store" })
      .then(async (response) => {
        const hasil = await response.json();
        if (!response.ok) throw new Error(hasil.pesan ?? "Daftar rombel gagal dimuat.");
        if (aktif) setRombelAkademik(hasil.data.rombel ?? []);
      })
      .catch((caught: unknown) => {
        if (aktif) setErrorPindah(caught instanceof Error ? caught.message : "Daftar rombel gagal dimuat.");
      });
    return () => { aktif = false; };
  }, [bagian, peran]);

  async function pindahkanSiswa(item: SiswaRingkas) {
    const rombelId = pilihanRombel[item.id] ?? item.rombel.id;
    if (rombelId === item.rombel.id) return;
    const rombelBaru = rombelAkademik.find((rombel) => rombel.id === rombelId);
    if (!rombelBaru) return;
    const setuju = await konfirmasi({
      title: `Pindahkan ${item.nama}?`,
      message: `Rombel akademik siswa akan diubah dari ${item.rombel.label} menjadi ${rombelBaru.label}. Keanggotaan kelas belajar tidak ikut berubah.`,
      confirmLabel: "Pindahkan siswa",
      cancelLabel: "Batal",
      tone: "primary",
    });
    if (!setuju) return;

    setSiswaDipindah(item.id);
    setErrorPindah(null);
    try {
      const response = await fetch(`/api/siswa/${item.id}/rombel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rombelId }),
      });
      const hasil = await response.json();
      if (!response.ok) throw new Error(hasil.pesan ?? "Perpindahan rombel gagal.");
      await muat();
    } catch (caught) {
      setErrorPindah(caught instanceof Error ? caught.message : "Perpindahan rombel gagal.");
    } finally {
      setSiswaDipindah(null);
    }
  }

  return (
    <div className={styles.page}>
      <HeaderHalaman peran={peran} bagian={bagian} judul={`Daftar ${bagian}`} deskripsi={bagian === "Siswa" ? "Seluruh akun siswa dan rombel akademiknya." : "Seluruh guru, mata pelajaran, dan kelas yang diajar."} />
      <div className={styles.summaryGrid}>
        {ringkasan.map((item, index) => <RingkasanKartu key={item.label} {...item} nilai={sedangMuat ? "…" : item.nilai} indeks={index} />)}
      </div>
      {bagian === "Siswa" && peran === "Kurikulum" && (
        <aside className={styles.infoStrip}>
          <span className={styles.infoIcon}><UiIcon className={styles.infoGlyph} name="layers" /></span>
          <div><strong>Kenaikan kelas manual</strong><p>Pilih rombel tujuan pada baris siswa, lalu konfirmasi perpindahannya. Keanggotaan kelas belajar tidak ikut berubah.</p></div>
        </aside>
      )}
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <UiIcon className={styles.searchGlyph} name="search" />
          <input onChange={(event) => setPencarian(event.target.value)} placeholder={`Cari nama, ${bagian === "Siswa" ? "NIS, rombel" : "mapel, kelas"}...`} value={pencarian} />
        </label>
        <span className={styles.count}>{sedangMuat ? "Memuat..." : `${jumlah} ${bagian.toLowerCase()}`}</span>
      </div>
      {errorPindah && <p className={styles.moveError} role="alert">{errorPindah}</p>}
      <StatusMuat sedangMuat={sedangMuat} error={error} muat={() => void muat()} anak={jumlah ? (
        bagian === "Siswa" ? hasilSiswa.length ? (
          <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Nama</th><th>NIS</th><th>Email</th><th>Rombel</th>{peran === "Kurikulum" && <th>Kenaikan kelas manual</th>}</tr></thead><tbody>{hasilSiswa.map((item) => <tr key={item.id}><td><span className={styles.tableName}><span className={styles.avatar}>{item.nama.charAt(0).toUpperCase()}</span><strong>{item.nama}</strong></span></td><td>{item.nis}</td><td>{item.email}</td><td><span className={styles.tag}>{item.rombel.label}</span></td>{peran === "Kurikulum" && <td><div className={styles.moveControls}><select aria-label={`Rombel tujuan untuk ${item.nama}`} onChange={(event) => setPilihanRombel((sebelumnya) => ({ ...sebelumnya, [item.id]: event.target.value }))} value={pilihanRombel[item.id] ?? item.rombel.id}>{rombelAkademik.map((rombel) => <option key={rombel.id} value={rombel.id}>{rombel.label}</option>)}</select><button disabled={siswaDipindah === item.id || (pilihanRombel[item.id] ?? item.rombel.id) === item.rombel.id} onClick={() => void pindahkanSiswa(item)} type="button">{siswaDipindah === item.id ? "Menyimpan..." : "Pindahkan"}</button></div></td>}</tr>)}</tbody></table></div>
        ) : <div className={styles.empty}>Siswa tidak ditemukan. Coba kata kunci lain.</div>
          : hasilGuru.length ? (
            <div className={styles.peopleList}>{hasilGuru.map((item) => <article className={styles.teacherRow} key={item.id}><span className={`${styles.avatar} ${styles.teacherAvatar}`}>{item.nama.charAt(0).toUpperCase()}</span><div className={styles.teacherMain}><strong>{item.nama}</strong><small>{item.email}</small><div className={styles.tagList}>{item.mapelDiampu.map(({ mapel }) => <span className={styles.tag} key={mapel.id}>{mapel.nama}</span>)}</div></div><div className={styles.teacherClasses}><small>KELAS DIAJAR</small><span>{item.kelasDiajar.length ? item.kelasDiajar.map((baris) => `${baris.kelas.judul} · ${baris.mapel.nama}`).join(", ") : "Belum ditugaskan"}</span></div></article>)}</div>
          ) : <div className={styles.empty}>Guru tidak ditemukan. Coba kata kunci lain.</div>
      ) : <div className={styles.empty}><EmptyStateFox /><strong>Belum ada data {bagian.toLowerCase()}</strong><p>Data akun akan tampil di sini setelah tersedia.</p></div>} />
    </div>
  );
}