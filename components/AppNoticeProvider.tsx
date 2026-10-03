"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import styles from "./AppNoticeProvider.module.css";

export type JenisNotifikasi = "sukses" | "info" | "error";
type TampilkanNotifikasi = (pesan: string, jenis?: JenisNotifikasi, detail?: string) => void;

interface Notifikasi {
  id: number;
  pesan: string;
  jenis: JenisNotifikasi;
  detail?: string;
}

const KonteksNotifikasi = createContext<TampilkanNotifikasi | null>(null);

export function AppNoticeProvider({ children }: { children: ReactNode }) {
  const [notifikasi, setNotifikasi] = useState<Notifikasi[]>([]);
  const nomorRef = useRef(0);
  const timerRef = useRef(new Map<number, number>());

  const tutupNotifikasi = useCallback((id: number) => {
    const timer = timerRef.current.get(id);
    if (timer !== undefined) window.clearTimeout(timer);
    timerRef.current.delete(id);
    setNotifikasi((sebelumnya) => sebelumnya.filter((item) => item.id !== id));
  }, []);

  const tampilkanNotifikasi = useCallback<TampilkanNotifikasi>((pesan, jenis = "info", detail) => {
    const id = ++nomorRef.current;
    setNotifikasi((sebelumnya) => [...sebelumnya, { id, pesan, jenis, detail }].slice(-3));
    timerRef.current.set(id, window.setTimeout(() => tutupNotifikasi(id), detail ? 9000 : 4800));
  }, [tutupNotifikasi]);

  useEffect(() => () => {
    for (const timer of timerRef.current.values()) window.clearTimeout(timer);
    timerRef.current.clear();
  }, []);

  return (
    <KonteksNotifikasi.Provider value={tampilkanNotifikasi}>
      {children}
      <div className={styles.stack} aria-live="polite" aria-relevant="additions text">
        {notifikasi.map((item) => (
          <section
            className={`${styles.toast} ${styles[item.jenis]}`}
            key={item.id}
            role={item.jenis === "error" ? "alert" : "status"}
          >
            <span className={styles.icon} aria-hidden="true">
              {item.jenis === "sukses" ? "✓" : item.jenis === "error" ? "!" : "i"}
            </span>
            <div className={styles.content}>
              <p>{item.pesan}</p>
              {item.detail && <code>{item.detail}</code>}
            </div>
            <button
              aria-label="Tutup notifikasi"
              className={styles.close}
              onClick={() => tutupNotifikasi(item.id)}
              type="button"
            >
              ×
            </button>
          </section>
        ))}
      </div>
    </KonteksNotifikasi.Provider>
  );
}

export function useAppNotice() {
  const tampilkanNotifikasi = useContext(KonteksNotifikasi);
  if (!tampilkanNotifikasi) {
    throw new Error("useAppNotice harus digunakan di dalam AppNoticeProvider.");
  }
  return tampilkanNotifikasi;
}