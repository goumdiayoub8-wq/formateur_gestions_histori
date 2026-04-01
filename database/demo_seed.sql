-- Demo seed for Gestion des horaires formateurs

-- Import after database/final_database.sql has created the schema.

USE `gestion_formateurs`;

SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM `evaluation_answers`;

DELETE FROM `evaluation_questions`;

DELETE FROM `evaluation_scores`;

DELETE FROM `evaluation_questionnaires`;

DELETE FROM `formateur_module_scores`;

DELETE FROM `module_questionnaires`;

DELETE FROM `request_throttles`;

DELETE FROM `ai_scores`;

DELETE FROM `formateur_modules`;

DELETE FROM `reports`;

DELETE FROM `recent_activities`;

DELETE FROM `planning_sessions`;

DELETE FROM `planning_change_requests`;

DELETE FROM `planning_submissions`;

DELETE FROM `planning`;

DELETE FROM `affectations`;

DELETE FROM `module_groupes`;

DELETE FROM `utilisateurs`;

DELETE FROM `salles`;

DELETE FROM `groupes`;

DELETE FROM `modules`;

DELETE FROM `formateurs`;

DELETE FROM `academic_config`;

ALTER TABLE `evaluation_answers` AUTO_INCREMENT = 1;

ALTER TABLE `evaluation_questions` AUTO_INCREMENT = 1;

ALTER TABLE `evaluation_scores` AUTO_INCREMENT = 1;

ALTER TABLE `evaluation_questionnaires` AUTO_INCREMENT = 1;

ALTER TABLE `formateur_module_scores` AUTO_INCREMENT = 1;

ALTER TABLE `module_questionnaires` AUTO_INCREMENT = 1;

ALTER TABLE `request_throttles` AUTO_INCREMENT = 1;

ALTER TABLE `ai_scores` AUTO_INCREMENT = 1;

ALTER TABLE `formateur_modules` AUTO_INCREMENT = 1;

ALTER TABLE `reports` AUTO_INCREMENT = 1;

ALTER TABLE `recent_activities` AUTO_INCREMENT = 1;

ALTER TABLE `planning_sessions` AUTO_INCREMENT = 1;

ALTER TABLE `planning_change_requests` AUTO_INCREMENT = 1;

ALTER TABLE `planning_submissions` AUTO_INCREMENT = 1;

ALTER TABLE `planning` AUTO_INCREMENT = 1;

ALTER TABLE `affectations` AUTO_INCREMENT = 1;

ALTER TABLE `module_groupes` AUTO_INCREMENT = 1;

ALTER TABLE `utilisateurs` AUTO_INCREMENT = 1;

ALTER TABLE `salles` AUTO_INCREMENT = 1;

ALTER TABLE `groupes` AUTO_INCREMENT = 1;

ALTER TABLE `modules` AUTO_INCREMENT = 1;

ALTER TABLE `formateurs` AUTO_INCREMENT = 1;

ALTER TABLE `academic_config` AUTO_INCREMENT = 1;

INSERT INTO `academic_config` (`id`, `start_date`, `end_date`, `s2_start_date`, `stage_start_date`, `stage_end_date`, `exam_regional_date`, `created_at`, `updated_at`) VALUES
  (1, '2025-09-15', '2026-07-15', '2026-02-02', '2026-04-20', '2026-06-05', '2026-06-20', '2025-09-01 09:00:00', NULL);

INSERT INTO `formateurs` (`id`, `nom`, `email`, `telephone`, `specialite`, `max_heures`, `weekly_hours`, `current_hours`, `created_at`, `updated_at`) VALUES
  (1, 'Yassine Benali', 'formateur@test.com', '+212600000001', 'Developpement Web', 910, 24.00, 205.00, '2025-09-10 08:00:00', NULL),
  (2, 'Salma Alaoui', 'salma.alaoui@test.com', '+212600000002', 'UX/UI Design', 910, 18.00, 105.00, '2025-09-10 08:05:00', NULL),
  (3, 'Hamza Tazi', 'hamza.tazi@test.com', '+212600000003', 'Data & IA', 910, 20.00, 115.00, '2025-09-10 08:10:00', NULL),
  (4, 'Nadia El Mansouri', 'nadia.elmansouri@test.com', '+212600000004', 'DevOps & Cloud', 910, 20.00, 110.00, '2025-09-10 08:15:00', NULL),
  (5, 'Mehdi Boussaid', 'mehdi.boussaid@test.com', '+212600000005', 'Soft Skills & Qualite', 910, 16.00, 105.00, '2025-09-10 08:20:00', NULL);

INSERT INTO `modules` (`id`, `code`, `intitule`, `filiere`, `semestre`, `volume_horaire`, `has_efm`, `created_at`, `updated_at`) VALUES
  (1, 'DEV101', 'Developper des interfaces HTML/CSS', 'Developpement Digital', 'S1', 60, 0, '2025-09-10 09:00:00', NULL),
  (2, 'DEV202', 'Developper une application React', 'Developpement Digital', 'S2', 80, 1, '2025-09-10 09:03:00', NULL),
  (3, 'UX201', 'Concevoir une experience UX', 'Design Digital', 'S1', 50, 0, '2025-09-10 09:06:00', NULL),
  (4, 'UX202', 'Prototyper une interface avancee', 'Design Digital', 'S2', 55, 0, '2025-09-10 09:09:00', NULL),
  (5, 'IA201', 'Introduire le machine learning', 'Intelligence Artificielle', 'S2', 70, 1, '2025-09-10 09:12:00', NULL),
  (6, 'DATA101', 'SQL et modelisation des donnees', 'Data Engineering', 'S1', 45, 0, '2025-09-10 09:15:00', NULL),
  (7, 'DEVOPS201', 'Automatiser avec Docker et CI/CD', 'Infrastructure Cloud', 'S2', 60, 1, '2025-09-10 09:18:00', NULL),
  (8, 'CLOUD101', 'Architecture cloud et supervision', 'Infrastructure Cloud', 'S1', 50, 0, '2025-09-10 09:21:00', NULL),
  (9, 'SOFT101', 'Communication pedagogique', 'Tronc Commun', 'S1', 30, 0, '2025-09-10 09:24:00', NULL),
  (10, 'SCRUM101', 'Gestion agile de projet', 'Tronc Commun', 'S2', 35, 0, '2025-09-10 09:27:00', NULL),
  (11, 'API201', 'Concevoir des API REST', 'Developpement Digital', 'S2', 65, 1, '2025-09-10 09:30:00', NULL),
  (12, 'TEST101', 'Mettre en place les tests logiciels', 'Qualite Logicielle', 'S1', 40, 0, '2025-09-10 09:33:00', NULL);

INSERT INTO `module_questionnaires` (`id`, `module_id`, `questionnaire_id`, `questionnaire_token`, `total_questions`, `created_at`, `updated_at`) VALUES
  (1, 1, 'module-1', NULL, 20, '2025-09-10 11:00:00', NULL),
  (2, 2, 'module-2', NULL, 20, '2025-09-10 11:05:00', NULL),
  (3, 3, 'module-3', NULL, 20, '2025-09-10 11:10:00', NULL),
  (4, 4, 'module-4', NULL, 20, '2025-09-10 11:15:00', NULL),
  (5, 5, 'module-5', NULL, 20, '2025-09-10 11:20:00', NULL),
  (6, 6, 'module-6', NULL, 20, '2025-09-10 11:25:00', NULL),
  (7, 7, 'module-7', NULL, 20, '2025-09-10 11:30:00', NULL),
  (8, 8, 'module-8', NULL, 20, '2025-09-10 11:35:00', NULL),
  (9, 9, 'module-9', NULL, 20, '2025-09-10 11:40:00', NULL),
  (10, 10, 'module-10', NULL, 20, '2025-09-10 11:45:00', NULL),
  (11, 11, 'module-11', NULL, 20, '2025-09-10 11:50:00', NULL),
  (12, 12, 'module-12', NULL, 20, '2025-09-10 11:55:00', NULL);

INSERT INTO `groupes` (`id`, `code`, `nom`, `filiere`, `annee_scolaire`, `effectif`, `actif`, `created_at`, `updated_at`) VALUES
  (1, 'DEV-1', 'Developpement Digital 1A', 'Developpement Digital', '2025-2026', 24, 1, '2025-09-12 09:00:00', NULL),
  (2, 'DEV-2', 'Developpement Digital 2A', 'Developpement Digital', '2025-2026', 22, 1, '2025-09-12 09:04:00', NULL),
  (3, 'DESIGN-1', 'Design Digital 2A', 'Design Digital', '2025-2026', 19, 1, '2025-09-12 09:08:00', NULL),
  (4, 'IA-1', 'Intelligence Artificielle 2A', 'Intelligence Artificielle', '2025-2026', 18, 1, '2025-09-12 09:12:00', NULL),
  (5, 'DEVOPS-1', 'Infrastructure Cloud 2A', 'Infrastructure Cloud', '2025-2026', 20, 1, '2025-09-12 09:16:00', NULL),
  (6, 'DATA-1', 'Data Engineering 1A', 'Data Engineering', '2025-2026', 21, 1, '2025-09-12 09:20:00', NULL),
  (7, 'COMM-1', 'Parcours transversal communication', 'Tronc Commun', '2025-2026', 26, 1, '2025-09-12 09:24:00', NULL);

INSERT INTO `salles` (`id`, `code`, `nom`, `batiment`, `capacite`, `created_at`) VALUES
  (1, 'SN-12', 'Salle Numerique 12', 'Batiment A', 24, '2025-09-12 10:00:00'),
  (2, 'LAB-02', 'Laboratoire 02', 'Batiment B', 18, '2025-09-12 10:04:00'),
  (3, 'ATELIER-3', 'Atelier Projet 3', 'Batiment C', 20, '2025-09-12 10:08:00'),
  (4, 'CLOUD-1', 'Lab Cloud 1', 'Batiment D', 20, '2025-09-12 10:12:00'),
  (5, 'SALLE-COM', 'Salle Communication', 'Batiment E', 28, '2025-09-12 10:16:00');

INSERT INTO `utilisateurs` (`id`, `formateur_id`, `nom`, `email`, `username`, `photo`, `mot_de_passe`, `reset_token`, `reset_token_expiration`, `role_id`, `statut`, `theme_preference`, `created_at`) VALUES
  (1, NULL, 'Directeur Pedagogique', 'directeur@test.com', 'directeur', NULL, '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', NULL, NULL, 1, 'actif', 'light', '2025-09-10 07:30:00'),
  (2, NULL, 'Chef de Pole', 'chef@test.com', 'chef', NULL, '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', NULL, NULL, 2, 'actif', 'light', '2025-09-10 07:35:00'),
  (3, 1, 'Yassine Benali', 'formateur@test.com', 'yassine.benali', NULL, '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', NULL, NULL, 3, 'actif', 'light', '2025-09-10 07:40:00'),
  (4, 2, 'Salma Alaoui', 'salma.alaoui@test.com', 'salma.alaoui', NULL, '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', NULL, NULL, 3, 'actif', 'light', '2025-09-10 07:45:00'),
  (5, 3, 'Hamza Tazi', 'hamza.tazi@test.com', 'hamza.tazi', NULL, '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', NULL, NULL, 3, 'actif', 'dark', '2025-09-10 07:50:00'),
  (6, 4, 'Nadia El Mansouri', 'nadia.elmansouri@test.com', 'nadia.elmansouri', NULL, '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', NULL, NULL, 3, 'actif', 'light', '2025-09-10 07:55:00'),
  (7, 5, 'Mehdi Boussaid', 'mehdi.boussaid@test.com', 'mehdi.boussaid', NULL, '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', NULL, NULL, 3, 'actif', 'light', '2025-09-10 08:00:00');

INSERT INTO `module_groupes` (`id`, `module_id`, `groupe_id`, `created_at`) VALUES
  (1, 1, 1, '2025-09-15 09:00:00'),
  (2, 1, 2, '2025-09-15 09:01:00'),
  (3, 2, 2, '2025-09-15 09:02:00'),
  (4, 3, 3, '2025-09-15 09:03:00'),
  (5, 4, 3, '2025-09-15 09:04:00'),
  (6, 5, 4, '2025-09-15 09:05:00'),
  (7, 6, 4, '2025-09-15 09:06:00'),
  (8, 6, 6, '2025-09-15 09:07:00'),
  (9, 7, 5, '2025-09-15 09:08:00'),
  (10, 8, 5, '2025-09-15 09:09:00'),
  (11, 9, 1, '2025-09-15 09:10:00'),
  (12, 9, 3, '2025-09-15 09:11:00'),
  (13, 9, 4, '2025-09-15 09:12:00'),
  (14, 9, 7, '2025-09-15 09:13:00'),
  (15, 10, 2, '2025-09-15 09:14:00'),
  (16, 10, 5, '2025-09-15 09:15:00'),
  (17, 10, 7, '2025-09-15 09:16:00'),
  (18, 11, 2, '2025-09-15 09:17:00'),
  (19, 11, 5, '2025-09-15 09:18:00'),
  (20, 12, 5, '2025-09-15 09:19:00'),
  (21, 12, 6, '2025-09-15 09:20:00');

INSERT INTO `affectations` (`id`, `formateur_id`, `module_id`, `annee`, `created_at`) VALUES
  (1, 1, 1, 2026, '2025-09-20 10:00:00'),
  (2, 1, 2, 2026, '2025-09-20 10:01:00'),
  (3, 1, 11, 2026, '2025-09-20 10:02:00'),
  (4, 2, 3, 2026, '2025-09-20 10:03:00'),
  (5, 2, 4, 2026, '2025-09-20 10:04:00'),
  (6, 3, 5, 2026, '2025-09-20 10:05:00'),
  (7, 3, 6, 2026, '2025-09-20 10:06:00'),
  (8, 4, 7, 2026, '2025-09-20 10:07:00'),
  (9, 4, 8, 2026, '2025-09-20 10:08:00'),
  (10, 5, 9, 2026, '2025-09-20 10:09:00'),
  (11, 5, 10, 2026, '2025-09-20 10:10:00'),
  (12, 5, 12, 2026, '2025-09-20 10:11:00');

INSERT INTO `planning` (`id`, `formateur_id`, `module_id`, `semaine`, `heures`, `created_at`, `updated_at`) VALUES
  (1, 1, 1, 26, 3.00, '2026-03-09 08:01:00', NULL),
  (2, 1, 1, 27, 6.00, '2026-03-16 08:02:00', NULL),
  (3, 1, 1, 28, 3.00, '2026-03-23 08:03:00', NULL),
  (4, 1, 1, 29, 6.00, '2026-03-30 08:04:00', NULL),
  (5, 1, 1, 30, 3.00, '2026-04-06 08:05:00', NULL),
  (6, 1, 1, 31, 6.00, '2026-04-13 08:06:00', NULL),
  (7, 1, 1, 32, 3.00, '2026-04-20 08:07:00', NULL),
  (8, 1, 1, 33, 6.00, '2026-04-27 08:08:00', NULL),
  (9, 1, 1, 34, 3.00, '2026-05-04 08:09:00', NULL),
  (10, 1, 1, 35, 6.00, '2026-05-11 08:10:00', NULL),
  (11, 1, 1, 36, 3.00, '2026-05-18 08:11:00', NULL),
  (12, 1, 1, 37, 6.00, '2026-05-25 08:12:00', NULL),
  (13, 1, 1, 38, 3.00, '2026-06-01 08:13:00', NULL),
  (14, 1, 1, 39, 6.00, '2026-06-08 08:14:00', NULL),
  (15, 1, 1, 40, 3.00, '2026-06-15 08:15:00', NULL),
  (16, 1, 1, 41, 6.00, '2026-06-22 08:16:00', NULL),
  (17, 1, 1, 42, 3.00, '2026-06-29 08:17:00', NULL),
  (18, 1, 1, 43, 6.00, '2026-07-06 08:18:00', NULL),
  (19, 1, 1, 44, 3.00, '2026-07-13 08:19:00', NULL),
  (20, 1, 2, 26, 4.00, '2026-03-09 08:20:00', NULL),
  (21, 1, 2, 27, 4.00, '2026-03-16 08:21:00', NULL),
  (22, 1, 2, 28, 4.00, '2026-03-23 08:22:00', NULL),
  (23, 1, 2, 29, 4.00, '2026-03-30 08:23:00', NULL),
  (24, 1, 2, 30, 4.00, '2026-04-06 08:24:00', NULL),
  (25, 1, 2, 31, 4.00, '2026-04-13 08:25:00', NULL),
  (26, 1, 2, 32, 4.00, '2026-04-20 08:26:00', NULL),
  (27, 1, 2, 33, 12.00, '2026-04-27 08:27:00', NULL),
  (28, 1, 2, 34, 4.00, '2026-05-04 08:28:00', NULL),
  (29, 1, 2, 35, 4.00, '2026-05-11 08:29:00', NULL),
  (30, 1, 2, 36, 4.00, '2026-05-18 08:30:00', NULL),
  (31, 1, 2, 37, 4.00, '2026-05-25 08:31:00', NULL),
  (32, 1, 2, 38, 4.00, '2026-06-01 08:32:00', NULL),
  (33, 1, 2, 39, 4.00, '2026-06-08 08:33:00', NULL),
  (34, 1, 2, 40, 4.00, '2026-06-15 08:34:00', NULL),
  (35, 1, 2, 41, 4.00, '2026-06-22 08:35:00', NULL),
  (36, 1, 2, 42, 4.00, '2026-06-29 08:36:00', NULL),
  (37, 1, 2, 43, 4.00, '2026-07-06 08:37:00', NULL),
  (38, 1, 2, 44, 4.00, '2026-07-13 08:38:00', NULL),
  (39, 1, 11, 26, 3.00, '2026-03-09 08:39:00', NULL),
  (40, 1, 11, 27, 3.00, '2026-03-16 08:40:00', NULL),
  (41, 1, 11, 28, 3.00, '2026-03-23 08:41:00', NULL),
  (42, 1, 11, 29, 3.00, '2026-03-30 08:42:00', NULL),
  (43, 1, 11, 30, 3.00, '2026-04-06 08:43:00', NULL),
  (44, 1, 11, 31, 3.00, '2026-04-13 08:44:00', NULL),
  (45, 1, 11, 32, 3.00, '2026-04-20 08:45:00', NULL),
  (46, 1, 11, 33, 7.00, '2026-04-27 08:46:00', NULL),
  (47, 1, 11, 34, 3.00, '2026-05-04 08:47:00', NULL),
  (48, 1, 11, 35, 3.00, '2026-05-11 08:48:00', NULL),
  (49, 1, 11, 36, 3.00, '2026-05-18 08:49:00', NULL),
  (50, 1, 11, 37, 3.00, '2026-05-25 08:50:00', NULL),
  (51, 1, 11, 38, 3.00, '2026-06-01 08:51:00', NULL),
  (52, 1, 11, 39, 3.00, '2026-06-08 08:52:00', NULL),
  (53, 1, 11, 40, 3.00, '2026-06-15 08:53:00', NULL),
  (54, 1, 11, 41, 3.00, '2026-06-22 08:54:00', NULL),
  (55, 1, 11, 42, 3.00, '2026-06-29 08:55:00', NULL),
  (56, 1, 11, 43, 3.00, '2026-07-06 08:56:00', NULL),
  (57, 1, 11, 44, 3.00, '2026-07-13 08:57:00', NULL),
  (58, 2, 3, 26, 3.00, '2026-03-09 08:58:00', NULL),
  (59, 2, 3, 27, 3.00, '2026-03-16 08:59:00', NULL),
  (60, 2, 3, 28, 3.00, '2026-03-23 08:00:00', NULL),
  (61, 2, 3, 29, 3.00, '2026-03-30 08:01:00', NULL),
  (62, 2, 3, 30, 3.00, '2026-04-06 08:02:00', NULL),
  (63, 2, 3, 31, 3.00, '2026-04-13 08:03:00', NULL),
  (64, 2, 3, 32, 3.00, '2026-04-20 08:04:00', NULL),
  (65, 2, 3, 33, 3.00, '2026-04-27 08:05:00', NULL),
  (66, 2, 3, 34, 3.00, '2026-05-04 08:06:00', NULL),
  (67, 2, 3, 35, 3.00, '2026-05-11 08:07:00', NULL),
  (68, 2, 3, 36, 3.00, '2026-05-18 08:08:00', NULL),
  (69, 2, 3, 37, 3.00, '2026-05-25 08:09:00', NULL),
  (70, 2, 3, 38, 3.00, '2026-06-01 08:10:00', NULL),
  (71, 2, 3, 39, 3.00, '2026-06-08 08:11:00', NULL),
  (72, 2, 3, 40, 3.00, '2026-06-15 08:12:00', NULL),
  (73, 2, 3, 41, 3.00, '2026-06-22 08:13:00', NULL),
  (74, 2, 3, 42, 3.00, '2026-06-29 08:14:00', NULL),
  (75, 2, 3, 43, 3.00, '2026-07-06 08:15:00', NULL),
  (76, 2, 3, 44, 3.00, '2026-07-13 08:16:00', NULL),
  (77, 2, 4, 26, 3.00, '2026-03-09 08:17:00', NULL),
  (78, 2, 4, 27, 3.00, '2026-03-16 08:18:00', NULL),
  (79, 2, 4, 28, 3.00, '2026-03-23 08:19:00', NULL),
  (80, 2, 4, 29, 3.00, '2026-03-30 08:20:00', NULL),
  (81, 2, 4, 30, 3.00, '2026-04-06 08:21:00', NULL),
  (82, 2, 4, 31, 3.00, '2026-04-13 08:22:00', NULL),
  (83, 2, 4, 32, 3.00, '2026-04-20 08:23:00', NULL),
  (84, 2, 4, 33, 3.00, '2026-04-27 08:24:00', NULL),
  (85, 2, 4, 34, 3.00, '2026-05-04 08:25:00', NULL),
  (86, 2, 4, 35, 3.00, '2026-05-11 08:26:00', NULL),
  (87, 2, 4, 36, 3.00, '2026-05-18 08:27:00', NULL),
  (88, 2, 4, 37, 3.00, '2026-05-25 08:28:00', NULL),
  (89, 2, 4, 38, 3.00, '2026-06-01 08:29:00', NULL),
  (90, 2, 4, 39, 3.00, '2026-06-08 08:30:00', NULL),
  (91, 2, 4, 40, 3.00, '2026-06-15 08:31:00', NULL),
  (92, 2, 4, 41, 3.00, '2026-06-22 08:32:00', NULL),
  (93, 2, 4, 42, 3.00, '2026-06-29 08:33:00', NULL),
  (94, 2, 4, 43, 3.00, '2026-07-06 08:34:00', NULL),
  (95, 2, 4, 44, 3.00, '2026-07-13 08:35:00', NULL),
  (96, 3, 5, 26, 4.00, '2026-03-09 08:36:00', NULL),
  (97, 3, 5, 27, 4.00, '2026-03-16 08:37:00', NULL),
  (98, 3, 5, 28, 4.00, '2026-03-23 08:38:00', NULL),
  (99, 3, 5, 29, 4.00, '2026-03-30 08:39:00', NULL),
  (100, 3, 5, 30, 4.00, '2026-04-06 08:40:00', NULL),
  (101, 3, 5, 31, 4.00, '2026-04-13 08:41:00', NULL),
  (102, 3, 5, 32, 4.00, '2026-04-20 08:42:00', NULL),
  (103, 3, 5, 33, 4.00, '2026-04-27 08:43:00', NULL),
  (104, 3, 5, 34, 4.00, '2026-05-04 08:44:00', NULL),
  (105, 3, 5, 35, 4.00, '2026-05-11 08:45:00', NULL),
  (106, 3, 5, 36, 4.00, '2026-05-18 08:46:00', NULL),
  (107, 3, 5, 37, 4.00, '2026-05-25 08:47:00', NULL),
  (108, 3, 5, 38, 4.00, '2026-06-01 08:48:00', NULL),
  (109, 3, 5, 39, 4.00, '2026-06-08 08:49:00', NULL),
  (110, 3, 5, 40, 4.00, '2026-06-15 08:50:00', NULL),
  (111, 3, 5, 41, 4.00, '2026-06-22 08:51:00', NULL),
  (112, 3, 5, 42, 4.00, '2026-06-29 08:52:00', NULL),
  (113, 3, 5, 43, 4.00, '2026-07-06 08:53:00', NULL),
  (114, 3, 5, 44, 4.00, '2026-07-13 08:54:00', NULL),
  (115, 3, 6, 26, 3.00, '2026-03-09 08:55:00', NULL),
  (116, 3, 6, 27, 6.00, '2026-03-16 08:56:00', NULL),
  (117, 3, 6, 28, 3.00, '2026-03-23 08:57:00', NULL),
  (118, 3, 6, 29, 6.00, '2026-03-30 08:58:00', NULL),
  (119, 3, 6, 30, 3.00, '2026-04-06 08:59:00', NULL),
  (120, 3, 6, 31, 6.00, '2026-04-13 08:00:00', NULL),
  (121, 3, 6, 32, 3.00, '2026-04-20 08:01:00', NULL),
  (122, 3, 6, 33, 6.00, '2026-04-27 08:02:00', NULL),
  (123, 3, 6, 34, 3.00, '2026-05-04 08:03:00', NULL),
  (124, 3, 6, 35, 6.00, '2026-05-11 08:04:00', NULL),
  (125, 3, 6, 36, 3.00, '2026-05-18 08:05:00', NULL),
  (126, 3, 6, 37, 6.00, '2026-05-25 08:06:00', NULL),
  (127, 3, 6, 38, 3.00, '2026-06-01 08:07:00', NULL),
  (128, 3, 6, 39, 6.00, '2026-06-08 08:08:00', NULL),
  (129, 3, 6, 40, 3.00, '2026-06-15 08:09:00', NULL),
  (130, 3, 6, 41, 6.00, '2026-06-22 08:10:00', NULL),
  (131, 3, 6, 42, 3.00, '2026-06-29 08:11:00', NULL),
  (132, 3, 6, 43, 6.00, '2026-07-06 08:12:00', NULL),
  (133, 3, 6, 44, 3.00, '2026-07-13 08:13:00', NULL),
  (134, 4, 7, 26, 4.00, '2026-03-09 08:14:00', NULL),
  (135, 4, 7, 27, 7.00, '2026-03-16 08:15:00', NULL),
  (136, 4, 7, 28, 4.00, '2026-03-23 08:16:00', NULL),
  (137, 4, 7, 29, 7.00, '2026-03-30 08:17:00', NULL),
  (138, 4, 7, 30, 4.00, '2026-04-06 08:18:00', NULL),
  (139, 4, 7, 31, 7.00, '2026-04-13 08:19:00', NULL),
  (140, 4, 7, 32, 4.00, '2026-04-20 08:20:00', NULL),
  (141, 4, 7, 33, 7.00, '2026-04-27 08:21:00', NULL),
  (142, 4, 7, 34, 4.00, '2026-05-04 08:22:00', NULL),
  (143, 4, 7, 35, 7.00, '2026-05-11 08:23:00', NULL),
  (144, 4, 7, 36, 4.00, '2026-05-18 08:24:00', NULL),
  (145, 4, 7, 37, 7.00, '2026-05-25 08:25:00', NULL),
  (146, 4, 7, 38, 4.00, '2026-06-01 08:26:00', NULL),
  (147, 4, 7, 39, 7.00, '2026-06-08 08:27:00', NULL),
  (148, 4, 7, 40, 4.00, '2026-06-15 08:28:00', NULL),
  (149, 4, 7, 41, 7.00, '2026-06-22 08:29:00', NULL),
  (150, 4, 7, 42, 4.00, '2026-06-29 08:30:00', NULL),
  (151, 4, 7, 43, 7.00, '2026-07-06 08:31:00', NULL),
  (152, 4, 7, 44, 4.00, '2026-07-13 08:32:00', NULL),
  (153, 4, 8, 26, 3.00, '2026-03-09 08:33:00', NULL),
  (154, 4, 8, 27, 3.00, '2026-03-16 08:34:00', NULL),
  (155, 4, 8, 28, 3.00, '2026-03-23 08:35:00', NULL),
  (156, 4, 8, 29, 3.00, '2026-03-30 08:36:00', NULL),
  (157, 4, 8, 30, 3.00, '2026-04-06 08:37:00', NULL),
  (158, 4, 8, 31, 3.00, '2026-04-13 08:38:00', NULL),
  (159, 4, 8, 32, 3.00, '2026-04-20 08:39:00', NULL),
  (160, 4, 8, 33, 3.00, '2026-04-27 08:40:00', NULL),
  (161, 4, 8, 34, 3.00, '2026-05-04 08:41:00', NULL),
  (162, 4, 8, 35, 3.00, '2026-05-11 08:42:00', NULL),
  (163, 4, 8, 36, 3.00, '2026-05-18 08:43:00', NULL),
  (164, 4, 8, 37, 3.00, '2026-05-25 08:44:00', NULL),
  (165, 4, 8, 38, 3.00, '2026-06-01 08:45:00', NULL),
  (166, 4, 8, 39, 3.00, '2026-06-08 08:46:00', NULL),
  (167, 4, 8, 40, 3.00, '2026-06-15 08:47:00', NULL),
  (168, 4, 8, 41, 3.00, '2026-06-22 08:48:00', NULL),
  (169, 4, 8, 42, 3.00, '2026-06-29 08:49:00', NULL),
  (170, 4, 8, 43, 3.00, '2026-07-06 08:50:00', NULL),
  (171, 4, 8, 44, 3.00, '2026-07-13 08:51:00', NULL),
  (172, 5, 9, 26, 4.00, '2026-03-09 08:52:00', NULL),
  (173, 5, 9, 27, 2.00, '2026-03-16 08:53:00', NULL),
  (174, 5, 9, 28, 4.00, '2026-03-23 08:54:00', NULL),
  (175, 5, 9, 29, 2.00, '2026-03-30 08:55:00', NULL),
  (176, 5, 9, 30, 4.00, '2026-04-06 08:56:00', NULL),
  (177, 5, 9, 31, 2.00, '2026-04-13 08:57:00', NULL),
  (178, 5, 9, 32, 4.00, '2026-04-20 08:58:00', NULL),
  (179, 5, 9, 33, 2.00, '2026-04-27 08:59:00', NULL),
  (180, 5, 9, 34, 4.00, '2026-05-04 08:00:00', NULL),
  (181, 5, 9, 35, 2.00, '2026-05-11 08:01:00', NULL),
  (182, 5, 9, 36, 4.00, '2026-05-18 08:02:00', NULL),
  (183, 5, 9, 37, 2.00, '2026-05-25 08:03:00', NULL),
  (184, 5, 9, 38, 4.00, '2026-06-01 08:04:00', NULL),
  (185, 5, 9, 39, 2.00, '2026-06-08 08:05:00', NULL),
  (186, 5, 9, 40, 4.00, '2026-06-15 08:06:00', NULL),
  (187, 5, 9, 41, 2.00, '2026-06-22 08:07:00', NULL),
  (188, 5, 9, 42, 4.00, '2026-06-29 08:08:00', NULL),
  (189, 5, 9, 43, 2.00, '2026-07-06 08:09:00', NULL),
  (190, 5, 9, 44, 4.00, '2026-07-13 08:10:00', NULL),
  (191, 5, 10, 26, 3.00, '2026-03-09 08:11:00', NULL),
  (192, 5, 10, 27, 3.00, '2026-03-16 08:12:00', NULL),
  (193, 5, 10, 28, 3.00, '2026-03-23 08:13:00', NULL),
  (194, 5, 10, 29, 3.00, '2026-03-30 08:14:00', NULL),
  (195, 5, 10, 30, 3.00, '2026-04-06 08:15:00', NULL),
  (196, 5, 10, 31, 3.00, '2026-04-13 08:16:00', NULL),
  (197, 5, 10, 32, 3.00, '2026-04-20 08:17:00', NULL),
  (198, 5, 10, 33, 3.00, '2026-04-27 08:18:00', NULL),
  (199, 5, 10, 34, 3.00, '2026-05-04 08:19:00', NULL),
  (200, 5, 10, 35, 3.00, '2026-05-11 08:20:00', NULL),
  (201, 5, 10, 36, 3.00, '2026-05-18 08:21:00', NULL),
  (202, 5, 10, 37, 3.00, '2026-05-25 08:22:00', NULL),
  (203, 5, 10, 38, 3.00, '2026-06-01 08:23:00', NULL),
  (204, 5, 10, 39, 3.00, '2026-06-08 08:24:00', NULL),
  (205, 5, 10, 40, 3.00, '2026-06-15 08:25:00', NULL),
  (206, 5, 10, 41, 3.00, '2026-06-22 08:26:00', NULL),
  (207, 5, 10, 42, 3.00, '2026-06-29 08:27:00', NULL),
  (208, 5, 10, 43, 3.00, '2026-07-06 08:28:00', NULL),
  (209, 5, 10, 44, 3.00, '2026-07-13 08:29:00', NULL),
  (210, 5, 12, 26, 3.00, '2026-03-09 08:30:00', NULL),
  (211, 5, 12, 27, 3.00, '2026-03-16 08:31:00', NULL),
  (212, 5, 12, 28, 3.00, '2026-03-23 08:32:00', NULL),
  (213, 5, 12, 29, 3.00, '2026-03-30 08:33:00', NULL),
  (214, 5, 12, 30, 3.00, '2026-04-06 08:34:00', NULL),
  (215, 5, 12, 31, 3.00, '2026-04-13 08:35:00', NULL),
  (216, 5, 12, 32, 3.00, '2026-04-20 08:36:00', NULL),
  (217, 5, 12, 33, 3.00, '2026-04-27 08:37:00', NULL),
  (218, 5, 12, 34, 3.00, '2026-05-04 08:38:00', NULL),
  (219, 5, 12, 35, 3.00, '2026-05-11 08:39:00', NULL),
  (220, 5, 12, 36, 3.00, '2026-05-18 08:40:00', NULL),
  (221, 5, 12, 37, 3.00, '2026-05-25 08:41:00', NULL),
  (222, 5, 12, 38, 3.00, '2026-06-01 08:42:00', NULL),
  (223, 5, 12, 39, 3.00, '2026-06-08 08:43:00', NULL),
  (224, 5, 12, 40, 3.00, '2026-06-15 08:44:00', NULL),
  (225, 5, 12, 41, 3.00, '2026-06-22 08:45:00', NULL),
  (226, 5, 12, 42, 3.00, '2026-06-29 08:46:00', NULL),
  (227, 5, 12, 43, 3.00, '2026-07-06 08:47:00', NULL),
  (228, 5, 12, 44, 3.00, '2026-07-13 08:48:00', NULL);

INSERT INTO `planning_submissions` (`id`, `formateur_id`, `semaine`, `academic_year`, `submitted_hours`, `status`, `submitted_at`, `processed_at`, `processed_by`, `decision_note`, `snapshot_entries`, `snapshot_total_hours`, `snapshot_captured_at`) VALUES
  (1, 1, 26, 2026, 10.00, 'approved', '2026-03-06 12:00:00', '2026-03-14 17:00:00', 1, 'Planning valide pour execution.', '[{"id":1,"formateur_id":1,"module_id":1,"semaine":26,"heures":3.0},{"id":3,"formateur_id":1,"module_id":2,"semaine":26,"heures":4.0},{"id":2,"formateur_id":1,"module_id":11,"semaine":26,"heures":3.0}]', 10.00, '2026-03-14 17:00:00'),
  (2, 1, 27, 2026, 13.00, 'approved', '2026-03-13 12:00:00', '2026-03-21 17:00:00', 2, 'Planning valide pour execution.', '[{"id":14,"formateur_id":1,"module_id":1,"semaine":27,"heures":6.0},{"id":16,"formateur_id":1,"module_id":2,"semaine":27,"heures":4.0},{"id":15,"formateur_id":1,"module_id":11,"semaine":27,"heures":3.0}]', 13.00, '2026-03-21 17:00:00'),
  (3, 1, 28, 2026, 10.00, 'approved', '2026-03-20 12:00:00', '2026-03-28 17:00:00', 1, 'Planning valide pour execution.', '[{"id":29,"formateur_id":1,"module_id":1,"semaine":28,"heures":3.0},{"id":31,"formateur_id":1,"module_id":2,"semaine":28,"heures":4.0},{"id":30,"formateur_id":1,"module_id":11,"semaine":28,"heures":3.0}]', 10.00, '2026-03-28 17:00:00'),
  (4, 1, 29, 2026, 13.00, 'approved', '2026-03-27 12:00:00', '2026-03-30 09:30:00', 2, 'Semaine validee pour suivi en cours.', '[{"id":42,"formateur_id":1,"module_id":1,"semaine":29,"heures":6.0},{"id":44,"formateur_id":1,"module_id":2,"semaine":29,"heures":4.0},{"id":43,"formateur_id":1,"module_id":11,"semaine":29,"heures":3.0}]', 13.00, '2026-03-30 09:30:00'),
  (5, 1, 30, 2026, 10.00, 'approved', '2026-04-03 12:00:00', '2026-04-04 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":57,"formateur_id":1,"module_id":1,"semaine":30,"heures":3.0},{"id":59,"formateur_id":1,"module_id":2,"semaine":30,"heures":4.0},{"id":58,"formateur_id":1,"module_id":11,"semaine":30,"heures":3.0}]', 10.00, '2026-04-04 16:00:00'),
  (6, 1, 31, 2026, 13.00, 'approved', '2026-04-10 12:00:00', '2026-04-11 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":70,"formateur_id":1,"module_id":1,"semaine":31,"heures":6.0},{"id":72,"formateur_id":1,"module_id":2,"semaine":31,"heures":4.0},{"id":71,"formateur_id":1,"module_id":11,"semaine":31,"heures":3.0}]', 13.00, '2026-04-11 16:00:00'),
  (7, 1, 32, 2026, 10.00, 'approved', '2026-04-17 12:00:00', '2026-04-18 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":85,"formateur_id":1,"module_id":1,"semaine":32,"heures":3.0},{"id":87,"formateur_id":1,"module_id":2,"semaine":32,"heures":4.0},{"id":86,"formateur_id":1,"module_id":11,"semaine":32,"heures":3.0}]', 10.00, '2026-04-18 16:00:00'),
  (8, 1, 33, 2026, 25.00, 'approved', '2026-04-24 12:00:00', '2026-04-25 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":98,"formateur_id":1,"module_id":1,"semaine":33,"heures":6.0},{"id":100,"formateur_id":1,"module_id":2,"semaine":33,"heures":12.0},{"id":99,"formateur_id":1,"module_id":11,"semaine":33,"heures":7.0}]', 25.00, '2026-04-25 16:00:00'),
  (9, 1, 34, 2026, 10.00, 'approved', '2026-05-01 12:00:00', '2026-05-02 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":116,"formateur_id":1,"module_id":1,"semaine":34,"heures":3.0},{"id":118,"formateur_id":1,"module_id":2,"semaine":34,"heures":4.0},{"id":117,"formateur_id":1,"module_id":11,"semaine":34,"heures":3.0}]', 10.00, '2026-05-02 16:00:00'),
  (10, 1, 35, 2026, 13.00, 'approved', '2026-05-08 12:00:00', '2026-05-09 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":129,"formateur_id":1,"module_id":1,"semaine":35,"heures":6.0},{"id":131,"formateur_id":1,"module_id":2,"semaine":35,"heures":4.0},{"id":130,"formateur_id":1,"module_id":11,"semaine":35,"heures":3.0}]', 13.00, '2026-05-09 16:00:00'),
  (11, 1, 36, 2026, 10.00, 'approved', '2026-05-15 12:00:00', '2026-05-16 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":144,"formateur_id":1,"module_id":1,"semaine":36,"heures":3.0},{"id":146,"formateur_id":1,"module_id":2,"semaine":36,"heures":4.0},{"id":145,"formateur_id":1,"module_id":11,"semaine":36,"heures":3.0}]', 10.00, '2026-05-16 16:00:00'),
  (12, 1, 37, 2026, 13.00, 'approved', '2026-05-22 12:00:00', '2026-05-23 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":157,"formateur_id":1,"module_id":1,"semaine":37,"heures":6.0},{"id":159,"formateur_id":1,"module_id":2,"semaine":37,"heures":4.0},{"id":158,"formateur_id":1,"module_id":11,"semaine":37,"heures":3.0}]', 13.00, '2026-05-23 16:00:00'),
  (13, 1, 38, 2026, 10.00, 'approved', '2026-05-29 12:00:00', '2026-05-30 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":172,"formateur_id":1,"module_id":1,"semaine":38,"heures":3.0},{"id":174,"formateur_id":1,"module_id":2,"semaine":38,"heures":4.0},{"id":173,"formateur_id":1,"module_id":11,"semaine":38,"heures":3.0}]', 10.00, '2026-05-30 16:00:00'),
  (14, 1, 39, 2026, 13.00, 'approved', '2026-06-05 12:00:00', '2026-06-06 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":185,"formateur_id":1,"module_id":1,"semaine":39,"heures":6.0},{"id":187,"formateur_id":1,"module_id":2,"semaine":39,"heures":4.0},{"id":186,"formateur_id":1,"module_id":11,"semaine":39,"heures":3.0}]', 13.00, '2026-06-06 16:00:00'),
  (15, 1, 40, 2026, 10.00, 'approved', '2026-06-12 12:00:00', '2026-06-13 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":200,"formateur_id":1,"module_id":1,"semaine":40,"heures":3.0},{"id":202,"formateur_id":1,"module_id":2,"semaine":40,"heures":4.0},{"id":201,"formateur_id":1,"module_id":11,"semaine":40,"heures":3.0}]', 10.00, '2026-06-13 16:00:00'),
  (16, 1, 41, 2026, 13.00, 'approved', '2026-06-19 12:00:00', '2026-06-20 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":213,"formateur_id":1,"module_id":1,"semaine":41,"heures":6.0},{"id":215,"formateur_id":1,"module_id":2,"semaine":41,"heures":4.0},{"id":214,"formateur_id":1,"module_id":11,"semaine":41,"heures":3.0}]', 13.00, '2026-06-20 16:00:00'),
  (17, 1, 42, 2026, 10.00, 'approved', '2026-06-26 12:00:00', '2026-06-27 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":228,"formateur_id":1,"module_id":1,"semaine":42,"heures":3.0},{"id":230,"formateur_id":1,"module_id":2,"semaine":42,"heures":4.0},{"id":229,"formateur_id":1,"module_id":11,"semaine":42,"heures":3.0}]', 10.00, '2026-06-27 16:00:00'),
  (18, 1, 43, 2026, 13.00, 'approved', '2026-07-03 12:00:00', '2026-07-04 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":241,"formateur_id":1,"module_id":1,"semaine":43,"heures":6.0},{"id":243,"formateur_id":1,"module_id":2,"semaine":43,"heures":4.0},{"id":242,"formateur_id":1,"module_id":11,"semaine":43,"heures":3.0}]', 13.00, '2026-07-04 16:00:00'),
  (19, 1, 44, 2026, 10.00, 'approved', '2026-07-10 12:00:00', '2026-07-11 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":256,"formateur_id":1,"module_id":1,"semaine":44,"heures":3.0},{"id":258,"formateur_id":1,"module_id":2,"semaine":44,"heures":4.0},{"id":257,"formateur_id":1,"module_id":11,"semaine":44,"heures":3.0}]', 10.00, '2026-07-11 16:00:00'),
  (20, 2, 26, 2026, 6.00, 'approved', '2026-03-06 12:00:00', '2026-03-14 17:00:00', 1, 'Planning valide pour execution.', '[{"id":4,"formateur_id":2,"module_id":3,"semaine":26,"heures":3.0},{"id":5,"formateur_id":2,"module_id":4,"semaine":26,"heures":3.0}]', 6.00, '2026-03-14 17:00:00'),
  (21, 2, 27, 2026, 6.00, 'approved', '2026-03-13 12:00:00', '2026-03-21 17:00:00', 2, 'Planning valide pour execution.', '[{"id":18,"formateur_id":2,"module_id":3,"semaine":27,"heures":3.0},{"id":19,"formateur_id":2,"module_id":4,"semaine":27,"heures":3.0}]', 6.00, '2026-03-21 17:00:00'),
  (22, 2, 28, 2026, 6.00, 'approved', '2026-03-20 12:00:00', '2026-03-28 17:00:00', 1, 'Planning valide pour execution.', '[{"id":32,"formateur_id":2,"module_id":3,"semaine":28,"heures":3.0},{"id":33,"formateur_id":2,"module_id":4,"semaine":28,"heures":3.0}]', 6.00, '2026-03-28 17:00:00'),
  (23, 2, 29, 2026, 6.00, 'pending', '2026-03-27 12:00:00', NULL, NULL, NULL, NULL, NULL, NULL),
  (24, 2, 30, 2026, 6.00, 'approved', '2026-04-03 12:00:00', '2026-04-04 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":60,"formateur_id":2,"module_id":3,"semaine":30,"heures":3.0},{"id":61,"formateur_id":2,"module_id":4,"semaine":30,"heures":3.0}]', 6.00, '2026-04-04 16:00:00'),
  (25, 2, 31, 2026, 6.00, 'approved', '2026-04-10 12:00:00', '2026-04-11 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":74,"formateur_id":2,"module_id":3,"semaine":31,"heures":3.0},{"id":75,"formateur_id":2,"module_id":4,"semaine":31,"heures":3.0}]', 6.00, '2026-04-11 16:00:00'),
  (26, 2, 32, 2026, 6.00, 'approved', '2026-04-17 12:00:00', '2026-04-18 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":88,"formateur_id":2,"module_id":3,"semaine":32,"heures":3.0},{"id":89,"formateur_id":2,"module_id":4,"semaine":32,"heures":3.0}]', 6.00, '2026-04-18 16:00:00'),
  (27, 2, 33, 2026, 6.00, 'approved', '2026-04-24 12:00:00', '2026-04-25 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":105,"formateur_id":2,"module_id":3,"semaine":33,"heures":3.0},{"id":106,"formateur_id":2,"module_id":4,"semaine":33,"heures":3.0}]', 6.00, '2026-04-25 16:00:00'),
  (28, 2, 34, 2026, 6.00, 'approved', '2026-05-01 12:00:00', '2026-05-02 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":119,"formateur_id":2,"module_id":3,"semaine":34,"heures":3.0},{"id":120,"formateur_id":2,"module_id":4,"semaine":34,"heures":3.0}]', 6.00, '2026-05-02 16:00:00'),
  (29, 2, 35, 2026, 6.00, 'pending', '2026-05-08 12:00:00', NULL, NULL, NULL, NULL, NULL, NULL),
  (30, 2, 36, 2026, 6.00, 'approved', '2026-05-15 12:00:00', '2026-05-16 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":147,"formateur_id":2,"module_id":3,"semaine":36,"heures":3.0},{"id":148,"formateur_id":2,"module_id":4,"semaine":36,"heures":3.0}]', 6.00, '2026-05-16 16:00:00'),
  (31, 2, 37, 2026, 6.00, 'approved', '2026-05-22 12:00:00', '2026-05-23 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":161,"formateur_id":2,"module_id":3,"semaine":37,"heures":3.0},{"id":162,"formateur_id":2,"module_id":4,"semaine":37,"heures":3.0}]', 6.00, '2026-05-23 16:00:00'),
  (32, 2, 38, 2026, 6.00, 'approved', '2026-05-29 12:00:00', '2026-05-30 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":175,"formateur_id":2,"module_id":3,"semaine":38,"heures":3.0},{"id":176,"formateur_id":2,"module_id":4,"semaine":38,"heures":3.0}]', 6.00, '2026-05-30 16:00:00'),
  (33, 2, 39, 2026, 6.00, 'approved', '2026-06-05 12:00:00', '2026-06-06 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":189,"formateur_id":2,"module_id":3,"semaine":39,"heures":3.0},{"id":190,"formateur_id":2,"module_id":4,"semaine":39,"heures":3.0}]', 6.00, '2026-06-06 16:00:00'),
  (34, 2, 40, 2026, 6.00, 'approved', '2026-06-12 12:00:00', '2026-06-13 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":203,"formateur_id":2,"module_id":3,"semaine":40,"heures":3.0},{"id":204,"formateur_id":2,"module_id":4,"semaine":40,"heures":3.0}]', 6.00, '2026-06-13 16:00:00'),
  (35, 2, 41, 2026, 6.00, 'approved', '2026-06-19 12:00:00', '2026-06-20 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":217,"formateur_id":2,"module_id":3,"semaine":41,"heures":3.0},{"id":218,"formateur_id":2,"module_id":4,"semaine":41,"heures":3.0}]', 6.00, '2026-06-20 16:00:00'),
  (36, 2, 42, 2026, 6.00, 'approved', '2026-06-26 12:00:00', '2026-06-27 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":231,"formateur_id":2,"module_id":3,"semaine":42,"heures":3.0},{"id":232,"formateur_id":2,"module_id":4,"semaine":42,"heures":3.0}]', 6.00, '2026-06-27 16:00:00'),
  (37, 2, 43, 2026, 6.00, 'approved', '2026-07-03 12:00:00', '2026-07-04 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":245,"formateur_id":2,"module_id":3,"semaine":43,"heures":3.0},{"id":246,"formateur_id":2,"module_id":4,"semaine":43,"heures":3.0}]', 6.00, '2026-07-04 16:00:00'),
  (38, 2, 44, 2026, 6.00, 'approved', '2026-07-10 12:00:00', '2026-07-11 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":259,"formateur_id":2,"module_id":3,"semaine":44,"heures":3.0},{"id":260,"formateur_id":2,"module_id":4,"semaine":44,"heures":3.0}]', 6.00, '2026-07-11 16:00:00'),
  (39, 3, 26, 2026, 7.00, 'approved', '2026-03-06 12:00:00', '2026-03-14 17:00:00', 1, 'Planning valide pour execution.', '[{"id":7,"formateur_id":3,"module_id":5,"semaine":26,"heures":4.0},{"id":6,"formateur_id":3,"module_id":6,"semaine":26,"heures":3.0}]', 7.00, '2026-03-14 17:00:00'),
  (40, 3, 27, 2026, 10.00, 'approved', '2026-03-13 12:00:00', '2026-03-21 17:00:00', 2, 'Planning valide pour execution.', '[{"id":21,"formateur_id":3,"module_id":5,"semaine":27,"heures":4.0},{"id":20,"formateur_id":3,"module_id":6,"semaine":27,"heures":6.0}]', 10.00, '2026-03-21 17:00:00'),
  (41, 3, 28, 2026, 7.00, 'approved', '2026-03-20 12:00:00', '2026-03-28 17:00:00', 1, 'Planning valide pour execution.', '[{"id":35,"formateur_id":3,"module_id":5,"semaine":28,"heures":4.0},{"id":34,"formateur_id":3,"module_id":6,"semaine":28,"heures":3.0}]', 7.00, '2026-03-28 17:00:00'),
  (42, 3, 29, 2026, 10.00, 'approved', '2026-03-27 12:00:00', '2026-03-30 09:50:00', 2, 'Semaine validee pour suivi en cours.', '[{"id":49,"formateur_id":3,"module_id":5,"semaine":29,"heures":4.0},{"id":48,"formateur_id":3,"module_id":6,"semaine":29,"heures":6.0}]', 10.00, '2026-03-30 09:50:00'),
  (43, 3, 30, 2026, 7.00, 'approved', '2026-04-03 12:00:00', '2026-04-04 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":63,"formateur_id":3,"module_id":5,"semaine":30,"heures":4.0},{"id":62,"formateur_id":3,"module_id":6,"semaine":30,"heures":3.0}]', 7.00, '2026-04-04 16:00:00'),
  (44, 3, 31, 2026, 10.00, 'approved', '2026-04-10 12:00:00', '2026-04-11 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":77,"formateur_id":3,"module_id":5,"semaine":31,"heures":4.0},{"id":76,"formateur_id":3,"module_id":6,"semaine":31,"heures":6.0}]', 10.00, '2026-04-11 16:00:00'),
  (45, 3, 32, 2026, 7.00, 'approved', '2026-04-17 12:00:00', '2026-04-18 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":91,"formateur_id":3,"module_id":5,"semaine":32,"heures":4.0},{"id":90,"formateur_id":3,"module_id":6,"semaine":32,"heures":3.0}]', 7.00, '2026-04-18 16:00:00'),
  (46, 3, 33, 2026, 10.00, 'approved', '2026-04-24 12:00:00', '2026-04-25 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":108,"formateur_id":3,"module_id":5,"semaine":33,"heures":4.0},{"id":107,"formateur_id":3,"module_id":6,"semaine":33,"heures":6.0}]', 10.00, '2026-04-25 16:00:00'),
  (47, 3, 34, 2026, 7.00, 'approved', '2026-05-01 12:00:00', '2026-05-02 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":122,"formateur_id":3,"module_id":5,"semaine":34,"heures":4.0},{"id":121,"formateur_id":3,"module_id":6,"semaine":34,"heures":3.0}]', 7.00, '2026-05-02 16:00:00'),
  (48, 3, 35, 2026, 10.00, 'approved', '2026-05-08 12:00:00', '2026-05-09 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":136,"formateur_id":3,"module_id":5,"semaine":35,"heures":4.0},{"id":135,"formateur_id":3,"module_id":6,"semaine":35,"heures":6.0}]', 10.00, '2026-05-09 16:00:00'),
  (49, 3, 36, 2026, 7.00, 'approved', '2026-05-15 12:00:00', '2026-05-16 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":150,"formateur_id":3,"module_id":5,"semaine":36,"heures":4.0},{"id":149,"formateur_id":3,"module_id":6,"semaine":36,"heures":3.0}]', 7.00, '2026-05-16 16:00:00'),
  (50, 3, 37, 2026, 10.00, 'approved', '2026-05-22 12:00:00', '2026-05-23 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":164,"formateur_id":3,"module_id":5,"semaine":37,"heures":4.0},{"id":163,"formateur_id":3,"module_id":6,"semaine":37,"heures":6.0}]', 10.00, '2026-05-23 16:00:00'),
  (51, 3, 38, 2026, 7.00, 'approved', '2026-05-29 12:00:00', '2026-05-30 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":178,"formateur_id":3,"module_id":5,"semaine":38,"heures":4.0},{"id":177,"formateur_id":3,"module_id":6,"semaine":38,"heures":3.0}]', 7.00, '2026-05-30 16:00:00'),
  (52, 3, 39, 2026, 10.00, 'approved', '2026-06-05 12:00:00', '2026-06-06 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":192,"formateur_id":3,"module_id":5,"semaine":39,"heures":4.0},{"id":191,"formateur_id":3,"module_id":6,"semaine":39,"heures":6.0}]', 10.00, '2026-06-06 16:00:00'),
  (53, 3, 40, 2026, 7.00, 'approved', '2026-06-12 12:00:00', '2026-06-13 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":206,"formateur_id":3,"module_id":5,"semaine":40,"heures":4.0},{"id":205,"formateur_id":3,"module_id":6,"semaine":40,"heures":3.0}]', 7.00, '2026-06-13 16:00:00'),
  (54, 3, 41, 2026, 10.00, 'approved', '2026-06-19 12:00:00', '2026-06-20 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":220,"formateur_id":3,"module_id":5,"semaine":41,"heures":4.0},{"id":219,"formateur_id":3,"module_id":6,"semaine":41,"heures":6.0}]', 10.00, '2026-06-20 16:00:00'),
  (55, 3, 42, 2026, 7.00, 'approved', '2026-06-26 12:00:00', '2026-06-27 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":234,"formateur_id":3,"module_id":5,"semaine":42,"heures":4.0},{"id":233,"formateur_id":3,"module_id":6,"semaine":42,"heures":3.0}]', 7.00, '2026-06-27 16:00:00'),
  (56, 3, 43, 2026, 10.00, 'approved', '2026-07-03 12:00:00', '2026-07-04 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":248,"formateur_id":3,"module_id":5,"semaine":43,"heures":4.0},{"id":247,"formateur_id":3,"module_id":6,"semaine":43,"heures":6.0}]', 10.00, '2026-07-04 16:00:00'),
  (57, 3, 44, 2026, 7.00, 'approved', '2026-07-10 12:00:00', '2026-07-11 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":262,"formateur_id":3,"module_id":5,"semaine":44,"heures":4.0},{"id":261,"formateur_id":3,"module_id":6,"semaine":44,"heures":3.0}]', 7.00, '2026-07-11 16:00:00'),
  (58, 4, 26, 2026, 7.00, 'approved', '2026-03-06 12:00:00', '2026-03-14 17:00:00', 1, 'Planning valide pour execution.', '[{"id":9,"formateur_id":4,"module_id":7,"semaine":26,"heures":4.0},{"id":8,"formateur_id":4,"module_id":8,"semaine":26,"heures":3.0}]', 7.00, '2026-03-14 17:00:00'),
  (59, 4, 27, 2026, 10.00, 'approved', '2026-03-13 12:00:00', '2026-03-21 17:00:00', 2, 'Planning valide pour execution.', '[{"id":24,"formateur_id":4,"module_id":7,"semaine":27,"heures":7.0},{"id":23,"formateur_id":4,"module_id":8,"semaine":27,"heures":3.0}]', 10.00, '2026-03-21 17:00:00'),
  (60, 4, 28, 2026, 7.00, 'approved', '2026-03-20 12:00:00', '2026-03-28 17:00:00', 1, 'Planning valide pour execution.', '[{"id":37,"formateur_id":4,"module_id":7,"semaine":28,"heures":4.0},{"id":36,"formateur_id":4,"module_id":8,"semaine":28,"heures":3.0}]', 7.00, '2026-03-28 17:00:00'),
  (61, 4, 29, 2026, 10.00, 'revision', '2026-03-27 12:00:00', '2026-03-30 10:20:00', 1, 'Merci de revoir la repartition de la charge cloud.', '[{"id":52,"formateur_id":4,"module_id":7,"semaine":29,"heures":7.0},{"id":51,"formateur_id":4,"module_id":8,"semaine":29,"heures":3.0}]', 10.00, '2026-03-30 10:20:00'),
  (62, 4, 30, 2026, 7.00, 'approved', '2026-04-03 12:00:00', '2026-04-04 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":65,"formateur_id":4,"module_id":7,"semaine":30,"heures":4.0},{"id":64,"formateur_id":4,"module_id":8,"semaine":30,"heures":3.0}]', 7.00, '2026-04-04 16:00:00'),
  (63, 4, 31, 2026, 10.00, 'approved', '2026-04-10 12:00:00', '2026-04-11 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":80,"formateur_id":4,"module_id":7,"semaine":31,"heures":7.0},{"id":79,"formateur_id":4,"module_id":8,"semaine":31,"heures":3.0}]', 10.00, '2026-04-11 16:00:00'),
  (64, 4, 32, 2026, 7.00, 'approved', '2026-04-17 12:00:00', '2026-04-18 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":93,"formateur_id":4,"module_id":7,"semaine":32,"heures":4.0},{"id":92,"formateur_id":4,"module_id":8,"semaine":32,"heures":3.0}]', 7.00, '2026-04-18 16:00:00'),
  (65, 4, 33, 2026, 10.00, 'approved', '2026-04-24 12:00:00', '2026-04-25 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":111,"formateur_id":4,"module_id":7,"semaine":33,"heures":7.0},{"id":110,"formateur_id":4,"module_id":8,"semaine":33,"heures":3.0}]', 10.00, '2026-04-25 16:00:00'),
  (66, 4, 34, 2026, 7.00, 'approved', '2026-05-01 12:00:00', '2026-05-02 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":124,"formateur_id":4,"module_id":7,"semaine":34,"heures":4.0},{"id":123,"formateur_id":4,"module_id":8,"semaine":34,"heures":3.0}]', 7.00, '2026-05-02 16:00:00'),
  (67, 4, 35, 2026, 10.00, 'pending', '2026-05-08 12:00:00', NULL, NULL, NULL, NULL, NULL, NULL),
  (68, 4, 36, 2026, 7.00, 'approved', '2026-05-15 12:00:00', '2026-05-16 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":152,"formateur_id":4,"module_id":7,"semaine":36,"heures":4.0},{"id":151,"formateur_id":4,"module_id":8,"semaine":36,"heures":3.0}]', 7.00, '2026-05-16 16:00:00'),
  (69, 4, 37, 2026, 10.00, 'approved', '2026-05-22 12:00:00', '2026-05-23 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":167,"formateur_id":4,"module_id":7,"semaine":37,"heures":7.0},{"id":166,"formateur_id":4,"module_id":8,"semaine":37,"heures":3.0}]', 10.00, '2026-05-23 16:00:00'),
  (70, 4, 38, 2026, 7.00, 'approved', '2026-05-29 12:00:00', '2026-05-30 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":180,"formateur_id":4,"module_id":7,"semaine":38,"heures":4.0},{"id":179,"formateur_id":4,"module_id":8,"semaine":38,"heures":3.0}]', 7.00, '2026-05-30 16:00:00'),
  (71, 4, 39, 2026, 10.00, 'approved', '2026-06-05 12:00:00', '2026-06-06 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":195,"formateur_id":4,"module_id":7,"semaine":39,"heures":7.0},{"id":194,"formateur_id":4,"module_id":8,"semaine":39,"heures":3.0}]', 10.00, '2026-06-06 16:00:00'),
  (72, 4, 40, 2026, 7.00, 'approved', '2026-06-12 12:00:00', '2026-06-13 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":208,"formateur_id":4,"module_id":7,"semaine":40,"heures":4.0},{"id":207,"formateur_id":4,"module_id":8,"semaine":40,"heures":3.0}]', 7.00, '2026-06-13 16:00:00'),
  (73, 4, 41, 2026, 10.00, 'approved', '2026-06-19 12:00:00', '2026-06-20 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":223,"formateur_id":4,"module_id":7,"semaine":41,"heures":7.0},{"id":222,"formateur_id":4,"module_id":8,"semaine":41,"heures":3.0}]', 10.00, '2026-06-20 16:00:00'),
  (74, 4, 42, 2026, 7.00, 'approved', '2026-06-26 12:00:00', '2026-06-27 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":236,"formateur_id":4,"module_id":7,"semaine":42,"heures":4.0},{"id":235,"formateur_id":4,"module_id":8,"semaine":42,"heures":3.0}]', 7.00, '2026-06-27 16:00:00'),
  (75, 4, 43, 2026, 10.00, 'approved', '2026-07-03 12:00:00', '2026-07-04 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":251,"formateur_id":4,"module_id":7,"semaine":43,"heures":7.0},{"id":250,"formateur_id":4,"module_id":8,"semaine":43,"heures":3.0}]', 10.00, '2026-07-04 16:00:00'),
  (76, 4, 44, 2026, 7.00, 'approved', '2026-07-10 12:00:00', '2026-07-11 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":264,"formateur_id":4,"module_id":7,"semaine":44,"heures":4.0},{"id":263,"formateur_id":4,"module_id":8,"semaine":44,"heures":3.0}]', 7.00, '2026-07-11 16:00:00'),
  (77, 5, 26, 2026, 10.00, 'approved', '2026-03-06 12:00:00', '2026-03-14 17:00:00', 1, 'Planning valide pour execution.', '[{"id":10,"formateur_id":5,"module_id":9,"semaine":26,"heures":4.0},{"id":11,"formateur_id":5,"module_id":10,"semaine":26,"heures":3.0},{"id":12,"formateur_id":5,"module_id":12,"semaine":26,"heures":3.0}]', 10.00, '2026-03-14 17:00:00'),
  (78, 5, 27, 2026, 8.00, 'approved', '2026-03-13 12:00:00', '2026-03-21 17:00:00', 2, 'Planning valide pour execution.', '[{"id":26,"formateur_id":5,"module_id":9,"semaine":27,"heures":2.0},{"id":27,"formateur_id":5,"module_id":10,"semaine":27,"heures":3.0},{"id":28,"formateur_id":5,"module_id":12,"semaine":27,"heures":3.0}]', 8.00, '2026-03-21 17:00:00'),
  (79, 5, 28, 2026, 10.00, 'approved', '2026-03-20 12:00:00', '2026-03-28 17:00:00', 1, 'Planning valide pour execution.', '[{"id":38,"formateur_id":5,"module_id":9,"semaine":28,"heures":4.0},{"id":39,"formateur_id":5,"module_id":10,"semaine":28,"heures":3.0},{"id":40,"formateur_id":5,"module_id":12,"semaine":28,"heures":3.0}]', 10.00, '2026-03-28 17:00:00'),
  (80, 5, 29, 2026, 8.00, 'approved', '2026-03-27 12:00:00', '2026-03-30 10:05:00', 2, 'Semaine validee pour suivi en cours.', '[{"id":54,"formateur_id":5,"module_id":9,"semaine":29,"heures":2.0},{"id":55,"formateur_id":5,"module_id":10,"semaine":29,"heures":3.0},{"id":56,"formateur_id":5,"module_id":12,"semaine":29,"heures":3.0}]', 8.00, '2026-03-30 10:05:00'),
  (81, 5, 30, 2026, 10.00, 'approved', '2026-04-03 12:00:00', '2026-04-04 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":66,"formateur_id":5,"module_id":9,"semaine":30,"heures":4.0},{"id":67,"formateur_id":5,"module_id":10,"semaine":30,"heures":3.0},{"id":68,"formateur_id":5,"module_id":12,"semaine":30,"heures":3.0}]', 10.00, '2026-04-04 16:00:00'),
  (82, 5, 31, 2026, 8.00, 'approved', '2026-04-10 12:00:00', '2026-04-11 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":82,"formateur_id":5,"module_id":9,"semaine":31,"heures":2.0},{"id":83,"formateur_id":5,"module_id":10,"semaine":31,"heures":3.0},{"id":84,"formateur_id":5,"module_id":12,"semaine":31,"heures":3.0}]', 8.00, '2026-04-11 16:00:00'),
  (83, 5, 32, 2026, 10.00, 'approved', '2026-04-17 12:00:00', '2026-04-18 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":94,"formateur_id":5,"module_id":9,"semaine":32,"heures":4.0},{"id":95,"formateur_id":5,"module_id":10,"semaine":32,"heures":3.0},{"id":96,"formateur_id":5,"module_id":12,"semaine":32,"heures":3.0}]', 10.00, '2026-04-18 16:00:00'),
  (84, 5, 33, 2026, 8.00, 'approved', '2026-04-24 12:00:00', '2026-04-25 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":113,"formateur_id":5,"module_id":9,"semaine":33,"heures":2.0},{"id":114,"formateur_id":5,"module_id":10,"semaine":33,"heures":3.0},{"id":115,"formateur_id":5,"module_id":12,"semaine":33,"heures":3.0}]', 8.00, '2026-04-25 16:00:00'),
  (85, 5, 34, 2026, 10.00, 'approved', '2026-05-01 12:00:00', '2026-05-02 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":125,"formateur_id":5,"module_id":9,"semaine":34,"heures":4.0},{"id":126,"formateur_id":5,"module_id":10,"semaine":34,"heures":3.0},{"id":127,"formateur_id":5,"module_id":12,"semaine":34,"heures":3.0}]', 10.00, '2026-05-02 16:00:00'),
  (86, 5, 35, 2026, 8.00, 'approved', '2026-05-08 12:00:00', '2026-05-09 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":141,"formateur_id":5,"module_id":9,"semaine":35,"heures":2.0},{"id":142,"formateur_id":5,"module_id":10,"semaine":35,"heures":3.0},{"id":143,"formateur_id":5,"module_id":12,"semaine":35,"heures":3.0}]', 8.00, '2026-05-09 16:00:00'),
  (87, 5, 36, 2026, 10.00, 'rejected', '2026-05-15 12:00:00', '2026-05-13 15:30:00', 1, 'Merci d ajuster la charge de la semaine 36.', '[{"id":153,"formateur_id":5,"module_id":9,"semaine":36,"heures":4.0},{"id":154,"formateur_id":5,"module_id":10,"semaine":36,"heures":3.0},{"id":155,"formateur_id":5,"module_id":12,"semaine":36,"heures":3.0}]', 10.00, '2026-05-13 15:30:00'),
  (88, 5, 37, 2026, 8.00, 'approved', '2026-05-22 12:00:00', '2026-05-23 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":169,"formateur_id":5,"module_id":9,"semaine":37,"heures":2.0},{"id":170,"formateur_id":5,"module_id":10,"semaine":37,"heures":3.0},{"id":171,"formateur_id":5,"module_id":12,"semaine":37,"heures":3.0}]', 8.00, '2026-05-23 16:00:00'),
  (89, 5, 38, 2026, 10.00, 'approved', '2026-05-29 12:00:00', '2026-05-30 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":181,"formateur_id":5,"module_id":9,"semaine":38,"heures":4.0},{"id":182,"formateur_id":5,"module_id":10,"semaine":38,"heures":3.0},{"id":183,"formateur_id":5,"module_id":12,"semaine":38,"heures":3.0}]', 10.00, '2026-05-30 16:00:00'),
  (90, 5, 39, 2026, 8.00, 'approved', '2026-06-05 12:00:00', '2026-06-06 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":197,"formateur_id":5,"module_id":9,"semaine":39,"heures":2.0},{"id":198,"formateur_id":5,"module_id":10,"semaine":39,"heures":3.0},{"id":199,"formateur_id":5,"module_id":12,"semaine":39,"heures":3.0}]', 8.00, '2026-06-06 16:00:00'),
  (91, 5, 40, 2026, 10.00, 'approved', '2026-06-12 12:00:00', '2026-06-13 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":209,"formateur_id":5,"module_id":9,"semaine":40,"heures":4.0},{"id":210,"formateur_id":5,"module_id":10,"semaine":40,"heures":3.0},{"id":211,"formateur_id":5,"module_id":12,"semaine":40,"heures":3.0}]', 10.00, '2026-06-13 16:00:00'),
  (92, 5, 41, 2026, 8.00, 'approved', '2026-06-19 12:00:00', '2026-06-20 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":225,"formateur_id":5,"module_id":9,"semaine":41,"heures":2.0},{"id":226,"formateur_id":5,"module_id":10,"semaine":41,"heures":3.0},{"id":227,"formateur_id":5,"module_id":12,"semaine":41,"heures":3.0}]', 8.00, '2026-06-20 16:00:00'),
  (93, 5, 42, 2026, 10.00, 'approved', '2026-06-26 12:00:00', '2026-06-27 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":237,"formateur_id":5,"module_id":9,"semaine":42,"heures":4.0},{"id":238,"formateur_id":5,"module_id":10,"semaine":42,"heures":3.0},{"id":239,"formateur_id":5,"module_id":12,"semaine":42,"heures":3.0}]', 10.00, '2026-06-27 16:00:00'),
  (94, 5, 43, 2026, 8.00, 'approved', '2026-07-03 12:00:00', '2026-07-04 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":253,"formateur_id":5,"module_id":9,"semaine":43,"heures":2.0},{"id":254,"formateur_id":5,"module_id":10,"semaine":43,"heures":3.0},{"id":255,"formateur_id":5,"module_id":12,"semaine":43,"heures":3.0}]', 8.00, '2026-07-04 16:00:00'),
  (95, 5, 44, 2026, 10.00, 'approved', '2026-07-10 12:00:00', '2026-07-11 16:00:00', 2, 'Validation anticipee du planning.', '[{"id":265,"formateur_id":5,"module_id":9,"semaine":44,"heures":4.0},{"id":266,"formateur_id":5,"module_id":10,"semaine":44,"heures":3.0},{"id":267,"formateur_id":5,"module_id":12,"semaine":44,"heures":3.0}]', 10.00, '2026-07-11 16:00:00');

INSERT INTO `planning_change_requests` (`id`, `formateur_id`, `module_id`, `groupe_code`, `semaine`, `request_week`, `academic_year`, `reason`, `status`, `created_at`, `updated_at`, `processed_at`) VALUES
  (1, 1, 2, 'DEV-2', 'Semaine 29', 29, 2026, 'Confirmation du workshop React du jeudi matin.', 'planned', '2026-03-28 10:00:00', '2026-03-30 09:30:00', '2026-03-30 09:30:00'),
  (2, 2, 4, 'DESIGN-1', 'Semaine 35', 35, 2026, 'Demande de decalage suite a la disponibilite du jury projet.', 'pending', '2026-05-05 11:00:00', NULL, NULL),
  (3, 4, 8, 'DEVOPS-1', 'Semaine 29', 29, 2026, 'Validation du creneau cloud avant intervention externe.', 'validated', '2026-03-27 15:00:00', '2026-03-29 12:15:00', '2026-03-29 12:15:00'),
  (4, 5, 12, 'DATA-1', 'Semaine 36', 36, 2026, 'Refus du transfert de creneau faute de salle disponible.', 'rejected', '2026-05-10 14:00:00', '2026-05-12 16:20:00', '2026-05-12 16:20:00');

INSERT INTO `planning_sessions` (`id`, `formateur_id`, `module_id`, `groupe_id`, `salle_id`, `week_number`, `week_start_date`, `week_end_date`, `day_of_week`, `start_time`, `end_time`, `session_date`, `status`, `task_title`, `task_description`, `note_formateur`, `chef_response`, `change_request_note`, `confirmed_at`, `validated_at`, `validated_by`, `created_at`, `updated_at`) VALUES
  (1, 1, 1, 1, 1, 26, '2026-03-09', '2026-03-15', 1, '08:30:00', '11:30:00', '2026-03-09', 'done', 'Cours HTML/CSS', 'Mise en page responsive et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-08 16:01:00', 2, '2026-03-07 17:01:00', '2026-03-09 18:01:00'),
  (2, 1, 11, 2, 2, 26, '2026-03-09', '2026-03-15', 2, '14:00:00', '17:00:00', '2026-03-10', 'done', 'Atelier API REST', 'Conception des endpoints et tests Postman.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-08 16:02:00', 2, '2026-03-07 17:02:00', '2026-03-10 18:02:00'),
  (3, 1, 2, 2, 1, 26, '2026-03-09', '2026-03-15', 4, '09:00:00', '13:00:00', '2026-03-12', 'done', 'Workshop React', 'Composants, state management et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-08 16:03:00', 2, '2026-03-07 17:03:00', '2026-03-12 18:03:00'),
  (4, 2, 3, 3, 3, 26, '2026-03-09', '2026-03-15', 2, '09:00:00', '12:00:00', '2026-03-10', 'done', 'Atelier UX', 'Recherche utilisateur et parcours cibles.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-08 16:04:00', 2, '2026-03-07 17:04:00', '2026-03-10 18:04:00'),
  (5, 2, 4, 3, 3, 26, '2026-03-09', '2026-03-15', 4, '14:00:00', '17:00:00', '2026-03-12', 'done', 'Prototypage avance', 'Prototype haute fidelite et validation.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-08 16:05:00', 2, '2026-03-07 17:05:00', '2026-03-12 18:05:00'),
  (6, 3, 6, 6, 2, 26, '2026-03-09', '2026-03-15', 1, '14:00:00', '17:00:00', '2026-03-09', 'done', 'SQL applique', 'Modelisation relationnelle et requetes avancees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-08 16:06:00', 2, '2026-03-07 17:06:00', '2026-03-09 18:06:00'),
  (7, 3, 5, 4, 2, 26, '2026-03-09', '2026-03-15', 3, '13:30:00', '17:30:00', '2026-03-11', 'done', 'Introduction ML', 'Regression, evaluation et jeu de donnees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-08 16:07:00', 2, '2026-03-07 17:07:00', '2026-03-11 18:07:00'),
  (8, 4, 8, 5, 4, 26, '2026-03-09', '2026-03-15', 2, '09:00:00', '12:00:00', '2026-03-10', 'done', 'Architecture cloud', 'Services, supervision et bonnes pratiques.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-08 16:08:00', 2, '2026-03-07 17:08:00', '2026-03-10 18:08:00'),
  (9, 4, 7, 5, 4, 26, '2026-03-09', '2026-03-15', 4, '14:00:00', '18:00:00', '2026-03-12', 'done', 'CI/CD Docker', 'Pipelines, containers et deploiement.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-08 16:09:00', 2, '2026-03-07 17:09:00', '2026-03-12 18:09:00'),
  (10, 5, 9, 7, 5, 26, '2026-03-09', '2026-03-15', 1, '11:00:00', '13:00:00', '2026-03-09', 'done', 'Communication pedagogique', 'Animation de groupe et feedback constructif.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-08 16:10:00', 2, '2026-03-07 17:10:00', '2026-03-09 18:10:00'),
  (11, 5, 10, 2, 5, 26, '2026-03-09', '2026-03-15', 3, '09:00:00', '12:00:00', '2026-03-11', 'done', 'Sprint agile', 'Planification, backlog et coordination projet.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-08 16:11:00', 2, '2026-03-07 17:11:00', '2026-03-11 18:11:00'),
  (12, 5, 12, 6, 2, 26, '2026-03-09', '2026-03-15', 5, '13:00:00', '16:00:00', '2026-03-13', 'done', 'Tests logiciels', 'Strategie de test, cas limites et qualite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-08 16:12:00', 2, '2026-03-07 17:12:00', '2026-03-13 18:12:00'),
  (13, 5, 9, 3, 5, 26, '2026-03-09', '2026-03-15', 2, '15:00:00', '17:00:00', '2026-03-10', 'done', 'Prise de parole', 'Mediation et gestion des situations de classe.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-08 16:13:00', 2, '2026-03-07 17:13:00', '2026-03-10 18:13:00'),
  (14, 1, 1, 1, 1, 27, '2026-03-16', '2026-03-22', 1, '08:30:00', '11:30:00', '2026-03-16', 'done', 'Cours HTML/CSS', 'Mise en page responsive et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-15 16:14:00', 2, '2026-03-14 17:14:00', '2026-03-16 18:14:00'),
  (15, 1, 11, 2, 2, 27, '2026-03-16', '2026-03-22', 2, '14:00:00', '17:00:00', '2026-03-17', 'done', 'Atelier API REST', 'Conception des endpoints et tests Postman.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-15 16:15:00', 2, '2026-03-14 17:15:00', '2026-03-17 18:15:00'),
  (16, 1, 2, 2, 1, 27, '2026-03-16', '2026-03-22', 4, '09:00:00', '13:00:00', '2026-03-19', 'done', 'Workshop React', 'Composants, state management et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-15 16:16:00', 2, '2026-03-14 17:16:00', '2026-03-19 18:16:00'),
  (17, 1, 1, 2, 1, 27, '2026-03-16', '2026-03-22', 5, '09:00:00', '12:00:00', '2026-03-20', 'done', 'TP Integration', 'Travaux pratiques sur la maquette responsive.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-15 16:17:00', 2, '2026-03-14 17:17:00', '2026-03-20 18:17:00'),
  (18, 2, 3, 3, 3, 27, '2026-03-16', '2026-03-22', 2, '09:00:00', '12:00:00', '2026-03-17', 'done', 'Atelier UX', 'Recherche utilisateur et parcours cibles.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-15 16:18:00', 2, '2026-03-14 17:18:00', '2026-03-17 18:18:00'),
  (19, 2, 4, 3, 3, 27, '2026-03-16', '2026-03-22', 4, '14:00:00', '17:00:00', '2026-03-19', 'done', 'Prototypage avance', 'Prototype haute fidelite et validation.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-15 16:19:00', 2, '2026-03-14 17:19:00', '2026-03-19 18:19:00'),
  (20, 3, 6, 6, 2, 27, '2026-03-16', '2026-03-22', 1, '14:00:00', '17:00:00', '2026-03-16', 'done', 'SQL applique', 'Modelisation relationnelle et requetes avancees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-15 16:20:00', 2, '2026-03-14 17:20:00', '2026-03-16 18:20:00'),
  (21, 3, 5, 4, 2, 27, '2026-03-16', '2026-03-22', 3, '13:30:00', '17:30:00', '2026-03-18', 'done', 'Introduction ML', 'Regression, evaluation et jeu de donnees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-15 16:21:00', 2, '2026-03-14 17:21:00', '2026-03-18 18:21:00'),
  (22, 3, 6, 4, 2, 27, '2026-03-16', '2026-03-22', 5, '08:30:00', '11:30:00', '2026-03-20', 'done', 'Data practice', 'Preparation de jeux de donnees et nettoyage.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-15 16:22:00', 2, '2026-03-14 17:22:00', '2026-03-20 18:22:00'),
  (23, 4, 8, 5, 4, 27, '2026-03-16', '2026-03-22', 2, '09:00:00', '12:00:00', '2026-03-17', 'done', 'Architecture cloud', 'Services, supervision et bonnes pratiques.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-15 16:23:00', 2, '2026-03-14 17:23:00', '2026-03-17 18:23:00'),
  (24, 4, 7, 5, 4, 27, '2026-03-16', '2026-03-22', 4, '14:00:00', '18:00:00', '2026-03-19', 'done', 'CI/CD Docker', 'Pipelines, containers et deploiement.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-15 16:24:00', 2, '2026-03-14 17:24:00', '2026-03-19 18:24:00'),
  (25, 4, 7, 5, 4, 27, '2026-03-16', '2026-03-22', 6, '09:00:00', '12:00:00', '2026-03-21', 'done', 'Lab DevOps', 'Atelier supervision et observabilite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-15 16:25:00', 2, '2026-03-14 17:25:00', '2026-03-21 18:25:00'),
  (26, 5, 9, 7, 5, 27, '2026-03-16', '2026-03-22', 1, '11:00:00', '13:00:00', '2026-03-16', 'done', 'Communication pedagogique', 'Animation de groupe et feedback constructif.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-15 16:26:00', 2, '2026-03-14 17:26:00', '2026-03-16 18:26:00'),
  (27, 5, 10, 2, 5, 27, '2026-03-16', '2026-03-22', 3, '09:00:00', '12:00:00', '2026-03-18', 'done', 'Sprint agile', 'Planification, backlog et coordination projet.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-15 16:27:00', 2, '2026-03-14 17:27:00', '2026-03-18 18:27:00'),
  (28, 5, 12, 6, 2, 27, '2026-03-16', '2026-03-22', 5, '13:00:00', '16:00:00', '2026-03-20', 'done', 'Tests logiciels', 'Strategie de test, cas limites et qualite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-15 16:28:00', 2, '2026-03-14 17:28:00', '2026-03-20 18:28:00'),
  (29, 1, 1, 1, 1, 28, '2026-03-23', '2026-03-29', 1, '08:30:00', '11:30:00', '2026-03-23', 'done', 'Cours HTML/CSS', 'Mise en page responsive et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-22 16:29:00', 2, '2026-03-21 17:29:00', '2026-03-23 18:29:00'),
  (30, 1, 11, 2, 2, 28, '2026-03-23', '2026-03-29', 2, '14:00:00', '17:00:00', '2026-03-24', 'done', 'Atelier API REST', 'Conception des endpoints et tests Postman.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-22 16:30:00', 2, '2026-03-21 17:30:00', '2026-03-24 18:30:00'),
  (31, 1, 2, 2, 1, 28, '2026-03-23', '2026-03-29', 4, '09:00:00', '13:00:00', '2026-03-26', 'done', 'Workshop React', 'Composants, state management et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-22 16:31:00', 2, '2026-03-21 17:31:00', '2026-03-26 18:31:00'),
  (32, 2, 3, 3, 3, 28, '2026-03-23', '2026-03-29', 2, '09:00:00', '12:00:00', '2026-03-24', 'done', 'Atelier UX', 'Recherche utilisateur et parcours cibles.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-22 16:32:00', 2, '2026-03-21 17:32:00', '2026-03-24 18:32:00'),
  (33, 2, 4, 3, 3, 28, '2026-03-23', '2026-03-29', 4, '14:00:00', '17:00:00', '2026-03-26', 'done', 'Prototypage avance', 'Prototype haute fidelite et validation.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-22 16:33:00', 2, '2026-03-21 17:33:00', '2026-03-26 18:33:00'),
  (34, 3, 6, 6, 2, 28, '2026-03-23', '2026-03-29', 1, '14:00:00', '17:00:00', '2026-03-23', 'done', 'SQL applique', 'Modelisation relationnelle et requetes avancees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-22 16:34:00', 2, '2026-03-21 17:34:00', '2026-03-23 18:34:00'),
  (35, 3, 5, 4, 2, 28, '2026-03-23', '2026-03-29', 3, '13:30:00', '17:30:00', '2026-03-25', 'done', 'Introduction ML', 'Regression, evaluation et jeu de donnees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-22 16:35:00', 2, '2026-03-21 17:35:00', '2026-03-25 18:35:00'),
  (36, 4, 8, 5, 4, 28, '2026-03-23', '2026-03-29', 2, '09:00:00', '12:00:00', '2026-03-24', 'done', 'Architecture cloud', 'Services, supervision et bonnes pratiques.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-22 16:36:00', 2, '2026-03-21 17:36:00', '2026-03-24 18:36:00'),
  (37, 4, 7, 5, 4, 28, '2026-03-23', '2026-03-29', 4, '14:00:00', '18:00:00', '2026-03-26', 'done', 'CI/CD Docker', 'Pipelines, containers et deploiement.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-22 16:37:00', 2, '2026-03-21 17:37:00', '2026-03-26 18:37:00'),
  (38, 5, 9, 7, 5, 28, '2026-03-23', '2026-03-29', 1, '11:00:00', '13:00:00', '2026-03-23', 'done', 'Communication pedagogique', 'Animation de groupe et feedback constructif.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-22 16:38:00', 2, '2026-03-21 17:38:00', '2026-03-23 18:38:00'),
  (39, 5, 10, 2, 5, 28, '2026-03-23', '2026-03-29', 3, '09:00:00', '12:00:00', '2026-03-25', 'done', 'Sprint agile', 'Planification, backlog et coordination projet.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-22 16:39:00', 2, '2026-03-21 17:39:00', '2026-03-25 18:39:00'),
  (40, 5, 12, 6, 2, 28, '2026-03-23', '2026-03-29', 5, '13:00:00', '16:00:00', '2026-03-27', 'done', 'Tests logiciels', 'Strategie de test, cas limites et qualite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-22 16:40:00', 2, '2026-03-21 17:40:00', '2026-03-27 18:40:00'),
  (41, 5, 9, 3, 5, 28, '2026-03-23', '2026-03-29', 2, '15:00:00', '17:00:00', '2026-03-24', 'done', 'Prise de parole', 'Mediation et gestion des situations de classe.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-22 16:41:00', 2, '2026-03-21 17:41:00', '2026-03-24 18:41:00'),
  (42, 1, 1, 1, 1, 29, '2026-03-30', '2026-04-05', 1, '08:30:00', '11:30:00', '2026-03-30', 'done', 'Cours HTML/CSS', 'Mise en page responsive et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-29 16:42:00', 2, '2026-03-28 17:42:00', '2026-03-30 18:42:00'),
  (43, 1, 11, 2, 2, 29, '2026-03-30', '2026-04-05', 2, '14:00:00', '17:00:00', '2026-03-31', 'scheduled', 'Atelier API REST', 'Conception des endpoints et tests Postman.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-29 16:43:00', 2, '2026-03-28 17:43:00', '2026-03-28 17:43:00'),
  (44, 1, 2, 2, 1, 29, '2026-03-30', '2026-04-05', 4, '09:00:00', '13:00:00', '2026-04-02', 'scheduled', 'Workshop React', 'Composants, state management et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-29 16:44:00', 2, '2026-03-28 17:44:00', '2026-03-28 17:44:00'),
  (45, 1, 1, 2, 1, 29, '2026-03-30', '2026-04-05', 5, '09:00:00', '12:00:00', '2026-04-03', 'scheduled', 'TP Integration', 'Travaux pratiques sur la maquette responsive.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-29 16:45:00', 2, '2026-03-28 17:45:00', '2026-03-28 17:45:00'),
  (46, 2, 3, 3, 3, 29, '2026-03-30', '2026-04-05', 2, '09:00:00', '12:00:00', '2026-03-31', 'scheduled', 'Atelier UX', 'Recherche utilisateur et parcours cibles.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 17:46:00', '2026-03-28 17:46:00'),
  (47, 2, 4, 3, 3, 29, '2026-03-30', '2026-04-05', 4, '14:00:00', '17:00:00', '2026-04-02', 'scheduled', 'Prototypage avance', 'Prototype haute fidelite et validation.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 17:47:00', '2026-03-28 17:47:00'),
  (48, 3, 6, 6, 2, 29, '2026-03-30', '2026-04-05', 1, '14:00:00', '17:00:00', '2026-03-30', 'done', 'SQL applique', 'Modelisation relationnelle et requetes avancees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-29 16:48:00', 2, '2026-03-28 17:48:00', '2026-03-30 18:03:00'),
  (49, 3, 5, 4, 2, 29, '2026-03-30', '2026-04-05', 3, '13:30:00', '17:30:00', '2026-04-01', 'scheduled', 'Introduction ML', 'Regression, evaluation et jeu de donnees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-29 16:49:00', 2, '2026-03-28 17:49:00', '2026-03-28 17:49:00'),
  (50, 3, 6, 4, 2, 29, '2026-03-30', '2026-04-05', 5, '08:30:00', '11:30:00', '2026-04-03', 'scheduled', 'Data practice', 'Preparation de jeux de donnees et nettoyage.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-29 16:00:00', 2, '2026-03-28 17:00:00', '2026-03-28 17:00:00'),
  (51, 4, 8, 5, 4, 29, '2026-03-30', '2026-04-05', 2, '09:00:00', '12:00:00', '2026-03-31', 'scheduled', 'Architecture cloud', 'Services, supervision et bonnes pratiques.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 17:01:00', '2026-03-28 17:01:00'),
  (52, 4, 7, 5, 4, 29, '2026-03-30', '2026-04-05', 4, '14:00:00', '18:00:00', '2026-04-02', 'scheduled', 'CI/CD Docker', 'Pipelines, containers et deploiement.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 17:02:00', '2026-03-28 17:02:00'),
  (53, 4, 7, 5, 4, 29, '2026-03-30', '2026-04-05', 6, '09:00:00', '12:00:00', '2026-04-04', 'scheduled', 'Lab DevOps', 'Atelier supervision et observabilite.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 17:03:00', '2026-03-28 17:03:00'),
  (54, 5, 9, 7, 5, 29, '2026-03-30', '2026-04-05', 1, '11:00:00', '13:00:00', '2026-03-30', 'done', 'Communication pedagogique', 'Animation de groupe et feedback constructif.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-29 16:04:00', 2, '2026-03-28 17:04:00', '2026-03-30 18:09:00'),
  (55, 5, 10, 2, 5, 29, '2026-03-30', '2026-04-05', 3, '09:00:00', '12:00:00', '2026-04-01', 'scheduled', 'Sprint agile', 'Planification, backlog et coordination projet.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-29 16:05:00', 2, '2026-03-28 17:05:00', '2026-03-28 17:05:00'),
  (56, 5, 12, 6, 2, 29, '2026-03-30', '2026-04-05', 5, '13:00:00', '16:00:00', '2026-04-03', 'scheduled', 'Tests logiciels', 'Strategie de test, cas limites et qualite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-03-29 16:06:00', 2, '2026-03-28 17:06:00', '2026-03-28 17:06:00'),
  (57, 1, 1, 1, 1, 30, '2026-04-06', '2026-04-12', 1, '08:30:00', '11:30:00', '2026-04-06', 'scheduled', 'Cours HTML/CSS', 'Mise en page responsive et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-05 16:07:00', 2, '2026-04-04 17:07:00', '2026-04-04 17:07:00'),
  (58, 1, 11, 2, 2, 30, '2026-04-06', '2026-04-12', 2, '14:00:00', '17:00:00', '2026-04-07', 'scheduled', 'Atelier API REST', 'Conception des endpoints et tests Postman.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-05 16:08:00', 2, '2026-04-04 17:08:00', '2026-04-04 17:08:00'),
  (59, 1, 2, 2, 1, 30, '2026-04-06', '2026-04-12', 4, '09:00:00', '13:00:00', '2026-04-09', 'scheduled', 'Workshop React', 'Composants, state management et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-05 16:09:00', 2, '2026-04-04 17:09:00', '2026-04-04 17:09:00'),
  (60, 2, 3, 3, 3, 30, '2026-04-06', '2026-04-12', 2, '09:00:00', '12:00:00', '2026-04-07', 'scheduled', 'Atelier UX', 'Recherche utilisateur et parcours cibles.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-05 16:10:00', 2, '2026-04-04 17:10:00', '2026-04-04 17:10:00'),
  (61, 2, 4, 3, 3, 30, '2026-04-06', '2026-04-12', 4, '14:00:00', '17:00:00', '2026-04-09', 'scheduled', 'Prototypage avance', 'Prototype haute fidelite et validation.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-05 16:11:00', 2, '2026-04-04 17:11:00', '2026-04-04 17:11:00'),
  (62, 3, 6, 6, 2, 30, '2026-04-06', '2026-04-12', 1, '14:00:00', '17:00:00', '2026-04-06', 'scheduled', 'SQL applique', 'Modelisation relationnelle et requetes avancees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-05 16:12:00', 2, '2026-04-04 17:12:00', '2026-04-04 17:12:00'),
  (63, 3, 5, 4, 2, 30, '2026-04-06', '2026-04-12', 3, '13:30:00', '17:30:00', '2026-04-08', 'scheduled', 'Introduction ML', 'Regression, evaluation et jeu de donnees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-05 16:13:00', 2, '2026-04-04 17:13:00', '2026-04-04 17:13:00'),
  (64, 4, 8, 5, 4, 30, '2026-04-06', '2026-04-12', 2, '09:00:00', '12:00:00', '2026-04-07', 'scheduled', 'Architecture cloud', 'Services, supervision et bonnes pratiques.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-05 16:14:00', 2, '2026-04-04 17:14:00', '2026-04-04 17:14:00'),
  (65, 4, 7, 5, 4, 30, '2026-04-06', '2026-04-12', 4, '14:00:00', '18:00:00', '2026-04-09', 'scheduled', 'CI/CD Docker', 'Pipelines, containers et deploiement.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-05 16:15:00', 2, '2026-04-04 17:15:00', '2026-04-04 17:15:00'),
  (66, 5, 9, 7, 5, 30, '2026-04-06', '2026-04-12', 1, '11:00:00', '13:00:00', '2026-04-06', 'scheduled', 'Communication pedagogique', 'Animation de groupe et feedback constructif.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-05 16:16:00', 2, '2026-04-04 17:16:00', '2026-04-04 17:16:00'),
  (67, 5, 10, 2, 5, 30, '2026-04-06', '2026-04-12', 3, '09:00:00', '12:00:00', '2026-04-08', 'scheduled', 'Sprint agile', 'Planification, backlog et coordination projet.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-05 16:17:00', 2, '2026-04-04 17:17:00', '2026-04-04 17:17:00'),
  (68, 5, 12, 6, 2, 30, '2026-04-06', '2026-04-12', 5, '13:00:00', '16:00:00', '2026-04-10', 'scheduled', 'Tests logiciels', 'Strategie de test, cas limites et qualite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-05 16:18:00', 2, '2026-04-04 17:18:00', '2026-04-04 17:18:00'),
  (69, 5, 9, 3, 5, 30, '2026-04-06', '2026-04-12', 2, '15:00:00', '17:00:00', '2026-04-07', 'scheduled', 'Prise de parole', 'Mediation et gestion des situations de classe.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-05 16:19:00', 2, '2026-04-04 17:19:00', '2026-04-04 17:19:00'),
  (70, 1, 1, 1, 1, 31, '2026-04-13', '2026-04-19', 1, '08:30:00', '11:30:00', '2026-04-13', 'scheduled', 'Cours HTML/CSS', 'Mise en page responsive et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-12 16:20:00', 2, '2026-04-11 17:20:00', '2026-04-11 17:20:00'),
  (71, 1, 11, 2, 2, 31, '2026-04-13', '2026-04-19', 2, '14:00:00', '17:00:00', '2026-04-14', 'scheduled', 'Atelier API REST', 'Conception des endpoints et tests Postman.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-12 16:21:00', 2, '2026-04-11 17:21:00', '2026-04-11 17:21:00'),
  (72, 1, 2, 2, 1, 31, '2026-04-13', '2026-04-19', 4, '09:00:00', '13:00:00', '2026-04-16', 'scheduled', 'Workshop React', 'Composants, state management et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-12 16:22:00', 2, '2026-04-11 17:22:00', '2026-04-11 17:22:00'),
  (73, 1, 1, 2, 1, 31, '2026-04-13', '2026-04-19', 5, '09:00:00', '12:00:00', '2026-04-17', 'scheduled', 'TP Integration', 'Travaux pratiques sur la maquette responsive.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-12 16:23:00', 2, '2026-04-11 17:23:00', '2026-04-11 17:23:00'),
  (74, 2, 3, 3, 3, 31, '2026-04-13', '2026-04-19', 2, '09:00:00', '12:00:00', '2026-04-14', 'scheduled', 'Atelier UX', 'Recherche utilisateur et parcours cibles.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-12 16:24:00', 2, '2026-04-11 17:24:00', '2026-04-11 17:24:00'),
  (75, 2, 4, 3, 3, 31, '2026-04-13', '2026-04-19', 4, '14:00:00', '17:00:00', '2026-04-16', 'scheduled', 'Prototypage avance', 'Prototype haute fidelite et validation.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-12 16:25:00', 2, '2026-04-11 17:25:00', '2026-04-11 17:25:00'),
  (76, 3, 6, 6, 2, 31, '2026-04-13', '2026-04-19', 1, '14:00:00', '17:00:00', '2026-04-13', 'scheduled', 'SQL applique', 'Modelisation relationnelle et requetes avancees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-12 16:26:00', 2, '2026-04-11 17:26:00', '2026-04-11 17:26:00'),
  (77, 3, 5, 4, 2, 31, '2026-04-13', '2026-04-19', 3, '13:30:00', '17:30:00', '2026-04-15', 'scheduled', 'Introduction ML', 'Regression, evaluation et jeu de donnees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-12 16:27:00', 2, '2026-04-11 17:27:00', '2026-04-11 17:27:00'),
  (78, 3, 6, 4, 2, 31, '2026-04-13', '2026-04-19', 5, '08:30:00', '11:30:00', '2026-04-17', 'scheduled', 'Data practice', 'Preparation de jeux de donnees et nettoyage.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-12 16:28:00', 2, '2026-04-11 17:28:00', '2026-04-11 17:28:00'),
  (79, 4, 8, 5, 4, 31, '2026-04-13', '2026-04-19', 2, '09:00:00', '12:00:00', '2026-04-14', 'scheduled', 'Architecture cloud', 'Services, supervision et bonnes pratiques.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-12 16:29:00', 2, '2026-04-11 17:29:00', '2026-04-11 17:29:00'),
  (80, 4, 7, 5, 4, 31, '2026-04-13', '2026-04-19', 4, '14:00:00', '18:00:00', '2026-04-16', 'scheduled', 'CI/CD Docker', 'Pipelines, containers et deploiement.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-12 16:30:00', 2, '2026-04-11 17:30:00', '2026-04-11 17:30:00'),
  (81, 4, 7, 5, 4, 31, '2026-04-13', '2026-04-19', 6, '09:00:00', '12:00:00', '2026-04-18', 'scheduled', 'Lab DevOps', 'Atelier supervision et observabilite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-12 16:31:00', 2, '2026-04-11 17:31:00', '2026-04-11 17:31:00'),
  (82, 5, 9, 7, 5, 31, '2026-04-13', '2026-04-19', 1, '11:00:00', '13:00:00', '2026-04-13', 'scheduled', 'Communication pedagogique', 'Animation de groupe et feedback constructif.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-12 16:32:00', 2, '2026-04-11 17:32:00', '2026-04-11 17:32:00'),
  (83, 5, 10, 2, 5, 31, '2026-04-13', '2026-04-19', 3, '09:00:00', '12:00:00', '2026-04-15', 'scheduled', 'Sprint agile', 'Planification, backlog et coordination projet.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-12 16:33:00', 2, '2026-04-11 17:33:00', '2026-04-11 17:33:00'),
  (84, 5, 12, 6, 2, 31, '2026-04-13', '2026-04-19', 5, '13:00:00', '16:00:00', '2026-04-17', 'scheduled', 'Tests logiciels', 'Strategie de test, cas limites et qualite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-12 16:34:00', 2, '2026-04-11 17:34:00', '2026-04-11 17:34:00'),
  (85, 1, 1, 1, 1, 32, '2026-04-20', '2026-04-26', 1, '08:30:00', '11:30:00', '2026-04-20', 'scheduled', 'Cours HTML/CSS', 'Mise en page responsive et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-19 16:35:00', 2, '2026-04-18 17:35:00', '2026-04-18 17:35:00'),
  (86, 1, 11, 2, 2, 32, '2026-04-20', '2026-04-26', 2, '14:00:00', '17:00:00', '2026-04-21', 'scheduled', 'Atelier API REST', 'Conception des endpoints et tests Postman.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-19 16:36:00', 2, '2026-04-18 17:36:00', '2026-04-18 17:36:00'),
  (87, 1, 2, 2, 1, 32, '2026-04-20', '2026-04-26', 4, '09:00:00', '13:00:00', '2026-04-23', 'scheduled', 'Workshop React', 'Composants, state management et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-19 16:37:00', 2, '2026-04-18 17:37:00', '2026-04-18 17:37:00'),
  (88, 2, 3, 3, 3, 32, '2026-04-20', '2026-04-26', 2, '09:00:00', '12:00:00', '2026-04-21', 'scheduled', 'Atelier UX', 'Recherche utilisateur et parcours cibles.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-19 16:38:00', 2, '2026-04-18 17:38:00', '2026-04-18 17:38:00'),
  (89, 2, 4, 3, 3, 32, '2026-04-20', '2026-04-26', 4, '14:00:00', '17:00:00', '2026-04-23', 'scheduled', 'Prototypage avance', 'Prototype haute fidelite et validation.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-19 16:39:00', 2, '2026-04-18 17:39:00', '2026-04-18 17:39:00'),
  (90, 3, 6, 6, 2, 32, '2026-04-20', '2026-04-26', 1, '14:00:00', '17:00:00', '2026-04-20', 'scheduled', 'SQL applique', 'Modelisation relationnelle et requetes avancees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-19 16:40:00', 2, '2026-04-18 17:40:00', '2026-04-18 17:40:00'),
  (91, 3, 5, 4, 2, 32, '2026-04-20', '2026-04-26', 3, '13:30:00', '17:30:00', '2026-04-22', 'scheduled', 'Introduction ML', 'Regression, evaluation et jeu de donnees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-19 16:41:00', 2, '2026-04-18 17:41:00', '2026-04-18 17:41:00'),
  (92, 4, 8, 5, 4, 32, '2026-04-20', '2026-04-26', 2, '09:00:00', '12:00:00', '2026-04-21', 'scheduled', 'Architecture cloud', 'Services, supervision et bonnes pratiques.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-19 16:42:00', 2, '2026-04-18 17:42:00', '2026-04-18 17:42:00'),
  (93, 4, 7, 5, 4, 32, '2026-04-20', '2026-04-26', 4, '14:00:00', '18:00:00', '2026-04-23', 'scheduled', 'CI/CD Docker', 'Pipelines, containers et deploiement.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-19 16:43:00', 2, '2026-04-18 17:43:00', '2026-04-18 17:43:00'),
  (94, 5, 9, 7, 5, 32, '2026-04-20', '2026-04-26', 1, '11:00:00', '13:00:00', '2026-04-20', 'scheduled', 'Communication pedagogique', 'Animation de groupe et feedback constructif.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-19 16:44:00', 2, '2026-04-18 17:44:00', '2026-04-18 17:44:00'),
  (95, 5, 10, 2, 5, 32, '2026-04-20', '2026-04-26', 3, '09:00:00', '12:00:00', '2026-04-22', 'scheduled', 'Sprint agile', 'Planification, backlog et coordination projet.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-19 16:45:00', 2, '2026-04-18 17:45:00', '2026-04-18 17:45:00'),
  (96, 5, 12, 6, 2, 32, '2026-04-20', '2026-04-26', 5, '13:00:00', '16:00:00', '2026-04-24', 'scheduled', 'Tests logiciels', 'Strategie de test, cas limites et qualite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-19 16:46:00', 2, '2026-04-18 17:46:00', '2026-04-18 17:46:00'),
  (97, 5, 9, 3, 5, 32, '2026-04-20', '2026-04-26', 2, '15:00:00', '17:00:00', '2026-04-21', 'scheduled', 'Prise de parole', 'Mediation et gestion des situations de classe.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-19 16:47:00', 2, '2026-04-18 17:47:00', '2026-04-18 17:47:00'),
  (98, 1, 1, 1, 1, 33, '2026-04-27', '2026-05-03', 1, '08:30:00', '11:30:00', '2026-04-27', 'scheduled', 'Cours HTML/CSS', 'Mise en page responsive et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-26 16:48:00', 2, '2026-04-25 17:48:00', '2026-04-25 17:48:00'),
  (99, 1, 11, 2, 2, 33, '2026-04-27', '2026-05-03', 2, '14:00:00', '17:00:00', '2026-04-28', 'scheduled', 'Atelier API REST', 'Conception des endpoints et tests Postman.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-26 16:49:00', 2, '2026-04-25 17:49:00', '2026-04-25 17:49:00'),
  (100, 1, 2, 2, 1, 33, '2026-04-27', '2026-05-03', 4, '09:00:00', '13:00:00', '2026-04-30', 'scheduled', 'Workshop React', 'Composants, state management et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-26 16:00:00', 2, '2026-04-25 17:00:00', '2026-04-25 17:00:00'),
  (101, 1, 1, 2, 1, 33, '2026-04-27', '2026-05-03', 5, '09:00:00', '12:00:00', '2026-05-01', 'scheduled', 'TP Integration', 'Travaux pratiques sur la maquette responsive.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-26 16:01:00', 2, '2026-04-25 17:01:00', '2026-04-25 17:01:00'),
  (102, 1, 2, 2, 1, 33, '2026-04-27', '2026-05-03', 3, '08:30:00', '12:30:00', '2026-04-29', 'scheduled', 'Bootcamp React', 'Sprint intensif composants et hooks.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-26 16:02:00', 2, '2026-04-25 17:02:00', '2026-04-25 17:02:00'),
  (103, 1, 11, 5, 2, 33, '2026-04-27', '2026-05-03', 5, '13:30:00', '17:30:00', '2026-05-01', 'scheduled', 'APIs avancees', 'Authentification, logs et securisation.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-26 16:03:00', 2, '2026-04-25 17:03:00', '2026-04-25 17:03:00'),
  (104, 1, 2, 2, 1, 33, '2026-04-27', '2026-05-03', 6, '09:00:00', '13:00:00', '2026-05-02', 'scheduled', 'Revision EFM React', 'Preparation intensive aux livrables techniques.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-26 16:04:00', 2, '2026-04-25 17:04:00', '2026-04-25 17:04:00'),
  (105, 2, 3, 3, 3, 33, '2026-04-27', '2026-05-03', 2, '09:00:00', '12:00:00', '2026-04-28', 'scheduled', 'Atelier UX', 'Recherche utilisateur et parcours cibles.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-26 16:05:00', 2, '2026-04-25 17:05:00', '2026-04-25 17:05:00'),
  (106, 2, 4, 3, 3, 33, '2026-04-27', '2026-05-03', 4, '14:00:00', '17:00:00', '2026-04-30', 'scheduled', 'Prototypage avance', 'Prototype haute fidelite et validation.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-26 16:06:00', 2, '2026-04-25 17:06:00', '2026-04-25 17:06:00'),
  (107, 3, 6, 6, 2, 33, '2026-04-27', '2026-05-03', 1, '14:00:00', '17:00:00', '2026-04-27', 'scheduled', 'SQL applique', 'Modelisation relationnelle et requetes avancees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-26 16:07:00', 2, '2026-04-25 17:07:00', '2026-04-25 17:07:00'),
  (108, 3, 5, 4, 2, 33, '2026-04-27', '2026-05-03', 3, '13:30:00', '17:30:00', '2026-04-29', 'scheduled', 'Introduction ML', 'Regression, evaluation et jeu de donnees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-26 16:08:00', 2, '2026-04-25 17:08:00', '2026-04-25 17:08:00'),
  (109, 3, 6, 4, 2, 33, '2026-04-27', '2026-05-03', 5, '08:30:00', '11:30:00', '2026-05-01', 'scheduled', 'Data practice', 'Preparation de jeux de donnees et nettoyage.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-26 16:09:00', 2, '2026-04-25 17:09:00', '2026-04-25 17:09:00'),
  (110, 4, 8, 5, 4, 33, '2026-04-27', '2026-05-03', 2, '09:00:00', '12:00:00', '2026-04-28', 'scheduled', 'Architecture cloud', 'Services, supervision et bonnes pratiques.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-26 16:10:00', 2, '2026-04-25 17:10:00', '2026-04-25 17:10:00'),
  (111, 4, 7, 5, 4, 33, '2026-04-27', '2026-05-03', 4, '14:00:00', '18:00:00', '2026-04-30', 'scheduled', 'CI/CD Docker', 'Pipelines, containers et deploiement.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-26 16:11:00', 2, '2026-04-25 17:11:00', '2026-04-25 17:11:00'),
  (112, 4, 7, 5, 4, 33, '2026-04-27', '2026-05-03', 6, '09:00:00', '12:00:00', '2026-05-02', 'scheduled', 'Lab DevOps', 'Atelier supervision et observabilite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-26 16:12:00', 2, '2026-04-25 17:12:00', '2026-04-25 17:12:00'),
  (113, 5, 9, 7, 5, 33, '2026-04-27', '2026-05-03', 1, '11:00:00', '13:00:00', '2026-04-27', 'scheduled', 'Communication pedagogique', 'Animation de groupe et feedback constructif.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-26 16:13:00', 2, '2026-04-25 17:13:00', '2026-04-25 17:13:00'),
  (114, 5, 10, 2, 5, 33, '2026-04-27', '2026-05-03', 3, '09:00:00', '12:00:00', '2026-04-29', 'scheduled', 'Sprint agile', 'Planification, backlog et coordination projet.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-26 16:14:00', 2, '2026-04-25 17:14:00', '2026-04-25 17:14:00'),
  (115, 5, 12, 6, 2, 33, '2026-04-27', '2026-05-03', 5, '13:00:00', '16:00:00', '2026-05-01', 'scheduled', 'Tests logiciels', 'Strategie de test, cas limites et qualite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-04-26 16:15:00', 2, '2026-04-25 17:15:00', '2026-04-25 17:15:00'),
  (116, 1, 1, 1, 1, 34, '2026-05-04', '2026-05-10', 1, '08:30:00', '11:30:00', '2026-05-04', 'scheduled', 'Cours HTML/CSS', 'Mise en page responsive et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-03 16:16:00', 2, '2026-05-02 17:16:00', '2026-05-02 17:16:00'),
  (117, 1, 11, 2, 2, 34, '2026-05-04', '2026-05-10', 2, '14:00:00', '17:00:00', '2026-05-05', 'scheduled', 'Atelier API REST', 'Conception des endpoints et tests Postman.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-03 16:17:00', 2, '2026-05-02 17:17:00', '2026-05-02 17:17:00'),
  (118, 1, 2, 2, 1, 34, '2026-05-04', '2026-05-10', 4, '09:00:00', '13:00:00', '2026-05-07', 'scheduled', 'Workshop React', 'Composants, state management et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-03 16:18:00', 2, '2026-05-02 17:18:00', '2026-05-02 17:18:00'),
  (119, 2, 3, 3, 3, 34, '2026-05-04', '2026-05-10', 2, '09:00:00', '12:00:00', '2026-05-05', 'scheduled', 'Atelier UX', 'Recherche utilisateur et parcours cibles.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-03 16:19:00', 2, '2026-05-02 17:19:00', '2026-05-02 17:19:00'),
  (120, 2, 4, 3, 3, 34, '2026-05-04', '2026-05-10', 4, '14:00:00', '17:00:00', '2026-05-07', 'scheduled', 'Prototypage avance', 'Prototype haute fidelite et validation.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-03 16:20:00', 2, '2026-05-02 17:20:00', '2026-05-02 17:20:00'),
  (121, 3, 6, 6, 2, 34, '2026-05-04', '2026-05-10', 1, '14:00:00', '17:00:00', '2026-05-04', 'scheduled', 'SQL applique', 'Modelisation relationnelle et requetes avancees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-03 16:21:00', 2, '2026-05-02 17:21:00', '2026-05-02 17:21:00'),
  (122, 3, 5, 4, 2, 34, '2026-05-04', '2026-05-10', 3, '13:30:00', '17:30:00', '2026-05-06', 'scheduled', 'Introduction ML', 'Regression, evaluation et jeu de donnees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-03 16:22:00', 2, '2026-05-02 17:22:00', '2026-05-02 17:22:00'),
  (123, 4, 8, 5, 4, 34, '2026-05-04', '2026-05-10', 2, '09:00:00', '12:00:00', '2026-05-05', 'scheduled', 'Architecture cloud', 'Services, supervision et bonnes pratiques.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-03 16:23:00', 2, '2026-05-02 17:23:00', '2026-05-02 17:23:00'),
  (124, 4, 7, 5, 4, 34, '2026-05-04', '2026-05-10', 4, '14:00:00', '18:00:00', '2026-05-07', 'scheduled', 'CI/CD Docker', 'Pipelines, containers et deploiement.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-03 16:24:00', 2, '2026-05-02 17:24:00', '2026-05-02 17:24:00'),
  (125, 5, 9, 7, 5, 34, '2026-05-04', '2026-05-10', 1, '11:00:00', '13:00:00', '2026-05-04', 'scheduled', 'Communication pedagogique', 'Animation de groupe et feedback constructif.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-03 16:25:00', 2, '2026-05-02 17:25:00', '2026-05-02 17:25:00'),
  (126, 5, 10, 2, 5, 34, '2026-05-04', '2026-05-10', 3, '09:00:00', '12:00:00', '2026-05-06', 'scheduled', 'Sprint agile', 'Planification, backlog et coordination projet.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-03 16:26:00', 2, '2026-05-02 17:26:00', '2026-05-02 17:26:00'),
  (127, 5, 12, 6, 2, 34, '2026-05-04', '2026-05-10', 5, '13:00:00', '16:00:00', '2026-05-08', 'scheduled', 'Tests logiciels', 'Strategie de test, cas limites et qualite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-03 16:27:00', 2, '2026-05-02 17:27:00', '2026-05-02 17:27:00'),
  (128, 5, 9, 3, 5, 34, '2026-05-04', '2026-05-10', 2, '15:00:00', '17:00:00', '2026-05-05', 'scheduled', 'Prise de parole', 'Mediation et gestion des situations de classe.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-03 16:28:00', 2, '2026-05-02 17:28:00', '2026-05-02 17:28:00'),
  (129, 1, 1, 1, 1, 35, '2026-05-11', '2026-05-17', 1, '08:30:00', '11:30:00', '2026-05-11', 'scheduled', 'Cours HTML/CSS', 'Mise en page responsive et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-10 16:29:00', 2, '2026-05-09 17:29:00', '2026-05-09 17:29:00'),
  (130, 1, 11, 2, 2, 35, '2026-05-11', '2026-05-17', 2, '14:00:00', '17:00:00', '2026-05-12', 'scheduled', 'Atelier API REST', 'Conception des endpoints et tests Postman.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-10 16:30:00', 2, '2026-05-09 17:30:00', '2026-05-09 17:30:00'),
  (131, 1, 2, 2, 1, 35, '2026-05-11', '2026-05-17', 4, '09:00:00', '13:00:00', '2026-05-14', 'scheduled', 'Workshop React', 'Composants, state management et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-10 16:31:00', 2, '2026-05-09 17:31:00', '2026-05-09 17:31:00'),
  (132, 1, 1, 2, 1, 35, '2026-05-11', '2026-05-17', 5, '09:00:00', '12:00:00', '2026-05-15', 'scheduled', 'TP Integration', 'Travaux pratiques sur la maquette responsive.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-10 16:32:00', 2, '2026-05-09 17:32:00', '2026-05-09 17:32:00'),
  (133, 2, 3, 3, 3, 35, '2026-05-11', '2026-05-17', 2, '09:00:00', '12:00:00', '2026-05-12', 'scheduled', 'Atelier UX', 'Recherche utilisateur et parcours cibles.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-10 16:33:00', 2, '2026-05-09 17:33:00', '2026-05-09 17:33:00'),
  (134, 2, 4, 3, 3, 35, '2026-05-11', '2026-05-17', 4, '14:00:00', '17:00:00', '2026-05-14', 'scheduled', 'Prototypage avance', 'Prototype haute fidelite et validation.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-10 16:34:00', 2, '2026-05-09 17:34:00', '2026-05-09 17:34:00'),
  (135, 3, 6, 6, 2, 35, '2026-05-11', '2026-05-17', 1, '14:00:00', '17:00:00', '2026-05-11', 'scheduled', 'SQL applique', 'Modelisation relationnelle et requetes avancees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-10 16:35:00', 2, '2026-05-09 17:35:00', '2026-05-09 17:35:00'),
  (136, 3, 5, 4, 2, 35, '2026-05-11', '2026-05-17', 3, '13:30:00', '17:30:00', '2026-05-13', 'scheduled', 'Introduction ML', 'Regression, evaluation et jeu de donnees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-10 16:36:00', 2, '2026-05-09 17:36:00', '2026-05-09 17:36:00'),
  (137, 3, 6, 4, 2, 35, '2026-05-11', '2026-05-17', 5, '08:30:00', '11:30:00', '2026-05-15', 'scheduled', 'Data practice', 'Preparation de jeux de donnees et nettoyage.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-10 16:37:00', 2, '2026-05-09 17:37:00', '2026-05-09 17:37:00'),
  (138, 4, 8, 5, 4, 35, '2026-05-11', '2026-05-17', 2, '09:00:00', '12:00:00', '2026-05-12', 'scheduled', 'Architecture cloud', 'Services, supervision et bonnes pratiques.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-10 16:38:00', 2, '2026-05-09 17:38:00', '2026-05-09 17:38:00'),
  (139, 4, 7, 5, 4, 35, '2026-05-11', '2026-05-17', 4, '14:00:00', '18:00:00', '2026-05-14', 'scheduled', 'CI/CD Docker', 'Pipelines, containers et deploiement.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-10 16:39:00', 2, '2026-05-09 17:39:00', '2026-05-09 17:39:00'),
  (140, 4, 7, 5, 4, 35, '2026-05-11', '2026-05-17', 6, '09:00:00', '12:00:00', '2026-05-16', 'scheduled', 'Lab DevOps', 'Atelier supervision et observabilite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-10 16:40:00', 2, '2026-05-09 17:40:00', '2026-05-09 17:40:00'),
  (141, 5, 9, 7, 5, 35, '2026-05-11', '2026-05-17', 1, '11:00:00', '13:00:00', '2026-05-11', 'scheduled', 'Communication pedagogique', 'Animation de groupe et feedback constructif.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-10 16:41:00', 2, '2026-05-09 17:41:00', '2026-05-09 17:41:00'),
  (142, 5, 10, 2, 5, 35, '2026-05-11', '2026-05-17', 3, '09:00:00', '12:00:00', '2026-05-13', 'scheduled', 'Sprint agile', 'Planification, backlog et coordination projet.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-10 16:42:00', 2, '2026-05-09 17:42:00', '2026-05-09 17:42:00'),
  (143, 5, 12, 6, 2, 35, '2026-05-11', '2026-05-17', 5, '13:00:00', '16:00:00', '2026-05-15', 'scheduled', 'Tests logiciels', 'Strategie de test, cas limites et qualite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-10 16:43:00', 2, '2026-05-09 17:43:00', '2026-05-09 17:43:00'),
  (144, 1, 1, 1, 1, 36, '2026-05-18', '2026-05-24', 1, '08:30:00', '11:30:00', '2026-05-18', 'scheduled', 'Cours HTML/CSS', 'Mise en page responsive et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-17 16:44:00', 2, '2026-05-16 17:44:00', '2026-05-16 17:44:00'),
  (145, 1, 11, 2, 2, 36, '2026-05-18', '2026-05-24', 2, '14:00:00', '17:00:00', '2026-05-19', 'scheduled', 'Atelier API REST', 'Conception des endpoints et tests Postman.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-17 16:45:00', 2, '2026-05-16 17:45:00', '2026-05-16 17:45:00'),
  (146, 1, 2, 2, 1, 36, '2026-05-18', '2026-05-24', 4, '09:00:00', '13:00:00', '2026-05-21', 'scheduled', 'Workshop React', 'Composants, state management et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-17 16:46:00', 2, '2026-05-16 17:46:00', '2026-05-16 17:46:00'),
  (147, 2, 3, 3, 3, 36, '2026-05-18', '2026-05-24', 2, '09:00:00', '12:00:00', '2026-05-19', 'scheduled', 'Atelier UX', 'Recherche utilisateur et parcours cibles.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-17 16:47:00', 2, '2026-05-16 17:47:00', '2026-05-16 17:47:00'),
  (148, 2, 4, 3, 3, 36, '2026-05-18', '2026-05-24', 4, '14:00:00', '17:00:00', '2026-05-21', 'scheduled', 'Prototypage avance', 'Prototype haute fidelite et validation.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-17 16:48:00', 2, '2026-05-16 17:48:00', '2026-05-16 17:48:00'),
  (149, 3, 6, 6, 2, 36, '2026-05-18', '2026-05-24', 1, '14:00:00', '17:00:00', '2026-05-18', 'scheduled', 'SQL applique', 'Modelisation relationnelle et requetes avancees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-17 16:49:00', 2, '2026-05-16 17:49:00', '2026-05-16 17:49:00'),
  (150, 3, 5, 4, 2, 36, '2026-05-18', '2026-05-24', 3, '13:30:00', '17:30:00', '2026-05-20', 'scheduled', 'Introduction ML', 'Regression, evaluation et jeu de donnees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-17 16:00:00', 2, '2026-05-16 17:00:00', '2026-05-16 17:00:00'),
  (151, 4, 8, 5, 4, 36, '2026-05-18', '2026-05-24', 2, '09:00:00', '12:00:00', '2026-05-19', 'scheduled', 'Architecture cloud', 'Services, supervision et bonnes pratiques.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-17 16:01:00', 2, '2026-05-16 17:01:00', '2026-05-16 17:01:00'),
  (152, 4, 7, 5, 4, 36, '2026-05-18', '2026-05-24', 4, '14:00:00', '18:00:00', '2026-05-21', 'scheduled', 'CI/CD Docker', 'Pipelines, containers et deploiement.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-17 16:02:00', 2, '2026-05-16 17:02:00', '2026-05-16 17:02:00'),
  (153, 5, 9, 7, 5, 36, '2026-05-18', '2026-05-24', 1, '11:00:00', '13:00:00', '2026-05-18', 'scheduled', 'Communication pedagogique', 'Animation de groupe et feedback constructif.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-17 16:03:00', 2, '2026-05-16 17:03:00', '2026-05-16 17:03:00'),
  (154, 5, 10, 2, 5, 36, '2026-05-18', '2026-05-24', 3, '09:00:00', '12:00:00', '2026-05-20', 'scheduled', 'Sprint agile', 'Planification, backlog et coordination projet.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-17 16:04:00', 2, '2026-05-16 17:04:00', '2026-05-16 17:04:00'),
  (155, 5, 12, 6, 2, 36, '2026-05-18', '2026-05-24', 5, '13:00:00', '16:00:00', '2026-05-22', 'scheduled', 'Tests logiciels', 'Strategie de test, cas limites et qualite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-17 16:05:00', 2, '2026-05-16 17:05:00', '2026-05-16 17:05:00'),
  (156, 5, 9, 3, 5, 36, '2026-05-18', '2026-05-24', 2, '15:00:00', '17:00:00', '2026-05-19', 'scheduled', 'Prise de parole', 'Mediation et gestion des situations de classe.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-17 16:06:00', 2, '2026-05-16 17:06:00', '2026-05-16 17:06:00'),
  (157, 1, 1, 1, 1, 37, '2026-05-25', '2026-05-31', 1, '08:30:00', '11:30:00', '2026-05-25', 'scheduled', 'Cours HTML/CSS', 'Mise en page responsive et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-24 16:07:00', 2, '2026-05-23 17:07:00', '2026-05-23 17:07:00'),
  (158, 1, 11, 2, 2, 37, '2026-05-25', '2026-05-31', 2, '14:00:00', '17:00:00', '2026-05-26', 'scheduled', 'Atelier API REST', 'Conception des endpoints et tests Postman.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-24 16:08:00', 2, '2026-05-23 17:08:00', '2026-05-23 17:08:00'),
  (159, 1, 2, 2, 1, 37, '2026-05-25', '2026-05-31', 4, '09:00:00', '13:00:00', '2026-05-28', 'scheduled', 'Workshop React', 'Composants, state management et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-24 16:09:00', 2, '2026-05-23 17:09:00', '2026-05-23 17:09:00'),
  (160, 1, 1, 2, 1, 37, '2026-05-25', '2026-05-31', 5, '09:00:00', '12:00:00', '2026-05-29', 'scheduled', 'TP Integration', 'Travaux pratiques sur la maquette responsive.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-24 16:10:00', 2, '2026-05-23 17:10:00', '2026-05-23 17:10:00'),
  (161, 2, 3, 3, 3, 37, '2026-05-25', '2026-05-31', 2, '09:00:00', '12:00:00', '2026-05-26', 'scheduled', 'Atelier UX', 'Recherche utilisateur et parcours cibles.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-24 16:11:00', 2, '2026-05-23 17:11:00', '2026-05-23 17:11:00'),
  (162, 2, 4, 3, 3, 37, '2026-05-25', '2026-05-31', 4, '14:00:00', '17:00:00', '2026-05-28', 'scheduled', 'Prototypage avance', 'Prototype haute fidelite et validation.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-24 16:12:00', 2, '2026-05-23 17:12:00', '2026-05-23 17:12:00'),
  (163, 3, 6, 6, 2, 37, '2026-05-25', '2026-05-31', 1, '14:00:00', '17:00:00', '2026-05-25', 'scheduled', 'SQL applique', 'Modelisation relationnelle et requetes avancees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-24 16:13:00', 2, '2026-05-23 17:13:00', '2026-05-23 17:13:00'),
  (164, 3, 5, 4, 2, 37, '2026-05-25', '2026-05-31', 3, '13:30:00', '17:30:00', '2026-05-27', 'scheduled', 'Introduction ML', 'Regression, evaluation et jeu de donnees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-24 16:14:00', 2, '2026-05-23 17:14:00', '2026-05-23 17:14:00'),
  (165, 3, 6, 4, 2, 37, '2026-05-25', '2026-05-31', 5, '08:30:00', '11:30:00', '2026-05-29', 'scheduled', 'Data practice', 'Preparation de jeux de donnees et nettoyage.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-24 16:15:00', 2, '2026-05-23 17:15:00', '2026-05-23 17:15:00'),
  (166, 4, 8, 5, 4, 37, '2026-05-25', '2026-05-31', 2, '09:00:00', '12:00:00', '2026-05-26', 'scheduled', 'Architecture cloud', 'Services, supervision et bonnes pratiques.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-24 16:16:00', 2, '2026-05-23 17:16:00', '2026-05-23 17:16:00'),
  (167, 4, 7, 5, 4, 37, '2026-05-25', '2026-05-31', 4, '14:00:00', '18:00:00', '2026-05-28', 'scheduled', 'CI/CD Docker', 'Pipelines, containers et deploiement.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-24 16:17:00', 2, '2026-05-23 17:17:00', '2026-05-23 17:17:00'),
  (168, 4, 7, 5, 4, 37, '2026-05-25', '2026-05-31', 6, '09:00:00', '12:00:00', '2026-05-30', 'scheduled', 'Lab DevOps', 'Atelier supervision et observabilite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-24 16:18:00', 2, '2026-05-23 17:18:00', '2026-05-23 17:18:00'),
  (169, 5, 9, 7, 5, 37, '2026-05-25', '2026-05-31', 1, '11:00:00', '13:00:00', '2026-05-25', 'scheduled', 'Communication pedagogique', 'Animation de groupe et feedback constructif.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-24 16:19:00', 2, '2026-05-23 17:19:00', '2026-05-23 17:19:00'),
  (170, 5, 10, 2, 5, 37, '2026-05-25', '2026-05-31', 3, '09:00:00', '12:00:00', '2026-05-27', 'scheduled', 'Sprint agile', 'Planification, backlog et coordination projet.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-24 16:20:00', 2, '2026-05-23 17:20:00', '2026-05-23 17:20:00'),
  (171, 5, 12, 6, 2, 37, '2026-05-25', '2026-05-31', 5, '13:00:00', '16:00:00', '2026-05-29', 'scheduled', 'Tests logiciels', 'Strategie de test, cas limites et qualite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-24 16:21:00', 2, '2026-05-23 17:21:00', '2026-05-23 17:21:00'),
  (172, 1, 1, 1, 1, 38, '2026-06-01', '2026-06-07', 1, '08:30:00', '11:30:00', '2026-06-01', 'scheduled', 'Cours HTML/CSS', 'Mise en page responsive et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-31 16:22:00', 2, '2026-05-30 17:22:00', '2026-05-30 17:22:00'),
  (173, 1, 11, 2, 2, 38, '2026-06-01', '2026-06-07', 2, '14:00:00', '17:00:00', '2026-06-02', 'scheduled', 'Atelier API REST', 'Conception des endpoints et tests Postman.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-31 16:23:00', 2, '2026-05-30 17:23:00', '2026-05-30 17:23:00'),
  (174, 1, 2, 2, 1, 38, '2026-06-01', '2026-06-07', 4, '09:00:00', '13:00:00', '2026-06-04', 'scheduled', 'Workshop React', 'Composants, state management et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-31 16:24:00', 2, '2026-05-30 17:24:00', '2026-05-30 17:24:00'),
  (175, 2, 3, 3, 3, 38, '2026-06-01', '2026-06-07', 2, '09:00:00', '12:00:00', '2026-06-02', 'scheduled', 'Atelier UX', 'Recherche utilisateur et parcours cibles.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-31 16:25:00', 2, '2026-05-30 17:25:00', '2026-05-30 17:25:00'),
  (176, 2, 4, 3, 3, 38, '2026-06-01', '2026-06-07', 4, '14:00:00', '17:00:00', '2026-06-04', 'scheduled', 'Prototypage avance', 'Prototype haute fidelite et validation.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-31 16:26:00', 2, '2026-05-30 17:26:00', '2026-05-30 17:26:00'),
  (177, 3, 6, 6, 2, 38, '2026-06-01', '2026-06-07', 1, '14:00:00', '17:00:00', '2026-06-01', 'scheduled', 'SQL applique', 'Modelisation relationnelle et requetes avancees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-31 16:27:00', 2, '2026-05-30 17:27:00', '2026-05-30 17:27:00'),
  (178, 3, 5, 4, 2, 38, '2026-06-01', '2026-06-07', 3, '13:30:00', '17:30:00', '2026-06-03', 'scheduled', 'Introduction ML', 'Regression, evaluation et jeu de donnees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-31 16:28:00', 2, '2026-05-30 17:28:00', '2026-05-30 17:28:00'),
  (179, 4, 8, 5, 4, 38, '2026-06-01', '2026-06-07', 2, '09:00:00', '12:00:00', '2026-06-02', 'scheduled', 'Architecture cloud', 'Services, supervision et bonnes pratiques.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-31 16:29:00', 2, '2026-05-30 17:29:00', '2026-05-30 17:29:00'),
  (180, 4, 7, 5, 4, 38, '2026-06-01', '2026-06-07', 4, '14:00:00', '18:00:00', '2026-06-04', 'scheduled', 'CI/CD Docker', 'Pipelines, containers et deploiement.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-31 16:30:00', 2, '2026-05-30 17:30:00', '2026-05-30 17:30:00'),
  (181, 5, 9, 7, 5, 38, '2026-06-01', '2026-06-07', 1, '11:00:00', '13:00:00', '2026-06-01', 'scheduled', 'Communication pedagogique', 'Animation de groupe et feedback constructif.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-31 16:31:00', 2, '2026-05-30 17:31:00', '2026-05-30 17:31:00'),
  (182, 5, 10, 2, 5, 38, '2026-06-01', '2026-06-07', 3, '09:00:00', '12:00:00', '2026-06-03', 'scheduled', 'Sprint agile', 'Planification, backlog et coordination projet.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-31 16:32:00', 2, '2026-05-30 17:32:00', '2026-05-30 17:32:00'),
  (183, 5, 12, 6, 2, 38, '2026-06-01', '2026-06-07', 5, '13:00:00', '16:00:00', '2026-06-05', 'scheduled', 'Tests logiciels', 'Strategie de test, cas limites et qualite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-31 16:33:00', 2, '2026-05-30 17:33:00', '2026-05-30 17:33:00'),
  (184, 5, 9, 3, 5, 38, '2026-06-01', '2026-06-07', 2, '15:00:00', '17:00:00', '2026-06-02', 'scheduled', 'Prise de parole', 'Mediation et gestion des situations de classe.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-05-31 16:34:00', 2, '2026-05-30 17:34:00', '2026-05-30 17:34:00'),
  (185, 1, 1, 1, 1, 39, '2026-06-08', '2026-06-14', 1, '08:30:00', '11:30:00', '2026-06-08', 'scheduled', 'Cours HTML/CSS', 'Mise en page responsive et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-07 16:35:00', 2, '2026-06-06 17:35:00', '2026-06-06 17:35:00'),
  (186, 1, 11, 2, 2, 39, '2026-06-08', '2026-06-14', 2, '14:00:00', '17:00:00', '2026-06-09', 'scheduled', 'Atelier API REST', 'Conception des endpoints et tests Postman.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-07 16:36:00', 2, '2026-06-06 17:36:00', '2026-06-06 17:36:00'),
  (187, 1, 2, 2, 1, 39, '2026-06-08', '2026-06-14', 4, '09:00:00', '13:00:00', '2026-06-11', 'scheduled', 'Workshop React', 'Composants, state management et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-07 16:37:00', 2, '2026-06-06 17:37:00', '2026-06-06 17:37:00'),
  (188, 1, 1, 2, 1, 39, '2026-06-08', '2026-06-14', 5, '09:00:00', '12:00:00', '2026-06-12', 'scheduled', 'TP Integration', 'Travaux pratiques sur la maquette responsive.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-07 16:38:00', 2, '2026-06-06 17:38:00', '2026-06-06 17:38:00'),
  (189, 2, 3, 3, 3, 39, '2026-06-08', '2026-06-14', 2, '09:00:00', '12:00:00', '2026-06-09', 'scheduled', 'Atelier UX', 'Recherche utilisateur et parcours cibles.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-07 16:39:00', 2, '2026-06-06 17:39:00', '2026-06-06 17:39:00'),
  (190, 2, 4, 3, 3, 39, '2026-06-08', '2026-06-14', 4, '14:00:00', '17:00:00', '2026-06-11', 'scheduled', 'Prototypage avance', 'Prototype haute fidelite et validation.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-07 16:40:00', 2, '2026-06-06 17:40:00', '2026-06-06 17:40:00'),
  (191, 3, 6, 6, 2, 39, '2026-06-08', '2026-06-14', 1, '14:00:00', '17:00:00', '2026-06-08', 'scheduled', 'SQL applique', 'Modelisation relationnelle et requetes avancees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-07 16:41:00', 2, '2026-06-06 17:41:00', '2026-06-06 17:41:00'),
  (192, 3, 5, 4, 2, 39, '2026-06-08', '2026-06-14', 3, '13:30:00', '17:30:00', '2026-06-10', 'scheduled', 'Introduction ML', 'Regression, evaluation et jeu de donnees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-07 16:42:00', 2, '2026-06-06 17:42:00', '2026-06-06 17:42:00'),
  (193, 3, 6, 4, 2, 39, '2026-06-08', '2026-06-14', 5, '08:30:00', '11:30:00', '2026-06-12', 'scheduled', 'Data practice', 'Preparation de jeux de donnees et nettoyage.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-07 16:43:00', 2, '2026-06-06 17:43:00', '2026-06-06 17:43:00'),
  (194, 4, 8, 5, 4, 39, '2026-06-08', '2026-06-14', 2, '09:00:00', '12:00:00', '2026-06-09', 'scheduled', 'Architecture cloud', 'Services, supervision et bonnes pratiques.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-07 16:44:00', 2, '2026-06-06 17:44:00', '2026-06-06 17:44:00'),
  (195, 4, 7, 5, 4, 39, '2026-06-08', '2026-06-14', 4, '14:00:00', '18:00:00', '2026-06-11', 'scheduled', 'CI/CD Docker', 'Pipelines, containers et deploiement.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-07 16:45:00', 2, '2026-06-06 17:45:00', '2026-06-06 17:45:00'),
  (196, 4, 7, 5, 4, 39, '2026-06-08', '2026-06-14', 6, '09:00:00', '12:00:00', '2026-06-13', 'scheduled', 'Lab DevOps', 'Atelier supervision et observabilite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-07 16:46:00', 2, '2026-06-06 17:46:00', '2026-06-06 17:46:00'),
  (197, 5, 9, 7, 5, 39, '2026-06-08', '2026-06-14', 1, '11:00:00', '13:00:00', '2026-06-08', 'scheduled', 'Communication pedagogique', 'Animation de groupe et feedback constructif.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-07 16:47:00', 2, '2026-06-06 17:47:00', '2026-06-06 17:47:00'),
  (198, 5, 10, 2, 5, 39, '2026-06-08', '2026-06-14', 3, '09:00:00', '12:00:00', '2026-06-10', 'scheduled', 'Sprint agile', 'Planification, backlog et coordination projet.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-07 16:48:00', 2, '2026-06-06 17:48:00', '2026-06-06 17:48:00'),
  (199, 5, 12, 6, 2, 39, '2026-06-08', '2026-06-14', 5, '13:00:00', '16:00:00', '2026-06-12', 'scheduled', 'Tests logiciels', 'Strategie de test, cas limites et qualite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-07 16:49:00', 2, '2026-06-06 17:49:00', '2026-06-06 17:49:00'),
  (200, 1, 1, 1, 1, 40, '2026-06-15', '2026-06-21', 1, '08:30:00', '11:30:00', '2026-06-15', 'scheduled', 'Cours HTML/CSS', 'Mise en page responsive et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-14 16:00:00', 2, '2026-06-13 17:00:00', '2026-06-13 17:00:00'),
  (201, 1, 11, 2, 2, 40, '2026-06-15', '2026-06-21', 2, '14:00:00', '17:00:00', '2026-06-16', 'scheduled', 'Atelier API REST', 'Conception des endpoints et tests Postman.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-14 16:01:00', 2, '2026-06-13 17:01:00', '2026-06-13 17:01:00'),
  (202, 1, 2, 2, 1, 40, '2026-06-15', '2026-06-21', 4, '09:00:00', '13:00:00', '2026-06-18', 'scheduled', 'Workshop React', 'Composants, state management et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-14 16:02:00', 2, '2026-06-13 17:02:00', '2026-06-13 17:02:00'),
  (203, 2, 3, 3, 3, 40, '2026-06-15', '2026-06-21', 2, '09:00:00', '12:00:00', '2026-06-16', 'scheduled', 'Atelier UX', 'Recherche utilisateur et parcours cibles.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-14 16:03:00', 2, '2026-06-13 17:03:00', '2026-06-13 17:03:00'),
  (204, 2, 4, 3, 3, 40, '2026-06-15', '2026-06-21', 4, '14:00:00', '17:00:00', '2026-06-18', 'scheduled', 'Prototypage avance', 'Prototype haute fidelite et validation.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-14 16:04:00', 2, '2026-06-13 17:04:00', '2026-06-13 17:04:00'),
  (205, 3, 6, 6, 2, 40, '2026-06-15', '2026-06-21', 1, '14:00:00', '17:00:00', '2026-06-15', 'scheduled', 'SQL applique', 'Modelisation relationnelle et requetes avancees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-14 16:05:00', 2, '2026-06-13 17:05:00', '2026-06-13 17:05:00'),
  (206, 3, 5, 4, 2, 40, '2026-06-15', '2026-06-21', 3, '13:30:00', '17:30:00', '2026-06-17', 'scheduled', 'Introduction ML', 'Regression, evaluation et jeu de donnees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-14 16:06:00', 2, '2026-06-13 17:06:00', '2026-06-13 17:06:00'),
  (207, 4, 8, 5, 4, 40, '2026-06-15', '2026-06-21', 2, '09:00:00', '12:00:00', '2026-06-16', 'scheduled', 'Architecture cloud', 'Services, supervision et bonnes pratiques.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-14 16:07:00', 2, '2026-06-13 17:07:00', '2026-06-13 17:07:00'),
  (208, 4, 7, 5, 4, 40, '2026-06-15', '2026-06-21', 4, '14:00:00', '18:00:00', '2026-06-18', 'scheduled', 'CI/CD Docker', 'Pipelines, containers et deploiement.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-14 16:08:00', 2, '2026-06-13 17:08:00', '2026-06-13 17:08:00'),
  (209, 5, 9, 7, 5, 40, '2026-06-15', '2026-06-21', 1, '11:00:00', '13:00:00', '2026-06-15', 'scheduled', 'Communication pedagogique', 'Animation de groupe et feedback constructif.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-14 16:09:00', 2, '2026-06-13 17:09:00', '2026-06-13 17:09:00'),
  (210, 5, 10, 2, 5, 40, '2026-06-15', '2026-06-21', 3, '09:00:00', '12:00:00', '2026-06-17', 'scheduled', 'Sprint agile', 'Planification, backlog et coordination projet.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-14 16:10:00', 2, '2026-06-13 17:10:00', '2026-06-13 17:10:00'),
  (211, 5, 12, 6, 2, 40, '2026-06-15', '2026-06-21', 5, '13:00:00', '16:00:00', '2026-06-19', 'scheduled', 'Tests logiciels', 'Strategie de test, cas limites et qualite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-14 16:11:00', 2, '2026-06-13 17:11:00', '2026-06-13 17:11:00'),
  (212, 5, 9, 3, 5, 40, '2026-06-15', '2026-06-21', 2, '15:00:00', '17:00:00', '2026-06-16', 'scheduled', 'Prise de parole', 'Mediation et gestion des situations de classe.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-14 16:12:00', 2, '2026-06-13 17:12:00', '2026-06-13 17:12:00'),
  (213, 1, 1, 1, 1, 41, '2026-06-22', '2026-06-28', 1, '08:30:00', '11:30:00', '2026-06-22', 'scheduled', 'Cours HTML/CSS', 'Mise en page responsive et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-21 16:13:00', 2, '2026-06-20 17:13:00', '2026-06-20 17:13:00'),
  (214, 1, 11, 2, 2, 41, '2026-06-22', '2026-06-28', 2, '14:00:00', '17:00:00', '2026-06-23', 'scheduled', 'Atelier API REST', 'Conception des endpoints et tests Postman.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-21 16:14:00', 2, '2026-06-20 17:14:00', '2026-06-20 17:14:00'),
  (215, 1, 2, 2, 1, 41, '2026-06-22', '2026-06-28', 4, '09:00:00', '13:00:00', '2026-06-25', 'scheduled', 'Workshop React', 'Composants, state management et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-21 16:15:00', 2, '2026-06-20 17:15:00', '2026-06-20 17:15:00'),
  (216, 1, 1, 2, 1, 41, '2026-06-22', '2026-06-28', 5, '09:00:00', '12:00:00', '2026-06-26', 'scheduled', 'TP Integration', 'Travaux pratiques sur la maquette responsive.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-21 16:16:00', 2, '2026-06-20 17:16:00', '2026-06-20 17:16:00'),
  (217, 2, 3, 3, 3, 41, '2026-06-22', '2026-06-28', 2, '09:00:00', '12:00:00', '2026-06-23', 'scheduled', 'Atelier UX', 'Recherche utilisateur et parcours cibles.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-21 16:17:00', 2, '2026-06-20 17:17:00', '2026-06-20 17:17:00'),
  (218, 2, 4, 3, 3, 41, '2026-06-22', '2026-06-28', 4, '14:00:00', '17:00:00', '2026-06-25', 'scheduled', 'Prototypage avance', 'Prototype haute fidelite et validation.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-21 16:18:00', 2, '2026-06-20 17:18:00', '2026-06-20 17:18:00'),
  (219, 3, 6, 6, 2, 41, '2026-06-22', '2026-06-28', 1, '14:00:00', '17:00:00', '2026-06-22', 'scheduled', 'SQL applique', 'Modelisation relationnelle et requetes avancees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-21 16:19:00', 2, '2026-06-20 17:19:00', '2026-06-20 17:19:00'),
  (220, 3, 5, 4, 2, 41, '2026-06-22', '2026-06-28', 3, '13:30:00', '17:30:00', '2026-06-24', 'scheduled', 'Introduction ML', 'Regression, evaluation et jeu de donnees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-21 16:20:00', 2, '2026-06-20 17:20:00', '2026-06-20 17:20:00'),
  (221, 3, 6, 4, 2, 41, '2026-06-22', '2026-06-28', 5, '08:30:00', '11:30:00', '2026-06-26', 'scheduled', 'Data practice', 'Preparation de jeux de donnees et nettoyage.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-21 16:21:00', 2, '2026-06-20 17:21:00', '2026-06-20 17:21:00'),
  (222, 4, 8, 5, 4, 41, '2026-06-22', '2026-06-28', 2, '09:00:00', '12:00:00', '2026-06-23', 'scheduled', 'Architecture cloud', 'Services, supervision et bonnes pratiques.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-21 16:22:00', 2, '2026-06-20 17:22:00', '2026-06-20 17:22:00'),
  (223, 4, 7, 5, 4, 41, '2026-06-22', '2026-06-28', 4, '14:00:00', '18:00:00', '2026-06-25', 'scheduled', 'CI/CD Docker', 'Pipelines, containers et deploiement.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-21 16:23:00', 2, '2026-06-20 17:23:00', '2026-06-20 17:23:00'),
  (224, 4, 7, 5, 4, 41, '2026-06-22', '2026-06-28', 6, '09:00:00', '12:00:00', '2026-06-27', 'scheduled', 'Lab DevOps', 'Atelier supervision et observabilite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-21 16:24:00', 2, '2026-06-20 17:24:00', '2026-06-20 17:24:00'),
  (225, 5, 9, 7, 5, 41, '2026-06-22', '2026-06-28', 1, '11:00:00', '13:00:00', '2026-06-22', 'scheduled', 'Communication pedagogique', 'Animation de groupe et feedback constructif.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-21 16:25:00', 2, '2026-06-20 17:25:00', '2026-06-20 17:25:00'),
  (226, 5, 10, 2, 5, 41, '2026-06-22', '2026-06-28', 3, '09:00:00', '12:00:00', '2026-06-24', 'scheduled', 'Sprint agile', 'Planification, backlog et coordination projet.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-21 16:26:00', 2, '2026-06-20 17:26:00', '2026-06-20 17:26:00'),
  (227, 5, 12, 6, 2, 41, '2026-06-22', '2026-06-28', 5, '13:00:00', '16:00:00', '2026-06-26', 'scheduled', 'Tests logiciels', 'Strategie de test, cas limites et qualite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-21 16:27:00', 2, '2026-06-20 17:27:00', '2026-06-20 17:27:00'),
  (228, 1, 1, 1, 1, 42, '2026-06-29', '2026-07-05', 1, '08:30:00', '11:30:00', '2026-06-29', 'scheduled', 'Cours HTML/CSS', 'Mise en page responsive et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-28 16:28:00', 2, '2026-06-27 17:28:00', '2026-06-27 17:28:00'),
  (229, 1, 11, 2, 2, 42, '2026-06-29', '2026-07-05', 2, '14:00:00', '17:00:00', '2026-06-30', 'scheduled', 'Atelier API REST', 'Conception des endpoints et tests Postman.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-28 16:29:00', 2, '2026-06-27 17:29:00', '2026-06-27 17:29:00'),
  (230, 1, 2, 2, 1, 42, '2026-06-29', '2026-07-05', 4, '09:00:00', '13:00:00', '2026-07-02', 'scheduled', 'Workshop React', 'Composants, state management et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-28 16:30:00', 2, '2026-06-27 17:30:00', '2026-06-27 17:30:00'),
  (231, 2, 3, 3, 3, 42, '2026-06-29', '2026-07-05', 2, '09:00:00', '12:00:00', '2026-06-30', 'scheduled', 'Atelier UX', 'Recherche utilisateur et parcours cibles.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-28 16:31:00', 2, '2026-06-27 17:31:00', '2026-06-27 17:31:00'),
  (232, 2, 4, 3, 3, 42, '2026-06-29', '2026-07-05', 4, '14:00:00', '17:00:00', '2026-07-02', 'scheduled', 'Prototypage avance', 'Prototype haute fidelite et validation.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-28 16:32:00', 2, '2026-06-27 17:32:00', '2026-06-27 17:32:00'),
  (233, 3, 6, 6, 2, 42, '2026-06-29', '2026-07-05', 1, '14:00:00', '17:00:00', '2026-06-29', 'scheduled', 'SQL applique', 'Modelisation relationnelle et requetes avancees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-28 16:33:00', 2, '2026-06-27 17:33:00', '2026-06-27 17:33:00'),
  (234, 3, 5, 4, 2, 42, '2026-06-29', '2026-07-05', 3, '13:30:00', '17:30:00', '2026-07-01', 'scheduled', 'Introduction ML', 'Regression, evaluation et jeu de donnees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-28 16:34:00', 2, '2026-06-27 17:34:00', '2026-06-27 17:34:00'),
  (235, 4, 8, 5, 4, 42, '2026-06-29', '2026-07-05', 2, '09:00:00', '12:00:00', '2026-06-30', 'scheduled', 'Architecture cloud', 'Services, supervision et bonnes pratiques.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-28 16:35:00', 2, '2026-06-27 17:35:00', '2026-06-27 17:35:00'),
  (236, 4, 7, 5, 4, 42, '2026-06-29', '2026-07-05', 4, '14:00:00', '18:00:00', '2026-07-02', 'scheduled', 'CI/CD Docker', 'Pipelines, containers et deploiement.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-28 16:36:00', 2, '2026-06-27 17:36:00', '2026-06-27 17:36:00'),
  (237, 5, 9, 7, 5, 42, '2026-06-29', '2026-07-05', 1, '11:00:00', '13:00:00', '2026-06-29', 'scheduled', 'Communication pedagogique', 'Animation de groupe et feedback constructif.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-28 16:37:00', 2, '2026-06-27 17:37:00', '2026-06-27 17:37:00'),
  (238, 5, 10, 2, 5, 42, '2026-06-29', '2026-07-05', 3, '09:00:00', '12:00:00', '2026-07-01', 'scheduled', 'Sprint agile', 'Planification, backlog et coordination projet.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-28 16:38:00', 2, '2026-06-27 17:38:00', '2026-06-27 17:38:00'),
  (239, 5, 12, 6, 2, 42, '2026-06-29', '2026-07-05', 5, '13:00:00', '16:00:00', '2026-07-03', 'scheduled', 'Tests logiciels', 'Strategie de test, cas limites et qualite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-28 16:39:00', 2, '2026-06-27 17:39:00', '2026-06-27 17:39:00'),
  (240, 5, 9, 3, 5, 42, '2026-06-29', '2026-07-05', 2, '15:00:00', '17:00:00', '2026-06-30', 'scheduled', 'Prise de parole', 'Mediation et gestion des situations de classe.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-06-28 16:40:00', 2, '2026-06-27 17:40:00', '2026-06-27 17:40:00'),
  (241, 1, 1, 1, 1, 43, '2026-07-06', '2026-07-12', 1, '08:30:00', '11:30:00', '2026-07-06', 'scheduled', 'Cours HTML/CSS', 'Mise en page responsive et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-05 16:41:00', 2, '2026-07-04 17:41:00', '2026-07-04 17:41:00'),
  (242, 1, 11, 2, 2, 43, '2026-07-06', '2026-07-12', 2, '14:00:00', '17:00:00', '2026-07-07', 'scheduled', 'Atelier API REST', 'Conception des endpoints et tests Postman.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-05 16:42:00', 2, '2026-07-04 17:42:00', '2026-07-04 17:42:00'),
  (243, 1, 2, 2, 1, 43, '2026-07-06', '2026-07-12', 4, '09:00:00', '13:00:00', '2026-07-09', 'scheduled', 'Workshop React', 'Composants, state management et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-05 16:43:00', 2, '2026-07-04 17:43:00', '2026-07-04 17:43:00'),
  (244, 1, 1, 2, 1, 43, '2026-07-06', '2026-07-12', 5, '09:00:00', '12:00:00', '2026-07-10', 'scheduled', 'TP Integration', 'Travaux pratiques sur la maquette responsive.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-05 16:44:00', 2, '2026-07-04 17:44:00', '2026-07-04 17:44:00'),
  (245, 2, 3, 3, 3, 43, '2026-07-06', '2026-07-12', 2, '09:00:00', '12:00:00', '2026-07-07', 'scheduled', 'Atelier UX', 'Recherche utilisateur et parcours cibles.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-05 16:45:00', 2, '2026-07-04 17:45:00', '2026-07-04 17:45:00'),
  (246, 2, 4, 3, 3, 43, '2026-07-06', '2026-07-12', 4, '14:00:00', '17:00:00', '2026-07-09', 'scheduled', 'Prototypage avance', 'Prototype haute fidelite et validation.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-05 16:46:00', 2, '2026-07-04 17:46:00', '2026-07-04 17:46:00'),
  (247, 3, 6, 6, 2, 43, '2026-07-06', '2026-07-12', 1, '14:00:00', '17:00:00', '2026-07-06', 'scheduled', 'SQL applique', 'Modelisation relationnelle et requetes avancees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-05 16:47:00', 2, '2026-07-04 17:47:00', '2026-07-04 17:47:00'),
  (248, 3, 5, 4, 2, 43, '2026-07-06', '2026-07-12', 3, '13:30:00', '17:30:00', '2026-07-08', 'scheduled', 'Introduction ML', 'Regression, evaluation et jeu de donnees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-05 16:48:00', 2, '2026-07-04 17:48:00', '2026-07-04 17:48:00'),
  (249, 3, 6, 4, 2, 43, '2026-07-06', '2026-07-12', 5, '08:30:00', '11:30:00', '2026-07-10', 'scheduled', 'Data practice', 'Preparation de jeux de donnees et nettoyage.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-05 16:49:00', 2, '2026-07-04 17:49:00', '2026-07-04 17:49:00'),
  (250, 4, 8, 5, 4, 43, '2026-07-06', '2026-07-12', 2, '09:00:00', '12:00:00', '2026-07-07', 'scheduled', 'Architecture cloud', 'Services, supervision et bonnes pratiques.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-05 16:00:00', 2, '2026-07-04 17:00:00', '2026-07-04 17:00:00'),
  (251, 4, 7, 5, 4, 43, '2026-07-06', '2026-07-12', 4, '14:00:00', '18:00:00', '2026-07-09', 'scheduled', 'CI/CD Docker', 'Pipelines, containers et deploiement.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-05 16:01:00', 2, '2026-07-04 17:01:00', '2026-07-04 17:01:00'),
  (252, 4, 7, 5, 4, 43, '2026-07-06', '2026-07-12', 6, '09:00:00', '12:00:00', '2026-07-11', 'scheduled', 'Lab DevOps', 'Atelier supervision et observabilite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-05 16:02:00', 2, '2026-07-04 17:02:00', '2026-07-04 17:02:00'),
  (253, 5, 9, 7, 5, 43, '2026-07-06', '2026-07-12', 1, '11:00:00', '13:00:00', '2026-07-06', 'scheduled', 'Communication pedagogique', 'Animation de groupe et feedback constructif.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-05 16:03:00', 2, '2026-07-04 17:03:00', '2026-07-04 17:03:00'),
  (254, 5, 10, 2, 5, 43, '2026-07-06', '2026-07-12', 3, '09:00:00', '12:00:00', '2026-07-08', 'scheduled', 'Sprint agile', 'Planification, backlog et coordination projet.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-05 16:04:00', 2, '2026-07-04 17:04:00', '2026-07-04 17:04:00'),
  (255, 5, 12, 6, 2, 43, '2026-07-06', '2026-07-12', 5, '13:00:00', '16:00:00', '2026-07-10', 'scheduled', 'Tests logiciels', 'Strategie de test, cas limites et qualite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-05 16:05:00', 2, '2026-07-04 17:05:00', '2026-07-04 17:05:00'),
  (256, 1, 1, 1, 1, 44, '2026-07-13', '2026-07-19', 1, '08:30:00', '11:30:00', '2026-07-13', 'scheduled', 'Cours HTML/CSS', 'Mise en page responsive et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-12 16:06:00', 2, '2026-07-11 17:06:00', '2026-07-11 17:06:00'),
  (257, 1, 11, 2, 2, 44, '2026-07-13', '2026-07-19', 2, '14:00:00', '17:00:00', '2026-07-14', 'scheduled', 'Atelier API REST', 'Conception des endpoints et tests Postman.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-12 16:07:00', 2, '2026-07-11 17:07:00', '2026-07-11 17:07:00'),
  (258, 1, 2, 2, 1, 44, '2026-07-13', '2026-07-19', 4, '09:00:00', '13:00:00', '2026-07-16', 'scheduled', 'Workshop React', 'Composants, state management et integration.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-12 16:08:00', 2, '2026-07-11 17:08:00', '2026-07-11 17:08:00'),
  (259, 2, 3, 3, 3, 44, '2026-07-13', '2026-07-19', 2, '09:00:00', '12:00:00', '2026-07-14', 'scheduled', 'Atelier UX', 'Recherche utilisateur et parcours cibles.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-12 16:09:00', 2, '2026-07-11 17:09:00', '2026-07-11 17:09:00'),
  (260, 2, 4, 3, 3, 44, '2026-07-13', '2026-07-19', 4, '14:00:00', '17:00:00', '2026-07-16', 'scheduled', 'Prototypage avance', 'Prototype haute fidelite et validation.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-12 16:10:00', 2, '2026-07-11 17:10:00', '2026-07-11 17:10:00'),
  (261, 3, 6, 6, 2, 44, '2026-07-13', '2026-07-19', 1, '14:00:00', '17:00:00', '2026-07-13', 'scheduled', 'SQL applique', 'Modelisation relationnelle et requetes avancees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-12 16:11:00', 2, '2026-07-11 17:11:00', '2026-07-11 17:11:00'),
  (262, 3, 5, 4, 2, 44, '2026-07-13', '2026-07-19', 3, '13:30:00', '17:30:00', '2026-07-15', 'scheduled', 'Introduction ML', 'Regression, evaluation et jeu de donnees.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-12 16:12:00', 2, '2026-07-11 17:12:00', '2026-07-11 17:12:00'),
  (263, 4, 8, 5, 4, 44, '2026-07-13', '2026-07-19', 2, '09:00:00', '12:00:00', '2026-07-14', 'scheduled', 'Architecture cloud', 'Services, supervision et bonnes pratiques.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-12 16:13:00', 2, '2026-07-11 17:13:00', '2026-07-11 17:13:00'),
  (264, 4, 7, 5, 4, 44, '2026-07-13', '2026-07-19', 4, '14:00:00', '18:00:00', '2026-07-16', 'scheduled', 'CI/CD Docker', 'Pipelines, containers et deploiement.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-12 16:14:00', 2, '2026-07-11 17:14:00', '2026-07-11 17:14:00'),
  (265, 5, 9, 7, 5, 44, '2026-07-13', '2026-07-19', 1, '11:00:00', '13:00:00', '2026-07-13', 'scheduled', 'Communication pedagogique', 'Animation de groupe et feedback constructif.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-12 16:15:00', 2, '2026-07-11 17:15:00', '2026-07-11 17:15:00'),
  (266, 5, 10, 2, 5, 44, '2026-07-13', '2026-07-19', 3, '09:00:00', '12:00:00', '2026-07-15', 'scheduled', 'Sprint agile', 'Planification, backlog et coordination projet.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-12 16:16:00', 2, '2026-07-11 17:16:00', '2026-07-11 17:16:00'),
  (267, 5, 12, 6, 2, 44, '2026-07-13', '2026-07-19', 5, '13:00:00', '16:00:00', '2026-07-17', 'scheduled', 'Tests logiciels', 'Strategie de test, cas limites et qualite.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-12 16:17:00', 2, '2026-07-11 17:17:00', '2026-07-11 17:17:00'),
  (268, 5, 9, 3, 5, 44, '2026-07-13', '2026-07-19', 2, '15:00:00', '17:00:00', '2026-07-14', 'scheduled', 'Prise de parole', 'Mediation et gestion des situations de classe.', NULL, 'Valide dans le circuit hebdomadaire.', NULL, NULL, '2026-07-12 16:18:00', 2, '2026-07-11 17:18:00', '2026-07-11 17:18:00');

INSERT INTO `recent_activities` (`id`, `formateur_id`, `module_id`, `action_label`, `action_tone`, `action_description`, `created_at`) VALUES
  (1, 1, 2, 'Soumission validee', 'success', 'Le planning de Yassine Benali pour la semaine 29 a ete approuve.', '2026-03-30 09:30:00'),
  (2, 4, 8, 'Revision demandee', 'warning', 'Une revision a ete demandee sur la charge cloud de Nadia El Mansouri.', '2026-03-30 10:20:00'),
  (3, 3, 5, 'Seance realisee', 'info', 'Hamza Tazi a cloture son atelier machine learning de la semaine 29.', '2026-03-26 17:45:00'),
  (4, 5, 12, 'Demande refusee', 'danger', 'La demande de decalage du module TEST101 a ete refusee.', '2026-05-12 16:20:00'),
  (5, 2, 4, 'Questionnaire soumis', 'success', 'Le questionnaire pedagogique de Salma Alaoui est disponible dans le dashboard.', '2026-03-18 12:10:00'),
  (6, 1, 11, 'Export genere', 'info', 'Le chef de pole a genere le rapport de charge hebdomadaire.', '2026-03-31 18:05:00');

INSERT INTO `reports` (`id`, `type`, `format`, `title`, `file_path`, `generated_by`, `created_at`) VALUES
  (1, 'workload', 'pdf', 'Charge des formateurs - semaine 29', 'storage/reports/workload_week29_demo.pdf', 2, '2026-03-31 18:05:00'),
  (2, 'module_progress', 'xlsx', 'Progression modules - mars 2026', 'storage/reports/module_progress_mars_2026.xlsx', 1, '2026-03-31 18:10:00'),
  (3, 'validation_status', 'pdf', 'Etat des validations - trimestre S2', 'storage/reports/validation_status_s2_demo.pdf', 1, '2026-04-01 09:15:00'),
  (4, 'assignment_coverage', 'xlsx', 'Couverture des affectations 2025-2026', 'storage/reports/assignment_coverage_2026.xlsx', 2, '2026-04-02 11:20:00');

INSERT INTO `formateur_modules` (`id`, `formateur_id`, `module_id`, `competence_level`, `created_at`) VALUES
  (1, 1, 1, 5, '2025-09-22 10:00:00'),
  (2, 1, 2, 5, '2025-09-22 10:02:00'),
  (3, 1, 11, 4, '2025-09-22 10:04:00'),
  (4, 1, 12, 3, '2025-09-22 10:06:00'),
  (5, 1, 10, 3, '2025-09-22 10:08:00'),
  (6, 2, 3, 5, '2025-09-22 10:10:00'),
  (7, 2, 4, 5, '2025-09-22 10:12:00'),
  (8, 2, 9, 4, '2025-09-22 10:14:00'),
  (9, 2, 10, 3, '2025-09-22 10:16:00'),
  (10, 2, 1, 2, '2025-09-22 10:18:00'),
  (11, 3, 5, 5, '2025-09-22 10:20:00'),
  (12, 3, 6, 5, '2025-09-22 10:22:00'),
  (13, 3, 11, 3, '2025-09-22 10:24:00'),
  (14, 3, 8, 3, '2025-09-22 10:26:00'),
  (15, 3, 12, 2, '2025-09-22 10:28:00'),
  (16, 4, 7, 5, '2025-09-22 10:30:00'),
  (17, 4, 8, 5, '2025-09-22 10:32:00'),
  (18, 4, 11, 4, '2025-09-22 10:34:00'),
  (19, 4, 6, 4, '2025-09-22 10:36:00'),
  (20, 4, 12, 4, '2025-09-22 10:38:00'),
  (21, 4, 10, 3, '2025-09-22 10:40:00'),
  (22, 5, 9, 5, '2025-09-22 10:42:00'),
  (23, 5, 10, 4, '2025-09-22 10:44:00'),
  (24, 5, 12, 4, '2025-09-22 10:46:00'),
  (25, 5, 3, 3, '2025-09-22 10:48:00'),
  (26, 5, 4, 3, '2025-09-22 10:50:00');

INSERT INTO `formateur_module_scores` (`id`, `formateur_id`, `module_id`, `score`, `last_updated_at`) VALUES
  (1, 1, 1, 91.00, '2026-03-18 10:00:00'),
  (2, 1, 2, 94.00, '2026-03-18 10:05:00'),
  (3, 1, 11, 89.00, '2026-03-18 10:10:00'),
  (4, 2, 3, 93.00, '2026-03-18 10:15:00'),
  (5, 2, 4, 95.00, '2026-03-18 10:20:00'),
  (6, 3, 5, 88.00, '2026-03-18 10:25:00'),
  (7, 3, 6, 86.00, '2026-03-18 10:30:00'),
  (8, 4, 7, 84.00, '2026-03-18 10:35:00'),
  (9, 4, 8, 82.00, '2026-03-18 10:40:00'),
  (10, 5, 9, 96.00, '2026-03-18 10:45:00'),
  (11, 5, 10, 90.00, '2026-03-18 10:50:00'),
  (12, 5, 12, 87.00, '2026-03-18 10:55:00');

INSERT INTO `ai_scores` (`id`, `formateur_id`, `module_id`, `score`, `reason`, `created_at`) VALUES
  (1, 1, 1, 98.50, '{"competence":5,"experience":3,"semester_fit":"S1","notes":["integration solide","suivi constant du groupe"]}', '2026-03-11 10:03:00'),
  (2, 1, 2, 98.50, '{"competence":5,"experience":3,"semester_fit":"S2","notes":["React avance","bonne regularite"]}', '2026-03-12 10:06:00'),
  (3, 1, 11, 87.45, '{"competence":4,"experience":2,"semester_fit":"S2","notes":["API design","atelier backend pertinent"]}', '2026-03-13 10:09:00'),
  (4, 1, 12, 67.45, '{"competence":3,"experience":1,"semester_fit":"S1","notes":["bases qualite","profil polyvalent"]}', '2026-03-14 10:12:00'),
  (5, 1, 10, 67.45, '{"competence":3,"experience":1,"semester_fit":"S2","notes":["coordination projet","accompagnement agile"]}', '2026-03-15 10:15:00'),
  (6, 2, 3, 98.50, '{"competence":5,"experience":3,"semester_fit":"S1","notes":["UX research","empathie utilisateur"]}', '2026-03-16 10:18:00'),
  (7, 2, 4, 98.50, '{"competence":5,"experience":2,"semester_fit":"S2","notes":["prototypage solide","bonne animation"]}', '2026-03-17 10:21:00'),
  (8, 2, 9, 82.89, '{"competence":4,"experience":2,"semester_fit":"S1","notes":["communication claire","supports pedagogiques"]}', '2026-03-18 10:24:00'),
  (9, 2, 10, 66.89, '{"competence":3,"experience":1,"semester_fit":"S2","notes":["facilitation agile","collaboration equipe"]}', '2026-03-19 10:27:00'),
  (10, 2, 1, 50.89, '{"competence":2,"experience":1,"semester_fit":"S1","notes":["sens interface","contribution web"]}', '2026-03-20 10:30:00'),
  (11, 3, 5, 98.50, '{"competence":5,"experience":3,"semester_fit":"S2","notes":["specialite IA","evaluation positive"]}', '2026-03-21 10:33:00'),
  (12, 3, 6, 98.50, '{"competence":5,"experience":3,"semester_fit":"S1","notes":["SQL solide","donnees appliquees"]}', '2026-03-22 10:36:00'),
  (13, 3, 11, 65.51, '{"competence":3,"experience":1,"semester_fit":"S2","notes":["bonne logique backend","profil data utile"]}', '2026-03-23 10:39:00'),
  (14, 3, 8, 65.51, '{"competence":3,"experience":1,"semester_fit":"S1","notes":["notions cloud","observabilite"]}', '2026-03-24 10:42:00'),
  (15, 3, 12, 49.51, '{"competence":2,"experience":1,"semester_fit":"S1","notes":["culture qualite","tests fonctionnels"]}', '2026-03-10 10:45:00'),
  (16, 4, 7, 98.50, '{"competence":5,"experience":3,"semester_fit":"S2","notes":["CI/CD experte","stabilite environnement"]}', '2026-03-11 10:48:00'),
  (17, 4, 8, 98.50, '{"competence":5,"experience":3,"semester_fit":"S1","notes":["cloud ops","supervision fiable"]}', '2026-03-12 10:51:00'),
  (18, 4, 11, 80.95, '{"competence":4,"experience":2,"semester_fit":"S2","notes":["API deployment","observabilite"]}', '2026-03-13 10:54:00'),
  (19, 4, 6, 80.95, '{"competence":4,"experience":1,"semester_fit":"S1","notes":["data infra","automatisation utile"]}', '2026-03-14 10:57:00'),
  (20, 4, 12, 80.95, '{"competence":4,"experience":2,"semester_fit":"S1","notes":["qualite pipeline","tests outilles"]}', '2026-03-15 10:00:00'),
  (21, 4, 10, 64.95, '{"competence":3,"experience":1,"semester_fit":"S2","notes":["coordination projet","rituels efficaces"]}', '2026-03-16 10:03:00'),
  (22, 5, 9, 98.50, '{"competence":5,"experience":3,"semester_fit":"S1","notes":["communication forte","animation groupe"]}', '2026-03-17 10:06:00'),
  (23, 5, 10, 87.17, '{"competence":4,"experience":2,"semester_fit":"S2","notes":["agilite pragmatique","suivi sprint"]}', '2026-03-18 10:09:00'),
  (24, 5, 12, 87.17, '{"competence":4,"experience":2,"semester_fit":"S1","notes":["culture qualite","cas de test clairs"]}', '2026-03-19 10:12:00'),
  (25, 5, 3, 67.17, '{"competence":3,"experience":1,"semester_fit":"S1","notes":["bon sens utilisateur","facilitation atelier"]}', '2026-03-20 10:15:00'),
  (26, 5, 4, 67.17, '{"competence":3,"experience":1,"semester_fit":"S2","notes":["retours constructifs","presentation soignee"]}', '2026-03-21 10:18:00');

INSERT INTO `evaluation_questionnaires` (`id`, `title`, `created_at`) VALUES
  (1, 'Evaluation pedagogique des formateurs', '2025-09-01 08:00:00');

INSERT INTO `evaluation_questions` (`id`, `questionnaire_id`, `question_text`, `type`, `weight`, `created_at`) VALUES
  (1, 1, 'Le formateur maitrise-t-il le contenu de ses modules ?', 'rating', 4.00, '2025-09-01 08:05:00'),
  (2, 1, 'Le formateur explique-t-il clairement les notions ?', 'rating', 3.00, '2025-09-01 08:06:00'),
  (3, 1, 'Le formateur interagit-il avec les stagiaires de facon constructive ?', 'rating', 2.00, '2025-09-01 08:07:00'),
  (4, 1, 'Le formateur respecte-t-il les horaires et le planning prevus ?', 'yes/no', 2.00, '2025-09-01 08:08:00'),
  (5, 1, 'Le formateur prepare-t-il des supports pedagogiques adaptes ?', 'yes/no', 2.00, '2025-09-01 08:09:00'),
  (6, 1, 'Commentaire complementaire sur la prestation du formateur.', 'text', 0.00, '2025-09-01 08:10:00');

INSERT INTO `evaluation_answers` (`id`, `formateur_id`, `module_id`, `question_id`, `value`, `created_at`) VALUES
  (1, 1, 1, 1, '5', '2026-03-18 09:07:15'),
  (2, 1, 1, 2, '5', '2026-03-18 09:07:30'),
  (3, 1, 1, 3, '4', '2026-03-18 09:07:45'),
  (4, 1, 1, 4, 'yes', '2026-03-18 09:08:00'),
  (5, 1, 1, 5, 'yes', '2026-03-18 09:08:15'),
  (6, 1, 1, 6, 'Animation claire et tres bon suivi des ateliers techniques.', '2026-03-18 09:08:30'),
  (7, 2, 3, 1, '4', '2026-03-18 09:14:15'),
  (8, 2, 3, 2, '5', '2026-03-18 09:14:30'),
  (9, 2, 3, 3, '5', '2026-03-18 09:14:45'),
  (10, 2, 3, 4, 'yes', '2026-03-18 09:15:00'),
  (11, 2, 3, 5, 'yes', '2026-03-18 09:15:15'),
  (12, 2, 3, 6, 'Tres bonne posture pedagogique et supports bien structures.', '2026-03-18 09:15:30'),
  (13, 3, 5, 1, '4', '2026-03-18 09:21:15'),
  (14, 3, 5, 2, '4', '2026-03-18 09:21:30'),
  (15, 3, 5, 3, '4', '2026-03-18 09:21:45'),
  (16, 3, 5, 4, 'yes', '2026-03-18 09:22:00'),
  (17, 3, 5, 5, 'yes', '2026-03-18 09:22:15'),
  (18, 3, 5, 6, 'Bonne progression sur les mises en pratique data et IA.', '2026-03-18 09:22:30'),
  (19, 4, 7, 1, '4', '2026-03-18 09:28:15'),
  (20, 4, 7, 2, '4', '2026-03-18 09:28:30'),
  (21, 4, 7, 3, '3', '2026-03-18 09:28:45'),
  (22, 4, 7, 4, 'yes', '2026-03-18 09:29:00'),
  (23, 4, 7, 5, 'yes', '2026-03-18 09:29:15'),
  (24, 4, 7, 6, 'Interventions techniques solides et bonne gestion du laboratoire cloud.', '2026-03-18 09:29:30'),
  (25, 5, 9, 1, '5', '2026-03-18 09:35:15'),
  (26, 5, 9, 2, '4', '2026-03-18 09:35:30'),
  (27, 5, 9, 3, '5', '2026-03-18 09:35:45'),
  (28, 5, 9, 4, 'yes', '2026-03-18 09:36:00'),
  (29, 5, 9, 5, 'yes', '2026-03-18 09:36:15'),
  (30, 5, 9, 6, 'Excellent accompagnement humain et bonne coordination agile.', '2026-03-18 09:36:30');

INSERT INTO `evaluation_scores` (`id`, `formateur_id`, `module_id`, `total_score`, `max_score`, `percentage`, `created_at`) VALUES
  (1, 1, 1, 63.00, 65.00, 96.92, '2026-03-18 09:10:00'),
  (2, 2, 3, 61.00, 65.00, 93.85, '2026-03-18 09:17:00'),
  (3, 3, 5, 56.00, 65.00, 86.15, '2026-03-18 09:24:00'),
  (4, 4, 7, 54.00, 65.00, 83.08, '2026-03-18 09:31:00'),
  (5, 5, 9, 62.00, 65.00, 95.38, '2026-03-18 09:38:00');

UPDATE `planning_submissions`
SET
  `processed_at` = CASE
    WHEN `status` = 'rejected' AND `semaine` = 36 THEN '2026-03-28 11:30:00'
    WHEN `status` = 'approved' AND `semaine` = 30 THEN '2026-03-30 16:00:00'
    WHEN `status` = 'approved' AND `semaine` = 31 THEN '2026-03-29 16:00:00'
    WHEN `status` = 'approved' AND `semaine` = 32 THEN '2026-03-27 15:40:00'
    WHEN `status` = 'approved' AND `semaine` = 33 THEN '2026-03-26 15:20:00'
    WHEN `status` = 'approved' AND `semaine` = 34 THEN '2026-03-25 15:00:00'
    WHEN `status` = 'approved' AND `semaine` = 35 THEN '2026-03-24 14:40:00'
    WHEN `status` = 'approved' AND `semaine` = 36 THEN '2026-03-23 14:20:00'
    WHEN `status` = 'approved' AND `semaine` = 37 THEN '2026-03-20 14:00:00'
    WHEN `status` = 'approved' AND `semaine` = 38 THEN '2026-03-19 13:40:00'
    WHEN `status` = 'approved' AND `semaine` = 39 THEN '2026-03-18 13:20:00'
    WHEN `status` = 'approved' AND `semaine` = 40 THEN '2026-03-17 13:00:00'
    WHEN `status` = 'approved' AND `semaine` = 41 THEN '2026-03-16 12:40:00'
    WHEN `status` = 'approved' AND `semaine` = 42 THEN '2026-03-13 12:20:00'
    WHEN `status` = 'approved' AND `semaine` = 43 THEN '2026-03-12 12:00:00'
    WHEN `status` = 'approved' AND `semaine` = 44 THEN '2026-03-11 11:40:00'
    ELSE `processed_at`
  END,
  `snapshot_captured_at` = CASE
    WHEN `status` = 'rejected' AND `semaine` = 36 THEN '2026-03-28 11:30:00'
    WHEN `status` = 'approved' AND `semaine` = 30 THEN '2026-03-30 16:00:00'
    WHEN `status` = 'approved' AND `semaine` = 31 THEN '2026-03-29 16:00:00'
    WHEN `status` = 'approved' AND `semaine` = 32 THEN '2026-03-27 15:40:00'
    WHEN `status` = 'approved' AND `semaine` = 33 THEN '2026-03-26 15:20:00'
    WHEN `status` = 'approved' AND `semaine` = 34 THEN '2026-03-25 15:00:00'
    WHEN `status` = 'approved' AND `semaine` = 35 THEN '2026-03-24 14:40:00'
    WHEN `status` = 'approved' AND `semaine` = 36 THEN '2026-03-23 14:20:00'
    WHEN `status` = 'approved' AND `semaine` = 37 THEN '2026-03-20 14:00:00'
    WHEN `status` = 'approved' AND `semaine` = 38 THEN '2026-03-19 13:40:00'
    WHEN `status` = 'approved' AND `semaine` = 39 THEN '2026-03-18 13:20:00'
    WHEN `status` = 'approved' AND `semaine` = 40 THEN '2026-03-17 13:00:00'
    WHEN `status` = 'approved' AND `semaine` = 41 THEN '2026-03-16 12:40:00'
    WHEN `status` = 'approved' AND `semaine` = 42 THEN '2026-03-13 12:20:00'
    WHEN `status` = 'approved' AND `semaine` = 43 THEN '2026-03-12 12:00:00'
    WHEN `status` = 'approved' AND `semaine` = 44 THEN '2026-03-11 11:40:00'
    ELSE `snapshot_captured_at`
  END;

INSERT INTO `system_meta` (`meta_key`, `meta_value`, `updated_at`) VALUES ('app_bootstrap_version', '2026-03-30-demo-seed', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE `meta_value` = VALUES(`meta_value`), `updated_at` = CURRENT_TIMESTAMP;

SET FOREIGN_KEY_CHECKS = 1;
