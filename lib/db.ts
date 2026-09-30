import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// Prisma 7 tidak lagi baca `url` dari datasource di schema.prisma —
// koneksi database harus lewat driver adapter, jadi variabel koneksi
// diambil manual dari .env di sini.
function bersihkan(v?: string) {
  return v?.trim().replace(/^["']|["']$/g, "");
}

function buatAdapter() {
  const host = bersihkan(process.env.DB_HOST) ?? "127.0.0.1";
  const pakaiSsl =
    host.includes("tidbcloud.com") || bersihkan(process.env.DB_SSL) === "true";

  return new PrismaMariaDb({
    host,
    port: Number(bersihkan(process.env.DB_PORT) ?? 3306),
    user: bersihkan(process.env.DB_USER) ?? "root",
    password: bersihkan(process.env.DB_PASSWORD) ?? "",
    database: bersihkan(process.env.DB_NAME) ?? "CNedu",
    ssl: pakaiSsl ? true : undefined,
    connectTimeout: 20000,
  });
}

// Next.js dev mode (hot reload) bisa bikin banyak instance PrismaClient
// kalau tidak di-singleton-kan lewat globalThis — tiap file berubah,
// module di-reload, dan tanpa pola ini tiap reload bikin koneksi baru
// ke MySQL sampai akhirnya "too many connections".
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: buatAdapter(),
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}