"use client";

import { useAppTheme, type TemaAplikasi } from "@/components/AppThemeProvider";

const TEMA_BERIKUTNYA: Record<TemaAplikasi, TemaAplikasi> = {
  terang: "gelap",
  gelap: "sistem",
  sistem: "terang",
};

const LABEL_TEMA: Record<TemaAplikasi, string> = {
  terang: "terang",
  gelap: "gelap",
  sistem: "ikuti sistem",
};

export default function ThemeSwitchButton() {
  const { tema, aturTema } = useAppTheme();
  const berikutnya = TEMA_BERIKUTNYA[tema];

  return (
    <button
      aria-label={`Tema saat ini ${LABEL_TEMA[tema]}. Ubah ke ${LABEL_TEMA[berikutnya]}`}
      className="cn-theme-switch"
      onClick={() => aturTema(berikutnya)}
      title={`Tema: ${LABEL_TEMA[tema]} — klik untuk mengganti`}
      type="button"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        {tema === "gelap" ? (
          <path d="M20.3 15.6A8.6 8.6 0 0 1 8.4 3.7 8.8 8.8 0 1 0 20.3 15.6Z" />
        ) : tema === "terang" ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </>
        ) : (
          <>
            <rect x="4" y="5" width="16" height="12" rx="2" />
            <path d="M8 21h8m-4-4v4" />
          </>
        )}
      </svg>
    </button>
  );
}
