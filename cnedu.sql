-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               5.7.33 - MySQL Community Server (GPL)
-- Server OS:                    Win64
-- HeidiSQL Version:             11.2.0.6213
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for cnedu
CREATE DATABASE IF NOT EXISTS `cnedu` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `cnedu`;

-- Dumping structure for table cnedu.admin
CREATE TABLE IF NOT EXISTS `admin` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','KEPSEK','KURIKULUM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `fotoProfil` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.admin: ~3 rows (approximately)
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
REPLACE INTO `admin` (`id`, `email`, `password`, `nama`, `role`, `fotoProfil`, `deskripsi`, `createdAt`, `updatedAt`) VALUES
	('cmtgs9mx10025fwurl0d0qcic', 'admin@cnedu.sch.id', '$2b$10$PIPy7ynwo4WmTTTC9uRCyeNcJiQSqARKZO5u8qrur6B08zudgqNsO', 'Admin CN Edu', 'ADMIN', NULL, NULL, '2026-08-31 05:13:55.525', '2026-09-02 00:55:38.755'),
	('cmtgs9mxa0026fwur4ubqxgv8', 'kepsek@cnedu.sch.id', '$2b$10$iSo5tErR/a.c5OjBRzu0.e/P2znRkX4hRVIvLSOJXZQFxc0Cku2OS', 'Kepala Sekolah', 'KEPSEK', NULL, NULL, '2026-08-31 05:13:55.534', '2026-09-02 00:55:38.774'),
	('cmtgs9mxh0027fwurmpju8rnn', 'kurikulum@cnedu.sch.id', '$2b$10$4RyADnSVEKjm84kADgMPNubxrFRLJaSGwSN0N9dLgxqCzdN.dkeeC', 'Waka Kurikulum', 'KURIKULUM', NULL, NULL, '2026-08-31 05:13:55.541', '2026-09-02 00:55:38.780');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;

-- Dumping structure for table cnedu.asesmen
CREATE TABLE IF NOT EXISTS `asesmen` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `judul` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipe` enum('KUIS','UJIAN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PROSES','SELESAI') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PROSES',
  `durasiMenit` int(11) DEFAULT NULL,
  `mapelId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guruId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `asesmen_mapelId_fkey` (`mapelId`),
  KEY `asesmen_guruId_fkey` (`guruId`),
  CONSTRAINT `asesmen_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `guru` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `asesmen_mapelId_fkey` FOREIGN KEY (`mapelId`) REFERENCES `mata_pelajaran` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.asesmen: ~7 rows (approximately)
/*!40000 ALTER TABLE `asesmen` DISABLE KEYS */;
REPLACE INTO `asesmen` (`id`, `judul`, `tipe`, `status`, `durasiMenit`, `mapelId`, `guruId`, `createdAt`, `updatedAt`) VALUES
	('cmu8zzzx500004sur356fpw2j', 'LMS', 'UJIAN', 'SELESAI', 35, 'cmtgs9mmo001zfwur99pfn5go', 'cmtma038400046surcedwrtid', '2026-09-19 23:07:55.674', '2026-09-19 23:13:25.460'),
	('cmub8didr00003kurdippgehq', 'Tes', 'UJIAN', 'PROSES', 60, 'cmtgs9mmo001zfwur99pfn5go', 'cmtma038400046surcedwrtid', '2026-09-21 12:37:55.407', '2026-09-21 12:37:55.407'),
	('cmuduhym70004tgurhhd8squn', 'LMS', 'KUIS', 'SELESAI', 4, 'cmtgs9mmo001zfwur99pfn5go', 'cmtma038400046surcedwrtid', '2026-09-23 08:32:46.975', '2026-09-23 08:33:53.437'),
	('cmueq99gt000014ur0yswhj7h', 'TO Basisdata', 'UJIAN', 'PROSES', 1, 'cmtgs9mmo001zfwur99pfn5go', 'cmtma038400046surcedwrtid', '2026-09-23 23:21:48.845', '2026-09-23 23:21:48.845'),
	('cmuhlnefi0000o8urjtzzqo3x', 'q', 'KUIS', 'PROSES', 4, 'cmtgs9mmo001zfwur99pfn5go', 'cmtma038400046surcedwrtid', '2026-09-25 23:36:08.910', '2026-09-25 23:36:08.910'),
	('cmum3crl20000ngur111q110l', 'Ulangan Harian Bab 2', 'UJIAN', 'SELESAI', 30, 'cmtgs9mmo001zfwur99pfn5go', 'cmtma038400046surcedwrtid', '2026-09-29 03:02:50.534', '2026-09-29 03:03:06.265'),
	('cmum3o0h4000rngurpeswcnrh', '3', 'KUIS', 'PROSES', 7, 'cmtgs9mmo001zfwur99pfn5go', 'cmtma038400046surcedwrtid', '2026-09-29 03:11:35.272', '2026-09-29 03:11:35.272');
/*!40000 ALTER TABLE `asesmen` ENABLE KEYS */;

-- Dumping structure for table cnedu.asesmen_kelas
CREATE TABLE IF NOT EXISTS `asesmen_kelas` (
  `asesmenId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kelasId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`asesmenId`,`kelasId`),
  KEY `asesmen_kelas_kelasId_fkey` (`kelasId`),
  CONSTRAINT `asesmen_kelas_asesmenId_fkey` FOREIGN KEY (`asesmenId`) REFERENCES `asesmen` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `asesmen_kelas_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `kelas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.asesmen_kelas: ~3 rows (approximately)
/*!40000 ALTER TABLE `asesmen_kelas` DISABLE KEYS */;
REPLACE INTO `asesmen_kelas` (`asesmenId`, `kelasId`) VALUES
	('cmu8zzzx500004sur356fpw2j', 'cmtvavvek000130urghuztixr'),
	('cmub8didr00003kurdippgehq', 'cmtvavvek000130urghuztixr'),
	('cmuduhym70004tgurhhd8squn', 'cmtvavvek000130urghuztixr'),
	('cmueq99gt000014ur0yswhj7h', 'cmtvavvek000130urghuztixr'),
	('cmuhlnefi0000o8urjtzzqo3x', 'cmtvavvek000130urghuztixr'),
	('cmum3crl20000ngur111q110l', 'cmtvavvek000130urghuztixr');
/*!40000 ALTER TABLE `asesmen_kelas` ENABLE KEYS */;

-- Dumping structure for table cnedu.guru
CREATE TABLE IF NOT EXISTS `guru` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nik` bigint(20) NOT NULL,
  `nama` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggalLahir` datetime(3) NOT NULL,
  `jenisKelamin` enum('L','P') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fotoProfil` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordSementara` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `guru_email_key` (`email`),
  UNIQUE KEY `guru_nik_key` (`nik`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.guru: ~0 rows (approximately)
/*!40000 ALTER TABLE `guru` DISABLE KEYS */;
REPLACE INTO `guru` (`id`, `email`, `nik`, `nama`, `tanggalLahir`, `jenisKelamin`, `fotoProfil`, `deskripsi`, `password`, `passwordSementara`, `createdAt`, `updatedAt`) VALUES
	('cmtgs9n1r0028fwurptqymi3m', 'guru.contoh@cnedu.sch.id', 3201010101010001, 'Guru Contoh', '1990-01-01 00:00:00.000', 'L', NULL, NULL, '$2b$10$lIEjLHTyQAy1f4wqLKWUpez6TjRvjFxFFqxLoFyWBG6TaIIgVW/4W', 1, '2026-08-31 05:13:55.695', '2026-09-02 00:55:38.931'),
	('cmtma038400046surcedwrtid', 'Ayu@gmail.com', 987654321, 'Ayu Budi Lestari', '2026-09-23 00:00:00.000', 'P', NULL, 'Bu Ayu', '$2b$10$VP1zSFYoU3NIZvnpImyS0evvsxLkL1sBOiJKBzZcjTBdyOk1FYvyS', 0, '2026-09-04 01:29:14.068', '2026-09-30 00:02:26.107'),
	('cmtp4y6p10000twurpiw9csd9', 'Agung123@gmail.com', 1234567, 'Agung Sumala', '2026-09-11 00:00:00.000', 'L', NULL, 'Agung suka baca buku Novel Romance', '$2b$10$h1LkWzZEZ2IFQKv28t44c.aw/f6h0eL2W8x4ojexvFb6veD1woGhe', 1, '2026-09-06 01:31:05.701', '2026-09-06 01:31:05.701'),
	('cmum3kr9p000qngur4jl67spr', 'eko.prasetyo@sekolah.sch.id', 19870001, 'Eko Prasetyo, M.Kom.', '1987-01-01 00:00:00.000', 'L', NULL, NULL, '$2b$10$tcBJG8RSlvnXBCqncqOoXOOXZbUn5X/ksTlOlhFQr/noBXQsbaHjO', 1, '2026-09-29 03:09:03.373', '2026-09-29 03:09:03.373');
/*!40000 ALTER TABLE `guru` ENABLE KEYS */;

-- Dumping structure for table cnedu.guru_mapel
CREATE TABLE IF NOT EXISTS `guru_mapel` (
  `guruId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mapelId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`guruId`,`mapelId`),
  KEY `guru_mapel_mapelId_fkey` (`mapelId`),
  CONSTRAINT `guru_mapel_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `guru` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `guru_mapel_mapelId_fkey` FOREIGN KEY (`mapelId`) REFERENCES `mata_pelajaran` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.guru_mapel: ~7 rows (approximately)
/*!40000 ALTER TABLE `guru_mapel` DISABLE KEYS */;
REPLACE INTO `guru_mapel` (`guruId`, `mapelId`) VALUES
	('cmum3kr9p000qngur4jl67spr', 'cmtgs9mlt001tfwurzsslwpj9'),
	('cmtma038400046surcedwrtid', 'cmtgs9mly001ufwura0z9j8ax'),
	('cmtp4y6p10000twurpiw9csd9', 'cmtgs9mly001ufwura0z9j8ax'),
	('cmum3kr9p000qngur4jl67spr', 'cmtgs9mly001ufwura0z9j8ax'),
	('cmtgs9n1r0028fwurptqymi3m', 'cmtgs9mmj001yfwurv9nxccc3'),
	('cmtma038400046surcedwrtid', 'cmtgs9mmo001zfwur99pfn5go'),
	('cmtma038400046surcedwrtid', 'cmtgs9mn50023fwur2gmp6dyz');
/*!40000 ALTER TABLE `guru_mapel` ENABLE KEYS */;

-- Dumping structure for table cnedu.jawaban_opsi_dipilih
CREATE TABLE IF NOT EXISTS `jawaban_opsi_dipilih` (
  `jawabanSiswaId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `opsiId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`jawabanSiswaId`,`opsiId`),
  KEY `jawaban_opsi_dipilih_opsiId_fkey` (`opsiId`),
  CONSTRAINT `jawaban_opsi_dipilih_jawabanSiswaId_fkey` FOREIGN KEY (`jawabanSiswaId`) REFERENCES `jawaban_siswa` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `jawaban_opsi_dipilih_opsiId_fkey` FOREIGN KEY (`opsiId`) REFERENCES `opsi_jawaban` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.jawaban_opsi_dipilih: ~5 rows (approximately)
/*!40000 ALTER TABLE `jawaban_opsi_dipilih` DISABLE KEYS */;
REPLACE INTO `jawaban_opsi_dipilih` (`jawabanSiswaId`, `opsiId`) VALUES
	('cmukrd88v00030wurlx58ul18', 'cmu9024eb00034surg7q3f537'),
	('cmukrd89800040wurw9gm9ku6', 'cmu9043ig00064sur9f24l8ay'),
	('cmukrd89c00050wurc7xzuqx0', 'cmu905nkx000a4surwo40054c'),
	('cmukrd89c00050wurc7xzuqx0', 'cmu905nkx000c4surjnn035pn'),
	('cmukrcj3m00010wur4klx8etu', 'cmuduj9ev0006tgurjiutja87');
/*!40000 ALTER TABLE `jawaban_opsi_dipilih` ENABLE KEYS */;

-- Dumping structure for table cnedu.jawaban_siswa
CREATE TABLE IF NOT EXISTS `jawaban_siswa` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `submissionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `soalId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jawabanEssay` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `jawaban_siswa_submissionId_soalId_key` (`submissionId`,`soalId`),
  KEY `jawaban_siswa_soalId_fkey` (`soalId`),
  CONSTRAINT `jawaban_siswa_soalId_fkey` FOREIGN KEY (`soalId`) REFERENCES `soal` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `jawaban_siswa_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `submission_asesmen` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.jawaban_siswa: ~5 rows (approximately)
/*!40000 ALTER TABLE `jawaban_siswa` DISABLE KEYS */;
REPLACE INTO `jawaban_siswa` (`id`, `submissionId`, `soalId`, `jawabanEssay`) VALUES
	('cmukrcj3m00010wur4klx8etu', 'cmukrcj3100000wurt6319uza', 'cmuduj9et0005tgurp8r8ahas', NULL),
	('cmukrd88v00030wurlx58ul18', 'cmukrd88r00020wurxx9r1cfw', 'cmu9024e500014surc51e6i9n', NULL),
	('cmukrd89800040wurw9gm9ku6', 'cmukrd88r00020wurxx9r1cfw', 'cmu9043hx00054sur975hfaef', NULL),
	('cmukrd89c00050wurc7xzuqx0', 'cmukrd88r00020wurxx9r1cfw', 'cmu905nkw00094surpjgb0uoz', NULL),
	('cmukrd89g00060wurlnoqyvch', 'cmukrd88r00020wurxx9r1cfw', 'cmu906who000d4surblpem7ee', 'hahaha');
/*!40000 ALTER TABLE `jawaban_siswa` ENABLE KEYS */;

-- Dumping structure for table cnedu.kelas
CREATE TABLE IF NOT EXISTS `kelas` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `judul` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kodeKelas` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kelas_kodeKelas_key` (`kodeKelas`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.kelas: ~5 rows (approximately)
/*!40000 ALTER TABLE `kelas` DISABLE KEYS */;
REPLACE INTO `kelas` (`id`, `judul`, `deskripsi`, `kodeKelas`, `createdAt`, `updatedAt`) VALUES
	('cmtgs9n67002afwurn6mwqf4e', 'Pemrograman Web - 12 PPLG 2', 'Kelas contoh hasil seed awal.', 'PPLG2-CONTOH', '2026-08-31 05:13:55.855', '2026-08-31 05:13:55.855'),
	('cmtk1d2cj000060ur3881w5zo', 'PPKN - 11 PPLG 1', 'PPKNNYA KELAS 11', '05AAB4E1', '2026-09-02 11:51:50.563', '2026-09-02 11:51:50.563'),
	('cmtk28hch000160urxhvshgfn', '11 DKV - SENBUD', NULL, 'C1548681', '2026-09-02 12:16:16.337', '2026-09-02 12:16:16.337'),
	('cmtp4zpci0001twur7znn3w3g', 'Bahasa Indonesia X DKV 2', 'Belajar Bahasa Indonesia bareng Pak Agung biar bisa jadi sastrawan terkenal', '8297719C', '2026-09-06 01:32:16.530', '2026-09-06 01:32:16.530'),
	('cmtshmcfg0001b4urbtdwm6ph', 'Senbud X TKJ 1', NULL, '538B11D8', '2026-09-08 09:49:06.796', '2026-09-08 09:49:06.796'),
	('cmtvavvek000130urghuztixr', 'Basis Data 12 PPLG 2', NULL, '14E10EEB', '2026-09-10 09:03:52.508', '2026-09-10 09:03:52.508');
/*!40000 ALTER TABLE `kelas` ENABLE KEYS */;

-- Dumping structure for table cnedu.kelas_guru
CREATE TABLE IF NOT EXISTS `kelas_guru` (
  `kelasId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guruId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mapelId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`kelasId`,`guruId`,`mapelId`),
  KEY `kelas_guru_guruId_fkey` (`guruId`),
  KEY `kelas_guru_mapelId_fkey` (`mapelId`),
  CONSTRAINT `kelas_guru_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `guru` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `kelas_guru_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `kelas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `kelas_guru_mapelId_fkey` FOREIGN KEY (`mapelId`) REFERENCES `mata_pelajaran` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.kelas_guru: ~2 rows (approximately)
/*!40000 ALTER TABLE `kelas_guru` DISABLE KEYS */;
REPLACE INTO `kelas_guru` (`kelasId`, `guruId`, `mapelId`) VALUES
	('cmtgs9n67002afwurn6mwqf4e', 'cmtgs9n1r0028fwurptqymi3m', 'cmtgs9mmj001yfwurv9nxccc3'),
	('cmtvavvek000130urghuztixr', 'cmtma038400046surcedwrtid', 'cmtgs9mmo001zfwur99pfn5go'),
	('cmtp4zpci0001twur7znn3w3g', 'cmtp4y6p10000twurpiw9csd9', 'cmtgs9mly001ufwura0z9j8ax');
/*!40000 ALTER TABLE `kelas_guru` ENABLE KEYS */;

-- Dumping structure for table cnedu.kelas_siswa
CREATE TABLE IF NOT EXISTS `kelas_siswa` (
  `kelasId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `siswaId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `joinedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`kelasId`,`siswaId`),
  KEY `kelas_siswa_siswaId_fkey` (`siswaId`),
  CONSTRAINT `kelas_siswa_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `kelas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `kelas_siswa_siswaId_fkey` FOREIGN KEY (`siswaId`) REFERENCES `siswa` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.kelas_siswa: ~6 rows (approximately)
/*!40000 ALTER TABLE `kelas_siswa` DISABLE KEYS */;
REPLACE INTO `kelas_siswa` (`kelasId`, `siswaId`, `joinedAt`) VALUES
	('cmtgs9n67002afwurn6mwqf4e', 'cmtgs9n5k0029fwuruc4h52ad', '2026-08-31 05:13:55.855'),
	('cmtgs9n67002afwurn6mwqf4e', 'cmtm8k7j500006surmdjyu5hx', '2026-09-04 00:48:53.537'),
	('cmtgs9n67002afwurn6mwqf4e', 'cmtm8w3g200036surrqzoum7v', '2026-09-08 09:57:34.112'),
	('cmtk28hch000160urxhvshgfn', 'cmtm8k7j500006surmdjyu5hx', '2026-09-06 01:03:45.422'),
	('cmtvavvek000130urghuztixr', 'cmtm8k7j500006surmdjyu5hx', '2026-09-10 09:04:11.330'),
	('cmtvavvek000130urghuztixr', 'cmtm8w3g200036surrqzoum7v', '2026-09-10 09:04:11.331');
/*!40000 ALTER TABLE `kelas_siswa` ENABLE KEYS */;

-- Dumping structure for table cnedu.laporan_lupa_password
CREATE TABLE IF NOT EXISTS `laporan_lupa_password` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipeAkun` enum('GURU','SISWA') COLLATE utf8mb4_unicode_ci NOT NULL,
  `guruId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `siswaId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nikNisInput` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggalLahir` datetime(3) NOT NULL,
  `alasan` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('MENUNGGU','DITERIMA','DITOLAK','SELESAI') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MENUNGGU',
  `otp` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `otpExpiredAt` datetime(3) DEFAULT NULL,
  `diprosesOlehId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `laporan_lupa_password_guruId_fkey` (`guruId`),
  KEY `laporan_lupa_password_siswaId_fkey` (`siswaId`),
  KEY `laporan_lupa_password_diprosesOlehId_fkey` (`diprosesOlehId`),
  CONSTRAINT `laporan_lupa_password_diprosesOlehId_fkey` FOREIGN KEY (`diprosesOlehId`) REFERENCES `admin` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `laporan_lupa_password_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `guru` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `laporan_lupa_password_siswaId_fkey` FOREIGN KEY (`siswaId`) REFERENCES `siswa` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.laporan_lupa_password: ~0 rows (approximately)
/*!40000 ALTER TABLE `laporan_lupa_password` DISABLE KEYS */;
/*!40000 ALTER TABLE `laporan_lupa_password` ENABLE KEYS */;

-- Dumping structure for table cnedu.mata_pelajaran
CREATE TABLE IF NOT EXISTS `mata_pelajaran` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mata_pelajaran_nama_key` (`nama`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.mata_pelajaran: ~12 rows (approximately)
/*!40000 ALTER TABLE `mata_pelajaran` DISABLE KEYS */;
REPLACE INTO `mata_pelajaran` (`id`, `nama`) VALUES
	('cmtgs9mmx0021fwur6z6aa686', 'Administrasi Infrastruktur Jaringan'),
	('cmtgs9mly001ufwura0z9j8ax', 'Bahasa Indonesia'),
	('cmtgs9mm4001vfwuri4nd9byj', 'Bahasa Inggris'),
	('cmtgs9mmo001zfwur99pfn5go', 'Basis Data'),
	('cmtgs9mn10022fwurnha89uve', 'Desain Grafis Percetakan'),
	('cmtgs9mms0020fwurg6craixz', 'Komputer dan Jaringan Dasar'),
	('cmtgs9mn50023fwur2gmp6dyz', 'Marketing Digital'),
	('cmtgs9mlt001tfwurzsslwpj9', 'Matematika'),
	('cmtgs9mn80024fwurl7xursr2', 'Otomatisasi Tata Kelola Perkantoran'),
	('cmtgs9mmj001yfwurv9nxccc3', 'Pemrograman Web dan Perangkat Bergerak'),
	('cmtgs9mma001wfwuru0rm8apz', 'Pendidikan Pancasila'),
	('cmtgs9mmf001xfwurfr3euetw', 'Produk Kreatif dan Kewirausahaan');
/*!40000 ALTER TABLE `mata_pelajaran` ENABLE KEYS */;

-- Dumping structure for table cnedu.materi
CREATE TABLE IF NOT EXISTS `materi` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kelasId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guruId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `judul` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipe` enum('PDF','LINK') COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `materi_kelasId_fkey` (`kelasId`),
  KEY `materi_guruId_fkey` (`guruId`),
  CONSTRAINT `materi_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `guru` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `materi_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `kelas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.materi: ~0 rows (approximately)
/*!40000 ALTER TABLE `materi` DISABLE KEYS */;
REPLACE INTO `materi` (`id`, `kelasId`, `guruId`, `judul`, `tipe`, `url`, `createdAt`, `updatedAt`) VALUES
	('cmudta4pl0000tgur681fac2w', 'cmtvavvek000130urghuztixr', 'cmtma038400046surcedwrtid', 'jj', 'PDF', '/uploads/materi/1790150321330-bqwqhk-Screenshot_2026-08-08_191342.pdf', '2026-09-23 07:58:42.009', '2026-09-23 07:58:42.009');
/*!40000 ALTER TABLE `materi` ENABLE KEYS */;

-- Dumping structure for table cnedu.opsi_jawaban
CREATE TABLE IF NOT EXISTS `opsi_jawaban` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `soalId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `teks` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `benar` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `opsi_jawaban_soalId_fkey` (`soalId`),
  CONSTRAINT `opsi_jawaban_soalId_fkey` FOREIGN KEY (`soalId`) REFERENCES `soal` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.opsi_jawaban: ~44 rows (approximately)
/*!40000 ALTER TABLE `opsi_jawaban` DISABLE KEYS */;
REPLACE INTO `opsi_jawaban` (`id`, `soalId`, `teks`, `benar`) VALUES
	('cmu9024ea00024sur6de36sn6', 'cmu9024e500014surc51e6i9n', 'Loh Masa SIh?', 0),
	('cmu9024eb00034surg7q3f537', 'cmu9024e500014surc51e6i9n', 'Learning Management System', 1),
	('cmu9024eb00044surz7zx9dt5', 'cmu9024e500014surc51e6i9n', 'Learning Management Source', 0),
	('cmu9043ig00064sur9f24l8ay', 'cmu9043hx00054sur975hfaef', 'Mengatur dan membuuat akun/kelas', 1),
	('cmu9043ig00074surhx2hagsk', 'cmu9043hx00054sur975hfaef', 'Untuk Mengisi tugas dan ujian', 0),
	('cmu9043ig00084surirbxvx55', 'cmu9043hx00054sur975hfaef', 'Untuk memantau', 0),
	('cmu905nkx000a4surwo40054c', 'cmu905nkw00094surpjgb0uoz', 'Memberi dan membuatkan Soal ujian', 1),
	('cmu905nkx000b4surc9299nez', 'cmu905nkw00094surpjgb0uoz', 'Membuat kelas dan mengatur akun siswa', 0),
	('cmu905nkx000c4surjnn035pn', 'cmu905nkw00094surpjgb0uoz', 'Memberi materi untuk siswa', 1),
	('cmuduj9ev0006tgurjiutja87', 'cmuduj9et0005tgurp8r8ahas', 'Learning management system', 1),
	('cmuduj9ev0007tguri73gaj4g', 'cmuduj9et0005tgurp8r8ahas', 'lol', 0),
	('cmuduj9ev0008tgur4b4q3sd5', 'cmuduj9et0005tgurp8r8ahas', 'hjjh', 0),
	('cmum3crmf0002ngurak8a5msj', 'cmum3crma0001ngurae9vjscf', 'Microsoft Excel', 0),
	('cmum3crmf0003ngurhph5n2ob', 'cmum3crma0001ngurae9vjscf', 'Microsoft Access', 0),
	('cmum3crmf0004ngurjg1e7eru', 'cmum3crma0001ngurae9vjscf', 'Microsoft Word', 1),
	('cmum3crmf0005ngurtmak2b57', 'cmum3crma0001ngurae9vjscf', 'Microsoft PowerPoint', 0),
	('cmum3crmy0007ngurz691jlky', 'cmum3crmw0006ngurnk5v5edy', 'Menyalin teks (Copy)', 0),
	('cmum3crmy0008ngur2ipuzjr2', 'cmum3crmw0006ngurnk5v5edy', 'Menebalkan teks (Bold)', 1),
	('cmum3crmy0009ngur10nar471', 'cmum3crmw0006ngurnk5v5edy', 'Mencetak dokumen (Print)', 0),
	('cmum3crmy000angurd2un2gwm', 'cmum3crmw0006ngurnk5v5edy', 'Menyimpan dokumen (Save)', 0),
	('cmum3crng000cngur3f0h5kpr', 'cmum3crn0000bngurtgtw48f4', 'Margins', 1),
	('cmum3crnh000dngurv3xs7xjk', 'cmum3crn0000bngurtgtw48f4', 'Tabel', 0),
	('cmum3crnh000engurt1b2cw80', 'cmum3crn0000bngurtgtw48f4', 'Orientation', 1),
	('cmum3crnh000fngur5gbntghb', 'cmum3crn0000bngurtgtw48f4', 'Clip Art', 0),
	('cmum3crnl000hngurnsp89qqc', 'cmum3crnj000gngurqoqo6knu', '.xls', 0),
	('cmum3crnl000ingurgcfdl0yj', 'cmum3crnj000gngurqoqo6knu', '.docx', 1),
	('cmum3crnl000jngurjv3xbcgk', 'cmum3crnj000gngurqoqo6knu', '.pptx', 0),
	('cmum3crnl000knguruzergma3', 'cmum3crnj000gngurqoqo6knu', '.txt', 0),
	('cmum3o0h9000tnguryrz0myb9', 'cmum3o0h6000sngurirhue7rw', 'Microsoft Excel', 0),
	('cmum3o0h9000ungurwify7s82', 'cmum3o0h6000sngurirhue7rw', 'Microsoft Access', 0),
	('cmum3o0h9000vngurvkpiv6s8', 'cmum3o0h6000sngurirhue7rw', 'Microsoft Word', 1),
	('cmum3o0h9000wngurtriz1gjz', 'cmum3o0h6000sngurirhue7rw', 'Microsoft PowerPoint', 0),
	('cmum3o0hd000yngureedslm9t', 'cmum3o0hb000xngur9wdi3i7c', 'Menyalin teks (Copy)', 0),
	('cmum3o0hd000zngurp3kd54eo', 'cmum3o0hb000xngur9wdi3i7c', 'Menebalkan teks (Bold)', 1),
	('cmum3o0hd0010ngurmqtc1jlc', 'cmum3o0hb000xngur9wdi3i7c', 'Mencetak dokumen (Print)', 0),
	('cmum3o0hd0011ngurobdesp1f', 'cmum3o0hb000xngur9wdi3i7c', 'Menyimpan dokumen (Save)', 0),
	('cmum3o0hg0013nguresjmloef', 'cmum3o0he0012ngurvv1bj1w4', 'Margins', 1),
	('cmum3o0hh0014ngurmyqh16af', 'cmum3o0he0012ngurvv1bj1w4', 'Tabel', 0),
	('cmum3o0hh0015ngur79cwr0vo', 'cmum3o0he0012ngurvv1bj1w4', 'Orientation', 1),
	('cmum3o0hh0016ngur8z0p6epo', 'cmum3o0he0012ngurvv1bj1w4', 'Clip Art', 0),
	('cmum3o0hj0018ngursized5io', 'cmum3o0hi0017ngurs0ybqz5y', '.xls', 0),
	('cmum3o0hj0019ngurp8nwth7w', 'cmum3o0hi0017ngurs0ybqz5y', '.docx', 1),
	('cmum3o0hj001angurbnptva7k', 'cmum3o0hi0017ngurs0ybqz5y', '.pptx', 0),
	('cmum3o0hj001bngurogogm2wb', 'cmum3o0hi0017ngurs0ybqz5y', '.txt', 0);
/*!40000 ALTER TABLE `opsi_jawaban` ENABLE KEYS */;

-- Dumping structure for table cnedu.pengumuman
CREATE TABLE IF NOT EXISTS `pengumuman` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kelasId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guruId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isi` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `gambar` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `pengumuman_kelasId_fkey` (`kelasId`),
  KEY `pengumuman_guruId_fkey` (`guruId`),
  CONSTRAINT `pengumuman_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `guru` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `pengumuman_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `kelas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.pengumuman: ~0 rows (approximately)
/*!40000 ALTER TABLE `pengumuman` DISABLE KEYS */;
REPLACE INTO `pengumuman` (`id`, `kelasId`, `guruId`, `isi`, `gambar`, `createdAt`, `updatedAt`) VALUES
	('cmtvaxkeq000230urgjqqznqy', 'cmtvavvek000130urghuztixr', 'cmtma038400046surcedwrtid', 'Test Pengumuman', NULL, '2026-09-10 09:05:11.570', '2026-09-10 09:20:12.852'),
	('cmuncgv2c0000m0urkuvudmto', 'cmtvavvek000130urghuztixr', 'cmtma038400046surcedwrtid', 'Woi kerjain ya', NULL, '2026-09-30 00:05:44.388', '2026-09-30 00:05:44.388');
/*!40000 ALTER TABLE `pengumuman` ENABLE KEYS */;

-- Dumping structure for table cnedu.rombel_akademik
CREATE TABLE IF NOT EXISTS `rombel_akademik` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenjang` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `angkatan` int(11) DEFAULT NULL,
  `jurusan` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `variasi` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rombel_akademik_label_key` (`label`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.rombel_akademik: ~65 rows (approximately)
/*!40000 ALTER TABLE `rombel_akademik` DISABLE KEYS */;
REPLACE INTO `rombel_akademik` (`id`, `label`, `jenjang`, `angkatan`, `jurusan`, `variasi`) VALUES
	('cmtgs9mdc0000fwurt95zfg47', 'SMP', 'SMP', NULL, NULL, NULL),
	('cmtgs9mdo0001fwurrp9e4tq3', 'SMA', 'SMA', NULL, NULL, NULL),
	('cmtgs9me00002fwurzqy42v2i', '10 DKV PLUS', 'SMK', 10, 'DKV', 'PLUS'),
	('cmtgs9me70003fwurwy2lcpo0', '10 DKV 1', 'SMK', 10, 'DKV', '1'),
	('cmtgs9mee0004fwurugb3lr0z', '10 DKV 2', 'SMK', 10, 'DKV', '2'),
	('cmtgs9mej0005fwurzjydkx3h', '10 TJKT PLUS', 'SMK', 10, 'TJKT', 'PLUS'),
	('cmtgs9mep0006fwurcixrb0le', '10 TJKT 1', 'SMK', 10, 'TJKT', '1'),
	('cmtgs9meu0007fwurnwwrx4gr', '10 TJKT 2', 'SMK', 10, 'TJKT', '2'),
	('cmtgs9mf20008fwurbo5rjjaa', '10 TJKT 3', 'SMK', 10, 'TJKT', '3'),
	('cmtgs9mf70009fwurgom1km4o', '10 TJKT 4', 'SMK', 10, 'TJKT', '4'),
	('cmtgs9mfd000afwurxiwk549g', '10 TJKT 5', 'SMK', 10, 'TJKT', '5'),
	('cmtgs9mfk000bfwurd6tpxvma', '10 PPLG 1', 'SMK', 10, 'PPLG', '1'),
	('cmtgs9mfo000cfwur0smwc6m7', '10 PPLG 2', 'SMK', 10, 'PPLG', '2'),
	('cmtgs9mfs000dfwure9xo0765', '10 PEMASARAN 1', 'SMK', 10, 'PEMASARAN', '1'),
	('cmtgs9mfx000efwurxx4oz4rr', '10 PEMASARAN 2', 'SMK', 10, 'PEMASARAN', '2'),
	('cmtgs9mg2000ffwur7uz0gffb', '10 MPLB PLUS', 'SMK', 10, 'MPLB', 'PLUS'),
	('cmtgs9mg7000gfwurewy6a9v0', '10 MPLB 1', 'SMK', 10, 'MPLB', '1'),
	('cmtgs9mgc000hfwurnrdgcmnf', '10 MPLB 2', 'SMK', 10, 'MPLB', '2'),
	('cmtgs9mgg000ifwuru50cc8qk', '10 MPLB 3', 'SMK', 10, 'MPLB', '3'),
	('cmtgs9mgl000jfwur17q3zab4', '10 MPLB 4', 'SMK', 10, 'MPLB', '4'),
	('cmtgs9mgq000kfwurkc05vzh7', '10 MPLB 5', 'SMK', 10, 'MPLB', '5'),
	('cmtgs9mgv000lfwurrfkr2rt0', '11 DKV PLUS', 'SMK', 11, 'DKV', 'PLUS'),
	('cmtgs9mh0000mfwurauswmqvt', '11 DKV 1', 'SMK', 11, 'DKV', '1'),
	('cmtgs9mh5000nfwur3pte4dlc', '11 DKV 2', 'SMK', 11, 'DKV', '2'),
	('cmtgs9mhb000ofwurwpx0tdln', '11 TJKT PLUS', 'SMK', 11, 'TJKT', 'PLUS'),
	('cmtgs9mhk000pfwurvte9odct', '11 TJKT 1', 'SMK', 11, 'TJKT', '1'),
	('cmtgs9mhq000qfwurbx3lx0a3', '11 TJKT 2', 'SMK', 11, 'TJKT', '2'),
	('cmtgs9mhx000rfwur5rataba8', '11 TJKT 3', 'SMK', 11, 'TJKT', '3'),
	('cmtgs9mi2000sfwur8sadxozc', '11 TJKT 4', 'SMK', 11, 'TJKT', '4'),
	('cmtgs9mi7000tfwurd717ie3u', '11 TJKT 5', 'SMK', 11, 'TJKT', '5'),
	('cmtgs9mib000ufwur8t84rvf3', '11 TJKT 6', 'SMK', 11, 'TJKT', '6'),
	('cmtgs9mif000vfwurlh1zheeg', '11 TJKT 7', 'SMK', 11, 'TJKT', '7'),
	('cmtgs9mik000wfwuri9rewikw', '11 PPLG 1', 'SMK', 11, 'PPLG', '1'),
	('cmtgs9mip000xfwurmdqkpmpk', '11 PPLG 2', 'SMK', 11, 'PPLG', '2'),
	('cmtgs9miv000yfwur4zmzm9mw', '11 PEMASARAN 1', 'SMK', 11, 'PEMASARAN', '1'),
	('cmtgs9mj1000zfwurgn5knnut', '11 PEMASARAN 2', 'SMK', 11, 'PEMASARAN', '2'),
	('cmtgs9mj70010fwurbpo31m87', '11 PEMASARAN 3', 'SMK', 11, 'PEMASARAN', '3'),
	('cmtgs9mjb0011fwuretlqazxs', '11 MPLB PLUS', 'SMK', 11, 'MPLB', 'PLUS'),
	('cmtgs9mjf0012fwure3e435f7', '11 MPLB 1', 'SMK', 11, 'MPLB', '1'),
	('cmtgs9mjj0013fwurky576xhz', '11 MPLB 2', 'SMK', 11, 'MPLB', '2'),
	('cmtgs9mjm0014fwurqouev6vd', '11 MPLB 3', 'SMK', 11, 'MPLB', '3'),
	('cmtgs9mjp0015fwurh4todny0', '11 MPLB 4', 'SMK', 11, 'MPLB', '4'),
	('cmtgs9mjs0016fwur96f5uyeb', '11 MPLB 5', 'SMK', 11, 'MPLB', '5'),
	('cmtgs9mjv0017fwur8r7s8wzd', '12 DKV PLUS', 'SMK', 12, 'DKV', 'PLUS'),
	('cmtgs9mjy0018fwuro2zjwe47', '12 DKV 1', 'SMK', 12, 'DKV', '1'),
	('cmtgs9mk20019fwurt22uy2ov', '12 DKV 2', 'SMK', 12, 'DKV', '2'),
	('cmtgs9mk5001afwurpfqg7gez', '12 TJKT PLUS', 'SMK', 12, 'TJKT', 'PLUS'),
	('cmtgs9mk7001bfwurz2zjtnty', '12 TJKT 1', 'SMK', 12, 'TJKT', '1'),
	('cmtgs9mkb001cfwure61tuo56', '12 TJKT 2', 'SMK', 12, 'TJKT', '2'),
	('cmtgs9mkd001dfwurd45rq5mq', '12 TJKT 3', 'SMK', 12, 'TJKT', '3'),
	('cmtgs9mkg001efwurqdlup6bn', '12 TJKT 4', 'SMK', 12, 'TJKT', '4'),
	('cmtgs9mki001ffwurhe6rvvn2', '12 TJKT 5', 'SMK', 12, 'TJKT', '5'),
	('cmtgs9mkl001gfwursns3hp3t', '12 TJKT 6', 'SMK', 12, 'TJKT', '6'),
	('cmtgs9mko001hfwurmtqx0u6u', '12 TJKT 7', 'SMK', 12, 'TJKT', '7'),
	('cmtgs9mkr001ifwurr4mlvkx8', '12 PPLG 1', 'SMK', 12, 'PPLG', '1'),
	('cmtgs9mkt001jfwursm80gnf3', '12 PPLG 2', 'SMK', 12, 'PPLG', '2'),
	('cmtgs9mkx001kfwur2c9t3pz7', '12 PEMASARAN 1', 'SMK', 12, 'PEMASARAN', '1'),
	('cmtgs9ml0001lfwur5kypaiud', '12 PEMASARAN 2', 'SMK', 12, 'PEMASARAN', '2'),
	('cmtgs9ml3001mfwurnqcrg8o9', '12 PEMASARAN 3', 'SMK', 12, 'PEMASARAN', '3'),
	('cmtgs9ml7001nfwurzchp7y20', '12 MPLB PLUS', 'SMK', 12, 'MPLB', 'PLUS'),
	('cmtgs9mla001ofwur9h70b1rr', '12 MPLB 1', 'SMK', 12, 'MPLB', '1'),
	('cmtgs9mld001pfwuriv4rumyk', '12 MPLB 2', 'SMK', 12, 'MPLB', '2'),
	('cmtgs9mlg001qfwurcoa4s3zp', '12 MPLB 3', 'SMK', 12, 'MPLB', '3'),
	('cmtgs9mlj001rfwurzzl8btx6', '12 MPLB 4', 'SMK', 12, 'MPLB', '4'),
	('cmtgs9mll001sfwurp367nozt', '12 MPLB 5', 'SMK', 12, 'MPLB', '5');
/*!40000 ALTER TABLE `rombel_akademik` ENABLE KEYS */;

-- Dumping structure for table cnedu.siswa
CREATE TABLE IF NOT EXISTS `siswa` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nis` bigint(20) NOT NULL,
  `nisn` bigint(20) DEFAULT NULL,
  `nama` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggalLahir` datetime(3) NOT NULL,
  `jenisKelamin` enum('L','P') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fotoProfil` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordSementara` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `rombelId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `siswa_email_key` (`email`),
  UNIQUE KEY `siswa_nis_key` (`nis`),
  UNIQUE KEY `siswa_nisn_key` (`nisn`),
  KEY `siswa_rombelId_fkey` (`rombelId`),
  CONSTRAINT `siswa_rombelId_fkey` FOREIGN KEY (`rombelId`) REFERENCES `rombel_akademik` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.siswa: ~8 rows (approximately)
/*!40000 ALTER TABLE `siswa` DISABLE KEYS */;
REPLACE INTO `siswa` (`id`, `email`, `nis`, `nisn`, `nama`, `tanggalLahir`, `jenisKelamin`, `fotoProfil`, `deskripsi`, `password`, `passwordSementara`, `createdAt`, `updatedAt`, `rombelId`) VALUES
	('cmtgs9n5k0029fwuruc4h52ad', 'siswa.contoh@cnedu.sch.id', 2425010001, NULL, 'Siswa Contoh', '2008-05-10 00:00:00.000', 'P', NULL, NULL, '$2b$10$89MGUYcYbzCY8Sq77zkFbumWsZ87SPYxqGcLo7sFGe4rgJeXMaSx2', 0, '2026-08-31 05:13:55.832', '2026-09-08 10:22:11.596', 'cmtgs9mkt001jfwursm80gnf3'),
	('cmtm8k7j500006surmdjyu5hx', 'adip@gmail.com', 1234567, NULL, 'Adip', '2026-09-18 00:00:00.000', 'L', NULL, 'Chinese boy', '$2b$10$imWmdLaMXTCoYcJjQ6I1Ceg2nQSup1KWyrAgBhYwDz4Om02KNu.Ra', 0, '2026-09-04 00:48:53.537', '2026-09-25 23:57:31.275', 'cmtgs9mkt001jfwursm80gnf3'),
	('cmtm8w3g200036surrqzoum7v', 'Kazka@gmail.com', 22334455, NULL, 'Kazka', '2026-09-30 00:00:00.000', 'L', NULL, 'Kazka 1233', '$2b$10$5A3cW3q5DkJ4XHqkfpSg..d7ZL1TIEkmdxPER/dxCz/LBPMK7mfcW', 1, '2026-09-04 00:58:08.114', '2026-09-04 00:58:08.114', 'cmtgs9mkt001jfwursm80gnf3'),
	('cmtshlazn0000b4urckfpus1n', 'Bayu@gmail.com', 99999999, NULL, 'Bayu Prasetya', '2026-08-31 00:00:00.000', 'L', NULL, NULL, '$2b$10$.YZX1.Vm4tSgfprkDE.zzuQyQ6ZLHzbo.BLKnNoyjKKH8aPJTIBFm', 1, '2026-09-08 09:48:18.275', '2026-09-08 09:48:18.275', 'cmtgs9meu0007fwurnwwrx4gr'),
	('cmueqds5s000114ur95naobsa', 'Fadil@gmail.com', 23456, NULL, 'Fadil', '2026-09-24 00:00:00.000', 'L', NULL, 'hahaha', '$2b$10$NYMrQ7Zcm8tOC8X3akJwE.rdJuPyi8i7SdUkdWmKl6kGmeIz.koLy', 1, '2026-09-23 23:25:19.696', '2026-09-23 23:25:19.696', 'cmtgs9mkt001jfwursm80gnf3'),
	('cmum3kqvp000mngurkp7pz8lj', 'budi.santoso@sekolah.sch.id', 1234, NULL, 'Budi Santoso', '2010-01-01 00:00:00.000', 'L', NULL, NULL, '$2b$10$shZ3AAWu/82aSBJrg9/kXefXRbp6TL1hWL.yuYpZQTBnpXyStV1we', 1, '2026-09-29 03:09:02.869', '2026-09-29 03:09:02.869', 'cmtgs9mkr001ifwurr4mlvkx8'),
	('cmum3kqzc000nngur4zqwqtpy', 'siti.aminah@sekolah.sch.id', 5678, NULL, 'Siti Aminah', '2010-05-12 00:00:00.000', 'P', NULL, NULL, '$2b$10$axuPE4pTvqWB5SSKy9/li.JNbNLhBe1CJKmhnkYELX6zl2V87BS7W', 1, '2026-09-29 03:09:03.000', '2026-09-29 03:09:03.000', 'cmtgs9mkr001ifwurr4mlvkx8'),
	('cmum3kr2v000ongur9k788ith', 'ahmad.dani@sekolah.sch.id', 9876, NULL, 'Ahmad Dani', '2009-11-23 00:00:00.000', 'L', NULL, NULL, '$2b$10$pvs0O.h004tNw81nDfugjOlzPRc9WxapZ6aw3OHzbi4WmpPGEZg9a', 1, '2026-09-29 03:09:03.127', '2026-09-29 03:09:03.127', 'cmtgs9mkt001jfwursm80gnf3'),
	('cmum3kr65000pngurz7cqfsue', 'riri.lestari@sekolah.sch.id', 4321, NULL, 'Riri Lestari', '2010-08-15 00:00:00.000', 'P', NULL, NULL, '$2b$10$wAWGjbI/29zjTDgN5Gs/y.wjFrOjgbHBT4elxKLgNTJA5ylh8T8Le', 1, '2026-09-29 03:09:03.245', '2026-09-29 03:09:03.245', 'cmtgs9mik000wfwuri9rewikw');
/*!40000 ALTER TABLE `siswa` ENABLE KEYS */;

-- Dumping structure for table cnedu.soal
CREATE TABLE IF NOT EXISTS `soal` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `asesmenId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipe` enum('PILIHAN_GANDA','CHECKBOX','ESSAY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `pertanyaan` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `gambar` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `urutan` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `soal_asesmenId_fkey` (`asesmenId`),
  CONSTRAINT `soal_asesmenId_fkey` FOREIGN KEY (`asesmenId`) REFERENCES `asesmen` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.soal: ~13 rows (approximately)
/*!40000 ALTER TABLE `soal` DISABLE KEYS */;
REPLACE INTO `soal` (`id`, `asesmenId`, `tipe`, `pertanyaan`, `gambar`, `urutan`) VALUES
	('cmu9024e500014surc51e6i9n', 'cmu8zzzx500004sur356fpw2j', 'PILIHAN_GANDA', 'Apa kepanjangan LMS?', NULL, 0),
	('cmu9043hx00054sur975hfaef', 'cmu8zzzx500004sur356fpw2j', 'PILIHAN_GANDA', 'Apa role admin dalam projec LMS?', NULL, 1),
	('cmu905nkw00094surpjgb0uoz', 'cmu8zzzx500004sur356fpw2j', 'CHECKBOX', 'Fungsi role guru pada project LMS', NULL, 2),
	('cmu906who000d4surblpem7ee', 'cmu8zzzx500004sur356fpw2j', 'ESSAY', 'Jelaskan apa database yang kamu gunakan dalam project pembuatan LMS!', NULL, 3),
	('cmuduj9et0005tgurp8r8ahas', 'cmuduhym70004tgurhhd8squn', 'PILIHAN_GANDA', 'Apa itu LMS?', NULL, 0),
	('cmum3crma0001ngurae9vjscf', 'cmum3crl20000ngur111q110l', 'PILIHAN_GANDA', 'Perangkat lunak pengolah kata (word processor) keluaran Microsoft yang paling banyak digunakan adalah...', NULL, 0),
	('cmum3crmw0006ngurnk5v5edy', 'cmum3crl20000ngur111q110l', 'PILIHAN_GANDA', 'Tombol kombinasi pada keyboard (shortcut) Ctrl + B di dalam Microsoft Word berfungsi untuk...', NULL, 1),
	('cmum3crn0000bngurtgtw48f4', 'cmum3crl20000ngur111q110l', 'CHECKBOX', 'Manakah di antara fitur berikut yang dapat ditemukan di dalam menu Layout / Page Layout pada Microsoft Word? (Pilih dua jawaban benar)', NULL, 2),
	('cmum3crnj000gngurqoqo6knu', 'cmum3crl20000ngur111q110l', 'PILIHAN_GANDA', 'Ekstensi atau format standar penyimpanan file dokumen pada Microsoft Word versi terbaru (2007 ke atas) adalah...', NULL, 3),
	('cmum3crnn000lngurbdnjcxjj', 'cmum3crl20000ngur111q110l', 'ESSAY', 'Jelaskan perbedaan mendasar fungsi antara perintah \'Save\' dan \'Save As\' pada saat Anda bekerja menggunakan Microsoft Word!', NULL, 4),
	('cmum3o0h6000sngurirhue7rw', 'cmum3o0h4000rngurpeswcnrh', 'PILIHAN_GANDA', 'Perangkat lunak pengolah kata (word processor) keluaran Microsoft yang paling banyak digunakan adalah...', NULL, 0),
	('cmum3o0hb000xngur9wdi3i7c', 'cmum3o0h4000rngurpeswcnrh', 'PILIHAN_GANDA', 'Tombol kombinasi pada keyboard (shortcut) Ctrl + B di dalam Microsoft Word berfungsi untuk...', NULL, 1),
	('cmum3o0he0012ngurvv1bj1w4', 'cmum3o0h4000rngurpeswcnrh', 'CHECKBOX', 'Manakah di antara fitur berikut yang dapat ditemukan di dalam menu Layout / Page Layout pada Microsoft Word? (Pilih dua jawaban benar)', NULL, 2),
	('cmum3o0hi0017ngurs0ybqz5y', 'cmum3o0h4000rngurpeswcnrh', 'PILIHAN_GANDA', 'Ekstensi atau format standar penyimpanan file dokumen pada Microsoft Word versi terbaru (2007 ke atas) adalah...', NULL, 3),
	('cmum3o0hk001cnguravvze819', 'cmum3o0h4000rngurpeswcnrh', 'ESSAY', 'Jelaskan perbedaan mendasar fungsi antara perintah \'Save\' dan \'Save As\' pada saat Anda bekerja menggunakan Microsoft Word!', NULL, 4);
/*!40000 ALTER TABLE `soal` ENABLE KEYS */;

-- Dumping structure for table cnedu.submission_asesmen
CREATE TABLE IF NOT EXISTS `submission_asesmen` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `asesmenId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `siswaId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kelasId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `waktuMulai` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `waktuSelesai` datetime(3) DEFAULT NULL,
  `nilai` double DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `submission_asesmen_asesmenId_siswaId_key` (`asesmenId`,`siswaId`),
  KEY `submission_asesmen_siswaId_fkey` (`siswaId`),
  CONSTRAINT `submission_asesmen_asesmenId_fkey` FOREIGN KEY (`asesmenId`) REFERENCES `asesmen` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `submission_asesmen_siswaId_fkey` FOREIGN KEY (`siswaId`) REFERENCES `siswa` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.submission_asesmen: ~2 rows (approximately)
/*!40000 ALTER TABLE `submission_asesmen` DISABLE KEYS */;
REPLACE INTO `submission_asesmen` (`id`, `asesmenId`, `siswaId`, `kelasId`, `waktuMulai`, `waktuSelesai`, `nilai`, `createdAt`) VALUES
	('cmukrcj3100000wurt6319uza', 'cmuduhym70004tgurhhd8squn', 'cmtm8k7j500006surmdjyu5hx', 'cmtvavvek000130urghuztixr', '2026-09-28 04:38:57.949', '2026-09-28 04:38:57.880', 100, '2026-09-28 04:38:57.949'),
	('cmukrd88r00020wurxx9r1cfw', 'cmu8zzzx500004sur356fpw2j', 'cmtm8k7j500006surmdjyu5hx', 'cmtvavvek000130urghuztixr', '2026-09-28 04:39:30.555', '2026-09-28 04:39:30.543', 67, '2026-09-28 04:39:30.555');
/*!40000 ALTER TABLE `submission_asesmen` ENABLE KEYS */;

-- Dumping structure for table cnedu.submission_tugas
CREATE TABLE IF NOT EXISTS `submission_tugas` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tugasId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `siswaId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileUrl` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `waktuKumpul` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `submission_tugas_tugasId_siswaId_key` (`tugasId`,`siswaId`),
  KEY `submission_tugas_siswaId_fkey` (`siswaId`),
  CONSTRAINT `submission_tugas_siswaId_fkey` FOREIGN KEY (`siswaId`) REFERENCES `siswa` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `submission_tugas_tugasId_fkey` FOREIGN KEY (`tugasId`) REFERENCES `tugas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.submission_tugas: ~0 rows (approximately)
/*!40000 ALTER TABLE `submission_tugas` DISABLE KEYS */;
REPLACE INTO `submission_tugas` (`id`, `tugasId`, `siswaId`, `fileUrl`, `waktuKumpul`) VALUES
	('cmukp992p0000lcurzb423u0t', 'cmu9od5sc0000swur0ahk8otw', 'cmtm8k7j500006surmdjyu5hx', '/uploads/jawaban-tugas/1790566822944-bati8r-Screenshot_2026-08-08_191342.pdf', '2026-09-28 03:40:25.778');
/*!40000 ALTER TABLE `submission_tugas` ENABLE KEYS */;

-- Dumping structure for table cnedu.tugas
CREATE TABLE IF NOT EXISTS `tugas` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guruId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `judul` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipeLampiran` enum('PDF','LINK') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lampiran` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tugas_guruId_fkey` (`guruId`),
  CONSTRAINT `tugas_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `guru` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.tugas: ~1 rows (approximately)
/*!40000 ALTER TABLE `tugas` DISABLE KEYS */;
REPLACE INTO `tugas` (`id`, `guruId`, `judul`, `deskripsi`, `tipeLampiran`, `lampiran`, `createdAt`, `updatedAt`) VALUES
	('cmu9od5sc0000swur0ahk8otw', 'cmtma038400046surcedwrtid', 'Tugas TEST', 'ahaha', 'PDF', '/uploads/lampiran-tugas/1789996343247-mvvvfl-Screenshot_2026-08-08_191342.pdf', '2026-09-20 10:30:00.588', '2026-09-21 13:12:39.750');
/*!40000 ALTER TABLE `tugas` ENABLE KEYS */;

-- Dumping structure for table cnedu.tugas_kelas
CREATE TABLE IF NOT EXISTS `tugas_kelas` (
  `tugasId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kelasId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dikirimAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`tugasId`,`kelasId`),
  KEY `tugas_kelas_kelasId_fkey` (`kelasId`),
  CONSTRAINT `tugas_kelas_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `kelas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tugas_kelas_tugasId_fkey` FOREIGN KEY (`tugasId`) REFERENCES `tugas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu.tugas_kelas: ~2 rows (approximately)
/*!40000 ALTER TABLE `tugas_kelas` DISABLE KEYS */;
REPLACE INTO `tugas_kelas` (`tugasId`, `kelasId`, `dikirimAt`) VALUES
	('cmu9od5sc0000swur0ahk8otw', 'cmtvavvek000130urghuztixr', '2026-09-23 08:19:52.238');
/*!40000 ALTER TABLE `tugas_kelas` ENABLE KEYS */;

-- Dumping structure for table cnedu._prisma_migrations
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table cnedu._prisma_migrations: ~0 rows (approximately)
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
REPLACE INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
	('1fffc47c-bfc3-41ec-bcc8-acce8e8b71cc', '64f04dc1bd391579050a1460d0babf96db6d9709e3674cd5b3802fdc111998ad', '2026-08-31 05:10:17.082', '20260831051016_init', NULL, NULL, '2026-08-31 05:10:16.047', 1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
