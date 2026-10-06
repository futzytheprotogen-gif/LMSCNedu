"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAppConfirm } from "@/components/ConfirmDialogProvider";
import {
  bacaCatatanIntegritas,
  hapusCatatanIntegritas,
  rekamCatatanIntegritas,
  type CatatanIntegritasAsesmen,
  type JenisPeringatanAsesmen,
} from "@/lib/asesmenIntegrity";
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
  submission: { waktuSelesai: string | null } | null;
}

type JawabanLokal = Record<string, string | string[]>;

function isJawabanLokal(value: unknown): value is JawabanLokal {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every(
    (jawaban) =>
      typeof jawaban === "string" ||
      (Array.isArray(jawaban) && jawaban.every((item) => typeof item === "string"))
  );
}

export default function DetailAsesmenSiswa() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const konfirmasi = useAppConfirm();
  const [asesmen, setAsesmen] = useState<DetailAsesmenSiswa | null>(null);
  const [jawaban, setJawaban] = useState<JawabanLokal>({});
  const [sedangMuat, setSedangMuat] = useState(true);
  const [sedangKirim, setSedangKirim] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [indeksSoal, setIndeksSoal] = useState(0);
  const [daftarSoalTerbuka, setDaftarSoalTerbuka] = useState(false);
  const [skalaTeks, setSkalaTeks] = useState(0);
  const [waktuBerlalu, setWaktuBerlalu] = useState(0);
  const [catatanIntegritas, setCatatanIntegritas] = useState<CatatanIntegritasAsesmen[]>([]);
  const pengirimanAktif = useRef(false);
  const pengirimanWaktuHabis = useRef(false);

  const muat = useCallback(async () => {
    setSedangMuat(true);
    setError(null);
    try {
      const response = await fetch(`/api/siswa/asesmen/${params.id}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.pesan ?? "Gagal memuat asesmen.");
      const asesmenDimuat: DetailAsesmenSiswa = data.data;
      const kunciDraft = `cnedu-asesmen-${asesmenDimuat.id}-jawaban`;
      if (asesmenDimuat.submission) {
        sessionStorage.removeItem(kunciDraft);
        sessionStorage.removeItem(`cnedu-asesmen-${asesmenDimuat.id}-dimulai`);
        hapusCatatanIntegritas(asesmenDimuat.id);
      } else {
        setCatatanIntegritas(bacaCatatanIntegritas(asesmenDimuat.id));
        const draftTersimpan = sessionStorage.getItem(kunciDraft);
        if (draftTersimpan) {
          try {
            const draft: unknown = JSON.parse(draftTersimpan);
            if (isJawabanLokal(draft)) setJawaban(draft);
          } catch {
            sessionStorage.removeItem(kunciDraft);
          }
        }
      }
      setAsesmen(asesmenDimuat);
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

  useEffect(() => {
    if (!asesmen || asesmen.submission) return;

    const kunciWaktu = `cnedu-asesmen-${asesmen.id}-dimulai`;
    const waktuTersimpan = Number(sessionStorage.getItem(kunciWaktu));
    const waktuMulai = Number.isFinite(waktuTersimpan) && waktuTersimpan > 0
      ? waktuTersimpan
      : Date.now();

    if (waktuMulai !== waktuTersimpan) sessionStorage.setItem(kunciWaktu, String(waktuMulai));

    const timerAwal = window.setTimeout(() => {
      setWaktuBerlalu(Math.max(0, Math.floor((Date.now() - waktuMulai) / 1000)));
    }, 0);
    const interval = window.setInterval(() => {
      setWaktuBerlalu(Math.max(0, Math.floor((Date.now() - waktuMulai) / 1000)));
    }, 1000);

    return () => {
      window.clearTimeout(timerAwal);
      window.clearInterval(interval);
    };
  }, [asesmen]);

  useEffect(() => {
    if (!asesmen || asesmen.submission) return;
    sessionStorage.setItem(`cnedu-asesmen-${asesmen.id}-jawaban`, JSON.stringify(jawaban));
  }, [asesmen, jawaban]);

  const jumlahDijawab = useMemo(() => {
    if (!asesmen) return 0;
    return asesmen.soal.filter((soal) => {
      const value = jawaban[soal.id];
      return Array.isArray(value) ? value.length > 0 : Boolean(value?.trim());
    }).length;
  }, [asesmen, jawaban]);

  const soalAktif = asesmen?.soal[indeksSoal];
  const durasiDetik = (asesmen?.durasiMenit ?? 0) * 60;
  const waktuTampil = durasiDetik > 0 ? Math.max(0, durasiDetik - waktuBerlalu) : waktuBerlalu;
  const waktuHabis = durasiDetik > 0 && waktuBerlalu >= durasiDetik;
  const jam = String(Math.floor(waktuTampil / 3600)).padStart(2, "0");
  const menit = String(Math.floor((waktuTampil % 3600) / 60)).padStart(2, "0");
  const detik = String(waktuTampil % 60).padStart(2, "0");

  function soalSudahDijawab(soalId: string) {
    const jawabanSoal = jawaban[soalId];
    return Array.isArray(jawabanSoal) ? jawabanSoal.length > 0 : Boolean(jawabanSoal?.trim());
  }

  function catatPeringatan(jenis: JenisPeringatanAsesmen) {
    if (!asesmen) return;
    const catatan = rekamCatatanIntegritas(asesmen.id, jenis);
    setCatatanIntegritas((sebelumnya) => [...sebelumnya, catatan].slice(-100));
  }

  function pilihNomorSoal(nomor: number) {
    setIndeksSoal(nomor);
    setDaftarSoalTerbuka(false);
    setError(null);
  }

  async function kembaliKeDaftarAsesmen() {
    if (asesmen && !asesmen.submission && !(await konfirmasi({
      title: "Keluar dari ujian?",
      message: "Jawaban sementara tersimpan di perangkat ini dan waktu ujian tetap berjalan. Kamu bisa kembali mengerjakan sebelum waktunya habis.",
      confirmLabel: "Keluar dari ujian",
      cancelLabel: "Lanjutkan ujian",
      tone: "primary",
    }))) return;
    if (asesmen && !asesmen.submission) catatPeringatan("LEAVE_ASSESSMENT");
    router.push("/siswa/asesmen");
  }

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

  const kirimJawaban = useCallback(async (otomatis = false) => {
    if (!asesmen || pengirimanAktif.current || asesmen.submission) return;

    if (!otomatis && jumlahDijawab !== asesmen.soal.length) {
      setError("Jawab semua soal sebelum mengumpulkan.");
      const soalKosong = asesmen.soal.findIndex((soal) => {
        const value = jawaban[soal.id];
        return Array.isArray(value) ? value.length === 0 : !value?.trim();
      });
      if (soalKosong >= 0) {
        setIndeksSoal(soalKosong);
        setDaftarSoalTerbuka(false);
      }
      return;
    }
    if (!otomatis && !(await konfirmasi({
      title: "Kumpulkan jawaban?",
      message: "Pastikan semua jawaban sudah benar. Setelah dikirim, jawaban tidak dapat diubah.",
      confirmLabel: "Kumpulkan jawaban",
      cancelLabel: "Periksa kembali",
      tone: "primary",
    }))) {
      return;
    }
    if (pengirimanAktif.current) return;

    pengirimanAktif.current = true;
    setSedangKirim(true);
    setError(null);
    try {
      const response = await fetch(`/api/siswa/asesmen/${asesmen.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(otomatis ? { autoSubmit: true } : {}),
          catatanIntegritas: bacaCatatanIntegritas(asesmen.id),
          jawaban: asesmen.soal.map((soal) => ({
            soalId: soal.id,
            ...(soal.tipe === "ESSAY"
              ? { jawabanEssay: typeof jawaban[soal.id] === "string" ? jawaban[soal.id] : "" }
              : {
                  opsiIds: Array.isArray(jawaban[soal.id])
                    ? jawaban[soal.id]
                    : jawaban[soal.id]
                      ? [jawaban[soal.id] as string]
                      : [],
                }),
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.pesan ?? "Gagal mengumpulkan asesmen.");
      hapusCatatanIntegritas(asesmen.id);
      await muat();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tidak dapat terhubung ke server.");
    } finally {
      pengirimanAktif.current = false;
      setSedangKirim(false);
    }
  }, [asesmen, jumlahDijawab, jawaban, konfirmasi, muat]);

  useEffect(() => {
    if (!asesmen || asesmen.submission || durasiDetik <= 0 || waktuBerlalu < durasiDetik) return;
    if (pengirimanWaktuHabis.current) return;
    pengirimanWaktuHabis.current = true;
    void kirimJawaban(true).finally(() => {
      pengirimanWaktuHabis.current = false;
    });
  }, [asesmen, durasiDetik, waktuBerlalu, kirimJawaban]);

  useEffect(() => {
    if (!asesmen || asesmen.submission) return;

    let fokusAktif = true;
    let blurTimer = 0;
    const beriPeringatan = (jenis: "TAB_HIDDEN" | "WINDOW_BLUR") => {
      if (!fokusAktif) return;
      fokusAktif = false;
      const catatan = rekamCatatanIntegritas(asesmen.id, jenis);
      setCatatanIntegritas((sebelumnya) => [...sebelumnya, catatan].slice(-100));
    };
    const saatVisibilitasBerubah = () => {
      window.clearTimeout(blurTimer);
      if (document.hidden) {
        beriPeringatan("TAB_HIDDEN");
      } else {
        fokusAktif = true;
      }
    };
    const saatKehilanganFokus = () => {
      blurTimer = window.setTimeout(() => {
        if (!document.hidden) beriPeringatan("WINDOW_BLUR");
      }, 250);
    };
    const saatMendapatFokus = () => {
      window.clearTimeout(blurTimer);
      fokusAktif = true;
    };

    document.addEventListener("visibilitychange", saatVisibilitasBerubah);
    window.addEventListener("blur", saatKehilanganFokus);
    window.addEventListener("focus", saatMendapatFokus);
    return () => {
      window.clearTimeout(blurTimer);
      document.removeEventListener("visibilitychange", saatVisibilitasBerubah);
      window.removeEventListener("blur", saatKehilanganFokus);
      window.removeEventListener("focus", saatMendapatFokus);
    };
  }, [asesmen]);

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
      {!asesmen.submission && (
        <div className={styles.timerBar}>
          <div className={styles.timerCopy}>
            <span className={styles.timerDot} />
            <span>{durasiDetik > 0 ? "Sisa waktu" : `Waktu ${asesmen.tipe === "UJIAN" ? "ujian" : "kuis"}`}</span>
            <strong>{jam}:{menit}:{detik}</strong>
          </div>
          <span className={styles.timeLimit}>{asesmen.durasiMenit ? `Durasi ${asesmen.durasiMenit} menit` : "Tanpa batas waktu"}</span>
        </div>
      )}
      {!asesmen.submission && (
        <p className={styles.focusNotice} role="status">
          {waktuHabis
            ? (sedangKirim ? "Waktu habis. Jawaban sedang dikirim otomatis..." : "Waktu habis. Periksa koneksi lalu coba kirim ulang.")
            : `Mode fokus aktif · jangan berpindah tab${catatanIntegritas.length ? ` · ${catatanIntegritas.length} peringatan akan dicatat saat dikumpulkan` : ""}`}
        </p>
      )}

      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <Link
            className={styles.backLink}
            href="/siswa/asesmen"
            onClick={(event) => {
              if (asesmen.submission) return;
              event.preventDefault();
              void kembaliKeDaftarAsesmen();
            }}
          >
            ← Kembali ke asesmen
          </Link>
          <p className={styles.eyebrow}>{asesmen.tipe === "UJIAN" ? "UJIAN" : "KUIS"} · {asesmen.mapel}</p>
          <h1>{asesmen.judul}</h1>
          <p className={styles.meta}>{asesmen.guru} <span aria-hidden="true">·</span> {asesmen.soal.length} soal</p>
        </div>
        {!asesmen.submission && (
          <div className={styles.progress} aria-label={`${jumlahDijawab} dari ${asesmen.soal.length} soal dijawab`}>
            <strong>{jumlahDijawab}<span>/{asesmen.soal.length}</span></strong>
            <span>soal dijawab</span>
            <div className={styles.progressTrack}><span style={{ width: `${asesmen.soal.length ? (jumlahDijawab / asesmen.soal.length) * 100 : 0}%` }} /></div>
          </div>
        )}
      </header>

      {asesmen.submission ? (
        <section className={styles.result} aria-live="polite">
          <span className={styles.resultMark}>✓</span>
          <div>
            <h2>Jawaban terkumpul</h2>
            <p>Jawaban berhasil dikumpulkan. Nilai akan diinformasikan oleh guru.</p>
          </div>
        </section>
      ) : (
        <>
          {soalAktif && (
            <section
              className={styles.question}
              key={soalAktif.id}
              role="group"
              aria-labelledby={`question-title-${soalAktif.id}`}
              onCopy={(event) => { event.preventDefault(); catatPeringatan("COPY_BLOCKED"); }}
              onCut={(event) => { event.preventDefault(); catatPeringatan("CUT_BLOCKED"); }}
              onPaste={(event) => { event.preventDefault(); catatPeringatan("PASTE_BLOCKED"); }}
              onContextMenu={(event) => { event.preventDefault(); catatPeringatan("CONTEXT_MENU_BLOCKED"); }}
            >
              <div className={styles.questionToolbar}>
                <span className={styles.questionNumber}>No. {String(indeksSoal + 1).padStart(2, "0")}</span>
                <div className={styles.textControls} aria-label="Ukuran teks soal">
                  <button type="button" onClick={() => setSkalaTeks((skala) => Math.max(-2, skala - 1))} aria-label="Kecilkan teks">A−</button>
                  <button type="button" onClick={() => setSkalaTeks(0)} aria-label="Reset ukuran teks">↻</button>
                  <button type="button" onClick={() => setSkalaTeks((skala) => Math.min(4, skala + 1))} aria-label="Besarkan teks">A+</button>
                </div>
              </div>
              <h2 className={styles.questionHeading} id={`question-title-${soalAktif.id}`} style={{ fontSize: `${16 + skalaTeks * 2}px` }}>
                {soalAktif.pertanyaan}
              </h2>
              {soalAktif.gambar && <img className={styles.questionImage} src={soalAktif.gambar} alt={`Ilustrasi soal ${indeksSoal + 1}`} />}
              {soalAktif.tipe === "ESSAY" ? (
                <textarea
                  className={styles.essay}
                  style={{ fontSize: `${15 + skalaTeks * 2}px` }}
                  value={typeof jawaban[soalAktif.id] === "string" ? jawaban[soalAktif.id] : ""}
                  onChange={(event) => setJawaban((sebelumnya) => ({ ...sebelumnya, [soalAktif.id]: event.target.value }))}
                  placeholder="Tulis jawabanmu di sini"
                  rows={5}
                />
              ) : (
                <div className={styles.options} role={soalAktif.tipe === "CHECKBOX" ? "group" : "radiogroup"} aria-label="Pilihan jawaban">
                  {soalAktif.opsi.map((opsi, index) => {
                    const pilihanAktif = Array.isArray(jawaban[soalAktif.id])
                      ? jawaban[soalAktif.id] as string[]
                      : [jawaban[soalAktif.id] as string | undefined].filter(Boolean) as string[];
                    const dipilih = pilihanAktif.includes(opsi.id);
                    return (
                      <label className={`${styles.option} ${dipilih ? styles.optionSelected : ""}`} key={opsi.id}>
                        <input
                          type={soalAktif.tipe === "CHECKBOX" ? "checkbox" : "radio"}
                          name={soalAktif.id}
                          checked={dipilih}
                          onChange={() => pilihOpsi(soalAktif, opsi.id)}
                        />
                        <span className={styles.optionLetter}>{String.fromCharCode(65 + index)}</span>
                        <span className={styles.optionText} style={{ fontSize: `${15 + skalaTeks * 2}px` }}>{opsi.teks}</span>
                        {dipilih && <span className={styles.optionCheck} aria-hidden="true">✓</span>}
                      </label>
                    );
                  })}
                </div>
              )}
              <div className={styles.answerState}>
                <span className={soalSudahDijawab(soalAktif.id) ? styles.answeredDot : styles.unansweredDot} />
                {soalSudahDijawab(soalAktif.id) ? "Jawaban tersimpan di perangkat ini" : "Belum dijawab"}
              </div>
            </section>
          )}

          {error && <p className={styles.inlineError} role="alert">{error}</p>}

          <nav className={styles.navigationDock} aria-label="Navigasi soal">
            <button className={styles.dockAction} type="button" onClick={() => pilihNomorSoal(Math.max(0, indeksSoal - 1))} disabled={indeksSoal === 0}>
              <span aria-hidden="true">←</span><small>Sebelumnya</small>
            </button>
            <button className={styles.dockAction} type="button" onClick={() => setDaftarSoalTerbuka(true)}>
              <span aria-hidden="true">☷</span><small>Daftar soal</small><i>{jumlahDijawab}/{asesmen.soal.length}</i>
            </button>
            <button className={`${styles.dockAction} ${styles.finishAction}`} type="button" onClick={() => void kirimJawaban(waktuHabis)} disabled={sedangKirim}>
              <span aria-hidden="true">{sedangKirim ? "…" : "↗"}</span><small>{sedangKirim ? "Mengirim" : waktuHabis ? "Coba lagi" : "Selesai"}</small>
            </button>
          </nav>

          {daftarSoalTerbuka && (
            <div className={styles.sheetOverlay} onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
              if (event.target === event.currentTarget) setDaftarSoalTerbuka(false);
            }}>
              <section className={styles.questionSheet} role="dialog" aria-modal="true" aria-labelledby="question-sheet-title">
                <div className={styles.sheetHandle} />
                <header className={styles.sheetHeader}>
                  <div><h2 id="question-sheet-title">Daftar soal</h2><p>{jumlahDijawab} dari {asesmen.soal.length} sudah dijawab</p></div>
                  <button type="button" onClick={() => setDaftarSoalTerbuka(false)} aria-label="Tutup daftar soal">×</button>
                </header>
                <div className={styles.questionGrid}>
                  {asesmen.soal.map((soal, nomor) => {
                    const aktif = nomor === indeksSoal;
                    const terjawab = soalSudahDijawab(soal.id);
                    return (
                      <button
                        aria-current={aktif ? "step" : undefined}
                        aria-label={`Soal ${nomor + 1}${terjawab ? ", sudah dijawab" : ", belum dijawab"}`}
                        className={`${styles.questionJump} ${aktif ? styles.questionJumpActive : ""} ${terjawab ? styles.questionJumpAnswered : ""}`}
                        key={soal.id}
                        onClick={() => pilihNomorSoal(nomor)}
                        type="button"
                      >
                        {nomor + 1}
                      </button>
                    );
                  })}
                </div>
                <div className={styles.sheetLegend}><span><i className={styles.legendCurrent} />Soal aktif</span><span><i className={styles.legendAnswered} />Sudah dijawab</span><span><i className={styles.legendEmpty} />Belum dijawab</span></div>
                <button className={styles.sheetFinish} onClick={() => { setDaftarSoalTerbuka(false); void kirimJawaban(waktuHabis); }} type="button">{waktuHabis ? "Coba kirim ulang" : "Selesai dan kumpulkan"}</button>
              </section>
            </div>
          )}
        </>
      )}
    </main>
  );
}