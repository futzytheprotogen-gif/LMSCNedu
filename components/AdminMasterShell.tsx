"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppConfirm } from "@/components/ConfirmDialogProvider";
import ThemeSwitchButton from "@/components/ThemeSwitchButton";
import BrandMark from "@/components/BrandMark";
import MasterActingAsControl from "@/components/MasterActingAsControl";
import styles from "./AdminMasterShell.module.css";

const MENU_MASTER = [
  { label: "Ringkasan", href: "/master", icon: "◈" },
  { label: "Administrator", href: "/master/admins", icon: "⌘" },
];

const MENU_OPERASIONAL = [
  { label: "Kelas", href: "/admin/kelas" },
  { label: "Akun sekolah", href: "/admin/akun" },
  { label: "Guru", href: "/admin/guru" },
  { label: "Siswa", href: "/admin/siswa" },
  { label: "Laporan", href: "/admin/laporan" },
];

export default function AdminMasterShell({ children }: { children: ReactNode }) {
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const [sedangMasuk, setSedangMasuk] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const konfirmasi = useAppConfirm();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(
      () => setSedangMasuk(false),
      prefersReducedMotion ? 120 : 1250
    );
    return () => window.clearTimeout(timer);
  }, []);

  async function keluar() {
    const disetujui = await konfirmasi({
      title: "Akhiri sesi Master Admin?",
      message: "Kamu perlu login kembali untuk membuka konsol keamanan.",
      confirmLabel: "Keluar",
      cancelLabel: "Batal",
      tone: "danger",
    });
    if (!disetujui) return;
    const response = await fetch("/api/auth?scope=all", { method: "DELETE" });
    if (!response.ok) return;
    router.replace("/login");
  }

  function tautanMenu(href: string) {
    return pathname === href || (href !== "/master" && pathname.startsWith(`${href}/`));
  }

  return (
    <div className={styles.shell} id="master-admin-shell">
      {sedangMasuk && (
        <div aria-live="polite" className={styles.bootScreen} role="status">
          <div className={styles.bootGlow} aria-hidden="true" />
          <div className={styles.bootContent}>
            <span className={styles.bootEyebrow}>CN EDU <i>CONTROL SYSTEM</i></span>
            <div aria-hidden="true" className={styles.loaderVisual}>
              <span className={styles.loaderOrbit}><i /><b /></span>
              <span className={styles.loaderOrbitInner} />
              <span className={styles.bootMark}><BrandMark className={styles.bootGlyph} /></span>
            </div>
            <strong>Memverifikasi akses</strong>
            <span className={styles.bootCode}>MENYIAPKAN RUANG KENDALI MASTER</span>
            <div aria-hidden="true" className={styles.bootTrack}><i /></div>
            <div className={styles.bootMeta}>
              <span>SECURE SESSION</span>
              <span>MASTER NODE <i /></span>
            </div>
          </div>
          <span className={styles.bootIndex}>CN EDU / SYSTEM ACCESS</span>
        </div>
      )}
      <header className={styles.topbar}>
        <button
          aria-expanded={menuTerbuka}
          aria-label={menuTerbuka ? "Tutup navigasi" : "Buka navigasi"}
          className={styles.menuToggle}
          onClick={() => setMenuTerbuka((terbuka) => !terbuka)}
          type="button"
        >
          {menuTerbuka ? "×" : "☰"}
        </button>
        <Link className={styles.brand} href="/master">
          <BrandMark className={styles.brandMark} />
          <span>CN EDU <small>CONTROL ROOM</small></span>
        </Link>
        <div className={styles.topActions}>
          <span className={styles.secureBadge}><i /> ENCRYPTED SESSION</span>
          <ThemeSwitchButton />
          <Link className={styles.profile} href="/profil/saya">Profil</Link>
        </div>
      </header>

      {menuTerbuka && (
        <button
          aria-label="Tutup navigasi"
          className={styles.scrim}
          onClick={() => setMenuTerbuka(false)}
          type="button"
        />
      )}

      <aside className={`${styles.sidebar} ${menuTerbuka ? styles.sidebarOpen : ""}`}>
        <div className={styles.sideHeading}>
          <span className={styles.signal}><i /><i /><i /></span>
          <div><strong>MASTER CONSOLE</strong><small>CN EDU / SYSTEMS</small></div>
          <button aria-label="Tutup navigasi" className={styles.closeMenu} onClick={() => setMenuTerbuka(false)} type="button">×</button>
        </div>
        <nav aria-label="Navigasi Master Admin" className={styles.navigation}>
          <span className={styles.navLabel}>KONSOL</span>
          {MENU_MASTER.map((item) => (
            <Link
              aria-current={tautanMenu(item.href) ? "page" : undefined}
              className={`${styles.navLink} ${tautanMenu(item.href) ? styles.active : ""}`}
              href={item.href}
              key={item.href}
              onClick={() => setMenuTerbuka(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>{item.label}
            </Link>
          ))}
          <span className={styles.navLabel}>OPERASIONAL</span>
          {MENU_OPERASIONAL.map((item) => (
            <Link
              aria-current={tautanMenu(item.href) ? "page" : undefined}
              className={`${styles.navLink} ${tautanMenu(item.href) ? styles.active : ""}`}
              href={item.href}
              key={item.href}
              onClick={() => setMenuTerbuka(false)}
            >
              <span className={styles.navIcon}>↗</span>{item.label}
            </Link>
          ))}
        </nav>
        <MasterActingAsControl />
        <div className={styles.sideFooter}>
          <div className={styles.accessNote}><span>●</span><div><strong>Root access active</strong><small>Actions are logged</small></div></div>
          <button className={styles.logout} onClick={keluar} type="button">↪ <span>Keluar dengan aman</span></button>
        </div>
      </aside>

      <main className={styles.content}>
        <div className={styles.contentInner}>{children}</div>
      </main>
    </div>
  );
}
