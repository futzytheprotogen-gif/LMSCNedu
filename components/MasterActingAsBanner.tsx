"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { RoleAplikasi } from "@/lib/auth";
import UiIcon from "@/components/UiIcon";
import styles from "./MasterActingAsBanner.module.css";

const LABEL_ROLE: Record<Exclude<RoleAplikasi, "MASTER_ADMIN">, string> = {
  ADMIN: "Admin",
  KEPSEK: "Kepala Sekolah",
  KURIKULUM: "Kurikulum",
  GURU: "Guru",
  SISWA: "Siswa",
};

interface StatusAkses {
  nama: string;
  role: Exclude<RoleAplikasi, "MASTER_ADMIN">;
}

export default function MasterActingAsBanner() {
  const [active, setActive] = useState<StatusAkses | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const perluBanner = [
    "/admin",
    "/kepsek",
    "/kurikulum",
    "/guru",
    "/siswa",
    "/profil",
    "/ganti-password-awal",
    "/maintenance",
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  useEffect(() => {
    if (!perluBanner) return;
    let aktif = true;

    async function muatStatusAkses() {
      try {
        const sesiResponse = await fetch("/api/sesi", { cache: "no-store" });
        if (sesiResponse.status === 401) return;
        if (!sesiResponse.ok) throw new Error("Sesi tidak dapat diverifikasi.");

        const sesi = await sesiResponse.json();
        if (!sesi.data?.actingAs) {
          if (aktif) {
            setActive(null);
            setError("");
          }
          return;
        }

        const response = await fetch("/api/master/acting-as", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.pesan ?? "Status akses sementara tidak dapat diverifikasi.");
        }
        if (aktif) {
          setActive(result.active);
          setError("");
        }
      } catch (reason) {
        console.error("Gagal memverifikasi akses sementara:", reason);
        if (aktif) {
          setError("Status akses sementara tidak dapat diverifikasi.");
        }
      }
    }

    void muatStatusAkses();
    return () => {
      aktif = false;
    };
  }, [pathname, perluBanner]);

  async function kembaliKeMaster() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/master/acting-as", { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.pesan ?? "Gagal kembali ke Master Admin.");
      router.replace(result.redirect);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Gagal kembali ke Master Admin.");
      setBusy(false);
    }
  }

  if (!perluBanner || (!active && !error)) return null;
  return (
    <aside aria-label="Akses sementara Master Admin" className={styles.banner}>
      <span className={styles.signal} aria-hidden="true" />
      <span className={styles.message}>
        {active ? (
          <>
            Mode akses sementara <strong>{LABEL_ROLE[active.role]} · {active.nama}</strong>
            {error && <span className={styles.error} role="alert">{error}</span>}
          </>
        ) : (
          <span className={styles.error} role="alert">{error}</span>
        )}
      </span>
      {active && (
        <button disabled={busy} onClick={kembaliKeMaster} type="button">
          {busy ? "Memproses..." : <><UiIcon name="arrow-left" size={13} />Kembali ke Master</>}
        </button>
      )}
    </aside>
  );
}
