"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const WARNA_PRIMARY = "#2196f3";
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
        <span style={estilo.namaBrand}>CN Edu — Guru</span>
        <div style={estilo.navKanan}>
          <Link href="/profil/saya" style={estilo.tombolProfil}>
            Profil
          </Link>
          <button onClick={handleLogout} style={estilo.tombolLogout} type="button">
            Keluar
          </button>
        </div>
      </header>

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
          {MENU_GURU.map((item) => {
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
  wadah: { minHeight: "100vh", backgroundColor: "#ffffff" },
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
  namaBrand: { fontSize: "15px", fontWeight: 700, color: "#000000" },
  navKanan: { display: "flex", alignItems: "center", gap: "10px" },
  tombolProfil: {
    fontSize: "13px",
    fontWeight: 600,
    color: WARNA_PRIMARY,
    textDecoration: "none",
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
  namaBrandSidebar: { fontSize: "16px", fontWeight: 700, color: WARNA_PRIMARY },
  tombolTutup: {
    fontSize: "16px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#000000",
  },
  nav: { display: "flex", flexDirection: "column" as const, padding: "12px", gap: "4px" },
  linkMenu: {
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
    textDecoration: "none",
  },
  linkMenuAktif: { backgroundColor: "#e8f3fe", color: WARNA_PRIMARY },
  konten: { paddingTop: `${TINGGI_NAVBAR}px` },
};