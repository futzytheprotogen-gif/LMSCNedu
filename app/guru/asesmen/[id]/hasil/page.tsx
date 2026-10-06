"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { JenisPeringatanAsesmen } from "@/lib/asesmenIntegrity";
import styles from "./page.module.css";

interface SoalHasil {
  id: string;
  tipe: "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";
  pertanyaan: string;
  opsi: { id: string; teks: string; benar: boolean }[];
}

const LABEL_PERINGATAN: Record<JenisPeringatanAsesmen, string> = {
  TAB_HIDDEN: "Berpindah tab atau menyembunyikan halaman",
  WINDOW_BLUR: "Jendela asesmen kehilangan fokus",
  COPY_BLOCKED: "Percobaan menyalin teks",
  CUT_BLOCKED: "Percobaan memotong teks",
  PASTE_BLOCKED: "Percobaan menempelkan teks",
  CONTEXT_MENU_BLOCKED: "Percobaan membuka menu klik kanan",
  LEAVE_ASSESSMENT: "Meninggalkan halaman asesmen",
  LOGOUT_DURING_ASSESSMENT: "Keluar akun saat asesmen berlangsung",
};

interface Pengumpulan {
  id: string;
  nilai: number | null;
  waktuSelesai: string | null;
  integritasDicatat: boolean;
  siswa: { id: string; nama: string; nis: string };
  catatanIntegritas: {
    id: string;
    jenis: JenisPeringatanAsesmen;
    terdeteksiPada: string;
    createdAt: string;
  }[];
  jawaban: {
    soalId: string;
    jawabanEssay: string | null;
    opsiDipilih: { id: string; teks: string }[];
  }[];
}

interface DataHasil {
  id: string;
  judul: string;
  status: "PROSES" | "SELESAI";
  soal: SoalHasil[];
  pengumpulan: Pengumpulan[];
}

export default function HasilAsesmenGuru() {
  const params = useParams<{ id: string }>();
  const [hasil, setHasil] = useState<DataHasil | null>(null);
  const [draftNilai, setDraftNilai] = useState<Record<string, string>>({});
  const [sedangMuat, setSedangMuat] = useState(true);
  const [sedangSimpan, setSedangSimpan] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const muat = useCallback(async () => {
    try {
      const response = await fetch(`/api/asesmen/${params.id}/pengumpulan`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.pesan ?? "Gagal memuat pengumpulan.");
      setHasil(data.data);
      setDraftNilai(Object.fromEntries(
        data.data.pengumpulan.map((item: Pengumpulan) => [
          item.id,
          item.nilai === null ? "" : String(item.nilai),
        ])
      ));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tidak dapat terhubung ke server.");
    } finally {
      setSedangMuat(false);
    }
  }, [params.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void muat(); }, 0);
    return () => window.clearTimeout(timer);
  }, [muat]);

  async function simpanNilai(submissionId: string) {
    const nilai = Number(draftNilai[submissionId]);
    if (!Number.isFinite(nilai) || nilai < 0 || nilai > 100) {
      setError("Nilai harus berada di antara 0 dan 100.");
      return;
    }

    setSedangSimpan(submissionId);
    setError(null);
    setPesan(null);
    try {
      const response = await fetch(`/api/asesmen/${params.id}/pengumpulan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, nilai }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.pesan ?? "Gagal menyimpan nilai.");
      setHasil((sebelumnya) => sebelumnya && ({
        ...sebelumnya,
        pengumpulan: sebelumnya.pengumpulan.map((item) =>
          item.id === submissionId ? { ...item, nilai: data.data.nilai } : item
        ),
      }));
      setPesan("Nilai berhasil disimpan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tidak dapat terhubung ke server.");
    } finally {
      setSedangSimpan(null);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link className={styles.back} href={`/guru/asesmen/${params.id}`}>← Kembali ke asesmen</Link>
        {sedangMuat ? (
          <div className={styles.state} role="status">Memuat hasil asesmen...</div>
        ) : error && !hasil ? (
          <div className={styles.stateError} role="alert"><p>{error}</p><button onClick={muat}>Coba lagi</button></div>
        ) : hasil ? (
          <>
            <header className={styles.header}>
              <div>
                <p className={styles.eyebrow}>HASIL ASESMEN</p>
                <h1>{hasil.judul}</h1>
                <p>{hasil.pengumpulan.length} pengumpulan siswa</p>
              </div>
              <span className={hasil.status === "SELESAI" ? styles.published : styles.draft}>
                {hasil.status === "SELESAI" ? "Dipublikasikan" : "Belum dipublikasikan"}
              </span>
              <a className={styles.exportButton} href={`/api/asesmen/${params.id}/nilai`}>
                Unduh rekap Excel
              </a>
            </header>

            {pesan && <p className={styles.success} role="status">{pesan}</p>}
            {error && <p className={styles.error} role="alert">{error}</p>}

            {hasil.pengumpulan.length === 0 ? (
              <div className={styles.state}><strong>Belum ada jawaban masuk</strong><p>Pengumpulan siswa akan tampil di sini.</p></div>
            ) : (
              <div className={styles.submissions}>
                {hasil.pengumpulan.map((submission) => (
                  <article className={styles.submission} key={submission.id}>
                    <header className={styles.studentHeader}>
                      <div className={styles.avatar}>{submission.siswa.nama.charAt(0).toUpperCase()}</div>
                      <div className={styles.studentInfo}>
                        <strong>{submission.siswa.nama}</strong>
                        <span>NIS {submission.siswa.nis}
                          {submission.waktuSelesai && <> · {new Date(submission.waktuSelesai).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</>}
                        </span>
                      </div>
                      <span className={submission.nilai === null ? styles.ungraded : styles.gradeBadge}>
                        {submission.nilai === null ? "Belum dinilai" : `${submission.nilai}/100`}
                      </span>
                    </header>

                    <section className={styles.integrityLog} aria-label="Catatan fokus asesmen">
                      <h2>
                        Catatan fokus
                        <span>
                          {submission.integritasDicatat
                            ? `${submission.catatanIntegritas.length} peringatan`
                            : "Belum tersedia"}
                        </span>
                      </h2>
                      {submission.catatanIntegritas.length > 0 ? (
                        <ul>
                          {submission.catatanIntegritas.map((catatan) => (
                            <li key={catatan.id}>
                              <strong>{LABEL_PERINGATAN[catatan.jenis] ?? "Aktivitas tidak dikenal"}</strong>
                              <span>Waktu yang dilaporkan browser: {new Date(catatan.terdeteksiPada).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>
                              <time dateTime={catatan.createdAt}>
                                Tercatat di server: {new Date(catatan.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                              </time>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>
                          {submission.integritasDicatat
                            ? "Tidak ada peringatan fokus yang terdeteksi."
                            : "Catatan fokus belum tersedia untuk pengumpulan lama ini."}
                        </p>
                      )}
                      <small>Catatan ini merupakan sinyal dari browser siswa, bukan bukti pasti terjadinya kecurangan.</small>
                    </section>

                    <div className={styles.answers}>
                      {hasil.soal.map((soal, index) => {
                        const answer = submission.jawaban.find((item) => item.soalId === soal.id);
                        const selectedIds = new Set(answer?.opsiDipilih.map((option) => option.id) ?? []);
                        return (
                          <section className={styles.answer} key={soal.id}>
                            <h2><span>{String(index + 1).padStart(2, "0")}</span>{soal.pertanyaan}</h2>
                            {soal.tipe === "ESSAY" ? (
                              <p className={styles.essayAnswer}>{answer?.jawabanEssay || "Tidak ada jawaban."}</p>
                            ) : (
                              <div className={styles.optionReview}>
                                {soal.opsi.filter((option) => selectedIds.has(option.id)).map((option) => (
                                  <span className={styles.selectedOption} key={option.id}>{option.teks}</span>
                                ))}
                                {soal.opsi.filter((option) => option.benar).map((option) => (
                                  <span className={styles.correctOption} key={option.id}>Kunci: {option.teks}</span>
                                ))}
                                {selectedIds.size === 0 && <span className={styles.noAnswer}>Tidak dijawab</span>}
                              </div>
                            )}
                          </section>
                        );
                      })}
                    </div>

                    <form className={styles.gradeForm} onSubmit={(event) => { event.preventDefault(); void simpanNilai(submission.id); }}>
                      <label htmlFor={`nilai-${submission.id}`}>Nilai akhir</label>
                      <input
                        id={`nilai-${submission.id}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={draftNilai[submission.id] ?? ""}
                        onChange={(event) => setDraftNilai((sebelumnya) => ({ ...sebelumnya, [submission.id]: event.target.value }))}
                        required
                      />
                      <button type="submit" disabled={sedangSimpan === submission.id}>
                        {sedangSimpan === submission.id ? "Menyimpan..." : "Simpan nilai"}
                      </button>
                    </form>
                  </article>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}