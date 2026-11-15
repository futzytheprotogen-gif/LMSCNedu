"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useAppConfirm } from "@/components/ConfirmDialogProvider";
import ThemePaletteButton from "@/components/ThemePaletteButton";
import ThemeSwitchButton from "@/components/ThemeSwitchButton";
import BrandMark from "@/components/BrandMark";
import UiIcon, { type UiIconName } from "@/components/UiIcon";
import { TRANSISI_DRAWER_ROLE, VARIAN_ITEM_MENU_ROLE, VARIAN_MENU_ROLE } from "@/components/RoleMotion";

const WARNA_PRIMARY = "var(--cn-primary)";
const TINGGI_NAVBAR = 56;
const LEBAR_SIDEBAR = 240;

const MENU_GURU: { label: string; href: string; icon: UiIconName }[] = [
  { label: "Kelas", href: "/guru/kelas", icon: "classroom" },
  { label: "Asesmen", href: "/guru/asesmen", icon: "clipboard" },
  { label: "Tugas", href: "/guru/tugas", icon: "checklist" },
];

export default function LayoutGuru({ children }: { children: ReactNode }) {
  const [sidebarTerbuka, setSidebarTerbuka] = useState(false);
  const [namaPengguna, setNamaPengguna] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const konfirmasi = useAppConfirm();

  useEffect(() => {
    let masihAktif = true;
    async function muatNamaPengguna() {
      try {
        const response = await fetch("/api/sesi", { cache: "no-store" });
        const hasil = await response.json();
        if (!response.ok) throw new Error(hasil.pesan ?? "Gagal memuat nama akun.");
        if (typeof hasil.data?.nama !== "string" || !hasil.data.nama.trim()) {
          throw new Error("Nama akun tidak tersedia di sesi.");
        }
        if (masihAktif) setNamaPengguna(hasil.data.nama.trim());
      } catch (error) {
        console.error("Gagal memuat identitas Guru:", error);
      }
    }

    void muatNamaPengguna();
    return () => { masihAktif = false; };
  }, []);

  async function handleLogout() {
    if (!(await konfirmasi({
      title: "Keluar dari akun?",
      message: "Sesi CN Edu akan diakhiri pada perangkat ini.",
      confirmLabel: "Ya, keluar",
      cancelLabel: "Tetap di sini",
      tone: "primary",
    }))) return;
    const response = await fetch("/api/auth", { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) return;
    router.push(result.redirect);
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
        <Link className="cn-role-brand" href="/guru/kelas" style={{ ...estilo.namaBrand, display: "inline-flex", alignItems: "center", gap: 8 }} title={namaPengguna ?? "CN Edu"}>
          <BrandMark style={{ width: 34, height: 34, color: "var(--cn-primary)" }} />
          <span style={estilo.namaBrandText}>CN Edu{namaPengguna ? ` — ${namaPengguna}` : ""}</span>
        </Link>
        <div style={estilo.navKanan}>
          <ThemePaletteButton />
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BrandMark style={{ width: 25, height: 25, color: "var(--cn-primary)" }} />
            <span style={estilo.namaBrandSidebar}>CN Edu</span>
          </div>
          <button
            onClick={() => setSidebarTerbuka(false)}
            style={estilo.tombolTutup}
            aria-label="Tutup menu"
            type="button"
          >
            ✕
          </button>
        </div>

        <motion.nav className="cn-role-navigation" aria-label="Menu Guru" style={estilo.nav} variants={VARIAN_MENU_ROLE} initial="sembunyi" animate="tampil">
          <span className="cn-role-nav-label">MENU UTAMA</span>
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
                  <span style={estilo.menuLabelGroup}>
                    <span style={estilo.iconMenu}><UiIcon name={item.icon} size={18} /></span>
                    <span style={estilo.labelMenu}>{item.label}</span>
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>
        <div className="cn-role-sidebar-footer">
          <button className="cn-role-logout-action" onClick={handleLogout} type="button">
            <UiIcon name="logout" size={16} />
            <span>Keluar dari akun</span>
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
  namaBrandText: {
    display: "block",
    minWidth: 0,
    maxWidth: "min(42vw, 320px)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
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
  menuLabelGroup: { display: "flex", minWidth: 0, alignItems: "center", gap: "11px" },
  iconMenu: { display: "grid", width: "20px", height: "20px", flexShrink: 0, placeItems: "center", color: "currentColor" },
  labelMenu: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  konten: { paddingTop: `${TINGGI_NAVBAR}px` },
};