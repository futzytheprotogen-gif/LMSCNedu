import { NextRequest, NextResponse } from "next/server";
import {
  verifikasiToken,
  halamanDashboard,
  NAMA_COOKIE_SESI,
  type RoleAplikasi,
} from "@/lib/auth";

// ------------------------------------------------------------
// Next.js 16: file ini namanya WAJIB "proxy.ts" (bukan middleware.ts
// lagi — konvensi lama sudah deprecated) dan fungsi yang di-export
// WAJIB bernama "proxy" (bukan "middleware"). Taruh di root project,
// sejajar package.json.
//
// Bedanya sama middleware.ts lama: proxy.ts jalan di Node.js runtime
// (bukan Edge Runtime lagi, dan gak bisa dikonfigurasi ke edge).
// lib/auth.ts tetap sengaja ditulis edge-safe (cuma jose + bcryptjs,
// tanpa import lib/db.ts) — gak masalah dipakai di Node runtime juga,
// dan kalau suatu saat perlu balik ke Edge Runtime, file ini masih
// kompatibel tanpa perlu ditulis ulang.
// ------------------------------------------------------------

// Halaman publik yang boleh diakses tanpa login sama sekali.
// Sengaja pendek: /api/**, /_next/**, dan file statis sudah
// dikecualikan lewat `matcher` di bawah, jadi tidak perlu dicek ulang
// di sini. Endpoint /api/** mengurus otorisasinya sendiri lewat
// lib/rbac.ts, bukan lewat middleware ini.
const RUTE_PUBLIK = ["/", "/login"];

const PREFIX_PER_ROLE: Record<RoleAplikasi, string> = {
  ADMIN: "/admin",
  KEPSEK: "/kepsek",
  KURIKULUM: "/kurikulum",
  GURU: "/guru",
  SISWA: "/siswa",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (RUTE_PUBLIK.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(NAMA_COOKIE_SESI)?.value;
  const sesi = token ? await verifikasiToken(token) : null;

  // Belum login / token invalid & kadaluarsa -> paksa ke /login
  if (!sesi) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirectFrom", pathname);
    return NextResponse.redirect(url);
  }

  // passwordSementara = true (Guru/Siswa yang belum ganti password
  // default) -> semua halaman lain diblokir, cuma boleh ke satu
  // tempat: /ganti-password-awal
  if (sesi.passwordSementara && pathname !== "/ganti-password-awal") {
    return NextResponse.redirect(new URL("/ganti-password-awal", request.url));
  }

  // Sebaliknya: yang password-nya udah bukan sementara lagi gak perlu
  // (dan gak boleh) balik ke halaman ganti-password-awal
  if (!sesi.passwordSementara && pathname === "/ganti-password-awal") {
    return NextResponse.redirect(
      new URL(halamanDashboard(sesi.role), request.url)
    );
  }

  // Proteksi folder per role: /admin/**, /guru/**, dst — role lain
  // yang nyasar ke situ dilempar balik ke dashboard-nya sendiri
  // (bukan ke /login, soalnya dia sebenarnya udah login, cuma salah
  // area)
  for (const [role, prefix] of Object.entries(PREFIX_PER_ROLE)) {
    if (pathname.startsWith(prefix) && sesi.role !== role) {
      return NextResponse.redirect(
        new URL(halamanDashboard(sesi.role), request.url)
      );
    }
  }

  // /profil/[userId] sengaja tidak dicek di atas -> semua role yang
  // sudah login boleh buka profil siapapun (read-only untuk profil
  // orang lain, diatur di level halaman/komponen, bukan middleware)

  return NextResponse.next();
}

// Proxy TIDAK jalan untuk: /api/**, aset Next.js internal, dan
// file statis umum (biar gak nge-cek token buat tiap gambar/ikon).
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};