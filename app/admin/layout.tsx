"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useAppConfirm } from "@/components/ConfirmDialogProvider";
import ThemeSwitchButton from "@/components/ThemeSwitchButton";
import { TRANSISI_DRAWER_ROLE, VARIAN_ITEM_MENU_ROLE, VARIAN_MENU_ROLE } from "@/components/RoleMotion";

// ------------------------------------------------------------
// Layout Admin
// Membungkus semua halaman di dalam app/admin/**.
// Sidebar akan menampilkan notifikasi merah pada menu Laporan
// apabila terdapat laporan lupa password dengan status MENUNGGU.
// ------------------------------------------------------------

const WARNA_PRIMARY = "var(--cn-primary)";
const WARNA_DANGER = "var(--cn-danger)";

const TINGGI_NAVBAR = 56;
const LEBAR_SIDEBAR = 240;

const MENU_ADMIN = [
  { label: "Buat Kelas", href: "/admin/kelas" },
  { label: "Buat Akun", href: "/admin/akun" },
  { label: "Daftar Siswa", href: "/admin/siswa" },
  { label: "Daftar Guru", href: "/admin/guru" },
  { label: "Laporan", href: "/admin/laporan", notifikasi: true },
];

interface DataLaporan {
  status: string;
}

export default function LayoutAdmin({
  children,
}: {
  children: ReactNode;
}) {
  const [sidebarTerbuka, setSidebarTerbuka] = useState(false);
  const [jumlahLaporan, setJumlahLaporan] = useState(0);

  const pathname = usePathname();
  const router = useRouter();
  const konfirmasi = useAppConfirm();

  // ============================================================
  // CEK JUMLAH LAPORAN BARU
  // ============================================================

  const cekLaporanBaru = useCallback(async () => {
    try {
      const response = await fetch("/api/lupa-password", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      const daftarLaporan: DataLaporan[] = data.data ?? [];

      // Hanya laporan MENUNGGU yang dianggap sebagai notifikasi baru.
      const jumlahMenunggu = daftarLaporan.filter(
        (laporan) => laporan.status === "MENUNGGU"
      ).length;

      setJumlahLaporan(jumlahMenunggu);
    } catch (error) {
      console.error("Gagal mengecek laporan:", error);
    }
  }, []);

  // ============================================================
  // LOAD + AUTO REFRESH
  // ============================================================

  useEffect(() => {
    const timer = window.setTimeout(() => { void cekLaporanBaru(); }, 0);

    // Cek setiap 15 detik
    const interval = setInterval(() => {
      cekLaporanBaru();
    }, 15000);

    return () => {
      window.clearTimeout(timer);
      clearInterval(interval);
    };
  }, [cekLaporanBaru]);

  // ============================================================
  // LOGOUT
  // ============================================================

  async function handleLogout() {
    if (!(await konfirmasi({
      title: "Keluar dari akun?",
      message: "Sesi CN Edu akan diakhiri pada perangkat ini.",
      confirmLabel: "Ya, keluar",
      cancelLabel: "Tetap di sini",
      tone: "primary",
    }))) return;
    await fetch("/api/auth", {
      method: "DELETE",
    });

    router.push("/login");
  }

  // ============================================================
  // KETIKA MASUK KE HALAMAN LAPORAN
  // REFRESH JUMLAH SETELAH SEDIKIT DELAY
  // ============================================================

  useEffect(() => {
    if (pathname.startsWith("/admin/laporan")) {
      const timer = setTimeout(() => {
        cekLaporanBaru();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [pathname, cekLaporanBaru]);

  return (
    <div style={estilo.wadah}>
      {/* ======================================================
          NAVBAR
      ======================================================= */}

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

        <span className="cn-role-brand" style={estilo.namaBrand}>
          CN Edu — Admin
        </span>

        <div style={estilo.navKanan}>
          <ThemeSwitchButton />
          <Link href="/profil/saya" style={estilo.tombolProfil}>Profil</Link>
        </div>
      </header>

      {/* ======================================================
          OVERLAY
      ======================================================= */}

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

      {/* ======================================================
          SIDEBAR
      ======================================================= */}

      <motion.aside
        className="cn-role-sidebar"
        initial={false}
        animate={{ x: sidebarTerbuka ? 0 : "-100%" }}
        transition={TRANSISI_DRAWER_ROLE}
        style={estilo.sidebar}
      >
        {/* HEADER SIDEBAR */}

        <div className="cn-role-sidebar-header" style={estilo.headerSidebar}>
          <span style={estilo.namaBrandSidebar}>
            CN Edu
          </span>

          <button
            onClick={() => setSidebarTerbuka(false)}
            style={estilo.tombolTutup}
            aria-label="Tutup menu"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* MENU */}

        <motion.nav style={estilo.nav} variants={VARIAN_MENU_ROLE} initial="sembunyi" animate="tampil">
          {MENU_ADMIN.map((item) => {
            const aktif = pathname.startsWith(item.href);

            return (
              <motion.div key={item.href} variants={VARIAN_ITEM_MENU_ROLE} whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={item.href}
                onClick={() => {
                  setSidebarTerbuka(false);
                  if (item.notifikasi) setTimeout(() => cekLaporanBaru(), 500);
                }}
                style={{ ...estilo.linkMenu, ...(aktif ? estilo.linkMenuAktif : {}) }}
              >
                {/* Nama menu */}

                <span style={estilo.labelMenu}>
                  {item.label}
                </span>

                {/* =================================================
                    BADGE NOTIFIKASI LAPORAN
                ================================================== */}

                {item.notifikasi && jumlahLaporan > 0 && (
                  <span
                    style={estilo.badgeNotifikasi}
                    title={`${jumlahLaporan} laporan baru`}
                  >
                    {jumlahLaporan > 99
                      ? "99+"
                      : jumlahLaporan}
                  </span>
                )}
              </Link>
              </motion.div>
            );
          })}
        </motion.nav>

        {/* ======================================================
            INFO NOTIFIKASI
        ======================================================= */}

        {jumlahLaporan > 0 && (
          <div style={estilo.infoNotifikasi}>
            <div style={estilo.infoIcon}>
              !
            </div>

            <div>
              <strong style={estilo.infoJudul}>
                Ada laporan baru
              </strong>

              <span style={estilo.infoText}>
                {jumlahLaporan} laporan perlu diperiksa.
              </span>
            </div>
          </div>
        )}

        <div className="cn-role-sidebar-footer">
          <button className="cn-role-logout-action" onClick={handleLogout} type="button">
            Keluar dari akun
          </button>
        </div>
      </motion.aside>

      {/* ======================================================
          CONTENT
      ======================================================= */}

      <main className="cn-role-main" style={estilo.konten}>
        {children}
      </main>
    </div>
  );
}

/* ============================================================
   STYLE
============================================================ */

const estilo = {
  wadah: {
    minHeight: "100vh",
    backgroundColor: "var(--cn-tint)",
  },

  // ==========================================================
  // NAVBAR
  // ==========================================================

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

  namaBrand: {
    fontSize: "15px",
    fontWeight: 700,
    color: "var(--cn-coral-dark)",
  },

  navKanan: { display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" },
  tombolProfil: { padding: "8px 10px", color: WARNA_PRIMARY, fontSize: "13px", fontWeight: 700, textDecoration: "none" },

  // ==========================================================
  // OVERLAY
  // ==========================================================

  overlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(var(--cn-navy-rgb), 0.42)",
    zIndex: 40,
    backdropFilter: "blur(1px)",
  },

  // ==========================================================
  // SIDEBAR
  // ==========================================================

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

  // ==========================================================
  // NAV
  // ==========================================================

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

  linkMenuAktif: {
    backgroundColor: "var(--cn-tint)",
    color: WARNA_PRIMARY,
  },

  labelMenu: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },

  // ==========================================================
  // BADGE MERAH
  // ==========================================================

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

  // ==========================================================
  // INFO NOTIFIKASI DI BAWAH SIDEBAR
  // ==========================================================

  infoNotifikasi: {
    margin: "8px 12px 0",
    padding: "11px",
    borderRadius: "10px",
    backgroundColor: "var(--cn-danger-tint)",
    border: "1px solid var(--cn-danger-tint)",
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
  },

  infoIcon: {
    width: "23px",
    height: "23px",
    borderRadius: "50%",
    backgroundColor: WARNA_DANGER,
    color: "var(--cn-surface)",
    fontSize: "12px",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  infoJudul: {
    display: "block",
    fontSize: "11px",
    fontWeight: 800,
    color: "var(--cn-danger)",
    marginBottom: "2px",
  },

  infoText: {
    display: "block",
    fontSize: "10px",
    lineHeight: 1.4,
    color: "var(--cn-danger)",
  },

  // ==========================================================
  // CONTENT
  // ==========================================================

  konten: {
    paddingTop: `${TINGGI_NAVBAR}px`,
    minHeight: "100vh",
    boxSizing: "border-box" as const,
  },
};