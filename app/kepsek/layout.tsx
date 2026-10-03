import type { ReactNode } from "react";
import AdminTierShell from "@/components/AdminTierShell";

export default function LayoutKepsek({ children }: { children: ReactNode }) {
  return <AdminTierShell role="Kepsek">{children}</AdminTierShell>;
}