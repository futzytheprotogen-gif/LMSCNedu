"use client";

import { useCallback, useEffect, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { hitungAktivitasBaru } from "@/lib/notifikasiSiswa";
import { useAppConfirm } from "@/components/ConfirmDialogProvider";
import ThemePaletteButton from "@/components/ThemePaletteButton";
import ThemeSwitchButton from "@/components/ThemeSwitchButton";
import BrandMark from "@/components/BrandMark";
import UiIcon, { type UiIconName } from "@/components/UiIcon";
import { TRANSISI_DRAWER_ROLE, VARIAN_ITEM_MENU_ROLE, VARIAN_MENU_ROLE } from "@/components/RoleMotion";
import { rekamCatatanIntegritas } from "@/lib/asesmenIntegrity";
import styles from "./layout.module.css";

const WARNA_PRIMARY = "var(--cn-primary)";
const WARNA_DANGER = "var(--cn-danger)";

const TINGGI_NAVBAR = 56;
const LEBAR_SIDEBAR = 240;

const MENU_SISWA: { label: string; href: string; icon: UiIconName; notifikasi?: boolean }[] = [
  { label: "Ringkasan", href: "/siswa", icon: "chart" },
  { label: "Kelas", href: "/siswa/kelas", icon: "classroom", notifikasi: true },
  { label: "Asesmen", href: "/siswa/asesmen", icon: "clipboard" },
  { label: "Tugas", href: "/siswa/tugas", icon: "checklist" },
];

interface KelasRingkas {
  id: string;
  aktivitasTerbaru: { createdAt: string }[];
}

export default function LayoutSiswa({ children }: { children: ReactNode }) {
  const [sidebarTerbuka, setSidebarTerbuka] = useState(false);
  const [totalNotif, setTotalNotif] = useState(0);
  const [namaPengguna, setNamaPengguna] = useState<string | null>(null);

  const pathname = usePathname();
  const router = useRouter();
  const konfirmasi = useAppConfirm();
  const idAsesmenAktif = pathname.match(/^\/siswa\/asesmen\/([^/]+)/)?.[1] ?? null;
  const sedangAsesmen = idAsesmenAktif !== null;

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
        console.error("Gagal memuat identitas Siswa:", error);
      }
    }

    void muatNamaPengguna();
    return () => { masihAktif = false; };
  }, []);

  const cekNotifBaru = useCallback(async () => {
    try {
      const response = await fetch("/api/siswa/kelas", { cache: "no-store" });
      if (!response.ok) return;

      const data = await response.json();
      const daftarKelas: KelasRingkas[] = data.data ?? [];

      const total = daftarKelas.reduce(
        (jumlah, kelas) =>
          jumlah + hitungAktivitasBaru(kelas.id, kelas.aktivitasTerbaru),
        0
      );

      setTotalNotif(total);
    } catch (error) {
      console.error("Gagal mengecek aktivitas kelas:", error);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void cekNotifBaru(); }, 0);
    const interval = setInterval(cekNotifBaru, 15000);
    return () => {
      window.clearTimeout(timer);
      clearInterval(interval);
    };
  }, [cekNotifBaru]);

  useEffect(() => {
    if (pathname.startsWith("/siswa/kelas")) {
      const timer = setTimeout(cekNotifBaru, 500);
      return () => clearTimeout(timer);
    }
  }, [pathname, cekNotifBaru]);

  async function handleLogout() {
    if (!(await konfirmasi({
      title: sedangAsesmen ? "Keluar dari ujian dan akun?" : "Keluar dari akun?",
      message: sedangAsesmen
        ? "Ujian masih berlangsung. Jika ada kendala dan tetap ingin keluar, timer tetap berjalan dan jawaban yang belum dikirim dapat hilang."
        : "Sesi CN Edu akan diakhiri pada perangkat ini.",
      confirmLabel: sedangAsesmen ? "Keluar dan logout" : "Ya, keluar",
      cancelLabel: sedangAsesmen ? "Lanjutkan ujian" : "Tetap di sini",
      tone: "primary",
    }))) return;
    if (idAsesmenAktif) rekamCatatanIntegritas(idAsesmenAktif, "LOGOUT_DURING_ASSESSMENT");
    const response = await fetch("/api/auth", { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) return;
    router.push(result.redirect);
  }

  function handleMenuNavigation(
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
    hasNotifications?: boolean
  ) {
    if (sedangAsesmen) {
      event.preventDefault();
      return;
    }

    setSidebarTerbuka(false);
    if (hasNotifications) setTimeout(cekNotifBaru, 500);
    router.push(href);
  }

  return (
    <div style={estilo.wadah}>
      <header className={`cn-role-navbar ${styles.navbar}`} style={estilo.navbar}>
        <button
          className={`cn-role-hamburger ${styles.hamburger}`}
          onClick={() => {
            if (!sedangAsesmen) setSidebarTerbuka(true);
          }}
          disabled={sedangAsesmen}
          style={estilo.tombolHamburger}
          aria-label={sedangAsesmen ? "Navigasi dikunci selama ujian" : "Buka menu"}
          type="button"
        >
          ☰
        </button>

        <span className="cn-role-brand" style={{ ...estilo.namaBrand, display: "inline-flex", alignItems: "center", gap: 8 }} title={namaPengguna ?? "CN Edu"}>
          <BrandMark style={{ width: 34, height: 34, color: "var(--cn-primary)" }} />
          <span style={estilo.namaBrandText}>CN Edu{namaPengguna ? ` — ${namaPengguna}` : ""}</span>
        </span>
        <div style={estilo.navKanan}>
          <ThemePaletteButton />
          <ThemeSwitchButton />
          <Link
            href="/profil/saya"
            style={estilo.tombolProfil}
            onClick={(event) => {
              if (!sedangAsesmen) return;
              void handleMenuNavigation(event, "/profil/saya");
            }}
          >
            Profil
          </Link>
        </div>
      </header>

      <AnimatePresence>
        {sidebarTerbuka && !sedangAsesmen && (
          <motion.div
            aria-hidden="true"
            animate={{ opacity: 1 }}
            className={`cn-role-overlay ${styles.overlay}`}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setSidebarTerbuka(false)}
            style={estilo.overlay}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`cn-role-sidebar ${styles.sidebar}`}
        initial={false}
        animate={{ x: sidebarTerbuka && !sedangAsesmen ? 0 : "-100%" }}
        transition={TRANSISI_DRAWER_ROLE}
        style={estilo.sidebar}
      >
        <div className={`cn-role-sidebar-header ${styles.sidebarHeader}`} style={estilo.headerSidebar}>
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

        {sedangAsesmen ? (
          <div className={styles.examLocked} role="status">
            Ujian sedang berlangsung. Navigasi dikunci sampai kamu menyelesaikan ujian.
          </div>
        ) : (
          <motion.nav className="cn-role-navigation" aria-label="Menu Siswa" style={estilo.nav} variants={VARIAN_MENU_ROLE} initial="sembunyi" animate="tampil">
            <span className="cn-role-nav-label">RUANG BELAJAR</span>
            {MENU_SISWA.map((item) => {
            const aktif = item.href === "/siswa"
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <motion.div key={item.href} variants={VARIAN_ITEM_MENU_ROLE} whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
              <Link
                aria-current={aktif ? "page" : undefined}
                href={item.href}
                onClick={(event) => {
                  if (sedangAsesmen) {
                    void handleMenuNavigation(event, item.href, item.notifikasi);
                    return;
                  }
                  setSidebarTerbuka(false);
                  if (item.notifikasi) setTimeout(cekNotifBaru, 500);
                }}
                style={{ ...estilo.linkMenu, ...(aktif ? estilo.linkMenuAktif : {}) }}
              >
                <span style={estilo.menuLabelGroup}>
                  <span style={estilo.iconMenu}><UiIcon name={item.icon} size={18} /></span>
                  <span style={estilo.labelMenu}>{item.label}</span>
                </span>

                {item.notifikasi && totalNotif > 0 && (
                  <span
                    style={estilo.badgeNotifikasi}
                    title={`${totalNotif} aktivitas baru`}
                  >
                    {totalNotif > 99 ? "99+" : totalNotif}
                  </span>
                )}
              </Link>
              </motion.div>
            );
            })}
          </motion.nav>
        )}

        <div className="cn-role-sidebar-footer">
          <button className="cn-role-logout-action" onClick={handleLogout} type="button">
            <UiIcon name="logout" size={16} />
            <span>Keluar dari akun</span>
          </button>
        </div>
      </motion.aside>

      <main className={`cn-role-main ${styles.content}`} style={estilo.konten}>{children}</main>
    </div>
  );
}

const estilo = {
  wadah: { minHeight: "100vh", backgroundColor: "var(--cn-tint)" },
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
    boxSizing: "border-box" as const,
  },
  tombolHamburger: {
    width: "38px",
    height: "38px",
    fontSize: "21px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--cn-coral-dark)",
    padding: "0",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  namaBrand: { fontSize: "15px", fontWeight: 700, color: "var(--cn-coral-dark)" },
  namaBrandText: {
    display: "block",
    minWidth: 0,
    maxWidth: "min(42vw, 320px)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  navKanan: { display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" },
  tombolProfil: { fontSize: "13px", fontWeight: 700, color: WARNA_PRIMARY, textDecoration: "none", padding: "8px 10px" },
  overlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(var(--cn-navy-rgb), 0.42)",
    zIndex: 40,
    backdropFilter: "blur(1px)",
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
  headerSidebar: {
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
  nav: {
    display: "flex",
    flexDirection: "column" as const,
    padding: "14px 12px",
    gap: "4px",
  },
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
  badgeNotifikasi: {
    minWidth: "21px",
    height: "21px",
    padding: "0 6px",
    boxSizing: "border-box" as const,
    borderRadius: "999px",
    backgroundColor: WARNA_DANGER,
    color: "var(--cn-surface)",
    fontSize: "10px",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    boxShadow: "0 2px 6px rgba(var(--cn-danger-rgb), 0.3)",
    flexShrink: 0,
  },
  konten: {
    paddingTop: `${TINGGI_NAVBAR}px`,
    minHeight: "100vh",
    boxSizing: "border-box" as const,
  },
};