import type { ReactNode } from "react";
import AdminTierShell from "@/components/AdminTierShell";

export default function LayoutKurikulum({ children }: { children: ReactNode }) {
  return <AdminTierShell role="Kurikulum">{children}</AdminTierShell>;
}