"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const WARNA_PRIMARY = "#2196f3";

export default function HalamanBuatTugasCepat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kelasId = searchParams.get("kelasId");

  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [pakaiLampiran, setPakaiLampiran] = useState(false);
  const [tipeLampiran, setTipeLampiran] = useState<"PDF" | "LINK">("LINK");
  const [lampiran, setLampiran] = useState("");
  const [fileTerpilih, setFileTerpilih] = useState<File | null>(null);
  const [sedangUpload, setSedangUpload] = useState(false);
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPesanError(null);

    if (!judul.trim() || !deskripsi.trim()) {
      setPesanError("Judul dan deskripsi wajib diisi");
      return;
    }
    if (pakaiLampiran && tipeLampiran === "PDF" && !fileTerpilih) {
      setPesanError("Pilih file PDF dulu");
      return;
    }

    setSedangSimpan(true);
    let urlLampiranAkhir = lampiran;

    try {
      if (pakaiLampiran && tipeLampiran === "PDF" && fileTerpilih) {
        setSedangUpload(true);
        const formData = new FormData();
        formData.append("file", fileTerpilih);
        formData.append("folder", "lampiran-tugas");
        const responseUpload = await fetch("/api/upload", { method: "POST", body: formData });
        const dataUpload = await responseUpload.json();
        setSedangUpload(false);
        if (!responseUpload.ok) {
          setPesanError(dataUpload.pesan ?? "Gagal upload file");
          setSedangSimpan(false);
          return;
        }
        urlLampiranAkhir = dataUpload.url;
      }

      const response = await fetch("/api/tugas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: judul.trim(),
          deskripsi: deskripsi.trim(),
          tipeLampiran: pakaiLampiran ? tipeLampiran : undefined,
          lampiran: pakaiLampiran ? urlLampiranAkhir : undefined,
          kelasIds: kelasId ? [kelasId] : undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setPesanError(data.pesan ?? "Gagal membuat tugas");
        return;
      }

      router.push(kelasId ? `/guru/kelas/${kelasId}` : "/guru/tugas");
    } catch {
      setPesanError("Tidak bisa terhubung ke server, coba lagi.");
    } finally {
      setSedangSimpan(false);
      setSedangUpload(false);
    }
  }

  return (
    <div style={estilo.halaman}>
      <h1 style={estilo.judulHalaman}>Buat Tugas</h1>
      {kelasId && (
        <p style={estilo.catatanKelas}>
          Tugas ini otomatis akan dikirim ke kelas yang tadi kamu buka.
        </p>
      )}

      <form onSubmit={handleSubmit} style={estilo.form}>
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
            rows={4}
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
            />
            {fileTerpilih && <p style={estilo.namaFile}>{fileTerpilih.name}</p>}
          </div>
        )}

        {pesanError && <p style={estilo.pesan_error}>{pesanError}</p>}

        <button type="submit" disabled={sedangSimpan} style={estilo.tombol}>
          {sedangUpload ? "Mengupload file..." : sedangSimpan ? "Menyimpan..." : "Buat Tugas"}
        </button>
      </form>
    </div>
  );
}

const estilo = {
  halaman: { padding: "24px", backgroundColor: "#ffffff", minHeight: "100vh", maxWidth: "480px" },
  judulHalaman: { margin: "0 0 8px 0", fontSize: "22px", fontWeight: 700, color: "#000000" },
  catatanKelas: {
    fontSize: "12px",
    color: "#6b7280",
    backgroundColor: "#f9fafb",
    padding: "10px 12px",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  form: { display: "flex", flexDirection: "column" as const, gap: "16px" },
  label: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#000000",
  },
  labelCheckbox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#000000",
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
  baris_tab: {
    display: "flex",
    gap: "4px",
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
  namaFile: { fontSize: "12px", color: "#6b7280", margin: "6px 0 0" },
  pesan_error: { color: "#dc2626", fontSize: "13px", margin: 0 },
  tombol: {
    padding: "10px 0",
    borderRadius: "8px",
    border: "none",
    backgroundColor: WARNA_PRIMARY,
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },
};