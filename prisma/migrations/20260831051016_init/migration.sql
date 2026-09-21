-- CreateTable
CREATE TABLE `admin` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'KEPSEK', 'KURIKULUM') NOT NULL,
    `fotoProfil` VARCHAR(191) NULL,
    `deskripsi` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guru` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `nik` BIGINT NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `tanggalLahir` DATETIME(3) NOT NULL,
    `jenisKelamin` ENUM('L', 'P') NULL,
    `fotoProfil` VARCHAR(191) NULL,
    `deskripsi` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `passwordSementara` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `guru_email_key`(`email`),
    UNIQUE INDEX `guru_nik_key`(`nik`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `siswa` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `nis` BIGINT NOT NULL,
    `nisn` BIGINT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `tanggalLahir` DATETIME(3) NOT NULL,
    `jenisKelamin` ENUM('L', 'P') NULL,
    `fotoProfil` VARCHAR(191) NULL,
    `deskripsi` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `passwordSementara` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `rombelId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `siswa_email_key`(`email`),
    UNIQUE INDEX `siswa_nis_key`(`nis`),
    UNIQUE INDEX `siswa_nisn_key`(`nisn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rombel_akademik` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `jenjang` VARCHAR(191) NOT NULL,
    `angkatan` INTEGER NULL,
    `jurusan` VARCHAR(191) NULL,
    `variasi` VARCHAR(191) NULL,

    UNIQUE INDEX `rombel_akademik_label_key`(`label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mata_pelajaran` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `mata_pelajaran_nama_key`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guru_mapel` (
    `guruId` VARCHAR(191) NOT NULL,
    `mapelId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`guruId`, `mapelId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kelas` (
    `id` VARCHAR(191) NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NULL,
    `kodeKelas` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kelas_kodeKelas_key`(`kodeKelas`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kelas_siswa` (
    `kelasId` VARCHAR(191) NOT NULL,
    `siswaId` VARCHAR(191) NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`kelasId`, `siswaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kelas_guru` (
    `kelasId` VARCHAR(191) NOT NULL,
    `guruId` VARCHAR(191) NOT NULL,
    `mapelId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`kelasId`, `guruId`, `mapelId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengumuman` (
    `id` VARCHAR(191) NOT NULL,
    `kelasId` VARCHAR(191) NOT NULL,
    `guruId` VARCHAR(191) NOT NULL,
    `isi` TEXT NOT NULL,
    `gambar` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asesmen` (
    `id` VARCHAR(191) NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `tipe` ENUM('KUIS', 'UJIAN') NOT NULL,
    `status` ENUM('PROSES', 'SELESAI') NOT NULL DEFAULT 'PROSES',
    `durasiMenit` INTEGER NULL,
    `mapelId` VARCHAR(191) NOT NULL,
    `guruId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asesmen_kelas` (
    `asesmenId` VARCHAR(191) NOT NULL,
    `kelasId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`asesmenId`, `kelasId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `soal` (
    `id` VARCHAR(191) NOT NULL,
    `asesmenId` VARCHAR(191) NOT NULL,
    `tipe` ENUM('PILIHAN_GANDA', 'CHECKBOX', 'ESSAY') NOT NULL,
    `pertanyaan` TEXT NOT NULL,
    `gambar` VARCHAR(191) NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `opsi_jawaban` (
    `id` VARCHAR(191) NOT NULL,
    `soalId` VARCHAR(191) NOT NULL,
    `teks` VARCHAR(191) NOT NULL,
    `benar` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `submission_asesmen` (
    `id` VARCHAR(191) NOT NULL,
    `asesmenId` VARCHAR(191) NOT NULL,
    `siswaId` VARCHAR(191) NOT NULL,
    `kelasId` VARCHAR(191) NOT NULL,
    `waktuMulai` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `waktuSelesai` DATETIME(3) NULL,
    `nilai` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `submission_asesmen_asesmenId_siswaId_key`(`asesmenId`, `siswaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jawaban_siswa` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `soalId` VARCHAR(191) NOT NULL,
    `jawabanEssay` TEXT NULL,

    UNIQUE INDEX `jawaban_siswa_submissionId_soalId_key`(`submissionId`, `soalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jawaban_opsi_dipilih` (
    `jawabanSiswaId` VARCHAR(191) NOT NULL,
    `opsiId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`jawabanSiswaId`, `opsiId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `materi` (
    `id` VARCHAR(191) NOT NULL,
    `kelasId` VARCHAR(191) NOT NULL,
    `guruId` VARCHAR(191) NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `tipe` ENUM('PDF', 'LINK') NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tugas` (
    `id` VARCHAR(191) NOT NULL,
    `guruId` VARCHAR(191) NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `deskripsi` TEXT NOT NULL,
    `tipeLampiran` ENUM('PDF', 'LINK') NULL,
    `lampiran` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tugas_kelas` (
    `tugasId` VARCHAR(191) NOT NULL,
    `kelasId` VARCHAR(191) NOT NULL,
    `dikirimAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`tugasId`, `kelasId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `submission_tugas` (
    `id` VARCHAR(191) NOT NULL,
    `tugasId` VARCHAR(191) NOT NULL,
    `siswaId` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `waktuKumpul` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `submission_tugas_tugasId_siswaId_key`(`tugasId`, `siswaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `laporan_lupa_password` (
    `id` VARCHAR(191) NOT NULL,
    `tipeAkun` ENUM('GURU', 'SISWA') NOT NULL,
    `guruId` VARCHAR(191) NULL,
    `siswaId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `nikNisInput` VARCHAR(191) NOT NULL,
    `tanggalLahir` DATETIME(3) NOT NULL,
    `alasan` TEXT NOT NULL,
    `status` ENUM('MENUNGGU', 'DITERIMA', 'DITOLAK', 'SELESAI') NOT NULL DEFAULT 'MENUNGGU',
    `otp` VARCHAR(191) NULL,
    `otpExpiredAt` DATETIME(3) NULL,
    `diprosesOlehId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `siswa` ADD CONSTRAINT `siswa_rombelId_fkey` FOREIGN KEY (`rombelId`) REFERENCES `rombel_akademik`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guru_mapel` ADD CONSTRAINT `guru_mapel_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `guru`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guru_mapel` ADD CONSTRAINT `guru_mapel_mapelId_fkey` FOREIGN KEY (`mapelId`) REFERENCES `mata_pelajaran`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kelas_siswa` ADD CONSTRAINT `kelas_siswa_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `kelas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kelas_siswa` ADD CONSTRAINT `kelas_siswa_siswaId_fkey` FOREIGN KEY (`siswaId`) REFERENCES `siswa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kelas_guru` ADD CONSTRAINT `kelas_guru_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `kelas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kelas_guru` ADD CONSTRAINT `kelas_guru_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `guru`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kelas_guru` ADD CONSTRAINT `kelas_guru_mapelId_fkey` FOREIGN KEY (`mapelId`) REFERENCES `mata_pelajaran`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengumuman` ADD CONSTRAINT `pengumuman_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `kelas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengumuman` ADD CONSTRAINT `pengumuman_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `guru`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asesmen` ADD CONSTRAINT `asesmen_mapelId_fkey` FOREIGN KEY (`mapelId`) REFERENCES `mata_pelajaran`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asesmen` ADD CONSTRAINT `asesmen_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `guru`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asesmen_kelas` ADD CONSTRAINT `asesmen_kelas_asesmenId_fkey` FOREIGN KEY (`asesmenId`) REFERENCES `asesmen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asesmen_kelas` ADD CONSTRAINT `asesmen_kelas_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `kelas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `soal` ADD CONSTRAINT `soal_asesmenId_fkey` FOREIGN KEY (`asesmenId`) REFERENCES `asesmen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `opsi_jawaban` ADD CONSTRAINT `opsi_jawaban_soalId_fkey` FOREIGN KEY (`soalId`) REFERENCES `soal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submission_asesmen` ADD CONSTRAINT `submission_asesmen_asesmenId_fkey` FOREIGN KEY (`asesmenId`) REFERENCES `asesmen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submission_asesmen` ADD CONSTRAINT `submission_asesmen_siswaId_fkey` FOREIGN KEY (`siswaId`) REFERENCES `siswa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jawaban_siswa` ADD CONSTRAINT `jawaban_siswa_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `submission_asesmen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jawaban_siswa` ADD CONSTRAINT `jawaban_siswa_soalId_fkey` FOREIGN KEY (`soalId`) REFERENCES `soal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jawaban_opsi_dipilih` ADD CONSTRAINT `jawaban_opsi_dipilih_jawabanSiswaId_fkey` FOREIGN KEY (`jawabanSiswaId`) REFERENCES `jawaban_siswa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jawaban_opsi_dipilih` ADD CONSTRAINT `jawaban_opsi_dipilih_opsiId_fkey` FOREIGN KEY (`opsiId`) REFERENCES `opsi_jawaban`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materi` ADD CONSTRAINT `materi_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `kelas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materi` ADD CONSTRAINT `materi_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `guru`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tugas` ADD CONSTRAINT `tugas_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `guru`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tugas_kelas` ADD CONSTRAINT `tugas_kelas_tugasId_fkey` FOREIGN KEY (`tugasId`) REFERENCES `tugas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tugas_kelas` ADD CONSTRAINT `tugas_kelas_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `kelas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submission_tugas` ADD CONSTRAINT `submission_tugas_tugasId_fkey` FOREIGN KEY (`tugasId`) REFERENCES `tugas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submission_tugas` ADD CONSTRAINT `submission_tugas_siswaId_fkey` FOREIGN KEY (`siswaId`) REFERENCES `siswa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `laporan_lupa_password` ADD CONSTRAINT `laporan_lupa_password_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `guru`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `laporan_lupa_password` ADD CONSTRAINT `laporan_lupa_password_siswaId_fkey` FOREIGN KEY (`siswaId`) REFERENCES `siswa`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `laporan_lupa_password` ADD CONSTRAINT `laporan_lupa_password_diprosesOlehId_fkey` FOREIGN KEY (`diprosesOlehId`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
