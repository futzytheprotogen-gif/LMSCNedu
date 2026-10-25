import { NextRequest, NextResponse } from "next/server";
import {
  verifikasiToken,
  halamanDashboard,
  NAMA_COOKIE_SESI,
  NAMA_COOKIE_AKSES_MASTER,
  type RoleAplikasi,
} from "@/lib/auth";
import { db } from "@/lib/db";

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
// API tetap melewati pemeriksaan maintenance di sini; otorisasi setiap
// endpoint tetap dilakukan di route handler lewat lib/rbac.ts.
const RUTE_PUBLIK = ["/", "/login", "/login/lupa-password", "/maintenance"];

const PREFIX_PER_ROLE: Record<RoleAplikasi, string[]> = {
  MASTER_ADMIN: ["/master"],
  ADMIN: ["/admin"],
  KEPSEK: ["/kepsek"],
  KURIKULUM: ["/kurikulum"],
  GURU: ["/guru"],
  SISWA: ["/siswa"],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  if (isApi && pathname === "/api/auth") {
    return NextResponse.next();
  }

  let maintenance: { value: string } | null;
  try {
    maintenance = await db.systemSetting.findUnique({
      where: { key: "maintenance.enabled" },
      select: { value: true },
    });
  } catch (error) {
    console.error("Gagal memeriksa status maintenance:", error);
    if (isApi) {
      return NextResponse.json(
        { pesan: "Status layanan belum dapat diverifikasi." },
        { status: 503 }
      );
    }
    return new NextResponse("Status layanan belum dapat diverifikasi.", {
      status: 503,
    });
  }
  const sedangMaintenance = maintenance?.value === "true";

  const token = request.cookies.get(NAMA_COOKIE_SESI)?.value;
  const sesiUtama = token ? await verifikasiToken(token) : null;
  let sesi = sesiUtama;
  const aksesToken = request.cookies.get(NAMA_COOKIE_AKSES_MASTER)?.value;
  if (
    sesiUtama?.role === "MASTER_ADMIN" &&
    !pathname.startsWith("/master") &&
    !pathname.startsWith("/api/master") &&
    pathname !== "/api/auth" &&
    aksesToken
  ) {
    const sesiAkses = await verifikasiToken(aksesToken);
    if (
      sesiAkses?.actingAs &&
      sesiAkses.masterActorId === sesiUtama.userId &&
      sesiAkses.role !== "MASTER_ADMIN"
    ) {
      sesi = sesiAkses;
    }
  }

  if (sedangMaintenance) {
    if (sesi?.role === "MASTER_ADMIN") return NextResponse.next();
    if (isApi) {
      return NextResponse.json(
        { pesan: "CN Edu sedang dinonaktifkan sementara oleh Master Admin." },
        { status: 503 }
      );
    }
    if (
      pathname === "/login" ||
      pathname === "/login/lupa-password" ||
      pathname === "/maintenance"
    ) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  if (RUTE_PUBLIK.includes(pathname)) {
    return NextResponse.next();
  }

  // Belum login / token invalid & kadaluarsa -> paksa ke /login
  if (!sesi) {
    if (isApi) {
      return NextResponse.next();
    }
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
  for (const [role, prefixes] of Object.entries(PREFIX_PER_ROLE)) {
    if (
      prefixes.some((prefix) => pathname.startsWith(prefix)) &&
      sesi.role !== role
    ) {
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

// Aset Next.js dan file gambar statis tidak memerlukan pemeriksaan sesi.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};