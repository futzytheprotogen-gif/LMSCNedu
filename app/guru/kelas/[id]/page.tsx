"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const WARNA = {
  primary: "#2196f3",
  primaryDark: "#1976d2",
  primarySoft: "#e8f3fe",

  teal: "#70c1c4",
  tealSoft: "#e9f7f7",

  text: "#111827",
  textDark: "#0f172a",
  secondary: "#6b7280",
  muted: "#9ca3af",

  border: "#e5e7eb",
  background: "#f7f9fc",
  white: "#ffffff",

  danger: "#dc2626",
  dangerSoft: "#fef2f2",

  green: "#16a34a",
  greenSoft: "#f0fdf4",

  orange: "#f59e0b",
  orangeSoft: "#fff7ed",

  purple: "#6366f1",
  purpleSoft: "#eef2ff",
};

interface SiswaKelas {
  id: string;
  nama: string;
  nis: string;
}

interface GuruKelas {
  id: string;
  nama: string;
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
  siswa: SiswaKelas[];
  guru: GuruKelas[];
  pengumuman: Pengumuman[];
}

export default function HalamanDetailKelasGuru() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const kelasId = params.id;

  const [kelas, setKelas] = useState<DetailKelas | null>(null);
  const [sedangMuat, setSedangMuat] = useState(true);
  const [idGuruSaya, setIdGuruSaya] = useState<string | null>(null);

  const [isiPengumumanBaru, setIsiPengumumanBaru] =
    useState("");
  const [sedangPosting, setSedangPosting] = useState(false);

  const [idDiedit, setIdDiedit] = useState<string | null>(
    null
  );
  const [isiEdit, setIsiEdit] = useState("");

  const [pencarianSiswa, setPencarianSiswa] = useState("");

  const [tabAktif, setTabAktif] = useState<
    "beranda" | "siswa" | "pengajar"
  >("beranda");

  const muatDetail = useCallback(async () => {
    try {
      setSedangMuat(true);

      const response = await fetch(
        `/api/guru/kelas/${kelasId}`
      );

      const data = await response.json();

      if (response.ok) {
        setKelas(data.data);
      }
    } catch (error) {
      console.error(
        "Gagal memuat detail kelas:",
        error
      );
    } finally {
      setSedangMuat(false);
    }
  }, [kelasId]);

  useEffect(() => {
    muatDetail();
  }, [muatDetail]);

  useEffect(() => {
    fetch("/api/sesi")
      .then((r) => r.json())
      .then((data) => {
        setIdGuruSaya(data.data?.userId ?? null);
      })
      .catch(() => {
        setIdGuruSaya(null);
      });
  }, []);

  async function postPengumuman() {
    if (!isiPengumumanBaru.trim()) return;

    setSedangPosting(true);

    try {
      const response = await fetch("/api/pengumuman", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kelasId,
          isi: isiPengumumanBaru.trim(),
        }),
      });

      if (response.ok) {
        setIsiPengumumanBaru("");
        await muatDetail();
      }
    } catch (error) {
      console.error(
        "Gagal membuat pengumuman:",
        error
      );
    } finally {
      setSedangPosting(false);
    }
  }

  function mulaiEdit(p: Pengumuman) {
    setIdDiedit(p.id);
    setIsiEdit(p.isi);
  }

  async function simpanEdit(id: string) {
    if (!isiEdit.trim()) return;

    try {
      const response = await fetch(
        `/api/pengumuman/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isi: isiEdit.trim(),
          }),
        }
      );

      if (response.ok) {
        setIdDiedit(null);
        setIsiEdit("");
        await muatDetail();
      }
    } catch (error) {
      console.error(
        "Gagal mengedit pengumuman:",
        error
      );
    }
  }

  async function hapusPengumuman(id: string) {
    if (!confirm("Hapus pengumuman ini?")) return;

    try {
      const response = await fetch(
        `/api/pengumuman/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await muatDetail();
      }
    } catch (error) {
      console.error(
        "Gagal menghapus pengumuman:",
        error
      );
    }
  }

  const siswaFiltered =
    kelas?.siswa.filter((siswa) =>
      `${siswa.nama} ${siswa.nis}`
        .toLowerCase()
        .includes(pencarianSiswa.toLowerCase())
    ) ?? [];

  const daftarMapel = Array.from(
    new Map(
      kelas?.guru.map((guru) => [
        guru.mapel.id,
        guru.mapel.nama,
      ]) ?? []
    ).entries()
  );

  /* =========================================================
     LOADING
  ========================================================= */

  if (sedangMuat) {
    return (
      <div style={style.loadingPage}>
        <div style={style.loadingCircle} />

        <p style={style.loadingText}>
          Memuat kelas...
        </p>
      </div>
    );
  }

  /* =========================================================
     KELAS TIDAK DITEMUKAN
  ========================================================= */

  if (!kelas) {
    return (
      <div style={style.loadingPage}>
        <div style={style.emptyIcon}>📚</div>

        <h3 style={style.emptyTitle}>
          Kelas tidak ditemukan
        </h3>

        <button
          onClick={() => router.push("/guru/kelas")}
          style={style.tombolKembaliEmpty}
        >
          ← Kembali ke Kelas
        </button>
      </div>
    );
  }

  return (
    <div style={style.halaman}>
      {/* =====================================================
          BACK
      ====================================================== */}

      <button
        onClick={() => router.push("/guru/kelas")}
        style={style.tombolKembali}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor =
            WARNA.primarySoft;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor =
            "transparent";
        }}
      >
        ← Kembali ke Kelas
      </button>

      {/* =====================================================
          HERO KELAS
      ====================================================== */}

      <section style={style.hero}>
        <div style={style.heroContent}>
          <div style={style.heroIcon}>
            {kelas.judul.charAt(0).toUpperCase()}
          </div>

          <div style={style.heroInfo}>
            <div style={style.eyebrow}>
              RUANG KELAS
            </div>

            <h1 style={style.judul}>
              {kelas.judul}
            </h1>

            {kelas.deskripsi && (
              <p style={style.deskripsi}>
                {kelas.deskripsi}
              </p>
            )}

            <div style={style.infoMini}>
              <span>
                👨‍🎓 {kelas.siswa.length} siswa
              </span>

              <span>
                📚 {daftarMapel.length} mapel
              </span>

              <span>
                👨‍🏫 {kelas.guru.length} pengajar
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          TAB
      ====================================================== */}

      <div style={style.tabContainer}>
        <button
          onClick={() => setTabAktif("beranda")}
          style={{
            ...style.tab,
            ...(tabAktif === "beranda"
              ? style.tabAktif
              : {}),
          }}
        >
          <span>⌂</span>
          <span>Beranda</span>
        </button>

        <button
          onClick={() => setTabAktif("siswa")}
          style={{
            ...style.tab,
            ...(tabAktif === "siswa"
              ? style.tabAktif
              : {}),
          }}
        >
          <span>👨‍🎓</span>
          <span>Siswa</span>
        </button>

        <button
          onClick={() => setTabAktif("pengajar")}
          style={{
            ...style.tab,
            ...(tabAktif === "pengajar"
              ? style.tabAktif
              : {}),
          }}
        >
          <span>👨‍🏫</span>
          <span>Pengajar</span>
        </button>
      </div>

      {/* =====================================================
          BERANDA
      ====================================================== */}

      {tabAktif === "beranda" && (
        <>
          {/* AKSI CEPAT */}

          <div style={style.sectionHeader}>
            <div>
              <h2 style={style.sectionTitle}>
                Aksi Cepat
              </h2>

              <p style={style.sectionSubtitle}>
                Kelola aktivitas pembelajaran kelas.
              </p>
            </div>
          </div>

          <div style={style.aksiGrid}>
            {/* QUIZ */}

            <button
              onClick={() =>
                router.push(
                  `/guru/asesmen/baru?tipe=KUIS&kelasId=${kelasId}`
                )
              }
              style={{
                ...style.actionCard,
                borderColor: "#cfe8ff",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-3px)";
                e.currentTarget.style.boxShadow =
                  "0 10px 25px rgba(33,150,243,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform =
                  "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(0,0,0,0.03)";
              }}
            >
              <div
                style={{
                  ...style.actionIcon,
                  backgroundColor:
                    WARNA.primarySoft,
                }}
              >
                📝
              </div>

              <div style={style.actionText}>
                <strong style={style.actionTitle}>
                  Buat Quiz
                </strong>

                <span style={style.actionDescription}>
                  Buat kuis online untuk siswa
                </span>
              </div>

              <span style={style.actionArrow}>
                →
              </span>
            </button>

            {/* UJIAN */}

            <button
              onClick={() =>
                router.push(
                  `/guru/asesmen/baru?tipe=UJIAN&kelasId=${kelasId}`
                )
              }
              style={{
                ...style.actionCard,
                borderColor: "#cfe8ff",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-3px)";
                e.currentTarget.style.boxShadow =
                  "0 10px 25px rgba(33,150,243,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform =
                  "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(0,0,0,0.03)";
              }}
            >
              <div
                style={{
                  ...style.actionIcon,
                  backgroundColor:
                    WARNA.tealSoft,
                }}
              >
                📋
              </div>

              <div style={style.actionText}>
                <strong style={style.actionTitle}>
                  Buat Ujian Online
                </strong>

                <span style={style.actionDescription}>
                  Buat ujian online untuk kelas
                </span>
              </div>

              <span style={style.actionArrow}>
                →
              </span>
            </button>

            {/* TUGAS */}

            <button
           onClick={() =>
  router.push(
    `/guru/tugas/baru?kelasId=${kelasId}`
  )
}
              style={style.actionCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-3px)";
                e.currentTarget.style.boxShadow =
                  "0 10px 25px rgba(33,150,243,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform =
                  "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(0,0,0,0.03)";
              }}
            >
              <div
                style={{
                  ...style.actionIcon,
                  backgroundColor:
                    WARNA.purpleSoft,
                }}
              >
                📚
              </div>

              <div style={style.actionText}>
                <strong style={style.actionTitle}>
                  Buat Tugas
                </strong>

                <span style={style.actionDescription}>
                  Berikan tugas kepada siswa
                </span>
              </div>

              <span style={style.actionArrow}>
                →
              </span>
            </button>

            {/* MATERI */}

            <button
          onClick={() =>
  router.push(
    `/guru/materi/baru?kelasId=${kelasId}`
  )
}
              style={style.actionCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-3px)";
                e.currentTarget.style.boxShadow =
                  "0 10px 25px rgba(33,150,243,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform =
                  "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(0,0,0,0.03)";
              }}
            >
              <div
                style={{
                  ...style.actionIcon,
                  backgroundColor:
                    WARNA.greenSoft,
                }}
              >
                📂
              </div>

              <div style={style.actionText}>
                <strong style={style.actionTitle}>
                  Upload Materi
                </strong>

                <span style={style.actionDescription}>
                  Bagikan materi pembelajaran
                </span>
              </div>

              <span style={style.actionArrow}>
                →
              </span>
            </button>
          </div>

          {/* =================================================
              MAIN CONTENT
          ================================================== */}

          <div style={style.mainGrid}>
            {/* ===============================================
                PENGUMUMAN
            ================================================ */}

            <section style={style.card}>
              <div style={style.cardHeader}>
                <div>
                  <h2 style={style.cardTitle}>
                    📢 Pengumuman
                  </h2>

                  <p style={style.cardSubtitle}>
                    Informasi untuk siswa kelas.
                  </p>
                </div>

                <span style={style.badge}>
                  {kelas.pengumuman.length}
                </span>
              </div>

              {/* FORM POST */}

              <div style={style.postBox}>
                <textarea
                  value={isiPengumumanBaru}
                  onChange={(e) =>
                    setIsiPengumumanBaru(
                      e.target.value
                    )
                  }
                  placeholder="Tulis pengumuman untuk kelas ini..."
                  rows={3}
                  style={style.textarea}
                />

                <div style={style.postFooter}>
                  <span style={style.helperText}>
                    Pengumuman akan terlihat oleh
                    siswa.
                  </span>

                  <button
                    onClick={postPengumuman}
                    disabled={
                      sedangPosting ||
                      !isiPengumumanBaru.trim()
                    }
                    style={{
                      ...style.tombolPost,
                      opacity:
                        sedangPosting ||
                        !isiPengumumanBaru.trim()
                          ? 0.5
                          : 1,
                      cursor:
                        sedangPosting ||
                        !isiPengumumanBaru.trim()
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {sedangPosting
                      ? "Mengirim..."
                      : "Post Pengumuman"}
                  </button>
                </div>
              </div>

              {/* LIST PENGUMUMAN */}

              {kelas.pengumuman.length === 0 ? (
                <div style={style.emptySmall}>
                  <div style={style.emptySmallIcon}>
                    📢
                  </div>

                  <strong
                    style={{
                      color: WARNA.text,
                    }}
                  >
                    Belum ada pengumuman
                  </strong>

                  <span
                    style={{
                      color: WARNA.secondary,
                    }}
                  >
                    Buat pengumuman pertama untuk
                    kelas ini.
                  </span>
                </div>
              ) : (
                <div style={style.pengumumanList}>
                  {kelas.pengumuman.map((p) => {
                    const milikSaya =
                      idGuruSaya === p.guru.id;

                    return (
                      <div
                        key={p.id}
                        style={style.pengumumanItem}
                      >
                        <div
                          style={
                            style.pengumumanTop
                          }
                        >
                          <div style={style.avatar}>
                            {p.guru.nama
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div
                            style={
                              style.pengumumanMeta
                            }
                          >
                            <strong
                              style={{
                                color: WARNA.text,
                              }}
                            >
                              {p.guru.nama}
                            </strong>

                            <span
                              style={{
                                color: WARNA.muted,
                              }}
                            >
                              {new Date(
                                p.createdAt
                              ).toLocaleString(
                                "id-ID"
                              )}
                            </span>
                          </div>
                        </div>

                        {/* EDIT */}

                        {idDiedit === p.id ? (
                          <div
                            style={style.editBox}
                          >
                            <textarea
                              value={isiEdit}
                              onChange={(e) =>
                                setIsiEdit(
                                  e.target.value
                                )
                              }
                              rows={3}
                              style={
                                style.textarea
                              }
                            />

                            <div
                              style={
                                style.editActions
                              }
                            >
                              <button
                                onClick={() =>
                                  simpanEdit(p.id)
                                }
                                style={
                                  style.tombolPost
                                }
                              >
                                Simpan
                              </button>

                              <button
                                onClick={() => {
                                  setIdDiedit(null);
                                  setIsiEdit("");
                                }}
                                style={
                                  style.tombolBatal
                                }
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p
                              style={
                                style.isiPengumuman
                              }
                            >
                              {p.isi}
                            </p>

                            {milikSaya && (
                              <div
                                style={
                                  style.aksiPengumuman
                                }
                              >
                                <button
                                  onClick={() =>
                                    mulaiEdit(p)
                                  }
                                  style={
                                    style.tombolEdit
                                  }
                                >
                                  Edit
                                </button>

                                <button
                                  onClick={() =>
                                    hapusPengumuman(
                                      p.id
                                    )
                                  }
                                  style={
                                    style.tombolHapus
                                  }
                                >
                                  Hapus
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ===============================================
                SIDEBAR
            ================================================ */}

            <div style={style.sideColumn}>
              {/* RINGKASAN */}

              <section style={style.card}>
                <div style={style.cardHeader}>
                  <div>
                    <h2 style={style.cardTitle}>
                      📊 Ringkasan Kelas
                    </h2>

                    <p style={style.cardSubtitle}>
                      Informasi kelas saat ini.
                    </p>
                  </div>
                </div>

                <div style={style.summaryList}>
                  {/* SISWA */}

                  <div style={style.summaryItem}>
                    <div
                      style={{
                        ...style.summaryIcon,
                        backgroundColor:
                          WARNA.primarySoft,
                      }}
                    >
                      👨‍🎓
                    </div>

                    <div style={style.summaryText}>
                      <span
                        style={
                          style.summaryLabel
                        }
                      >
                        Total Siswa
                      </span>

                      <strong
                        style={
                          style.summaryValue
                        }
                      >
                        {kelas.siswa.length}
                      </strong>
                    </div>
                  </div>

                  {/* GURU */}

                  <div style={style.summaryItem}>
                    <div
                      style={{
                        ...style.summaryIcon,
                        backgroundColor:
                          WARNA.tealSoft,
                      }}
                    >
                      👨‍🏫
                    </div>

                    <div style={style.summaryText}>
                      <span
                        style={
                          style.summaryLabel
                        }
                      >
                        Guru Pengajar
                      </span>

                      <strong
                        style={
                          style.summaryValue
                        }
                      >
                        {kelas.guru.length}
                      </strong>
                    </div>
                  </div>

                  {/* MAPEL */}

                  <div style={style.summaryItem}>
                    <div
                      style={{
                        ...style.summaryIcon,
                        backgroundColor:
                          WARNA.purpleSoft,
                      }}
                    >
                      📚
                    </div>

                    <div style={style.summaryText}>
                      <span
                        style={
                          style.summaryLabel
                        }
                      >
                        Mata Pelajaran
                      </span>

                      <strong
                        style={
                          style.summaryValue
                        }
                      >
                        {daftarMapel.length}
                      </strong>
                    </div>
                  </div>

                  {/* PENGUMUMAN */}

                  <div style={style.summaryItem}>
                    <div
                      style={{
                        ...style.summaryIcon,
                        backgroundColor:
                          WARNA.orangeSoft,
                      }}
                    >
                      📢
                    </div>

                    <div style={style.summaryText}>
                      <span
                        style={
                          style.summaryLabel
                        }
                      >
                        Pengumuman
                      </span>

                      <strong
                        style={
                          style.summaryValue
                        }
                      >
                        {kelas.pengumuman.length}
                      </strong>
                    </div>
                  </div>
                </div>
              </section>

              {/* MAPEL */}

              <section style={style.card}>
                <div style={style.cardHeader}>
                  <div>
                    <h2 style={style.cardTitle}>
                      📚 Mata Pelajaran
                    </h2>

                    <p style={style.cardSubtitle}>
                      Mapel yang tersedia di kelas.
                    </p>
                  </div>
                </div>

                <div style={style.mapelList}>
                  {daftarMapel.length === 0 ? (
                    <span
                      style={style.emptyText}
                    >
                      Belum ada mata pelajaran.
                    </span>
                  ) : (
                    daftarMapel.map(
                      ([id, nama]) => (
                        <div
                          key={id}
                          style={
                            style.mapelItem
                          }
                        >
                          <span
                            style={
                              style.mapelDot
                            }
                          />

                          <span
                            style={{
                              color: WARNA.text,
                            }}
                          >
                            {nama}
                          </span>
                        </div>
                      )
                    )
                  )}
                </div>
              </section>
            </div>
          </div>
        </>
      )}

      {/* =====================================================
          TAB SISWA
      ====================================================== */}

      {tabAktif === "siswa" && (
        <section style={style.card}>
          <div style={style.cardHeader}>
            <div>
              <h2 style={style.cardTitle}>
                👨‍🎓 Siswa di Kelas
              </h2>

              <p style={style.cardSubtitle}>
                Daftar siswa yang tergabung dalam
                kelas.
              </p>
            </div>

            <span style={style.badge}>
              {kelas.siswa.length} siswa
            </span>
          </div>

          {/* SEARCH */}

          <div style={style.searchSiswa}>
            <span style={style.searchIcon}>
              🔎
            </span>

            <input
              value={pencarianSiswa}
              onChange={(e) =>
                setPencarianSiswa(e.target.value)
              }
              placeholder="Cari nama atau NIS siswa..."
              style={style.searchInput}
            />
          </div>

          {/* LIST */}

          {siswaFiltered.length === 0 ? (
            <div style={style.emptySmall}>
              <div style={style.emptySmallIcon}>
                👨‍🎓
              </div>

              <strong
                style={{
                  color: WARNA.text,
                }}
              >
                Siswa tidak ditemukan
              </strong>

              <span
                style={{
                  color: WARNA.secondary,
                }}
              >
                Coba gunakan kata pencarian lain.
              </span>
            </div>
          ) : (
            <div style={style.siswaList}>
              {siswaFiltered.map(
                (siswa, index) => (
                  <div
                    key={siswa.id}
                    style={style.siswaItem}
                  >
                    <div
                      style={
                        style.siswaAvatar
                      }
                    >
                      {siswa.nama
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div
                      style={style.siswaInfo}
                    >
                      <strong
                        style={{
                          color: WARNA.text,
                        }}
                      >
                        {siswa.nama}
                      </strong>

                      <span
                        style={{
                          color: WARNA.secondary,
                        }}
                      >
                        NIS {siswa.nis}
                      </span>
                    </div>

                    <div
                      style={style.nomorSiswa}
                    >
                      #
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          TAB PENGAJAR
      ====================================================== */}

      {tabAktif === "pengajar" && (
        <section style={style.card}>
          <div style={style.cardHeader}>
            <div>
              <h2 style={style.cardTitle}>
                👨‍🏫 Guru Pengajar
              </h2>

              <p style={style.cardSubtitle}>
                Guru dan mata pelajaran yang
                diajarkan.
              </p>
            </div>

            <span style={style.badge}>
              {kelas.guru.length} pengajar
            </span>
          </div>

          {kelas.guru.length === 0 ? (
            <div style={style.emptySmall}>
              <div style={style.emptySmallIcon}>
                👨‍🏫
              </div>

              <strong
                style={{
                  color: WARNA.text,
                }}
              >
                Belum ada guru pengajar
              </strong>

              <span
                style={{
                  color: WARNA.secondary,
                }}
              >
                Data pengajar belum tersedia.
              </span>
            </div>
          ) : (
            <div style={style.guruGrid}>
              {kelas.guru.map((guru) => (
                <div
                  key={`${guru.id}-${guru.mapel.id}`}
                  style={style.guruCard}
                >
                  <div
                    style={style.guruAvatar}
                  >
                    {guru.nama
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div
                    style={style.guruInfo}
                  >
                    <strong
                      style={{
                        color: WARNA.text,
                      }}
                    >
                      {guru.nama}
                    </strong>

                    <span
                      style={{
                        color: WARNA.secondary,
                      }}
                    >
                      {guru.mapel.nama}
                    </span>
                  </div>

                  <div
                    style={style.mapelBadge}
                  >
                    {guru.mapel.nama}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/* ============================================================
   STYLE
   SEMUANYA TETAP DI FILE page.tsx
============================================================ */

const style = {
  halaman: {
    minHeight: "100vh",
    padding: "28px 32px 50px",
    backgroundColor: WARNA.background,
    boxSizing: "border-box" as const,
  },

  /* =========================
     LOADING
  ========================== */

  loadingPage: {
    minHeight: "100vh",
    backgroundColor: WARNA.background,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingCircle: {
    width: "30px",
    height: "30px",
    border: `3px solid ${WARNA.primarySoft}`,
    borderTopColor: WARNA.primary,
    borderRadius: "50%",
    marginBottom: "12px",
  },

  loadingText: {
    margin: 0,
    color: WARNA.secondary,
    fontSize: "13px",
  },

  /* =========================
     BACK
  ========================== */

  tombolKembali: {
    border: "none",
    backgroundColor: "transparent",
    color: WARNA.primary,
    fontSize: "13px",
    fontWeight: 700,
    padding: "8px 10px",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "16px",
    transition: "all 0.2s ease",
  },

  tombolKembaliEmpty: {
    marginTop: "12px",
    border: "none",
    backgroundColor: WARNA.primary,
    color: WARNA.white,
    padding: "10px 16px",
    borderRadius: "9px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },

  /* =========================
     HERO
  ========================== */

  hero: {
    background:
      "linear-gradient(135deg, #2196f3 0%, #2870e8 55%, #70c1c4 100%)",
    borderRadius: "20px",
    padding: "26px",
    color: WARNA.white,
    boxShadow:
      "0 8px 25px rgba(33,150,243,0.15)",
    marginBottom: "18px",
  },

  heroContent: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  heroIcon: {
    width: "72px",
    height: "72px",
    flexShrink: 0,
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.2)",
    border:
      "1px solid rgba(255,255,255,0.35)",
    color: WARNA.white,
    fontSize: "30px",
    fontWeight: 800,
  },

  heroInfo: {
    minWidth: 0,
  },

  eyebrow: {
    fontSize: "10px",
    letterSpacing: "1.5px",
    fontWeight: 800,
    color: "rgba(255,255,255,0.82)",
    marginBottom: "4px",
  },

  judul: {
    margin: 0,
    color: WARNA.white,
    fontSize: "27px",
    lineHeight: 1.2,
    fontWeight: 800,
  },

  deskripsi: {
    margin: "7px 0 12px",
    color: "rgba(255,255,255,0.9)",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  infoMini: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "8px",
    color: WARNA.white,
    fontSize: "11px",
    fontWeight: 600,
  },

  /* =========================
     TAB
  ========================== */

  tabContainer: {
    display: "flex",
    gap: "4px",
    backgroundColor: WARNA.white,
    border: `1px solid ${WARNA.border}`,
    padding: "5px",
    borderRadius: "12px",
    marginBottom: "24px",
    overflowX: "auto" as const,
  },

  tab: {
    border: "none",
    backgroundColor: "transparent",
    color: WARNA.secondary,
    padding: "9px 15px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    display: "flex",
    alignItems: "center",
    gap: "7px",
  },

  tabAktif: {
    backgroundColor: WARNA.primarySoft,
    color: WARNA.primaryDark,
  },

  /* =========================
     SECTION
  ========================== */

  sectionHeader: {
    marginBottom: "13px",
  },

  sectionTitle: {
    margin: 0,
    color: WARNA.text,
    fontSize: "18px",
    fontWeight: 800,
  },

  sectionSubtitle: {
    margin: "4px 0 0",
    color: WARNA.secondary,
    fontSize: "12px",
  },

  /* =========================
     AKSI CEPAT
  ========================== */

  aksiGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "12px",
    marginBottom: "22px",
  },

  actionCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    textAlign: "left" as const,
    backgroundColor: WARNA.white,
    border: `1px solid ${WARNA.border}`,
    borderRadius: "14px",
    padding: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow:
      "0 2px 8px rgba(0,0,0,0.03)",
    color: WARNA.text,
  },

  actionIcon: {
    width: "40px",
    height: "40px",
    flexShrink: 0,
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },

  actionText: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: "3px",
    color: WARNA.text,
  },

  actionTitle: {
    display: "block",
    color: WARNA.text,
    fontSize: "13px",
    fontWeight: 800,
    lineHeight: 1.3,
  },

  actionDescription: {
    display: "block",
    color: WARNA.secondary,
    fontSize: "11px",
    lineHeight: 1.4,
  },

  actionArrow: {
    color: WARNA.primary,
    fontSize: "18px",
    fontWeight: 700,
  },

  /* =========================
     MAIN
  ========================== */

  mainGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1.7fr) minmax(280px, 0.8fr)",
    gap: "18px",
    alignItems: "start",
  },

  sideColumn: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "18px",
  },

  /* =========================
     CARD
  ========================== */

  card: {
    backgroundColor: WARNA.white,
    border: `1px solid ${WARNA.border}`,
    borderRadius: "16px",
    padding: "20px",
    boxShadow:
      "0 2px 8px rgba(0,0,0,0.03)",
    color: WARNA.text,
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "18px",
  },

  cardTitle: {
    margin: 0,
    color: WARNA.text,
    fontSize: "16px",
    fontWeight: 800,
  },

  cardSubtitle: {
    margin: "4px 0 0",
    color: WARNA.secondary,
    fontSize: "11px",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "28px",
    height: "26px",
    padding: "0 8px",
    boxSizing: "border-box" as const,
    borderRadius: "999px",
    backgroundColor: WARNA.primarySoft,
    color: WARNA.primaryDark,
    fontSize: "11px",
    fontWeight: 800,
  },

  /* =========================
     PENGUMUMAN
  ========================== */

  postBox: {
    padding: "13px",
    borderRadius: "12px",
    backgroundColor: WARNA.background,
    marginBottom: "18px",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box" as const,
    border: `1px solid ${WARNA.border}`,
    backgroundColor: WARNA.white,
    borderRadius: "10px",
    padding: "11px 12px",
    resize: "vertical" as const,
    minHeight: "82px",
    outline: "none",
    fontFamily: "inherit",
    fontSize: "13px",
    color: WARNA.text,
  },

  postFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginTop: "9px",
  },

  helperText: {
    fontSize: "10px",
    color: WARNA.muted,
  },

  tombolPost: {
    border: "none",
    backgroundColor: WARNA.primary,
    color: WARNA.white,
    borderRadius: "8px",
    padding: "9px 14px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  tombolBatal: {
    border: `1px solid ${WARNA.border}`,
    backgroundColor: WARNA.white,
    color: WARNA.secondary,
    borderRadius: "8px",
    padding: "9px 14px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  pengumumanList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  },

  pengumumanItem: {
    padding: "14px",
    border: `1px solid ${WARNA.border}`,
    borderRadius: "12px",
    backgroundColor: WARNA.white,
    color: WARNA.text,
  },

  pengumumanTop: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    backgroundColor: WARNA.primarySoft,
    color: WARNA.primaryDark,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 800,
    flexShrink: 0,
  },

  pengumumanMeta: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },

  isiPengumuman: {
    margin: "12px 0 0 44px",
    color: "#374151",
    fontSize: "13px",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap" as const,
  },

  aksiPengumuman: {
    marginTop: "10px",
    marginLeft: "44px",
    display: "flex",
    gap: "12px",
  },

  tombolEdit: {
    border: "none",
    background: "none",
    color: WARNA.primary,
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
  },

  tombolHapus: {
    border: "none",
    background: "none",
    color: WARNA.danger,
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
  },

  editBox: {
    marginTop: "12px",
  },

  editActions: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  },

  /* =========================
     RINGKASAN
  ========================== */

  summaryList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },

  summaryItem: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "10px",
    borderRadius: "10px",
    backgroundColor: WARNA.background,
  },

  summaryIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "15px",
    flexShrink: 0,
  },

  summaryText: {
    flex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    color: WARNA.text,
  },

  summaryLabel: {
    color: WARNA.secondary,
    fontSize: "12px",
    fontWeight: 500,
  },

  summaryValue: {
    color: WARNA.text,
    fontSize: "14px",
    fontWeight: 800,
  },

  /* =========================
     MAPEL
  ========================== */

  mapelList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },

  mapelItem: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "9px 10px",
    borderRadius: "9px",
    backgroundColor: WARNA.background,
    color: WARNA.text,
    fontSize: "12px",
    fontWeight: 600,
  },

  mapelDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: WARNA.primary,
    flexShrink: 0,
  },

  emptyText: {
    color: WARNA.muted,
    fontSize: "12px",
  },

  /* =========================
     EMPTY
  ========================== */

  emptySmall: {
    minHeight: "170px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
    gap: "5px",
  },

  emptySmallIcon: {
    fontSize: "32px",
    marginBottom: "5px",
  },

  emptyIcon: {
    fontSize: "42px",
    marginBottom: "4px",
  },

  emptyTitle: {
    margin: 0,
    color: WARNA.text,
    fontSize: "16px",
    fontWeight: 800,
  },

  /* =========================
     SISWA
  ========================== */

  searchSiswa: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    height: "42px",
    boxSizing: "border-box" as const,
    padding: "0 12px",
    backgroundColor: WARNA.background,
    border: `1px solid ${WARNA.border}`,
    borderRadius: "10px",
    marginBottom: "15px",
  },

  searchIcon: {
    color: WARNA.secondary,
    fontSize: "13px",
  },

  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    backgroundColor: "transparent",
    fontSize: "12px",
    color: WARNA.text,
  },

  siswaList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },

  siswaItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "11px 12px",
    border: `1px solid ${WARNA.border}`,
    borderRadius: "11px",
    backgroundColor: WARNA.white,
  },

  siswaAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "11px",
    backgroundColor: WARNA.primarySoft,
    color: WARNA.primaryDark,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 800,
    flexShrink: 0,
  },

  siswaInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: "3px",
    minWidth: 0,
  },

  nomorSiswa: {
    color: WARNA.muted,
    fontSize: "10px",
    fontWeight: 700,
  },

  /* =========================
     GURU
  ========================== */

  guruGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "12px",
  },

  guruCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    border: `1px solid ${WARNA.border}`,
    borderRadius: "13px",
    backgroundColor: WARNA.background,
  },

  guruAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "13px",
    background:
      "linear-gradient(135deg, #2196f3, #70c1c4)",
    color: WARNA.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "15px",
    fontWeight: 800,
    flexShrink: 0,
  },

  guruInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
    minWidth: 0,
    color: WARNA.text,
  },

  mapelBadge: {
    padding: "5px 8px",
    borderRadius: "999px",
    backgroundColor: WARNA.primarySoft,
    color: WARNA.primaryDark,
    fontSize: "9px",
    fontWeight: 700,
    maxWidth: "100px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
};