import type { Metadata } from "next";
import "./globals.css";
import { ConfirmDialogProvider } from "@/components/ConfirmDialogProvider";
import { AppNoticeProvider } from "@/components/AppNoticeProvider";
import { AppThemeProvider } from "@/components/AppThemeProvider";
import Script from "next/script";

export const metadata: Metadata = {
  title: "CN Edu — Sistem Belajar Terpadu",
  description: "Materi, tugas, asesmen, dan nilai dalam satu ruang belajar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Script id="cnedu-theme-init" strategy="beforeInteractive">
          {`try {
            var savedTheme = localStorage.getItem("cnedu-theme");
            var isDark = savedTheme === "gelap" || (savedTheme !== "terang" && window.matchMedia("(prefers-color-scheme: dark)").matches);
            document.documentElement.dataset.theme = isDark ? "dark" : "light";
          } catch (error) {
            document.documentElement.dataset.theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
          }`}
        </Script>
        <AppThemeProvider>
          <ConfirmDialogProvider>
            <AppNoticeProvider>{children}</AppNoticeProvider>
          </ConfirmDialogProvider>
        </AppThemeProvider>
      </body>
    </html>
  );
}
