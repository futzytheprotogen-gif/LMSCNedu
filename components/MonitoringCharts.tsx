"use client";

import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./MonitoringCharts.module.css";

export interface DataGrafik {
  label: string;
  nilai: number | null;
  warna?: string;
}

interface MonitoringChartsProps {
  judul: string;
  deskripsi: string;
  dataDonat: DataGrafik[];
  judulDonat: string;
  satuanDonat: string;
  dataPai: DataGrafik[];
  judulPai: string;
  satuanPai: string;
  dataTren: DataGrafik[];
  judulTren: string;
  satuanTren: string;
}

const WARNA_GRAFIK = ["#2563eb", "#0f766e", "#f59e0b", "#8b5cf6", "#ec4899", "#dc2626"];

function formatAngka(nilai: number) {
  return nilai.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

function KartuGrafik({ judul, catatan, anak }: { judul: string; catatan: string; anak: React.ReactNode }) {
  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <h3>{judul}</h3>
        <span>{catatan}</span>
      </header>
      {anak}
    </article>
  );
}

function Legenda({ data, satuan }: { data: DataGrafik[]; satuan: string }) {
  return (
    <ul className={styles.legend}>
      {data.map((item, indeks) => (
        <li key={item.label}>
          <span style={{ backgroundColor: item.warna ?? WARNA_GRAFIK[indeks % WARNA_GRAFIK.length] }} />
          <span className={styles.legendLabel}>{item.label}</span>
          <strong>{formatAngka(item.nilai ?? 0)} <small>{satuan}</small></strong>
        </li>
      ))}
    </ul>
  );
}

function KosongGrafik({ pesan }: { pesan: string }) {
  return <div className={styles.empty}><span aria-hidden="true">◌</span><p>{pesan}</p></div>;
}

export default function MonitoringCharts({
  judul,
  deskripsi,
  dataDonat,
  judulDonat,
  satuanDonat,
  dataPai,
  judulPai,
  satuanPai,
  dataTren,
  judulTren,
  satuanTren,
}: MonitoringChartsProps) {
  const totalDonat = dataDonat.reduce((jumlah, item) => jumlah + (item.nilai ?? 0), 0);
  const totalPai = dataPai.reduce((jumlah, item) => jumlah + (item.nilai ?? 0), 0);
  const trenTersedia = dataTren.some((item) => item.nilai !== null);

  return (
    <section className={styles.section} aria-label={judul}>
      <header className={styles.sectionHeader}>
        <div><span>PEMANTAUAN</span><h2>{judul}</h2></div>
        <p>{deskripsi}</p>
      </header>
      <div className={styles.grid}>
        <KartuGrafik judul={judulDonat} catatan="Proporsi" anak={totalDonat ? (
          <>
            <div className={styles.donutWrap}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dataDonat} dataKey="nilai" nameKey="label" innerRadius="64%" outerRadius="88%" paddingAngle={2} stroke="none">
                    {dataDonat.map((item, indeks) => (
                      <Cell key={item.label} fill={item.warna ?? WARNA_GRAFIK[indeks % WARNA_GRAFIK.length]} stroke="var(--cn-surface)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(nilai) => [`${formatAngka(Number(nilai))} ${satuanDonat}`, "Jumlah"]} contentStyle={{ border: "1px solid var(--cn-line)", borderRadius: 8, fontSize: 11, backgroundColor: "var(--cn-surface)", color: "var(--cn-text)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.donutCenter}><strong>{formatAngka(totalDonat)}</strong><span>{satuanDonat}</span></div>
            </div>
            <Legenda data={dataDonat} satuan={satuanDonat} />
          </>
        ) : <KosongGrafik pesan="Belum ada data untuk dihitung." />} />

        <KartuGrafik judul={judulPai} catatan="Distribusi" anak={totalPai ? (
          <>
            <div className={styles.pieWrap}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dataPai} dataKey="nilai" nameKey="label" outerRadius="82%" paddingAngle={2} stroke="none">
                    {dataPai.map((item, indeks) => (
                      <Cell key={item.label} fill={item.warna ?? WARNA_GRAFIK[indeks % WARNA_GRAFIK.length]} stroke="var(--cn-surface)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(nilai) => [`${formatAngka(Number(nilai))} ${satuanPai}`, "Jumlah"]} contentStyle={{ border: "1px solid var(--cn-line)", borderRadius: 8, fontSize: 11, backgroundColor: "var(--cn-surface)", color: "var(--cn-text)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <Legenda data={dataPai} satuan={satuanPai} />
          </>
        ) : <KosongGrafik pesan="Belum ada kategori untuk ditampilkan." />} />

        <KartuGrafik judul={judulTren} catatan="Tren" anak={trenTersedia ? (
          <div className={styles.lineWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataTren} margin={{ top: 10, right: 8, bottom: 0, left: -14 }}>
                <CartesianGrid stroke="var(--cn-line)" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--cn-muted)", fontSize: 9 }} dy={7} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--cn-muted)", fontSize: 9 }} width={34} />
                <Tooltip formatter={(nilai) => [`${formatAngka(Number(nilai))} ${satuanTren}`, "Rata-rata"]} contentStyle={{ border: "1px solid var(--cn-line)", borderRadius: 8, fontSize: 11, backgroundColor: "var(--cn-surface)", color: "var(--cn-text)" }} />
                <Line dataKey="nilai" type="monotone" stroke="var(--cn-primary)" strokeWidth={2.5} connectNulls={false} dot={{ r: 3, fill: "var(--cn-surface)", stroke: "var(--cn-primary)", strokeWidth: 2 }} activeDot={{ r: 5, fill: "var(--cn-primary)", stroke: "var(--cn-surface)", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <KosongGrafik pesan="Tren tampil setelah data pemantauan tersedia." />} />
      </div>
    </section>
  );
}