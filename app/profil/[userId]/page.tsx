"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { urlFilePrivat } from "@/lib/file-url";
import { unggahFileDariBrowser } from "@/lib/upload-client";
import BackAction from "@/components/BackAction";
import styles from "./page.module.css";

const WARNA_PRIMARY = "var(--cn-primary)";
const WARNA_NAVY = "var(--cn-primary-dark)";
const WARNA_AMBER = "var(--cn-coral)";

type RoleProfil =
  | "MASTER_ADMIN"
  | "ADMIN"
  | "KEPSEK"
  | "KURIKULUM"
  | "GURU"
  | "SISWA";

interface DataProfil {
  id: string;
  role: RoleProfil;
  nama: string;
  email?: string;
  fotoProfil: string | null;
  deskripsi: string | null;
  jenisKelamin?: "L" | "P" | null;
  nis?: string;
  rombel?: string;
  mapelDiampu?: string[];
}

const LABEL_ROLE: Record<RoleProfil, string> = {
  MASTER_ADMIN: "Master Admin",
  ADMIN: "Admin",
  KEPSEK: "Kepala Sekolah",
  KURIKULUM: "Kurikulum",
  GURU: "Guru",
  SISWA: "Siswa",
};

export default function HalamanProfil() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const iniProfilSendiri = params.userId === "saya";

  const [profil, setProfil] = useState<DataProfil | null>(null);
  const [sedangMuat, setSedangMuat] = useState(true);

  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [namaEdit, setNamaEdit] = useState("");
  const [deskripsiEdit, setDeskripsiEdit] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [fileFoto, setFileFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  useEffect(() => {
    let aktif = true;

    async function muatProfil() {
      const endpoint = iniProfilSendiri ? "/api/profil/saya" : `/api/profil/${params.userId}`;
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.pesan ?? "Gagal memuat profil.");
        if (aktif) {
          setProfil(data.data);
          setPesanError(null);
        }
      } catch (reason) {
        console.error("Gagal memuat profil:", reason);
        if (aktif) {
          setPesanError(reason instanceof Error ? reason.message : "Gagal memuat profil.");
        }
      } finally {
        if (aktif) setSedangMuat(false);
      }
    }

    void muatProfil();
    return () => {
      aktif = false;
    };
  }, [iniProfilSendiri, params.userId]);

  useEffect(() => {
    return () => {
      if (previewFoto?.startsWith("blob:")) URL.revokeObjectURL(previewFoto);
    };
  }, [previewFoto]);

  useEffect(() => {
    if (!modalTerbuka) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !sedangSimpan) {
        setModalTerbuka(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [modalTerbuka, sedangSimpan]);

  function bukaModalEdit() {
    if (!profil) return;
    setNamaEdit(profil.nama);
    setDeskripsiEdit(profil.deskripsi ?? "");
    setFotoUrl(profil.fotoProfil);
    setFileFoto(null);
    setPreviewFoto(null);
    setPesanError(null);
    setModalTerbuka(true);
  }

  function pilihFoto(file: File | null) {
    setFileFoto(file);
    setPreviewFoto(file ? URL.createObjectURL(file) : null);
  }

  function tutupModalEdit() {
    if (sedangSimpan) return;
    setModalTerbuka(false);
    setFileFoto(null);
    setPreviewFoto(null);
  }

  async function simpanProfil() {
    setSedangSimpan(true);
    setPesanError(null);

    try {
      let urlFotoAkhir = fotoUrl;

      if (fileFoto) {
        urlFotoAkhir = await unggahFileDariBrowser(fileFoto, "foto-profil");
      }

      const response = await fetch("/api/profil/saya", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: namaEdit,
          deskripsi: deskripsiEdit,
          fotoProfil: urlFotoAkhir,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setPesanError(data.pesan ?? "Gagal menyimpan profil");
        return;
      }

      setProfil(data.data);
      setModalTerbuka(false);
      setFileFoto(null);
      setPreviewFoto(null);
    } catch (reason) {
      console.error("Gagal menyimpan profil:", reason);
      setPesanError(
        reason instanceof Error ? reason.message : "Gagal menyimpan profil."
      );
    } finally {
      setSedangSimpan(false);
    }
  }

  if (sedangMuat) return <p style={estilo.pesanMuat}>Memuat profil...</p>;
  if (!profil) {
    return <p style={estilo.pesanMuat}>{pesanError ?? "Profil tidak ditemukan."}</p>;
  }

  const inisial = profil.nama.charAt(0).toUpperCase();

  return (
    <div className={styles.page} style={estilo.halaman}>
      <BackAction as="button" onClick={() => router.back()}>Kembali</BackAction>

      <div className={styles.profileCard} style={estilo.kartuUtama}>
        <div className={styles.banner} style={estilo.banner}>
          <div style={estilo.bannerAksen} />
        </div>

        <div className={styles.profileContent} style={estilo.isiKartu}>
          <div className={styles.profileTop} style={estilo.barisAtas}>
            <div className={styles.avatar} style={estilo.avatarWadah}>
              {profil.fotoProfil ? (
                <Image
                  alt={profil.nama}
                  height={88}
                  src={urlFilePrivat(profil.fotoProfil) ?? ""}
                  style={estilo.avatarFoto}
                  unoptimized
                  width={88}
                />
              ) : (
                <div style={estilo.avatarInisial}>{inisial}</div>
              )}
            </div>

            {iniProfilSendiri && (
              <button className={styles.editButton} onClick={bukaModalEdit} style={estilo.tombolEditProfil}>
                Edit Profil
              </button>
            )}
          </div>

          <h1 className={styles.profileName} style={estilo.nama}>{profil.nama}</h1>
          <span style={estilo.badgeRole}>{LABEL_ROLE[profil.role]}</span>

          <div className={styles.profileChips} style={estilo.baris_info_chip}>
            {profil.role === "SISWA" && (
              <>
                <span className={styles.profileChip} style={estilo.infoChip}>NIS {profil.nis}</span>
                <span className={styles.profileChip} style={estilo.infoChip}>{profil.rombel}</span>
              </>
            )}
            {profil.role === "GURU" &&
              profil.mapelDiampu?.map((m) => (
                <span key={m} className={styles.profileChip} style={estilo.infoChipAmber}>
                  {m}
                </span>
              ))}
            {profil.jenisKelamin && (
              <span className={styles.profileChip} style={estilo.infoChip}>
                {profil.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
              </span>
            )}
          </div>

          <div style={estilo.garisPemisah} />

          <h2 style={estilo.judulBio}>Tentang</h2>
          <p style={estilo.bio}>
            {profil.deskripsi || "Belum ada deskripsi."}
          </p>
        </div>
      </div>

      {/* ---- Modal Edit Profil ---- */}
      {modalTerbuka && (
        <div
          className={styles.modalOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) tutupModalEdit();
          }}
        >
          <section
            aria-labelledby="modal-edit-profil-title"
            aria-modal="true"
            className={styles.modal}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header className={styles.modalHeader}>
              <div className={styles.modalHeading}>
                <div className={styles.modalIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
                    <path d="m16 5 3-3 3 3-8.5 8.5-4 1 1-4L19 2" />
                  </svg>
                </div>
                <div>
                  <span className={styles.modalEyebrow}>PENGATURAN PROFIL</span>
                  <h2 id="modal-edit-profil-title">Edit Profil</h2>
                  <p>Perbarui nama, deskripsi, dan foto profilmu.</p>
                </div>
              </div>
              <button
                aria-label="Tutup"
                className={styles.modalClose}
                disabled={sedangSimpan}
                onClick={tutupModalEdit}
                type="button"
              >
                ×
              </button>
            </header>

            <form
              className={styles.modalForm}
              onSubmit={(event) => {
                event.preventDefault();
                void simpanProfil();
              }}
            >
              <div className={styles.modalBody}>
                <label className={styles.photoPicker} htmlFor="foto-profil">
                  {previewFoto || fotoUrl ? (
                    <Image
                      alt="Foto profil"
                      className={styles.photoAvatar}
                      height={68}
                      src={
                        previewFoto
                          ? urlFilePrivat(previewFoto) ?? ""
                          : urlFilePrivat(fotoUrl) ?? ""
                      }
                      unoptimized
                      width={68}
                    />
                  ) : (
                    <span className={styles.photoAvatarFallback}>{inisial}</span>
                  )}
                  <span className={styles.photoDetails}>
                    <strong>Foto profil</strong>
                    <span>Gunakan foto yang jelas agar profil mudah dikenali.</span>
                    <span className={styles.photoButton}>Pilih foto</span>
                  </span>
                  <input
                    accept="image/*"
                    className={styles.fileInput}
                    disabled={sedangSimpan}
                    id="foto-profil"
                    onChange={(event) => {
                      pilihFoto(event.target.files?.[0] ?? null);
                      event.target.value = "";
                    }}
                    type="file"
                  />
                </label>

                <div className={styles.field}>
                  <label htmlFor="nama-profil">Nama</label>
                  <input
                    className={styles.formInput}
                    disabled={sedangSimpan}
                    id="nama-profil"
                    onChange={(event) => setNamaEdit(event.target.value)}
                    required
                    type="text"
                    value={namaEdit}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="deskripsi-profil">Deskripsi</label>
                  <textarea
                    className={styles.formTextarea}
                    disabled={sedangSimpan}
                    id="deskripsi-profil"
                    onChange={(event) => setDeskripsiEdit(event.target.value)}
                    placeholder="Ceritakan sedikit tentang dirimu..."
                    rows={4}
                    value={deskripsiEdit}
                  />
                </div>

                <p className={styles.formHint}>
                  Email, {profil.role === "SISWA" ? "NIS" : profil.role === "GURU" ? "NIK" : "role"},
                  {profil.role === "SISWA" || profil.role === "GURU" ? " dan jurusan" : ""} tidak bisa
                  diubah di sini — hubungi admin sekolah kalau ada yang salah.
                </p>

                {pesanError && (
                  <div className={styles.errorBox} role="alert">
                    {pesanError}
                  </div>
                )}
              </div>

              <footer className={styles.modalFooter}>
                <button
                  className={styles.cancelButton}
                  disabled={sedangSimpan}
                  onClick={tutupModalEdit}
                  type="button"
                >
                  Batal
                </button>
                <button
                  className={styles.saveButton}
                  disabled={sedangSimpan}
                  type="submit"
                >
                  {sedangSimpan ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

const estilo = {
  halaman: {
    minHeight: "100vh",
    backgroundColor: "var(--cn-coral-tint)",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
  },
  pesanMuat: { padding: "24px", color: "var(--cn-text)", textAlign: "center" as const },
  tombolKembali: {
    alignSelf: "flex-start",
    maxWidth: "560px",
    width: "100%",
    margin: "0 auto 12px",
    background: "none",
    border: "none",
    color: WARNA_PRIMARY,
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
  },
  kartuUtama: {
    width: "100%",
    maxWidth: "560px",
    backgroundColor: "var(--cn-surface)",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 8px 30px rgba(var(--cn-primary-rgb), 0.08)",
  },
  banner: {
    height: "120px",
    background: `linear-gradient(135deg, ${WARNA_PRIMARY}, ${WARNA_NAVY})`,
    position: "relative" as const,
    overflow: "hidden",
  },
  bannerAksen: {
    position: "absolute" as const,
    top: "-30px",
    right: "-30px",
    width: "140px",
    height: "140px",
    borderRadius: "50%",
    backgroundColor: WARNA_AMBER,
    opacity: 0.18,
  },
  isiKartu: { padding: "0 28px 28px" },
  barisAtas: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "-44px",
    marginBottom: "12px",
  },
  avatarWadah: {
    width: "88px",
    height: "88px",
    borderRadius: "50%",
    border: "4px solid var(--cn-surface)",
    backgroundColor: "var(--cn-surface)",
    boxShadow: "0 2px 8px rgba(var(--cn-navy-rgb), 0.1)",
  },
  avatarFoto: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover" as const,
  },
  avatarInisial: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    backgroundColor: "var(--cn-tint)",
    color: WARNA_PRIMARY,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    fontWeight: 800,
  },
  tombolEditProfil: {
    fontSize: "13px",
    fontWeight: 700,
    color: WARNA_PRIMARY,
    background: "var(--cn-tint)",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    cursor: "pointer",
    marginBottom: "4px",
  },
  nama: { margin: "0 0 6px 0", fontSize: "22px", fontWeight: 800, color: "var(--cn-navy)" },
  badgeRole: {
    display: "inline-block",
    fontSize: "12px",
    fontWeight: 700,
    color: WARNA_NAVY,
    backgroundColor: "var(--cn-tint)",
    padding: "4px 12px",
    borderRadius: "999px",
    marginBottom: "16px",
  },
  baris_info_chip: { display: "flex", flexWrap: "wrap" as const, gap: "8px", marginBottom: "20px" },
  infoChip: {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--cn-coral-dark)",
    backgroundColor: "var(--cn-coral-tint)",
    padding: "5px 12px",
    borderRadius: "999px",
  },
  infoChipAmber: {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--cn-coral-dark)",
    backgroundColor: "var(--cn-coral-tint)",
    padding: "5px 12px",
    borderRadius: "999px",
  },
  garisPemisah: { height: "1px", backgroundColor: "var(--cn-coral-tint)", margin: "0 0 20px" },
  judulBio: { margin: "0 0 8px 0", fontSize: "13px", fontWeight: 700, color: "var(--cn-text)" },
  bio: { margin: 0, fontSize: "14px", lineHeight: 1.7, color: "var(--cn-coral-dark)" },
};