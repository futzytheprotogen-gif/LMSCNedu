import styles from "./EmptyStateFox.module.css";

export default function EmptyStateFox({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`${styles.foxStage} ${compact ? styles.compact : ""}`} aria-hidden="true">
      <svg className={styles.fox} viewBox="0 0 120 96" fill="none">
        <ellipse className={styles.shadow} cx="57" cy="84" rx="34" ry="5" />
        <g className={styles.tail}>
          <path d="M83 56c18-4 26 4 27 15 1 9-7 14-17 9-7-4-12-12-18-13" className={styles.orange} />
          <path d="M101 72c2 6 6 9 11 9-1-7-6-11-11-9Z" className={styles.cream} />
        </g>
        <g className={styles.legs}>
          <path className={`${styles.leg} ${styles.backLeg}`} d="M41 65v13c0 4 7 4 8 0l3-12" />
          <path className={`${styles.leg} ${styles.frontLeg}`} d="M70 64v14c0 4 7 4 8 0l1-15" />
        </g>
        <ellipse className={styles.orange} cx="59" cy="59" rx="29" ry="19" />
        <ellipse className={styles.cream} cx="60" cy="64" rx="17" ry="11" />
        <g className={styles.head}>
          <path className={styles.orange} d="m37 35-3-20 17 11m22 9 8-19 8 23" />
          <path className={styles.earInner} d="m40 29-1-8 8 6m24 8 5-9 4 11" />
          <path className={styles.orange} d="M34 40c0-13 10-22 23-22 15 0 27 10 27 24 0 15-11 25-26 25-15 0-24-11-24-27Z" />
          <path className={styles.cream} d="M35 47c7-4 13-3 19 0 6-3 13-4 21-1-2 11-10 18-21 18-10 0-17-6-19-17Z" />
          <path className={styles.cream} d="M46 54c2-4 5-6 9-6s7 2 9 6c-2 6-5 9-9 9s-7-3-9-9Z" />
          <ellipse className={styles.eye} cx="48" cy="42" rx="2" ry="3" />
          <ellipse className={styles.eye} cx="68" cy="42" rx="2" ry="3" />
          <path className={styles.nose} d="m53 53 4-3 4 3-4 3-4-3Z" />
          <path className={styles.mouth} d="M57 56v3m0 0-3 2m3-2 3 2" />
          <path className={styles.cheek} d="M39 51c2-2 5-2 7 0m24 0c2-2 5-2 7 0" />
        </g>
        <path className={styles.sparkle} d="m19 39 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Zm76-19 1.5 3.5L100 25l-3.5 1.5L95 30l-1.5-3.5L90 25l3.5-1.5L95 20Z" />
      </svg>
    </span>
  );
}
