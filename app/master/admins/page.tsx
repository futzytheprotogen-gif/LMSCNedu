"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import styles from "./page.module.css";

type RoleKelola = "ADMIN" | "KEPSEK" | "KURIKULUM" | "MASTER_ADMIN";
type RoleBawahan = Exclude<RoleKelola, "MASTER_ADMIN">;

interface AkunAdmin {
  id: string;
  email: string;
  nama: string;
  role: RoleKelola;
  createdAt: string;
}

const LABEL_ROLE: Record<RoleKelola, string> = {
  MASTER_ADMIN: "Master Admin",
  ADMIN: "Admin",
  KEPSEK: "Kepala Sekolah",
  KURIKULUM: "Kurikulum",
};

export default function KelolaAdministrator() {
  const [akun, setAkun] = useState<AkunAdmin[]>([]);
  const [roleDraft, setRoleDraft] = useState<Record<string, RoleBawahan>>({});
  const [memuat, setMemuat] = useState(true);
  const [sedangProses, setSedangProses] = useState<string | null>(null);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [pesanSukses, setPesanSukses] = useState<string | null>(null);
  const [pencarian, setPencarian] = useState("");
  const [formTerbuka, setFormTerbuka] = useState(false);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleBaru, setRoleBaru] = useState<RoleBawahan>("ADMIN");

  const muatAkun = useCallback(async () => {
    setMemuat(true);
    setPesanError(null);
    try {
      const response = await fetch("/api/master/admins", { cache: "no-store" });
      const hasil = await response.json();
      if (!response.ok) throw new Error(hasil.pesan ?? "Daftar administrator gagal dimuat.");
      const daftar = hasil.data as AkunAdmin[];
      setAkun(daftar);
      const draft: Record<string, RoleBawahan> = {};
      for (const item of daftar) {
        if (item.role !== "MASTER_ADMIN") draft[item.id] = item.role;
      }
      setRoleDraft(draft);
    } catch (error) {
      setPesanError(error instanceof Error ? error.message : "Terjadi kesalahan saat memuat akun.");
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void muatAkun(); }, 0);
    return () => window.clearTimeout(timer);
  }, [muatAkun]);

  const akunTerfilter = useMemo(() => {
    const kata = pencarian.trim().toLowerCase();
    return akun.filter((item) =>
      !kata || `${item.nama} ${item.email} ${LABEL_ROLE[item.role]}`.toLowerCase().includes(kata)
    );
  }, [akun, pencarian]);

  async function buatAkun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSedangProses("create");
    setPesanError(null);
    setPesanSukses(null);
    try {
      const response = await fetch("/api/master/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, email, password, role: roleBaru }),
      });
      const hasil = await response.json();
      if (!response.ok) throw new Error(hasil.pesan ?? "Akun gagal dibuat.");
      setNama("");
      setEmail("");
      setPassword("");
      setFormTerbuka(false);
      setPesanSukses("Akun administrator berhasil dibuat. Minta pemilik akun mengganti password secara berkala.");
      await muatAkun();
    } catch (error) {
      setPesanError(error instanceof Error ? error.message : "Terjadi kesalahan saat membuat akun.");
    } finally {
      setSedangProses(null);
    }
  }

  async function simpanRole(item: AkunAdmin) {
    const role = roleDraft[item.id];
    if (!role || role === item.role) return;
    setSedangProses(item.id);
    setPesanError(null);
    setPesanSukses(null);
    try {
      const response = await fetch(`/api/master/admins/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const hasil = await response.json();
      if (!response.ok) throw new Error(hasil.pesan ?? "Role administrator gagal diubah.");
      setPesanSukses(`Hak akses ${item.nama} diperbarui menjadi ${LABEL_ROLE[role]}.`);
      await muatAkun();
    } catch (error) {
      setPesanError(error instanceof Error ? error.message : "Terjadi kesalahan saat mengubah role.");
    } finally {
      setSedangProses(null);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>MASTER CONTROL <span>/</span> ADMINISTRATOR</div>
          <h1>Akses administrator</h1>
          <p>Kelola akses admin, kepala sekolah, dan kurikulum. Akun Master Admin dilindungi dari perubahan di panel ini.</p>
        </div>
        <button className={styles.createButton} onClick={() => setFormTerbuka((terbuka) => !terbuka)} type="button">
          {formTerbuka ? "Tutup formulir" : "+ Administrator"}
        </button>
      </header>

      {pesanError && <div className={styles.alertError} role="alert">{pesanError}</div>}
      {pesanSukses && <div className={styles.alertSuccess} role="status">{pesanSukses}</div>}

      {formTerbuka && (
        <form className={styles.createForm} onSubmit={(event) => void buatAkun(event)}>
          <div className={styles.formHeading}><div><span>01 / NEW ACCOUNT</span><h2>Buat akun administrator</h2></div><span>Password minimal 12 karakter</span></div>
          <div className={styles.formGrid}>
            <label>Nama lengkap<input autoComplete="name" onChange={(event) => setNama(event.target.value)} required value={nama} /></label>
            <label>Email login<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
            <label>Role<select onChange={(event) => setRoleBaru(event.target.value as RoleBawahan)} value={roleBaru}><option value="ADMIN">Admin</option><option value="KEPSEK">Kepala Sekolah</option><option value="KURIKULUM">Kurikulum</option></select></label>
            <label>Password awal<input autoComplete="new-password" minLength={12} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
          </div>
          <div className={styles.formActions}><button className={styles.cancelButton} onClick={() => setFormTerbuka(false)} type="button">Batal</button><button className={styles.saveButton} disabled={sedangProses === "create"} type="submit">{sedangProses === "create" ? "Membuat..." : "Buat akun"}</button></div>
        </form>
      )}

      <section className={styles.accountPanel}>
        <div className={styles.listTop}>
          <div><span>02 / ACCESS DIRECTORY</span><h2>Daftar administrator <b>{akun.length}</b></h2></div>
          <label className={styles.search}><span aria-hidden="true">⌕</span><input onChange={(event) => setPencarian(event.target.value)} placeholder="Cari nama, email, atau role" value={pencarian} /></label>
        </div>
        {memuat ? <div className={styles.empty}>Memuat akun administrator…</div> : akunTerfilter.length ? (
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th>Administrator</th><th>Role</th><th>Dibuat</th><th>Aksi</th></tr></thead>
              <tbody>
                {akunTerfilter.map((item) => {
                  const master = item.role === "MASTER_ADMIN";
                  return (
                    <tr key={item.id}>
                      <td><div className={styles.identity}><span className={`${styles.avatar} ${master ? styles.masterAvatar : ""}`}>{item.nama.charAt(0).toUpperCase()}</span><div><strong>{item.nama}</strong><small>{item.email}</small></div></div></td>
                      <td>
                        {master ? <span className={styles.masterRole}>◆ {LABEL_ROLE[item.role]}</span> : (
                          <select aria-label={`Role untuk ${item.nama}`} className={styles.roleSelect} disabled={sedangProses === item.id} onChange={(event) => setRoleDraft((current) => ({ ...current, [item.id]: event.target.value as RoleBawahan }))} value={roleDraft[item.id] ?? item.role}>
                            <option value="ADMIN">Admin</option><option value="KEPSEK">Kepala Sekolah</option><option value="KURIKULUM">Kurikulum</option>
                          </select>
                        )}
                      </td>
                      <td className={styles.date}>{new Date(item.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}</td>
                      <td><div className={styles.rowActions}>
                        {!master && <button className={styles.updateButton} disabled={sedangProses === item.id || roleDraft[item.id] === item.role} onClick={() => void simpanRole(item)} type="button">{sedangProses === item.id ? "..." : "Simpan role"}</button>}
                        {master && <span className={styles.protected}>TERKUNCI</span>}
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <div className={styles.empty}>Tidak ada administrator yang cocok.</div>}
        <p className={styles.footnote}>Setiap pembuatan dan perubahan role dicatat dalam Jejak Keamanan. Akun Master Admin dikelola melalui environment dan tidak dapat diubah dari konsol ini.</p>
      </section>
    </div>
  );
}
