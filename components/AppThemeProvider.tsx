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
export type PaletAplikasi = "standar" | "midnight-violet";

interface KonteksTema {
  tema: TemaAplikasi;
  aturTema: (tema: TemaAplikasi) => void;
  palet: PaletAplikasi;
  aturPalet: (palet: PaletAplikasi) => void;
}

const KUNCI_TEMA = "cnedu-theme";
const KUNCI_PALET = "cnedu-palette";
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

function bacaPaletTersimpan(): PaletAplikasi {
  try {
    return window.localStorage.getItem(KUNCI_PALET) === "midnight-violet"
      ? "midnight-violet"
      : "standar";
  } catch (error) {
    console.error("Gagal membaca pilihan palet:", error);
    return "standar";
  }
}

function terapkanTema(tema: TemaAplikasi) {
  const gelap = tema === "gelap"
    || (tema === "sistem" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = gelap ? "dark" : "light";
}

function terapkanPalet(palet: PaletAplikasi) {
  document.documentElement.dataset.palette = palet;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<TemaAplikasi>("sistem");
  const temaSaatIni = useRef<TemaAplikasi>("sistem");
  const [palet, setPalet] = useState<PaletAplikasi>("standar");

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

  const aturPalet = useCallback((paletBaru: PaletAplikasi) => {
    setPalet(paletBaru);
    terapkanPalet(paletBaru);

    try {
      window.localStorage.setItem(KUNCI_PALET, paletBaru);
    } catch (error) {
      console.error("Gagal menyimpan pilihan palet:", error);
    }
  }, []);

  useEffect(() => {
    const temaTersimpan = bacaTemaTersimpan();
    const paletTersimpan = bacaPaletTersimpan();
    temaSaatIni.current = temaTersimpan;
    terapkanTema(temaTersimpan);
    terapkanPalet(paletTersimpan);
    const frame = window.requestAnimationFrame(() => {
      setTema(temaTersimpan);
      setPalet(paletTersimpan);
    });

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
    <KonteksTema.Provider value={{ tema, aturTema, palet, aturPalet }}>
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
