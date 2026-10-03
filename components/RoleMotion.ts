export const VARIAN_MENU_ROLE = {
  sembunyi: {},
  tampil: {
    transition: { staggerChildren: 0.045, delayChildren: 0.04 },
  },
};

export const VARIAN_ITEM_MENU_ROLE = {
  sembunyi: { opacity: 0, x: -8 },
  tampil: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export const TRANSISI_DRAWER_ROLE = {
  type: "spring" as const,
  stiffness: 360,
  damping: 32,
  mass: 0.75,
};