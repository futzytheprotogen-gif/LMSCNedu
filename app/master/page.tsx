"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAppConfirm } from "@/components/ConfirmDialogProvider";
import BrandMark from "@/components/BrandMark";
import styles from "./page.module.css";

interface DataDashboard {
  counts: { admin: number; guru: number; siswa: number; kelas: number };
  maintenance: { enabled: boolean; message: string };
  audit: {
    id: string;
    actorNama: string;
    actorRole: string;
    action: string;
    details: string | null;
    createdAt: string;
  }[];
}

const LABEL_AKSI: Record<string, string> = {
  LOGIN_SUCCESS: "Sesi berhasil dibuat",
  MAINTENANCE_ENABLED: "Maintenance diaktifkan",
  MAINTENANCE_DISABLED: "Website diaktifkan kembali",
  ADMIN_ACCOUNT_CREATED: "Akun administrator dibuat",
  ADMIN_ROLE_CHANGED: "Role administrator diubah",
};

export default function MasterDashboard() {
  const konfirmasi = useAppConfirm();
  const [data, setData] = useState<DataDashboard | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const [pesanMaintenance, setPesanMaintenance] = useState("");

  const muat = useCallback(async () => {
    setMemuat(true);
    setPesan(null);
    try {
      const response = await fetch("/api/master/overview", { cache: "no-store" });
      const hasil = await response.json();
      if (!response.ok) throw new Error(hasil.pesan ?? "Ringkasan tidak dapat dimuat.");
      setData(hasil.data as DataDashboard);
      setPesanMaintenance(hasil.data.maintenance.message);
    } catch (error) {
      setPesan(error instanceof Error ? error.message : "Terjadi kesalahan saat memuat data.");
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void muat(); }, 0);
    return () => window.clearTimeout(timer);
  }, [muat]);

  async function ubahMaintenance() {
    if (!data) return;
    const aktifkan = !data.maintenance.enabled;
    const disetujui = await konfirmasi({
      title: aktifkan ? "Aktifkan maintenance?" : "Aktifkan kembali CN Edu?",
      message: aktifkan
        ? "Semua role selain Master Admin akan diblokir sementara. Akun dan data belajar tidak akan dihapus."
        : "Akses seluruh role akan dibuka kembali. Pengaturan maintenance dapat diaktifkan lagi kapan pun.",
      confirmLabel: aktifkan ? "Aktifkan sementara" : "Pulihkan akses",
      cancelLabel: "Batal",
      tone: aktifkan ? "danger" : "primary",
    });
    if (!disetujui) return;

    setSedangSimpan(true);
    setPesan(null);
    try {
      const response = await fetch("/api/master/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: aktifkan,
          message: aktifkan ? pesanMaintenance : "",
        }),
      });
      const hasil = await response.json();
      if (!response.ok) throw new Error(hasil.pesan ?? "Status website gagal diubah.");
      await muat();
    } catch (error) {
      setPesan(error instanceof Error ? error.message : "Terjadi kesalahan saat mengubah status.");
    } finally {
      setSedangSimpan(false);
    }
  }

  const totalAkun = data
    ? data.counts.admin + data.counts.guru + data.counts.siswa
    : 0;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.breadcrumb}>CN EDU <span>/</span> SYSTEMS OVERVIEW <span>/</span> 01</div>
          <h1>Pusat kendali<span>Control room / 01</span></h1>
          <p>Status layanan, akses administrator, dan aktivitas keamanan CN Edu.</p>
        </div>
        <div className={styles.live}><i /> LIVE MONITOR</div>
      </header>

      {pesan && <div className={styles.error} role="alert">{pesan}<button onClick={() => void muat()} type="button">Coba lagi</button></div>}

      <section aria-label="Ringkasan data" className={styles.metricGrid}>
        {[
          { label: "Seluruh akun", value: totalAkun, note: "admin · guru · siswa", mark: "01" },
          { label: "Administrator", value: data?.counts.admin, note: "akses pengelolaan", mark: "02" },
          { label: "Guru & siswa", value: data ? data.counts.guru + data.counts.siswa : undefined, note: `${data?.counts.guru ?? "—"} guru · ${data?.counts.siswa ?? "—"} siswa`, mark: "03" },
          { label: "Ruang kelas", value: data?.counts.kelas, note: "kelas terdaftar", mark: "04" },
        ].map((item) => (
          <article className={styles.metric} key={item.label}>
            <div className={styles.metricTop}><span>{item.label}</span><b>{item.mark}</b></div>
            <strong>{memuat ? "—" : item.value?.toLocaleString("id-ID")}</strong>
            <small>{item.note}</small>
          </article>
        ))}
      </section>

      <div className={styles.mainGrid}>
        <section className={styles.maintenanceCard}>
          <div className={styles.sectionTop}>
            <div><span className={styles.sectionCode}>01 / SERVICE CONTROL</span><h2>Mode perlindungan</h2></div>
            <span className={`${styles.status} ${data?.maintenance.enabled ? styles.statusPaused : ""}`}>
              <i />{memuat ? "MEMERIKSA" : data?.maintenance.enabled ? "MAINTENANCE" : "OPERASIONAL"}
            </span>
          </div>
          <div className={styles.serviceDisplay}>
            <div className={`${styles.orbit} ${data?.maintenance.enabled ? styles.orbitPaused : ""}`}><BrandMark /><i /><b /></div>
            <div><strong>{data?.maintenance.enabled ? "Akses pengguna dibatasi" : "Semua sistem berjalan"}</strong><p>{data?.maintenance.enabled ? "Hanya Master Admin yang dapat mengakses sistem hingga layanan dipulihkan." : "Layanan tersedia untuk role yang memiliki izin."}</p></div>
          </div>
          {data?.maintenance.enabled ? (
            <div className={styles.maintenanceMessage}><span>Pesan pemeliharaan</span><p>{data.maintenance.message || "Sistem sedang dalam pemeliharaan terjadwal."}</p></div>
          ) : (
            <label className={styles.messageInput}>Pesan pemeliharaan <span>OPSIONAL</span>
              <input maxLength={240} onChange={(event) => setPesanMaintenance(event.target.value)} placeholder="Contoh: pemeliharaan keamanan terjadwal" value={pesanMaintenance} />
            </label>
          )}
          <div className={styles.warningNote}><span>!</span><p>Perubahan ini menghentikan akses sementara, bukan menghapus akun, kelas, nilai, atau data lainnya.</p></div>
          <button className={`${styles.maintenanceButton} ${data?.maintenance.enabled ? styles.restoreButton : ""}`} disabled={!data || sedangSimpan || memuat} onClick={() => void ubahMaintenance()} type="button">
            {sedangSimpan ? "Menyimpan..." : data?.maintenance.enabled ? "Pulihkan akses website" : "Aktifkan maintenance"}
          </button>
        </section>

        <section className={styles.auditCard}>
          <div className={styles.sectionTop}>
            <div><span className={styles.sectionCode}>02 / ACCESS TRAIL</span><h2>Jejak keamanan</h2></div>
            <span className={styles.auditCount}>{data?.audit.length ?? 0} EVENT</span>
          </div>
          {memuat ? <div className={styles.empty}>Memuat catatan aktivitas…</div> : data?.audit.length ? (
            <ol className={styles.auditList}>
              {data.audit.map((event) => (
                <li key={event.id}>
                  <i className={event.action === "LOGIN_SUCCESS" ? styles.loginDot : styles.adminDot} />
                  <div className={styles.auditText}>
                    <strong>{LABEL_AKSI[event.action] ?? event.action}</strong>
                    <span>{event.actorNama} <small>{event.actorRole}</small></span>
                    {event.details && <p>{event.details}</p>}
                  </div>
                  <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}</time>
                </li>
              ))}
            </ol>
          ) : <div className={styles.empty}>Belum ada peristiwa keamanan tercatat.</div>}
        </section>
      </div>

      <section className={styles.quickSection}>
        <div className={styles.quickHeading}><div><span className={styles.sectionCode}>03 / ADMIN WORKSPACE</span><h2>Kelola ruang kerja</h2></div><p>Master Admin dapat memakai seluruh alat operasional Admin.</p></div>
        <div className={styles.quickGrid}>
          {[
            { href: "/admin/kelas", title: "Kelas", description: "Kelola ruang belajar dan anggotanya.", icon: "01" },
            { href: "/admin/akun", title: "Akun sekolah", description: "Buat akun guru dan siswa.", icon: "02" },
            { href: "/admin/guru", title: "Data guru", description: "Periksa penugasan pengajar.", icon: "03" },
            { href: "/admin/laporan", title: "Laporan akses", description: "Tinjau laporan akun dan password.", icon: "04" },
          ].map((item) => (
            <Link className={styles.quickLink} href={item.href} key={item.href}>
              <span>{item.icon}</span><div><strong>{item.title}</strong><small>{item.description}</small></div><b>↗</b>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
