"use client";

import { useEffect, useState, type FormEvent } from "react";

const WARNA_PRIMARY = "#2196f3";

type TipeAkun = "SISWA" | "GURU";

interface RombelRingkas {
  id: string;
  label: string;
}

interface MapelRingkas {
  id: string;
  nama: string;
}

export default function HalamanBuatAkun() {
  const [tipeAkun, setTipeAkun] = useState<TipeAkun>("SISWA");

  const [daftarRombel, setDaftarRombel] = useState<RombelRingkas[]>([]);
  const [daftarMapel, setDaftarMapel] = useState<MapelRingkas[]>([]);

  // Field umum
  const [email, setEmail] = useState("");
  const [nama, setNama] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState<"" | "L" | "P">("");

  // Field khusus siswa
  const [nis, setNis] = useState("");
  const [rombelId, setRombelId] = useState("");

  // Field khusus guru
  const [nik, setNik] = useState("");
  const [mapelIdsDipilih, setMapelIdsDipilih] = useState<string[]>([]);

  const [sedangProses, setSedangProses] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [pesanSukses, setPesanSukses] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/kelas-referensi")
      .then((r) => r.json())
      .then((data) => {
        setDaftarRombel(data.data?.rombel ?? []);
        setDaftarMapel(data.data?.mapel ?? []);
      })
      .catch(() => {
        setPesanError("Gagal mengambil data referensi.");
      });
  }, []);

  function resetForm() {
    setEmail("");
    setNama("");
    setTanggalLahir("");
    setDeskripsi("");
    setJenisKelamin("");
    setNis("");
    setRombelId("");
    setNik("");
    setMapelIdsDipilih([]);
  }

  function toggleTipeAkun(tipe: TipeAkun) {
    setTipeAkun(tipe);
    resetForm();
    setPesanError(null);
    setPesanSukses(null);
  }

  function tambahMapel(mapelId: string) {
    if (!mapelId || mapelIdsDipilih.includes(mapelId)) return;

    setMapelIdsDipilih((prev) => [...prev, mapelId]);
  }

  function namaMapel(id: string) {
    return daftarMapel.find((m) => m.id === id)?.nama ?? id;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setPesanError(null);
    setPesanSukses(null);
    setSedangProses(true);

    const bodyUmum = {
      email,
      nama: nama || undefined,
      tanggalLahir,
      deskripsi: deskripsi || undefined,
      jenisKelamin: jenisKelamin || undefined,
    };

    const body =
      tipeAkun === "SISWA"
        ? {
            tipeAkun,
            ...bodyUmum,
            nis,
            rombelId,
          }
        : {
            tipeAkun,
            ...bodyUmum,
            nama,
            nik,
            mapelIds: mapelIdsDipilih,
          };

    try {
      const response = await fetch("/api/akun", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setPesanError(data.pesan ?? "Gagal membuat akun.");
        return;
      }

      setPesanSukses(data.pesan ?? "Akun berhasil dibuat.");
      resetForm();
    } catch {
      setPesanError("Tidak bisa terhubung ke server, coba lagi.");
    } finally {
      setSedangProses(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <div style={styles.badge}>
              ADMINISTRATOR
            </div>

            <h1 style={styles.title}>
              Buat Akun
            </h1>

            <p style={styles.subtitle}>
              Tambahkan akun pengguna baru ke dalam sistem CNEdu.
            </p>
          </div>
        </div>

        {/* FORM CARD */}
        <div style={styles.card}>

          {/* ROLE SELECTOR */}
          <div style={styles.roleSection}>
            <p style={styles.sectionLabel}>
              Tipe Akun
            </p>

            <div style={styles.roleTabs}>
              {(["SISWA", "GURU"] as TipeAkun[]).map((tab) => {
                const aktif = tipeAkun === tab;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => toggleTipeAkun(tab)}
                    style={{
                      ...styles.roleButton,
                      ...(aktif ? styles.roleButtonActive : {}),
                    }}
                  >
                    <span style={styles.roleIcon}>
                      {tab === "SISWA" ? "🎓" : "👨‍🏫"}
                    </span>

                    <span>
                      {tab === "SISWA" ? "Siswa" : "Guru"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={styles.divider} />

          {/* FORM */}
          <form onSubmit={handleSubmit} style={styles.form}>

            {/* EMAIL */}
            <div style={styles.field}>
              <label style={styles.label}>
                Email
                <span style={styles.required}>*</span>
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh@email.com"
                required
                style={styles.input}
              />
            </div>

            {/* NIS / NIK */}
            <div style={styles.field}>
              <label style={styles.label}>
                {tipeAkun === "SISWA" ? "NIS" : "NIK"}
                <span style={styles.required}>*</span>
              </label>

              <input
                type="text"
                inputMode="numeric"
                value={tipeAkun === "SISWA" ? nis : nik}
                onChange={(e) =>
                  tipeAkun === "SISWA"
                    ? setNis(e.target.value)
                    : setNik(e.target.value)
                }
                placeholder={
                  tipeAkun === "SISWA"
                    ? "Masukkan NIS siswa"
                    : "Masukkan NIK guru"
                }
                required
                style={styles.input}
              />
            </div>

            {/* NAMA */}
            <div style={styles.field}>
              <label style={styles.label}>
                Nama Lengkap

                {tipeAkun === "SISWA" && (
                  <span style={styles.optional}>
                    Opsional
                  </span>
                )}

                {tipeAkun === "GURU" && (
                  <span style={styles.required}>*</span>
                )}
              </label>

              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama lengkap"
                required={tipeAkun === "GURU"}
                style={styles.input}
              />
            </div>

            {/* GRID */}
            <div style={styles.grid}>

              {/* TANGGAL LAHIR */}
              <div style={styles.field}>
                <label style={styles.label}>
                  Tanggal Lahir
                  <span style={styles.required}>*</span>
                </label>

                <input
                  type="date"
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>

              {/* JENIS KELAMIN */}
              <div style={styles.field}>
                <label style={styles.label}>
                  Jenis Kelamin
                  <span style={styles.optional}>
                    Opsional
                  </span>
                </label>

                <select
                  value={jenisKelamin}
                  onChange={(e) =>
                    setJenisKelamin(
                      e.target.value as "" | "L" | "P"
                    )
                  }
                  style={styles.input}
                >
                  <option value="">Pilih jenis kelamin</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

            </div>

            {/* SISWA */}
            {tipeAkun === "SISWA" && (
              <div style={styles.field}>
                <label style={styles.label}>
                  Jurusan / Kelas Jenjang
                  <span style={styles.required}>*</span>
                </label>

                <select
                  value={rombelId}
                  onChange={(e) => setRombelId(e.target.value)}
                  required
                  style={styles.input}
                >
                  <option value="">
                    Pilih jurusan...
                  </option>

                  {daftarRombel.map((r) => (
                    <option
                      key={r.id}
                      value={r.id}
                    >
                      {r.label}
                    </option>
                  ))}
                </select>

                <span style={styles.helper}>
                  Tentukan jurusan atau jenjang siswa.
                </span>
              </div>
            )}

            {/* GURU */}
            {tipeAkun === "GURU" && (
              <div style={styles.field}>
                <label style={styles.label}>
                  Mata Pelajaran yang Diampu
                  <span style={styles.optional}>
                    Opsional
                  </span>
                </label>

                <select
                  onChange={(e) => {
                    tambahMapel(e.target.value);
                    e.target.value = "";
                  }}
                  style={styles.input}
                  defaultValue=""
                >
                  <option value="">
                    + Tambah mata pelajaran...
                  </option>

                  {daftarMapel
                    .filter(
                      (m) =>
                        !mapelIdsDipilih.includes(m.id)
                    )
                    .map((m) => (
                      <option
                        key={m.id}
                        value={m.id}
                      >
                        {m.nama}
                      </option>
                    ))}
                </select>

                {mapelIdsDipilih.length > 0 && (
                  <div style={styles.chips}>
                    {mapelIdsDipilih.map((id) => (
                      <div
                        key={id}
                        style={styles.chip}
                      >
                        <span>
                          {namaMapel(id)}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setMapelIdsDipilih((prev) =>
                              prev.filter(
                                (m) => m !== id
                              )
                            )
                          }
                          style={styles.chipRemove}
                          aria-label="Hapus mapel"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DESKRIPSI */}
            <div style={styles.field}>
              <label style={styles.label}>
                Deskripsi
                <span style={styles.optional}>
                  Opsional
                </span>
              </label>

              <textarea
                value={deskripsi}
                onChange={(e) =>
                  setDeskripsi(e.target.value)
                }
                placeholder="Tambahkan informasi tambahan..."
                rows={4}
                style={styles.textarea}
              />
            </div>

            {/* MESSAGE */}
            {pesanError && (
              <div style={styles.error}>
                <span>!</span>
                {pesanError}
              </div>
            )}

            {pesanSukses && (
              <div style={styles.success}>
                <span>✓</span>
                {pesanSukses}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={sedangProses}
              style={{
                ...styles.submit,
                opacity: sedangProses ? 0.7 : 1,
                cursor: sedangProses
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {sedangProses
                ? "Menyimpan..."
                : `Buat Akun ${
                    tipeAkun === "SISWA"
                      ? "Siswa"
                      : "Guru"
                  }`}
            </button>

          </form>
        </div>

        <p style={styles.footerText}>
          CNEdu Administration System
        </p>

      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f9fd",
    padding: "40px 20px",
    boxSizing: "border-box" as const,
  },

  container: {
    width: "100%",
    maxWidth: "760px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "28px",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    backgroundColor: "#e8f3fe",
    color: WARNA_PRIMARY,
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.8px",
    marginBottom: "10px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    lineHeight: 1.2,
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-0.6px",
  },

  subtitle: {
    margin: "8px 0 0",
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: 1.6,
  },

  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "30px",
    boxShadow: "0 12px 35px rgba(15, 23, 42, 0.07)",
    boxSizing: "border-box" as const,
  },

  roleSection: {
    width: "100%",
  },

  sectionLabel: {
    margin: "0 0 10px",
    fontSize: "13px",
    fontWeight: 700,
    color: "#374151",
  },

  roleTabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },

  roleButton: {
    minHeight: "58px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    color: "#4b5563",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  roleButtonActive: {
    backgroundColor: WARNA_PRIMARY,
    borderColor: WARNA_PRIMARY,
    color: "#ffffff",
    boxShadow: "0 6px 16px rgba(33, 150, 243, 0.22)",
  },

  roleIcon: {
    fontSize: "17px",
  },

  divider: {
    height: "1px",
    backgroundColor: "#eef0f3",
    margin: "26px 0",
  },

  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "19px",
  },

  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
  },

  label: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "13px",
    fontWeight: 700,
    color: "#1f2937",
  },

  required: {
    color: "#ef4444",
    fontSize: "13px",
  },

  optional: {
    marginLeft: "3px",
    color: "#9ca3af",
    fontSize: "11px",
    fontWeight: 500,
  },

  input: {
    width: "100%",
    height: "46px",
    padding: "0 13px",
    boxSizing: "border-box" as const,
    borderRadius: "10px",
    border: "1px solid #d9dee5",
    backgroundColor: "#ffffff",
    color: "#111827",
    fontSize: "13px",
    outline: "none",
  },

  textarea: {
    width: "100%",
    padding: "12px 13px",
    boxSizing: "border-box" as const,
    borderRadius: "10px",
    border: "1px solid #d9dee5",
    backgroundColor: "#ffffff",
    color: "#111827",
    fontSize: "13px",
    outline: "none",
    resize: "vertical" as const,
    fontFamily: "inherit",
    lineHeight: 1.5,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },

  helper: {
    fontSize: "11px",
    color: "#9ca3af",
    fontWeight: 400,
  },

  chips: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "7px",
    marginTop: "2px",
  },

  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "6px 9px",
    borderRadius: "999px",
    backgroundColor: "#eaf4ff",
    color: WARNA_PRIMARY,
    fontSize: "11px",
    fontWeight: 700,
  },

  chipRemove: {
    width: "17px",
    height: "17px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    borderRadius: "50%",
    backgroundColor: "rgba(33, 150, 243, 0.12)",
    color: WARNA_PRIMARY,
    cursor: "pointer",
    fontSize: "14px",
    lineHeight: 1,
    padding: 0,
  },

  error: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "11px 13px",
    borderRadius: "10px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    fontSize: "12px",
    fontWeight: 600,
  },

  success: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "11px 13px",
    borderRadius: "10px",
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#16a34a",
    fontSize: "12px",
    fontWeight: 600,
  },

  submit: {
    width: "100%",
    height: "48px",
    marginTop: "4px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: WARNA_PRIMARY,
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 700,
    boxShadow: "0 6px 16px rgba(33, 150, 243, 0.2)",
  },

  footerText: {
    textAlign: "center" as const,
    marginTop: "22px",
    color: "#9ca3af",
    fontSize: "11px",
  },
};