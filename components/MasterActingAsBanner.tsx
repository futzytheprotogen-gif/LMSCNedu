"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RoleAplikasi } from "@/lib/auth";
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
  const router = useRouter();

  useEffect(() => {
    let aktif = true;
    fetch("/api/master/acting-as", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json();
        if (aktif) setActive(result.active);
      })
      .catch(() => {
        if (aktif) setError("Status akses sementara tidak dapat diverifikasi.");
      });
    return () => {
      aktif = false;
    };
  }, []);

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

  if (!active) return null;
  return (
    <aside aria-label="Akses sementara Master Admin" className={styles.banner}>
      <span className={styles.signal} aria-hidden="true" />
      <span className={styles.message}>
        Mode akses sementara <strong>{LABEL_ROLE[active.role]} · {active.nama}</strong>
        {error && <span className={styles.error} role="alert">{error}</span>}
      </span>
      <button disabled={busy} onClick={kembaliKeMaster} type="button">
        {busy ? "Memproses..." : "Kembali ke Master"}
      </button>
    </aside>
  );
}
