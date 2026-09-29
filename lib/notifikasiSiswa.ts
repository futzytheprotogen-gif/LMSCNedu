"use client";

// ------------------------------------------------------------
// Notifikasi "kelas ada aktivitas baru" disimpan di localStorage
// browser siswa (bukan database) — per kelas, kapan terakhir siswa
// membuka halaman detail kelas tsb. Aktivitas yang createdAt-nya
// lebih baru dari timestamp ini dianggap "belum dilihat".
//
// Kalau nanti mau upgrade ke versi database (biar konsisten lintas
// device), tinggal ganti isi 3 fungsi ini jadi fetch/POST ke API,
// tanpa perlu ubah kode di halaman yang memanggilnya.
// ------------------------------------------------------------

const PREFIX_KEY = "cnedu_kelas_dilihat_";
export type TipeAktivitasSiswa = "PENGUMUMAN" | "MATERI" | "TUGAS" | "ASESMEN";

interface StatusDilihat {
  semua: number;
  kategori: Partial<Record<TipeAktivitasSiswa, number>>;
}

function bacaStatusDilihat(kelasId: string): StatusDilihat {
  if (typeof window === "undefined") return { semua: 0, kategori: {} };
  const nilai = window.localStorage.getItem(PREFIX_KEY + kelasId);
  if (!nilai) return { semua: 0, kategori: {} };

  try {
    const parsed = JSON.parse(nilai) as number | Partial<StatusDilihat>;
    if (typeof parsed === "number" && Number.isFinite(parsed)) {
      return { semua: parsed, kategori: {} };
    }
    if (parsed && typeof parsed === "object" && typeof parsed.semua === "number") {
      return {
        semua: parsed.semua,
        kategori: parsed.kategori ?? {},
      };
    }
  } catch {
    const legacyTimestamp = Number(nilai);
    if (Number.isFinite(legacyTimestamp)) {
      return { semua: legacyTimestamp, kategori: {} };
    }
  }

  return { semua: 0, kategori: {} };
}

export function ambilTerakhirDilihat(kelasId: string, tipe?: TipeAktivitasSiswa): number {
  const status = bacaStatusDilihat(kelasId);
  return tipe ? Math.max(status.semua, status.kategori[tipe] ?? 0) : status.semua;
}

export function tandaiSudahDilihat(kelasId: string, tipe?: TipeAktivitasSiswa): void {
  if (typeof window === "undefined") return;
  const status = bacaStatusDilihat(kelasId);
  const sekarang = Date.now();
  if (tipe) status.kategori[tipe] = sekarang;
  else status.semua = sekarang;
  window.localStorage.setItem(PREFIX_KEY + kelasId, JSON.stringify(status));
}

export function hitungAktivitasBaru(
  kelasId: string,
  aktivitas: { createdAt: string; tipe?: TipeAktivitasSiswa }[],
  tipe?: TipeAktivitasSiswa
): number {
  return aktivitas.filter((item) => {
    if (tipe && item.tipe !== tipe) return false;
    const terakhir = ambilTerakhirDilihat(kelasId, tipe ?? item.tipe);
    return new Date(item.createdAt).getTime() > terakhir;
  }).length;
}