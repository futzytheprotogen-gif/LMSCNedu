CREATE TABLE `catatan_integritas_asesmen` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `jenis` ENUM(
        'TAB_HIDDEN',
        'WINDOW_BLUR',
        'COPY_BLOCKED',
        'CUT_BLOCKED',
        'PASTE_BLOCKED',
        'CONTEXT_MENU_BLOCKED',
        'LEAVE_ASSESSMENT',
        'LOGOUT_DURING_ASSESSMENT'
    ) NOT NULL,
    `terdeteksiPada` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `catatan_integritas_asesmen_submissionId_terdeteksiPada_idx` (`submissionId`, `terdeteksiPada`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `submission_asesmen`
ADD COLUMN `integritasDicatat` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `catatan_integritas_asesmen`
    ADD CONSTRAINT `catatan_integritas_asesmen_submissionId_fkey`
    FOREIGN KEY (`submissionId`) REFERENCES `submission_asesmen`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
