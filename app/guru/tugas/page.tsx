"use client";

import { useCallback, useEffect, useState } from "react";

const WARNA_PRIMARY = "#2196f3";

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

export default function HalamanTugasGuru() {
  const [daftarTugas, setDaftarTugas] = useState<Tugas[]>([]);
  const [kelasSaya, setKelasSaya] = useState<KelasRingkas[]>([]);
  const [sedangMuat, setSedangMuat] = useState(true);

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

  // Dropdown kirim-ke-kelas per kartu
  const [idSedangKirim, setIdSedangKirim] = useState<string | null>(null);

  const muatSemua = useCallback(async () => {
    setSedangMuat(true);
    const [resTugas, resKelas] = await Promise.all([
      fetch("/api/tugas"),
      fetch("/api/guru/kelas"),
    ]);
    const dataTugas = await resTugas.json();
    const dataKelas = await resKelas.json();
    if (resTugas.ok) setDaftarTugas(dataTugas.data);
    if (resKelas.ok) setKelasSaya(dataKelas.data);
    setSedangMuat(false);
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

  async function simpanTugas() {
    if (!judul.trim() || !deskripsi.trim()) {
      setPesanError("Judul dan deskripsi wajib diisi");
      return;
    }
    if (pakaiLampiran && tipeLampiran === "PDF" && !fileTerpilih && !lampiran) {
      setPesanError("Pilih file PDF dulu");
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
          setPesanError(dataUpload.pesan ?? "Gagal upload file");
          setSedangSimpan(false);
          return;
        }
        urlLampiranAkhir = dataUpload.url;
      }
    } catch {
      setSedangUpload(false);
      setPesanError("Gagal upload file, coba lagi");
      setSedangSimpan(false);
      return;
    }

    const payload = {
      judul,
      deskripsi,
      tipeLampiran: pakaiLampiran ? tipeLampiran : undefined,
      lampiran: pakaiLampiran ? urlLampiranAkhir : undefined,
    };

    try {
      const response = tugasDiedit
        ? await fetch(`/api/tugas/${tugasDiedit.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/tugas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, kelasIds: kelasIdsDipilih }),
          });

      const data = await response.json();
      if (!response.ok) {
        setPesanError(data.pesan ?? "Gagal menyimpan tugas");
        return;
      }
      setModalTerbuka(false);
      await muatSemua();
    } finally {
      setSedangSimpan(false);
    }
  }

  async function hapusTugas(id: string) {
    if (!confirm("Hapus tugas ini? Semua data pengumpulan siswa ikut terhapus.")) return;
    const response = await fetch(`/api/tugas/${id}`, { method: "DELETE" });
    if (response.ok) await muatSemua();
  }

  async function kirimKeKelas(tugasId: string, kelasId: string) {
    const response = await fetch(`/api/tugas/${tugasId}/kirim-ke-kelas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kelasId }),
    });
    if (response.ok) {
      setIdSedangKirim(null);
      await muatSemua();
    }
  }

  function toggleKelasDipilih(id: string) {
    setKelasIdsDipilih((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  }

  const hariIni = new Date().toDateString();
  const tugasHariIni = daftarTugas.filter(
    (t) => new Date(t.createdAt).toDateString() === hariIni
  );
  const riwayat = daftarTugas.filter(
    (t) => new Date(t.createdAt).toDateString() !== hariIni
  );

  return (
    <div style={estilo.halaman}>
      <div style={estilo.header}>
        <h1 style={estilo.judulHalaman}>Tugas</h1>
        <button onClick={bukaModalBuat} style={estilo.tombolBuat}>
          + Buat Tugas
        </button>
      </div>

      {sedangMuat && <p style={estilo.pesanMuat}>Memuat...</p>}

      {!sedangMuat && (
        <>
          <section style={estilo.seksi}>
            <h2 style={estilo.judulSeksi}>Tugas Hari Ini</h2>
            {tugasHariIni.length === 0 && (
              <p style={estilo.pesanKosong}>Belum ada tugas dibuat hari ini.</p>
            )}
            <div style={estilo.daftar}>
              {tugasHariIni.map((t) => (
                <KartuTugas
                  key={t.id}
                  t={t}
                  kelasSaya={kelasSaya}
                  idSedangKirim={idSedangKirim}
                  onEdit={() => bukaModalEdit(t)}
                  onHapus={() => hapusTugas(t.id)}
                  onBukaKirim={() => setIdSedangKirim(t.id)}
                  onTutupKirim={() => setIdSedangKirim(null)}
                  onKirim={(kelasId) => kirimKeKelas(t.id, kelasId)}
                />
              ))}
            </div>
          </section>

          <section style={estilo.seksi}>
            <h2 style={estilo.judulSeksi}>Riwayat</h2>
            {riwayat.length === 0 && (
              <p style={estilo.pesanKosong}>Belum ada riwayat tugas lain.</p>
            )}
            <div style={estilo.daftar}>
              {riwayat.map((t) => (
                <KartuTugas
                  key={t.id}
                  t={t}
                  kelasSaya={kelasSaya}
                  idSedangKirim={idSedangKirim}
                  onEdit={() => bukaModalEdit(t)}
                  onHapus={() => hapusTugas(t.id)}
                  onBukaKirim={() => setIdSedangKirim(t.id)}
                  onTutupKirim={() => setIdSedangKirim(null)}
                  onKirim={(kelasId) => kirimKeKelas(t.id, kelasId)}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {/* ---- Modal Buat/Edit ---- */}
      {modalTerbuka && (
        <div style={estilo.overlay} onClick={() => setModalTerbuka(false)}>
          <div style={estilo.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={estilo.judulModal}>
              {tugasDiedit ? "Edit Tugas" : "Buat Tugas"}
            </h3>

            <label style={estilo.label}>
              Judul
              <input
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                style={estilo.input}
              />
            </label>

            <label style={estilo.label}>
              Deskripsi
              <textarea
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                rows={3}
                style={estilo.textarea}
              />
            </label>

            <label style={estilo.labelCheckbox}>
              <input
                type="checkbox"
                checked={pakaiLampiran}
                onChange={(e) => setPakaiLampiran(e.target.checked)}
              />
              Sertakan lampiran (PDF/Link)
            </label>

            {pakaiLampiran && (
              <div style={estilo.baris_tab}>
                {(["LINK", "PDF"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipeLampiran(t)}
                    style={{
                      ...estilo.tabKecil,
                      ...(tipeLampiran === t ? estilo.tabKecilAktif : {}),
                    }}
                  >
                    {t === "LINK" ? "Link" : "Upload PDF"}
                  </button>
                ))}
              </div>
            )}

            {pakaiLampiran && tipeLampiran === "LINK" && (
              <input
                type="text"
                value={lampiran}
                onChange={(e) => setLampiran(e.target.value)}
                placeholder="https://..."
                style={{ ...estilo.input, marginBottom: "14px" }}
              />
            )}

            {pakaiLampiran && tipeLampiran === "PDF" && (
              <div style={{ marginBottom: "14px" }}>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFileTerpilih(e.target.files?.[0] ?? null)}
                  style={estilo.inputFile}
                />
                {fileTerpilih && (
                  <p style={estilo.namaFileTerpilih}>{fileTerpilih.name}</p>
                )}
                {!fileTerpilih && lampiran && (
                  <p style={estilo.namaFileTerpilih}>File saat ini: {lampiran.split("/").pop()}</p>
                )}
              </div>
            )}

            {!tugasDiedit && (
              <div style={estilo.label}>
                Kirim ke kelas (opsional — bisa disimpan draft dulu)
                <div style={estilo.baris_chip}>
                  {kelasSaya.map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => toggleKelasDipilih(k.id)}
                      style={{
                        ...estilo.chipPilihan,
                        ...(kelasIdsDipilih.includes(k.id) ? estilo.chipPilihanAktif : {}),
                      }}
                    >
                      {k.judul}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {pesanError && <p style={estilo.pesan_error}>{pesanError}</p>}

            <div style={estilo.barisTombolModal}>
              <button
                onClick={() => setModalTerbuka(false)}
                style={estilo.tombolBatal}
                disabled={sedangSimpan}
              >
                Batal
              </button>
              <button onClick={simpanTugas} style={estilo.tombolSimpan} disabled={sedangSimpan}>
                {sedangUpload ? "Mengupload file..." : sedangSimpan ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KartuTugas({
  t,
  kelasSaya,
  idSedangKirim,
  onEdit,
  onHapus,
  onBukaKirim,
  onTutupKirim,
  onKirim,
}: {
  t: Tugas;
  kelasSaya: KelasRingkas[];
  idSedangKirim: string | null;
  onEdit: () => void;
  onHapus: () => void;
  onBukaKirim: () => void;
  onTutupKirim: () => void;
  onKirim: (kelasId: string) => void;
}) {
  const kelasBelumDikirim = kelasSaya.filter(
    (k) => !t.kelasTujuan.some((kt) => kt.id === k.id)
  );

  return (
    <div style={estilo.kartuTugas}>
      <div style={estilo.headerKartu}>
        <strong style={estilo.judulKartu}>{t.judul}</strong>
        <div style={estilo.aksiKartu}>
          <button onClick={onEdit} style={estilo.tombolAksiKecil}>
            Edit
          </button>
          <button onClick={onHapus} style={estilo.tombolHapusKecil}>
            Hapus
          </button>
        </div>
      </div>
      <p style={estilo.deskripsiKartu}>{t.deskripsi}</p>

      <div style={estilo.baris_chip}>
        {t.kelasTujuan.length === 0 && <span style={estilo.chipDraft}>Draft (belum dikirim)</span>}
        {t.kelasTujuan.map((k) => (
          <span key={k.id} style={estilo.chip}>
            {k.judul}
          </span>
        ))}
      </div>

      {idSedangKirim === t.id ? (
        <div style={estilo.dropdownKirim}>
          {kelasBelumDikirim.length === 0 ? (
            <span style={estilo.pesanKosongKecil}>Sudah dikirim ke semua kelasmu.</span>
          ) : (
            kelasBelumDikirim.map((k) => (
              <button key={k.id} onClick={() => onKirim(k.id)} style={estilo.opsiDropdown}>
                {k.judul}
              </button>
            ))
          )}
          <button onClick={onTutupKirim} style={estilo.tombolTutupDropdown}>
            Tutup
          </button>
        </div>
      ) : (
        <button onClick={onBukaKirim} style={estilo.tombolKirimKelas}>
          + Kirim ke Kelas Lain
        </button>
      )}
    </div>
  );
}

const estilo = {
  halaman: { padding: "24px", backgroundColor: "#ffffff", minHeight: "100vh" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  judulHalaman: { margin: 0, fontSize: "22px", fontWeight: 700, color: "#000000" },
  tombolBuat: {
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: WARNA_PRIMARY,
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  pesanMuat: { color: "#6b7280", fontSize: "14px" },
  pesanKosong: { color: "#9ca3af", fontSize: "13px" },
  pesanKosongKecil: { color: "#9ca3af", fontSize: "12px" },
  seksi: { marginBottom: "28px" },
  judulSeksi: { fontSize: "15px", fontWeight: 700, color: "#000000", marginBottom: "12px" },
  daftar: { display: "flex", flexDirection: "column" as const, gap: "10px" },
  kartuTugas: {
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "14px",
  },
  headerKartu: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  judulKartu: { fontSize: "14px", color: "#000000" },
  aksiKartu: { display: "flex", gap: "10px" },
  tombolAksiKecil: {
    fontSize: "12px",
    fontWeight: 600,
    color: WARNA_PRIMARY,
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  tombolHapusKecil: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#dc2626",
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  deskripsiKartu: { fontSize: "13px", color: "#6b7280", margin: "6px 0 10px" },
  baris_chip: { display: "flex", flexWrap: "wrap" as const, gap: "6px", marginBottom: "8px" },
  chip: {
    fontSize: "11px",
    fontWeight: 600,
    color: WARNA_PRIMARY,
    backgroundColor: "#e8f3fe",
    padding: "3px 8px",
    borderRadius: "999px",
  },
  chipDraft: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#92400e",
    backgroundColor: "#fef3c7",
    padding: "3px 8px",
    borderRadius: "999px",
  },
  tombolKirimKelas: {
    fontSize: "12px",
    fontWeight: 600,
    color: WARNA_PRIMARY,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  },
  dropdownKirim: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "8px",
  },
  opsiDropdown: {
    textAlign: "left" as const,
    fontSize: "12px",
    color: "#000000",
    background: "none",
    border: "none",
    padding: "6px 8px",
    cursor: "pointer",
    borderRadius: "6px",
  },
  tombolTutupDropdown: {
    fontSize: "11px",
    color: "#6b7280",
    background: "none",
    border: "none",
    cursor: "pointer",
    alignSelf: "flex-end" as const,
  },
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
    maxWidth: "460px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "24px",
    maxHeight: "85vh",
    overflowY: "auto" as const,
  },
  judulModal: { margin: "0 0 14px 0", fontSize: "16px", fontWeight: 700, color: "#000000" },
  label: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#000000",
    marginBottom: "14px",
  },
  labelCheckbox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#000000",
    marginBottom: "10px",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    color: "#000000",
    outline: "none",
  },
  inputFile: {
    fontSize: "13px",
    color: "#000000",
  },
  namaFileTerpilih: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "6px 0 0",
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
  baris_tab: {
    display: "flex",
    gap: "4px",
    marginBottom: "10px",
    backgroundColor: "#f3f4f6",
    borderRadius: "8px",
    padding: "4px",
    maxWidth: "220px",
  },
  tabKecil: {
    flex: 1,
    padding: "6px 0",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "transparent",
    color: "#374151",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },
  tabKecilAktif: { backgroundColor: WARNA_PRIMARY, color: "#ffffff" },
  chipPilihan: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#374151",
    backgroundColor: "#f3f4f6",
    border: "none",
    padding: "5px 10px",
    borderRadius: "999px",
    cursor: "pointer",
  },
  chipPilihanAktif: { backgroundColor: WARNA_PRIMARY, color: "#ffffff" },
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