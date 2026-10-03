"use client";

import { useMemo } from "react";
import MonitoringCharts, { type DataGrafik } from "@/components/MonitoringCharts";

interface KelasPemantauan {
  id: string;
  judul: string;
  jumlahSiswa: number;
  createdAt?: string;
}

const WARNA_KATEGORI = ["#f97316", "#0f766e", "#f59e0b", "#2563eb"];

function buatRentangBulan(daftarKelas: KelasPemantauan[]) {
  const bulanIni = new Date();
  bulanIni.setDate(1);
  const rentang = Array.from({ length: 6 }, (_, indeks) => {
    const tanggal = new Date(bulanIni.getFullYear(), bulanIni.getMonth() - 5 + indeks, 1);
    return {
      kunci: `${tanggal.getFullYear()}-${String(tanggal.getMonth() + 1).padStart(2, "0")}`,
      label: tanggal.toLocaleDateString("id-ID", { month: "short" }),
      nilai: 0,
    };
  });
  const posisiBulan = new Map(rentang.map((item, indeks) => [item.kunci, indeks]));

  for (const kelas of daftarKelas) {
    if (!kelas.createdAt) continue;
    const tanggal = new Date(kelas.createdAt);
    if (Number.isNaN(tanggal.getTime())) continue;
    const kunci = `${tanggal.getFullYear()}-${String(tanggal.getMonth() + 1).padStart(2, "0")}`;
    const posisi = posisiBulan.get(kunci);
    if (posisi !== undefined) rentang[posisi].nilai += 1;
  }

  return rentang.map(({ label, nilai }) => ({ label, nilai }));
}

export default function ClassMonitoringCharts({ daftarKelas, peran }: { daftarKelas: KelasPemantauan[]; peran: string }) {
  const dataDonat = useMemo(() => {
    const terurut = [...daftarKelas].sort((a, b) => b.jumlahSiswa - a.jumlahSiswa);
    const utama = terurut.slice(0, 5).map((kelas, indeks) => ({
      label: kelas.judul,
      nilai: kelas.jumlahSiswa,
      warna: ["#2563eb", "#0f766e", "#8b5cf6", "#f59e0b", "#ec4899"][indeks],
    }));
    const siswaLain = terurut.slice(5).reduce((total, kelas) => total + kelas.jumlahSiswa, 0);
    return siswaLain > 0 ? [...utama, { label: "Kelas lainnya", nilai: siswaLain, warna: "#dc2626" }] : utama;
  }, [daftarKelas]);

  const dataPai = useMemo((): DataGrafik[] => {
    const kategori = [
      { label: "Belum ada siswa", warna: WARNA_KATEGORI[0], cocok: (jumlah: number) => jumlah === 0 },
      { label: "1–9 siswa", warna: WARNA_KATEGORI[1], cocok: (jumlah: number) => jumlah >= 1 && jumlah <= 9 },
      { label: "10–24 siswa", warna: WARNA_KATEGORI[2], cocok: (jumlah: number) => jumlah >= 10 && jumlah <= 24 },
      { label: "25+ siswa", warna: WARNA_KATEGORI[3], cocok: (jumlah: number) => jumlah >= 25 },
    ];
    return kategori.map((item) => ({
      label: item.label,
      nilai: daftarKelas.filter((kelas) => item.cocok(kelas.jumlahSiswa)).length,
      warna: item.warna,
    })).filter((item) => item.nilai > 0);
  }, [daftarKelas]);

  const dataTren = useMemo(() => buatRentangBulan(daftarKelas), [daftarKelas]);

  return (
    <MonitoringCharts
      judul={`Pemantauan kelas ${peran}`}
      deskripsi="Sebaran siswa, ukuran kelas, dan pertumbuhan kelas dalam enam bulan terakhir."
      dataDonat={dataDonat}
      judulDonat="Sebaran siswa per kelas"
      satuanDonat="siswa"
      dataPai={dataPai}
      judulPai="Komposisi ukuran kelas"
      satuanPai="kelas"
      dataTren={dataTren}
      judulTren="Pertumbuhan kelas"
      satuanTren="kelas baru"
    />
  );
}