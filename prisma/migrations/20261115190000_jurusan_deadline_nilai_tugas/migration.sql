CREATE TABLE `jurusan_akademik` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `jurusan_akademik_nama_key` (`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `rombel_akademik`
    ADD COLUMN `jurusanId` VARCHAR(191) NULL;

INSERT INTO `jurusan_akademik` (`id`, `nama`, `createdAt`, `updatedAt`)
SELECT
    CONCAT('jurusan_', SUBSTRING(MD5(`nama`), 1, 32)),
    `nama`,
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
FROM (
    SELECT DISTINCT UPPER(TRIM(`jurusan`)) AS `nama`
    FROM `rombel_akademik`
    WHERE `jurusan` IS NOT NULL AND TRIM(`jurusan`) <> ''
) AS `daftar_jurusan`;

UPDATE `rombel_akademik` AS `rombel`
JOIN `jurusan_akademik` AS `jurusan`
    ON `jurusan`.`nama` = UPPER(TRIM(`rombel`.`jurusan`))
SET `rombel`.`jurusanId` = `jurusan`.`id`;

ALTER TABLE `rombel_akademik`
    DROP COLUMN `jurusan`,
    ADD INDEX `rombel_akademik_jurusanId_idx` (`jurusanId`),
    ADD CONSTRAINT `rombel_akademik_jurusanId_fkey`
        FOREIGN KEY (`jurusanId`) REFERENCES `jurusan_akademik` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `tugas`
    ADD COLUMN `deadlineAt` DATETIME(3) NULL,
    ADD COLUMN `susulanAktif` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `deadlineSusulan` DATETIME(3) NULL;

ALTER TABLE `submission_tugas`
    ADD COLUMN `nilai` DOUBLE NULL,
    ADD COLUMN `catatanNilai` TEXT NULL;
