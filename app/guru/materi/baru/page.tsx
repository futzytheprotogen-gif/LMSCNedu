"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const WARNA_PRIMARY = "#2196f3";

export default function HalamanUploadMateri() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kelasId = searchParams.get("kelasId");

  const [judul, setJudul] = useState("");
  const [tipe, setTipe] = useState<"LINK" | "PDF">("LINK");
  const [link, setLink] = useState("");
  const [fileTerpilih, setFileTerpilih] = useState<File | null>(null);
  const [sedangUpload, setSedangUpload] = useState(false);
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPesanError(null);

    if (!kelasId) {
      setPesanError("Kelas tujuan tidak diketahui — buka halaman ini dari detail kelas.");
      return;
    }
    if (!judul.trim()) {
      setPesanError("Judul wajib diisi");
      return;
    }
    if (tipe === "LINK" && !link.trim()) {
      setPesanError("Link wajib diisi");
      return;
    }
    if (tipe === "PDF" && !fileTerpilih) {
      setPesanError("Pilih file PDF dulu");
      return;
    }

    setSedangSimpan(true);
    let urlAkhir = link;

    try {
      if (tipe === "PDF" && fileTerpilih) {
        setSedangUpload(true);
        const formData = new FormData();
        formData.append("file", fileTerpilih);
        formData.append("folder", "materi");
        const responseUpload = await fetch("/api/upload", { method: "POST", body: formData });
        const dataUpload = await responseUpload.json();
        setSedangUpload(false);
        if (!responseUpload.ok) {
          setPesanError(dataUpload.pesan ?? "Gagal upload file");
          setSedangSimpan(false);
          return;
        }
        urlAkhir = dataUpload.url;
      }

      const response = await fetch("/api/materi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kelasId, judul: judul.trim(), tipe, url: urlAkhir }),
      });
      const data = await response.json();

      if (!response.ok) {
        setPesanError(data.pesan ?? "Gagal menyimpan materi");
        return;
      }

      router.push(`/guru/kelas/${kelasId}`);
    } catch {
      setPesanError("Tidak bisa terhubung ke server, coba lagi.");
    } finally {
      setSedangSimpan(false);
      setSedangUpload(false);
    }
  }

  return (
    <div style={estilo.halaman}>
      <h1 style={estilo.judulHalaman}>Upload Materi</h1>
      {kelasId ? (
        <p style={estilo.catatanKelas}>Materi ini akan langsung muncul di kelas yang tadi kamu buka.</p>
      ) : (
        <p style={estilo.pesan_error}>
          Kelas tujuan tidak diketahui. Buka halaman ini lewat tombol &quot;Upload Materi&quot; di
          halaman detail kelas, bukan lewat URL langsung.
        </p>
      )}

      <form onSubmit={handleSubmit} style={estilo.form}>
        <label style={estilo.label}>
          Judul Materi
          <input
            type="text"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            style={estilo.input}
          />
        </label>

        <div style={estilo.baris_tab}>
          {(["LINK", "PDF"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipe(t)}
              style={{ ...estilo.tabKecil, ...(tipe === t ? estilo.tabKecilAktif : {}) }}
            >
              {t === "LINK" ? "Link" : "Upload PDF"}
            </button>
          ))}
        </div>

        {tipe === "LINK" ? (
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            style={estilo.input}
          />
        ) : (
          <div>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFileTerpilih(e.target.files?.[0] ?? null)}
            />
            {fileTerpilih && <p style={estilo.namaFile}>{fileTerpilih.name}</p>}
          </div>
        )}

        {pesanError && <p style={estilo.pesan_error}>{pesanError}</p>}

        <button type="submit" disabled={sedangSimpan || !kelasId} style={estilo.tombol}>
          {sedangUpload ? "Mengupload file..." : sedangSimpan ? "Menyimpan..." : "Upload Materi"}
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
  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    color: "#000000",
    outline: "none",
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
  pesan_error: { color: "#dc2626", fontSize: "13px", margin: "0 0 8px 0" },
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