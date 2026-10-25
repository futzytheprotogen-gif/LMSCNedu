import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/lib/db";
import BrandMark from "@/components/BrandMark";
import styles from "./page.module.css";

export default async function MaintenancePage() {
  await connection();
  const pengaturan = await db.systemSetting.findUnique({
    where: { key: "maintenance.message" },
    select: { value: true },
  });

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.brand}><BrandMark /> CN EDU <small>SERVICE NOTICE</small></div>
        <div className={styles.status}><i /> PEMELIHARAAN SEMENTARA</div>
        <h1>Akses layanan sedang dibatasi.</h1>
        <p>{pengaturan?.value || "CN Edu sedang dalam pemeliharaan. Silakan kembali beberapa saat lagi."}</p>
        <div className={styles.note}><span>DATA AMAN</span><p>Akun, kelas, nilai, dan data pembelajaran tetap tersimpan. Akses akan dibuka kembali oleh administrator.</p></div>
        <Link href="/login">Kembali ke halaman masuk <b>↗</b></Link>
      </section>
    </main>
  );
}
