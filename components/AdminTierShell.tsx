"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useAppConfirm } from "@/components/ConfirmDialogProvider";
import ThemeSwitchButton from "@/components/ThemeSwitchButton";
import BrandMark from "@/components/BrandMark";
import { TRANSISI_DRAWER_ROLE, VARIAN_ITEM_MENU_ROLE, VARIAN_MENU_ROLE } from "@/components/RoleMotion";
import styles from "./AdminTierShell.module.css";

interface AdminTierShellProps {
  children: ReactNode;
  role: "Kepsek" | "Kurikulum";
}

export default function AdminTierShell({ children, role }: AdminTierShellProps) {
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const konfirmasi = useAppConfirm();
  const awalan = role === "Kepsek" ? "/kepsek" : "/kurikulum";
  const menu = [
    { label: "Kelas", href: `${awalan}/kelas` },
    { label: "Siswa", href: `${awalan}/siswa` },
    { label: "Guru", href: `${awalan}/guru` },
    ...(role === "Kurikulum"
      ? [{ label: "Rekap Nilai", href: "/kurikulum/rekap-nilai" }]
      : []),
  ];

  async function keluar() {
    const disetujui = await konfirmasi({
      title: "Keluar dari akun?",
      message: "Sesi CN Edu akan diakhiri pada perangkat ini.",
      confirmLabel: "Ya, keluar",
      cancelLabel: "Tetap di sini",
      tone: "primary",
    });
    if (!disetujui) return;

    const response = await fetch("/api/auth", { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) return;
    router.replace(result.redirect);
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <button
          aria-label={menuTerbuka ? "Tutup menu" : "Buka menu"}
          aria-expanded={menuTerbuka}
          className={styles.menuToggle}
          onClick={() => setMenuTerbuka((terbuka) => !terbuka)}
          type="button"
        >
          {menuTerbuka ? "×" : "☰"}
        </button>
        <Link className={styles.brand} href={`${awalan}/kelas`}>
          <BrandMark className={styles.brandMark} />
          <span>CN Edu <small>— {role}</small></span>
        </Link>
        <div className={styles.topbarActions}>
          <ThemeSwitchButton />
          <Link className={styles.profile} href="/profil/saya">Profil <span>↗</span></Link>
        </div>
      </header>

      <AnimatePresence>
        {menuTerbuka && (
          <motion.button
            animate={{ opacity: 1 }}
            aria-label="Tutup menu"
            className={styles.scrim}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setMenuTerbuka(false)}
            type="button"
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ x: menuTerbuka ? 0 : "-102%" }}
        className={`${styles.sidebar} ${menuTerbuka ? styles.sidebarOpen : ""}`}
        initial={false}
        transition={TRANSISI_DRAWER_ROLE}
      >
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarBrand}>CN Edu — {role}</span>
          <button
            aria-label="Tutup menu"
            className={styles.closeMenu}
            onClick={() => setMenuTerbuka(false)}
            type="button"
          >
            ×
          </button>
        </div>
        <motion.nav
          animate="tampil"
          aria-label={`Menu ${role}`}
          className={styles.navigation}
          initial="sembunyi"
          variants={VARIAN_MENU_ROLE}
        >
          {menu.map((item) => {
            const aktif = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <motion.div
                key={item.href}
                variants={VARIAN_ITEM_MENU_ROLE}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  aria-current={aktif ? "page" : undefined}
                  className={`${styles.navLink} ${aktif ? styles.navLinkActive : ""}`}
                  href={item.href}
                  onClick={() => setMenuTerbuka(false)}
                >
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>
        <div className={styles.sidebarFooter}>
          <button className={styles.logout} onClick={keluar} type="button">
            <span aria-hidden="true">↪</span> Keluar dari akun
          </button>
        </div>
      </motion.aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
}