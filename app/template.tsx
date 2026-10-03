"use client";

import type { ReactNode } from "react";
import { MotionConfig, motion, useReducedMotion } from "motion/react";

export default function Template({ children }: { children: ReactNode }) {
  const kurangiGerak = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: kurangiGerak ? 0 : 7 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: kurangiGerak ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        style={{ minHeight: "100%" }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}