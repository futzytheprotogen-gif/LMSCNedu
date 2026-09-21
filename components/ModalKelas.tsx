"use client";

import { useEffect, useState } from "react";
import styles from "./ModalKelas.module.css";

type Props = {
  terbuka: boolean;
  sedangProses: boolean;
  pesanError: string | null;
  onTutup: () => void;
  onSubmit: (data: {
    judul: string;
    deskripsi: string;
  }) => void;
};

export default function ModalKelas({
  terbuka,
  sedangProses,
  pesanError,
  onTutup,
  onSubmit,
}: Props) {
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");

  useEffect(() => {
    if (!terbuka) {
      setJudul("");
      setDeskripsi("");
    }
  }, [terbuka]);

  if (!terbuka) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!judul.trim()) return;

    onSubmit({
      judul: judul.trim(),
      deskripsi: deskripsi.trim(),
    });
  }

  return (
    <div className={styles.overlay} onMouseDown={onTutup}>
      <div
        className={styles.modal}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrapper}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" />
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M9 7h7" />
                <path d="M9 10h5" />
              </svg>
            </div>

            <div>
              <h2 className={styles.title}>Buat Kelas</h2>

              <p className={styles.subtitle}>
                Tambahkan kelas baru ke sistem LMS
              </p>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onTutup}
            aria-label="Tutup"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6 6 18" />
            </svg>
          </button>
        </div>

        {/* DIVIDER */}
        <div className={styles.divider} />

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            <div className={styles.sectionLabel}>
              INFORMASI KELAS
            </div>

            {/* JUDUL */}
            <div className={styles.formGroup}>
              <label htmlFor="judul">
                Judul Kelas
                <span>*</span>
              </label>

              <div
                className={`${styles.inputWrapper} ${
                  judul ? styles.inputFilled : ""
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" />
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                </svg>

                <input
                  id="judul"
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: XI PPLG 1"
                  maxLength={100}
                  autoFocus
                />
              </div>

              <p className={styles.helper}>
                Gunakan nama yang mudah dikenali oleh guru dan siswa.
              </p>
            </div>

            {/* DESKRIPSI */}
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="deskripsi">
                  Deskripsi
                  <small>Opsional</small>
                </label>

                <span className={styles.counter}>
                  {deskripsi.length}/300
                </span>
              </div>

              <textarea
                id="deskripsi"
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Jelaskan secara singkat tentang kelas ini..."
                maxLength={300}
                rows={5}
              />

              <p className={styles.helper}>
                Deskripsi dapat membantu pengguna memahami tujuan kelas.
              </p>
            </div>

            {/* INFO */}
            <div className={styles.infoBox}>
              <div className={styles.infoIcon}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />
                  <path d="M12 10v6" />
                  <path d="M12 7h.01" />
                </svg>
              </div>

              <div>
                <strong>Kelas akan langsung tersedia</strong>

                <p>
                  Setelah dibuat, kelas dapat dikelola melalui
                  halaman detail kelas.
                </p>
              </div>
            </div>

            {pesanError && (
              <div className={styles.errorBox}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5" />
                  <path d="M12 16h.01" />
                </svg>

                <span>{pesanError}</span>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onTutup}
              disabled={sedangProses}
            >
              Batal
            </button>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={!judul.trim() || sedangProses}
            >
              {sedangProses ? (
                <>
                  <span className={styles.spinner} />
                  Membuat...
                </>
              ) : (
                <>
                  <span>+</span>
                  Buat Kelas
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}