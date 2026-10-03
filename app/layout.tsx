import type { Metadata } from "next";
import "./globals.css";
import { ConfirmDialogProvider } from "@/components/ConfirmDialogProvider";

export const metadata: Metadata = {
  title: "CN Edu — Sistem Belajar Terpadu",
  description: "Materi, tugas, asesmen, dan nilai dalam satu ruang belajar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
      </body>
    </html>
  );
}
