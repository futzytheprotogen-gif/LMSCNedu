"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import styles from "./page.module.css";

const WARNA_PRIMARY = "#2196f3";

interface GuruApi {
  id: string;
  nama: string;
  email: string;
  nik: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P" | null;
  deskripsi: string | null;
  mapelDiampu: {
    mapel: {
      id: string;
      nama: string;
    };
  }[];
}

interface MapelRingkas {
  id: string;
  nama: string;
}

interface KelompokMapel {
  mapelId: string;
  nama: string;
  guru: GuruApi[];
}

export default function HalamanDaftarGuru() {
  const [daftarGuru, setDaftarGuru] = useState<GuruApi[]>([]);
  const [daftarMapel, setDaftarMapel] = useState<MapelRingkas[]>([]);
  const [sedangMuat, setSedangMuat] = useState(true);

  const [pencarian, setPencarian] = useState("");

  const [guruDiedit, setGuruDiedit] = useState<GuruApi | null>(null);

  const [formNama, setFormNama] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTanggalLahir, setFormTanggalLahir] = useState("");
  const [formJenisKelamin, setFormJenisKelamin] = useState<"" | "L" | "P">(
    ""
  );
  const [formDeskripsi, setFormDeskripsi] = useState("");

  const [sedangProsesEdit, setSedangProsesEdit] = useState(false);
  const [pesanErrorEdit, setPesanErrorEdit] = useState<string | null>(null);

  const muatData = useCallback(async () => {
    try {
      setSedangMuat(true);

      const [resGuru, resReferensi] = await Promise.all([
        fetch("/api/akun?tipe=GURU"),
        fetch("/api/kelas-referensi"),
      ]);

      const dataGuru = await resGuru.json();
      const dataReferensi = await resReferensi.json();

      if (resGuru.ok) {
        setDaftarGuru(dataGuru.data ?? []);
      }

      if (resReferensi.ok) {
        setDaftarMapel(dataReferensi.data?.mapel ?? []);
      }
    } catch (error) {
      console.error("Gagal memuat data guru:", error);
    } finally {
      setSedangMuat(false);
    }
  }, []);

  useEffect(() => {
    muatData();
  }, [muatData]);

  const kelompok = useMemo(() => {
    const keyword = pencarian.toLowerCase().trim();

    return daftarMapel
      .map((m) => {
        const guru = daftarGuru.filter((g) => {
          const mengampu = g.mapelDiampu.some(
            (md) => md.mapel.id === m.id
          );

          if (!keyword) return mengampu;

          return (
            mengampu &&
            (g.nama.toLowerCase().includes(keyword) ||
              g.email.toLowerCase().includes(keyword))
          );
        });

        return {
          mapelId: m.id,
          nama: m.nama,
          guru,
        };
      })
      .filter((k) => k.guru.length > 0);
  }, [daftarGuru, daftarMapel, pencarian]);

  const jumlahMapelAktif = useMemo(() => {
    return daftarMapel.filter((mapel) =>
      daftarGuru.some((guru) =>
        guru.mapelDiampu.some((item) => item.mapel.id === mapel.id)
      )
    ).length;
  }, [daftarGuru, daftarMapel]);

  const rataGuruPerMapel =
    jumlahMapelAktif > 0
      ? (daftarGuru.length / jumlahMapelAktif).toFixed(1)
      : "0";

  function bukaEdit(guru: GuruApi) {
    setGuruDiedit(guru);
    setFormNama(guru.nama);
    setFormEmail(guru.email);
    setFormTanggalLahir(guru.tanggalLahir.slice(0, 10));
    setFormJenisKelamin(guru.jenisKelamin ?? "");
    setFormDeskripsi(guru.deskripsi ?? "");
    setPesanErrorEdit(null);
  }

  function tutupModal() {
    if (sedangProsesEdit) return;
    setGuruDiedit(null);
  }

  async function simpanEdit() {
    if (!guruDiedit) return;

    setSedangProsesEdit(true);
    setPesanErrorEdit(null);

    try {
      const response = await fetch(
        `/api/akun/${guruDiedit.id}?tipe=GURU`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nama: formNama,
            email: formEmail,
            tanggalLahir: formTanggalLahir,
            jenisKelamin: formJenisKelamin || undefined,
            deskripsi: formDeskripsi,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setPesanErrorEdit(
          data.pesan ?? "Gagal menyimpan perubahan."
        );
        return;
      }

      await muatData();
      setGuruDiedit(null);
    } catch {
      setPesanErrorEdit("Terjadi kesalahan saat menyimpan.");
    } finally {
      setSedangProsesEdit(false);
    }
  }

  async function tambahMapelDiedit(mapelId: string) {
    if (!guruDiedit || !mapelId) return;

    try {
      await fetch(`/api/akun/${guruDiedit.id}/mapel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mapelId }),
      });

      const dataTerbaru = await muatData();

      // muatData tidak mengembalikan data,
      // jadi ambil dari state pada render berikutnya.
      setGuruDiedit((current) => current);
    } catch (error) {
      console.error(error);
    }
  }

  async function hapusMapelDiedit(mapelId: string) {
    if (!guruDiedit) return;

    try {
      await fetch(
        `/api/akun/${guruDiedit.id}/mapel/${mapelId}`,
        {
          method: "DELETE",
        }
      );

      await muatData();
    } catch (error) {
      console.error(error);
    }
  }

  async function hapusGuru(guru: GuruApi) {
    const yakin = confirm(
      `Hapus akun guru "${guru.nama}"?\n\nData akun akan dihapus dan tindakan ini tidak dapat dibatalkan.`
    );

    if (!yakin) return;

    try {
      const response = await fetch(
        `/api/akun/${guru.id}?tipe=GURU`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await muatData();
      }
    } catch (error) {
      console.error(error);
    }
  }

  function inisial(nama: string) {
    const bagian = nama.trim().split(/\s+/);

    if (bagian.length === 1) {
      return bagian[0].slice(0, 2).toUpperCase();
    }

    return (
      bagian[0][0] + bagian[bagian.length - 1][0]
    ).toUpperCase();
  }

  return (
    <main className={styles.page}>
      {/* HEADER */}
      <section className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>
            ADMIN
            <span>/</span>
            DATA GURU
          </div>

          <h1 className={styles.title}>
            Manajemen Guru
          </h1>

          <p className={styles.subtitle}>
            Kelola data pengajar dan mata pelajaran yang
            diampu dalam sistem CNEdu.
          </p>
        </div>

        <div className={styles.headerBadge}>
          <span className={styles.headerDot} />
          Sistem Aktif
        </div>
      </section>

      {/* STATISTICS */}
      <section className={styles.statsGrid}>
        <StatCard
          icon="G"
          label="Total Guru"
          value={daftarGuru.length}
          description="Guru terdaftar"
        />

        <StatCard
          icon="M"
          label="Mapel Aktif"
          value={jumlahMapelAktif}
          description="Mata pelajaran"
        />

        <StatCard
          icon="R"
          label="Guru / Mapel"
          value={rataGuruPerMapel}
          description="Rata-rata pengampu"
        />

        <StatCard
          icon="✓"
          label="Status Sistem"
          value="Aktif"
          description="Data tersinkronisasi"
          success
        />
      </section>

      {/* TOOLBAR */}
      <section className={styles.toolbar}>
        <div>
          <h2 className={styles.sectionTitle}>
            Daftar Pengajar
          </h2>
          <p className={styles.sectionDescription}>
            Data guru dikelompokkan berdasarkan mata pelajaran.
          </p>
        </div>

        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>⌕</span>

          <input
            type="text"
            placeholder="Cari nama atau email guru..."
            value={pencarian}
            onChange={(e) => setPencarian(e.target.value)}
          />

          {pencarian && (
            <button
              type="button"
              className={styles.clearSearch}
              onClick={() => setPencarian("")}
            >
              ×
            </button>
          )}
        </div>
      </section>

      {/* CONTENT */}
      {sedangMuat ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Memuat data guru...</p>
        </div>
      ) : kelompok.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>G</div>

          <h3>
            {pencarian
              ? "Guru tidak ditemukan"
              : "Belum ada guru"}
          </h3>

          <p>
            {pencarian
              ? "Coba gunakan kata kunci pencarian lain."
              : "Belum ada data guru yang terdaftar dalam sistem."}
          </p>
        </div>
      ) : (
        <div className={styles.mapelContainer}>
          {kelompok.map((k) => (
            <section
              key={k.mapelId}
              className={styles.mapelCard}
            >
              {/* MAPEL HEADER */}
              <div className={styles.mapelHeader}>
                <div className={styles.mapelIdentity}>
                  <div className={styles.mapelIcon}>
                    {k.nama.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3>{k.nama}</h3>

                    <p>
                      {k.guru.length}{" "}
                      {k.guru.length === 1
                        ? "pengajar"
                        : "pengajar"}{" "}
                      terdaftar
                    </p>
                  </div>
                </div>

                <div className={styles.mapelCode}>
                  MATA PELAJARAN
                </div>
              </div>

              {/* GURU LIST */}
              <div className={styles.guruGrid}>
                {k.guru.map((guru) => (
                  <article
                    key={guru.id}
                    className={styles.guruCard}
                  >
                    <div className={styles.guruMain}>
                      <div className={styles.avatar}>
                        {inisial(guru.nama)}
                      </div>

                      <div className={styles.guruInfo}>
                        <h4>{guru.nama}</h4>

                        <p>{guru.email}</p>

                        <div className={styles.badges}>
                          <span className={styles.roleBadge}>
                            Guru
                          </span>

                          <span className={styles.nikBadge}>
                            NIK {guru.nik}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.guruActions}>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => bukaEdit(guru)}
                      >
                        <span>✎</span>
                        Edit
                      </button>

                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => hapusGuru(guru)}
                        aria-label={`Hapus ${guru.nama}`}
                      >
                        ×
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* MODAL */}
      {guruDiedit && (
        <div
          className={styles.overlay}
          onClick={tutupModal}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalEyebrow}>
                  EDIT DATA GURU
                </div>

                <h2>Perbarui Informasi</h2>

                <p>
                  Perubahan akan langsung tersimpan ke
                  sistem.
                </p>
              </div>

              <button
                type="button"
                className={styles.modalClose}
                onClick={tutupModal}
                disabled={sedangProsesEdit}
              >
                ×
              </button>
            </div>

            {/* FORM */}
            <div className={styles.form}>
              <div className={styles.field}>
                <label>Nama Lengkap</label>

                <input
                  type="text"
                  value={formNama}
                  onChange={(e) =>
                    setFormNama(e.target.value)
                  }
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div className={styles.field}>
                <label>Email</label>

                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) =>
                    setFormEmail(e.target.value)
                  }
                  placeholder="nama@sekolah.sch.id"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label>Tanggal Lahir</label>

                  <input
                    type="date"
                    value={formTanggalLahir}
                    onChange={(e) =>
                      setFormTanggalLahir(e.target.value)
                    }
                  />
                </div>

                <div className={styles.field}>
                  <label>Jenis Kelamin</label>

                  <select
                    value={formJenisKelamin}
                    onChange={(e) =>
                      setFormJenisKelamin(
                        e.target.value as "" | "L" | "P"
                      )
                    }
                  >
                    <option value="">
                      Pilih jenis kelamin
                    </option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label>Deskripsi</label>

                <textarea
                  value={formDeskripsi}
                  onChange={(e) =>
                    setFormDeskripsi(e.target.value)
                  }
                  rows={3}
                  placeholder="Deskripsi singkat guru..."
                />
              </div>

              {/* MAPEL */}
              <div className={styles.mapelForm}>
                <div className={styles.formLabelRow}>
                  <label>Mata Pelajaran Diampu</label>
                  <span>
                    {guruDiedit.mapelDiampu.length} mapel
                  </span>
                </div>

                <select
                  defaultValue=""
                  onChange={(e) => {
                    tambahMapelDiedit(e.target.value);
                    e.target.value = "";
                  }}
                >
                  <option value="">
                    + Tambahkan mata pelajaran
                  </option>

                  {daftarMapel
                    .filter(
                      (m) =>
                        !guruDiedit.mapelDiampu.some(
                          (md) =>
                            md.mapel.id === m.id
                        )
                    )
                    .map((m) => (
                      <option
                        key={m.id}
                        value={m.id}
                      >
                        {m.nama}
                      </option>
                    ))}
                </select>

                <div className={styles.chips}>
                  {guruDiedit.mapelDiampu.map((md) => (
                    <span
                      key={md.mapel.id}
                      className={styles.chip}
                    >
                      {md.mapel.nama}

                      <button
                        type="button"
                        onClick={() =>
                          hapusMapelDiedit(md.mapel.id)
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {pesanErrorEdit && (
                <div className={styles.errorMessage}>
                  {pesanErrorEdit}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={tutupModal}
                disabled={sedangProsesEdit}
              >
                Batal
              </button>

              <button
                type="button"
                className={styles.saveButton}
                onClick={simpanEdit}
                disabled={sedangProsesEdit}
              >
                {sedangProsesEdit
                  ? "Menyimpan..."
                  : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================================
   STAT CARD
========================================= */

function StatCard({
  icon,
  label,
  value,
  description,
  success = false,
}: {
  icon: string;
  label: string;
  value: string | number;
  description: string;
  success?: boolean;
}) {
  return (
    <div className={styles.statCard}>
      <div
        className={`${styles.statIcon} ${
          success ? styles.statIconSuccess : ""
        }`}
      >
        {icon}
      </div>

      <div className={styles.statContent}>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>
    </div>
  );
}