"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// ------------------------------------------------------------
// Layout Admin
// Membungkus semua halaman di dalam app/admin/**.
// Sidebar akan menampilkan notifikasi merah pada menu Laporan
// apabila terdapat laporan lupa password dengan status MENUNGGU.
// ------------------------------------------------------------

const WARNA_PRIMARY = "#2196f3";
const WARNA_DANGER = "#ef4444";

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
    cekLaporanBaru();

    // Cek setiap 15 detik
    const interval = setInterval(() => {
      cekLaporanBaru();
    }, 15000);

    return () => clearInterval(interval);
  }, [cekLaporanBaru]);

  // ============================================================
  // LOGOUT
  // ============================================================

  async function handleLogout() {
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

      <header style={estilo.navbar}>
        <button
          onClick={() => setSidebarTerbuka(true)}
          style={estilo.tombolHamburger}
          aria-label="Buka menu"
          type="button"
        >
          ☰
        </button>

        <span style={estilo.namaBrand}>
          CN Edu — Admin
        </span>

        <button
          onClick={handleLogout}
          style={estilo.tombolLogout}
          type="button"
        >
          Keluar
        </button>
      </header>

      {/* ======================================================
          OVERLAY
      ======================================================= */}

      {sidebarTerbuka && (
        <div
          style={estilo.overlay}
          onClick={() => setSidebarTerbuka(false)}
          aria-hidden="true"
        />
      )}

      {/* ======================================================
          SIDEBAR
      ======================================================= */}

      <aside
        style={{
          ...estilo.sidebar,
          transform: sidebarTerbuka
            ? "translateX(0)"
            : "translateX(-100%)",
        }}
      >
        {/* HEADER SIDEBAR */}

        <div style={estilo.headerSidebar}>
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

        <nav style={estilo.nav}>
          {MENU_ADMIN.map((item) => {
            const aktif = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setSidebarTerbuka(false);

                  // Kalau masuk ke laporan, cek ulang notifikasi
                  if (item.notifikasi) {
                    setTimeout(() => {
                      cekLaporanBaru();
                    }, 500);
                  }
                }}
                style={{
                  ...estilo.linkMenu,
                  ...(aktif ? estilo.linkMenuAktif : {}),
                }}
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
            );
          })}
        </nav>

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
      </aside>

      {/* ======================================================
          CONTENT
      ======================================================= */}

      <main style={estilo.konten}>
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
    backgroundColor: "#f7f9fc",
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
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
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
    color: "#111827",
    padding: "0",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  namaBrand: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#111827",
  },

  tombolLogout: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#dc2626",
    background: "#ffffff",
    border: "1px solid #dc2626",
    borderRadius: "7px",
    padding: "7px 13px",
    cursor: "pointer",
  },

  // ==========================================================
  // OVERLAY
  // ==========================================================

  overlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
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
    backgroundColor: "#ffffff",
    borderRight: "1px solid #e5e7eb",
    zIndex: 50,
    transition: "transform 0.22s ease-in-out",
    display: "flex",
    flexDirection: "column" as const,
    boxShadow: "8px 0 25px rgba(15, 23, 42, 0.08)",
  },

  headerSidebar: {
    height: `${TINGGI_NAVBAR}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    borderBottom: "1px solid #e5e7eb",
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
    color: "#374151",
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
    color: "#374151",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    boxSizing: "border-box" as const,
    transition: "background-color 0.15s ease",
  },

  linkMenuAktif: {
    backgroundColor: "#e8f3fe",
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
    color: "#ffffff",
    fontSize: "10px",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)",
    flexShrink: 0,
  },

  // ==========================================================
  // INFO NOTIFIKASI DI BAWAH SIDEBAR
  // ==========================================================

  infoNotifikasi: {
    margin: "8px 12px 0",
    padding: "11px",
    borderRadius: "10px",
    backgroundColor: "#fff5f5",
    border: "1px solid #fee2e2",
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
  },

  infoIcon: {
    width: "23px",
    height: "23px",
    borderRadius: "50%",
    backgroundColor: WARNA_DANGER,
    color: "#ffffff",
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
    color: "#991b1b",
    marginBottom: "2px",
  },

  infoText: {
    display: "block",
    fontSize: "10px",
    lineHeight: 1.4,
    color: "#b91c1c",
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