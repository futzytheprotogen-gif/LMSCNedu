import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

function bersihkan(nilai?: string) {
  return nilai?.trim().replace(/^["']|["']$/g, "");
}

async function main() {
  const email = bersihkan(process.env.MASTER_ADMIN_EMAIL)?.toLowerCase();
  const nama =
    bersihkan(process.env.MASTER_ADMIN_NAME) || "Master Admin CN Edu";
  const password = process.env.MASTER_ADMIN_PASSWORD;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("MASTER_ADMIN_EMAIL wajib diisi dengan alamat email yang valid.");
  }
  if (!password || password.length < 12) {
    throw new Error("MASTER_ADMIN_PASSWORD wajib diisi dan minimal 12 karakter.");
  }

  const host = bersihkan(process.env.DB_HOST) ?? "127.0.0.1";
  const db = new PrismaClient({
    adapter: new PrismaMariaDb({
      host,
      port: Number(bersihkan(process.env.DB_PORT) ?? 3306),
      user: bersihkan(process.env.DB_USER) ?? "root",
      password: bersihkan(process.env.DB_PASSWORD) ?? "",
      database: bersihkan(process.env.DB_NAME) ?? "CNedu",
      ssl:
        host.includes("tidbcloud.com") || bersihkan(process.env.DB_SSL) === "true"
          ? true
          : undefined,
      connectTimeout: 20000,
    }),
  });

  try {
    const [admin, guru, siswa] = await Promise.all([
      db.admin.findUnique({
        where: { email },
        select: { id: true, role: true },
      }),
      db.guru.findUnique({ where: { email }, select: { id: true } }),
      db.siswa.findUnique({ where: { email }, select: { id: true } }),
    ]);

    if (guru || siswa) {
      throw new Error("Email Master Admin sudah digunakan akun Guru atau Siswa.");
    }
    if (admin && admin.role !== "MASTER_ADMIN") {
      throw new Error(
        "Email sudah digunakan administrator lain. Gunakan email baru; role akun yang ada tidak diubah."
      );
    }

    const hash = await bcrypt.hash(password, 12);
    if (admin) {
      await db.admin.update({
        where: { id: admin.id },
        data: { nama, password: hash },
      });
      console.log("Password akun Master Admin yang sudah ada berhasil diperbarui.");
    } else {
      await db.admin.create({
        data: { email, nama, password: hash, role: "MASTER_ADMIN" },
      });
      console.log("Akun Master Admin berhasil dibuat.");
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Provisioning Master Admin gagal:", error);
  process.exitCode = 1;
});
