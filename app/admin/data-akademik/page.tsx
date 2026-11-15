"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAppConfirm } from "@/components/ConfirmDialogProvider";
import styles from "./page.module.css";

interface RombelAkademik {
  id: string;
  label: string;
  jenjang: string;
  angkatan: number | null;
  jurusanId: string | null;
  jurusan: string | null;
  variasi: string | null;
  jumlahSiswa: number;
}

interface Jurusan {
  id: string;
  nama: string;
  jumlahRombel: number;
}

interface MataPelajaran {
  id: string;
  nama: string;
  jumlahPenggunaan: number;
}

interface DataReferensi {
  jurusan: Jurusan[];
  rombel: RombelAkademik[];
  mapel: MataPelajaran[];
}

type Jenjang = "SMP" | "SMA" | "SMK";

const TINGKAT: Record<Jenjang, number[]> = {
  SMP: [7, 8, 9],
  SMA: [10, 11, 12],
  SMK: [10, 11, 12],
};

async function bacaPesan(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.pesan ?? "Permintaan gagal. Coba lagi.");
  return data;
}

export default function HalamanDataAkademik() {
  const konfirmasi = useAppConfirm();
  const [data, setData] = useState<DataReferensi>({ jurusan: [], rombel: [], mapel: [] });
  const [sedangMuat, setSedangMuat] = useState(true);
  const [jenjang, setJenjang] = useState<Jenjang>("SMK");
  const [angkatan, setAngkatan] = useState("10");
  const [jurusanId, setJurusanId] = useState("");
  const [namaJurusan, setNamaJurusan] = useState("");
  const [variasi, setVariasi] = useState("");
  const [namaMapel, setNamaMapel] = useState("");
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const muatData = useCallback(async () => {
    setSedangMuat(true);
    setError(null);
    try {
      const response = await fetch("/api/kelas-referensi", { cache: "no-store" });
      const hasil = await bacaPesan(response);
      setData({
        jurusan: hasil.data.jurusan,
        rombel: hasil.data.rombel,
        mapel: hasil.data.mapel,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Data akademik gagal dimuat.");
    } finally {
      setSedangMuat(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void muatData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [muatData]);

  async function tambahJurusan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSedangSimpan(true);
    setError(null);
    setPesan(null);
    try {
      await bacaPesan(await fetch("/api/kelas-referensi/jurusan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: namaJurusan }),
      }));
      setPesan("Jurusan berhasil ditambahkan.");
      setNamaJurusan("");
      await muatData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Jurusan gagal ditambahkan.");
    } finally {
      setSedangSimpan(false);
    }
  }

  async function tambahRombel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSedangSimpan(true);
    setError(null);
    setPesan(null);
    try {
      await bacaPesan(await fetch("/api/kelas-referensi/rombel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenjang,
          angkatan: angkatan ? Number(angkatan) : null,
          jurusanId: jurusanId || null,
          variasi: variasi || null,
        }),
      }));
      setPesan("Rombel berhasil ditambahkan.");
      setJurusanId("");
      setVariasi("");
      await muatData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Rombel gagal ditambahkan.");
    } finally {
      setSedangSimpan(false);
    }
  }

  async function tambahMapel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSedangSimpan(true);
    setError(null);
    setPesan(null);
    try {
      await bacaPesan(await fetch("/api/kelas-referensi/mapel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: namaMapel }),
      }));
      setPesan("Mata pelajaran berhasil ditambahkan.");
      setNamaMapel("");
      await muatData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Mata pelajaran gagal ditambahkan.");
    } finally {
      setSedangSimpan(false);
    }
  }

  async function hapusRombel(item: RombelAkademik) {
    if (item.jumlahSiswa > 0) return;
    const setuju = await konfirmasi({
      title: `Hapus rombel ${item.label}?`,
      message: "Rombel ini akan dihapus dari pilihan akun siswa. Tindakan ini tidak dapat dibatalkan.",
      confirmLabel: "Hapus rombel",
      cancelLabel: "Batal",
      tone: "danger",
    });
    if (!setuju) return;

    await hapusReferensi(`/api/kelas-referensi/rombel?id=${encodeURIComponent(item.id)}`);
  }

  async function hapusMapel(item: MataPelajaran) {
    if (item.jumlahPenggunaan > 0) return;
    const setuju = await konfirmasi({
      title: `Hapus mata pelajaran ${item.nama}?`,
      message: "Mata pelajaran ini akan dihapus dari daftar pilihan guru. Tindakan ini tidak dapat dibatalkan.",
      confirmLabel: "Hapus mapel",
      cancelLabel: "Batal",
      tone: "danger",
    });
    if (!setuju) return;

    await hapusReferensi(`/api/kelas-referensi/mapel?id=${encodeURIComponent(item.id)}`);
  }

  async function hapusJurusan(item: Jurusan) {
    if (item.jumlahRombel > 0) return;
    const setuju = await konfirmasi({
      title: `Hapus jurusan ${item.nama}?`,
      message: "Jurusan ini akan dihapus dari daftar pilihan. Tindakan ini tidak dapat dibatalkan.",
      confirmLabel: "Hapus jurusan",
      cancelLabel: "Batal",
      tone: "danger",
    });
    if (!setuju) return;

    await hapusReferensi(`/api/kelas-referensi/jurusan?id=${encodeURIComponent(item.id)}`);
  }

  async function hapusReferensi(url: string) {
    setError(null);
    setPesan(null);
    try {
      const hasil = await bacaPesan(await fetch(url, { method: "DELETE" }));
      setPesan(hasil.pesan ?? "Data berhasil dihapus.");
      await muatData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Data gagal dihapus.");
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>PENGELOLAAN SEKOLAH</p>
          <h1>Jurusan & Mata Pelajaran</h1>
          <p>Atur pilihan rombel untuk akun siswa dan mata pelajaran untuk akun guru.</p>
        </div>
      </header>

      {error && <div className={styles.alertError} role="alert">{error}</div>}
      {pesan && <div className={styles.alertSuccess} role="status">{pesan}</div>}

      <div className={styles.sections}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>DATA AKADEMIK</span>
              <h2>Jurusan</h2>
              <p>Kelola daftar jurusan secara terpisah dari tingkat dan rombel kelas.</p>
            </div>
            <span className={styles.count}>{data.jurusan.length} jurusan</span>
          </div>

          <form className={styles.formSingle} onSubmit={tambahJurusan}>
            <label>
              Nama jurusan
              <input
                maxLength={60}
                onChange={(event) => setNamaJurusan(event.target.value)}
                placeholder="Contoh: PPLG"
                required
                value={namaJurusan}
              />
            </label>
            <button disabled={sedangSimpan} type="submit">
              {sedangSimpan ? "Menyimpan..." : "Tambah jurusan"}
            </button>
          </form>

          <div className={styles.list}>
            {sedangMuat ? (
              <p className={styles.state}>Memuat data jurusan...</p>
            ) : data.jurusan.length === 0 ? (
              <p className={styles.state}>Belum ada data jurusan.</p>
            ) : data.jurusan.map((item) => (
              <article className={styles.listItem} key={item.id}>
                <div className={styles.itemText}>
                  <strong>{item.nama}</strong>
                  <span>{item.jumlahRombel} rombel</span>
                </div>
                <button
                  aria-label={`Hapus jurusan ${item.nama}`}
                  className={styles.deleteButton}
                  disabled={item.jumlahRombel > 0 || sedangSimpan}
                  onClick={() => void hapusJurusan(item)}
                  title={item.jumlahRombel > 0 ? "Jurusan masih digunakan oleh rombel." : "Hapus jurusan"}
                  type="button"
                >
                  Hapus
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>DATA GURU</span>
              <h2>Mata pelajaran</h2>
              <p>Daftar mapel yang tersedia saat admin membuat atau mengatur guru.</p>
            </div>
            <span className={styles.count}>{data.mapel.length} mapel</span>
          </div>

          <form className={styles.formSingle} onSubmit={tambahMapel}>
            <label>
              Nama mata pelajaran
              <input
                maxLength={100}
                onChange={(event) => setNamaMapel(event.target.value)}
                placeholder="Contoh: Matematika"
                required
                value={namaMapel}
              />
            </label>
            <button disabled={sedangSimpan} type="submit">
              {sedangSimpan ? "Menyimpan..." : "Tambah mapel"}
            </button>
          </form>

          <div className={styles.list}>
            {sedangMuat ? (
              <p className={styles.state}>Memuat mata pelajaran...</p>
            ) : data.mapel.length === 0 ? (
              <p className={styles.state}>Belum ada mata pelajaran.</p>
            ) : data.mapel.map((item) => (
              <article className={styles.listItem} key={item.id}>
                <div className={styles.itemText}>
                  <strong>{item.nama}</strong>
                  <span>{item.jumlahPenggunaan > 0 ? `Sedang dipakai · ${item.jumlahPenggunaan} penugasan/data` : "Belum dipakai"}</span>
                </div>
                <button
                  aria-label={`Hapus mata pelajaran ${item.nama}`}
                  className={styles.deleteButton}
                  disabled={item.jumlahPenggunaan > 0 || sedangSimpan}
                  onClick={() => void hapusMapel(item)}
                  title={item.jumlahPenggunaan > 0 ? "Lepaskan mapel dari guru, kelas, dan asesmen sebelum menghapus." : "Hapus mata pelajaran"}
                  type="button"
                >
                  Hapus
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>DATA KELAS</span>
              <h2>Tingkat & rombel</h2>
              <p>Atur tingkat kelas dan kelompok siswa; jurusan dipilih dari data jurusan.</p>
            </div>
            <span className={styles.count}>{data.rombel.length} rombel</span>
          </div>

          <form className={styles.form} onSubmit={tambahRombel}>
            <label>
              Jenjang
              <select
                value={jenjang}
                onChange={(event) => {
                  const berikutnya = event.target.value as Jenjang;
                  setJenjang(berikutnya);
                  setAngkatan(String(TINGKAT[berikutnya][0]));
                }}
              >
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
                <option value="SMK">SMK</option>
              </select>
            </label>
            <label>
              Tingkat
              <select value={angkatan} onChange={(event) => setAngkatan(event.target.value)} required>
                {TINGKAT[jenjang].map((tingkat) => (
                  <option key={tingkat} value={tingkat}>{tingkat}</option>
                ))}
              </select>
            </label>
            <label>
              Jurusan {jenjang !== "SMK" && <span className={styles.optional}>opsional</span>}
              <select
                onChange={(event) => setJurusanId(event.target.value)}
                required={jenjang === "SMK"}
                value={jurusanId}
              >
                <option value="">Pilih jurusan...</option>
                {data.jurusan.map((item) => (
                  <option key={item.id} value={item.id}>{item.nama}</option>
                ))}
              </select>
            </label>
            <label>
              Rombel / kelas
              <input
                maxLength={30}
                onChange={(event) => setVariasi(event.target.value)}
                placeholder="Contoh: 1, 2, atau PLUS"
                value={variasi}
              />
            </label>
            <button disabled={sedangSimpan} type="submit">
              {sedangSimpan ? "Menyimpan..." : "Tambah rombel"}
            </button>
          </form>

          <p className={styles.hint}>
            Contoh: pilih jurusan PPLG, lalu tingkat 12 dan rombel 2 untuk membuat “12 PPLG 2”.
          </p>

          <div className={styles.list}>
            {sedangMuat ? (
              <p className={styles.state}>Memuat data rombel...</p>
            ) : data.rombel.length === 0 ? (
              <p className={styles.state}>Belum ada data rombel.</p>
            ) : data.rombel.map((item) => (
              <article className={styles.listItem} key={item.id}>
                <div className={styles.itemText}>
                  <strong>{item.label}</strong>
                  <span>{item.jenjang}{item.jumlahSiswa > 0 ? ` · ${item.jumlahSiswa} siswa` : " · Belum dipakai"}</span>
                </div>
                <button
                  aria-label={`Hapus rombel ${item.label}`}
                  className={styles.deleteButton}
                  disabled={item.jumlahSiswa > 0 || sedangSimpan}
                  onClick={() => void hapusRombel(item)}
                  title={item.jumlahSiswa > 0 ? "Pindahkan siswa dari rombel ini sebelum menghapus." : "Hapus rombel"}
                  type="button"
                >
                  Hapus
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
