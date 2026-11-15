"use client";

import { useAppTheme } from "@/components/AppThemeProvider";

export default function ThemePaletteButton() {
  const { palet, aturPalet } = useAppTheme();
  const paletBerikutnya = palet === "standar" ? "midnight-violet" : "standar";
  const namaPaletSaatIni = palet === "standar" ? "CN Edu" : "Midnight Violet";
  const namaPaletBerikutnya = paletBerikutnya === "standar" ? "CN Edu" : "Midnight Violet";

  return (
    <button
      aria-label={`Palet saat ini ${namaPaletSaatIni}. Ubah ke ${namaPaletBerikutnya}`}
      className="cn-palette-switch"
      onClick={() => aturPalet(paletBerikutnya)}
      title={`Palet warna: ${namaPaletSaatIni} — klik untuk mengganti`}
      type="button"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.4-3.4 1.5 1.5 0 0 1 1-2.6H18a3 3 0 0 0 3-3c0-5-4-9-9-9Z" />
        <circle cx="7.5" cy="12" r="1" />
        <circle cx="10" cy="7.5" r="1" />
        <circle cx="15" cy="8" r="1" />
      </svg>
    </button>
  );
}
