"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";

/* ==========================================================================
   COLORS
============================================================================ */

const WARNA = {
  navy: "#214F86",
  teal: "#73C5C5",
  blue: "#2F6FED",
  cyan: "#55C7DC",
  background: "#F5F8FC",
  white: "#FFFFFF",
  text: "#172033",
  secondary: "#6B7280",
  muted: "#94A3B8",
  border: "#E5EAF0",
  success: "#16A34A",
  danger: "#DC2626",
};

/* ==========================================================================
   TYPES
============================================================================ */

interface SiswaKelas {
  id: string;
  nama: string;
  nis: string;
  fotoProfil: string | null;
}

interface SiswaTersedia {
  id: string;
  nama: string;
  nis: string;
  fotoProfil: string | null;
  rombel?: {
    id: string;
    label: string;
  } | null;
}

interface GuruKelas {
  id: string;
  nama: string;
  fotoProfil: string | null;
  mapel: {
    id: string;
    nama: string;
  };
}

interface Pengumuman {
  id: string;
  isi: string;
  createdAt: string;
  guru: {
    id: string;
    nama: string;
  };
}

interface DetailKelas {
  id: string;
  judul: string;
  deskripsi: string | null;
  kodeKelas: string;
  siswa: SiswaKelas[];
  guru: GuruKelas[];
  pengumuman: Pengumuman[];
}

interface RombelRingkas {
  id: string;
  label: string;
}

interface MapelRingkas {
  id: string;
  nama: string;
}

interface StatistikKelas {
  aktivitasSiswa: {
    label: string;
    nilai: number;
  }[];

  aktivitasGuru: {
    mapel: string;
    jumlah: number;
  }[];
}

/* ==========================================================================
   PAGE
============================================================================ */

export default function HalamanDetailKelas() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const kelasId = params.id;

  /* ------------------------------------------------------------------------
     CLASS
  ------------------------------------------------------------------------ */

  const [kelas, setKelas] = useState<DetailKelas | null>(null);
  const [sedangMuat, setSedangMuat] = useState(true);

  /* ------------------------------------------------------------------------
     GENERAL
  ------------------------------------------------------------------------ */

  const [tersalin, setTersalin] = useState(false);
  const [pencarianSiswa, setPencarianSiswa] = useState("");

  /* ------------------------------------------------------------------------
     REFERENCES
  ------------------------------------------------------------------------ */

  const [daftarRombel, setDaftarRombel] = useState<
    RombelRingkas[]
  >([]);

  const [daftarMapel, setDaftarMapel] = useState<
    MapelRingkas[]
  >([]);

  /* ------------------------------------------------------------------------
     STUDENT MODAL
  ------------------------------------------------------------------------ */

  const [modalSiswaTerbuka, setModalSiswaTerbuka] =
    useState(false);

  const [rombelDipilih, setRombelDipilih] = useState("");

  const [siswaTersedia, setSiswaTersedia] = useState<
    SiswaTersedia[]
  >([]);

  const [sedangMuatSiswaTersedia, setSedangMuatSiswaTersedia] =
    useState(false);

  const [sedangTambahSiswa, setSedangTambahSiswa] =
    useState<string | null>(null);

  const [pencarianSiswaModal, setPencarianSiswaModal] =
    useState("");

  /* ------------------------------------------------------------------------
     TEACHER MODAL
  ------------------------------------------------------------------------ */

  const [modalGuruTerbuka, setModalGuruTerbuka] =
    useState(false);

  const [mapelDipilih, setMapelDipilih] = useState("");

  const [guruTersedia, setGuruTersedia] = useState<
    {
      id: string;
      nama: string;
      fotoProfil: string | null;
    }[]
  >([]);

  const [sedangMuatGuruTersedia, setSedangMuatGuruTersedia] =
    useState(false);

  const [sedangTambahGuru, setSedangTambahGuru] =
    useState<string | null>(null);

  /* ------------------------------------------------------------------------
     STATISTICS
  ------------------------------------------------------------------------ */

  const [statistik, setStatistik] =
    useState<StatistikKelas>({
      aktivitasSiswa: [],
      aktivitasGuru: [],
    });

  /* ==========================================================================
     LOAD DETAIL KELAS
  ========================================================================== */

  const muatDetailKelas = useCallback(async () => {
    setSedangMuat(true);

    try {
      const response = await fetch(
        `/api/kelas/${kelasId}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setKelas(data.data);
      } else {
        setKelas(null);
      }
    } catch (error) {
      console.error(error);
      setKelas(null);
    } finally {
      setSedangMuat(false);
    }
  }, [kelasId]);

  useEffect(() => {
    muatDetailKelas();
  }, [muatDetailKelas]);

  /* ==========================================================================
     LOAD REFERENSI
  ========================================================================== */

  useEffect(() => {
    async function muatReferensi() {
      try {
        const response = await fetch(
          "/api/kelas-referensi",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) return;

        setDaftarRombel(
          data.data?.rombel ?? []
        );

        setDaftarMapel(
          data.data?.mapel ?? []
        );
      } catch (error) {
        console.error(error);
      }
    }

    muatReferensi();
  }, []);

  /* ==========================================================================
     LOAD STATISTIK
  ========================================================================== */

  const muatStatistik = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/kelas/${kelasId}/statistik`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      setStatistik({
        aktivitasSiswa:
          data.data?.aktivitasSiswa ?? [],

        aktivitasGuru:
          data.data?.aktivitasGuru ?? [],
      });
    } catch (error) {
      console.error(error);
    }
  }, [kelasId]);

  useEffect(() => {
    muatStatistik();
  }, [muatStatistik]);

  /* ==========================================================================
     FILTER SISWA DALAM KELAS
  ========================================================================== */

  const siswaTerfilter = useMemo(() => {
    if (!kelas) return [];

    const keyword =
      pencarianSiswa.trim().toLowerCase();

    if (!keyword) {
      return kelas.siswa;
    }

    return kelas.siswa.filter((siswa) => {
      return (
        siswa.nama
          .toLowerCase()
          .includes(keyword) ||
        siswa.nis
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [kelas, pencarianSiswa]);

  /* ==========================================================================
     FILTER SISWA DI MODAL
  ========================================================================== */

  const siswaModalTerfilter = useMemo(() => {
    const keyword =
      pencarianSiswaModal
        .trim()
        .toLowerCase();

    if (!keyword) {
      return siswaTersedia;
    }

    return siswaTersedia.filter((siswa) => {
      return (
        siswa.nama
          .toLowerCase()
          .includes(keyword) ||
        siswa.nis
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [
    siswaTersedia,
    pencarianSiswaModal,
  ]);

  /* ==========================================================================
     STATISTIK RINGKAS
  ========================================================================== */

  const jumlahMapel = useMemo(() => {
    if (!kelas) return 0;

    return new Set(
      kelas.guru.map(
        (guru) => guru.mapel.id
      )
    ).size;
  }, [kelas]);

  const rataAktivitasSiswa = useMemo(() => {
    if (
      !statistik.aktivitasSiswa.length
    ) {
      return 0;
    }

    const total =
      statistik.aktivitasSiswa.reduce(
        (sum, item) =>
          sum + item.nilai,
        0
      );

    return Math.round(
      total /
        statistik.aktivitasSiswa.length
    );
  }, [statistik.aktivitasSiswa]);

  const totalAktivitasGuru = useMemo(() => {
    return statistik.aktivitasGuru.reduce(
      (sum, item) =>
        sum + item.jumlah,
      0
    );
  }, [statistik.aktivitasGuru]);

  /* ==========================================================================
     COPY INVITATION LINK
  ========================================================================== */

  async function salinLinkUndangan() {
    if (!kelas) return;

    try {
      const link =
        `${window.location.origin}/gabung-kelas/${kelas.kodeKelas}`;

      await navigator.clipboard.writeText(
        link
      );

      setTersalin(true);

      setTimeout(() => {
        setTersalin(false);
      }, 2200);
    } catch (error) {
      console.error(error);

      alert(
        "Tidak dapat menyalin link kelas."
      );
    }
  }

  /* ==========================================================================
     DELETE CLASS
  ========================================================================== */

  async function hapusKelas() {
    const yakin = confirm(
      "Yakin ingin menghapus kelas ini?\n\n" +
        "Semua data terkait siswa, guru, materi, asesmen, tugas, dan pengumuman akan ikut terhapus."
    );

    if (!yakin) return;

    try {
      const response = await fetch(
        `/api/kelas/${kelasId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        router.push("/admin/kelas");
        router.refresh();
      } else {
        const data =
          await response.json().catch(
            () => null
          );

        alert(
          data?.pesan ??
            "Gagal menghapus kelas."
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        "Terjadi kesalahan saat menghapus kelas."
      );
    }
  }

  /* ==========================================================================
     SISWA
  ========================================================================== */

  function bukaModalSiswa() {
    setModalSiswaTerbuka(true);
    setRombelDipilih("");
    setSiswaTersedia([]);
    setPencarianSiswaModal("");
  }

  function tutupModalSiswa() {
    setModalSiswaTerbuka(false);
    setRombelDipilih("");
    setSiswaTersedia([]);
    setPencarianSiswaModal("");
  }

  async function pilihRombel(
    rombelId: string
  ) {
    setRombelDipilih(rombelId);
    setPencarianSiswaModal("");

    if (!rombelId) {
      setSiswaTersedia([]);
      return;
    }

    setSedangMuatSiswaTersedia(true);

    try {
      /*
       * Kita gunakan API akun siswa yang sudah ada.
       * Kemudian siswa yang sudah tergabung dalam kelas
       * dikeluarkan dari daftar.
       */
      const response = await fetch(
        "/api/akun?tipe=SISWA",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setSiswaTersedia([]);
        return;
      }

      const siswaKelasIds = new Set(
        kelas?.siswa.map(
          (siswa) => siswa.id
        ) ?? []
      );

      const daftarSiswa =
        Array.isArray(data.data)
          ? data.data
          : [];

      const hasil =
        daftarSiswa
          .filter(
            (siswa: SiswaTersedia) =>
              siswa.rombel?.id ===
              rombelId
          )
          .filter(
            (siswa: SiswaTersedia) =>
              !siswaKelasIds.has(
                siswa.id
              )
          )
          .map(
            (siswa: SiswaTersedia) => ({
              id: String(
                siswa.id
              ),
              nama: String(
                siswa.nama ?? ""
              ),
              nis: String(
                siswa.nis ?? ""
              ),
              fotoProfil:
                siswa.fotoProfil ??
                null,
              rombel:
                siswa.rombel ??
                null,
            })
          );

      setSiswaTersedia(hasil);
    } catch (error) {
      console.error(error);
      setSiswaTersedia([]);
    } finally {
      setSedangMuatSiswaTersedia(
        false
      );
    }
  }

  async function tambahSiswa(
    siswaId: string
  ) {
    setSedangTambahSiswa(siswaId);

    try {
      const response = await fetch(
        `/api/kelas/${kelasId}/siswa`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            siswaId,
          }),
        }
      );

      const data =
        await response.json().catch(
          () => null
        );

      if (!response.ok) {
        alert(
          data?.pesan ??
            "Gagal menambahkan siswa."
        );

        return;
      }

      setSiswaTersedia(
        (prev) =>
          prev.filter(
            (siswa) =>
              siswa.id !== siswaId
          )
      );

      await muatDetailKelas();
      await muatStatistik();
    } catch (error) {
      console.error(error);

      alert(
        "Terjadi kesalahan saat menambahkan siswa."
      );
    } finally {
      setSedangTambahSiswa(null);
    }
  }

  async function keluarkanSiswa(
    siswaId: string
  ) {
    const siswa =
      kelas?.siswa.find(
        (item) =>
          item.id === siswaId
      );

    const yakin = confirm(
      `Keluarkan ${
        siswa?.nama ??
        "siswa ini"
      } dari kelas?`
    );

    if (!yakin) return;

    try {
      const response =
        await fetch(
          `/api/kelas/${kelasId}/siswa/${siswaId}`,
          {
            method: "DELETE",
          }
        );

      if (response.ok) {
        await muatDetailKelas();
        await muatStatistik();
      } else {
        const data =
          await response.json().catch(
            () => null
          );

        alert(
          data?.pesan ??
            "Gagal mengeluarkan siswa."
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        "Terjadi kesalahan saat mengeluarkan siswa."
      );
    }
  }

  /* ==========================================================================
     GURU
  ========================================================================== */

  function bukaModalGuru() {
    setModalGuruTerbuka(true);
    setMapelDipilih("");
    setGuruTersedia([]);
  }

  function tutupModalGuru() {
    setModalGuruTerbuka(false);
    setMapelDipilih("");
    setGuruTersedia([]);
  }

  async function pilihMapel(
    mapelId: string
  ) {
    setMapelDipilih(mapelId);

    if (!mapelId) {
      setGuruTersedia([]);
      return;
    }

    setSedangMuatGuruTersedia(
      true
    );

    try {
      const response =
        await fetch(
          `/api/kelas/${kelasId}/guru?mapelId=${mapelId}`,
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      setGuruTersedia(
        response.ok
          ? data.data ?? []
          : []
      );
    } catch (error) {
      console.error(error);
      setGuruTersedia([]);
    } finally {
      setSedangMuatGuruTersedia(
        false
      );
    }
  }

  async function tambahGuru(
    guruId: string
  ) {
    if (!mapelDipilih) return;

    setSedangTambahGuru(guruId);

    try {
      const response =
        await fetch(
          `/api/kelas/${kelasId}/guru`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              guruId,
              mapelId:
                mapelDipilih,
            }),
          }
        );

      const data =
        await response.json().catch(
          () => null
        );

      if (!response.ok) {
        alert(
          data?.pesan ??
            "Gagal menambahkan guru."
        );

        return;
      }

      setGuruTersedia(
        (prev) =>
          prev.filter(
            (guru) =>
              guru.id !== guruId
          )
      );

      await muatDetailKelas();
      await muatStatistik();
    } catch (error) {
      console.error(error);

      alert(
        "Terjadi kesalahan saat menambahkan guru."
      );
    } finally {
      setSedangTambahGuru(null);
    }
  }

  async function keluarkanGuru(
    guruId: string,
    mapelId: string
  ) {
    const yakin = confirm(
      "Keluarkan guru ini dari kelas untuk mata pelajaran tersebut?"
    );

    if (!yakin) return;

    try {
      const response =
        await fetch(
          `/api/kelas/${kelasId}/guru/${guruId}?mapelId=${mapelId}`,
          {
            method: "DELETE",
          }
        );

      if (response.ok) {
        await muatDetailKelas();
        await muatStatistik();
      } else {
        const data =
          await response.json().catch(
            () => null
          );

        alert(
          data?.pesan ??
            "Gagal mengeluarkan guru."
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        "Terjadi kesalahan saat mengeluarkan guru."
      );
    }
  }

  /* ==========================================================================
     LOADING
  ========================================================================== */

  if (sedangMuat) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingBox}>
          <div
            className={
              styles.loadingSpinner
            }
          />

          <div>
            <strong>
              Memuat detail kelas
            </strong>

            <span>
              Mohon tunggu sebentar...
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================================
     NOT FOUND
  ========================================================================== */

  if (!kelas) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.notFound}>
          <div
            className={
              styles.notFoundIcon
            }
          >
            !
          </div>

          <h2>
            Kelas tidak ditemukan
          </h2>

          <p>
            Data kelas mungkin sudah
            dihapus atau tidak tersedia.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/kelas"
              )
            }
            className={
              styles.primaryButton
            }
          >
            ← Kembali ke Daftar Kelas
          </button>
        </div>
      </div>
    );
  }

  /* ==========================================================================
     RENDER
  ========================================================================== */

  return (
    <main className={styles.page}>
      <div className={styles.container}>

        {/* ================================================================
            TOP BAR
        ================================================================= */}

        <div className={styles.topBar}>
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/kelas"
              )
            }
            className={styles.backButton}
          >
            <span>←</span>
            Kembali ke Daftar Kelas
          </button>

          <div
            className={
              styles.topBreadcrumb
            }
          >
            Admin
            <span>/</span>
            Kelas
            <span>/</span>
            <strong>Detail</strong>
          </div>
        </div>

        {/* ================================================================
            HERO
        ================================================================= */}

        <section className={styles.hero}>
          <div
            className={
              styles.heroGlow
            }
          />

          <div
            className={
              styles.heroContent
            }
          >
            <div
              className={
                styles.classLogo
              }
            >
              {kelas.judul
                .charAt(0)
                .toUpperCase()}
            </div>

            <div
              className={styles.heroInfo}
            >
              <div
                className={
                  styles.statusRow
                }
              >
                <span
                  className={
                    styles.statusBadge
                  }
                >
                  <span
                    className={
                      styles.statusDot
                    }
                  />
                  Kelas Aktif
                </span>

                <span
                  className={
                    styles.detailLabel
                  }
                >
                  DETAIL KELAS
                </span>
              </div>

              <h1>{kelas.judul}</h1>

              <p>
                {kelas.deskripsi ||
                  "Tidak ada deskripsi untuk kelas ini."}
              </p>

              <div
                className={
                  styles.codeWrapper
                }
              >
                <span
                  className={
                    styles.codeLabel
                  }
                >
                  KODE KELAS
                </span>

                <code>
                  {kelas.kodeKelas}
                </code>

                <button
                  type="button"
                  onClick={
                    salinLinkUndangan
                  }
                  className={
                    styles.copyButton
                  }
                >
                  {tersalin ? (
                    <>
                      <span>✓</span>
                      Tersalin
                    </>
                  ) : (
                    <>
                      <span>⧉</span>
                      Salin Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={hapusKelas}
            className={
              styles.deleteClassButton
            }
          >
            <span>⌫</span>
            Hapus Kelas
          </button>
        </section>

        {/* ================================================================
            SUMMARY
        ================================================================= */}

        <section
          className={
            styles.summaryGrid
          }
        >
          <SummaryCard
            icon="S"
            label="Total Siswa"
            value={kelas.siswa.length}
            description="Anggota kelas"
            variant="blue"
          />

          <SummaryCard
            icon="G"
            label="Guru Mengajar"
            value={kelas.guru.length}
            description="Guru terdaftar"
            variant="teal"
          />

          <SummaryCard
            icon="M"
            label="Mata Pelajaran"
            value={jumlahMapel}
            description="Mapel aktif"
            variant="navy"
          />

          <SummaryCard
            icon="A"
            label="Aktivitas Guru"
            value={
              totalAktivitasGuru
            }
            description="Aktivitas tercatat"
            variant="cyan"
          />
        </section>

        {/* ================================================================
            ANALYTICS
        ================================================================= */}

        <section
          className={
            styles.sectionBlock
          }
        >
          <div
            className={
              styles.sectionHeading
            }
          >
            <div>
              <div
                className={
                  styles.eyebrow
                }
              >
                PERFORMANCE MONITORING
              </div>

              <h2>
                Analitik Kelas
              </h2>

              <p>
                Pantau keaktifan siswa
                dan aktivitas pengajaran
                dalam kelas.
              </p>
            </div>

            <div
              className={
                styles.averageBadge
              }
            >
              <span>
                Rata-rata aktivitas siswa
              </span>

              <strong>
                {rataAktivitasSiswa}%
              </strong>
            </div>
          </div>

          <div
            className={
              styles.analyticsGrid
            }
          >
            {/* STUDENT CHART */}

            <div
              className={
                styles.analyticsCard
              }
            >
              <div
                className={
                  styles.analyticsHeader
                }
              >
                <div
                  className={
                    styles.analyticsTitle
                  }
                >
                  <div
                    className={
                      styles.chartIconBlue
                    }
                  >
                    ↗
                  </div>

                  <div>
                    <h3>
                      Aktivitas Siswa
                    </h3>

                    <p>
                      Keaktifan mengerjakan
                      tugas dan asesmen
                    </p>
                  </div>
                </div>

                <span
                  className={
                    styles.blueBadge
                  }
                >
                  Siswa
                </span>
              </div>

              {statistik
                .aktivitasSiswa
                .length > 0 ? (
                <StudentActivityChart
                  data={
                    statistik.aktivitasSiswa
                  }
                />
              ) : (
                <EmptyChart
                  icon="∿"
                  text="Data aktivitas siswa belum tersedia"
                />
              )}
            </div>

            {/* TEACHER CHART */}

            <div
              className={
                styles.analyticsCard
              }
            >
              <div
                className={
                  styles.analyticsHeader
                }
              >
                <div
                  className={
                    styles.analyticsTitle
                  }
                >
                  <div
                    className={
                      styles.chartIconTeal
                    }
                  >
                    ↗
                  </div>

                  <div>
                    <h3>
                      Aktivitas Guru
                    </h3>

                    <p>
                      Frekuensi pemberian
                      materi atau aktivitas
                      mapel
                    </p>
                  </div>
                </div>

                <span
                  className={
                    styles.tealBadge
                  }
                >
                  Guru
                </span>
              </div>

              {statistik
                .aktivitasGuru
                .length > 0 ? (
                <TeacherActivityChart
                  data={
                    statistik.aktivitasGuru
                  }
                />
              ) : (
                <EmptyChart
                  icon="∿"
                  text="Data aktivitas guru belum tersedia"
                />
              )}
            </div>
          </div>
        </section>

        {/* ================================================================
            STUDENT SECTION
        ================================================================= */}

        <section
          className={
            styles.contentCard
          }
        >
          <div
            className={
              styles.contentHeader
            }
          >
            <div>
              <div
                className={
                  styles.headingWithCount
                }
              >
                <h2>
                  Siswa dalam Kelas
                </h2>

                <span
                  className={
                    styles.countBadge
                  }
                >
                  {kelas.siswa.length}
                </span>
              </div>

              <p>
                Daftar siswa yang saat ini
                tergabung dalam kelas.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: "10px",
                flexWrap: "wrap",
                justifyContent:
                  "flex-end",
              }}
            >
              <div
                className={
                  styles.searchWrapper
                }
              >
                <span>⌕</span>

                <input
                  value={
                    pencarianSiswa
                  }
                  onChange={(event) =>
                    setPencarianSiswa(
                      event.target.value
                    )
                  }
                  placeholder="Cari nama atau NIS..."
                />
              </div>

              {/* ========================================================
                  TAMBAH SISWA
              ======================================================== */}

              <button
                type="button"
                onClick={
                  bukaModalSiswa
                }
                className={
                  styles.primaryButton
                }
              >
                <span>+</span>
                Tambah Siswa
              </button>
            </div>
          </div>

          {kelas.siswa.length === 0 ? (
            <EmptyState
              icon="S"
              title="Belum ada siswa"
              description="Belum ada siswa yang tergabung dalam kelas ini. Gunakan tombol Tambah Siswa untuk memasukkan siswa."
            />
          ) : siswaTerfilter.length ===
            0 ? (
            <EmptyState
              icon="⌕"
              title="Siswa tidak ditemukan"
              description={`Tidak ada siswa yang cocok dengan "${pencarianSiswa}".`}
            />
          ) : (
            <div
              className={
                styles.tableWrapper
              }
            >
              <table
                className={
                  styles.studentTable
                }
              >
                <thead>
                  <tr>
                    <th>#</th>
                    <th>SISWA</th>
                    <th>NIS</th>
                    <th>STATUS</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {siswaTerfilter.map(
                    (
                      siswa,
                      index
                    ) => (
                      <tr
                        key={
                          siswa.id
                        }
                      >
                        <td
                          className={
                            styles.numberCell
                          }
                        >
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </td>

                        <td>
                          <div
                            className={
                              styles.personCell
                            }
                          >
                            <Avatar
                              name={
                                siswa.nama
                              }
                              image={
                                siswa.fotoProfil
                              }
                              color={
                                WARNA.blue
                              }
                            />

                            <div>
                              <strong>
                                {
                                  siswa.nama
                                }
                              </strong>

                              <span>
                                Siswa kelas
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              styles.nisText
                            }
                          >
                            {siswa.nis}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              styles.activeBadge
                            }
                          >
                            <span />
                            Aktif
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className={
                              styles.removeButton
                            }
                            onClick={() =>
                              keluarkanSiswa(
                                siswa.id
                              )
                            }
                          >
                            Keluarkan
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {kelas.siswa.length >
            0 && (
            <div
              className={
                styles.tableFooter
              }
            >
              <span>
                Menampilkan{" "}
                <strong>
                  {
                    siswaTerfilter.length
                  }
                </strong>{" "}
                dari{" "}
                <strong>
                  {kelas.siswa.length}
                </strong>{" "}
                siswa
              </span>

              <span>
                Admin dapat menambahkan
                atau mengeluarkan siswa
                dari kelas.
              </span>
            </div>
          )}
        </section>

        {/* ================================================================
            TEACHER
        ================================================================= */}

        <section
          className={
            styles.contentCard
          }
        >
          <div
            className={
              styles.contentHeader
            }
          >
            <div>
              <div
                className={
                  styles.headingWithCount
                }
              >
                <h2>
                  Guru Pengajar
                </h2>

                <span
                  className={`${styles.countBadge} ${styles.countBadgeTeal}`}
                >
                  {kelas.guru.length}
                </span>
              </div>

              <p>
                Guru dan mata pelajaran
                yang mengajar pada kelas
                ini.
              </p>
            </div>

            <button
              type="button"
              onClick={
                bukaModalGuru
              }
              className={
                styles.primaryButton
              }
            >
              <span>+</span>
              Tambah Guru
            </button>
          </div>

          {kelas.guru.length ===
          0 ? (
            <EmptyState
              icon="G"
              title="Belum ada guru"
              description="Tambahkan guru dan mata pelajaran untuk kelas ini."
            />
          ) : (
            <div
              className={
                styles.teacherGrid
              }
            >
              {kelas.guru.map(
                (guru) => (
                  <div
                    key={`${guru.id}-${guru.mapel.id}`}
                    className={
                      styles.teacherItem
                    }
                  >
                    <Avatar
                      name={
                        guru.nama
                      }
                      image={
                        guru.fotoProfil
                      }
                      color={
                        WARNA.teal
                      }
                    />

                    <div
                      className={
                        styles.teacherInfo
                      }
                    >
                      <strong>
                        {guru.nama}
                      </strong>

                      <span>
                        {
                          guru
                            .mapel
                            .nama
                        }
                      </span>
                    </div>

                    <button
                      type="button"
                      className={
                        styles.iconRemove
                      }
                      title="Keluarkan guru"
                      onClick={() =>
                        keluarkanGuru(
                          guru.id,
                          guru.mapel
                            .id
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* ================================================================
            ANNOUNCEMENTS
        ================================================================= */}

        <section
          className={
            styles.contentCard
          }
        >
          <div
            className={
              styles.contentHeader
            }
          >
            <div>
              <div
                className={
                  styles.headingWithCount
                }
              >
                <h2>
                  Aktivitas Pengumuman
                </h2>

                <span
                  className={
                    styles.countBadge
                  }
                >
                  {
                    kelas
                      .pengumuman
                      .length
                  }
                </span>
              </div>

              <p>
                Riwayat pengumuman yang
                dibuat guru dalam kelas.
              </p>
            </div>
          </div>

          {kelas.pengumuman
            .length === 0 ? (
            <EmptyState
              icon="!"
              title="Belum ada pengumuman"
              description="Belum ada guru yang membuat pengumuman di kelas ini."
            />
          ) : (
            <div
              className={
                styles.announcementList
              }
            >
              {kelas.pengumuman.map(
                (pengumuman) => (
                  <article
                    key={
                      pengumuman.id
                    }
                    className={
                      styles.announcementItem
                    }
                  >
                    <div
                      className={
                        styles.announcementIcon
                      }
                    >
                      !
                    </div>

                    <div
                      className={
                        styles.announcementBody
                      }
                    >
                      <div
                        className={
                          styles.announcementMeta
                        }
                      >
                        <strong>
                          {
                            pengumuman
                              .guru
                              .nama
                          }
                        </strong>

                        <span>
                          {new Date(
                            pengumuman.createdAt
                          ).toLocaleString(
                            "id-ID",
                            {
                              dateStyle:
                                "medium",
                              timeStyle:
                                "short",
                            }
                          )}
                        </span>
                      </div>

                      <p>
                        {
                          pengumuman.isi
                        }
                      </p>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>

        {/* ================================================================
            FOOTER
        ================================================================= */}

        <footer
          className={
            styles.footer
          }
        >
          <span>
            CNEdu • Classroom
            Management
          </span>

          <span>
            ID Kelas: {kelas.id}
          </span>
        </footer>
      </div>

      {/* ================================================================
          MODAL TAMBAH SISWA
      ================================================================= */}

      {modalSiswaTerbuka && (
        <div
          className={
            styles.overlay
          }
          onClick={
            tutupModalSiswa
          }
        >
          <div
            className={
              styles.modal
            }
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div
              className={
                styles.modalHeader
              }
            >
              <div>
                <span
                  className={
                    styles.modalEyebrow
                  }
                >
                  CLASS MANAGEMENT
                </span>

                <h3>
                  Tambah Siswa
                </h3>

                <p>
                  Pilih rombel untuk
                  melihat siswa yang
                  belum tergabung dalam
                  kelas ini.
                </p>
              </div>

              <button
                type="button"
                className={
                  styles.modalClose
                }
                onClick={
                  tutupModalSiswa
                }
              >
                ×
              </button>
            </div>

            {/* ROMBEL */}

            <label
              className={
                styles.selectLabel
              }
            >
              Rombel

              <select
                value={
                  rombelDipilih
                }
                onChange={(event) =>
                  pilihRombel(
                    event.target
                      .value
                  )
                }
              >
                <option value="">
                  Pilih rombel...
                </option>

                {daftarRombel.map(
                  (rombel) => (
                    <option
                      key={
                        rombel.id
                      }
                      value={
                        rombel.id
                      }
                    >
                      {
                        rombel.label
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            {/* SEARCH DALAM MODAL */}

            {rombelDipilih && (
              <div
                className={
                  styles.modalSearch
                }
              >
                <span>⌕</span>

                <input
                  value={
                    pencarianSiswaModal
                  }
                  onChange={(
                    event
                  ) =>
                    setPencarianSiswaModal(
                      event.target
                        .value
                    )
                  }
                  placeholder="Cari siswa..."
                />
              </div>
            )}

            {/* CONTENT */}

            {!rombelDipilih ? (
              <div
                className={
                  styles.modalEmpty
                }
              >
                <div
                  className={
                    styles.modalEmptyIcon
                  }
                >
                  S
                </div>

                <strong>
                  Pilih rombel
                  terlebih dahulu
                </strong>

                <span>
                  Setelah memilih
                  rombel, daftar siswa
                  yang tersedia akan
                  muncul di sini.
                </span>
              </div>
            ) : sedangMuatSiswaTersedia ? (
              <div
                className={
                  styles.modalLoading
                }
              >
                <div
                  className={
                    styles.smallSpinner
                  }
                />

                Mencari siswa
                tersedia...
              </div>
            ) : siswaTersedia.length ===
              0 ? (
              <div
                className={
                  styles.modalEmpty
                }
              >
                <div
                  className={
                    styles.modalEmptyIcon
                  }
                >
                  ✓
                </div>

                <strong>
                  Tidak ada siswa
                  tersedia
                </strong>

                <span>
                  Semua siswa dari
                  rombel ini mungkin
                  sudah tergabung
                  dalam kelas.
                </span>
              </div>
            ) : siswaModalTerfilter.length ===
              0 ? (
              <div
                className={
                  styles.modalEmpty
                }
              >
                <div
                  className={
                    styles.modalEmptyIcon
                  }
                >
                  ⌕
                </div>

                <strong>
                  Siswa tidak
                  ditemukan
                </strong>

                <span>
                  Tidak ada siswa
                  yang cocok dengan
                  pencarian.
                </span>
              </div>
            ) : (
              <div
                className={
                  styles.modalList
                }
              >
                {siswaModalTerfilter.map(
                  (siswa) => (
                    <div
                      key={
                        siswa.id
                      }
                      className={
                        styles.modalPerson
                      }
                    >
                      <Avatar
                        name={
                          siswa.nama
                        }
                        image={
                          siswa.fotoProfil
                        }
                        color={
                          WARNA.blue
                        }
                      />

                      <div>
                        <strong>
                          {
                            siswa.nama
                          }
                        </strong>

                        <span>
                          NIS:{" "}
                          {siswa.nis}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={
                          styles.modalAddButton
                        }
                        disabled={
                          sedangTambahSiswa ===
                          siswa.id
                        }
                        onClick={() =>
                          tambahSiswa(
                            siswa.id
                          )
                        }
                      >
                        {sedangTambahSiswa ===
                        siswa.id
                          ? "Menambahkan..."
                          : "Tambah"}
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

            <button
              type="button"
              className={
                styles.modalDone
              }
              onClick={
                tutupModalSiswa
              }
            >
              Selesai
            </button>
          </div>
        </div>
      )}

      {/* ================================================================
          MODAL TAMBAH GURU
      ================================================================= */}

      {modalGuruTerbuka && (
        <div
          className={
            styles.overlay
          }
          onClick={
            tutupModalGuru
          }
        >
          <div
            className={
              styles.modal
            }
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div
              className={
                styles.modalHeader
              }
            >
              <div>
                <span
                  className={
                    styles.modalEyebrow
                  }
                >
                  CLASS MANAGEMENT
                </span>

                <h3>
                  Tambah Guru
                </h3>

                <p>
                  Pilih mata pelajaran
                  untuk melihat guru yang
                  tersedia.
                </p>
              </div>

              <button
                type="button"
                className={
                  styles.modalClose
                }
                onClick={
                  tutupModalGuru
                }
              >
                ×
              </button>
            </div>

            <label
              className={
                styles.selectLabel
              }
            >
              Mata Pelajaran

              <select
                value={
                  mapelDipilih
                }
                onChange={(event) =>
                  pilihMapel(
                    event.target
                      .value
                  )
                }
              >
                <option value="">
                  Pilih mata pelajaran...
                </option>

                {daftarMapel.map(
                  (mapel) => (
                    <option
                      key={
                        mapel.id
                      }
                      value={
                        mapel.id
                      }
                    >
                      {mapel.nama}
                    </option>
                  )
                )}
              </select>
            </label>

            {sedangMuatGuruTersedia ? (
              <div
                className={
                  styles.modalLoading
                }
              >
                <div
                  className={
                    styles.smallSpinner
                  }
                />

                Mencari guru
                tersedia...
              </div>
            ) : !mapelDipilih ? (
              <div
                className={
                  styles.modalEmpty
                }
              >
                <div
                  className={
                    styles.modalEmptyIcon
                  }
                >
                  G
                </div>

                <strong>
                  Pilih mata
                  pelajaran
                </strong>

                <span>
                  Pilih mata pelajaran
                  untuk melihat guru yang
                  tersedia.
                </span>
              </div>
            ) : guruTersedia.length ===
              0 ? (
              <div
                className={
                  styles.modalEmpty
                }
              >
                <div
                  className={
                    styles.modalEmptyIcon
                  }
                >
                  !
                </div>

                <strong>
                  Tidak ada guru
                  tersedia
                </strong>

                <span>
                  Tidak ada guru yang
                  tersedia untuk mata
                  pelajaran ini.
                </span>
              </div>
            ) : (
              <div
                className={
                  styles.modalList
                }
              >
                {guruTersedia.map(
                  (guru) => (
                    <div
                      key={
                        guru.id
                      }
                      className={
                        styles.modalPerson
                      }
                    >
                      <Avatar
                        name={
                          guru.nama
                        }
                        image={
                          guru.fotoProfil
                        }
                        color={
                          WARNA.teal
                        }
                      />

                      <div>
                        <strong>
                          {guru.nama}
                        </strong>

                        <span>
                          {daftarMapel.find(
                            (
                              mapel
                            ) =>
                              mapel.id ===
                              mapelDipilih
                          )
                            ?.nama ??
                            "Guru"}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={
                          styles.modalAddButton
                        }
                        disabled={
                          sedangTambahGuru ===
                          guru.id
                        }
                        onClick={() =>
                          tambahGuru(
                            guru.id
                          )
                        }
                      >
                        {sedangTambahGuru ===
                        guru.id
                          ? "Menambahkan..."
                          : "Tambah"}
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

            <button
              type="button"
              className={
                styles.modalDone
              }
              onClick={
                tutupModalGuru
              }
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

/* ==========================================================================
   SUMMARY CARD
============================================================================ */

function SummaryCard({
  icon,
  label,
  value,
  description,
  variant,
}: {
  icon: string;
  label: string;
  value: number;
  description: string;
  variant:
    | "blue"
    | "teal"
    | "navy"
    | "cyan";
}) {
  return (
    <div
      className={`${styles.summaryCard} ${
        styles[`summary_${variant}`]
      }`}
    >
      <div
        className={
          styles.summaryIcon
        }
      >
        {icon}
      </div>

      <div
        className={
          styles.summaryContent
        }
      >
        <span>{label}</span>

        <strong>{value}</strong>

        <small>
          {description}
        </small>
      </div>

      <div
        className={
          styles.summaryArrow
        }
      >
        ↗
      </div>
    </div>
  );
}

/* ==========================================================================
   AVATAR
============================================================================ */

function Avatar({
  name,
  image,
  color,
}: {
  name: string;
  image: string | null;
  color: string;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={
          styles.avatar
        }
      />
    );
  }

  return (
    <div
      className={
        styles.avatar
      }
      style={{
        backgroundColor: `${color}18`,
        color,
      }}
    >
      {name
        .charAt(0)
        .toUpperCase()}
    </div>
  );
}

/* ==========================================================================
   EMPTY STATE
============================================================================ */

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className={
        styles.emptyState
      }
    >
      <div
        className={
          styles.emptyIcon
        }
      >
        {icon}
      </div>

      <strong>{title}</strong>

      <p>{description}</p>
    </div>
  );
}

/* ==========================================================================
   EMPTY CHART
============================================================================ */

function EmptyChart({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {
  return (
    <div
      className={
        styles.emptyChart
      }
    >
      <div
        className={
          styles.emptyChartIcon
        }
      >
        {icon}
      </div>

      <span>{text}</span>
    </div>
  );
}

/* ==========================================================================
   STUDENT ACTIVITY CHART
============================================================================ */

function StudentActivityChart({
  data,
}: {
  data: {
    label: string;
    nilai: number;
  }[];
}) {
  return (
    <div
      className={
        styles.studentChart
      }
    >
      <div
        className={
          styles.chartYAxis
        }
      >
        <span>100%</span>
        <span>75%</span>
        <span>50%</span>
        <span>25%</span>
        <span>0%</span>
      </div>

      <div
        className={
          styles.chartMain
        }
      >
        <div
          className={
            styles.chartGridLines
          }
        >
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div
          className={
            styles.chartColumns
          }
        >
          {data.map(
            (
              item,
              index
            ) => {
              const nilai =
                Math.max(
                  0,
                  Math.min(
                    item.nilai,
                    100
                  )
                );

              return (
                <div
                  className={
                    styles.chartColumn
                  }
                  key={`${item.label}-${index}`}
                >
                  <div
                    className={
                      styles.chartTooltip
                    }
                  >
                    {nilai}%
                  </div>

                  <div
                    className={
                      styles.barArea
                    }
                  >
                    <div
                      className={
                        styles.studentBar
                      }
                      style={{
                        height: `${Math.max(
                          nilai,
                          4
                        )}%`,
                      }}
                    >
                      <span />
                    </div>
                  </div>

                  <span
                    className={
                      styles.chartLabel
                    }
                  >
                    {item.label}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   TEACHER ACTIVITY CHART
============================================================================ */

function TeacherActivityChart({
  data,
}: {
  data: {
    mapel: string;
    jumlah: number;
  }[];
}) {
  const max = Math.max(
    ...data.map(
      (item) => item.jumlah
    ),
    1
  );

  return (
    <div
      className={
        styles.teacherChart
      }
    >
      {data.map(
        (
          item,
          index
        ) => {
          const percentage =
            (item.jumlah /
              max) *
            100;

          return (
            <div
              className={
                styles.teacherChartRow
              }
              key={`${item.mapel}-${index}`}
            >
              <div
                className={
                  styles.teacherSubject
                }
              >
                <span
                  className={
                    styles.teacherSubjectIcon
                  }
                >
                  M
                </span>

                <span
                  title={
                    item.mapel
                  }
                >
                  {item.mapel}
                </span>
              </div>

              <div
                className={
                  styles.teacherTrack
                }
              >
                <div
                  className={
                    styles.teacherFill
                  }
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>

              <strong>
                {item.jumlah}
              </strong>
            </div>
          );
        }
      )}

      <div
        className={
          styles.chartLegend
        }
      >
        <span
          className={
            styles.legendDot
          }
        />

        Jumlah aktivitas berdasarkan
        mata pelajaran
      </div>
    </div>
  );
}