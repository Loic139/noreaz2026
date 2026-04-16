-- Migration: ajout réinitialisation mot de passe
ALTER TABLE `users`
    ADD COLUMN `reset_token`      VARCHAR(64) NULL DEFAULT NULL AFTER `token_expires_at`,
    ADD COLUMN `reset_expires_at` DATETIME    NULL DEFAULT NULL AFTER `reset_token`;
