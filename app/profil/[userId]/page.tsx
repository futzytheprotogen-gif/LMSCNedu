"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const WARNA_PRIMARY = "#2196f3";
const WARNA_NAVY = "#0d3b66";
const WARNA_AMBER = "#f5a623";

type RoleProfil = "ADMIN" | "KEPSEK" | "KURIKULUM" | "GURU" | "SISWA";

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

  const muatProfil = useCallback(async () => {
    setSedangMuat(true);
    const endpoint = iniProfilSendiri ? "/api/profil/saya" : `/api/profil/${params.userId}`;
    const response = await fetch(endpoint);
    const data = await response.json();
    if (response.ok) setProfil(data.data);
    setSedangMuat(false);
  }, [iniProfilSendiri, params.userId]);

  useEffect(() => {
    muatProfil();
  }, [muatProfil]);

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

  async function simpanProfil() {
    setSedangSimpan(true);
    setPesanError(null);

    try {
      let urlFotoAkhir = fotoUrl;

      if (fileFoto) {
        const formData = new FormData();
        formData.append("file", fileFoto);
        formData.append("folder", "foto-profil");
        const responseUpload = await fetch("/api/upload", { method: "POST", body: formData });
        const dataUpload = await responseUpload.json();
        if (!responseUpload.ok) {
          setPesanError(dataUpload.pesan ?? "Gagal upload foto");
          setSedangSimpan(false);
          return;
        }
        urlFotoAkhir = dataUpload.url;
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
    } finally {
      setSedangSimpan(false);
    }
  }

  if (sedangMuat) return <p style={estilo.pesanMuat}>Memuat profil...</p>;
  if (!profil) return <p style={estilo.pesanMuat}>Profil tidak ditemukan.</p>;

  const inisial = profil.nama.charAt(0).toUpperCase();

  return (
    <div style={estilo.halaman}>
      <button onClick={() => router.back()} style={estilo.tombolKembali}>
        ← Kembali
      </button>

      <div style={estilo.kartuUtama}>
        <div style={estilo.banner}>
          <div style={estilo.bannerAksen} />
        </div>

        <div style={estilo.isiKartu}>
          <div style={estilo.barisAtas}>
            <div style={estilo.avatarWadah}>
              {profil.fotoProfil ? (
                <img src={profil.fotoProfil} alt={profil.nama} style={estilo.avatarFoto} />
              ) : (
                <div style={estilo.avatarInisial}>{inisial}</div>
              )}
            </div>

            {iniProfilSendiri && (
              <button onClick={bukaModalEdit} style={estilo.tombolEditProfil}>
                Edit Profil
              </button>
            )}
          </div>

          <h1 style={estilo.nama}>{profil.nama}</h1>
          <span style={estilo.badgeRole}>{LABEL_ROLE[profil.role]}</span>

          <div style={estilo.baris_info_chip}>
            {profil.role === "SISWA" && (
              <>
                <span style={estilo.infoChip}>NIS {profil.nis}</span>
                <span style={estilo.infoChip}>{profil.rombel}</span>
              </>
            )}
            {profil.role === "GURU" &&
              profil.mapelDiampu?.map((m) => (
                <span key={m} style={estilo.infoChipAmber}>
                  {m}
                </span>
              ))}
            {profil.jenisKelamin && (
              <span style={estilo.infoChip}>
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
        <div style={estilo.overlay} onClick={() => setModalTerbuka(false)}>
          <div style={estilo.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={estilo.judulModal}>Edit Profil</h3>

            <div style={estilo.previewFotoWadah}>
              {previewFoto || fotoUrl ? (
                <img src={previewFoto ?? fotoUrl ?? ""} alt="Preview" style={estilo.previewFoto} />
              ) : (
                <div style={estilo.previewFotoKosong}>{inisial}</div>
              )}
              <label style={estilo.tombolGantiFoto}>
                Ganti Foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => pilihFoto(e.target.files?.[0] ?? null)}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            <label style={estilo.label}>
              Nama
              <input
                type="text"
                value={namaEdit}
                onChange={(e) => setNamaEdit(e.target.value)}
                style={estilo.input}
              />
            </label>

            <label style={estilo.label}>
              Deskripsi
              <textarea
                value={deskripsiEdit}
                onChange={(e) => setDeskripsiEdit(e.target.value)}
                rows={3}
                style={estilo.textarea}
                placeholder="Ceritakan sedikit tentang dirimu..."
              />
            </label>

            <p style={estilo.catatanKunci}>
              Email, {profil.role === "SISWA" ? "NIS" : profil.role === "GURU" ? "NIK" : "role"},
              {profil.role === "SISWA" || profil.role === "GURU" ? " dan jurusan" : ""} tidak bisa
              diubah di sini — hubungi admin sekolah kalau ada yang salah.
            </p>

            {pesanError && <p style={estilo.pesan_error}>{pesanError}</p>}

            <div style={estilo.barisTombolModal}>
              <button
                onClick={() => setModalTerbuka(false)}
                style={estilo.tombolBatal}
                disabled={sedangSimpan}
              >
                Batal
              </button>
              <button onClick={simpanProfil} style={estilo.tombolSimpan} disabled={sedangSimpan}>
                {sedangSimpan ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const estilo = {
  halaman: {
    minHeight: "100vh",
    backgroundColor: "#f6f8fb",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
  },
  pesanMuat: { padding: "24px", color: "#6b7280", textAlign: "center" as const },
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
    backgroundColor: "#ffffff",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 8px 30px rgba(13, 59, 102, 0.08)",
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
    border: "4px solid #ffffff",
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
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
    backgroundColor: "#e8f3fe",
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
    background: "#e8f3fe",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    cursor: "pointer",
    marginBottom: "4px",
  },
  nama: { margin: "0 0 6px 0", fontSize: "22px", fontWeight: 800, color: "#0a0a0a" },
  badgeRole: {
    display: "inline-block",
    fontSize: "12px",
    fontWeight: 700,
    color: WARNA_NAVY,
    backgroundColor: "#eaf4fe",
    padding: "4px 12px",
    borderRadius: "999px",
    marginBottom: "16px",
  },
  baris_info_chip: { display: "flex", flexWrap: "wrap" as const, gap: "8px", marginBottom: "20px" },
  infoChip: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#374151",
    backgroundColor: "#f3f4f6",
    padding: "5px 12px",
    borderRadius: "999px",
  },
  infoChipAmber: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#92610b",
    backgroundColor: "#fef3e0",
    padding: "5px 12px",
    borderRadius: "999px",
  },
  garisPemisah: { height: "1px", backgroundColor: "#eef1f5", margin: "0 0 20px" },
  judulBio: { margin: "0 0 8px 0", fontSize: "13px", fontWeight: 700, color: "#6b7280" },
  bio: { margin: 0, fontSize: "14px", lineHeight: 1.7, color: "#374151" },
  overlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    zIndex: 50,
  },
  modal: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "24px",
    maxHeight: "85vh",
    overflowY: "auto" as const,
  },
  judulModal: { margin: "0 0 16px 0", fontSize: "16px", fontWeight: 700, color: "#000000" },
  previewFotoWadah: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "10px",
    marginBottom: "18px",
  },
  previewFoto: { width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" as const },
  previewFotoKosong: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#e8f3fe",
    color: WARNA_PRIMARY,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: 800,
  },
  tombolGantiFoto: {
    fontSize: "12px",
    fontWeight: 600,
    color: WARNA_PRIMARY,
    cursor: "pointer",
  },
  label: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#000000",
    marginBottom: "14px",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    color: "#000000",
    outline: "none",
  },
  textarea: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    color: "#000000",
    outline: "none",
    resize: "vertical" as const,
    fontFamily: "inherit",
  },
  catatanKunci: { fontSize: "11px", color: "#9ca3af", margin: "0 0 14px 0", lineHeight: 1.5 },
  pesan_error: { color: "#dc2626", fontSize: "13px", margin: "0 0 12px 0" },
  barisTombolModal: { display: "flex", justifyContent: "flex-end", gap: "8px" },
  tombolBatal: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "#ffffff",
    color: "#374151",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  tombolSimpan: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: WARNA_PRIMARY,
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
};