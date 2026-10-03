"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { hitungAktivitasBaru } from "@/lib/notifikasiSiswa";
import { useAppConfirm } from "@/components/ConfirmDialogProvider";
import styles from "./layout.module.css";

const WARNA_PRIMARY = "var(--cn-primary)";
const WARNA_DANGER = "var(--cn-danger)";

const TINGGI_NAVBAR = 56;
const LEBAR_SIDEBAR = 240;

const MENU_SISWA = [
  { label: "Ringkasan", href: "/siswa" },
  { label: "Kelas", href: "/siswa/kelas", notifikasi: true },
  { label: "Asesmen", href: "/siswa/asesmen" },
  { label: "Tugas", href: "/siswa/tugas" },
];

interface KelasRingkas {
  id: string;
  aktivitasTerbaru: { createdAt: string }[];
}

export default function LayoutSiswa({ children }: { children: ReactNode }) {
  const [sidebarTerbuka, setSidebarTerbuka] = useState(false);
  const [totalNotif, setTotalNotif] = useState(0);

  const pathname = usePathname();
  const router = useRouter();
  const konfirmasi = useAppConfirm();

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
      <header className={`cn-role-navbar ${styles.navbar}`} style={estilo.navbar}>
        <button
          className={`cn-role-hamburger ${styles.hamburger}`}
          onClick={() => setSidebarTerbuka(true)}
          style={estilo.tombolHamburger}
          aria-label="Buka menu"
          type="button"
        >
          ☰
        </button>

        <span className="cn-role-brand" style={estilo.namaBrand}>CN Edu — Siswa</span>
        <div style={estilo.navKanan}>
          <Link href="/profil/saya" style={estilo.tombolProfil}>Profil</Link>
        </div>
      </header>

      {sidebarTerbuka && (
        <div
          className={`cn-role-overlay ${styles.overlay}`}
          style={estilo.overlay}
          onClick={() => setSidebarTerbuka(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`cn-role-sidebar ${styles.sidebar}`}
        style={{
          ...estilo.sidebar,
          transform: sidebarTerbuka ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div className={`cn-role-sidebar-header ${styles.sidebarHeader}`} style={estilo.headerSidebar}>
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

        <nav style={estilo.nav}>
          {MENU_SISWA.map((item) => {
            const aktif = item.href === "/siswa"
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setSidebarTerbuka(false);
                  if (item.notifikasi) {
                    setTimeout(cekNotifBaru, 500);
                  }
                }}
                style={{
                  ...estilo.linkMenu,
                  ...(aktif ? estilo.linkMenuAktif : {}),
                }}
              >
                <span style={estilo.labelMenu}>{item.label}</span>

                {item.notifikasi && totalNotif > 0 && (
                  <span
                    style={estilo.badgeNotifikasi}
                    title={`${totalNotif} aktivitas baru`}
                  >
                    {totalNotif > 99 ? "99+" : totalNotif}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="cn-role-sidebar-footer">
          <button className="cn-role-logout-action" onClick={handleLogout} type="button">
            Keluar dari akun
          </button>
        </div>
      </aside>

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
  navKanan: { display: "flex", alignItems: "center", marginLeft: "auto" },
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
    transition: "transform 0.22s ease-in-out",
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