-- Noréaz 2026 — Migration : Géo-Quiz
-- À exécuter une seule fois sur la base de données

-- Ajout des coordonnées GPS aux monuments
ALTER TABLE `monuments`
  ADD COLUMN `latitude`  DECIMAL(8,6) DEFAULT NULL,
  ADD COLUMN `longitude` DECIMAL(9,6) DEFAULT NULL;

-- Coordonnées pour chaque monument
UPDATE `monuments` SET latitude =  48.858400, longitude =   2.294500 WHERE slug = 'tour-eiffel';
UPDATE `monuments` SET latitude =  40.689200, longitude = -74.044500 WHERE slug = 'statue-de-la-liberte';
UPDATE `monuments` SET latitude =  43.723000, longitude =  10.396600 WHERE slug = 'tour-de-pise';
UPDATE `monuments` SET latitude =  41.890200, longitude =  12.492200 WHERE slug = 'colossee';
UPDATE `monuments` SET latitude =  51.500700, longitude =  -0.124600 WHERE slug = 'big-ben';
UPDATE `monuments` SET latitude =  41.403600, longitude =   2.174400 WHERE slug = 'sagrada-familia';
UPDATE `monuments` SET latitude =  27.175100, longitude =  78.042100 WHERE slug = 'taj-mahal';
UPDATE `monuments` SET latitude =  29.979200, longitude =  31.134200 WHERE slug = 'pyramides-de-gizeh';
UPDATE `monuments` SET latitude =  47.557600, longitude =  10.749800 WHERE slug = 'chateau-neuschwanstein';
UPDATE `monuments` SET latitude =  37.971500, longitude =  23.726700 WHERE slug = 'parthenon';

-- Table des scores du Géo-Quiz
CREATE TABLE IF NOT EXISTS `geo_scores` (
    `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id`     INT UNSIGNED NOT NULL,
    `monument_id` INT UNSIGNED NOT NULL,
    `distance_km` INT UNSIGNED NOT NULL,
    `points`      TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `played_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `user_monument` (`user_id`, `monument_id`),
    FOREIGN KEY (`monument_id`) REFERENCES `monuments`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`)     REFERENCES `users`(`id`)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
