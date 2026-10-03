import styles from "./loading.module.css";

export default function Loading() {
  return (
    <main className={styles.loading} aria-label="Memuat halaman" role="status">
      <header className={styles.topbar}>
        <div className={`${styles.block} ${styles.brand}`} />
        <div className={`${styles.block} ${styles.profile}`} />
      </header>
      <div className={styles.frame}>
        <aside className={styles.sidebar}>
          <div className={`${styles.block} ${styles.sideLabel}`} />
          {[0, 1, 2, 3].map((item) => <div className={`${styles.block} ${styles.navItem}`} key={item} />)}
          <div className={`${styles.block} ${styles.sideFooter}`} />
        </aside>
        <section className={styles.content}>
          <div className={`${styles.block} ${styles.eyebrow}`} />
          <div className={`${styles.block} ${styles.heading}`} />
          <div className={`${styles.block} ${styles.subtitle}`} />
          <div className={styles.stats}>
            {[0, 1, 2].map((item) => <div className={styles.statCard} key={item}><i /><b /><b /></div>)}
          </div>
          <div className={styles.list}>
            {[0, 1, 2].map((item) => <div className={styles.listRow} key={item}><i /><span><b /><b /></span><b /></div>)}
          </div>
        </section>
      </div>
      <span className={styles.srOnly}>Memuat konten</span>
    </main>
  );
}