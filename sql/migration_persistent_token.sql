-- Migration: token persistant pour auto-login multi-fenêtre
ALTER TABLE `users`
    ADD COLUMN `persistent_token` VARCHAR(64) NULL DEFAULT NULL AFTER `reset_expires_at`;
