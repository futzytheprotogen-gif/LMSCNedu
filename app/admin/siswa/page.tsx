"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

const WARNA_PRIMARY = "#2196f3";

interface SiswaApi {
  id: string;
  nama: string;
  email: string;
  nis: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P" | null;
  rombel: {
    id: string;
    label: string;
  };
}

interface KelompokRombel {
  rombelId: string;
  label: string;
  siswa: SiswaApi[];
}

export default function HalamanDaftarSiswa() {
  const [kelompok, setKelompok] = useState<KelompokRombel[]>([]);
  const [sedangMuat, setSedangMuat] = useState(true);

  const [rombelDibuka, setRombelDibuka] = useState<string | null>(null);
  const [kataKunci, setKataKunci] = useState("");

  const [siswaDiedit, setSiswaDiedit] = useState<SiswaApi | null>(null);

  const [formEmail, setFormEmail] = useState("");
  const [formNis, setFormNis] = useState("");
  const [formTanggalLahir, setFormTanggalLahir] = useState("");
  const [formJenisKelamin, setFormJenisKelamin] = useState<
    "" | "L" | "P"
  >("");

  const [sedangProsesEdit, setSedangProsesEdit] = useState(false);
  const [pesanErrorEdit, setPesanErrorEdit] = useState<string | null>(null);

  const muatDaftarSiswa = useCallback(async () => {
    try {
      setSedangMuat(true);

      const response = await fetch("/api/akun?tipe=SISWA");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.pesan ?? "Gagal mengambil data siswa");
      }

      const daftarSiswa: SiswaApi[] = data.data ?? [];

      const peta = new Map<string, KelompokRombel>();

      for (const siswa of daftarSiswa) {
        const existing = peta.get(siswa.rombel.id);

        if (existing) {
          existing.siswa.push(siswa);
        } else {
          peta.set(siswa.rombel.id, {
            rombelId: siswa.rombel.id,
            label: siswa.rombel.label,
            siswa: [siswa],
          });
        }
      }

      setKelompok(
        Array.from(peta.values()).sort((a, b) =>
          a.label.localeCompare(b.label)
        )
      );
    } catch (error) {
      console.error(error);
      setKelompok([]);
    } finally {
      setSedangMuat(false);
    }
  }, []);

  useEffect(() => {
    muatDaftarSiswa();
  }, [muatDaftarSiswa]);

  const totalSiswa = useMemo(() => {
    return kelompok.reduce((total, rombel) => total + rombel.siswa.length, 0);
  }, [kelompok]);

  const rombelAktif = kelompok.find(
    (item) => item.rombelId === rombelDibuka
  );

  const siswaTerfilter = useMemo(() => {
    if (!rombelAktif) return [];

    const keyword = kataKunci.trim().toLowerCase();

    if (!keyword) {
      return rombelAktif.siswa;
    }

    return rombelAktif.siswa.filter((siswa) => {
      return (
        siswa.nama.toLowerCase().includes(keyword) ||
        siswa.email.toLowerCase().includes(keyword) ||
        siswa.nis.toLowerCase().includes(keyword)
      );
    });
  }, [rombelAktif, kataKunci]);

  function bukaEdit(siswa: SiswaApi) {
    setSiswaDiedit(siswa);

    setFormEmail(siswa.email);
    setFormNis(siswa.nis);
    setFormTanggalLahir(siswa.tanggalLahir.slice(0, 10));
    setFormJenisKelamin(siswa.jenisKelamin ?? "");

    setPesanErrorEdit(null);
  }

  function tutupEdit() {
    if (sedangProsesEdit) return;

    setSiswaDiedit(null);
    setPesanErrorEdit(null);
  }

  async function simpanEdit() {
    if (!siswaDiedit) return;

    if (!formEmail.trim() || !formNis.trim() || !formTanggalLahir) {
      setPesanErrorEdit("Email, NIS, dan tanggal lahir wajib diisi.");
      return;
    }

    try {
      setSedangProsesEdit(true);
      setPesanErrorEdit(null);

      const response = await fetch(
        `/api/akun/${siswaDiedit.id}?tipe=SISWA`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formEmail.trim(),
            nis: formNis.trim(),
            tanggalLahir: formTanggalLahir,
            jenisKelamin: formJenisKelamin || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setPesanErrorEdit(data.pesan ?? "Gagal menyimpan perubahan");
        return;
      }

      setSiswaDiedit(null);
      await muatDaftarSiswa();
    } catch (error) {
      console.error(error);
      setPesanErrorEdit("Terjadi kesalahan saat menyimpan perubahan.");
    } finally {
      setSedangProsesEdit(false);
    }
  }

  async function hapusSiswa(siswa: SiswaApi) {
    const yakin = window.confirm(
      `Hapus akun siswa "${siswa.nama}"?\n\nTindakan ini tidak dapat dibatalkan.`
    );

    if (!yakin) return;

    try {
      const response = await fetch(
        `/api/akun/${siswa.id}?tipe=SISWA`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        alert(data?.pesan ?? "Gagal menghapus siswa.");
        return;
      }

      await muatDaftarSiswa();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menghapus siswa.");
    }
  }

  function bukaRombel(rombelId: string) {
    setRombelDibuka(rombelId);
    setKataKunci("");
  }

  function kembaliKeRombel() {
    setRombelDibuka(null);
    setKataKunci("");
  }

  return (
    <main className={styles.page}>
      {/* HEADER */}
      <section className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>
            Admin <span>/</span> Siswa
          </div>

          <h1 className={styles.title}>Daftar Siswa</h1>

          <p className={styles.subtitle}>
            Kelola data akun siswa berdasarkan rombel.
          </p>
        </div>

        <div className={styles.headerBadge}>
          <span className={styles.headerBadgeDot} />
          Data Siswa
        </div>
      </section>

      {/* STATS */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M16 21V19C16 16.7909 14.2091 15 12 15H6C3.79086 15 2 16.7909 2 19V21"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle
                cx="9"
                cy="7"
                r="4"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M22 21V19C22 17.1362 20.7252 15.5701 19 15.126"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M16 3.12891C17.7252 3.57005 19 5.13616 19 7.00001C19 8.86386 17.7252 10.4299 16 10.8711"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div>
            <span className={styles.statLabel}>Total Siswa</span>
            <strong className={styles.statValue}>{totalSiswa}</strong>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M3 21H21"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M5 21V5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M9 7H15M9 11H15M9 15H15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div>
            <span className={styles.statLabel}>Total Rombel</span>
            <strong className={styles.statValue}>{kelompok.length}</strong>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconGreen}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <span className={styles.statLabel}>Status Data</span>
            <strong className={styles.statStatus}>Tersinkron</strong>
          </div>
        </div>
      </section>

      {/* LOADING */}
      {sedangMuat && (
        <div className={styles.loadingCard}>
          <div className={styles.spinner} />
          <span>Memuat data siswa...</span>
        </div>
      )}

      {/* ROMBEL */}
      {!sedangMuat && !rombelAktif && (
        <section className={styles.contentSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Rombel</h2>
              <p>Pilih rombel untuk melihat daftar siswa.</p>
            </div>
          </div>

          {kelompok.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="9"
                    cy="7"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M2 21C2 17.6863 4.68629 15 8 15H10"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M16 11V17M13 14H19"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h3>Belum ada siswa</h3>
              <p>Belum ada data siswa yang terdaftar.</p>
            </div>
          ) : (
            <div className={styles.rombelGrid}>
              {kelompok.map((rombel) => (
                <button
                  key={rombel.rombelId}
                  className={styles.rombelCard}
                  onClick={() => bukaRombel(rombel.rombelId)}
                >
                  <div className={styles.rombelTop}>
                    <div className={styles.rombelIcon}>
                      <svg
                        width="23"
                        height="23"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M16 21V19C16 16.7909 14.2091 15 12 15H6C3.79086 15 2 16.7909 2 19V21"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="9"
                          cy="7"
                          r="4"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <path
                          d="M16 11C18.2091 11 20 12.7909 20 15V17"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    <span className={styles.arrow}>
                      →
                    </span>
                  </div>

                  <div className={styles.rombelName}>
                    {rombel.label}
                  </div>

                  <div className={styles.rombelBottom}>
                    <span>
                      {rombel.siswa.length} siswa
                    </span>

                    <span className={styles.viewText}>
                      Lihat siswa
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* DETAIL ROMBEL */}
      {!sedangMuat && rombelAktif && (
        <section className={styles.contentSection}>
          <button
            className={styles.backButton}
            onClick={kembaliKeRombel}
          >
            <span>←</span>
            Kembali ke rombel
          </button>

          <div className={styles.detailHeader}>
            <div>
              <div className={styles.detailEyebrow}>
                ROMBEL
              </div>

              <h2>{rombelAktif.label}</h2>

              <p>
                {rombelAktif.siswa.length} siswa terdaftar
              </p>
            </div>

            <div className={styles.totalBadge}>
              {rombelAktif.siswa.length} Siswa
            </div>
          </div>

          {/* SEARCH */}
          <div className={styles.searchWrapper}>
            <svg
              className={styles.searchIcon}
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M20 20L16.5 16.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>

            <input
              value={kataKunci}
              onChange={(e) => setKataKunci(e.target.value)}
              placeholder="Cari nama, NIS, atau email siswa..."
              className={styles.searchInput}
            />

            {kataKunci && (
              <button
                className={styles.clearSearch}
                onClick={() => setKataKunci("")}
              >
                ×
              </button>
            )}
          </div>

          {/* TABLE */}
          {siswaTerfilter.length === 0 ? (
            <div className={styles.emptySearch}>
              <h3>Siswa tidak ditemukan</h3>
              <p>
                Tidak ada siswa yang cocok dengan pencarian
                &quot;{kataKunci}&quot;.
              </p>
            </div>
          ) : (
            <div className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <div className={styles.colSiswa}>Siswa</div>
                <div className={styles.colNis}>NIS</div>
                <div className={styles.colGender}>Jenis Kelamin</div>
                <div className={styles.colAksi}>Aksi</div>
              </div>

              <div className={styles.tableBody}>
                {siswaTerfilter.map((siswa) => (
                  <div
                    key={siswa.id}
                    className={styles.studentRow}
                  >
                    <div className={styles.colSiswa}>
                      <div className={styles.studentInfo}>
                        <div className={styles.avatar}>
                          {siswa.nama
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className={styles.studentText}>
                          <strong>{siswa.nama}</strong>
                          <span>{siswa.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.colNis}>
                      <span className={styles.nisBadge}>
                        {siswa.nis}
                      </span>
                    </div>

                    <div className={styles.colGender}>
                      {siswa.jenisKelamin === "L" ? (
                        <span className={styles.genderMale}>
                          Laki-laki
                        </span>
                      ) : siswa.jenisKelamin === "P" ? (
                        <span className={styles.genderFemale}>
                          Perempuan
                        </span>
                      ) : (
                        <span className={styles.genderEmpty}>
                          —
                        </span>
                      )}
                    </div>

                    <div className={styles.colAksi}>
                      <div className={styles.actionGroup}>
                        <button
                          className={styles.editButton}
                          onClick={() => bukaEdit(siswa)}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M12 20H21"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M16.5 3.5C17.3284 2.67157 18.6716 2.67157 19.5 3.5C20.3284 4.32843 20.3284 5.67157 19.5 6.5L8 18L3 19L4 14L16.5 3.5Z"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Edit
                        </button>

                        <button
                          className={styles.deleteButton}
                          onClick={() => hapusSiswa(siswa)}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M4 7H20"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M10 11V17M14 11V17"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M6 7L7 20H17L18 7"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M9 7V4H15V7"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            />
                          </svg>
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* MODAL EDIT */}
      {siswaDiedit && (
        <div
          className={styles.modalOverlay}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              tutupEdit();
            }
          }}
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalEyebrow}>
                  EDIT DATA SISWA
                </span>

                <h3>{siswaDiedit.nama}</h3>

                <p>
                  Perbarui informasi akun siswa.
                </p>
              </div>

              <button
                className={styles.closeButton}
                onClick={tutupEdit}
                disabled={sedangProsesEdit}
              >
                ×
              </button>
            </div>

            <div className={styles.modalDivider} />

            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label>Email</label>

                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) =>
                    setFormEmail(e.target.value)
                  }
                  placeholder="Masukkan email"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>NIS</label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={formNis}
                  onChange={(e) =>
                    setFormNis(e.target.value)
                  }
                  placeholder="Masukkan NIS"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Tanggal Lahir</label>

                  <input
                    type="date"
                    value={formTanggalLahir}
                    onChange={(e) =>
                      setFormTanggalLahir(e.target.value)
                    }
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Jenis Kelamin</label>

                  <select
                    value={formJenisKelamin}
                    onChange={(e) =>
                      setFormJenisKelamin(
                        e.target.value as "" | "L" | "P"
                      )
                    }
                    className={styles.formInput}
                  >
                    <option value="">
                      Pilih
                    </option>
                    <option value="L">
                      Laki-laki
                    </option>
                    <option value="P">
                      Perempuan
                    </option>
                  </select>
                </div>
              </div>

              {pesanErrorEdit && (
                <div className={styles.errorBox}>
                  <span>!</span>
                  {pesanErrorEdit}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={tutupEdit}
                disabled={sedangProsesEdit}
              >
                Batal
              </button>

              <button
                className={styles.saveButton}
                onClick={simpanEdit}
                disabled={sedangProsesEdit}
              >
                {sedangProsesEdit ? (
                  <>
                    <span className={styles.buttonSpinner} />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}