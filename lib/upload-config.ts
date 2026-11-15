export const UKURAN_MAKSIMAL_UPLOAD_BYTES = 10 * 1024 * 1024;

export const FOLDER_UPLOAD_DIIZINKAN = [
  "lampiran-tugas",
  "materi",
  "foto-profil",
  "jawaban-tugas",
] as const;

export type FolderUpload = (typeof FOLDER_UPLOAD_DIIZINKAN)[number];
