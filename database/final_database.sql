CREATE DATABASE IF NOT EXISTS `gestion_formateurs`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `gestion_formateurs`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `evaluation_answers`;
DROP TABLE IF EXISTS `evaluation_questions`;
DROP TABLE IF EXISTS `evaluation_scores`;
DROP TABLE IF EXISTS `evaluation_questionnaires`;
DROP TABLE IF EXISTS `formateur_module_scores`;
DROP TABLE IF EXISTS `module_questionnaires`;
DROP TABLE IF EXISTS `request_throttles`;
DROP TABLE IF EXISTS `ai_scores`;
DROP TABLE IF EXISTS `formateur_modules`;
DROP TABLE IF EXISTS `reports`;
DROP TABLE IF EXISTS `recent_activities`;
DROP TABLE IF EXISTS `planning_sessions`;
DROP TABLE IF EXISTS `planning_change_requests`;
DROP TABLE IF EXISTS `planning_submissions`;
DROP TABLE IF EXISTS `planning`;
DROP TABLE IF EXISTS `affectations`;
DROP TABLE IF EXISTS `module_groupes`;
DROP TABLE IF EXISTS `utilisateurs`;
DROP TABLE IF EXISTS `salles`;
DROP TABLE IF EXISTS `groupes`;
DROP TABLE IF EXISTS `modules`;
DROP TABLE IF EXISTS `formateurs`;
DROP TABLE IF EXISTS `academic_config`;
DROP TABLE IF EXISTS `system_meta`;

CREATE TABLE `system_meta` (
  `meta_key` varchar(120) NOT NULL,
  `meta_value` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`meta_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `academic_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `s2_start_date` date NOT NULL,
  `stage_start_date` date NOT NULL,
  `stage_end_date` date NOT NULL,
  `exam_regional_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `formateurs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(120) NOT NULL,
  `email` varchar(150) NOT NULL,
  `telephone` varchar(40) DEFAULT NULL,
  `specialite` varchar(120) NOT NULL,
  `max_heures` int NOT NULL DEFAULT 910,
  `weekly_hours` decimal(5,2) DEFAULT NULL,
  `current_hours` decimal(8,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_formateurs_email` (`email`),
  KEY `idx_formateurs_specialite` (`specialite`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `modules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(30) DEFAULT NULL,
  `intitule` varchar(160) NOT NULL,
  `filiere` varchar(120) NOT NULL,
  `semestre` enum('S1','S2') NOT NULL,
  `volume_horaire` int NOT NULL,
  `has_efm` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_modules_code` (`code`),
  KEY `idx_modules_filiere_semestre` (`filiere`,`semestre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `groupes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(40) NOT NULL,
  `nom` varchar(160) NOT NULL,
  `filiere` varchar(120) NOT NULL,
  `annee_scolaire` varchar(20) NOT NULL,
  `effectif` int DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_groupes_code` (`code`),
  KEY `idx_groupes_filiere_actif` (`filiere`,`actif`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `salles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `nom` varchar(120) DEFAULT NULL,
  `batiment` varchar(120) DEFAULT NULL,
  `capacite` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_salles_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `utilisateurs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `formateur_id` int DEFAULT NULL,
  `nom` varchar(120) NOT NULL,
  `email` varchar(150) NOT NULL,
  `username` varchar(120) DEFAULT NULL,
  `photo` longtext DEFAULT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `reset_token` varchar(128) DEFAULT NULL,
  `reset_token_expiration` datetime DEFAULT NULL,
  `role_id` tinyint NOT NULL DEFAULT 3,
  `statut` enum('actif','inactif') NOT NULL DEFAULT 'actif',
  `theme_preference` enum('light','dark') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_utilisateurs_email` (`email`),
  UNIQUE KEY `uq_utilisateurs_username` (`username`),
  UNIQUE KEY `uq_utilisateurs_formateur` (`formateur_id`),
  KEY `idx_utilisateurs_reset_token_expiration` (`reset_token`,`reset_token_expiration`),
  CONSTRAINT `fk_utilisateurs_formateur`
    FOREIGN KEY (`formateur_id`) REFERENCES `formateurs` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `module_groupes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `module_id` int NOT NULL,
  `groupe_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_module_groupes_pair` (`module_id`,`groupe_id`),
  KEY `idx_module_groupes_groupe` (`groupe_id`),
  CONSTRAINT `fk_module_groupes_module`
    FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_module_groupes_groupe`
    FOREIGN KEY (`groupe_id`) REFERENCES `groupes` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `module_questionnaires` (
  `id` int NOT NULL AUTO_INCREMENT,
  `module_id` int NOT NULL,
  `questionnaire_id` varchar(120) NOT NULL,
  `questionnaire_token` varchar(64) DEFAULT NULL,
  `google_form_id` varchar(191) DEFAULT NULL,
  `total_questions` int NOT NULL DEFAULT 20,
  `last_synced_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_module_questionnaires_module` (`module_id`),
  UNIQUE KEY `uq_module_questionnaires_questionnaire` (`questionnaire_id`),
  UNIQUE KEY `uq_module_questionnaires_token` (`questionnaire_token`),
  UNIQUE KEY `uq_module_questionnaires_google_form` (`google_form_id`),
  CONSTRAINT `fk_module_questionnaires_module`
    FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `affectations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `formateur_id` int NOT NULL,
  `module_id` int NOT NULL,
  `annee` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_affectation_formateur_module_annee` (`formateur_id`,`module_id`,`annee`),
  UNIQUE KEY `uq_affectation_module_annee` (`module_id`,`annee`),
  KEY `idx_affectations_formateur_annee_module` (`formateur_id`,`annee`,`module_id`),
  KEY `idx_affectations_module_annee_formateur` (`module_id`,`annee`,`formateur_id`),
  CONSTRAINT `fk_affectations_formateur`
    FOREIGN KEY (`formateur_id`) REFERENCES `formateurs` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_affectations_module`
    FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `planning` (
  `id` int NOT NULL AUTO_INCREMENT,
  `formateur_id` int NOT NULL,
  `module_id` int NOT NULL,
  `semaine` int NOT NULL,
  `heures` decimal(5,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_planning_formateur_module_semaine` (`formateur_id`,`module_id`,`semaine`),
  KEY `idx_planning_formateur_semaine_module` (`formateur_id`,`semaine`,`module_id`),
  KEY `idx_planning_module_semaine` (`module_id`,`semaine`),
  CONSTRAINT `fk_planning_formateur`
    FOREIGN KEY (`formateur_id`) REFERENCES `formateurs` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_planning_module`
    FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `planning_submissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `formateur_id` int NOT NULL,
  `semaine` int NOT NULL,
  `academic_year` int NOT NULL,
  `submitted_hours` decimal(6,2) NOT NULL DEFAULT 0.00,
  `status` enum('pending','approved','rejected','revision') NOT NULL DEFAULT 'pending',
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` datetime DEFAULT NULL,
  `processed_by` int DEFAULT NULL,
  `decision_note` varchar(255) DEFAULT NULL,
  `snapshot_entries` longtext DEFAULT NULL,
  `snapshot_total_hours` decimal(6,2) DEFAULT NULL,
  `snapshot_captured_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_planning_submissions_formateur_year_status` (`formateur_id`,`academic_year`,`status`),
  KEY `idx_planning_submissions_processed_by` (`processed_by`),
  CONSTRAINT `fk_planning_submissions_formateur`
    FOREIGN KEY (`formateur_id`) REFERENCES `formateurs` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_planning_submissions_user`
    FOREIGN KEY (`processed_by`) REFERENCES `utilisateurs` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `planning_change_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `formateur_id` int NOT NULL,
  `module_id` int NOT NULL,
  `groupe_code` varchar(40) NOT NULL,
  `semaine` varchar(30) NOT NULL,
  `request_week` int DEFAULT NULL,
  `academic_year` int NOT NULL,
  `reason` varchar(500) NOT NULL,
  `status` enum('pending','validated','planned','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_change_requests_formateur_year_status` (`formateur_id`,`academic_year`,`status`),
  KEY `idx_change_requests_module` (`module_id`),
  CONSTRAINT `fk_change_requests_formateur`
    FOREIGN KEY (`formateur_id`) REFERENCES `formateurs` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_change_requests_module`
    FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `planning_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `formateur_id` int NOT NULL,
  `module_id` int NOT NULL,
  `groupe_id` int DEFAULT NULL,
  `salle_id` int DEFAULT NULL,
  `week_number` int NOT NULL,
  `week_start_date` date DEFAULT NULL,
  `week_end_date` date DEFAULT NULL,
  `day_of_week` tinyint NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `session_date` date DEFAULT NULL,
  `status` enum('scheduled','confirmed','pending_change','edit_requested','validated','done','cancelled') NOT NULL DEFAULT 'scheduled',
  `task_title` varchar(255) DEFAULT NULL,
  `task_description` text DEFAULT NULL,
  `note_formateur` text DEFAULT NULL,
  `chef_response` text DEFAULT NULL,
  `change_request_note` text DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `validated_at` datetime DEFAULT NULL,
  `validated_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_planning_sessions_formateur_week` (`formateur_id`,`week_number`),
  KEY `idx_planning_sessions_group_week` (`groupe_id`,`week_number`),
  KEY `idx_planning_sessions_room_week` (`salle_id`,`week_number`),
  KEY `idx_planning_sessions_slot` (`week_number`,`day_of_week`,`start_time`,`end_time`),
  KEY `idx_planning_sessions_module` (`module_id`),
  CONSTRAINT `fk_planning_sessions_formateur`
    FOREIGN KEY (`formateur_id`) REFERENCES `formateurs` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_planning_sessions_module`
    FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_planning_sessions_groupe`
    FOREIGN KEY (`groupe_id`) REFERENCES `groupes` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_planning_sessions_salle`
    FOREIGN KEY (`salle_id`) REFERENCES `salles` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_planning_sessions_validated_by`
    FOREIGN KEY (`validated_by`) REFERENCES `utilisateurs` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `recent_activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `formateur_id` int DEFAULT NULL,
  `module_id` int DEFAULT NULL,
  `action_label` varchar(120) NOT NULL,
  `action_tone` enum('success','warning','danger','info') NOT NULL DEFAULT 'info',
  `action_description` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_recent_activities_formateur_created_at` (`formateur_id`,`created_at`),
  CONSTRAINT `fk_recent_activities_formateur`
    FOREIGN KEY (`formateur_id`) REFERENCES `formateurs` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_recent_activities_module`
    FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(60) NOT NULL,
  `format` enum('pdf','xlsx') NOT NULL,
  `title` varchar(180) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `generated_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reports_type_created_at` (`type`,`created_at`),
  CONSTRAINT `fk_reports_generated_by`
    FOREIGN KEY (`generated_by`) REFERENCES `utilisateurs` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `formateur_modules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `formateur_id` int NOT NULL,
  `module_id` int NOT NULL,
  `competence_level` tinyint NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_formateur_modules_pair` (`formateur_id`,`module_id`),
  KEY `idx_formateur_modules_formateur` (`formateur_id`),
  KEY `idx_formateur_modules_module` (`module_id`),
  CONSTRAINT `fk_formateur_modules_formateur`
    FOREIGN KEY (`formateur_id`) REFERENCES `formateurs` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_formateur_modules_module`
    FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `formateur_module_scores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `formateur_id` int NOT NULL,
  `module_id` int NOT NULL,
  `score` decimal(5,2) NOT NULL DEFAULT 0.00,
  `last_updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_formateur_module_scores_pair` (`formateur_id`,`module_id`),
  KEY `idx_formateur_module_scores_module` (`module_id`),
  CONSTRAINT `fk_formateur_module_scores_formateur`
    FOREIGN KEY (`formateur_id`) REFERENCES `formateurs` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_formateur_module_scores_module`
    FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ai_scores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `formateur_id` int NOT NULL,
  `module_id` int NOT NULL,
  `score` decimal(5,2) NOT NULL,
  `reason` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ai_scores_pair` (`formateur_id`,`module_id`),
  KEY `idx_ai_scores_formateur` (`formateur_id`),
  KEY `idx_ai_scores_module` (`module_id`),
  CONSTRAINT `fk_ai_scores_formateur`
    FOREIGN KEY (`formateur_id`) REFERENCES `formateurs` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ai_scores_module`
    FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `request_throttles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_key` varchar(80) NOT NULL,
  `scope_key` char(64) NOT NULL,
  `attempt_count` int NOT NULL DEFAULT 0,
  `window_started_at` datetime NOT NULL,
  `last_attempt_at` datetime NOT NULL,
  `blocked_until` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_request_throttles_action_scope` (`action_key`,`scope_key`),
  KEY `idx_request_throttles_blocked_until` (`blocked_until`),
  KEY `idx_request_throttles_last_attempt` (`last_attempt_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `evaluation_questionnaires` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(180) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `evaluation_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `questionnaire_id` int NOT NULL,
  `question_text` varchar(500) NOT NULL,
  `type` enum('rating','yes/no','text') NOT NULL,
  `weight` decimal(6,2) NOT NULL DEFAULT 1.00,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_questions_questionnaire` (`questionnaire_id`),
  CONSTRAINT `fk_evaluation_questions_questionnaire`
    FOREIGN KEY (`questionnaire_id`) REFERENCES `evaluation_questionnaires` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `evaluation_answers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `formateur_id` int NOT NULL,
  `module_id` int DEFAULT NULL,
  `question_id` int NOT NULL,
  `value` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_answers_formateur_module_question` (`formateur_id`,`module_id`,`question_id`),
  KEY `idx_answers_module` (`module_id`),
  KEY `idx_answers_question` (`question_id`),
  CONSTRAINT `fk_evaluation_answers_formateur`
    FOREIGN KEY (`formateur_id`) REFERENCES `formateurs` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_evaluation_answers_module`
    FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_evaluation_answers_question`
    FOREIGN KEY (`question_id`) REFERENCES `evaluation_questions` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `evaluation_scores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `formateur_id` int NOT NULL,
  `module_id` int DEFAULT NULL,
  `total_score` decimal(10,2) NOT NULL,
  `max_score` decimal(10,2) NOT NULL,
  `percentage` decimal(5,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_scores_formateur_module` (`formateur_id`,`module_id`),
  KEY `idx_scores_module` (`module_id`),
  KEY `idx_scores_percentage` (`percentage`),
  CONSTRAINT `fk_evaluation_scores_formateur`
    FOREIGN KEY (`formateur_id`) REFERENCES `formateurs` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_evaluation_scores_module`
    FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `academic_config`
  (`id`, `start_date`, `end_date`, `s2_start_date`, `stage_start_date`, `stage_end_date`, `exam_regional_date`, `created_at`, `updated_at`)
VALUES
  (1, '2025-09-15', '2026-07-15', '2026-02-02', '2026-04-20', '2026-06-05', '2026-06-20', '2025-09-01 09:00:00', NULL);

INSERT INTO `formateurs`
  (`id`, `nom`, `email`, `telephone`, `specialite`, `max_heures`, `weekly_hours`, `current_hours`, `created_at`, `updated_at`)
VALUES
  (1, 'Yassine Benali', 'formateur@test.com', '+212600000001', 'Développement Web', 910, 24.00, 140.00, '2025-09-10 08:00:00', NULL),
  (2, 'Salma Alaoui', 'salma.alaoui@test.com', '+212600000002', 'UX/UI Design', 910, 20.00, 80.00, '2025-09-10 08:05:00', NULL),
  (3, 'Hamza Tazi', 'hamza.tazi@test.com', '+212600000003', 'Data & IA', 910, 18.00, 70.00, '2025-09-10 08:10:00', NULL);

INSERT INTO `modules`
  (`id`, `code`, `intitule`, `filiere`, `semestre`, `volume_horaire`, `has_efm`, `created_at`, `updated_at`)
VALUES
  (1, 'DEV101', 'Développer des interfaces HTML/CSS', 'Développement Digital', 'S1', 60, 0, '2025-09-10 09:00:00', NULL),
  (2, 'DEV202', 'Développer une application React', 'Développement Digital', 'S2', 80, 1, '2025-09-10 09:05:00', NULL),
  (3, 'DS101', 'Concevoir une expérience UX', 'Design Digital', 'S1', 50, 0, '2025-09-10 09:10:00', NULL),
  (4, 'IA201', 'Introduire le machine learning', 'Intelligence Artificielle', 'S2', 70, 1, '2025-09-10 09:15:00', NULL),
  (5, 'SOFT101', 'Communication pédagogique', 'Tronc Commun', 'S1', 30, 0, '2025-09-10 09:20:00', NULL);

INSERT INTO `module_questionnaires`
  (`id`, `module_id`, `questionnaire_id`, `questionnaire_token`, `total_questions`, `created_at`, `updated_at`)
VALUES
  (1, 1, 'module-1', '61d0d01710f24ec19424601b1e8c5af613f9e84eb627d3ef', 20, '2025-09-10 11:00:00', NULL),
  (2, 2, 'module-2', '2677e45dc56549238848344c5f804f3d4c17af869b7ff262', 20, '2025-09-10 11:05:00', NULL),
  (3, 3, 'module-3', '4ddf3717b12347a2afae33af30564671c77cc6d7a0e34a71', 20, '2025-09-10 11:10:00', NULL),
  (4, 4, 'module-4', '4c93b53ae7c6413fb1b6d1fd5fe0ff8e7f9d0a9dca9f14c6', 20, '2025-09-10 11:15:00', NULL),
  (5, 5, 'module-5', '7f04c6e21772444d8b211a2bda6dd22909e5636328702395', 20, '2025-09-10 11:20:00', NULL);

INSERT INTO `groupes`
  (`id`, `code`, `nom`, `filiere`, `annee_scolaire`, `effectif`, `actif`, `created_at`, `updated_at`)
VALUES
  (1, 'DEV-1', 'Développement Digital 1A', 'Développement Digital', '2025-2026', 24, 1, '2025-09-12 09:00:00', NULL),
  (2, 'DEV-2', 'Développement Digital 2A', 'Développement Digital', '2025-2026', 22, 1, '2025-09-12 09:05:00', NULL),
  (3, 'DESIGN-1', 'Design Digital 2A', 'Design Digital', '2025-2026', 18, 1, '2025-09-12 09:10:00', NULL),
  (4, 'IA-1', 'Intelligence Artificielle 2A', 'Intelligence Artificielle', '2025-2026', 20, 1, '2025-09-12 09:15:00', NULL);

INSERT INTO `salles`
  (`id`, `code`, `nom`, `batiment`, `capacite`, `created_at`)
VALUES
  (1, 'SN-12', 'Salle Numérique 12', 'Bâtiment A', 24, '2025-09-12 10:00:00'),
  (2, 'LAB-02', 'Laboratoire 02', 'Bâtiment B', 18, '2025-09-12 10:05:00');

INSERT INTO `utilisateurs`
  (`id`, `formateur_id`, `nom`, `email`, `username`, `photo`, `mot_de_passe`, `reset_token`, `reset_token_expiration`, `role_id`, `statut`, `theme_preference`, `created_at`)
VALUES
  (1, NULL, 'Directeur Pédagogique', 'directeur@test.com', 'directeur', NULL, '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', NULL, NULL, 1, 'actif', 'light', '2025-09-10 07:30:00'),
  (2, NULL, 'Chef de Pôle', 'chef@test.com', 'chef', NULL, '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', NULL, NULL, 2, 'actif', 'light', '2025-09-10 07:35:00'),
  (3, 1, 'Yassine Benali', 'formateur@test.com', 'yassine.benali', NULL, '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', NULL, NULL, 3, 'actif', 'light', '2025-09-10 07:40:00'),
  (4, 2, 'Salma Alaoui', 'salma.alaoui@test.com', 'salma.alaoui', NULL, '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', NULL, NULL, 3, 'actif', 'light', '2025-09-10 07:45:00'),
  (5, 3, 'Hamza Tazi', 'hamza.tazi@test.com', 'hamza.tazi', NULL, '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', NULL, NULL, 3, 'actif', 'dark', '2025-09-10 07:50:00');

INSERT INTO `module_groupes` (`id`, `module_id`, `groupe_id`, `created_at`) VALUES
  (1, 1, 1, '2025-09-15 09:00:00'),
  (2, 2, 1, '2025-09-15 09:05:00'),
  (3, 2, 2, '2025-09-15 09:06:00'),
  (4, 3, 3, '2025-09-15 09:10:00'),
  (5, 4, 4, '2025-09-15 09:15:00'),
  (6, 5, 2, '2025-09-15 09:20:00');

INSERT INTO `affectations` (`id`, `formateur_id`, `module_id`, `annee`, `created_at`) VALUES
  (1, 1, 1, 2026, '2025-09-20 10:00:00'),
  (2, 1, 2, 2026, '2025-09-20 10:05:00'),
  (3, 2, 3, 2026, '2025-09-20 10:10:00'),
  (4, 3, 4, 2026, '2025-09-20 10:15:00'),
  (5, 2, 5, 2026, '2025-09-20 10:20:00');

INSERT INTO `planning`
  (`id`, `formateur_id`, `module_id`, `semaine`, `heures`, `created_at`, `updated_at`)
VALUES
  (1, 1, 1, 10, 6.00, '2025-11-17 08:00:00', NULL),
  (2, 1, 2, 10, 8.00, '2025-11-18 08:00:00', NULL),
  (3, 2, 3, 10, 5.00, '2025-11-17 09:00:00', NULL),
  (4, 3, 4, 10, 6.00, '2025-11-19 09:00:00', NULL),
  (5, 2, 5, 10, 3.00, '2025-11-20 09:00:00', NULL),
  (6, 1, 1, 11, 6.00, '2025-11-24 08:00:00', NULL),
  (7, 1, 2, 11, 8.00, '2025-11-25 08:00:00', NULL),
  (8, 2, 3, 11, 5.00, '2025-11-24 09:00:00', NULL),
  (9, 3, 4, 11, 6.00, '2025-11-26 09:00:00', NULL),
  (10, 2, 5, 11, 3.00, '2025-11-27 09:00:00', NULL);

INSERT INTO `planning_submissions`
  (`id`, `formateur_id`, `semaine`, `academic_year`, `submitted_hours`, `status`, `submitted_at`, `processed_at`, `processed_by`, `decision_note`)
VALUES
  (1, 1, 11, 2026, 14.00, 'approved', '2025-11-28 14:00:00', '2025-11-28 16:00:00', 2, 'Charge validée.'),
  (2, 2, 11, 2026, 8.00, 'pending', '2025-11-28 14:30:00', NULL, NULL, NULL),
  (3, 3, 11, 2026, 6.00, 'rejected', '2025-11-28 15:00:00', '2025-11-28 18:00:00', 1, 'Merci de revoir la répartition hebdomadaire.');

INSERT INTO `planning_change_requests`
  (`id`, `formateur_id`, `module_id`, `groupe_code`, `semaine`, `request_week`, `academic_year`, `reason`, `status`, `created_at`, `updated_at`, `processed_at`)
VALUES
  (1, 1, 2, 'DEV-2', 'Semaine 11', 11, 2026, 'Confirmation du créneau du mardi après-midi.', 'pending', '2025-11-28 09:00:00', NULL, NULL),
  (2, 2, 3, 'DESIGN-1', 'Semaine 10', 10, 2026, 'Décalage accepté après validation du chef de pôle.', 'validated', '2025-11-21 09:00:00', '2025-11-21 12:00:00', '2025-11-21 12:00:00');

INSERT INTO `planning_sessions`
  (`id`, `formateur_id`, `module_id`, `groupe_id`, `salle_id`, `week_number`, `week_start_date`, `week_end_date`, `day_of_week`, `start_time`, `end_time`, `session_date`, `status`, `task_title`, `task_description`, `note_formateur`, `chef_response`, `change_request_note`, `confirmed_at`, `validated_at`, `validated_by`, `created_at`, `updated_at`)
VALUES
  (1, 1, 1, 1, 1, 11, '2025-11-24', '2025-11-30', 1, '08:30:00', '13:00:00', '2025-11-24', 'validated', 'Cours HTML/CSS', 'Séquence de mise en page responsive.', NULL, 'Validé', NULL, '2025-11-24 08:00:00', '2025-11-24 12:30:00', 2, '2025-11-23 17:00:00', '2025-11-24 12:30:00'),
  (2, 1, 2, 2, 1, 11, '2025-11-24', '2025-11-30', 2, '14:00:00', '16:30:00', '2025-11-25', 'pending_change', 'Atelier React', 'Travaux pratiques sur les composants.', 'Décalage demandé par le formateur.', NULL, 'En attente de réponse', NULL, NULL, NULL, '2025-11-23 17:10:00', '2025-11-25 09:00:00'),
  (3, 2, 3, 3, 2, 11, '2025-11-24', '2025-11-30', 3, '10:45:00', '13:00:00', '2025-11-26', 'scheduled', 'Workshop UX', 'Recherche utilisateur et tests de parcours.', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-23 17:20:00', '2025-11-23 17:20:00'),
  (4, 3, 4, 4, 2, 11, '2025-11-24', '2025-11-30', 4, '14:00:00', '19:00:00', '2025-11-27', 'scheduled', 'Introduction ML', 'Jeu de données et première régression.', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-23 17:30:00', '2025-11-23 17:30:00');

INSERT INTO `recent_activities`
  (`id`, `formateur_id`, `module_id`, `action_label`, `action_tone`, `action_description`, `created_at`)
VALUES
  (1, 1, 2, 'Soumission validée', 'success', 'Le planning hebdomadaire de Yassine Benali a été validé.', '2025-11-28 16:00:00'),
  (2, 2, 3, 'Demande traitée', 'info', 'La demande de changement de Salma Alaoui a été approuvée.', '2025-11-21 12:00:00'),
  (3, 3, 4, 'Révision demandée', 'warning', 'Le planning de Hamza Tazi nécessite une révision.', '2025-11-28 18:00:00');

INSERT INTO `formateur_modules`
  (`id`, `formateur_id`, `module_id`, `competence_level`, `created_at`)
VALUES
  (1, 1, 1, 5, '2025-09-20 10:30:00'),
  (2, 1, 2, 4, '2025-09-20 10:31:00'),
  (3, 2, 3, 5, '2025-09-20 10:32:00'),
  (4, 2, 5, 4, '2025-09-20 10:33:00'),
  (5, 3, 4, 5, '2025-09-20 10:34:00'),
  (6, 3, 2, 3, '2025-09-20 10:35:00');

INSERT INTO `formateur_module_scores`
  (`id`, `formateur_id`, `module_id`, `score`, `last_updated_at`)
VALUES
  (1, 1, 1, 88.50, '2025-10-10 09:15:00'),
  (2, 1, 2, 91.20, '2025-10-12 10:00:00'),
  (3, 2, 3, 86.40, '2025-10-11 14:30:00'),
  (4, 2, 5, 79.10, '2025-10-13 11:20:00'),
  (5, 3, 4, 83.75, '2025-10-14 16:00:00');

INSERT INTO `ai_scores`
  (`id`, `formateur_id`, `module_id`, `score`, `reason`, `created_at`)
VALUES
  (1, 1, 2, 91.50, '{"competence":5,"experience":2,"semester_fit":"S2","notes":["React avance","charge stable"]}', '2025-11-22 10:00:00'),
  (2, 2, 5, 83.00, '{"competence":4,"experience":1,"semester_fit":"S1","notes":["bonne pedagogie","module transversal"]}', '2025-11-22 10:05:00'),
  (3, 3, 4, 95.00, '{"competence":5,"experience":2,"semester_fit":"S2","notes":["specialite IA","historique positif"]}', '2025-11-22 10:10:00');

INSERT INTO `reports`
  (`id`, `type`, `format`, `title`, `file_path`, `generated_by`, `created_at`)
VALUES
  (1, 'workload', 'pdf', 'Charge des formateurs - novembre 2025', 'storage/reports/workload_demo_20251128.pdf', 2, '2025-11-28 16:30:00'),
  (2, 'module_progress', 'xlsx', 'Progression modules - semestre S1/S2', 'storage/reports/module_progress_demo_20251128.xlsx', 1, '2025-11-28 17:15:00');

INSERT INTO `evaluation_questionnaires` (`id`, `title`, `created_at`) VALUES
  (1, 'Évaluation pédagogique des formateurs', '2025-09-01 08:00:00');

INSERT INTO `evaluation_questions`
  (`id`, `questionnaire_id`, `question_text`, `type`, `weight`, `created_at`)
VALUES
  (1, 1, 'Le formateur maîtrise-t-il le contenu de ses modules ?', 'rating', 4.00, '2025-09-01 08:05:00'),
  (2, 1, 'Le formateur explique-t-il clairement les notions ?', 'rating', 3.00, '2025-09-01 08:06:00'),
  (3, 1, 'Le formateur interagit-il avec les stagiaires de façon constructive ?', 'rating', 2.00, '2025-09-01 08:07:00'),
  (4, 1, 'Le formateur respecte-t-il les horaires et le planning prévus ?', 'yes/no', 2.00, '2025-09-01 08:08:00'),
  (5, 1, 'Le formateur prépare-t-il des supports pédagogiques adaptés ?', 'yes/no', 2.00, '2025-09-01 08:09:00'),
  (6, 1, 'Commentaire complémentaire sur la prestation du formateur.', 'text', 0.00, '2025-09-01 08:10:00');

INSERT INTO `evaluation_answers`
  (`id`, `formateur_id`, `module_id`, `question_id`, `value`, `created_at`)
VALUES
  (1, 2, 3, 1, '4', '2025-10-05 09:00:00'),
  (2, 2, 3, 2, '4', '2025-10-05 09:00:10'),
  (3, 2, 3, 3, '5', '2025-10-05 09:00:20'),
  (4, 2, 3, 4, 'yes', '2025-10-05 09:00:30'),
  (5, 2, 3, 5, 'yes', '2025-10-05 09:00:40'),
  (6, 2, 3, 6, 'Animation fluide et supports clairs.', '2025-10-05 09:00:50'),
  (7, 3, 4, 1, '3', '2025-10-06 10:00:00'),
  (8, 3, 4, 2, '4', '2025-10-06 10:00:10'),
  (9, 3, 4, 3, '3', '2025-10-06 10:00:20'),
  (10, 3, 4, 4, 'yes', '2025-10-06 10:00:30'),
  (11, 3, 4, 5, 'no', '2025-10-06 10:00:40'),
  (12, 3, 4, 6, 'Bonne base technique, mais les ateliers peuvent être mieux rythmés.', '2025-10-06 10:00:50');

INSERT INTO `evaluation_scores`
  (`id`, `formateur_id`, `module_id`, `total_score`, `max_score`, `percentage`, `created_at`)
VALUES
  (1, 2, 3, 30.00, 38.00, 78.95, '2025-10-05 09:01:00'),
  (2, 3, 4, 23.00, 38.00, 60.53, '2025-10-06 10:01:00');

INSERT INTO `system_meta` (`meta_key`, `meta_value`, `updated_at`) VALUES
  ('app_bootstrap_version', '2026-03-25-hardening', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE `meta_value` = VALUES(`meta_value`);

SET FOREIGN_KEY_CHECKS = 1;
