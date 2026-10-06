"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useAppConfirm } from "@/components/ConfirmDialogProvider";
import ThemeSwitchButton from "@/components/ThemeSwitchButton";
import { TRANSISI_DRAWER_ROLE, VARIAN_ITEM_MENU_ROLE, VARIAN_MENU_ROLE } from "@/components/RoleMotion";

const WARNA_PRIMARY = "var(--cn-primary)";
const TINGGI_NAVBAR = 56;
const LEBAR_SIDEBAR = 240;

const MENU_GURU = [
  { label: "Kelas", href: "/guru/kelas" },
  { label: "Asesmen", href: "/guru/asesmen" },
  { label: "Tugas", href: "/guru/tugas" },
];

export default function LayoutGuru({ children }: { children: ReactNode }) {
  const [sidebarTerbuka, setSidebarTerbuka] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const konfirmasi = useAppConfirm();

  async function handleLogout() {
    if (!(await konfirmasi({
      title: "Keluar dari akun?",
      message: "Sesi CN Edu akan diakhiri pada perangkat ini.",
      confirmLabel: "Ya, keluar",
      cancelLabel: "Tetap di sini",
      tone: "primary",
    }))) return;
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <div style={estilo.wadah}>
      <header className="cn-role-navbar" style={estilo.navbar}>
        <button
          className="cn-role-hamburger"
          onClick={() => setSidebarTerbuka(true)}
          style={estilo.tombolHamburger}
          aria-label="Buka menu"
          type="button"
        >
          ☰
        </button>
        <Link className="cn-role-brand" href="/guru/kelas" style={estilo.namaBrand}>CN Edu — Guru</Link>
        <div style={estilo.navKanan}>
          <ThemeSwitchButton />
          <Link href="/profil/saya" style={estilo.tombolProfil}>
            Profil
          </Link>
        </div>
      </header>

      <AnimatePresence>
        {sidebarTerbuka && (
          <motion.div
            aria-hidden="true"
            animate={{ opacity: 1 }}
            className="cn-role-overlay"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setSidebarTerbuka(false)}
            style={estilo.overlay}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className="cn-role-sidebar"
        initial={false}
        animate={{ x: sidebarTerbuka ? 0 : "-100%" }}
        transition={TRANSISI_DRAWER_ROLE}
        style={estilo.sidebar}
      >
        <div className="cn-role-sidebar-header" style={estilo.sidebarHeading}>
          <span style={estilo.namaBrandSidebar}>CN Edu</span>
          <button
            onClick={() => setSidebarTerbuka(false)}
            style={estilo.tombolTutup}
            aria-label="Tutup menu"
            type="button"
          >
            ✕
          </button>
        </div>

        <motion.nav aria-label="Menu Guru" style={estilo.nav} variants={VARIAN_MENU_ROLE} initial="sembunyi" animate="tampil">
          {MENU_GURU.map((item) => {
            const aktif = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <motion.div key={item.href} variants={VARIAN_ITEM_MENU_ROLE} whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
                <Link
                  aria-current={aktif ? "page" : undefined}
                  href={item.href}
                  onClick={() => setSidebarTerbuka(false)}
                  style={{ ...estilo.linkMenu, ...(aktif ? estilo.linkMenuAktif : {}) }}
                >
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>
        <div className="cn-role-sidebar-footer">
          <button className="cn-role-logout-action" onClick={handleLogout} type="button">
            Keluar dari akun
          </button>
        </div>
      </motion.aside>

      <main className="cn-role-main" style={estilo.konten}>{children}</main>
    </div>
  );
}

const estilo = {
  wadah: { minHeight: "100vh", backgroundColor: "var(--cn-surface)" },
  navbar: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    height: `${TINGGI_NAVBAR}px`,
    backgroundColor: "var(--cn-surface)",
    borderBottom: "1px solid var(--cn-line)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    zIndex: 30,
  },
  tombolHamburger: {
    fontSize: "20px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--cn-navy)",
    padding: "8px",
  },
  namaBrand: {
    fontSize: "15px",
    fontWeight: 700,
    color: "var(--cn-navy)",
    textDecoration: "none",
  },
  navKanan: { display: "flex", alignItems: "center", gap: "10px" },
  tombolProfil: {
    fontSize: "13px",
    fontWeight: 600,
    color: WARNA_PRIMARY,
    textDecoration: "none",
  },
  overlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(var(--cn-navy-rgb), 0.4)",
    zIndex: 40,
  },
  sidebar: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    bottom: 0,
    width: `${LEBAR_SIDEBAR}px`,
    backgroundColor: "var(--cn-surface)",
    borderRight: "1px solid var(--cn-line)",
    zIndex: 50,
    display: "flex",
    flexDirection: "column" as const,
    boxShadow: "8px 0 25px rgba(var(--cn-navy-rgb), 0.08)",
  },
  sidebarHeading: {
    height: `${TINGGI_NAVBAR}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    borderBottom: "1px solid var(--cn-line)",
    boxSizing: "border-box" as const,
  },
  namaBrandSidebar: {
    fontSize: "17px",
    fontWeight: 800,
    color: WARNA_PRIMARY,
    letterSpacing: "-0.02em",
  },
  tombolTutup: {
    width: "32px",
    height: "32px",
    fontSize: "16px",
    background: "none",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    color: "var(--cn-coral-dark)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  nav: { display: "flex", flexDirection: "column" as const, padding: "14px 12px", gap: "4px" },
  linkMenu: {
    minHeight: "43px",
    padding: "0 12px",
    borderRadius: "9px",
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--cn-coral-dark)",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    boxSizing: "border-box" as const,
    transition: "background-color 0.15s ease",
  },
  linkMenuAktif: { backgroundColor: "var(--cn-tint)", color: WARNA_PRIMARY },
  konten: { paddingTop: `${TINGGI_NAVBAR}px` },
};