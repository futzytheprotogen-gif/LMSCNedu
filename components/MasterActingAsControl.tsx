"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RoleAplikasi } from "@/lib/auth";
import styles from "./MasterActingAsControl.module.css";

interface AkunAkses {
  id: string;
  nama: string;
  email: string;
  role: Exclude<RoleAplikasi, "MASTER_ADMIN">;
}

interface StatusAkses {
  nama: string;
  role: Exclude<RoleAplikasi, "MASTER_ADMIN">;
}

const LABEL_ROLE: Record<AkunAkses["role"], string> = {
  ADMIN: "Admin",
  KEPSEK: "Kepala Sekolah",
  KURIKULUM: "Kurikulum",
  GURU: "Guru",
  SISWA: "Siswa",
};

export default function MasterActingAsControl() {
  const [accounts, setAccounts] = useState<AkunAkses[]>([]);
  const [active, setActive] = useState<StatusAkses | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let aktif = true;
    fetch("/api/master/acting-as", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.pesan ?? "Gagal memuat akun.");
        if (aktif) {
          setAccounts(result.data);
          setActive(result.active);
        }
      })
      .catch((reason: unknown) => {
        if (aktif) setError(reason instanceof Error ? reason.message : "Gagal memuat akun.");
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, []);

  async function mulaiAkses() {
    const selected = accounts.find((account) => `${account.role}:${account.id}` === selectedId);
    if (!selected) return;

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/master/acting-as", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.id, role: selected.role }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.pesan ?? "Tidak dapat membuka akun.");
      router.push(result.redirect);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Tidak dapat membuka akun.");
      setBusy(false);
    }
  }

  async function akhiriAkses() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/master/acting-as", { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.pesan ?? "Tidak dapat mengakhiri akses.");
      setActive(null);
      router.replace(result.redirect);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Tidak dapat mengakhiri akses.");
      setBusy(false);
    }
  }

  return (
    <section aria-label="Akses sementara sebagai akun" className={styles.control}>
      <div className={styles.heading}>
        <span aria-hidden="true">⌁</span>
        <div><strong>AKSES ROLE</strong><small>Akun sementara · 1 jam</small></div>
      </div>
      {active ? (
        <div className={styles.activeState}>
          <p>Sedang sebagai <strong>{active.nama}</strong><small>{LABEL_ROLE[active.role]}</small></p>
          <button disabled={busy} onClick={akhiriAkses} type="button">
            {busy ? "Memproses..." : "Kembali ke Master"}
          </button>
        </div>
      ) : (
        <>
          <label className={styles.label} htmlFor="master-acting-account">Pilih akun</label>
          <select
            disabled={loading || busy || accounts.length === 0}
            id="master-acting-account"
            onChange={(event) => setSelectedId(event.target.value)}
            value={selectedId}
          >
            <option value="">{loading ? "Memuat akun..." : "Pilih akun sekolah"}</option>
            {accounts.map((account) => (
              <option key={`${account.role}-${account.id}`} value={`${account.role}:${account.id}`}>
                {LABEL_ROLE[account.role]} · {account.nama} ({account.email})
              </option>
            ))}
          </select>
          <button
            className={styles.startButton}
            disabled={!selectedId || busy || loading}
            onClick={mulaiAkses}
            type="button"
          >
            {busy ? "Memproses..." : "Buka akun terpilih"}
          </button>
        </>
      )}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {!loading && accounts.length === 0 && !active && (
        <p className={styles.empty}>Belum ada akun operasional yang dapat dibuka.</p>
      )}
    </section>
  );
}
