-- Migration: ajout vérification email
ALTER TABLE `users`
    ADD COLUMN `email_verified`     TINYINT(1)   NOT NULL DEFAULT 0 AFTER `password`,
    ADD COLUMN `verification_token` VARCHAR(64)  NULL     DEFAULT NULL AFTER `email_verified`,
    ADD COLUMN `token_expires_at`   DATETIME     NULL     DEFAULT NULL AFTER `verification_token`;
