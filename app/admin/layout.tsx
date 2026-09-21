"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// ------------------------------------------------------------
// Next.js App Router: file layout.tsx di app/admin/ OTOMATIS
// membungkus SEMUA halaman di dalam app/admin/** (kelas/, akun/,
// siswa/, guru/, laporan/, dst) — gak perlu diimport manual di
// tiap page.tsx.
// ------------------------------------------------------------

const WARNA_PRIMARY = "#2196f3";
const TINGGI_NAVBAR = 56;
const LEBAR_SIDEBAR = 240;

const MENU_ADMIN = [
  { label: "Buat Kelas", href: "/admin/kelas" },
  { label: "Buat Akun", href: "/admin/akun" },
  { label: "Daftar Siswa", href: "/admin/siswa" },
  { label: "Daftar Guru", href: "/admin/guru" },
  { label: "Laporan", href: "/admin/laporan" },
];

export default function LayoutAdmin({ children }: { children: ReactNode }) {
  const [sidebarTerbuka, setSidebarTerbuka] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <div style={estilo.wadah}>
      <header style={estilo.navbar}>
        <button
          onClick={() => setSidebarTerbuka(true)}
          style={estilo.tombolHamburger}
          aria-label="Buka menu"
          type="button"
        >
          ☰
        </button>
        <span style={estilo.namaBrand}>CN Edu — Admin</span>
        <button onClick={handleLogout} style={estilo.tombolLogout} type="button">
          Keluar
        </button>
      </header>

      {/* Overlay gelap di belakang sidebar, klik buat nutup */}
      {sidebarTerbuka && (
        <div
          style={estilo.overlay}
          onClick={() => setSidebarTerbuka(false)}
          aria-hidden="true"
        />
      )}

      <aside
        style={{
          ...estilo.sidebar,
          transform: sidebarTerbuka ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div style={estilo.headerSidebar}>
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
          {MENU_ADMIN.map((item) => {
            const aktif = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarTerbuka(false)}
                style={{
                  ...estilo.linkMenu,
                  ...(aktif ? estilo.linkMenuAktif : {}),
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main style={estilo.konten}>{children}</main>
    </div>
  );
}

const estilo = {
  wadah: {
    minHeight: "100vh",
    backgroundColor: "#ffffff",
  },
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
  },
  tombolHamburger: {
    fontSize: "20px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#000000",
    padding: "8px",
  },
  namaBrand: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#000000",
  },
  tombolLogout: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#dc2626",
    background: "none",
    border: "1px solid #dc2626",
    borderRadius: "6px",
    padding: "6px 12px",
    cursor: "pointer",
  },
  overlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 40,
  },
  sidebar: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    bottom: 0,
    width: `${LEBAR_SIDEBAR}px`,
    backgroundColor: "#ffffff",
    borderRight: "1px solid #e5e7eb",
    zIndex: 50,
    transition: "transform 0.2s ease-in-out",
    display: "flex",
    flexDirection: "column" as const,
  },
  headerSidebar: {
    height: `${TINGGI_NAVBAR}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    borderBottom: "1px solid #e5e7eb",
  },
  namaBrandSidebar: {
    fontSize: "16px",
    fontWeight: 700,
    color: WARNA_PRIMARY,
  },
  tombolTutup: {
    fontSize: "16px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#000000",
  },
  nav: {
    display: "flex",
    flexDirection: "column" as const,
    padding: "12px",
    gap: "4px",
  },
  linkMenu: {
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
    textDecoration: "none",
  },
  linkMenuAktif: {
    backgroundColor: "#e8f3fe",
    color: WARNA_PRIMARY,
  },
  konten: {
    paddingTop: `${TINGGI_NAVBAR}px`,
  },
};