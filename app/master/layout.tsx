import type { ReactNode } from "react";
import AdminMasterShell from "@/components/AdminMasterShell";

export default function MasterAdminLayout({ children }: { children: ReactNode }) {
  return <AdminMasterShell>{children}</AdminMasterShell>;
}
