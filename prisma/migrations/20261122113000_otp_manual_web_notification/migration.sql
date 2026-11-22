ALTER TABLE `laporan_lupa_password`
    ADD COLUMN `otpEncrypted` TEXT NULL,
    ADD COLUMN `otpAccessTokenHash` VARCHAR(64) NULL;

CREATE UNIQUE INDEX `laporan_lupa_password_otpAccessTokenHash_key`
    ON `laporan_lupa_password` (`otpAccessTokenHash`);
