"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import styles from "./page.module.css";

interface OpsiSiswa {
  id: string;
  teks: string;
}

interface SoalSiswa {
  id: string;
  tipe: "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";
  pertanyaan: string;
  gambar: string | null;
  opsi: OpsiSiswa[];
}

interface DetailAsesmenSiswa {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  durasiMenit: number | null;
  mapel: string;
  guru: string;
  kelasTujuan: { id: string; judul: string }[];
  soal: SoalSiswa[];
  submission: { nilai: number | null; waktuSelesai: string | null } | null;
}

type JawabanLokal = Record<string, string | string[]>;

export default function DetailAsesmenSiswa() {
  const params = useParams<{ id: string }>();
  const [asesmen, setAsesmen] = useState<DetailAsesmenSiswa | null>(null);
  const [jawaban, setJawaban] = useState<JawabanLokal>({});
  const [sedangMuat, setSedangMuat] = useState(true);
  const [sedangKirim, setSedangKirim] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setSedangMuat(true);
    setError(null);
    try {
      const response = await fetch(`/api/siswa/asesmen/${params.id}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.pesan ?? "Gagal memuat asesmen.");
      setAsesmen(data.data);
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

  const jumlahDijawab = useMemo(() => {
    if (!asesmen) return 0;
    return asesmen.soal.filter((soal) => {
      const value = jawaban[soal.id];
      return Array.isArray(value) ? value.length > 0 : Boolean(value?.trim());
    }).length;
  }, [asesmen, jawaban]);

  function pilihOpsi(soal: SoalSiswa, opsiId: string) {
    setJawaban((sebelumnya) => {
      if (soal.tipe === "PILIHAN_GANDA") return { ...sebelumnya, [soal.id]: opsiId };
      const pilihanSaatIni = Array.isArray(sebelumnya[soal.id])
        ? sebelumnya[soal.id] as string[]
        : [];
      const pilihanBaru = pilihanSaatIni.includes(opsiId)
        ? pilihanSaatIni.filter((item) => item !== opsiId)
        : [...pilihanSaatIni, opsiId];
      return { ...sebelumnya, [soal.id]: pilihanBaru };
    });
  }

  async function kirimJawaban() {
    if (!asesmen || jumlahDijawab !== asesmen.soal.length) {
      setError("Jawab semua soal sebelum mengumpulkan.");
      return;
    }
    if (!window.confirm("Kumpulkan jawaban sekarang? Jawaban tidak dapat diubah setelah dikirim.")) {
      return;
    }

    setSedangKirim(true);
    setError(null);
    try {
      const response = await fetch(`/api/siswa/asesmen/${asesmen.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jawaban: asesmen.soal.map((soal) => ({
            soalId: soal.id,
            ...(soal.tipe === "ESSAY"
              ? { jawabanEssay: jawaban[soal.id] }
              : { opsiIds: Array.isArray(jawaban[soal.id]) ? jawaban[soal.id] : [jawaban[soal.id]] }),
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.pesan ?? "Gagal mengumpulkan asesmen.");
      await muat();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tidak dapat terhubung ke server.");
    } finally {
      setSedangKirim(false);
    }
  }

  if (sedangMuat) return <div className={styles.state} role="status">Memuat asesmen...</div>;
  if (error && !asesmen) {
    return (
      <main className={styles.container}>
        <div className={styles.stateError} role="alert">
          <p>{error}</p>
          <Link href="/siswa/asesmen">Kembali ke asesmen</Link>
        </div>
      </main>
    );
  }
  if (!asesmen) return null;

  return (
    <main className={styles.container}>
      <Link className={styles.backLink} href="/siswa/asesmen">← Kembali ke asesmen</Link>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{asesmen.tipe === "UJIAN" ? "UJIAN" : "KUIS"} · {asesmen.mapel}</p>
          <h1>{asesmen.judul}</h1>
          <p className={styles.meta}>
            {asesmen.guru} <span aria-hidden="true">·</span> {asesmen.soal.length} soal
            {asesmen.durasiMenit ? <><span aria-hidden="true">·</span> {asesmen.durasiMenit} menit</> : null}
          </p>
          <div className={styles.classes}>
            {asesmen.kelasTujuan.map((kelas) => <span key={kelas.id}>{kelas.judul}</span>)}
          </div>
        </div>
        {!asesmen.submission && (
          <div className={styles.progress}>
            <strong>{jumlahDijawab}/{asesmen.soal.length}</strong>
            <span>soal dijawab</span>
          </div>
        )}
      </header>

      {asesmen.submission ? (
        <section className={styles.result} aria-live="polite">
          <span className={styles.resultMark}>✓</span>
          <div>
            <h2>Jawaban terkumpul</h2>
            <p>
              {asesmen.submission.nilai === null
                ? "Jawaban berhasil dikumpulkan. Nilai belum tersedia."
                : `Nilai kamu ${asesmen.submission.nilai} dari 100.`}
            </p>
          </div>
        </section>
      ) : (
        <>
          <div className={styles.instructions}>Pilih atau tulis satu jawaban untuk setiap soal, lalu kumpulkan.</div>
          <div className={styles.questions}>
            {asesmen.soal.map((soal, index) => {
              const pilihan = Array.isArray(jawaban[soal.id])
                ? jawaban[soal.id] as string[]
                : [jawaban[soal.id] as string | undefined].filter(Boolean) as string[];
              return (
                <fieldset className={styles.question} key={soal.id} aria-labelledby={`question-title-${soal.id}`}>
                  <div className={styles.questionHeading} id={`question-title-${soal.id}`}>
                    <span className={styles.questionNumber}>{String(index + 1).padStart(2, "0")}</span>
                    <span>{soal.pertanyaan}</span>
                  </div>
                  {soal.gambar && <img className={styles.questionImage} src={soal.gambar} alt={`Ilustrasi soal ${index + 1}`} />}
                  {soal.tipe === "ESSAY" ? (
                    <textarea
                      className={styles.essay}
                      value={typeof jawaban[soal.id] === "string" ? jawaban[soal.id] : ""}
                      onChange={(event) => setJawaban((sebelumnya) => ({ ...sebelumnya, [soal.id]: event.target.value }))}
                      placeholder="Tulis jawabanmu di sini"
                      rows={5}
                    />
                  ) : (
                    <div className={styles.options}>
                      {soal.opsi.map((opsi) => {
                        const dipilih = pilihan.includes(opsi.id);
                        return (
                          <label className={dipilih ? styles.optionSelected : styles.option} key={opsi.id}>
                            <input
                              type={soal.tipe === "CHECKBOX" ? "checkbox" : "radio"}
                              name={soal.id}
                              checked={dipilih}
                              onChange={() => pilihOpsi(soal, opsi.id)}
                            />
                            <span>{opsi.teks}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </fieldset>
              );
            })}
          </div>
          {error && <p className={styles.inlineError} role="alert">{error}</p>}
          <div className={styles.submitRow}>
            <span>{jumlahDijawab} dari {asesmen.soal.length} soal dijawab</span>
            <button type="button" onClick={kirimJawaban} disabled={sedangKirim || jumlahDijawab !== asesmen.soal.length}>
              {sedangKirim ? "Mengirim..." : "Kumpulkan jawaban"}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </>
      )}
    </main>
  );
}