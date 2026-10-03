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

export type TemaAplikasi = "terang" | "gelap" | "sistem";

interface KonteksTema {
  tema: TemaAplikasi;
  aturTema: (tema: TemaAplikasi) => void;
}

const KUNCI_TEMA = "cnedu-theme";
const KonteksTema = createContext<KonteksTema | null>(null);

function bacaTemaTersimpan(): TemaAplikasi {
  try {
    const tema = window.localStorage.getItem(KUNCI_TEMA);
    return tema === "terang" || tema === "gelap" || tema === "sistem"
      ? tema
      : "sistem";
  } catch (error) {
    console.error("Gagal membaca pilihan tema:", error);
    return "sistem";
  }
}

function terapkanTema(tema: TemaAplikasi) {
  const gelap = tema === "gelap"
    || (tema === "sistem" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = gelap ? "dark" : "light";
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<TemaAplikasi>("sistem");
  const temaSaatIni = useRef<TemaAplikasi>("sistem");

  const aturTema = useCallback((temaBaru: TemaAplikasi) => {
    temaSaatIni.current = temaBaru;
    setTema(temaBaru);
    terapkanTema(temaBaru);

    try {
      window.localStorage.setItem(KUNCI_TEMA, temaBaru);
    } catch (error) {
      console.error("Gagal menyimpan pilihan tema:", error);
    }
  }, []);

  useEffect(() => {
    const temaTersimpan = bacaTemaTersimpan();
    temaSaatIni.current = temaTersimpan;
    terapkanTema(temaTersimpan);
    const frame = window.requestAnimationFrame(() => setTema(temaTersimpan));

    const preferensiSistem = window.matchMedia("(prefers-color-scheme: dark)");
    const tanganiPerubahanSistem = () => {
      if (temaSaatIni.current === "sistem") terapkanTema("sistem");
    };
    const pakaiEventListener = typeof preferensiSistem.addEventListener === "function";
    if (pakaiEventListener) {
      preferensiSistem.addEventListener("change", tanganiPerubahanSistem);
    } else {
      preferensiSistem.addListener(tanganiPerubahanSistem);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      if (pakaiEventListener) {
        preferensiSistem.removeEventListener("change", tanganiPerubahanSistem);
      } else {
        preferensiSistem.removeListener(tanganiPerubahanSistem);
      }
    };
  }, []);

  return (
    <KonteksTema.Provider value={{ tema, aturTema }}>
      {children}
    </KonteksTema.Provider>
  );
}

export function useAppTheme() {
  const konteks = useContext(KonteksTema);
  if (!konteks) {
    throw new Error("useAppTheme harus digunakan di dalam AppThemeProvider.");
  }
  return konteks;
}
