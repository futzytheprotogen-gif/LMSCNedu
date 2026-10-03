"use client";

import { useAppTheme } from "@/components/AppThemeProvider";

export default function ThemeSelector() {
  const { tema, aturTema } = useAppTheme();

  return (
    <label className="cn-theme-control">
      <span>Tema</span>
      <select
        aria-label="Tema tampilan"
        onChange={(event) => {
          const pilihan = event.target.value;
          if (pilihan === "terang" || pilihan === "gelap" || pilihan === "sistem") {
            aturTema(pilihan);
          }
        }}
        value={tema}
      >
        <option value="terang">Terang</option>
        <option value="gelap">Gelap</option>
        <option value="sistem">Ikuti sistem</option>
      </select>
    </label>
  );
}
