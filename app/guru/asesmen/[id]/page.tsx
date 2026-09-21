"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const WARNA_PRIMARY = "#2196f3";

type TipeSoal = "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";

interface Opsi {
  id: string;
  teks: string;
  benar: boolean;
}
interface Soal {
  id: string;
  tipe: TipeSoal;
  pertanyaan: string;
  opsi: Opsi[];
}
interface KelasRingkas {
  id: string;
  judul: string;
}
interface DetailAsesmen {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  status: "PROSES" | "SELESAI";
  durasiMenit: number | null;
  mapel: { id: string; nama: string };
  soal: Soal[];
  kelasTujuan: KelasRingkas[];
}

export default function HalamanDetailAsesmen() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const asesmenId = params.id;

  const [asesmen, setAsesmen] = useState<DetailAsesmen | null>(null);
  const [sedangMuat, setSedangMuat] = useState(true);

  const [modalSoalTerbuka, setModalSoalTerbuka] = useState(false);
  const [tipeSoalBaru, setTipeSoalBaru] = useState<TipeSoal>("PILIHAN_GANDA");
  const [pertanyaanBaru, setPertanyaanBaru] = useState("");
  const [opsiBaru, setOpsiBaru] = useState<{ teks: string; benar: boolean }[]>([
    { teks: "", benar: false },
    { teks: "", benar: false },
  ]);
  const [sedangSimpanSoal, setSedangSimpanSoal] = useState(false);
  const [pesanErrorSoal, setPesanErrorSoal] = useState<string | null>(null);

  const [modalKelasTerbuka, setModalKelasTerbuka] = useState(false);
  const [kelasSaya, setKelasSaya] = useState<KelasRingkas[]>([]);

  const [sedangFinalisasi, setSedangFinalisasi] = useState(false);

  const muatDetail = useCallback(async () => {
    setSedangMuat(true);
    const response = await fetch(`/api/asesmen/${asesmenId}`);
    const data = await response.json();
    if (response.ok) setAsesmen(data.data);
    setSedangMuat(false);
  }, [asesmenId]);

  useEffect(() => {
    muatDetail();
  }, [muatDetail]);

  function bukaModalSoal() {
    setPertanyaanBaru("");
    setTipeSoalBaru("PILIHAN_GANDA");
    setOpsiBaru([
      { teks: "", benar: false },
      { teks: "", benar: false },
    ]);
    setPesanErrorSoal(null);
    setModalSoalTerbuka(true);
  }

  function tambahBarisOpsi() {
    setOpsiBaru((prev) => [...prev, { teks: "", benar: false }]);
  }

  function hapusBarisOpsi(index: number) {
    setOpsiBaru((prev) => prev.filter((_, i) => i !== index));
  }

  function ubahTeksOpsi(index: number, teks: string) {
    setOpsiBaru((prev) => prev.map((o, i) => (i === index ? { ...o, teks } : o)));
  }

  function toggleBenarOpsi(index: number) {
    setOpsiBaru((prev) =>
      prev.map((o, i) => {
        if (tipeSoalBaru === "PILIHAN_GANDA") {
          // Radio behaviour: cuma satu yang boleh benar
          return { ...o, benar: i === index };
        }
        // Checkbox: bisa lebih dari satu
        return i === index ? { ...o, benar: !o.benar } : o;
      })
    );
  }

  async function simpanSoal() {
    setPesanErrorSoal(null);

    if (!pertanyaanBaru.trim()) {
      setPesanErrorSoal("Pertanyaan wajib diisi");
      return;
    }

    setSedangSimpanSoal(true);
    try {
      const response = await fetch(`/api/asesmen/${asesmenId}/soal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipe: tipeSoalBaru,
          pertanyaan: pertanyaanBaru.trim(),
          opsi: tipeSoalBaru === "ESSAY" ? undefined : opsiBaru,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setPesanErrorSoal(data.pesan ?? "Gagal menyimpan soal");
        return;
      }

      setModalSoalTerbuka(false);
      await muatDetail();
    } finally {
      setSedangSimpanSoal(false);
    }
  }

  async function hapusSoal(soalId: string) {
    if (!confirm("Hapus soal ini?")) return;
    const response = await fetch(`/api/asesmen/${asesmenId}/soal/${soalId}`, {
      method: "DELETE",
    });
    if (response.ok) await muatDetail();
  }

  async function bukaModalKelas() {
    setModalKelasTerbuka(true);
    const response = await fetch("/api/guru/kelas");
    const data = await response.json();
    setKelasSaya(response.ok ? data.data : []);
  }

  async function tambahKelasTujuan(kelasId: string) {
    const response = await fetch(`/api/asesmen/${asesmenId}/kirim-ke-kelas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kelasId }),
    });
    if (response.ok) await muatDetail();
  }

  async function finalisasiAsesmen() {
    if (!confirm("Finalisasi asesmen ini? Setelah ini, asesmen akan muncul di kelas tujuan dan siswa bisa mulai mengerjakan.")) {
      return;
    }
    setSedangFinalisasi(true);
    const response = await fetch(`/api/asesmen/${asesmenId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ finalisasi: true }),
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.pesan ?? "Gagal finalisasi");
    } else {
      await muatDetail();
    }
    setSedangFinalisasi(false);
  }

  if (sedangMuat) return <p style={estilo.pesanMuat}>Memuat...</p>;
  if (!asesmen) return <p style={estilo.pesanMuat}>Asesmen tidak ditemukan.</p>;

  const kelasBelumDitambah = kelasSaya.filter(
    (k) => !asesmen.kelasTujuan.some((kt) => kt.id === k.id)
  );

  return (
    <div style={estilo.halaman}>
      <button onClick={() => router.push("/guru/asesmen")} style={estilo.tombolKembali}>
        ← Kembali ke Asesmen
      </button>

      <div style={estilo.header}>
        <div>
          <h1 style={estilo.judul}>{asesmen.judul}</h1>
          <p style={estilo.subInfo}>
            {asesmen.tipe === "KUIS" ? "Kuis" : "Ujian Online"} · {asesmen.mapel.nama}
            {asesmen.durasiMenit ? ` · ${asesmen.durasiMenit} menit` : ""}
          </p>
        </div>
        <span
          style={{
            ...estilo.badgeStatus,
            ...(asesmen.status === "SELESAI" ? estilo.badgeSelesai : estilo.badgeProses),
          }}
        >
          {asesmen.status === "SELESAI" ? "Selesai" : "Proses"}
        </span>
      </div>

      {asesmen.status === "PROSES" && (
        <button
          onClick={finalisasiAsesmen}
          disabled={sedangFinalisasi || asesmen.soal.length === 0}
          style={estilo.tombolFinalisasi}
        >
          {sedangFinalisasi ? "Memproses..." : "Buat Asesmen (Finalisasi)"}
        </button>
      )}

      <section style={estilo.seksi}>
        <div style={estilo.headerSeksi}>
          <h2 style={estilo.judulSeksi}>Kelas Tujuan ({asesmen.kelasTujuan.length})</h2>
          <button onClick={bukaModalKelas} style={estilo.tombolTambah}>
            + Tambah Kelas
          </button>
        </div>
        {asesmen.kelasTujuan.length === 0 && (
          <p style={estilo.pesanKosong}>Belum dikirim ke kelas manapun.</p>
        )}
        <div style={estilo.baris_chip}>
          {asesmen.kelasTujuan.map((k) => (
            <span key={k.id} style={estilo.chip}>
              {k.judul}
            </span>
          ))}
        </div>
      </section>

      <section style={estilo.seksi}>
        <div style={estilo.headerSeksi}>
          <h2 style={estilo.judulSeksi}>Soal ({asesmen.soal.length})</h2>
          {asesmen.status === "PROSES" && (
            <button onClick={bukaModalSoal} style={estilo.tombolTambah}>
              + Tambah Soal
            </button>
          )}
        </div>

        {asesmen.soal.length === 0 && (
          <p style={estilo.pesanKosong}>Belum ada soal.</p>
        )}

        <div style={estilo.daftarSoal}>
          {asesmen.soal.map((s, i) => (
            <div key={s.id} style={estilo.kartuSoal}>
              <div style={estilo.headerSoal}>
                <span style={estilo.nomorSoal}>Soal {i + 1}</span>
                <span style={estilo.tipeSoalBadge}>{labelTipeSoal(s.tipe)}</span>
                {asesmen.status === "PROSES" && (
                  <button onClick={() => hapusSoal(s.id)} style={estilo.tombolHapusSoal}>
                    Hapus
                  </button>
                )}
              </div>
              <p style={estilo.teksPertanyaan}>{s.pertanyaan}</p>
              {s.opsi.length > 0 && (
                <ul style={estilo.daftarOpsi}>
                  {s.opsi.map((o) => (
                    <li
                      key={o.id}
                      style={{
                        ...estilo.itemOpsi,
                        ...(o.benar ? estilo.itemOpsiBenar : {}),
                      }}
                    >
                      {o.teks} {o.benar && "✓"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---- Modal Tambah Soal ---- */}
      {modalSoalTerbuka && (
        <div style={estilo.overlay} onClick={() => setModalSoalTerbuka(false)}>
          <div style={estilo.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={estilo.judulModal}>Tambah Soal</h3>

            <div style={estilo.baris_tab}>
              {(["PILIHAN_GANDA", "CHECKBOX", "ESSAY"] as TipeSoal[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipeSoalBaru(t)}
                  style={{
                    ...estilo.tabKecil,
                    ...(tipeSoalBaru === t ? estilo.tabKecilAktif : {}),
                  }}
                >
                  {labelTipeSoal(t)}
                </button>
              ))}
            </div>

            <label style={estilo.label}>
              Pertanyaan
              <textarea
                value={pertanyaanBaru}
                onChange={(e) => setPertanyaanBaru(e.target.value)}
                rows={3}
                style={estilo.textarea}
              />
            </label>

            {tipeSoalBaru !== "ESSAY" && (
              <div style={estilo.label}>
                Opsi Jawaban{" "}
                <span style={estilo.catatanOpsi}>
                  ({tipeSoalBaru === "PILIHAN_GANDA" ? "pilih 1 jawaban benar" : "boleh lebih dari 1 jawaban benar"})
                </span>
                {opsiBaru.map((o, i) => (
                  <div key={i} style={estilo.barisOpsiInput}>
                    <input
                      type={tipeSoalBaru === "PILIHAN_GANDA" ? "radio" : "checkbox"}
                      checked={o.benar}
                      onChange={() => toggleBenarOpsi(i)}
                    />
                    <input
                      type="text"
                      value={o.teks}
                      onChange={(e) => ubahTeksOpsi(i, e.target.value)}
                      placeholder={`Opsi ${i + 1}`}
                      style={estilo.inputOpsi}
                    />
                    {opsiBaru.length > 2 && (
                      <button
                        type="button"
                        onClick={() => hapusBarisOpsi(i)}
                        style={estilo.tombolHapusOpsi}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={tambahBarisOpsi} style={estilo.tombolTambahOpsi}>
                  + Tambah opsi
                </button>
              </div>
            )}

            {pesanErrorSoal && <p style={estilo.pesan_error}>{pesanErrorSoal}</p>}

            <div style={estilo.barisTombolModal}>
              <button
                onClick={() => setModalSoalTerbuka(false)}
                style={estilo.tombolBatal}
                disabled={sedangSimpanSoal}
              >
                Batal
              </button>
              <button onClick={simpanSoal} style={estilo.tombolSimpan} disabled={sedangSimpanSoal}>
                {sedangSimpanSoal ? "Menyimpan..." : "Simpan Soal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Modal Tambah Kelas Tujuan ---- */}
      {modalKelasTerbuka && (
        <div style={estilo.overlay} onClick={() => setModalKelasTerbuka(false)}>
          <div style={estilo.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={estilo.judulModal}>Kirim ke Kelas</h3>
            {kelasBelumDitambah.length === 0 && (
              <p style={estilo.pesanKosong}>
                Semua kelas yang kamu ajar sudah jadi tujuan asesmen ini.
              </p>
            )}
            <div style={estilo.daftarModalKelas}>
              {kelasBelumDitambah.map((k) => (
                <div key={k.id} style={estilo.itemDaftar}>
                  <span>{k.judul}</span>
                  <button
                    onClick={() => tambahKelasTujuan(k.id)}
                    style={estilo.tombolTambahKecil}
                  >
                    Tambah
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setModalKelasTerbuka(false)}
              style={estilo.tombolTutupModal}
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function labelTipeSoal(t: TipeSoal) {
  switch (t) {
    case "PILIHAN_GANDA":
      return "Pilihan Ganda";
    case "CHECKBOX":
      return "Checkbox";
    case "ESSAY":
      return "Essay";
  }
}

const estilo = {
  halaman: { padding: "24px", backgroundColor: "#ffffff", minHeight: "100vh" },
  pesanMuat: { padding: "24px", color: "#6b7280" },
  tombolKembali: {
    background: "none",
    border: "none",
    color: WARNA_PRIMARY,
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    marginBottom: "16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  judul: { margin: 0, fontSize: "20px", fontWeight: 700, color: "#000000" },
  subInfo: { margin: "4px 0 0", fontSize: "13px", color: "#6b7280" },
  badgeStatus: { fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "999px" },
  badgeProses: { backgroundColor: "#fef3c7", color: "#92400e" },
  badgeSelesai: { backgroundColor: "#dcfce7", color: "#166534" },
  tombolFinalisasi: {
    marginBottom: "24px",
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#16a34a",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  seksi: { marginBottom: "28px", paddingBottom: "20px", borderBottom: "1px solid #f3f4f6" },
  headerSeksi: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  judulSeksi: { margin: 0, fontSize: "16px", fontWeight: 700, color: "#000000" },
  tombolTambah: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#ffffff",
    backgroundColor: WARNA_PRIMARY,
    border: "none",
    borderRadius: "8px",
    padding: "6px 12px",
    cursor: "pointer",
  },
  pesanKosong: { color: "#9ca3af", fontSize: "13px" },
  baris_chip: { display: "flex", flexWrap: "wrap" as const, gap: "6px" },
  chip: {
    fontSize: "12px",
    fontWeight: 600,
    color: WARNA_PRIMARY,
    backgroundColor: "#e8f3fe",
    padding: "4px 10px",
    borderRadius: "999px",
  },
  daftarSoal: { display: "flex", flexDirection: "column" as const, gap: "12px" },
  kartuSoal: {
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "14px",
  },
  headerSoal: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" },
  nomorSoal: { fontSize: "13px", fontWeight: 700, color: "#000000" },
  tipeSoalBadge: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#6b7280",
    backgroundColor: "#f3f4f6",
    padding: "2px 8px",
    borderRadius: "999px",
  },
  tombolHapusSoal: {
    marginLeft: "auto",
    fontSize: "12px",
    fontWeight: 600,
    color: "#dc2626",
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  teksPertanyaan: { fontSize: "14px", color: "#000000", margin: "0 0 8px 0" },
  daftarOpsi: { margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column" as const, gap: "4px" },
  itemOpsi: { fontSize: "13px", color: "#374151" },
  itemOpsiBenar: { color: "#16a34a", fontWeight: 700 },
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
    maxWidth: "480px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "24px",
    maxHeight: "85vh",
    overflowY: "auto" as const,
  },
  judulModal: { margin: "0 0 14px 0", fontSize: "16px", fontWeight: 700, color: "#000000" },
  baris_tab: {
    display: "flex",
    gap: "4px",
    marginBottom: "16px",
    backgroundColor: "#f3f4f6",
    borderRadius: "8px",
    padding: "4px",
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
  label: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#000000",
    marginBottom: "14px",
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
  catatanOpsi: { fontWeight: 400, color: "#9ca3af", fontSize: "11px" },
  barisOpsiInput: { display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" },
  inputOpsi: {
    flex: 1,
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "13px",
    color: "#000000",
    outline: "none",
  },
  tombolHapusOpsi: {
    background: "none",
    border: "none",
    color: "#dc2626",
    fontSize: "16px",
    cursor: "pointer",
  },
  tombolTambahOpsi: {
    marginTop: "8px",
    fontSize: "12px",
    fontWeight: 600,
    color: WARNA_PRIMARY,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  },
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
  daftarModalKelas: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    marginBottom: "14px",
    maxHeight: "240px",
    overflowY: "auto" as const,
  },
  itemDaftar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: "8px",
    backgroundColor: "#f9fafb",
    fontSize: "13px",
    color: "#000000",
  },
  tombolTambahKecil: {
    fontSize: "12px",
    color: WARNA_PRIMARY,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
  },
  tombolTutupModal: {
    width: "100%",
    padding: "10px 0",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
};