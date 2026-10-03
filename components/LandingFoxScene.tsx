import styles from "./LandingFoxScene.module.css";

export default function LandingFoxScene() {
  return (
    <div
      className={styles.scene}
      role="img"
      aria-label="Ilustrasi laptop dengan dashboard LMS, aktivitas kelas, materi, dan tugas yang mengikuti tema terang atau gelap."
    >
      <svg aria-hidden="true" className={styles.illustration} viewBox="0 0 480 320" fill="none">
        <rect className={styles.canvas} width="480" height="320" rx="24" />
        <circle className={styles.orbit} cx="238" cy="159" r="124" />
        <circle className={styles.orbitSmall} cx="238" cy="159" r="98" />

        <g className={styles.window}>
          <rect className={styles.windowFrame} x="30" y="48" width="100" height="86" rx="8" />
          <rect className={styles.windowGlass} x="36" y="54" width="88" height="74" rx="4" />
          <circle className={styles.sun} cx="102" cy="72" r="10" />
          <circle className={styles.moon} cx="102" cy="72" r="9" />
          <path className={styles.moonCutout} d="M106 64a9 9 0 1 0 5 15 9 9 0 0 1-5-15Z" />
          <path className={styles.stars} d="m76 68 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Zm23 27 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" />
          <path className={styles.windowHills} d="M36 107c15-15 25-12 37-2 13-17 28-13 51 1v22H36v-21Z" />
          <path className={styles.windowTrees} d="m48 111 9-21 9 21h-6l7 9H47l7-9h-6Zm45-2 10-24 10 24h-7l8 10H92l8-10h-7Z" />
          <path className={styles.windowBar} d="M30 134h100" />
        </g>

        <g className={styles.plant}>
          <path d="M48 247h35l-5 35H53l-5-35Zm18-1c-1-22-13-28-24-27 1 14 9 23 24 27Zm2-6c3-23 16-28 27-26-3 14-12 23-27 26Zm-1-17c0-17 8-24 18-26 1 13-5 22-18 26Z" />
        </g>

        <g className={styles.dashboardCard}>
          <rect className={styles.cardBase} x="337" y="61" width="111" height="66" rx="9" />
          <circle className={styles.cardIcon} cx="356" cy="82" r="8" />
          <path className={styles.cardCheck} d="m352 82 3 3 5-6" />
          <path className={styles.cardText} d="M372 78h57M372 86h40M350 103h76" />
          <path className={styles.cardProgressBg} d="M350 114h77" />
          <path className={styles.cardProgress} d="M350 114h48" />
        </g>

        <g className={styles.notification}>
          <rect className={styles.notificationBase} x="42" y="166" width="112" height="45" rx="9" />
          <circle className={styles.notificationDot} cx="59" cy="188" r="6" />
          <path className={styles.notificationLine} d="M73 182h65m-65 10h45" />
        </g>

        <path className={styles.desk} d="M73 251h337l-13 14H87l-14-14Z" />
        <path className={styles.deskLeg} d="m104 265-8 31m280-31 8 31" />
        <path className={styles.deskFoot} d="M86 297h25m264 0h25" />

        <g className={styles.laptop}>
          <path className={styles.laptopShell} d="M137 105c0-7 5-12 12-12h179c7 0 12 5 12 12v134H137V105Z" />
          <rect className={styles.screen} x="147" y="105" width="183" height="122" rx="5" />
          <path className={styles.screenTop} d="M147 110a5 5 0 0 1 5-5h173a5 5 0 0 1 5 5v14H147v-14Z" />
          <circle className={styles.brandDot} cx="158" cy="115" r="3" />
          <path className={styles.brandLine} d="M166 115h28" />
          <circle className={styles.profile} cx="316" cy="115" r="4" />
          <path className={styles.sidebar} d="M147 124h39v103h-39z" />
          <rect className={styles.sidebarActive} x="153" y="137" width="27" height="12" rx="3" />
          <path className={styles.sidebarLine} d="M156 159h20m-20 12h20m-20 12h16m-16 12h19" />
          <path className={styles.screenHeading} d="M197 140h78m-78 8h52" />
          <rect className={styles.courseCard} x="197" y="161" width="58" height="48" rx="5" />
          <rect className={styles.courseThumb} x="202" y="166" width="48" height="21" rx="3" />
          <path className={styles.courseLine} d="M202 195h36m-36 7h27" />
          <rect className={styles.taskCard} x="261" y="161" width="58" height="48" rx="5" />
          <circle className={styles.taskIcon} cx="275" cy="176" r="7" />
          <path className={styles.taskCheck} d="m272 176 2 2 4-5" />
          <path className={styles.courseLine} d="M286 174h26m-26 7h20m-20 14h27m-27 7h19" />
          <path className={styles.laptopBase} d="M126 239h225l20 11H108l18-11Z" />
          <path className={styles.trackpad} d="M218 242h40" />
        </g>

        <g className={styles.cursor}>
          <path className={styles.cursorShape} d="m284 181 17 18-8 1 4 9-5 2-4-9-6 6 2-27Z" />
        </g>

        <g className={styles.sparkles}>
          <path d="m355 158 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Zm94 26 1.5 4L455 190l-4.5 1.5L449 196l-1.5-4.5L443 190l4.5-1.5L449 184Z" />
        </g>
      </svg>
    </div>
  );
}
