"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const WARNA_PRIMARY = "#2196f3";

type TipeSoal = "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";

interface Opsi {
  id: string;
  teks: string;
  benar: boolean;
}

interface Soal {
  id: string;
  tipe: TipeSoal;
  pertanyaan: string;
  opsi: Opsi[];
}

interface KelasRingkas {
  id: string;
  judul: string;
}

interface DetailAsesmen {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  status: "PROSES" | "SELESAI";
  durasiMenit: number | null;
  mapel: {
    id: string;
    nama: string;
  };
  soal: Soal[];
  kelasTujuan: KelasRingkas[];
}

export default function HalamanDetailAsesmen() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const asesmenId = params.id;

  const [asesmen, setAsesmen] = useState<DetailAsesmen | null>(null);
  const [sedangMuat, setSedangMuat] = useState(true);
  const [pesanError, setPesanError] = useState<string | null>(null);

  /* =========================
     MODAL SOAL
  ========================= */

  const [modalSoalTerbuka, setModalSoalTerbuka] = useState(false);

  const [tipeSoalBaru, setTipeSoalBaru] =
    useState<TipeSoal>("PILIHAN_GANDA");

  const [pertanyaanBaru, setPertanyaanBaru] = useState("");

  const [opsiBaru, setOpsiBaru] = useState<
    { teks: string; benar: boolean }[]
  >([
    { teks: "", benar: false },
    { teks: "", benar: false },
  ]);

  const [sedangSimpanSoal, setSedangSimpanSoal] = useState(false);
  const [pesanErrorSoal, setPesanErrorSoal] = useState<string | null>(null);

  /* =========================
     MODAL KELAS
  ========================= */

  const [modalKelasTerbuka, setModalKelasTerbuka] = useState(false);
  const [kelasSaya, setKelasSaya] = useState<KelasRingkas[]>([]);
  const [sedangMuatKelas, setSedangMuatKelas] = useState(false);

  /* =========================
     FINALISASI
  ========================= */

  const [sedangFinalisasi, setSedangFinalisasi] = useState(false);

  /* =========================
     LOAD DETAIL
  ========================= */

  const muatDetail = useCallback(async () => {
    setSedangMuat(true);
    setPesanError(null);

    try {
      const response = await fetch(`/api/asesmen/${asesmenId}`);

      const data = await response.json();

      if (!response.ok) {
        setPesanError(data.pesan ?? "Gagal memuat asesmen.");
        return;
      }

      setAsesmen(data.data);
    } catch {
      setPesanError("Tidak dapat terhubung ke server.");
    } finally {
      setSedangMuat(false);
    }
  }, [asesmenId]);

  useEffect(() => {
    muatDetail();
  }, [muatDetail]);

  /* =========================
     MODAL SOAL
  ========================= */

  function bukaModalSoal() {
    setPertanyaanBaru("");
    setTipeSoalBaru("PILIHAN_GANDA");

    setOpsiBaru([
      { teks: "", benar: false },
      { teks: "", benar: false },
    ]);

    setPesanErrorSoal(null);
    setModalSoalTerbuka(true);
  }

  function tambahBarisOpsi() {
    setOpsiBaru((prev) => [
      ...prev,
      {
        teks: "",
        benar: false,
      },
    ]);
  }

  function hapusBarisOpsi(index: number) {
    setOpsiBaru((prev) => prev.filter((_, i) => i !== index));
  }

  function ubahTeksOpsi(index: number, teks: string) {
    setOpsiBaru((prev) =>
      prev.map((o, i) =>
        i === index
          ? {
              ...o,
              teks,
            }
          : o
      )
    );
  }

  function toggleBenarOpsi(index: number) {
    setOpsiBaru((prev) =>
      prev.map((o, i) => {
        if (tipeSoalBaru === "PILIHAN_GANDA") {
          return {
            ...o,
            benar: i === index,
          };
        }

        return i === index
          ? {
              ...o,
              benar: !o.benar,
            }
          : o;
      })
    );
  }

  async function simpanSoal() {
    setPesanErrorSoal(null);

    if (!pertanyaanBaru.trim()) {
      setPesanErrorSoal("Pertanyaan wajib diisi.");
      return;
    }

    if (tipeSoalBaru !== "ESSAY") {
      const opsiValid = opsiBaru.filter((o) => o.teks.trim());

      if (opsiValid.length < 2) {
        setPesanErrorSoal("Minimal harus ada 2 opsi jawaban.");
        return;
      }

      const adaJawabanBenar = opsiValid.some((o) => o.benar);

      if (!adaJawabanBenar) {
        setPesanErrorSoal("Tentukan minimal satu jawaban yang benar.");
        return;
      }
    }

    setSedangSimpanSoal(true);

    try {
      const response = await fetch(
        `/api/asesmen/${asesmenId}/soal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tipe: tipeSoalBaru,
            pertanyaan: pertanyaanBaru.trim(),
            opsi:
              tipeSoalBaru === "ESSAY"
                ? undefined
                : opsiBaru
                    .filter((o) => o.teks.trim())
                    .map((o) => ({
                      teks: o.teks.trim(),
                      benar: o.benar,
                    })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setPesanErrorSoal(
          data.pesan ?? "Gagal menyimpan soal."
        );
        return;
      }

      setModalSoalTerbuka(false);

      await muatDetail();
    } catch {
      setPesanErrorSoal(
        "Tidak dapat terhubung ke server."
      );
    } finally {
      setSedangSimpanSoal(false);
    }
  }

  async function hapusSoal(soalId: string) {
    const yakin = confirm(
      "Hapus soal ini?\n\nSoal yang sudah dihapus tidak dapat dikembalikan."
    );

    if (!yakin) return;

    try {
      const response = await fetch(
        `/api/asesmen/${asesmenId}/soal/${soalId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await muatDetail();
      } else {
        const data = await response.json();
        alert(data.pesan ?? "Gagal menghapus soal.");
      }
    } catch {
      alert("Tidak dapat terhubung ke server.");
    }
  }

  /* =========================
     KELAS
  ========================= */

  async function bukaModalKelas() {
    setModalKelasTerbuka(true);
    setSedangMuatKelas(true);

    try {
      const response = await fetch("/api/guru/kelas");

      const data = await response.json();

      setKelasSaya(
        response.ok && Array.isArray(data.data)
          ? data.data
          : []
      );
    } catch {
      setKelasSaya([]);
    } finally {
      setSedangMuatKelas(false);
    }
  }

  async function tambahKelasTujuan(kelasId: string) {
    try {
      const response = await fetch(
        `/api/asesmen/${asesmenId}/kirim-ke-kelas`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kelasId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.pesan ??
            "Gagal menambahkan kelas."
        );
        return;
      }

      await muatDetail();
    } catch {
      alert("Tidak dapat terhubung ke server.");
    }
  }

  /* =========================
     FINALISASI
  ========================= */

  async function finalisasiAsesmen() {
    if (!asesmen) return;

    if (asesmen.soal.length === 0) {
      alert(
        "Tambahkan minimal satu soal sebelum finalisasi asesmen."
      );
      return;
    }

    if (asesmen.kelasTujuan.length === 0) {
      alert(
        "Tambahkan minimal satu kelas tujuan sebelum finalisasi asesmen."
      );
      return;
    }

    const yakin = confirm(
      "Finalisasi asesmen ini?\n\nSetelah difinalisasi, asesmen akan masuk ke kelas tujuan dan siswa dapat mulai mengerjakannya."
    );

    if (!yakin) return;

    setSedangFinalisasi(true);

    try {
      const response = await fetch(
        `/api/asesmen/${asesmenId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            finalisasi: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.pesan ??
            "Gagal melakukan finalisasi."
        );
        return;
      }

      await muatDetail();
    } catch {
      alert("Tidak dapat terhubung ke server.");
    } finally {
      setSedangFinalisasi(false);
    }
  }

  /* =========================
     DERIVED DATA
  ========================= */

  const kelasBelumDitambah = useMemo(() => {
    if (!asesmen) return [];

    return kelasSaya.filter(
      (k) =>
        !asesmen.kelasTujuan.some(
          (kt) => kt.id === k.id
        )
    );
  }, [asesmen, kelasSaya]);

  const jumlahSoalObjektif = useMemo(() => {
    if (!asesmen) return 0;

    return asesmen.soal.filter(
      (s) => s.tipe !== "ESSAY"
    ).length;
  }, [asesmen]);

  const jumlahEssay = useMemo(() => {
    if (!asesmen) return 0;

    return asesmen.soal.filter(
      (s) => s.tipe === "ESSAY"
    ).length;
  }, [asesmen]);

  /* =========================
     LOADING / ERROR
  ========================= */

  if (sedangMuat) {
    return (
      <div style={estilo.loadingPage}>
        <div style={estilo.loadingCard}>
          <div style={estilo.spinner} />
          <p style={estilo.loadingText}>
            Memuat detail asesmen...
          </p>
        </div>
      </div>
    );
  }

  if (pesanError || !asesmen) {
    return (
      <div style={estilo.loadingPage}>
        <div style={estilo.errorCard}>
          <div style={estilo.errorIcon}>!</div>

          <h2 style={estilo.errorTitle}>
            Asesmen tidak ditemukan
          </h2>

          <p style={estilo.errorText}>
            {pesanError ??
              "Data asesmen tidak tersedia."}
          </p>

          <button
            onClick={() =>
              router.push("/guru/asesmen")
            }
            style={estilo.tombolPrimary}
          >
            Kembali ke Asesmen
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        button,
        input,
        textarea {
          font-family: inherit;
        }

        button:disabled {
          opacity: 0.55;
          cursor: not-allowed !important;
        }

        .cnedu-card-hover {
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            border-color 0.18s ease;
        }

        .cnedu-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.07);
          border-color: #dbeafe !important;
        }

        .cnedu-button {
          transition:
            transform 0.15s ease,
            box-shadow 0.15s ease,
            background 0.15s ease;
        }

        .cnedu-button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        @media (max-width: 760px) {
          .cnedu-header {
            flex-direction: column !important;
          }

          .cnedu-header-actions {
            width: 100%;
          }

          .cnedu-header-actions button {
            width: 100%;
          }

          .cnedu-stats {
            grid-template-columns: repeat(2, 1fr) !important;
          }

          .cnedu-question-header {
            flex-wrap: wrap !important;
          }

          .cnedu-question-delete {
            margin-left: 0 !important;
          }
        }

        @media (max-width: 480px) {
          .cnedu-page {
            padding: 16px !important;
          }

          .cnedu-stats {
            grid-template-columns: 1fr !important;
          }

          .cnedu-modal {
            padding: 18px !important;
          }
        }
      `}</style>

      <main
        className="cnedu-page"
        style={estilo.halaman}
      >
        {/* =================================
            TOP BAR
        ================================= */}

        <button
          onClick={() =>
            router.push("/guru/asesmen")
          }
          style={estilo.tombolKembali}
        >
          <span style={estilo.iconKembali}>←</span>
          Kembali ke Asesmen
        </button>

        {/* =================================
            HERO
        ================================= */}

        <section style={estilo.hero}>
          <div style={estilo.heroLeft}>
            <div style={estilo.iconAsesmen}>
              {asesmen.tipe === "KUIS"
                ? "✦"
                : "✓"}
            </div>

            <div style={estilo.heroInfo}>
              <div style={estilo.heroMeta}>
                <span
                  style={{
                    ...estilo.badgeTipe,
                    ...(asesmen.tipe === "KUIS"
                      ? estilo.badgeKuis
                      : estilo.badgeUjian),
                  }}
                >
                  {asesmen.tipe === "KUIS"
                    ? "KUIS"
                    : "UJIAN ONLINE"}
                </span>

                <span style={estilo.dot}>•</span>

                <span style={estilo.metaText}>
                  {asesmen.mapel.nama}
                </span>
              </div>

              <h1 style={estilo.judul}>
                {asesmen.judul}
              </h1>

              <p style={estilo.heroDescription}>
                Kelola soal, kelas tujuan, dan
                publikasi asesmen dari halaman ini.
              </p>
            </div>
          </div>

          <div
            className="cnedu-header-actions"
            style={estilo.heroRight}
          >
            <span
              style={{
                ...estilo.statusBadge,
                ...(asesmen.status === "SELESAI"
                  ? estilo.statusSelesai
                  : estilo.statusProses),
              }}
            >
              <span style={estilo.statusDot} />
              {asesmen.status === "SELESAI"
                ? "Sudah Dipublikasikan"
                : "Masih Disusun"}
            </span>

            {asesmen.status === "PROSES" && (
              <button
                className="cnedu-button"
                onClick={finalisasiAsesmen}
                disabled={
                  sedangFinalisasi ||
                  asesmen.soal.length === 0
                }
                style={estilo.tombolFinalisasi}
              >
                {sedangFinalisasi
                  ? "Memproses..."
                  : "✓ Finalisasi Asesmen"}
              </button>
            )}
          </div>
        </section>

        {/* =================================
            STATS
        ================================= */}

        <section
          className="cnedu-stats"
          style={estilo.statGrid}
        >
          <StatCard
            icon="?"
            label="Total Soal"
            value={asesmen.soal.length}
            description={`${jumlahSoalObjektif} objektif · ${jumlahEssay} essay`}
          />

          <StatCard
            icon="▣"
            label="Kelas Tujuan"
            value={asesmen.kelasTujuan.length}
            description={
              asesmen.kelasTujuan.length === 0
                ? "Belum ada kelas"
                : "kelas telah dipilih"
            }
          />

          <StatCard
            icon="◷"
            label="Durasi"
            value={
              asesmen.durasiMenit
                ? `${asesmen.durasiMenit}`
                : "—"
            }
            description={
              asesmen.durasiMenit
                ? "menit pengerjaan"
                : "Tanpa batas waktu"
            }
          />

          <StatCard
            icon="●"
            label="Status"
            value={
              asesmen.status === "SELESAI"
                ? "Aktif"
                : "Draft"
            }
            description={
              asesmen.status === "SELESAI"
                ? "Siswa dapat mengerjakan"
                : "Belum dipublikasikan"
            }
          />
        </section>

        {/* =================================
            WARNING DRAFT
        ================================= */}

        {asesmen.status === "PROSES" && (
          <div style={estilo.infoBanner}>
            <div style={estilo.infoBannerIcon}>
              !
            </div>

            <div>
              <strong style={estilo.infoBannerTitle}>
                Asesmen masih dalam tahap
                penyusunan
              </strong>

              <p style={estilo.infoBannerText}>
                Kamu masih dapat menambah,
                menghapus soal, dan memilih kelas
                tujuan. Finalisasi jika asesmen
                sudah siap diberikan kepada siswa.
              </p>
            </div>
          </div>
        )}

        {/* =================================
            KELAS TUJUAN
        ================================= */}

        <section style={estilo.section}>
          <div style={estilo.sectionHeader}>
            <div>
              <h2 style={estilo.sectionTitle}>
                Kelas Tujuan
              </h2>

              <p style={estilo.sectionDescription}>
                Tentukan kelas yang akan menerima
                asesmen ini.
              </p>
            </div>

            <button
              className="cnedu-button"
              onClick={bukaModalKelas}
              style={estilo.tombolOutline}
            >
              + Tambah Kelas
            </button>
          </div>

          {asesmen.kelasTujuan.length === 0 ? (
            <div style={estilo.emptyState}>
              <div style={estilo.emptyIcon}>
                ▣
              </div>

              <strong style={estilo.emptyTitle}>
                Belum ada kelas tujuan
              </strong>

              <p style={estilo.emptyText}>
                Tambahkan kelas agar asesmen dapat
                diberikan kepada siswa.
              </p>

              <button
                onClick={bukaModalKelas}
                style={estilo.tombolPrimarySmall}
              >
                + Tambah Kelas
              </button>
            </div>
          ) : (
            <div style={estilo.kelasGrid}>
              {asesmen.kelasTujuan.map(
                (kelas, index) => (
                  <div
                    key={kelas.id}
                    className="cnedu-card-hover"
                    style={estilo.kelasCard}
                  >
                    <div style={estilo.kelasIcon}>
                      {String.fromCharCode(
                        65 + (index % 26)
                      )}
                    </div>

                    <div style={estilo.kelasInfo}>
                      <strong
                        style={estilo.kelasNama}
                      >
                        {kelas.judul}
                      </strong>

                      <span
                        style={estilo.kelasStatus}
                      >
                        Tujuan asesmen
                      </span>
                    </div>

                    <span
                      style={estilo.checkKelas}
                    >
                      ✓
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* =================================
            SOAL
        ================================= */}

        <section style={estilo.section}>
          <div style={estilo.sectionHeader}>
            <div>
              <div style={estilo.sectionTitleRow}>
                <h2 style={estilo.sectionTitle}>
                  Daftar Soal
                </h2>

                <span
                  style={estilo.countBadge}
                >
                  {asesmen.soal.length}
                </span>
              </div>

              <p style={estilo.sectionDescription}>
                Susun pertanyaan dan jawaban
                untuk asesmen.
              </p>
            </div>

            {asesmen.status === "PROSES" && (
              <button
                className="cnedu-button"
                onClick={bukaModalSoal}
                style={estilo.tombolPrimary}
              >
                + Tambah Soal
              </button>
            )}
          </div>

          {asesmen.soal.length === 0 ? (
            <div style={estilo.emptyState}>
              <div style={estilo.emptyIcon}>
                ?
              </div>

              <strong style={estilo.emptyTitle}>
                Belum ada soal
              </strong>

              <p style={estilo.emptyText}>
                Mulai buat pertanyaan pertama untuk
                asesmen ini.
              </p>

              {asesmen.status === "PROSES" && (
                <button
                  onClick={bukaModalSoal}
                  style={
                    estilo.tombolPrimarySmall
                  }
                >
                  + Buat Soal Pertama
                </button>
              )}
            </div>
          ) : (
            <div style={estilo.daftarSoal}>
              {asesmen.soal.map(
                (soal, index) => (
                  <article
                    key={soal.id}
                    className="cnedu-card-hover"
                    style={estilo.kartuSoal}
                  >
                    <div
                      className="cnedu-question-header"
                      style={estilo.headerSoal}
                    >
                      <div
                        style={
                          estilo.nomorSoal
                        }
                      >
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      <div
                        style={
                          estilo.questionHeaderContent
                        }
                      >
                        <div
                          style={
                            estilo.questionMeta
                          }
                        >
                          <span
                            style={
                              estilo.tipeSoalBadge
                            }
                          >
                            {labelTipeSoal(
                              soal.tipe
                            )}
                          </span>

                          {soal.tipe !==
                            "ESSAY" && (
                            <span
                              style={
                                estilo.jumlahOpsi
                              }
                            >
                              {soal.opsi.length}{" "}
                              opsi
                            </span>
                          )}
                        </div>

                        <p
                          style={
                            estilo.teksPertanyaan
                          }
                        >
                          {soal.pertanyaan}
                        </p>
                      </div>

                      {asesmen.status ===
                        "PROSES" && (
                        <button
                          onClick={() =>
                            hapusSoal(soal.id)
                          }
                          style={
                            estilo.tombolHapusSoal
                          }
                        >
                          Hapus
                        </button>
                      )}
                    </div>

                    {soal.opsi.length > 0 && (
                      <div
                        style={estilo.opsiGrid}
                      >
                        {soal.opsi.map(
                          (opsi, opsiIndex) => (
                            <div
                              key={opsi.id}
                              style={{
                                ...estilo.opsiItem,
                                ...(opsi.benar
                                  ? estilo.opsiBenar
                                  : {}),
                              }}
                            >
                              <div
                                style={{
                                  ...estilo.hurufOpsi,
                                  ...(opsi.benar
                                    ? estilo.hurufOpsiBenar
                                    : {}),
                                }}
                              >
                                {String.fromCharCode(
                                  65 + opsiIndex
                                )}
                              </div>

                              <span
                                style={
                                  estilo.teksOpsi
                                }
                              >
                                {opsi.teks}
                              </span>

                              {opsi.benar && (
                                <span
                                  style={
                                    estilo.labelBenar
                                  }
                                >
                                  ✓ Benar
                                </span>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {soal.tipe ===
                      "ESSAY" && (
                      <div
                        style={
                          estilo.essayInfo
                        }
                      >
                        <span>✎</span>
                        Jawaban akan berupa teks
                        essay dan dinilai oleh guru.
                      </div>
                    )}
                  </article>
                )
              )}
            </div>
          )}
        </section>

        {/* =================================
            FOOTER ACTION
        ================================= */}

        <section style={estilo.bottomCard}>
          <div>
            <strong
              style={estilo.bottomTitle}
            >
              {asesmen.status === "SELESAI"
                ? "Asesmen sudah dipublikasikan"
                : "Sudah selesai menyusun asesmen?"}
            </strong>

            <p style={estilo.bottomText}>
              {asesmen.status === "SELESAI"
                ? "Siswa dari kelas tujuan dapat melihat dan mengerjakan asesmen ini."
                : "Pastikan soal dan kelas tujuan sudah benar sebelum melakukan finalisasi."}
            </p>
          </div>

          {asesmen.status === "PROSES" && (
            <button
              className="cnedu-button"
              onClick={finalisasiAsesmen}
              disabled={
                sedangFinalisasi ||
                asesmen.soal.length === 0 ||
                asesmen.kelasTujuan.length === 0
              }
              style={estilo.tombolFinalisasiBottom}
            >
              {sedangFinalisasi
                ? "Memproses..."
                : "✓ Finalisasi Asesmen"}
            </button>
          )}
        </section>
      </main>

      {/* =====================================
          MODAL TAMBAH SOAL
      ===================================== */}

      {modalSoalTerbuka && (
        <div
          style={estilo.overlay}
          onClick={() =>
            !sedangSimpanSoal &&
            setModalSoalTerbuka(false)
          }
        >
          <div
            className="cnedu-modal"
            style={estilo.modalLarge}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div style={estilo.modalHeader}>
              <div>
                <span
                  style={estilo.modalEyebrow}
                >
                  BUILDER SOAL
                </span>

                <h3
                  style={estilo.judulModal}
                >
                  Tambah Soal
                </h3>

                <p
                  style={estilo.modalDescription}
                >
                  Buat pertanyaan baru untuk
                  asesmen.
                </p>
              </div>

              <button
                onClick={() =>
                  setModalSoalTerbuka(false)
                }
                disabled={sedangSimpanSoal}
                style={estilo.tombolClose}
              >
                ×
              </button>
            </div>

            {/* TYPE */}
            <div style={estilo.fieldGroup}>
              <label style={estilo.fieldLabel}>
                Tipe Soal
              </label>

              <div style={estilo.typeGrid}>
                {(
                  [
                    "PILIHAN_GANDA",
                    "CHECKBOX",
                    "ESSAY",
                  ] as TipeSoal[]
                ).map((tipe) => {
                  const aktif =
                    tipeSoalBaru === tipe;

                  return (
                    <button
                      key={tipe}
                      type="button"
                      onClick={() => {
                        setTipeSoalBaru(tipe);

                        if (tipe === "ESSAY") {
                          setOpsiBaru([]);
                        } else if (
                          opsiBaru.length === 0
                        ) {
                          setOpsiBaru([
                            {
                              teks: "",
                              benar: false,
                            },
                            {
                              teks: "",
                              benar: false,
                            },
                          ]);
                        }
                      }}
                      style={{
                        ...estilo.typeButton,
                        ...(aktif
                          ? estilo.typeButtonAktif
                          : {}),
                      }}
                    >
                      <span
                        style={
                          estilo.typeIcon
                        }
                      >
                        {tipe ===
                        "PILIHAN_GANDA"
                          ? "A"
                          : tipe === "CHECKBOX"
                          ? "☑"
                          : "✎"}
                      </span>

                      <span>
                        {labelTipeSoal(tipe)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QUESTION */}
            <div style={estilo.fieldGroup}>
              <label
                style={estilo.fieldLabel}
              >
                Pertanyaan
              </label>

              <textarea
                value={pertanyaanBaru}
                onChange={(e) =>
                  setPertanyaanBaru(
                    e.target.value
                  )
                }
                rows={4}
                placeholder="Tulis pertanyaan..."
                style={estilo.textareaModern}
              />
            </div>

            {/* OPTIONS */}
            {tipeSoalBaru !== "ESSAY" && (
              <div style={estilo.fieldGroup}>
                <div
                  style={
                    estilo.optionTitleRow
                  }
                >
                  <label
                    style={
                      estilo.fieldLabel
                    }
                  >
                    Opsi Jawaban
                  </label>

                  <span
                    style={
                      estilo.optionHint
                    }
                  >
                    {tipeSoalBaru ===
                    "PILIHAN_GANDA"
                      ? "Pilih 1 jawaban benar"
                      : "Bisa memilih lebih dari 1"}
                  </span>
                </div>

                <div
                  style={estilo.optionList}
                >
                  {opsiBaru.map(
                    (opsi, index) => (
                      <div
                        key={index}
                        style={{
                          ...estilo.optionInputRow,
                          ...(opsi.benar
                            ? estilo.optionInputRowActive
                            : {}),
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            toggleBenarOpsi(
                              index
                            )
                          }
                          style={{
                            ...estilo.optionSelector,
                            ...(opsi.benar
                              ? estilo.optionSelectorActive
                              : {}),
                          }}
                        >
                          {opsi.benar
                            ? "✓"
                            : String.fromCharCode(
                                65 + index
                              )}
                        </button>

                        <input
                          type="text"
                          value={opsi.teks}
                          onChange={(e) =>
                            ubahTeksOpsi(
                              index,
                              e.target.value
                            )
                          }
                          placeholder={`Opsi ${String.fromCharCode(
                            65 + index
                          )}`}
                          style={
                            estilo.inputModern
                          }
                        />

                        {opsiBaru.length >
                          2 && (
                          <button
                            type="button"
                            onClick={() =>
                              hapusBarisOpsi(
                                index
                              )
                            }
                            style={
                              estilo.tombolHapusOpsi
                            }
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={tambahBarisOpsi}
                  style={
                    estilo.tombolTambahOpsi
                  }
                >
                  + Tambah opsi jawaban
                </button>
              </div>
            )}

            {tipeSoalBaru === "ESSAY" && (
              <div style={estilo.essayHintBox}>
                <span>✎</span>

                <div>
                  <strong>
                    Soal Essay
                  </strong>

                  <p>
                    Siswa akan mendapatkan kolom
                    teks untuk menuliskan jawaban.
                  </p>
                </div>
              </div>
            )}

            {pesanErrorSoal && (
              <div
                style={
                  estilo.errorInline
                }
              >
                <span>!</span>
                {pesanErrorSoal}
              </div>
            )}

            <div
              style={estilo.modalFooter}
            >
              <button
                onClick={() =>
                  setModalSoalTerbuka(false)
                }
                disabled={sedangSimpanSoal}
                style={estilo.tombolBatal}
              >
                Batal
              </button>

              <button
                onClick={simpanSoal}
                disabled={sedangSimpanSoal}
                className="cnedu-button"
                style={estilo.tombolSimpan}
              >
                {sedangSimpanSoal
                  ? "Menyimpan..."
                  : "Simpan Soal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================
          MODAL KELAS
      ===================================== */}

      {modalKelasTerbuka && (
        <div
          style={estilo.overlay}
          onClick={() =>
            setModalKelasTerbuka(false)
          }
        >
          <div
            className="cnedu-modal"
            style={estilo.modal}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div style={estilo.modalHeader}>
              <div>
                <span
                  style={estilo.modalEyebrow}
                >
                  DISTRIBUSI
                </span>

                <h3
                  style={estilo.judulModal}
                >
                  Kirim ke Kelas
                </h3>

                <p
                  style={estilo.modalDescription}
                >
                  Pilih kelas yang akan menerima
                  asesmen ini.
                </p>
              </div>

              <button
                onClick={() =>
                  setModalKelasTerbuka(false)
                }
                style={estilo.tombolClose}
              >
                ×
              </button>
            </div>

            {sedangMuatKelas ? (
              <div
                style={
                  estilo.modalLoading
                }
              >
                <div style={estilo.spinner} />
                <span>
                  Memuat kelas...
                </span>
              </div>
            ) : kelasBelumDitambah.length ===
              0 ? (
              <div style={estilo.emptyModal}>
                <div
                  style={estilo.emptyIcon}
                >
                  ✓
                </div>

                <strong>
                  Semua kelas sudah ditambahkan
                </strong>

                <p>
                  Tidak ada kelas lain yang dapat
                  dipilih.
                </p>
              </div>
            ) : (
              <div
                style={estilo.modalClassList}
              >
                {kelasBelumDitambah.map(
                  (kelas) => (
                    <div
                      key={kelas.id}
                      className="cnedu-card-hover"
                      style={
                        estilo.modalClassItem
                      }
                    >
                      <div
                        style={
                          estilo.modalClassIcon
                        }
                      >
                        ▣
                      </div>

                      <div
                        style={
                          estilo.modalClassInfo
                        }
                      >
                        <strong>
                          {kelas.judul}
                        </strong>

                        <span>
                          Kelas yang kamu ajar
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          tambahKelasTujuan(
                            kelas.id
                          )
                        }
                        style={
                          estilo.tombolTambahKelas
                        }
                      >
                        Tambah
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

            <div
              style={
                estilo.modalFooterSingle
              }
            >
              <button
                onClick={() =>
                  setModalKelasTerbuka(false)
                }
                style={estilo.tombolBatal}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* =====================================================
   COMPONENT STAT CARD
===================================================== */

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: string;
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div
      className="cnedu-card-hover"
      style={estilo.statCard}
    >
      <div style={estilo.statTop}>
        <div style={estilo.statIcon}>
          {icon}
        </div>

        <span style={estilo.statLabel}>
          {label}
        </span>
      </div>

      <strong style={estilo.statValue}>
        {value}
      </strong>

      <span style={estilo.statDescription}>
        {description}
      </span>
    </div>
  );
}

/* =====================================================
   HELPERS
===================================================== */

function labelTipeSoal(tipe: TipeSoal) {
  switch (tipe) {
    case "PILIHAN_GANDA":
      return "Pilihan Ganda";

    case "CHECKBOX":
      return "Checkbox";

    case "ESSAY":
      return "Essay";

    default:
      return tipe;
  }
}

/* =====================================================
   STYLES
===================================================== */

const estilo = {
  halaman: {
    minHeight: "100vh",
    padding: "28px 32px 50px",
    backgroundColor: "#f8fafc",
    color: "#111827",
  },

  /* LOADING */

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    padding: "24px",
  },

  loadingCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "32px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 8px 30px rgba(15,23,42,0.06)",
  },

  spinner: {
    width: "28px",
    height: "28px",
    border: `3px solid #e5e7eb`,
    borderTopColor: WARNA_PRIMARY,
    borderRadius: "50%",
  },

  loadingText: {
    margin: 0,
    color: "#6b7280",
    fontSize: "13px",
  },

  errorCard: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "32px",
    textAlign: "center" as const,
    boxShadow: "0 12px 40px rgba(15,23,42,0.08)",
  },

  errorIcon: {
    width: "48px",
    height: "48px",
    margin: "0 auto 16px",
    borderRadius: "50%",
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: 800,
  },

  errorTitle: {
    margin: "0 0 8px",
    fontSize: "18px",
    fontWeight: 800,
  },

  errorText: {
    margin: "0 0 20px",
    fontSize: "13px",
    color: "#6b7280",
    lineHeight: 1.6,
  },

  /* BACK */

  tombolKembali: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: 0,
    marginBottom: "20px",
    border: "none",
    background: "none",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },

  iconKembali: {
    fontSize: "18px",
    lineHeight: 1,
  },

  /* HERO */

  hero: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "24px",
    marginBottom: "18px",
    boxShadow:
      "0 5px 20px rgba(15,23,42,0.035)",
  },

  heroLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    minWidth: 0,
  },

  iconAsesmen: {
    width: "54px",
    height: "54px",
    flexShrink: 0,
    borderRadius: "14px",
    background:
      "linear-gradient(135deg, #2196f3, #60a5fa)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: 800,
    boxShadow:
      "0 8px 20px rgba(33,150,243,0.22)",
  },

  heroInfo: {
    minWidth: 0,
  },

  heroMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    flexWrap: "wrap" as const,
  },

  badgeTipe: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.04em",
  },

  badgeKuis: {
    backgroundColor: "#eff6ff",
    color: "#2563eb",
  },

  badgeUjian: {
    backgroundColor: "#f0fdf4",
    color: "#15803d",
  },

  dot: {
    color: "#cbd5e1",
    fontSize: "12px",
  },

  metaText: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 600,
  },

  judul: {
    margin: 0,
    fontSize: "25px",
    lineHeight: 1.2,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },

  heroDescription: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  heroRight: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-end",
    gap: "12px",
    flexShrink: 0,
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 700,
  },

  statusProses: {
    color: "#92400e",
    backgroundColor: "#fef3c7",
  },

  statusSelesai: {
    color: "#166534",
    backgroundColor: "#dcfce7",
  },

  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "currentColor",
  },

  tombolFinalisasi: {
    border: "none",
    borderRadius: "9px",
    padding: "10px 15px",
    backgroundColor: "#16a34a",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow:
      "0 5px 15px rgba(22,163,74,0.18)",
  },

  /* STATS */

  statGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "12px",
    marginBottom: "18px",
  },

  statCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "17px",
    minWidth: 0,
  },

  statTop: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
  },

  statIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    backgroundColor: "#eff6ff",
    color: WARNA_PRIMARY,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 800,
  },

  statLabel: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: 600,
  },

  statValue: {
    display: "block",
    fontSize: "22px",
    color: "#0f172a",
    lineHeight: 1,
    marginBottom: "6px",
  },

  statDescription: {
    fontSize: "10px",
    color: "#94a3b8",
  },

  /* INFO */

  infoBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px 16px",
    backgroundColor: "#eff6ff",
    border: "1px solid #dbeafe",
    borderRadius: "12px",
    marginBottom: "18px",
  },

  infoBannerIcon: {
    width: "26px",
    height: "26px",
    flexShrink: 0,
    borderRadius: "50%",
    backgroundColor: "#dbeafe",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 800,
  },

  infoBannerTitle: {
    display: "block",
    color: "#1e40af",
    fontSize: "12px",
    marginBottom: "3px",
  },

  infoBannerText: {
    margin: 0,
    color: "#3b82f6",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  /* SECTION */

  section: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "18px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "18px",
  },

  sectionTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 800,
    color: "#0f172a",
  },

  sectionDescription: {
    margin: "4px 0 0",
    fontSize: "11px",
    color: "#94a3b8",
  },

  countBadge: {
    minWidth: "24px",
    height: "24px",
    padding: "0 7px",
    borderRadius: "999px",
    backgroundColor: "#eff6ff",
    color: WARNA_PRIMARY,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 800,
  },

  tombolPrimary: {
    border: "none",
    borderRadius: "9px",
    padding: "10px 14px",
    backgroundColor: WARNA_PRIMARY,
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow:
      "0 5px 14px rgba(33,150,243,0.16)",
    flexShrink: 0,
  },

  tombolPrimarySmall: {
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    backgroundColor: WARNA_PRIMARY,
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  tombolOutline: {
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    padding: "8px 12px",
    backgroundColor: "#ffffff",
    color: WARNA_PRIMARY,
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
  },

  /* KELAS */

  kelasGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(230px, 1fr))",
    gap: "10px",
  },

  kelasCard: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "12px",
    border: "1px solid #e5e7eb",
    borderRadius: "11px",
    backgroundColor: "#ffffff",
  },

  kelasIcon: {
    width: "36px",
    height: "36px",
    flexShrink: 0,
    borderRadius: "9px",
    backgroundColor: "#eff6ff",
    color: WARNA_PRIMARY,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 800,
  },

  kelasInfo: {
    minWidth: 0,
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: "3px",
  },

  kelasNama: {
    fontSize: "12px",
    color: "#1e293b",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },

  kelasStatus: {
    fontSize: "10px",
    color: "#94a3b8",
  },

  checkKelas: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    backgroundColor: "#dcfce7",
    color: "#16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 800,
  },

  /* SOAL */

  daftarSoal: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "11px",
  },

  kartuSoal: {
    border: "1px solid #e5e7eb",
    borderRadius: "13px",
    padding: "16px",
    backgroundColor: "#ffffff",
  },

  headerSoal: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },

  nomorSoal: {
    width: "38px",
    height: "38px",
    flexShrink: 0,
    borderRadius: "9px",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 800,
  },

  questionHeaderContent: {
    flex: 1,
    minWidth: 0,
  },

  questionMeta: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    marginBottom: "7px",
  },

  tipeSoalBadge: {
    display: "inline-flex",
    padding: "4px 7px",
    borderRadius: "5px",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    fontSize: "9px",
    fontWeight: 800,
  },

  jumlahOpsi: {
    fontSize: "10px",
    color: "#94a3b8",
  },

  teksPertanyaan: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.55,
    color: "#0f172a",
    fontWeight: 600,
  },

  tombolHapusSoal: {
    marginLeft: "auto",
    flexShrink: 0,
    border: "none",
    background: "transparent",
    color: "#ef4444",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
    padding: "4px 6px",
  },

  opsiGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "7px",
    marginTop: "14px",
    paddingLeft: "50px",
  },

  opsiItem: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    minWidth: 0,
    padding: "9px 10px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    backgroundColor: "#fafafa",
  },

  opsiBenar: {
    borderColor: "#bbf7d0",
    backgroundColor: "#f0fdf4",
  },

  hurufOpsi: {
    width: "24px",
    height: "24px",
    flexShrink: 0,
    borderRadius: "6px",
    backgroundColor: "#e2e8f0",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "9px",
    fontWeight: 800,
  },

  hurufOpsiBenar: {
    backgroundColor: "#22c55e",
    color: "#ffffff",
  },

  teksOpsi: {
    flex: 1,
    minWidth: 0,
    color: "#334155",
    fontSize: "11px",
    lineHeight: 1.4,
  },

  labelBenar: {
    color: "#16a34a",
    fontSize: "9px",
    fontWeight: 800,
    whiteSpace: "nowrap" as const,
  },

  essayInfo: {
    marginTop: "12px",
    marginLeft: "50px",
    padding: "10px 12px",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "11px",
  },

  /* EMPTY */

  emptyState: {
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "34px 20px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    textAlign: "center" as const,
    backgroundColor: "#fafafa",
  },

  emptyIcon: {
    width: "42px",
    height: "42px",
    marginBottom: "10px",
    borderRadius: "11px",
    backgroundColor: "#eff6ff",
    color: WARNA_PRIMARY,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "17px",
  },

  emptyTitle: {
    fontSize: "13px",
    color: "#334155",
  },

  emptyText: {
    margin: "5px 0 13px",
    fontSize: "11px",
    color: "#94a3b8",
    maxWidth: "350px",
    lineHeight: 1.5,
  },

  /* BOTTOM */

  bottomCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    padding: "18px 20px",
    backgroundColor: "#0f172a",
    borderRadius: "14px",
    color: "#ffffff",
  },

  bottomTitle: {
    display: "block",
    fontSize: "13px",
    marginBottom: "4px",
  },

  bottomText: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  tombolFinalisasiBottom: {
    flexShrink: 0,
    border: "none",
    borderRadius: "8px",
    padding: "9px 14px",
    backgroundColor: "#22c55e",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  /* MODAL */

  overlay: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 100,
    padding: "20px",
    backgroundColor: "rgba(15,23,42,0.48)",
    backdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  modal: {
    width: "100%",
    maxWidth: "500px",
    maxHeight: "85vh",
    overflowY: "auto" as const,
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "22px",
    boxShadow:
      "0 25px 70px rgba(15,23,42,0.22)",
  },

  modalLarge: {
    width: "100%",
    maxWidth: "620px",
    maxHeight: "90vh",
    overflowY: "auto" as const,
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "22px",
    boxShadow:
      "0 25px 70px rgba(15,23,42,0.22)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
    marginBottom: "20px",
  },

  modalEyebrow: {
    display: "block",
    color: WARNA_PRIMARY,
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0.1em",
    marginBottom: "5px",
  },

  judulModal: {
    margin: 0,
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: 800,
  },

  modalDescription: {
    margin: "5px 0 0",
    color: "#94a3b8",
    fontSize: "11px",
  },

  tombolClose: {
    width: "30px",
    height: "30px",
    flexShrink: 0,
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    fontSize: "19px",
    cursor: "pointer",
    lineHeight: 1,
  },

  /* FIELD */

  fieldGroup: {
    marginBottom: "18px",
  },

  fieldLabel: {
    display: "block",
    marginBottom: "7px",
    color: "#334155",
    fontSize: "11px",
    fontWeight: 800,
  },

  typeGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "7px",
  },

  typeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    minHeight: "44px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#64748b",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  typeButtonAktif: {
    borderColor: "#93c5fd",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
  },

  typeIcon: {
    fontSize: "13px",
    fontWeight: 800,
  },

  textareaModern: {
    width: "100%",
    display: "block",
    padding: "11px 12px",
    border: "1px solid #dbe1e8",
    borderRadius: "9px",
    outline: "none",
    resize: "vertical" as const,
    color: "#0f172a",
    backgroundColor: "#ffffff",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  optionTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },

  optionHint: {
    fontSize: "9px",
    color: "#94a3b8",
  },

  optionList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
  },

  optionInputRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    backgroundColor: "#ffffff",
  },

  optionInputRowActive: {
    borderColor: "#86efac",
    backgroundColor: "#f0fdf4",
  },

  optionSelector: {
    width: "30px",
    height: "30px",
    flexShrink: 0,
    border: "none",
    borderRadius: "7px",
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  optionSelectorActive: {
    backgroundColor: "#22c55e",
    color: "#ffffff",
  },

  inputModern: {
    flex: 1,
    minWidth: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#0f172a",
    fontSize: "12px",
    padding: "6px 4px",
  },

  tombolHapusOpsi: {
    width: "28px",
    height: "28px",
    border: "none",
    background: "transparent",
    color: "#ef4444",
    fontSize: "18px",
    cursor: "pointer",
  },

  tombolTambahOpsi: {
    marginTop: "8px",
    border: "none",
    background: "transparent",
    color: WARNA_PRIMARY,
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
    padding: "3px 0",
  },

  essayHintBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px",
    borderRadius: "9px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: "11px",
  },

  errorInline: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    borderRadius: "8px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    fontSize: "11px",
    marginBottom: "15px",
  },

  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    marginTop: "20px",
    paddingTop: "16px",
    borderTop: "1px solid #f1f5f9",
  },

  modalFooterSingle: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "18px",
    paddingTop: "15px",
    borderTop: "1px solid #f1f5f9",
  },

  tombolBatal: {
    border: "1px solid #dbe1e8",
    borderRadius: "8px",
    padding: "9px 14px",
    backgroundColor: "#ffffff",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  tombolSimpan: {
    border: "none",
    borderRadius: "8px",
    padding: "9px 15px",
    backgroundColor: WARNA_PRIMARY,
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  /* MODAL KELAS */

  modalLoading: {
    minHeight: "180px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    color: "#94a3b8",
    fontSize: "11px",
  },

  emptyModal: {
    padding: "28px 15px",
    textAlign: "center" as const,
    color: "#64748b",
    fontSize: "11px",
  },

  modalClassList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    maxHeight: "420px",
    overflowY: "auto" as const,
  },

  modalClassItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
  },

  modalClassIcon: {
    width: "34px",
    height: "34px",
    flexShrink: 0,
    borderRadius: "8px",
    backgroundColor: "#eff6ff",
    color: WARNA_PRIMARY,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
  },

  modalClassInfo: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: "3px",
  },

  tombolTambahKelas: {
    border: "1px solid #bfdbfe",
    borderRadius: "7px",
    padding: "6px 10px",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },
};