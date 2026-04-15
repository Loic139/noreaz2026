-- Noréaz 2026 - Chasse aux trésors
-- Schéma de base de données

SET NAMES utf8mb4;
SET time_zone = '+02:00';
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `scores`;
DROP TABLE IF EXISTS `questions`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `monuments`;

SET FOREIGN_KEY_CHECKS = 1;

-- Monuments
CREATE TABLE `monuments` (
    `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name`        VARCHAR(150) NOT NULL,
    `slug`        VARCHAR(150) NOT NULL UNIQUE,
    `description` TEXT,
    `country`     VARCHAR(100),
    `image`       VARCHAR(255),
    `hint`        VARCHAR(255),
    `qr_token`    VARCHAR(64) NOT NULL UNIQUE,
    `active`      TINYINT(1) NOT NULL DEFAULT 1,
    `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Questions QCM
CREATE TABLE `questions` (
    `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `monument_id`    INT UNSIGNED NOT NULL,
    `question_text`  TEXT NOT NULL,
    `answer_correct` VARCHAR(255) NOT NULL,
    `answer_wrong1`  VARCHAR(255) NOT NULL,
    `answer_wrong2`  VARCHAR(255) NOT NULL,
    `answer_wrong3`  VARCHAR(255) NOT NULL,
    `sort_order`     TINYINT UNSIGNED NOT NULL DEFAULT 0,
    FOREIGN KEY (`monument_id`) REFERENCES `monuments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Utilisateurs
CREATE TABLE `users` (
    `id`           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `email`        VARCHAR(255) NOT NULL UNIQUE,
    `first_name`   VARCHAR(100) NOT NULL,
    `last_name`    VARCHAR(100) NOT NULL,
    `password`     VARCHAR(255) NOT NULL,
    `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Scores des joueurs connectés
CREATE TABLE `scores` (
    `id`           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id`      INT UNSIGNED NOT NULL,
    `monument_id`  INT UNSIGNED NOT NULL,
    `points`       TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `completed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `user_monument` (`user_id`, `monument_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`monument_id`) REFERENCES `monuments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Données initiales : 3 monuments
INSERT INTO `monuments` (`name`, `slug`, `description`, `country`, `hint`, `qr_token`) VALUES
('Tour Eiffel',         'tour-eiffel',         'La Dame de Fer, symbole de Paris, construite par Gustave Eiffel pour l\'Exposition universelle de 1889.', 'France',    'Je me trouve près de la fontaine du village.', 'tok_a3f8c2d1e4b7a6f5'),
('Statue de la Liberté','statue-de-la-liberte', 'Offerte par la France aux États-Unis en 1886, elle symbolise la liberté et la démocratie.', 'États-Unis', 'Cherche-moi du côté de la place principale.', 'tok_b9e2d4f1c8a7b3e6'),
('Tour de Pise',        'tour-de-pise',         'Célèbre pour son inclinaison, cette tour campanile italienne fut construite entre 1173 et 1372.', 'Italie', 'Je suis caché près de l\'église du village.', 'tok_c5f3a8e2d1b6c4f7');

-- Questions Tour Eiffel
INSERT INTO `questions` (`monument_id`, `question_text`, `answer_correct`, `answer_wrong1`, `answer_wrong2`, `answer_wrong3`, `sort_order`) VALUES
(1, 'En quelle année la Tour Eiffel a-t-elle été inaugurée ?', '1889', '1900', '1875', '1912', 1),
(1, 'Quelle est la hauteur de la Tour Eiffel (avec antenne) ?', '330 mètres', '250 mètres', '200 mètres', '420 mètres', 2),
(1, 'Qui a conçu la Tour Eiffel ?', 'Gustave Eiffel', 'Victor Hugo', 'Haussmann', 'Le Corbusier', 3),
(1, 'De quelle couleur est la Tour Eiffel aujourd\'hui ?', 'Brun doré', 'Gris acier', 'Noir', 'Blanc', 4),
(1, 'Combien de marches compte la Tour Eiffel jusqu\'au sommet ?', '1 665', '500', '800', '2 000', 5);

-- Questions Statue de la Liberté
INSERT INTO `questions` (`monument_id`, `question_text`, `answer_correct`, `answer_wrong1`, `answer_wrong2`, `answer_wrong3`, `sort_order`) VALUES
(2, 'Dans quelle ville se trouve la Statue de la Liberté ?', 'New York', 'Washington D.C.', 'Boston', 'Miami', 1),
(2, 'En quelle année la Statue de la Liberté a-t-elle été offerte aux États-Unis ?', '1886', '1776', '1900', '1865', 2),
(2, 'Quel pays a offert la Statue de la Liberté aux États-Unis ?', 'La France', 'L\'Angleterre', 'L\'Espagne', 'L\'Italie', 3),
(2, 'Que tient la Statue de la Liberté dans sa main droite ?', 'Un flambeau', 'Un drapeau', 'Une épée', 'Un livre', 4),
(2, 'Quelle est la hauteur totale de la Statue de la Liberté (socle inclus) ?', '93 mètres', '46 mètres', '120 mètres', '75 mètres', 5);

-- Questions Tour de Pise
INSERT INTO `questions` (`monument_id`, `question_text`, `answer_correct`, `answer_wrong1`, `answer_wrong2`, `answer_wrong3`, `sort_order`) VALUES
(3, 'Dans quelle ville italienne se trouve la Tour de Pise ?', 'Pise', 'Rome', 'Florence', 'Venise', 1),
(3, 'Pourquoi la Tour de Pise penche-t-elle ?', 'Sol trop mou d\'un côté', 'Construction volontaire', 'Tremblement de terre', 'Vent persistant', 2),
(3, 'Quelle est la fonction originale de la Tour de Pise ?', 'Clocher d\'une cathédrale', 'Tour de guet militaire', 'Phare maritime', 'Observatoire astronomique', 3),
(3, 'De combien de degrés la Tour de Pise est-elle inclinée environ ?', '4 degrés', '1 degré', '10 degrés', '45 degrés', 4),
(3, 'En combien d\'années la Tour de Pise a-t-elle été construite ?', '199 ans', '10 ans', '50 ans', '500 ans', 5);
