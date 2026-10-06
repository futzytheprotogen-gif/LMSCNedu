export const JENIS_PERINGATAN_ASESMEN = [
  "TAB_HIDDEN",
  "WINDOW_BLUR",
  "COPY_BLOCKED",
  "CUT_BLOCKED",
  "PASTE_BLOCKED",
  "CONTEXT_MENU_BLOCKED",
  "LEAVE_ASSESSMENT",
  "LOGOUT_DURING_ASSESSMENT",
] as const;

export type JenisPeringatanAsesmen = (typeof JENIS_PERINGATAN_ASESMEN)[number];

export interface CatatanIntegritasAsesmen {
  jenis: JenisPeringatanAsesmen;
  terdeteksiPada: string;
}

function kunciCatatan(asesmenId: string) {
  return `cnedu-asesmen-${asesmenId}-catatan-integritas`;
}

function isCatatanIntegritasAsesmen(value: unknown): value is CatatanIntegritasAsesmen {
  if (!value || typeof value !== "object") return false;
  const catatan = value as Record<string, unknown>;
  return (
    typeof catatan.jenis === "string" &&
    JENIS_PERINGATAN_ASESMEN.includes(catatan.jenis as JenisPeringatanAsesmen) &&
    typeof catatan.terdeteksiPada === "string" &&
    Number.isFinite(Date.parse(catatan.terdeteksiPada))
  );
}

export function bacaCatatanIntegritas(asesmenId: string): CatatanIntegritasAsesmen[] {
  if (typeof window === "undefined") return [];

  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(kunciCatatan(asesmenId)) ?? "[]");
    if (!Array.isArray(value)) return [];

    return value.filter(isCatatanIntegritasAsesmen).slice(-100);
  } catch (error) {
    console.error("Gagal membaca catatan fokus asesmen:", error);
    return [];
  }
}

export function rekamCatatanIntegritas(
  asesmenId: string,
  jenis: JenisPeringatanAsesmen
): CatatanIntegritasAsesmen {
  const catatan: CatatanIntegritasAsesmen = {
    jenis,
    terdeteksiPada: new Date().toISOString(),
  };

  try {
    const catatanLama = bacaCatatanIntegritas(asesmenId);
    sessionStorage.setItem(kunciCatatan(asesmenId), JSON.stringify([...catatanLama, catatan].slice(-100)));
  } catch (error) {
    console.error("Gagal menyimpan catatan fokus asesmen:", error);
  }

  return catatan;
}

export function hapusCatatanIntegritas(asesmenId: string) {
  try {
    sessionStorage.removeItem(kunciCatatan(asesmenId));
  } catch (error) {
    console.error("Gagal membersihkan catatan fokus asesmen:", error);
  }
}
