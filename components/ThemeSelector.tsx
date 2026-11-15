"use client";

import { useAppTheme } from "@/components/AppThemeProvider";

export default function ThemeSelector() {
  const { tema, aturTema, palet, aturPalet } = useAppTheme();

  return (
    <div className="cn-theme-settings">
      <label className="cn-theme-control">
        <span>Mode</span>
        <select
          aria-label="Mode terang atau gelap"
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
      <label className="cn-theme-control">
        <span>Palet</span>
        <select
          aria-label="Palet warna"
          onChange={(event) => {
            if (event.target.value === "standar" || event.target.value === "midnight-violet") {
              aturPalet(event.target.value);
            }
          }}
          value={palet}
        >
          <option value="standar">CN Edu</option>
          <option value="midnight-violet">Midnight Violet</option>
        </select>
      </label>
    </div>
  );
}
