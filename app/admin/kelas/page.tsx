  "use client";

  import { useEffect, useState, useCallback } from "react";
  import { useRouter } from "next/navigation";
  import KelasCard, { type DataKelasCard } from "@/components/KelasCard";
  import ModalKelas from "@/components/ModalKelas";
  import styles from "./page.module.css";

  const WARNA = {
    navy: "#214E84",
    blue: "#2870E8",
    teal: "#70C1C4",
  };

  export default function HalamanBuatKelasAdmin() {
    const router = useRouter();

    const [daftarKelas, setDaftarKelas] = useState<DataKelasCard[]>([]);
    const [sedangMuat, setSedangMuat] = useState(true);

    const [modalTerbuka, setModalTerbuka] = useState(false);
    const [sedangProsesSimpan, setSedangProsesSimpan] = useState(false);
    const [pesanErrorModal, setPesanErrorModal] = useState<string | null>(null);

    const [pencarian, setPencarian] = useState("");

    const muatDaftarKelas = useCallback(async () => {
      setSedangMuat(true);

      try {
        const response = await fetch("/api/kelas");
        const data = await response.json();

        if (response.ok) {
          setDaftarKelas(data.data ?? []);
        }
      } catch (error) {
        console.error("Gagal memuat kelas:", error);
      } finally {
        setSedangMuat(false);
      }
    }, []);

    useEffect(() => {
      muatDaftarKelas();
    }, [muatDaftarKelas]);

    async function handleBuatKelas({
      judul,
      deskripsi,
    }: {
      judul: string;
      deskripsi: string;
    }) {
      setSedangProsesSimpan(true);
      setPesanErrorModal(null);

      try {
        const response = await fetch("/api/kelas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            judul,
            deskripsi,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setPesanErrorModal(
            data.pesan ?? "Gagal membuat kelas. Silakan coba lagi."
          );
          return;
        }

        setModalTerbuka(false);
        await muatDaftarKelas();
      } catch {
        setPesanErrorModal(
          "Tidak bisa terhubung ke server. Periksa koneksi dan coba lagi."
        );
      } finally {
        setSedangProsesSimpan(false);
      }
    }

    const kelasTerfilter = daftarKelas.filter((kelas) =>
      kelas.judul.toLowerCase().includes(pencarian.toLowerCase())
    );

    return (
      <main className={styles.page}>
        {/* =========================
            HEADER
        ========================== */}
        <section className={styles.hero}>
          <div>
            <div className={styles.breadcrumb}>
              <span>Admin</span>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbActive}>Kelas</span>
            </div>

            <h1 className={styles.title}>Buat Kelas</h1>

            <p className={styles.subtitle}>
              Kelola kelas pembelajaran dan atur materi untuk siswa.
            </p>
          </div>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => {
              setPesanErrorModal(null);
              setModalTerbuka(true);
            }}
          >
            <span className={styles.plusIcon}>+</span>
            Buat Kelas
          </button>
        </section>

        {/* =========================
            STATISTIC
        ========================== */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.navyIcon}`}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M3 9h18" />
                <path d="M8 13h3M8 16h5" />
              </svg>
            </div>

            <div>
              <p className={styles.statLabel}>Total Kelas</p>
              <h2 className={styles.statNumber}>{daftarKelas.length}</h2>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.blueIcon}`}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 19V5" />
                <path d="M4 5h13l-2 3 2 3H4" />
              </svg>
            </div>

            <div>
              <p className={styles.statLabel}>Kelas Aktif</p>
              <h2 className={styles.statNumber}>{daftarKelas.length}</h2>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.tealIcon}`}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v4l3 2" />
              </svg>
            </div>

            <div>
              <p className={styles.statLabel}>Status</p>
              <h2 className={styles.statStatus}>Terorganisir</h2>
            </div>
          </div>
        </section>

        {/* =========================
            TOOLBAR
        ========================== */}
        <section className={styles.toolbar}>
          <div>
            <h2 className={styles.sectionTitle}>Daftar Kelas</h2>
            <p className={styles.sectionDescription}>
              Semua kelas yang tersedia dalam sistem.
            </p>
          </div>

          <div className={styles.toolbarActions}>
            <div className={styles.searchBox}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>

              <input
                type="text"
                placeholder="Cari kelas..."
                value={pencarian}
                onChange={(e) => setPencarian(e.target.value)}
              />
            </div>

            <button type="button" className={styles.filterButton}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 6h16" />
                <path d="M7 12h10" />
                <path d="M10 18h4" />
              </svg>

              Filter
            </button>
          </div>
        </section>

        {/* =========================
            CONTENT
        ========================== */}
        <section className={styles.content}>
          {sedangMuat ? (
            <div className={styles.loadingGrid}>
              {[1, 2, 3].map((item) => (
                <div className={styles.skeletonCard} key={item}>
                  <div className={styles.skeletonTop} />
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLineSmall} />
                </div>
              ))}
            </div>
          ) : kelasTerfilter.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M8 10h8" />
                  <path d="M8 14h5" />
                </svg>
              </div>

              <h3>
                {pencarian
                  ? "Kelas tidak ditemukan"
                  : "Belum ada kelas"}
              </h3>

              <p>
                {pencarian
                  ? "Coba gunakan kata kunci pencarian yang berbeda."
                  : "Mulai dengan membuat kelas pertama untuk pembelajaran."}
              </p>

              {!pencarian && (
                <button
                  type="button"
                  className={styles.emptyButton}
                  onClick={() => setModalTerbuka(true)}
                >
                  + Buat Kelas Pertama
                </button>
              )}
            </div>
          ) : (
            <div className={styles.grid}>
              {kelasTerfilter.map((kelas) => (
                <KelasCard
                  key={kelas.id}
                  kelas={kelas}
                  onKlik={() => router.push(`/admin/kelas/${kelas.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* =========================
            MODAL
        ========================== */}
        <ModalKelas
          terbuka={modalTerbuka}
          sedangProses={sedangProsesSimpan}
          pesanError={pesanErrorModal}
          onTutup={() => {
            setModalTerbuka(false);
            setPesanErrorModal(null);
          }}
          onSubmit={handleBuatKelas}
        />
      </main>
    );
  }

