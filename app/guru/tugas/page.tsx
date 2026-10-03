"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppConfirm } from "@/components/ConfirmDialogProvider";

const WARNA_PRIMARY = "var(--cn-primary)";

interface KelasRingkas {
  id: string;
  judul: string;
}

interface Tugas {
  id: string;
  judul: string;
  deskripsi: string;
  tipeLampiran: "PDF" | "LINK" | null;
  lampiran: string | null;
  createdAt: string;
  kelasTujuan: KelasRingkas[];
}

interface SiswaPengumpulan {
  id: string;
  nama: string;
  nis: string | number | bigint;
  fotoProfil?: string | null;
  status: "SUDAH" | "BELUM";
  fileUrl?: string | null;
  waktuKumpul?: string | null;
}

interface DataPengumpulan {
  tugasId: string;
  totalSiswa: number;
  sudahMengumpulkan: number;
  belumMengumpulkan: number;
  siswa: SiswaPengumpulan[];
}

export default function HalamanTugasGuru() {
  const konfirmasi = useAppConfirm();
  const [daftarTugas, setDaftarTugas] = useState<Tugas[]>([]);
  const [kelasSaya, setKelasSaya] = useState<KelasRingkas[]>([]);
  const [sedangMuat, setSedangMuat] = useState(true);

  // Search / filter
  const [pencarian, setPencarian] = useState("");
  const [filterTugas, setFilterTugas] = useState<"SEMUA" | "HARI_INI" | "DRAFT">(
    "SEMUA"
  );

  // Modal buat/edit
  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [tugasDiedit, setTugasDiedit] = useState<Tugas | null>(null);
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [pakaiLampiran, setPakaiLampiran] = useState(false);
  const [tipeLampiran, setTipeLampiran] = useState<"PDF" | "LINK">("LINK");
  const [lampiran, setLampiran] = useState("");
  const [fileTerpilih, setFileTerpilih] = useState<File | null>(null);
  const [sedangUpload, setSedangUpload] = useState(false);
  const [kelasIdsDipilih, setKelasIdsDipilih] = useState<string[]>([]);
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  // Dropdown kirim
  const [idSedangKirim, setIdSedangKirim] = useState<string | null>(null);

  // Modal pengumpulan
  const [tugasPengumpulan, setTugasPengumpulan] = useState<Tugas | null>(null);
  const [dataPengumpulan, setDataPengumpulan] =
    useState<DataPengumpulan | null>(null);
  const [sedangMuatPengumpulan, setSedangMuatPengumpulan] = useState(false);
  const [errorPengumpulan, setErrorPengumpulan] = useState<string | null>(null);
  const [filterPengumpulan, setFilterPengumpulan] = useState<
    "SEMUA" | "SUDAH" | "BELUM"
  >("SEMUA");
  const [pencarianSiswa, setPencarianSiswa] = useState("");

  const muatSemua = useCallback(async () => {
    setSedangMuat(true);

    try {
      const [resTugas, resKelas] = await Promise.all([
        fetch("/api/tugas"),
        fetch("/api/guru/kelas"),
      ]);

      const dataTugas = await resTugas.json();
      const dataKelas = await resKelas.json();

      if (resTugas.ok) {
        setDaftarTugas(dataTugas.data ?? []);
      }

      if (resKelas.ok) {
        setKelasSaya(dataKelas.data ?? []);
      }
    } catch {
      setDaftarTugas([]);
      setKelasSaya([]);
    } finally {
      setSedangMuat(false);
    }
  }, []);

  useEffect(() => {
    muatSemua();
  }, [muatSemua]);

  function bukaModalBuat() {
    setTugasDiedit(null);
    setJudul("");
    setDeskripsi("");
    setPakaiLampiran(false);
    setTipeLampiran("LINK");
    setLampiran("");
    setFileTerpilih(null);
    setKelasIdsDipilih([]);
    setPesanError(null);
    setModalTerbuka(true);
  }

  function bukaModalEdit(t: Tugas) {
    setTugasDiedit(t);
    setJudul(t.judul);
    setDeskripsi(t.deskripsi);
    setPakaiLampiran(!!t.lampiran);
    setTipeLampiran(t.tipeLampiran ?? "LINK");
    setLampiran(t.lampiran ?? "");
    setFileTerpilih(null);
    setKelasIdsDipilih([]);
    setPesanError(null);
    setModalTerbuka(true);
  }

  function tutupModal() {
    if (sedangSimpan) return;
    setModalTerbuka(false);
  }

  async function simpanTugas() {
    if (!judul.trim() || !deskripsi.trim()) {
      setPesanError("Judul dan deskripsi wajib diisi.");
      return;
    }

    if (
      pakaiLampiran &&
      tipeLampiran === "PDF" &&
      !fileTerpilih &&
      !lampiran
    ) {
      setPesanError("Pilih file PDF terlebih dahulu.");
      return;
    }

    if (pakaiLampiran && tipeLampiran === "LINK" && !lampiran.trim()) {
      setPesanError("Masukkan link lampiran.");
      return;
    }

    setSedangSimpan(true);
    setPesanError(null);

    let urlLampiranAkhir = lampiran;

    try {
      if (pakaiLampiran && tipeLampiran === "PDF" && fileTerpilih) {
        setSedangUpload(true);

        const formData = new FormData();
        formData.append("file", fileTerpilih);
        formData.append("folder", "lampiran-tugas");

        const responseUpload = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const dataUpload = await responseUpload.json();

        setSedangUpload(false);

        if (!responseUpload.ok) {
          setPesanError(dataUpload.pesan ?? "Gagal upload file.");
          return;
        }

        urlLampiranAkhir = dataUpload.url;
      }
    } catch {
      setSedangUpload(false);
      setPesanError("Gagal upload file. Coba lagi.");
      return;
    }

    const payload = {
      judul: judul.trim(),
      deskripsi: deskripsi.trim(),
      tipeLampiran: pakaiLampiran ? tipeLampiran : undefined,
      lampiran: pakaiLampiran ? urlLampiranAkhir : undefined,
    };

    try {
      const response = tugasDiedit
        ? await fetch(`/api/tugas/${tugasDiedit.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/tugas", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...payload,
              kelasIds: kelasIdsDipilih,
            }),
          });

      const data = await response.json();

      if (!response.ok) {
        setPesanError(data.pesan ?? "Gagal menyimpan tugas.");
        return;
      }

      setModalTerbuka(false);
      await muatSemua();
    } catch {
      setPesanError("Tidak dapat terhubung ke server.");
    } finally {
      setSedangSimpan(false);
      setSedangUpload(false);
    }
  }

  async function hapusTugas(id: string) {
    if (!(await konfirmasi({
      title: "Hapus tugas ini?",
      message: "Semua data pengumpulan siswa yang berkaitan dengan tugas ini juga akan terhapus.",
      confirmLabel: "Hapus tugas",
    }))) {
      return;
    }

    try {
      const response = await fetch(`/api/tugas/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await muatSemua();
      } else {
        const data = await response.json().catch(() => null);
        alert(data?.pesan ?? "Gagal menghapus tugas.");
      }
    } catch {
      alert("Tidak dapat terhubung ke server.");
    }
  }

  async function kirimKeKelas(tugasId: string, kelasId: string) {
    try {
      const response = await fetch(`/api/tugas/${tugasId}/kirim-ke-kelas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kelasId,
        }),
      });

      if (response.ok) {
        setIdSedangKirim(null);
        await muatSemua();
      } else {
        const data = await response.json().catch(() => null);
        alert(data?.pesan ?? "Gagal mengirim tugas ke kelas.");
      }
    } catch {
      alert("Tidak dapat terhubung ke server.");
    }
  }

  function toggleKelasDipilih(id: string) {
    setKelasIdsDipilih((prev) =>
      prev.includes(id)
        ? prev.filter((k) => k !== id)
        : [...prev, id]
    );
  }

  async function bukaPengumpulan(tugas: Tugas) {
    setTugasPengumpulan(tugas);
    setDataPengumpulan(null);
    setErrorPengumpulan(null);
    setFilterPengumpulan("SEMUA");
    setPencarianSiswa("");
    setSedangMuatPengumpulan(true);

    try {
      const response = await fetch(`/api/tugas/${tugas.id}/pengumpulan`);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorPengumpulan(
          data?.pesan ??
            "Data pengumpulan belum tersedia dari server."
        );
        return;
      }

      setDataPengumpulan(data.data ?? data);
    } catch {
      setErrorPengumpulan(
        "Tidak dapat mengambil data pengumpulan tugas."
      );
    } finally {
      setSedangMuatPengumpulan(false);
    }
  }

  function tutupPengumpulan() {
    setTugasPengumpulan(null);
    setDataPengumpulan(null);
    setErrorPengumpulan(null);
  }

  const hariIni = new Date().toDateString();

  const tugasHariIni = useMemo(
    () =>
      daftarTugas.filter(
        (t) => new Date(t.createdAt).toDateString() === hariIni
      ),
    [daftarTugas, hariIni]
  );

  const riwayat = useMemo(
    () =>
      daftarTugas.filter(
        (t) => new Date(t.createdAt).toDateString() !== hariIni
      ),
    [daftarTugas, hariIni]
  );

  const tugasTerfilter = useMemo(() => {
    const keyword = pencarian.trim().toLowerCase();

    let hasil = daftarTugas;

    if (filterTugas === "HARI_INI") {
      hasil = tugasHariIni;
    }

    if (filterTugas === "DRAFT") {
      hasil = daftarTugas.filter((t) => t.kelasTujuan.length === 0);
    }

    if (keyword) {
      hasil = hasil.filter((t) => {
        const cocokJudul = t.judul.toLowerCase().includes(keyword);
        const cocokDeskripsi = t.deskripsi
          .toLowerCase()
          .includes(keyword);
        const cocokKelas = t.kelasTujuan.some((k) =>
          k.judul.toLowerCase().includes(keyword)
        );

        return cocokJudul || cocokDeskripsi || cocokKelas;
      });
    }

    return hasil;
  }, [daftarTugas, filterTugas, pencarian, tugasHariIni]);

  const statistik = useMemo(() => {
    const total = daftarTugas.length;

    const draft = daftarTugas.filter(
      (t) => t.kelasTujuan.length === 0
    ).length;

    const dikirim = daftarTugas.filter(
      (t) => t.kelasTujuan.length > 0
    ).length;

    return {
      total,
      hariIni: tugasHariIni.length,
      draft,
      dikirim,
    };
  }, [daftarTugas, tugasHariIni]);

  const siswaPengumpulanTerfilter = useMemo(() => {
    if (!dataPengumpulan) return [];

    const keyword = pencarianSiswa.trim().toLowerCase();

    return dataPengumpulan.siswa.filter((siswa) => {
      if (
        filterPengumpulan !== "SEMUA" &&
        siswa.status !== filterPengumpulan
      ) {
        return false;
      }

      if (!keyword) return true;

      return (
        siswa.nama.toLowerCase().includes(keyword) ||
        String(siswa.nis).includes(keyword)
      );
    });
  }, [dataPengumpulan, filterPengumpulan, pencarianSiswa]);

  return (
    <div style={styles.page}>
      <div style={styles.backgroundGlowOne} />
      <div style={styles.backgroundGlowTwo} />

      <main style={styles.container}>
        {/* HEADER */}
        <header style={styles.header}>
          <div>
            <div style={styles.breadcrumb}>
              Guru <span>/</span> Tugas
            </div>

            <h1 style={styles.pageTitle}>Tugas</h1>

            <p style={styles.pageSubtitle}>
              Kelola tugas, bagikan ke kelas, dan pantau pengumpulan siswa.
            </p>
          </div>

          <button
            type="button"
            onClick={bukaModalBuat}
            style={styles.primaryButton}
          >
            <span style={styles.plusIcon}>+</span>
            Buat Tugas
          </button>
        </header>

        {/* STATISTIK */}
        <section style={styles.statsGrid}>
          <StatCard
            icon="📚"
            label="Total Tugas"
            value={statistik.total}
            description="Semua tugas"
          />

          <StatCard
            icon="📝"
            label="Hari Ini"
            value={statistik.hariIni}
            description="Tugas baru hari ini"
          />

          <StatCard
            icon="📤"
            label="Sudah Dikirim"
            value={statistik.dikirim}
            description="Memiliki kelas tujuan"
          />

          <StatCard
            icon="📄"
            label="Draft"
            value={statistik.draft}
            description="Belum dikirim ke kelas"
          />
        </section>

        {/* TOOLBAR */}
        <section style={styles.toolbar}>
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon}>⌕</span>

            <input
              value={pencarian}
              onChange={(e) => setPencarian(e.target.value)}
              placeholder="Cari tugas atau kelas..."
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterGroup}>
            {(
              [
                ["SEMUA", "Semua"],
                ["HARI_INI", "Hari Ini"],
                ["DRAFT", "Draft"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilterTugas(value)}
                style={{
                  ...styles.filterButton,
                  ...(filterTugas === value
                    ? styles.filterButtonActive
                    : {}),
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {sedangMuat ? (
          <LoadingState />
        ) : (
          <>
            {/* HASIL FILTER */}
            {pencarian || filterTugas !== "SEMUA" ? (
              <section style={styles.section}>
                <div style={styles.sectionHeader}>
                  <div>
                    <h2 style={styles.sectionTitle}>Hasil Tugas</h2>
                    <p style={styles.sectionSubtitle}>
                      {tugasTerfilter.length} tugas ditemukan
                    </p>
                  </div>
                </div>

                {tugasTerfilter.length === 0 ? (
                  <EmptyState
                    icon="🔎"
                    title="Tugas tidak ditemukan"
                    description="Coba gunakan kata kunci pencarian yang berbeda."
                  />
                ) : (
                  <div style={styles.taskList}>
                    {tugasTerfilter.map((tugas) => (
                      <KartuTugas
                        key={tugas.id}
                        t={tugas}
                        kelasSaya={kelasSaya}
                        idSedangKirim={idSedangKirim}
                        onEdit={() => bukaModalEdit(tugas)}
                        onHapus={() => hapusTugas(tugas.id)}
                        onBukaKirim={() =>
                          setIdSedangKirim(tugas.id)
                        }
                        onTutupKirim={() =>
                          setIdSedangKirim(null)
                        }
                        onKirim={(kelasId) =>
                          kirimKeKelas(tugas.id, kelasId)
                        }
                        onLihatPengumpulan={() =>
                          bukaPengumpulan(tugas)
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <>
                {/* HARI INI */}
                <section style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <div>
                      <div style={styles.sectionEyebrow}>
                        AKTIVITAS TERBARU
                      </div>
                      <h2 style={styles.sectionTitle}>
                        Tugas Hari Ini
                      </h2>
                      <p style={styles.sectionSubtitle}>
                        Tugas yang dibuat pada hari ini.
                      </p>
                    </div>

                    <span style={styles.countBadge}>
                      {tugasHariIni.length} tugas
                    </span>
                  </div>

                  {tugasHariIni.length === 0 ? (
                    <EmptyState
                      icon="📝"
                      title="Belum ada tugas hari ini"
                      description="Buat tugas baru untuk mulai memberikan pekerjaan kepada siswa."
                      actionLabel="Buat Tugas"
                      onAction={bukaModalBuat}
                    />
                  ) : (
                    <div style={styles.taskList}>
                      {tugasHariIni.map((tugas) => (
                        <KartuTugas
                          key={tugas.id}
                          t={tugas}
                          kelasSaya={kelasSaya}
                          idSedangKirim={idSedangKirim}
                          onEdit={() => bukaModalEdit(tugas)}
                          onHapus={() => hapusTugas(tugas.id)}
                          onBukaKirim={() =>
                            setIdSedangKirim(tugas.id)
                          }
                          onTutupKirim={() =>
                            setIdSedangKirim(null)
                          }
                          onKirim={(kelasId) =>
                            kirimKeKelas(tugas.id, kelasId)
                          }
                          onLihatPengumpulan={() =>
                            bukaPengumpulan(tugas)
                          }
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* RIWAYAT */}
                <section style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <div>
                      <div style={styles.sectionEyebrow}>
                        ARSIP
                      </div>
                      <h2 style={styles.sectionTitle}>
                        Riwayat Tugas
                      </h2>
                      <p style={styles.sectionSubtitle}>
                        Daftar tugas yang dibuat sebelumnya.
                      </p>
                    </div>

                    <span style={styles.countBadge}>
                      {riwayat.length} tugas
                    </span>
                  </div>

                  {riwayat.length === 0 ? (
                    <EmptyState
                      icon="🗂️"
                      title="Belum ada riwayat"
                      description="Tugas lama akan muncul di bagian ini."
                    />
                  ) : (
                    <div style={styles.taskList}>
                      {riwayat.map((tugas) => (
                        <KartuTugas
                          key={tugas.id}
                          t={tugas}
                          kelasSaya={kelasSaya}
                          idSedangKirim={idSedangKirim}
                          onEdit={() => bukaModalEdit(tugas)}
                          onHapus={() => hapusTugas(tugas.id)}
                          onBukaKirim={() =>
                            setIdSedangKirim(tugas.id)
                          }
                          onTutupKirim={() =>
                            setIdSedangKirim(null)
                          }
                          onKirim={(kelasId) =>
                            kirimKeKelas(tugas.id, kelasId)
                          }
                          onLihatPengumpulan={() =>
                            bukaPengumpulan(tugas)
                          }
                        />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </main>

      {/* MODAL BUAT / EDIT */}
      {modalTerbuka && (
        <div style={styles.overlay} onClick={tutupModal}>
          <div
            style={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalEyebrow}>
                  {tugasDiedit ? "KELOLA TUGAS" : "TUGAS BARU"}
                </div>

                <h3 style={styles.modalTitle}>
                  {tugasDiedit ? "Edit Tugas" : "Buat Tugas"}
                </h3>
              </div>

              <button
                type="button"
                onClick={tutupModal}
                disabled={sedangSimpan}
                style={styles.closeButton}
              >
                ×
              </button>
            </div>

            <div style={styles.form}>
              <label style={styles.label}>
                <span>Judul Tugas</span>

                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Membuat Website HTML"
                  style={styles.input}
                />
              </label>

              <label style={styles.label}>
                <span>Deskripsi</span>

                <textarea
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  rows={5}
                  placeholder="Jelaskan instruksi tugas untuk siswa..."
                  style={styles.textarea}
                />
              </label>

              <div style={styles.attachmentBox}>
                <label style={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={pakaiLampiran}
                    onChange={(e) =>
                      setPakaiLampiran(e.target.checked)
                    }
                  />

                  <span>
                    <strong>Sertakan lampiran</strong>
                    <small>PDF atau link referensi</small>
                  </span>
                </label>

                {pakaiLampiran && (
                  <>
                    <div style={styles.attachmentTabs}>
                      {(["LINK", "PDF"] as const).map((tipe) => (
                        <button
                          key={tipe}
                          type="button"
                          onClick={() =>
                            setTipeLampiran(tipe)
                          }
                          style={{
                            ...styles.attachmentTab,
                            ...(tipeLampiran === tipe
                              ? styles.attachmentTabActive
                              : {}),
                          }}
                        >
                          {tipe === "LINK"
                            ? "🔗 Link"
                            : "📄 Upload PDF"}
                        </button>
                      ))}
                    </div>

                    {tipeLampiran === "LINK" && (
                      <input
                        type="url"
                        value={lampiran}
                        onChange={(e) =>
                          setLampiran(e.target.value)
                        }
                        placeholder="https://contoh.com/materi"
                        style={styles.input}
                      />
                    )}

                    {tipeLampiran === "PDF" && (
                      <div>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) =>
                            setFileTerpilih(
                              e.target.files?.[0] ?? null
                            )
                          }
                          style={styles.fileInput}
                        />

                        {fileTerpilih && (
                          <div style={styles.fileInfo}>
                            📄 {fileTerpilih.name}
                          </div>
                        )}

                        {!fileTerpilih && lampiran && (
                          <div style={styles.fileInfo}>
                            📄 File saat ini:{" "}
                            {lampiran.split("/").pop()}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {!tugasDiedit && (
                <div style={styles.label}>
                  <span>Kirim ke kelas</span>

                  <small style={styles.helperText}>
                    Opsional. Kamu tetap bisa menyimpan tugas
                    sebagai draft.
                  </small>

                  <div style={styles.classSelector}>
                    {kelasSaya.length === 0 ? (
                      <div style={styles.noClass}>
                        Belum ada kelas yang tersedia.
                      </div>
                    ) : (
                      kelasSaya.map((kelas) => {
                        const aktif =
                          kelasIdsDipilih.includes(kelas.id);

                        return (
                          <button
                            key={kelas.id}
                            type="button"
                            onClick={() =>
                              toggleKelasDipilih(kelas.id)
                            }
                            style={{
                              ...styles.classChip,
                              ...(aktif
                                ? styles.classChipActive
                                : {}),
                            }}
                          >
                            {aktif ? "✓ " : ""}
                            {kelas.judul}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {pesanError && (
                <div style={styles.errorBox}>
                  ⚠️ {pesanError}
                </div>
              )}

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={tutupModal}
                  style={styles.cancelButton}
                  disabled={sedangSimpan}
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={simpanTugas}
                  style={styles.saveButton}
                  disabled={sedangSimpan}
                >
                  {sedangUpload
                    ? "Mengupload..."
                    : sedangSimpan
                      ? "Menyimpan..."
                      : tugasDiedit
                        ? "Simpan Perubahan"
                        : "Buat Tugas"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENGUMPULAN */}
      {tugasPengumpulan && (
        <div
          style={styles.overlay}
          onClick={tutupPengumpulan}
        >
          <div
            style={styles.submissionModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalEyebrow}>
                  PENGUMPULAN TUGAS
                </div>

                <h3 style={styles.modalTitle}>
                  {tugasPengumpulan.judul}
                </h3>

                <p style={styles.modalDescription}>
                  Pantau siswa yang sudah dan belum
                  mengumpulkan tugas.
                </p>
              </div>

              <button
                type="button"
                onClick={tutupPengumpulan}
                style={styles.closeButton}
              >
                ×
              </button>
            </div>

            {sedangMuatPengumpulan ? (
              <div style={styles.submissionLoading}>
                <div style={styles.spinner} />
                <p>Memuat data pengumpulan...</p>
              </div>
            ) : errorPengumpulan ? (
              <div style={styles.submissionError}>
                <div style={styles.errorIcon}>!</div>

                <strong>Data pengumpulan belum tersedia</strong>

                <p>{errorPengumpulan}</p>

                <small>
                  Pastikan endpoint{" "}
                  <code>
                    /api/tugas/[id]/pengumpulan
                  </code>{" "}
                  sudah dibuat.
                </small>
              </div>
            ) : dataPengumpulan ? (
              <>
                {/* SUMMARY PENGUMPULAN */}
                <div style={styles.submissionStats}>
                  <SubmissionStat
                    label="Total Siswa"
                    value={dataPengumpulan.totalSiswa}
                    icon="👥"
                  />

                  <SubmissionStat
                    label="Sudah Mengumpulkan"
                    value={dataPengumpulan.sudahMengumpulkan}
                    icon="✓"
                    success
                  />

                  <SubmissionStat
                    label="Belum Mengumpulkan"
                    value={dataPengumpulan.belumMengumpulkan}
                    icon="⏳"
                    warning
                  />

                  <SubmissionStat
                    label="Persentase"
                    value={`${dataPengumpulan.totalSiswa > 0
                      ? Math.round(
                          (dataPengumpulan.sudahMengumpulkan /
                            dataPengumpulan.totalSiswa) *
                            100
                        )
                      : 0
                      }%`}
                    icon="📊"
                  />
                </div>

                {/* PROGRESS */}
                <div style={styles.progressCard}>
                  <div style={styles.progressHeader}>
                    <strong>Progress Pengumpulan</strong>

                    <span>
                      {dataPengumpulan.sudahMengumpulkan}/
                      {dataPengumpulan.totalSiswa}
                    </span>
                  </div>

                  <div style={styles.progressTrack}>
                    <div
                      style={{
                        ...styles.progressBar,
                        width: `${
                          dataPengumpulan.totalSiswa > 0
                            ? Math.min(
                                100,
                                (dataPengumpulan.sudahMengumpulkan /
                                  dataPengumpulan.totalSiswa) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* SEARCH SISWA */}
                <div style={styles.submissionToolbar}>
                  <div style={styles.submissionSearch}>
                    <span>⌕</span>

                    <input
                      value={pencarianSiswa}
                      onChange={(e) =>
                        setPencarianSiswa(e.target.value)
                      }
                      placeholder="Cari nama atau NIS..."
                      style={styles.searchInput}
                    />
                  </div>

                  <div style={styles.filterGroup}>
                    {(
                      [
                        ["SEMUA", "Semua"],
                        ["SUDAH", "Sudah"],
                        ["BELUM", "Belum"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setFilterPengumpulan(value)
                        }
                        style={{
                          ...styles.filterButton,
                          ...(filterPengumpulan === value
                            ? styles.filterButtonActive
                            : {}),
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* LIST SISWA */}
                <div style={styles.studentList}>
                  {siswaPengumpulanTerfilter.length === 0 ? (
                    <div style={styles.noStudent}>
                      <div>🔎</div>
                      <strong>Siswa tidak ditemukan</strong>
                      <p>
                        Tidak ada siswa yang sesuai dengan
                        filter.
                      </p>
                    </div>
                  ) : (
                    siswaPengumpulanTerfilter.map((siswa) => (
                      <StudentSubmissionRow
                        key={siswa.id}
                        siswa={siswa}
                      />
                    ))
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   KARTU TUGAS
========================================================= */

function KartuTugas({
  t,
  kelasSaya,
  idSedangKirim,
  onEdit,
  onHapus,
  onBukaKirim,
  onTutupKirim,
  onKirim,
  onLihatPengumpulan,
}: {
  t: Tugas;
  kelasSaya: KelasRingkas[];
  idSedangKirim: string | null;
  onEdit: () => void;
  onHapus: () => void;
  onBukaKirim: () => void;
  onTutupKirim: () => void;
  onKirim: (kelasId: string) => void;
  onLihatPengumpulan: () => void;
}) {
  const kelasBelumDikirim = kelasSaya.filter(
    (k) => !t.kelasTujuan.some((kt) => kt.id === k.id)
  );

  const tanggal = new Date(t.createdAt);

  return (
    <article style={styles.taskCard}>
      <div style={styles.taskTop}>
        <div style={styles.taskIcon}>📝</div>

        <div style={styles.taskMain}>
          <div style={styles.taskTitleRow}>
            <h3 style={styles.taskTitle}>{t.judul}</h3>

            {t.kelasTujuan.length === 0 ? (
              <span style={styles.draftBadge}>Draft</span>
            ) : (
              <span style={styles.sentBadge}>Dikirim</span>
            )}
          </div>

          <p style={styles.taskDescription}>
            {t.deskripsi}
          </p>

          <div style={styles.taskMeta}>
            <span>
              📅{" "}
              {tanggal.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>

            <span>
              🕐{" "}
              {tanggal.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

            {t.lampiran && (
              <span>
                {t.tipeLampiran === "PDF"
                  ? "📄 PDF"
                  : "🔗 Link"}
              </span>
            )}
          </div>
        </div>

        <div style={styles.taskActions}>
          <button
            type="button"
            onClick={onEdit}
            style={styles.editButton}
          >
            Edit
          </button>

          <button
            type="button"
            onClick={onHapus}
            style={styles.deleteButton}
          >
            Hapus
          </button>
        </div>
      </div>

      <div style={styles.taskBottom}>
        <div style={styles.classArea}>
          <span style={styles.classLabel}>Kelas tujuan</span>

          <div style={styles.chipRow}>
            {t.kelasTujuan.length === 0 ? (
              <span style={styles.draftChip}>
                Belum dikirim ke kelas
              </span>
            ) : (
              t.kelasTujuan.map((kelas) => (
                <span key={kelas.id} style={styles.classChipSmall}>
                  {kelas.judul}
                </span>
              ))
            )}
          </div>
        </div>

        <div style={styles.taskBottomActions}>
          <button
            type="button"
            onClick={onLihatPengumpulan}
            style={styles.submissionButton}
          >
            <span>👥</span>
            Lihat Pengumpulan
          </button>

          {t.lampiran && (
            <a
              href={t.lampiran}
              target="_blank"
              rel="noreferrer"
              style={styles.attachmentButton}
            >
              {t.tipeLampiran === "PDF"
                ? "Lihat PDF"
                : "Buka Link"}
            </a>
          )}

          {idSedangKirim === t.id ? (
            <div style={styles.sendDropdown}>
              {kelasBelumDikirim.length === 0 ? (
                <span style={styles.noClassText}>
                  Sudah dikirim ke semua kelas.
                </span>
              ) : (
                kelasBelumDikirim.map((kelas) => (
                  <button
                    key={kelas.id}
                    type="button"
                    onClick={() => onKirim(kelas.id)}
                    style={styles.dropdownOption}
                  >
                    📤 {kelas.judul}
                  </button>
                ))
              )}

              <button
                type="button"
                onClick={onTutupKirim}
                style={styles.dropdownClose}
              >
                Tutup
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onBukaKirim}
              style={styles.sendButton}
            >
              + Kirim ke Kelas
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: string;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>

      <div style={styles.statContent}>
        <span style={styles.statLabel}>{label}</span>
        <strong style={styles.statValue}>{value}</strong>
        <span style={styles.statDescription}>
          {description}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   SUBMISSION STAT
========================================================= */

function SubmissionStat({
  label,
  value,
  icon,
  success,
  warning,
}: {
  label: string;
  value: number | string;
  icon: string;
  success?: boolean;
  warning?: boolean;
}) {
  return (
    <div
      style={{
        ...styles.submissionStat,
        ...(success ? styles.submissionStatSuccess : {}),
        ...(warning ? styles.submissionStatWarning : {}),
      }}
    >
      <div style={styles.submissionStatIcon}>{icon}</div>

      <div>
        <span style={styles.submissionStatLabel}>
          {label}
        </span>

        <strong style={styles.submissionStatValue}>
          {value}
        </strong>
      </div>
    </div>
  );
}

/* =========================================================
   STUDENT SUBMISSION ROW
========================================================= */

function StudentSubmissionRow({
  siswa,
}: {
  siswa: SiswaPengumpulan;
}) {
  const sudah = siswa.status === "SUDAH";

  const tanggal =
    siswa.waktuKumpul
      ? new Date(siswa.waktuKumpul)
      : null;

  return (
    <div style={styles.studentRow}>
      <div style={styles.studentAvatar}>
        {siswa.fotoProfil ? (
          <img
            src={siswa.fotoProfil}
            alt=""
            style={styles.avatarImage}
          />
        ) : (
          siswa.nama.charAt(0).toUpperCase()
        )}
      </div>

      <div style={styles.studentInfo}>
        <strong style={styles.studentName}>
          {siswa.nama}
        </strong>

        <span style={styles.studentNis}>
          NIS: {String(siswa.nis)}
        </span>
      </div>

      <div style={styles.studentStatus}>
        {sudah ? (
          <>
            <span style={styles.statusSuccess}>
              ✓ Sudah mengumpulkan
            </span>

            {tanggal && (
              <span style={styles.submissionTime}>
                {tanggal.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                ·{" "}
                {tanggal.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </>
        ) : (
          <span style={styles.statusPending}>
            ⏳ Belum mengumpulkan
          </span>
        )}
      </div>

      {sudah && siswa.fileUrl ? (
        <a
          href={siswa.fileUrl}
          target="_blank"
          rel="noreferrer"
          style={styles.fileButton}
        >
          📎 Lihat File
        </a>
      ) : (
        <span style={styles.noFile}>—</span>
      )}
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>{icon}</div>

      <strong style={styles.emptyTitle}>{title}</strong>

      <p style={styles.emptyDescription}>{description}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={styles.emptyButton}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingState() {
  return (
    <div style={styles.loadingList}>
      {[1, 2, 3].map((item) => (
        <div key={item} style={styles.loadingCard}>
          <div style={styles.loadingIcon} />

          <div style={styles.loadingContent}>
            <div style={styles.loadingLineLarge} />
            <div style={styles.loadingLine} />
            <div style={styles.loadingLineSmall} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, var(--cn-tint) 0%, var(--cn-surface) 42%, var(--cn-tint) 100%)",
    position: "relative" as const,
    overflow: "hidden" as const,
    color: "var(--cn-coral-dark)",
  },

  backgroundGlowOne: {
    position: "absolute" as const,
    width: "420px",
    height: "420px",
    borderRadius: "50%",
    background: "rgba(var(--cn-primary-rgb), 0.07)",
    top: "-180px",
    right: "-120px",
    pointerEvents: "none" as const,
  },

  backgroundGlowTwo: {
    position: "absolute" as const,
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    background: "rgba(var(--cn-primary-rgb), 0.045)",
    bottom: "10%",
    left: "-180px",
    pointerEvents: "none" as const,
  },

  container: {
    width: "100%",
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "34px 28px 60px",
    position: "relative" as const,
    zIndex: 1,
    boxSizing: "border-box" as const,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "28px",
  },

  breadcrumb: {
    fontSize: "12px",
    color: "var(--cn-coral)",
    marginBottom: "8px",
    fontWeight: 600,
  },

  pageTitle: {
    margin: 0,
    fontSize: "30px",
    lineHeight: 1.2,
    fontWeight: 800,
    letterSpacing: "-0.8px",
    color: "var(--cn-navy)",
  },

  pageSubtitle: {
    margin: "8px 0 0",
    fontSize: "14px",
    color: "var(--cn-coral)",
  },

  primaryButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    background: WARNA_PRIMARY,
    color: "var(--cn-surface)",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(var(--cn-primary-rgb), 0.22)",
  },

  plusIcon: {
    fontSize: "19px",
    lineHeight: 1,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "22px",
  },

  statCard: {
    background: "var(--cn-surface)",
    border: "1px solid var(--cn-coral-tint)",
    borderRadius: "16px",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 5px 20px rgba(var(--cn-navy-rgb), 0.035)",
  },

  statIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--cn-tint)",
    fontSize: "20px",
    flexShrink: 0,
  },

  statContent: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column" as const,
  },

  statLabel: {
    fontSize: "12px",
    color: "var(--cn-coral)",
    fontWeight: 600,
  },

  statValue: {
    marginTop: "1px",
    fontSize: "23px",
    lineHeight: 1.25,
    color: "var(--cn-navy)",
  },

  statDescription: {
    marginTop: "1px",
    fontSize: "10px",
    color: "var(--cn-coral)",
  },

  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    background: "var(--cn-surface)",
    border: "1px solid var(--cn-coral-tint)",
    borderRadius: "14px",
    padding: "10px",
    marginBottom: "30px",
    boxShadow: "0 5px 18px rgba(var(--cn-navy-rgb), 0.025)",
  },

  searchWrapper: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "0 10px",
  },

  searchIcon: {
    color: "var(--cn-coral)",
    fontSize: "21px",
  },

  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "var(--cn-navy)",
    fontSize: "13px",
  },

  filterGroup: {
    display: "flex",
    gap: "4px",
    padding: "4px",
    borderRadius: "10px",
    background: "var(--cn-coral-tint)",
  },

  filterButton: {
    border: "none",
    background: "transparent",
    color: "var(--cn-coral)",
    borderRadius: "8px",
    padding: "7px 12px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  filterButtonActive: {
    background: "var(--cn-surface)",
    color: WARNA_PRIMARY,
    boxShadow: "0 2px 7px rgba(var(--cn-navy-rgb), 0.08)",
  },

  section: {
    marginBottom: "38px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "13px",
  },

  sectionEyebrow: {
    fontSize: "10px",
    color: WARNA_PRIMARY,
    fontWeight: 800,
    letterSpacing: "1.1px",
    marginBottom: "4px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "18px",
    color: "var(--cn-navy)",
    fontWeight: 800,
  },

  sectionSubtitle: {
    margin: "4px 0 0",
    color: "var(--cn-coral)",
    fontSize: "12px",
  },

  countBadge: {
    background: "var(--cn-tint)",
    color: WARNA_PRIMARY,
    borderRadius: "999px",
    padding: "5px 10px",
    fontSize: "11px",
    fontWeight: 700,
  },

  taskList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },

  taskCard: {
    background: "var(--cn-surface)",
    border: "1px solid var(--cn-tint)",
    borderRadius: "17px",
    padding: "18px",
    boxShadow: "0 6px 22px rgba(var(--cn-navy-rgb), 0.035)",
  },

  taskTop: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
  },

  taskIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "var(--cn-tint)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    flexShrink: 0,
  },

  taskMain: {
    minWidth: 0,
    flex: 1,
  },

  taskTitleRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: "8px",
  },

  taskTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 800,
    color: "var(--cn-coral-dark)",
  },

  draftBadge: {
    padding: "3px 7px",
    borderRadius: "999px",
    fontSize: "9px",
    fontWeight: 800,
    color: "var(--cn-coral)",
    background: "var(--cn-coral-tint)",
  },

  sentBadge: {
    padding: "3px 7px",
    borderRadius: "999px",
    fontSize: "9px",
    fontWeight: 800,
    color: "var(--cn-success)",
    background: "var(--cn-success-tint)",
  },

  taskDescription: {
    margin: "7px 0",
    color: "var(--cn-coral)",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  taskMeta: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "12px",
    color: "var(--cn-coral)",
    fontSize: "10px",
  },

  taskActions: {
    display: "flex",
    gap: "5px",
    flexShrink: 0,
  },

  editButton: {
    border: "1px solid var(--cn-tint)",
    background: "var(--cn-tint)",
    color: WARNA_PRIMARY,
    borderRadius: "8px",
    padding: "7px 10px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  deleteButton: {
    border: "1px solid var(--cn-danger-tint)",
    background: "var(--cn-danger-tint)",
    color: "var(--cn-danger)",
    borderRadius: "8px",
    padding: "7px 10px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  taskBottom: {
    marginTop: "16px",
    paddingTop: "14px",
    borderTop: "1px solid var(--cn-coral-tint)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap" as const,
  },

  classArea: {
    flex: 1,
    minWidth: "200px",
  },

  classLabel: {
    display: "block",
    color: "var(--cn-coral)",
    fontSize: "9px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    marginBottom: "5px",
  },

  chipRow: {
    display: "flex",
    gap: "5px",
    flexWrap: "wrap" as const,
  },

  classChipSmall: {
    display: "inline-flex",
    padding: "4px 8px",
    borderRadius: "999px",
    background: "var(--cn-tint)",
    color: "var(--cn-primary)",
    fontSize: "10px",
    fontWeight: 700,
  },

  draftChip: {
    display: "inline-flex",
    padding: "4px 8px",
    borderRadius: "999px",
    background: "var(--cn-tint)",
    color: "var(--cn-coral)",
    fontSize: "10px",
    fontWeight: 600,
  },

  taskBottomActions: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    flexWrap: "wrap" as const,
    justifyContent: "flex-end",
  },

  submissionButton: {
    border: "1px solid var(--cn-tint)",
    background: "var(--cn-tint)",
    color: "var(--cn-primary-dark)",
    borderRadius: "9px",
    padding: "8px 11px",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  attachmentButton: {
    textDecoration: "none",
    border: "1px solid var(--cn-coral-tint)",
    background: "var(--cn-surface)",
    color: "var(--cn-coral)",
    borderRadius: "9px",
    padding: "8px 11px",
    fontSize: "10px",
    fontWeight: 700,
  },

  sendButton: {
    border: "none",
    background: "transparent",
    color: WARNA_PRIMARY,
    padding: "8px 5px",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  sendDropdown: {
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: "3px",
    minWidth: "190px",
    background: "var(--cn-surface)",
    border: "1px solid var(--cn-coral-tint)",
    borderRadius: "10px",
    padding: "6px",
    boxShadow: "0 12px 30px rgba(var(--cn-navy-rgb), 0.12)",
  },

  dropdownOption: {
    textAlign: "left" as const,
    border: "none",
    background: "transparent",
    borderRadius: "7px",
    padding: "8px",
    fontSize: "11px",
    color: "var(--cn-coral-dark)",
    cursor: "pointer",
  },

  dropdownClose: {
    border: "none",
    background: "var(--cn-tint)",
    color: "var(--cn-coral)",
    borderRadius: "7px",
    padding: "6px",
    fontSize: "10px",
    cursor: "pointer",
  },

  noClassText: {
    color: "var(--cn-coral)",
    fontSize: "10px",
    padding: "5px",
  },

  emptyState: {
    background: "var(--cn-surface)",
    border: "1px dashed var(--cn-coral-tint)",
    borderRadius: "16px",
    padding: "42px 20px",
    display: "flex",
    alignItems: "center",
    flexDirection: "column" as const,
    textAlign: "center" as const,
  },

  emptyIcon: {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--cn-coral-tint)",
    borderRadius: "14px",
    fontSize: "20px",
    marginBottom: "10px",
  },

  emptyTitle: {
    fontSize: "14px",
    color: "var(--cn-coral-dark)",
  },

  emptyDescription: {
    margin: "5px 0 15px",
    maxWidth: "420px",
    color: "var(--cn-coral)",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  emptyButton: {
    border: "none",
    borderRadius: "9px",
    padding: "9px 13px",
    background: WARNA_PRIMARY,
    color: "var(--cn-surface)",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  loadingList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },

  loadingCard: {
    height: "110px",
    background: "var(--cn-surface)",
    border: "1px solid var(--cn-coral-tint)",
    borderRadius: "16px",
    padding: "18px",
    display: "flex",
    gap: "14px",
  },

  loadingIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "var(--cn-coral-tint)",
  },

  loadingContent: {
    flex: 1,
  },

  loadingLineLarge: {
    width: "35%",
    height: "13px",
    borderRadius: "6px",
    background: "var(--cn-coral-tint)",
    marginBottom: "12px",
  },

  loadingLine: {
    width: "75%",
    height: "9px",
    borderRadius: "6px",
    background: "var(--cn-tint)",
    marginBottom: "8px",
  },

  loadingLineSmall: {
    width: "45%",
    height: "8px",
    borderRadius: "6px",
    background: "var(--cn-tint)",
  },

  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(var(--cn-navy-rgb), 0.52)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 100,
  },

  modal: {
    width: "100%",
    maxWidth: "570px",
    maxHeight: "90vh",
    overflowY: "auto" as const,
    background: "var(--cn-surface)",
    borderRadius: "20px",
    boxShadow: "0 30px 80px rgba(var(--cn-navy-rgb), 0.22)",
  },

  submissionModal: {
    width: "100%",
    maxWidth: "900px",
    maxHeight: "90vh",
    overflowY: "auto" as const,
    background: "var(--cn-surface)",
    borderRadius: "20px",
    boxShadow: "0 30px 80px rgba(var(--cn-navy-rgb), 0.22)",
  },

  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "15px",
    padding: "22px 24px",
    borderBottom: "1px solid var(--cn-coral-tint)",
  },

  modalEyebrow: {
    fontSize: "9px",
    color: WARNA_PRIMARY,
    fontWeight: 800,
    letterSpacing: "1px",
    marginBottom: "5px",
  },

  modalTitle: {
    margin: 0,
    color: "var(--cn-navy)",
    fontSize: "19px",
    fontWeight: 800,
  },

  modalDescription: {
    margin: "5px 0 0",
    color: "var(--cn-coral)",
    fontSize: "11px",
  },

  closeButton: {
    width: "32px",
    height: "32px",
    border: "none",
    borderRadius: "9px",
    background: "var(--cn-tint)",
    color: "var(--cn-coral)",
    fontSize: "21px",
    cursor: "pointer",
    flexShrink: 0,
  },

  form: {
    padding: "22px 24px 24px",
  },

  label: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
    marginBottom: "16px",
    color: "var(--cn-coral-dark)",
    fontSize: "12px",
    fontWeight: 700,
  },

  input: {
    width: "100%",
    boxSizing: "border-box" as const,
    border: "1px solid var(--cn-coral-tint)",
    borderRadius: "10px",
    padding: "11px 12px",
    background: "var(--cn-surface)",
    color: "var(--cn-navy)",
    fontSize: "13px",
    outline: "none",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box" as const,
    border: "1px solid var(--cn-coral-tint)",
    borderRadius: "10px",
    padding: "11px 12px",
    background: "var(--cn-surface)",
    color: "var(--cn-navy)",
    fontSize: "13px",
    outline: "none",
    resize: "vertical" as const,
    fontFamily: "inherit",
    lineHeight: 1.5,
  },

  attachmentBox: {
    padding: "14px",
    background: "var(--cn-tint)",
    border: "1px solid var(--cn-coral-tint)",
    borderRadius: "12px",
    marginBottom: "16px",
  },

  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    color: "var(--cn-coral-dark)",
    fontSize: "12px",
    cursor: "pointer",
  },

  helperText: {
    color: "var(--cn-coral)",
    fontSize: "10px",
    fontWeight: 400,
  },

  attachmentTabs: {
    display: "flex",
    gap: "5px",
    marginTop: "12px",
    marginBottom: "10px",
  },

  attachmentTab: {
    border: "1px solid var(--cn-coral-tint)",
    background: "var(--cn-surface)",
    color: "var(--cn-coral)",
    borderRadius: "8px",
    padding: "7px 12px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  attachmentTabActive: {
    borderColor: WARNA_PRIMARY,
    background: "var(--cn-tint)",
    color: WARNA_PRIMARY,
  },

  fileInput: {
    width: "100%",
    fontSize: "12px",
    color: "var(--cn-coral)",
  },

  fileInfo: {
    marginTop: "8px",
    padding: "8px 10px",
    borderRadius: "8px",
    background: "var(--cn-surface)",
    color: "var(--cn-coral)",
    fontSize: "11px",
  },

  classSelector: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "6px",
    marginTop: "4px",
  },

  classChip: {
    border: "1px solid var(--cn-coral-tint)",
    background: "var(--cn-surface)",
    color: "var(--cn-coral)",
    borderRadius: "999px",
    padding: "7px 11px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  classChipActive: {
    borderColor: WARNA_PRIMARY,
    background: WARNA_PRIMARY,
    color: "var(--cn-surface)",
  },

  noClass: {
    width: "100%",
    padding: "12px",
    borderRadius: "9px",
    background: "var(--cn-surface)",
    border: "1px dashed var(--cn-coral-tint)",
    color: "var(--cn-coral)",
    fontSize: "11px",
  },

  errorBox: {
    padding: "10px 12px",
    borderRadius: "9px",
    background: "var(--cn-danger-tint)",
    border: "1px solid var(--cn-danger-tint)",
    color: "var(--cn-danger)",
    fontSize: "11px",
    marginBottom: "14px",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    paddingTop: "5px",
  },

  cancelButton: {
    border: "1px solid var(--cn-coral-tint)",
    background: "var(--cn-surface)",
    color: "var(--cn-coral)",
    borderRadius: "9px",
    padding: "10px 15px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  saveButton: {
    border: "none",
    background: WARNA_PRIMARY,
    color: "var(--cn-surface)",
    borderRadius: "9px",
    padding: "10px 16px",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 5px 14px rgba(var(--cn-primary-rgb), 0.2)",
  },

  submissionStats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "10px",
    padding: "18px 24px 0",
  },

  submissionStat: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "12px",
    border: "1px solid var(--cn-coral-tint)",
    borderRadius: "12px",
    background: "var(--cn-tint)",
  },

  submissionStatSuccess: {
    background: "var(--cn-success-tint)",
    borderColor: "var(--cn-success-tint)",
  },

  submissionStatWarning: {
    background: "var(--cn-coral-tint)",
    borderColor: "var(--cn-coral)",
  },

  submissionStatIcon: {
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    background: "var(--cn-surface)",
    fontSize: "14px",
    flexShrink: 0,
  },

  submissionStatLabel: {
    display: "block",
    color: "var(--cn-coral)",
    fontSize: "9px",
    fontWeight: 700,
  },

  submissionStatValue: {
    display: "block",
    color: "var(--cn-navy)",
    fontSize: "17px",
    marginTop: "1px",
  },

  progressCard: {
    margin: "16px 24px",
    padding: "14px",
    borderRadius: "12px",
    background: "var(--cn-tint)",
  },

  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
    fontSize: "11px",
    color: "var(--cn-coral)",
  },

  progressTrack: {
    height: "7px",
    background: "var(--cn-coral-tint)",
    borderRadius: "999px",
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    borderRadius: "999px",
    background: WARNA_PRIMARY,
    transition: "width 0.25s ease",
  },

  submissionToolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    margin: "0 24px 12px",
    padding: "8px",
    border: "1px solid var(--cn-coral-tint)",
    borderRadius: "11px",
  },

  submissionSearch: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "0 5px",
    color: "var(--cn-coral)",
    fontSize: "17px",
  },

  studentList: {
    margin: "0 24px 24px",
    border: "1px solid var(--cn-coral-tint)",
    borderRadius: "12px",
    overflow: "hidden",
  },

  studentRow: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "12px 13px",
    borderBottom: "1px solid var(--cn-coral-tint)",
    background: "var(--cn-surface)",
  },

  studentAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "11px",
    background: "var(--cn-tint)",
    color: WARNA_PRIMARY,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 800,
    overflow: "hidden",
    flexShrink: 0,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },

  studentInfo: {
    minWidth: "160px",
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
  },

  studentName: {
    color: "var(--cn-coral-dark)",
    fontSize: "12px",
  },

  studentNis: {
    color: "var(--cn-coral)",
    fontSize: "10px",
    marginTop: "2px",
  },

  studentStatus: {
    minWidth: "180px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },

  statusSuccess: {
    color: "var(--cn-success)",
    fontSize: "10px",
    fontWeight: 800,
  },

  statusPending: {
    color: "var(--cn-coral)",
    fontSize: "10px",
    fontWeight: 800,
  },

  submissionTime: {
    color: "var(--cn-coral)",
    fontSize: "9px",
  },

  fileButton: {
    textDecoration: "none",
    border: "1px solid var(--cn-tint)",
    background: "var(--cn-tint)",
    color: "var(--cn-primary-dark)",
    borderRadius: "8px",
    padding: "7px 9px",
    fontSize: "9px",
    fontWeight: 800,
    whiteSpace: "nowrap" as const,
  },

  noFile: {
    width: "70px",
    textAlign: "center" as const,
    color: "var(--cn-coral)",
    fontSize: "12px",
  },

  submissionLoading: {
    minHeight: "280px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column" as const,
    gap: "10px",
    color: "var(--cn-coral)",
    fontSize: "12px",
  },

  spinner: {
    width: "28px",
    height: "28px",
    border: "3px solid var(--cn-coral-tint)",
    borderTopColor: WARNA_PRIMARY,
    borderRadius: "50%",
  },

  submissionError: {
    margin: "25px",
    padding: "30px",
    borderRadius: "14px",
    background: "var(--cn-tint)",
    textAlign: "center" as const,
    color: "var(--cn-coral)",
  },

  errorIcon: {
    width: "40px",
    height: "40px",
    margin: "0 auto 10px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--cn-danger-tint)",
    color: "var(--cn-danger)",
    fontWeight: 800,
  },

  noStudent: {
    padding: "45px 20px",
    textAlign: "center" as const,
    color: "var(--cn-coral)",
  },
};