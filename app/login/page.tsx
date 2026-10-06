"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

type TipeAkun = "ADMIN" | "GURU" | "SISWA";

const KONFIGURASI_PORTAL: Record<
  TipeAkun,
  {
    labelTab: string;
    labelIdentifier: string;
    placeholder: string;
    description: string;
  }
> = {
  ADMIN: {
    labelTab: "Admin",
    labelIdentifier: "Email",
    placeholder: "nama@cnedu.sch.id",
    description: "Masuk sebagai administrator",
  },
  GURU: {
    labelTab: "Guru",
    labelIdentifier: "NIK",
    placeholder: "Masukkan NIK",
    description: "Masuk ke portal guru",
  },
  SISWA: {
    labelTab: "Siswa",
    labelIdentifier: "NIS",
    placeholder: "Masukkan NIS",
    description: "Masuk ke ruang belajar",
  },
};

const WARNA_PRIMARY = "var(--cn-primary)";

export default function HalamanLogin() {
  const router = useRouter();

  const [tipeAkun, setTipeAkun] = useState<TipeAkun>("SISWA");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [lihatPassword, setLihatPassword] = useState(false);
  const [sedangProses, setSedangProses] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  const konfigAktif = KONFIGURASI_PORTAL[tipeAkun];

  function pindahTab(tab: TipeAkun) {
    if (sedangProses) return;

    setTipeAkun(tab);
    setIdentifier("");
    setPassword("");
    setPesanError(null);
    setLihatPassword(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (sedangProses) return;

    setPesanError(null);
    setSedangProses(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipeAkun,
          identifier,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPesanError(data.pesan ?? "Gagal login, coba lagi.");
        return;
      }

      router.push(data.redirect);
      router.refresh();
    } catch {
      setPesanError(
        "Tidak bisa terhubung ke server. Silakan coba lagi."
      );
    } finally {
      setSedangProses(false);
    }
  }

  return (
    <main className={styles.halaman} style={estilo.halaman}>
      {/* Decorative background */}
      <div style={estilo.backgroundGlow1} />
      <div style={estilo.backgroundGlow2} />

      <div className={styles.wrapper} style={estilo.wrapper}>
        {/* LEFT SIDE */}
        <section className={styles.panelKiri} style={estilo.panelKiri}>
          <div style={estilo.logoArea}>
            <div style={estilo.logo}>
              CN
            </div>

            <div>
              <strong style={estilo.logoText}>
                CN Edu
              </strong>

              <span style={estilo.logoSubtext}>
                Learning Management System
              </span>
            </div>
          </div>

          <div className={styles.heroContent} style={estilo.heroContent}>
            <span style={estilo.heroBadge}>
              ✦ DIGITAL LEARNING PLATFORM
            </span>

            <h1 className={styles.heroTitle} style={estilo.heroTitle}>
              Belajar.
              <br />
              Berkembang.
              <br />
              <span style={estilo.heroBlue}>
                Bersama.
              </span>
            </h1>

            <p className={styles.heroDescription} style={estilo.heroDescription}>
              Satu ruang digital untuk menghubungkan
              siswa, guru, dan pengelolaan pembelajaran
              di lingkungan Citra Negara.
            </p>
          </div>

          {/* Decorative visual */}
          <div className={styles.visual} style={estilo.visual}>
            <div style={estilo.visualCircleLarge} />
            <div style={estilo.visualCircleSmall} />

            <div style={estilo.floatingCard1}>
              <div style={estilo.miniIconBlue}>✓</div>
              <div>
                <span style={estilo.floatingLabel}>
                  Pembelajaran
                </span>
                <strong style={estilo.floatingValue}>
                  Lebih terarah
                </strong>
              </div>
            </div>

            <div style={estilo.floatingCard2}>
              <div style={estilo.miniIconGreen}>↗</div>
              <div>
                <span style={estilo.floatingLabel}>
                  Aktivitas
                </span>
                <strong style={estilo.floatingValue}>
                  Terpantau
                </strong>
              </div>
            </div>
          </div>

          <div className={styles.footerKiri} style={estilo.footerKiri}>
            © {new Date().getFullYear()} CN Edu
          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className={styles.panelKanan} style={estilo.panelKanan}>
          <div style={estilo.formContainer}>
            <Link className={styles.backLink} href="/">
              <span aria-hidden="true">←</span> Kembali ke Beranda
            </Link>
            <div style={estilo.formHeader}>
              <span style={estilo.smallTitle}>
                WELCOME BACK
              </span>

              <h2 style={estilo.judul}>
                Selamat datang 👋
              </h2>

              <p style={estilo.subtitle}>
                Masuk untuk melanjutkan ke CN Edu.
              </p>
            </div>

            {/* ACCOUNT TYPE */}
            <div style={estilo.roleWrapper}>
              <span style={estilo.roleLabel}>
                Masuk sebagai
              </span>

              <div className={styles.barisTab} style={estilo.barisTab}>
                {(Object.keys(
                  KONFIGURASI_PORTAL
                ) as TipeAkun[]).map((tab) => {
                  const aktif = tipeAkun === tab;

                  return (
                    <button
                      key={tab}
                      className={styles.tab}
                      type="button"
                      onClick={() => pindahTab(tab)}
                      disabled={sedangProses}
                      style={{
                        ...estilo.tab,
                        ...(aktif ? estilo.tabAktif : {}),
                      }}
                    >
                      <span
                        style={{
                          ...estilo.tabIcon,
                          ...(aktif
                            ? estilo.tabIconAktif
                            : {}),
                        }}
                      >
                        {tab === "ADMIN"
                          ? "⌂"
                          : tab === "GURU"
                            ? "♟"
                            : "♙"}
                      </span>

                      {KONFIGURASI_PORTAL[tab].labelTab}
                    </button>
                  );
                })}
              </div>

              <div style={estilo.roleDescription}>
                <span style={estilo.statusDot} />
                {konfigAktif.description}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              style={estilo.form}
            >
              {/* IDENTIFIER */}
              <label style={estilo.label}>
                <span style={estilo.labelText}>
                  {konfigAktif.labelIdentifier}
                </span>

                <div style={estilo.inputWrapper}>
                  <span style={estilo.inputIcon}>
                    {tipeAkun === "ADMIN"
                      ? "✉"
                      : "#"}
                  </span>

                  <input
                    type={
                      tipeAkun === "ADMIN"
                        ? "email"
                        : "text"
                    }
                    inputMode={
                      tipeAkun === "ADMIN"
                        ? "email"
                        : "numeric"
                    }
                    value={identifier}
                    onChange={(e) =>
                      setIdentifier(e.target.value)
                    }
                    placeholder={
                      konfigAktif.placeholder
                    }
                    required
                    disabled={sedangProses}
                    autoComplete="username"
                    style={estilo.input}
                  />
                </div>
              </label>

              {/* PASSWORD */}
              <label style={estilo.label}>
                <span style={estilo.labelText}>
                  Password
                </span>

                <div style={estilo.inputWrapper}>
                  <span style={estilo.inputIcon}>
                    ●
                  </span>

                  <input
                    type={
                      lihatPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Masukkan password"
                    required
                    disabled={sedangProses}
                    autoComplete="current-password"
                    style={estilo.input}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setLihatPassword(
                        (value) => !value
                      )
                    }
                    disabled={sedangProses}
                    style={estilo.passwordToggle}
                    aria-label={
                      lihatPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                  >
                    {lihatPassword ? "◉" : "○"}
                  </button>
                </div>
              </label>

              {/* ERROR */}
              {pesanError && (
                <div style={estilo.errorBox}>
                  <div style={estilo.errorIcon}>
                    !
                  </div>

                  <div>
                    <strong
                      style={estilo.errorTitle}
                    >
                      Login gagal
                    </strong>

                    <p style={estilo.errorText}>
                      {pesanError}
                    </p>
                  </div>
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={sedangProses}
                style={{
                  ...estilo.tombol,
                  ...(sedangProses
                    ? estilo.tombolLoading
                    : {}),
                }}
              >
                {sedangProses ? (
                  <>
                    <span style={estilo.spinner} />
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk ke CN Edu
                    <span style={estilo.arrow}>
                      →
                    </span>
                  </>
                )}
              </button>

              {/* FORGOT PASSWORD */}
              {tipeAkun !== "ADMIN" && (
                <div style={estilo.lupaWrapper}>
                  <span style={estilo.lupaText}>
                    Mengalami masalah dengan akun?
                  </span>

                  <a
                    href="/login/lupa-password"
                    style={estilo.linkLupa}
                  >
                    Lupa password?
                  </a>
                </div>
              )}
            </form>

            <div style={estilo.securityInfo}>
              <span style={estilo.lockIcon}>⌑</span>
              <span>
                Sistem login aman dan terlindungi
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   INLINE STYLE
========================================================= */

const estilo = {
  halaman: {
    minHeight: "100vh",
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background:
      "linear-gradient(135deg, var(--cn-tint) 0%, var(--cn-surface) 55%, var(--cn-coral-tint) 100%)",
    overflow: "hidden" as const,
    fontFamily: "inherit",
  },

  backgroundGlow1: {
    position: "absolute" as const,
    width: "420px",
    height: "420px",
    borderRadius: "50%",
    background:
      "rgba(var(--cn-primary-rgb), 0.08)",
    top: "-180px",
    right: "-100px",
    filter: "blur(2px)",
  },

  backgroundGlow2: {
    position: "absolute" as const,
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background:
      "rgba(var(--cn-coral-rgb), 0.08)",
    bottom: "-130px",
    left: "-100px",
  },

  wrapper: {
    position: "relative" as const,
    zIndex: 1,
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 0.95fr) minmax(430px, 1.05fr)",
    width: "100%",
    maxWidth: "1050px",
    minHeight: "650px",
    overflow: "hidden" as const,
    borderRadius: "26px",
    backgroundColor: "var(--cn-surface)",
    border: "1px solid var(--cn-tint)",
    boxShadow:
      "0 25px 70px rgba(var(--cn-navy-rgb), 0.10)",
  },

  /* LEFT */

  panelKiri: {
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
    padding: "38px",
    overflow: "hidden" as const,
    background:
      "linear-gradient(145deg, var(--cn-tint) 0%, var(--cn-coral-tint) 100%)",
    borderRight: "1px solid var(--cn-tint)",
  },

  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    position: "relative" as const,
    zIndex: 3,
  },

  logo: {
    width: "39px",
    height: "39px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "11px",
    backgroundColor: WARNA_PRIMARY,
    color: "var(--cn-surface)",
    fontSize: "14px",
    fontWeight: 800,
    boxShadow:
      "0 7px 18px rgba(var(--cn-primary-rgb), 0.25)",
  },

  logoText: {
    display: "block",
    fontSize: "16px",
    color: "var(--cn-navy)",
    lineHeight: 1.1,
  },

  logoSubtext: {
    display: "block",
    marginTop: "3px",
    fontSize: "9px",
    color: "var(--cn-coral)",
    letterSpacing: "0.1px",
  },

  heroContent: {
    position: "relative" as const,
    zIndex: 2,
    marginTop: "100px",
  },

  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 9px",
    borderRadius: "6px",
    backgroundColor: "var(--cn-surface)",
    border: "1px solid var(--cn-tint)",
    color: WARNA_PRIMARY,
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  heroTitle: {
    margin: "19px 0 0",
    color: "var(--cn-navy)",
    fontSize: "39px",
    lineHeight: 1.12,
    letterSpacing: "-1.5px",
    fontWeight: 800,
  },

  heroBlue: {
    color: WARNA_PRIMARY,
  },

  heroDescription: {
    maxWidth: "370px",
    marginTop: "18px",
    color: "var(--cn-text)",
    fontSize: "13px",
    lineHeight: 1.75,
  },

  visual: {
    position: "absolute" as const,
    right: "-40px",
    bottom: "45px",
    width: "360px",
    height: "180px",
  },

  visualCircleLarge: {
    position: "absolute" as const,
    right: "10px",
    bottom: "-50px",
    width: "230px",
    height: "230px",
    borderRadius: "50%",
    border: "34px solid rgba(var(--cn-primary-rgb), 0.08)",
  },

  visualCircleSmall: {
    position: "absolute" as const,
    right: "145px",
    bottom: "20px",
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    background:
      "rgba(var(--cn-coral-rgb), 0.14)",
  },

  floatingCard1: {
    position: "absolute" as const,
    top: "10px",
    left: "10px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px 14px",
    borderRadius: "11px",
    backgroundColor: "var(--cn-surface)",
    border: "1px solid var(--cn-tint)",
    boxShadow:
      "0 10px 25px rgba(var(--cn-primary-rgb), 0.08)",
  },

  floatingCard2: {
    position: "absolute" as const,
    right: "20px",
    top: "68px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px 14px",
    borderRadius: "11px",
    backgroundColor: "var(--cn-surface)",
    border: "1px solid var(--cn-tint)",
    boxShadow:
      "0 10px 25px rgba(var(--cn-primary-rgb), 0.08)",
  },

  miniIconBlue: {
    width: "29px",
    height: "29px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    backgroundColor: "var(--cn-tint)",
    color: WARNA_PRIMARY,
    fontWeight: 800,
    fontSize: "13px",
  },

  miniIconGreen: {
    width: "29px",
    height: "29px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    backgroundColor: "var(--cn-success-tint)",
    color: "var(--cn-success)",
    fontWeight: 800,
    fontSize: "13px",
  },

  floatingLabel: {
    display: "block",
    color: "var(--cn-muted)",
    fontSize: "8px",
    marginBottom: "2px",
  },

  floatingValue: {
    display: "block",
    color: "var(--cn-coral-dark)",
    fontSize: "10px",
    fontWeight: 750,
  },

  footerKiri: {
    position: "absolute" as const,
    bottom: "24px",
    left: "38px",
    color: "var(--cn-coral)",
    fontSize: "9px",
  },

  /* RIGHT */

  panelKanan: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "50px 55px",
    backgroundColor: "var(--cn-surface)",
  },

  formContainer: {
    width: "100%",
    maxWidth: "400px",
  },

  formHeader: {
    marginBottom: "27px",
  },

  smallTitle: {
    display: "block",
    marginBottom: "8px",
    color: WARNA_PRIMARY,
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "1.5px",
  },

  judul: {
    margin: 0,
    color: "var(--cn-navy)",
    fontSize: "27px",
    fontWeight: 800,
    letterSpacing: "-0.7px",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "var(--cn-muted)",
    fontSize: "12px",
  },

  roleWrapper: {
    marginBottom: "23px",
  },

  roleLabel: {
    display: "block",
    marginBottom: "8px",
    color: "var(--cn-coral)",
    fontSize: "11px",
    fontWeight: 700,
  },

  barisTab: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "5px",
    padding: "4px",
    borderRadius: "11px",
    backgroundColor: "var(--cn-coral-tint)",
    border: "1px solid var(--cn-coral-tint)",
  },

  tab: {
    minHeight: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "transparent",
    color: "var(--cn-text)",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    transition:
      "all 0.2s ease",
  },

  tabAktif: {
    backgroundColor: "var(--cn-surface)",
    color: WARNA_PRIMARY,
    boxShadow:
      "0 3px 10px rgba(var(--cn-primary-rgb), 0.08)",
  },

  tabIcon: {
    width: "21px",
    height: "21px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
    backgroundColor: "var(--cn-coral-tint)",
    color: "var(--cn-text)",
    fontSize: "9px",
    fontWeight: 800,
  },

  tabIconAktif: {
    backgroundColor: "var(--cn-tint)",
    color: WARNA_PRIMARY,
  },

  roleDescription: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "8px",
    color: "var(--cn-muted)",
    fontSize: "10px",
  },

  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "var(--cn-success)",
  },

  /* FORM */

  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "17px",
  },

  label: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
  },

  labelText: {
    color: "var(--cn-coral)",
    fontSize: "11px",
    fontWeight: 700,
  },

  inputWrapper: {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
  },

  inputIcon: {
    position: "absolute" as const,
    left: "13px",
    zIndex: 2,
    color: "var(--cn-coral)",
    fontSize: "11px",
    fontWeight: 800,
    pointerEvents: "none" as const,
  },

  input: {
    width: "100%",
    height: "45px",
    boxSizing: "border-box" as const,
    padding: "0 42px",
    borderRadius: "9px",
    border: "1px solid var(--cn-coral-tint)",
    outline: "none",
    backgroundColor: "var(--cn-surface)",
    color: "var(--cn-coral-dark)",
    fontSize: "12px",
    transition:
      "border-color 0.2s ease, box-shadow 0.2s ease",
  },

  passwordToggle: {
    position: "absolute" as const,
    right: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    border: "none",
    borderRadius: "7px",
    backgroundColor: "transparent",
    color: "var(--cn-coral)",
    fontSize: "13px",
    cursor: "pointer",
  },

  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    padding: "11px",
    borderRadius: "9px",
    border: "1px solid var(--cn-danger-tint)",
    backgroundColor: "var(--cn-danger-tint)",
  },

  errorIcon: {
    width: "19px",
    height: "19px",
    flex: "0 0 19px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    backgroundColor: "var(--cn-danger)",
    color: "var(--cn-surface)",
    fontSize: "10px",
    fontWeight: 800,
  },

  errorTitle: {
    display: "block",
    color: "var(--cn-danger)",
    fontSize: "10px",
    marginBottom: "2px",
  },

  errorText: {
    margin: 0,
    color: "var(--cn-danger)",
    fontSize: "10px",
    lineHeight: 1.45,
  },

  tombol: {
    width: "100%",
    height: "46px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    marginTop: "2px",
    border: "none",
    borderRadius: "9px",
    backgroundColor: WARNA_PRIMARY,
    color: "var(--cn-surface)",
    fontSize: "12px",
    fontWeight: 750,
    cursor: "pointer",
    boxShadow:
      "0 7px 18px rgba(var(--cn-primary-rgb), 0.20)",
    transition:
      "all 0.2s ease",
  },

  tombolLoading: {
    opacity: 0.75,
    cursor: "not-allowed",
  },

  arrow: {
    fontSize: "17px",
    lineHeight: 1,
  },

  spinner: {
    width: "15px",
    height: "15px",
    border: "2px solid rgba(var(--cn-white-rgb), 0.35)",
    borderTopColor: "var(--cn-surface)",
    borderRadius: "50%",
    animation:
      "spin 0.7s linear infinite",
  },

  lupaWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    marginTop: "-4px",
  },

  lupaText: {
    color: "var(--cn-muted)",
    fontSize: "10px",
  },

  linkLupa: {
    color: WARNA_PRIMARY,
    fontSize: "10px",
    fontWeight: 700,
    textDecoration: "none",
  },

  securityInfo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    marginTop: "27px",
    color: "var(--cn-muted)",
    fontSize: "9px",
  },

  lockIcon: {
    color: "var(--cn-success)",
    fontSize: "12px",
  },
};