-- Noréaz 2026 — Batch 2 : 7 nouveaux monuments
-- À exécuter après le schéma initial

INSERT INTO `monuments` (`id`, `name`, `slug`, `description`, `country`, `hint`, `qr_token`, `active`) VALUES
(4,  'Colossée',                    'colossee',                   'Le plus grand amphithéâtre de l\'Antiquité, construit à Rome sous l\'Empire romain. Il pouvait accueillir jusqu\'à 50 000 spectateurs pour des combats de gladiateurs.',           'Italie',          'Indice bientôt disponible.', 'tok_d2e4f6a8b1c3e5f7', 1),
(5,  'Big Ben',                     'big-ben',                    'L\'emblématique tour de l\'horloge du Parlement britannique à Londres, officiellement renommée Tour Elizabeth en 2012. Sa cloche de 13,7 tonnes résonne depuis 1859.',              'Royaume-Uni',     'Indice bientôt disponible.', 'tok_e3f5a7b9c2d4f6a8', 1),
(6,  'Sagrada Família',             'sagrada-familia',            'Chef-d\'œuvre inachevé de l\'architecte Antoni Gaudí à Barcelone. Commencée en 1882, cette basilique aux tours vertigineuses devrait être achevée aux alentours de 2026.',       'Espagne',         'Indice bientôt disponible.', 'tok_f4a6b8c1d3e5f7a9', 1),
(7,  'Taj Mahal',                   'taj-mahal',                  'Mausolée de marbre blanc construit par l\'empereur moghol Shah Jahan en mémoire de son épouse Mumtaz Mahal. Symbole éternel de l\'amour, érigé à Agra entre 1632 et 1653.',        'Inde',            'Indice bientôt disponible.', 'tok_a5b7c9d2e4f6a8b1', 1),
(8,  'Pyramides de Gizeh',          'pyramides-de-gizeh',         'Les trois grandes pyramides de Gizeh sont les seules des Sept Merveilles du monde antique encore debout. La Grande Pyramide de Khéops, haute de 146 m, fut construite vers 2560 av. J.-C.', 'Égypte',     'Indice bientôt disponible.', 'tok_b6c8d1e3f5a7b9c2', 1),
(9,  'Château de Neuschwanstein',   'chateau-neuschwanstein',     'Féerique château du roi Louis II de Bavière, perché dans les Alpes allemandes. Commencé en 1869, il a inspiré le château de La Belle au Bois Dormant des studios Disney.',       'Allemagne',       'Indice bientôt disponible.', 'tok_c7d9e2f4a6b8c1d3', 1),
(10, 'Parthénon',                   'parthenon',                  'Temple dédié à la déesse Athéna, érigé sur l\'Acropole d\'Athènes entre 447 et 432 av. J.-C. Symbole de la civilisation grecque antique et de la démocratie.',                    'Grèce',           'Indice bientôt disponible.', 'tok_d8e1f3a5b7c9d2e4', 1);


-- -----------------------------------------------
-- Questions : Colossée (monument_id = 4)
-- -----------------------------------------------
INSERT INTO `questions` (`monument_id`, `question_text`, `answer_correct`, `answer_wrong1`, `answer_wrong2`, `answer_wrong3`, `sort_order`) VALUES
(4, 'En quelle année le Colossée a-t-il été inauguré ?',                      '80 apr. J.-C.',              '100 apr. J.-C.',   '50 apr. J.-C.',    '120 apr. J.-C.',     1),
(4, 'Quelle était la capacité d\'accueil du Colossée ?',                      '50 000 spectateurs',         '20 000 spectateurs','80 000 spectateurs','10 000 spectateurs', 2),
(4, 'Quel est le vrai nom du Colossée ?',                                     'Amphithéâtre Flavien',       'Stade Romain',      'Forum Maximus',     'Arena di Roma',      3),
(4, 'Combien de temps a duré la construction du Colossée ?',                  '8 ans',                      '20 ans',            '3 ans',             '50 ans',             4),
(4, 'Quel matériau principal a été utilisé pour construire le Colossée ?',    'Travertin (calcaire)',       'Marbre blanc',      'Granit',            'Brique cuite',       5);

-- -----------------------------------------------
-- Questions : Big Ben (monument_id = 5)
-- -----------------------------------------------
INSERT INTO `questions` (`monument_id`, `question_text`, `answer_correct`, `answer_wrong1`, `answer_wrong2`, `answer_wrong3`, `sort_order`) VALUES
(5, 'Quel est le nom officiel de la tour qui abrite Big Ben ?',               'Tour Elizabeth',             'Tour Victoria',     'Tour Westminster',  'Tour Churchill',     1),
(5, 'En quelle année la cloche Big Ben a-t-elle sonné pour la première fois ?','1859',                      '1900',              '1832',              '1920',               2),
(5, 'Quelle est la hauteur de la tour de Big Ben ?',                          '96 mètres',                  '60 mètres',         '120 mètres',        '45 mètres',          3),
(5, 'Quelle est la masse approximative de la grande cloche de Big Ben ?',     '13,7 tonnes',                '5 tonnes',          '30 tonnes',         '2 tonnes',           4),
(5, 'Dans quel bâtiment se trouve la tour de Big Ben ?',                      'Le Parlement britannique',   'Buckingham Palace', 'La Tour de Londres','Westminster Abbey',   5);

-- -----------------------------------------------
-- Questions : Sagrada Família (monument_id = 6)
-- -----------------------------------------------
INSERT INTO `questions` (`monument_id`, `question_text`, `answer_correct`, `answer_wrong1`, `answer_wrong2`, `answer_wrong3`, `sort_order`) VALUES
(6, 'Qui est l\'architecte principal de la Sagrada Família ?',                'Antoni Gaudí',               'Pablo Picasso',     'Salvador Dalí',     'Rafael Moneo',       1),
(6, 'En quelle année a débuté la construction de la Sagrada Família ?',       '1882',                       '1900',              '1850',              '1920',               2),
(6, 'Combien de tours le projet final de la Sagrada Família prévoit-il ?',    '18 tours',                   '6 tours',           '12 tours',          '24 tours',           3),
(6, 'Dans quelle ville se trouve la Sagrada Família ?',                       'Barcelone',                  'Madrid',            'Séville',           'Valence',            4),
(6, 'Comment Gaudí a-t-il principalement financé la Sagrada Família ?',      'Par des dons populaires',    'Par l\'État espagnol','Par l\'Église',    'Par des mécènes privés',5);

-- -----------------------------------------------
-- Questions : Taj Mahal (monument_id = 7)
-- -----------------------------------------------
INSERT INTO `questions` (`monument_id`, `question_text`, `answer_correct`, `answer_wrong1`, `answer_wrong2`, `answer_wrong3`, `sort_order`) VALUES
(7, 'En mémoire de qui le Taj Mahal a-t-il été construit ?',                  'Mumtaz Mahal',               'Nur Jahan',         'Razia Sultana',     'Jahanara Begum',     1),
(7, 'En quelle année a commencé la construction du Taj Mahal ?',              '1632',                       '1600',              '1700',              '1550',               2),
(7, 'Dans quelle ville indienne se trouve le Taj Mahal ?',                    'Agra',                       'New Delhi',         'Mumbai',            'Jaipur',             3),
(7, 'De quel matériau est principalement fait le Taj Mahal ?',                'Marbre blanc',               'Grès rouge',        'Calcaire',          'Granit noir',        4),
(7, 'Combien d\'ouvriers ont participé à la construction du Taj Mahal ?',     '20 000',                     '5 000',             '50 000',            '1 000',              5);

-- -----------------------------------------------
-- Questions : Pyramides de Gizeh (monument_id = 8)
-- -----------------------------------------------
INSERT INTO `questions` (`monument_id`, `question_text`, `answer_correct`, `answer_wrong1`, `answer_wrong2`, `answer_wrong3`, `sort_order`) VALUES
(8, 'Pour quel pharaon la Grande Pyramide de Gizeh a-t-elle été construite ?','Khéops',                     'Ramsès II',         'Toutânkhamon',      'Cléopâtre',          1),
(8, 'Quelle était la hauteur originale de la Grande Pyramide ?',              '146 mètres',                 '100 mètres',        '200 mètres',        '80 mètres',          2),
(8, 'Combien de pyramides principales composent le site de Gizeh ?',          '3',                          '5',                 '2',                 '7',                  3),
(8, 'Quel célèbre monument se trouve à proximité des pyramides de Gizeh ?',   'Le Grand Sphinx',            'L\'obélisque',      'Le temple de Louxor','La vallée des Rois', 4),
(8, 'De quel matériau sont principalement construites les pyramides ?',       'Calcaire',                   'Granit',            'Marbre',            'Grès',               5);

-- -----------------------------------------------
-- Questions : Château de Neuschwanstein (monument_id = 9)
-- -----------------------------------------------
INSERT INTO `questions` (`monument_id`, `question_text`, `answer_correct`, `answer_wrong1`, `answer_wrong2`, `answer_wrong3`, `sort_order`) VALUES
(9, 'Quel roi a fait construire le château de Neuschwanstein ?',              'Louis II de Bavière',        'Louis XIV',         'Frédéric le Grand', 'Charles Quint',      1),
(9, 'En quelle année a débuté la construction du château ?',                  '1869',                       '1820',              '1900',              '1750',               2),
(9, 'Quel film Disney s\'est inspiré du château de Neuschwanstein ?',         'La Belle au Bois Dormant',   'Cendrillon',        'La Reine des Neiges','Blanche-Neige',     3),
(9, 'Dans quel pays se trouve le château de Neuschwanstein ?',                'Allemagne',                  'Autriche',          'Suisse',            'France',             4),
(9, 'Le château de Neuschwanstein a-t-il été achevé du vivant de Louis II ?', 'Non, il est mort avant',     'Oui, en 1880',      'Oui, en 1886',      'Non, la guerre l\'a interrompu', 5);

-- -----------------------------------------------
-- Questions : Parthénon (monument_id = 10)
-- -----------------------------------------------
INSERT INTO `questions` (`monument_id`, `question_text`, `answer_correct`, `answer_wrong1`, `answer_wrong2`, `answer_wrong3`, `sort_order`) VALUES
(10, 'À quelle déesse grecque le Parthénon est-il dédié ?',                   'Athéna',                     'Aphrodite',         'Héra',              'Artémis',            1),
(10, 'En quelle année a débuté la construction du Parthénon ?',               '447 av. J.-C.',              '200 av. J.-C.',     '600 av. J.-C.',     '100 av. J.-C.',      2),
(10, 'Sur quel site historique se trouve le Parthénon ?',                     'L\'Acropole d\'Athènes',     'L\'Agora',          'L\'Olympie',        'L\'Éphèse',          3),
(10, 'Combien de colonnes compte la façade principale du Parthénon ?',        '8 colonnes',                 '6 colonnes',        '12 colonnes',       '10 colonnes',        4),
(10, 'Quel matériau a été utilisé pour construire le Parthénon ?',            'Marbre de Pentélique',       'Calcaire',          'Granit',            'Travertin',          5);
