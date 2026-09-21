import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

// Prisma 7: koneksi lewat driver adapter, bukan url di datasource.
// Pastikan .env sudah berisi DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME
// dan Laragon (MySQL) sudah menyala sebelum menjalankan `npx prisma db seed`.
const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "CNedu",
});

const prisma = new PrismaClient({ adapter });

// ------------------------------------------------------------
// 1. Data Rombel Akademik (63 kelas jurusan + SMP + SMA)
// ------------------------------------------------------------

type VariasiPerJurusan = Record<string, string[]>;

const KONFIGURASI_ROMBEL: Record<number, VariasiPerJurusan> = {
  10: {
    DKV: ["PLUS", "1", "2"],
    TJKT: ["PLUS", "1", "2", "3", "4", "5"],
    PPLG: ["1", "2"],
    PEMASARAN: ["1", "2"],
    MPLB: ["PLUS", "1", "2", "3", "4", "5"],
  },
  11: {
    DKV: ["PLUS", "1", "2"],
    TJKT: ["PLUS", "1", "2", "3", "4", "5", "6", "7"],
    PPLG: ["1", "2"],
    PEMASARAN: ["1", "2", "3"],
    MPLB: ["PLUS", "1", "2", "3", "4", "5"],
  },
  12: {
    DKV: ["PLUS", "1", "2"],
    TJKT: ["PLUS", "1", "2", "3", "4", "5", "6", "7"],
    PPLG: ["1", "2"],
    PEMASARAN: ["1", "2", "3"],
    MPLB: ["PLUS", "1", "2", "3", "4", "5"],
  },
};

function buildDaftarRombel() {
  const daftar: {
    label: string;
    jenjang: string;
    angkatan: number | null;
    jurusan: string | null;
    variasi: string | null;
  }[] = [
    { label: "SMP", jenjang: "SMP", angkatan: null, jurusan: null, variasi: null },
    { label: "SMA", jenjang: "SMA", angkatan: null, jurusan: null, variasi: null },
  ];

  for (const [angkatanStr, jurusanMap] of Object.entries(KONFIGURASI_ROMBEL)) {
    const angkatan = Number(angkatanStr);
    for (const [jurusan, variasiList] of Object.entries(jurusanMap)) {
      for (const variasi of variasiList) {
        daftar.push({
          label: `${angkatan} ${jurusan} ${variasi}`,
          jenjang: "SMK",
          angkatan,
          jurusan,
          variasi,
        });
      }
    }
  }

  return daftar;
}

// ------------------------------------------------------------
// 2. Data Mata Pelajaran (contoh awal, tambah sesuai kebutuhan)
// ------------------------------------------------------------

const DAFTAR_MAPEL = [
  "Matematika",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Pendidikan Pancasila",
  "Produk Kreatif dan Kewirausahaan",
  "Pemrograman Web dan Perangkat Bergerak", // PPLG
  "Basis Data", // PPLG
  "Komputer dan Jaringan Dasar", // TJKT
  "Administrasi Infrastruktur Jaringan", // TJKT
  "Desain Grafis Percetakan", // DKV
  "Marketing Digital", // PEMASARAN
  "Otomatisasi Tata Kelola Perkantoran", // MPLB
];

async function main() {
  console.log("Mulai seeding CN Edu...");

  // 1. Rombel Akademik
  const daftarRombel = buildDaftarRombel();
  for (const rombel of daftarRombel) {
    await prisma.rombelAkademik.upsert({
      where: { label: rombel.label },
      update: {},
      create: rombel,
    });
  }
  console.log(`Rombel akademik: ${daftarRombel.length} entri.`);

  // 2. Mata Pelajaran
  for (const nama of DAFTAR_MAPEL) {
    await prisma.mataPelajaran.upsert({
      where: { nama },
      update: {},
      create: { nama },
    });
  }
  console.log(`Mata pelajaran: ${DAFTAR_MAPEL.length} entri.`);

  // 3. Akun Admin tier (Admin, Kepsek, Kurikulum)
  // Password di sini hanya contoh untuk seed lokal — ganti sebelum production.
  const passwordAdminHash = await bcrypt.hash("admin123", 10);
  const passwordKepsekHash = await bcrypt.hash("kepsek123", 10);
  const passwordKurikulumHash = await bcrypt.hash("kurikulum123", 10);

  const admin = await prisma.admin.upsert({
    where: { email: "admin@cnedu.sch.id" },
    update: { password: passwordAdminHash, nama: "Admin CN Edu", role: "ADMIN" },
    create: {
      email: "admin@cnedu.sch.id",
      password: passwordAdminHash,
      nama: "Admin CN Edu",
      role: "ADMIN",
    },
  });

  await prisma.admin.upsert({
    where: { email: "kepsek@cnedu.sch.id" },
    update: { password: passwordKepsekHash, nama: "Kepala Sekolah", role: "KEPSEK" },
    create: {
      email: "kepsek@cnedu.sch.id",
      password: passwordKepsekHash,
      nama: "Kepala Sekolah",
      role: "KEPSEK",
    },
  });

  await prisma.admin.upsert({
    where: { email: "kurikulum@cnedu.sch.id" },
    update: { password: passwordKurikulumHash, nama: "Waka Kurikulum", role: "KURIKULUM" },
    create: {
      email: "kurikulum@cnedu.sch.id",
      password: passwordKurikulumHash,
      nama: "Waka Kurikulum",
      role: "KURIKULUM",
    },
  });
  console.log("Akun Admin/Kepsek/Kurikulum siap.");

  // 4. Contoh Guru — password default = NIK (belum di-hash pakai NIK asli,
  // ini hanya demo; alur sebenarnya password default di-generate saat
  // admin membuat akun lewat form "Buat Akun")
  const nikGuruContoh = 3201010101010001n;
  const passwordGuruHash = await bcrypt.hash(nikGuruContoh.toString(), 10);

  const mapelPplg1 = await prisma.mataPelajaran.findUniqueOrThrow({
    where: { nama: "Pemrograman Web dan Perangkat Bergerak" },
  });

  const guruContoh = await prisma.guru.upsert({
    where: { nik: nikGuruContoh },
    update: {
      email: "guru.contoh@cnedu.sch.id",
      nama: "Guru Contoh",
      password: passwordGuruHash,
    },
    create: {
      email: "guru.contoh@cnedu.sch.id",
      nik: nikGuruContoh,
      nama: "Guru Contoh",
      tanggalLahir: new Date("1990-01-01"),
      jenisKelamin: "L",
      password: passwordGuruHash,
      passwordSementara: true,
      mapelDiampu: {
        create: [{ mapelId: mapelPplg1.id }],
      },
    },
  });
  console.log("Contoh guru siap.");

  // 5. Contoh Siswa — password default = NIS
  const nisSiswaContoh = 2425010001n;
  const passwordSiswaHash = await bcrypt.hash(nisSiswaContoh.toString(), 10);

  const rombel12Pplg2 = await prisma.rombelAkademik.findUniqueOrThrow({
    where: { label: "12 PPLG 2" },
  });

  const siswaContoh = await prisma.siswa.upsert({
    where: { nis: nisSiswaContoh },
    update: {
      email: "siswa.contoh@cnedu.sch.id",
      nama: "Siswa Contoh",
      password: passwordSiswaHash,
    },
    create: {
      email: "siswa.contoh@cnedu.sch.id",
      nis: nisSiswaContoh,
      nama: "Siswa Contoh",
      tanggalLahir: new Date("2008-05-10"),
      jenisKelamin: "P",
      password: passwordSiswaHash,
      passwordSementara: true,
      rombelId: rombel12Pplg2.id,
    },
  });
  console.log("Contoh siswa siap.");

  // 6. Contoh Kelas (ala Google Classroom) — guru + siswa digabungkan manual,
  // sesuai aturan "siswa tidak otomatis masuk kelas"
  const kelasContoh = await prisma.kelas.upsert({
    where: { kodeKelas: "PPLG2-CONTOH" },
    update: {},
    create: {
      judul: "Pemrograman Web - 12 PPLG 2",
      deskripsi: "Kelas contoh hasil seed awal.",
      kodeKelas: "PPLG2-CONTOH",
      guru: {
        create: [{ guruId: guruContoh.id, mapelId: mapelPplg1.id }],
      },
      siswa: {
        create: [{ siswaId: siswaContoh.id }],
      },
    },
  });
  console.log(`Contoh kelas siap: ${kelasContoh.judul}`);

  console.log("Seeding selesai. Admin id:", admin.id);
}

main()
  .catch((error) => {
    console.error("Seeding gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });