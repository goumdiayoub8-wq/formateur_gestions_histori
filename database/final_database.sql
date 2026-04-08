CREATE DATABASE IF NOT EXISTS `gestion_formateurs`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `gestion_formateurs`;

SET GLOBAL event_scheduler = ON;
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
DROP TABLE IF EXISTS `formateur_module_preferences`;
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

DROP TABLE IF EXISTS `excel_import_batches`;
DROP TABLE IF EXISTS `module_delivery_snapshots`;
DROP TABLE IF EXISTS `efps`;
DROP TABLE IF EXISTS `planification_hebdo`;
DROP TABLE IF EXISTS `module_progress`;

CREATE TABLE `system_meta` (
  `meta_key` varchar(120) NOT NULL,
  `meta_value` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`meta_key`)
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
  `email` varchar(150) DEFAULT NULL,
  `telephone` varchar(40) DEFAULT NULL,
  `specialite` varchar(120) DEFAULT NULL,
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
  `code` varchar(80) NOT NULL DEFAULT '',
  `intitule` varchar(255) NOT NULL,
  `filiere` varchar(160) NOT NULL,
  `semestre` enum('S1','S2') NOT NULL,
  `volume_horaire` int NOT NULL,
  `has_efm` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_modules_identity` (`intitule`,`filiere`,`semestre`),
  KEY `idx_modules_code` (`code`),
  KEY `idx_modules_filiere_semestre` (`filiere`,`semestre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `groupes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(40) NOT NULL,
  `nom` varchar(160) DEFAULT NULL,
  `filiere` varchar(160) NOT NULL,
  `annee_scolaire` varchar(20) NOT NULL,
  `effectif` int DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_groupes_identity` (`code`,`filiere`,`annee_scolaire`),
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
  `total_questions` int NOT NULL DEFAULT 20,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_module_questionnaires_module` (`module_id`),
  UNIQUE KEY `uq_module_questionnaires_questionnaire` (`questionnaire_id`),
  UNIQUE KEY `uq_module_questionnaires_token` (`questionnaire_token`),
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
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
  KEY `idx_change_requests_context` (`formateur_id`,`module_id`,`request_week`,`status`),
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
  KEY `idx_recent_activities_label_formateur_created` (`action_label`,`formateur_id`,`created_at`),
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

CREATE TABLE `formateur_module_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `formateur_id` int NOT NULL,
  `module_id` int NOT NULL,
  `status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  `message_chef` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_formateur_module_preferences_pair` (`formateur_id`,`module_id`),
  KEY `idx_formateur_module_preferences_status` (`status`),
  KEY `idx_formateur_module_preferences_module` (`module_id`),
  CONSTRAINT `fk_formateur_module_preferences_formateur`
    FOREIGN KEY (`formateur_id`) REFERENCES `formateurs` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_formateur_module_preferences_module`
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
  KEY `idx_answers_formateur` (`formateur_id`),
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
  KEY `idx_scores_formateur` (`formateur_id`),
  KEY `idx_scores_module` (`module_id`),
  KEY `idx_scores_percentage` (`percentage`),
  CONSTRAINT `fk_evaluation_scores_formateur`
    FOREIGN KEY (`formateur_id`) REFERENCES `formateurs` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_evaluation_scores_module`
    FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

START TRANSACTION;

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

INSERT INTO `module_questionnaires`
  (`id`, `module_id`, `questionnaire_id`, `questionnaire_token`, `total_questions`, `created_at`, `updated_at`)
VALUES
  (1, 1, 'module-1', 'qtk-dev101-2025', 20, '2025-09-10 11:00:00', NULL),
  (2, 2, 'module-2', 'qtk-dev202-2025', 20, '2025-09-10 11:05:00', NULL),
  (3, 3, 'module-3', 'qtk-ds101-2025', 20, '2025-09-10 11:10:00', NULL),
  (4, 4, 'module-4', 'qtk-ia201-2025', 20, '2025-09-10 11:15:00', NULL),
  (5, 5, 'module-5', 'qtk-soft101-2025', 20, '2025-09-10 11:20:00', NULL);

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
  (`id`, `formateur_id`, `semaine`, `academic_year`, `submitted_hours`, `status`, `submitted_at`, `reviewed_at`, `processed_at`, `processed_by`, `decision_note`)
VALUES
  (1, 1, 11, 2026, 14.00, 'approved', '2025-11-28 14:00:00', '2025-11-28 16:00:00', '2025-11-28 16:00:00', 2, 'Charge validée.'),
  (2, 2, 11, 2026, 8.00, 'pending', '2025-11-28 14:30:00', NULL, NULL, NULL, NULL),
  (3, 3, 11, 2026, 6.00, 'rejected', '2025-11-28 15:00:00', '2025-11-28 18:00:00', '2025-11-28 18:00:00', 1, 'Merci de revoir la répartition hebdomadaire.');

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
  ('app_bootstrap_version', '2026-04-06-database-only-schema', CURRENT_TIMESTAMP),
  ('schema_mode', 'database-only', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
  `meta_value` = VALUES(`meta_value`),
  `updated_at` = VALUES(`updated_at`);







INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (100, 'MARIAM OULED BEN BRAHIM', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (101, 'ADIL ZAHRI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (102, 'SAKINA ELHOURRI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (103, 'JAOUAD EZZAGHOUB', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (104, 'MARIAM AMYN', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (105, 'MOHAMED ASSADE', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (106, 'NADIA BEKHOUCH', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (107, 'ZAINEB LAHMIDI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (108, 'SIHAM HOUMADY', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (109, 'ANASS BENHASSOU', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (110, 'OMAR OUAFIDI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (111, 'ABDELMOULA KAKA', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (112, 'HANANE ESSAHLI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (113, 'LAMIAE ELHAISSOUK', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (114, 'SARA AIT-IJJA', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (115, 'SAMI MAHFOUD', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (116, 'HAJAR GADDARINE', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (117, 'MOUHSSINE HOU', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (118, 'HOUDA LABAZI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (119, 'SAMIR CHBERREQ', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (120, 'FIRDAOUS OUYIDIR', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (121, 'BASMA LAFHAL', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (122, 'MOURAD BELHADJ', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (123, 'SABAH HALLOUTY', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (124, 'HANAE HAMZAOUI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (125, 'ASMAA ZORGUI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (126, 'ZAHRA SALOHI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (127, 'FATIMA-EZZAHRA SAADOUNI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (128, 'FATIMA ZAHRA BOUCHIKHI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (129, 'SABRINE OUAJIDI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (130, 'LAYLA CHEMLAL', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (131, 'HAMZA CHAHID', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (132, 'NOUREDDINE RIFFI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (133, 'SAFA LAARAJ', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (134, 'SAID AIT ELHAROUACH', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (135, 'CHAIMAE YETTIFTI GAROUCH', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (136, 'AOUZAL AYMAN', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (137, 'HANANE EL FADILI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (138, 'RIM TAJEDDINE', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (139, 'HALIMA EZAHIDI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (140, 'YOUSRA SAID', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (141, 'MOHAMMED ZAKI BELAHBIB', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (142, 'KAWTAR MESRAR', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (143, 'CHAIMAA RABTI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (144, 'SOUMIA RAOUF', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (145, 'YOUSSEF IGUELD', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (146, 'MOUNA DALLI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (147, 'MOHAMED SAAD LAABORI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (148, 'SALMA EL AATID', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (149, 'SOHAYB RIFI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (150, 'WAFAA ADOUI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (151, 'ISSAM ELOUALI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (152, 'KHALID MAGOUANI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (153, 'AYMANE EZZAIM', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (154, 'LARBI ZROUALI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (155, 'MOURAD FAZAZI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (156, 'ABDERRAHIM TANFOUSS', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (157, 'MERIEM MASROUR', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (158, 'SELMA AIT BELLA', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (159, 'SARA TALHA', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (160, 'HICHAM AIT EL HADJ', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (161, 'AMINE FILALI ANSARI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (162, 'OTHMANE ABALI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (163, 'RAJAE LAKHAL', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (164, 'MOHAMMED GOUMIH', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (165, 'KAOUTAR ELBENNANI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (166, 'ELMEHDI KORCHI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (167, 'ANASS LAZRAQ', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (168, 'IMANE ACHERRAT', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (169, 'SALAHEDDINE LAARAJ', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (170, 'RACHID EL BERKAOUI ALAOUI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (171, 'ZAKARIA BENZYANE', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (172, 'SALMA KAMILIA BENCHANAA', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (173, 'TARIK BAAMMAR', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (174, 'BEN CHERQUI M''HAMED', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (175, 'BENAMMOU ABDESSAMAD', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (176, 'EL BAKKALI Mohamed', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (177, 'SABER HAMZA', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (178, 'KELLA OMAR', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (179, 'SAOUD SAAD', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (180, 'MILOUDI OUALID', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (181, 'EL MOUDEN ABDELAZIZ', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (182, 'IKRAM AZIZI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (183, 'KAOUTAR MAKHLOUFI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (184, 'SAMIRA CHEBLI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (185, 'MOHAMMED ENNAMRI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (186, 'BRAHIM MILI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (187, 'YOUSSEF ABOUTARA BELRHITI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (188, 'KARIMA BOUDI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (189, 'ABDESSAMAD KAMLI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (190, 'AYOUB ABDELMOUTTALIB', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (191, 'ABDELMAJID EL HENNIOUI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (192, 'KAMAL DAIF', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (193, 'ABDELHAKIM EL KABBAY', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (194, 'HANANE SALLAH', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (195, 'IMANE BEN OMAR', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (196, 'OUSSAMA LAKMALE', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (197, 'AMINA EL OUMARY', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (198, 'ZINEB BENHOUMAID', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (199, 'FATIMA ZOHRA HRIBANE', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (200, 'NOURA BELAJI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (201, 'YASSINE HIKMI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (202, 'ZAKARIA DKHISSI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (203, 'WAFAA EL QUACHANI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (204, 'ALI ELJIKOUNI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (205, 'FOUAD EL YEBADRI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (206, 'HAJAR ZEJLI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (207, 'YOUNES ELKAMARI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (208, 'NAHID MOUSTAKIM', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (209, 'MOHAMED AIT LAHOUCINE', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (210, 'TOURIA SALHI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (211, 'RACHID THABIT', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (212, 'JAMILA ABOUDRAR', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (213, 'MOHAMED AMINE OUAISSI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (214, 'ZINEB GUENNOUNI HASSANI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (215, 'MERYEM BAJOUDI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (216, 'WASSIM LECHGUER', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (217, 'YASSINE MAGHFOUL', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (218, 'YASSINE MOUHETTA', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (219, 'ZAINEB TROKY', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (220, 'MOHAMMED EL MEHDI RIDA', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (221, 'SOUKAINA GOUNINE', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (222, 'MEHDI BOUKIL', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (223, 'MOHAMED LAHLOU', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (224, 'KAWTAR CHENNADI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (225, 'HAMZA RHNIA', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (226, 'HAMZA IFKIRANE', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (227, 'AMINE OUARROUCH', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (228, 'SOUKAINA BOUBRAHMI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (229, 'ZINEB ES-SAMI', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (230, 'OUAJIDI SABRINE', 'Général', 910, 0);
INSERT IGNORE INTO formateurs (id, nom, specialite, max_heures, current_hours) VALUES (231, 'MOHAMED AMINE BOUDNIB', 'Général', 910, 0);

INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (100, 'EGTS102', 'Français', 'AIG_INFPP_TS', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (101, 'EGTS103', 'Anglais technique', 'AIG_INFPP_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (102, 'EGTS105', 'Compétences comportementales', 'AIG_INFPP_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (103, 'EGTS108', 'Entrepreneuriat-PIE 1', 'AIG_INFPP_TS', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (104, 'EGTSA106', 'Culture et techniques avancées du numérique', 'AIG_INFPP_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (105, 'M101', 'Métier et formation', 'AIG_INFPP_TS', 'S1', 27.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (106, 'M102', 'La chaîne graphique', 'AIG_INFPP_TS', 'S1', 82.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (107, 'M103', 'Hygiène, santé, sécurité et protection de l''environnement', 'AIG_INFPP_TS', 'S1', 27.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (108, 'M104', 'Les règles typographiques', 'AIG_INFPP_TS', 'S1', 55, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (109, 'M105', 'Les supports d’impression et d’emballage', 'AIG_INFPP_TS', 'S1', 42.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (110, 'M106', 'Les profils colorimétriques', 'AIG_INFPP_TS', 'S2', 82.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (111, 'M107', 'Les normes de qualité', 'AIG_INFPP_TS', 'S2', 42.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (112, 'M108', 'Oraganisation du travail', 'AIG_INFPP_TS', 'S2', 42.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (113, 'M109', 'Logiciel de dessin', 'AIG_INFPP_TS', 'S2', 55, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (114, 'M110', 'Logiciel de traitement d’image', 'AIG_INFPP_TS', 'S2', 82.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (115, 'EGTS102', 'Français', 'AIG_PG_TS', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (116, 'EGTS103', 'Anglais technique', 'AIG_PG_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (117, 'EGTS105', 'Compétences comportementales', 'AIG_PG_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (118, 'EGTS108', 'Entrepreneuriat-PIE 1', 'AIG_PG_TS', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (119, 'EGTSI106', 'Culture et techniques intermédiaires du numérique', 'AIG_PG_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (120, 'M101', 'Métier et formation', 'AIG_PG_TS', 'S1', 27.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (121, 'M102', 'La chaîne graphique', 'AIG_PG_TS', 'S1', 82.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (122, 'M103', 'Hygiène, santé, sécurité et protection de l''environnement', 'AIG_PG_TS', 'S1', 42.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (123, 'M104', 'Les règles typographiques', 'AIG_PG_TS', 'S1', 55, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (124, 'M105', 'Les logiciels PAO', 'AIG_PG_TS', 'S2', 82.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (125, 'M106', 'Les supports d’impression et d’emballage', 'AIG_PG_TS', 'S2', 42.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (126, 'M107', 'Les notions physico-chimiques en production graphique', 'AIG_PG_TS', 'S2', 55, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (127, 'M108', 'Les profils colorimétriques', 'AIG_PG_TS', 'S2', 82.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (128, 'M109', 'Les normes de qualité', 'AIG_PG_TS', 'S2', 42.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (129, 'M110', 'Organisation du travail', 'AIG_PG_TS', 'S2', 42.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (130, 'EGT102', 'Français', 'AGRI_OA_Q', 'S2', 95, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (131, 'EGT103', 'Anglais technique', 'AGRI_OA_Q', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (132, 'EGT105', 'Compétences comportementales', 'AGRI_OA_Q', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (133, 'EGT108', 'Entrepreneuriat-PIE 1', 'AGRI_OA_Q', 'S1', 20, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (134, 'EGTA106', 'Culture et techniques avancées du numérique', 'AGRI_OA_Q', 'S2', 27.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (135, 'M102', 'Introduction au droit', 'AGRI_OA_Q', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (136, 'M103', 'Entreprise et son environnement', 'AGRI_OA_Q', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (137, 'M104', 'Comptabilité Générale : concepts de base et opérations courantes', 'AGRI_OA_Q', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (138, 'M105', 'Techniques d’accueil', 'AGRI_OA_Q', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (139, 'M106', 'Gestion documentaire', 'AGRI_OA_Q', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (140, 'M107', 'Techniques Quantitative de Gestion', 'AGRI_OA_Q', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (141, 'M108', 'Marketing fondamental', 'AGRI_OA_Q', 'S1', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (142, 'M109', 'Ecrits professionnels', 'AGRI_OA_Q', 'S2', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (143, 'M110', 'Logiciel comptable et commercial', 'AGRI_OA_Q', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (144, 'EGT102', 'Français', 'AGRI_AP_TS', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (145, 'EGT103', 'Anglais technique', 'AGRI_AP_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (146, 'EGT105', 'Compétences comportementales', 'AGRI_AP_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (147, 'EGT108', 'Entrepreneuriat-PIE 1', 'AGRI_AP_TS', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (148, 'M101', 'Métiers et formation dans le secteur GC', 'AGRI_AP_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (149, 'M102', 'Introduction au droit', 'AGRI_AP_TS', 'S1', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (150, 'M103', 'Entreprise et son environnement', 'AGRI_AP_TS', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (151, 'M104', 'Comptabilité Générale : concepts de base et opérations courantes', 'AGRI_AP_TS', 'S1', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (152, 'M105', 'Techniques d’accueil', 'AGRI_AP_TS', 'S1', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (153, 'M106', 'Gestion documentaire', 'AGRI_AP_TS', 'S1', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (154, 'M107', 'Techniques Quantitative de Gestion', 'AGRI_AP_TS', 'S2', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (155, 'M108', 'Marketing fondamental', 'AGRI_AP_TS', 'S2', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (156, 'EGT101', 'Arabe', 'AGRI_MA_TS', 'S1', 20, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (157, 'EGT103', 'Anglais technique', 'AGRI_MA_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (158, 'EGT108', 'Entrepreneuriat-PIE 1', 'AGRI_MA_TS', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (159, 'EGTA106', 'Culture et techniques avancées du numérique', 'AGRI_MA_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (160, 'M101', 'Métiers et formation dans le secteur GC', 'AGRI_MA_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (161, 'M102', 'Introduction au droit', 'AGRI_MA_TS', 'S1', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (162, 'M103', 'Entreprise et son environnement', 'AGRI_MA_TS', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (163, 'M104', 'Comptabilité Générale : concepts de base et opérations courantes', 'AGRI_MA_TS', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (164, 'M105', 'Techniques d’accueil', 'AGRI_MA_TS', 'S1', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (165, 'M106', 'Gestion documentaire', 'AGRI_MA_TS', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (166, 'M107', 'Techniques Quantitative de Gestion', 'AGRI_MA_TS', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (167, 'M110', 'Logiciel comptable et commercial', 'AGRI_MA_TS', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (168, 'EGT102', 'Français', 'AGRI_MA_TS', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (169, 'EGT105', 'Compétences comportementales', 'AGRI_MA_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (170, 'M109', 'Ecrits professionnels', 'AGRI_MA_TS', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (171, 'EGTS101', 'Arabe', 'AGRI_TA_TS', 'S1', 20, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (172, 'EGTS102', 'Français', 'AGRI_TA_TS', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (173, 'EGTS103', 'Anglais technique', 'AGRI_TA_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (174, 'EGTS105', 'Compétences comportementales', 'AGRI_TA_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (175, 'EGTSA106', 'Culture et techniques avancées du numérique', 'AGRI_TA_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (176, 'M101', 'Métier et formation', 'AGRI_TA_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (177, 'M102', 'Droit fondamental', 'AGRI_TA_TS', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (178, 'M103', 'Management des organisations', 'AGRI_TA_TS', 'S1', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (179, 'M105', 'Gestion électronique des données', 'AGRI_TA_TS', 'S1', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (180, 'M107', 'Comptabilité générale 2', 'AGRI_TA_TS', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (181, 'M108', 'Ecrits professionnels', 'AGRI_TA_TS', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (182, 'EGTS108', 'Entrepreneuriat-PIE 1', 'AGRI_TA_TS', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (183, 'M104', 'Comptabilité générale 1', 'AGRI_TA_TS', 'S1', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (184, 'M110', 'Logiciel de Gestion Commerciale, Comptable', 'AGRI_TA_TS', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (185, 'M109', 'Statistique', 'AGRI_TA_TS', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (186, 'EGTS101', 'Arabe', 'AGRO_TA_TS', 'S1', 20, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (187, 'EGTS102', 'Français', 'AGRO_TA_TS', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (188, 'EGTS108', 'Entrepreneuriat-PIE 1', 'AGRO_TA_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (189, 'EGTSA106', 'Culture et techniques avancées du numérique', 'AGRO_TA_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (190, 'M101', 'Métier et formation', 'AGRO_TA_TS', 'S1', 15, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (191, 'M103', 'Management des organisations', 'AGRO_TA_TS', 'S1', 140, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (192, 'M104', 'Comptabilité générale 1', 'AGRO_TA_TS', 'S2', 50, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (193, 'M106', 'Marketing', 'AGRO_TA_TS', 'S2', 140, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (194, 'M109', 'Statistique', 'AGRO_TA_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (195, 'M110', 'Logiciel de Gestion Commerciale, Comptable', 'AGRO_TA_TS', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (196, 'EGTS103', 'Anglais technique', 'AGRO_TA_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (197, 'EGTS105', 'Compétences comportementales', 'AGRO_TA_TS', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (198, 'M107', 'Comptabilité générale 2', 'AGRO_TA_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (199, 'M108', 'Ecrits professionnels', 'AGRO_TA_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (200, 'EGT102', 'Français', 'GC_AA_T', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (201, 'EGT103', 'Anglais technique', 'GC_AA_T', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (202, 'EGT105', 'Compétences comportementales', 'GC_AA_T', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (203, 'EGT108', 'Entrepreneuriat-PIE 1', 'GC_AA_T', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (204, 'EGTA106', 'Culture et techniques avancées du numérique', 'GC_AA_T', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (205, 'M101', 'Métiers et formation dans le secteur GC', 'GC_AA_T', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (206, 'M102', 'Introduction au droit', 'GC_AA_T', 'S1', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (207, 'M103', 'Entreprise et son environnement', 'GC_AA_T', 'S1', 70, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (208, 'M104', 'Comptabilité Générale : concepts de base et opérations courantes', 'GC_AA_T', 'S1', 130, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (209, 'M105', 'Techniques d’accueil', 'GC_AA_T', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (210, 'M106', 'Gestion documentaire', 'GC_AA_T', 'S2', 50, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (211, 'M107', 'Techniques Quantitative de Gestion', 'GC_AA_T', 'S2', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (212, 'M108', 'Marketing fondamental', 'GC_AA_T', 'S2', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (213, 'M109', 'Ecrits professionnels', 'GC_AA_T', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (214, 'M110', 'Logiciel comptable et commercial', 'GC_AA_T', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (215, 'EGTS102', 'Français', 'GC_GE_TS', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (216, 'EGTS103', 'Anglais technique', 'GC_GE_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (217, 'EGTS105', 'Compétences comportementales', 'GC_GE_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (218, 'EGTS108', 'Entrepreneuriat-PIE 1', 'GC_GE_TS', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (219, 'EGTSA106', 'Culture et techniques avancées du numérique', 'GC_GE_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (220, 'M101', 'Métier et formation', 'GC_GE_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (221, 'M102', 'Droit fondamental', 'GC_GE_TS', 'S1', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (222, 'M103', 'Management des organisations', 'GC_GE_TS', 'S1', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (223, 'M104', 'Comptabilité générale 1', 'GC_GE_TS', 'S1', 135, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (224, 'M105', 'Gestion électronique des données', 'GC_GE_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (225, 'M106', 'Marketing', 'GC_GE_TS', 'S2', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (226, 'M107', 'Comptabilité générale 2', 'GC_GE_TS', 'S2', 70, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (227, 'M108', 'Ecrits professionnels', 'GC_GE_TS', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (228, 'M109', 'Statistique', 'GC_GE_TS', 'S2', 80, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (229, 'M110', 'Logiciel de Gestion Commerciale, Comptable', 'GC_GE_TS', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (230, 'EGTS102', 'Français', 'DIA_DEV_TS', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (231, 'EGTS103', 'Anglais technique', 'DIA_DEV_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (232, 'EGTS105', 'Compétences comportementales', 'DIA_DEV_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (233, 'EGTS108', 'Entrepreneuriat-PIE 1', 'DIA_DEV_TS', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (234, 'EGTSA106', 'Culture et techniques avancées du numérique', 'DIA_DEV_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (235, 'M101', 'Métier et formation en développement digital', 'DIA_DEV_TS', 'S1', 15, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (236, 'M105', 'Programmation JavaScript', 'DIA_DEV_TS', 'S2', 110, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (237, 'M106', 'Manipulation des bases de données', 'DIA_DEV_TS', 'S2', 100, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (238, 'M107', 'Sites Web dynamiques', 'DIA_DEV_TS', 'S2', 120, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (239, 'M108', 'Sécurité des systèmes d''information', 'DIA_DEV_TS', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (240, 'M102', 'Les bases de l''algorithmique', 'DIA_DEV_TS', 'S1', 120, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (241, 'M104', 'Sites Web statiques', 'DIA_DEV_TS', 'S1', 110, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (242, 'M103', 'Programmation Orienté Objet', 'DIA_DEV_TS', 'S1', 120, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (243, 'M107', 'Sécurité des systèmes d''information', 'DIA_ID_TS', 'S2', 67.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (244, 'M108', 'Processus et outils de veille technologique', 'DIA_ID_TS', 'S2', 42.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (245, 'M203', 'Conception des tableaux de bord avec  les outils de visualisation', 'DIA_IAOADA_TS', 'S1', 110, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (246, 'EGTSA206', 'Culture et techniques avancées du numérique', 'DIA_IAOADA_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (247, 'M201', 'Bases de données décisionnelles', 'DIA_IAOADA_TS', 'S1', 95, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (248, 'M202', 'Techniques d’analyse de données', 'DIA_IAOADA_TS', 'S1', 80, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (249, 'M204', 'Définition des besoins du client', 'DIA_IAOADA_TS', 'S2', 50, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (250, 'M206', 'Enjeux de sécurité et de la veille technologique', 'DIA_IAOADA_TS', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (251, 'M205', 'Implémentation d''une solution BI', 'DIA_IAOADA_TS', 'S2', 80, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (252, 'M201', 'Bases de données NoSQL', 'DIA_IAOBD_TS', 'S1', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (253, 'M202', 'Découverte du domaine du cloud computing', 'DIA_IAOBD_TS', 'S1', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (254, 'EGTSA206', 'Culture et techniques avancées du numérique', 'DIA_IAOBD_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (255, 'M203', 'Gestion du Framework Hadoop', 'DIA_IAOBD_TS', 'S1', 105, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (256, 'M205', 'Sécurité dans le domaine Big Data', 'DIA_IAOBD_TS', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (257, 'M206', 'Initiation aux outils de visualisation de données', 'DIA_IAOBD_TS', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (258, 'M207', 'Automatisation des tâches de déploiement', 'DIA_IAOBD_TS', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (259, 'EGTSA206', 'Culture et techniques avancées du numérique', 'DIA_IAODC_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (260, 'M201', 'Appréhension des Bots', 'DIA_IAODC_TS', 'S1', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (261, 'M202', 'Moteurs NLP', 'DIA_IAODC_TS', 'S1', 120, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (262, 'M203', 'Bases du Front End', 'DIA_IAODC_TS', 'S1', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (263, 'M204', 'Développement back-end du bot', 'DIA_IAODC_TS', 'S1', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (264, 'M205', 'Développement d''un chatbot avec React', 'DIA_IAODC_TS', 'S2', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (265, 'M206', 'Déploiement d''un Bot', 'DIA_IAODC_TS', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (266, 'EGQ102', 'Français', 'GE_OQE_Q', 'S2', 95, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (267, 'EGQ103', 'Anglais  (notions de base)', 'GE_OQE_Q', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (268, 'EGQ105', 'Compétences comportementales', 'GE_OQE_Q', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (269, 'EGQ107', 'Sport', 'GE_OQE_Q', 'S1', 20, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (270, 'EGQ108', 'Entrepreneuriat-PIE 1', 'GE_OQE_Q', 'S2', 27.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (271, 'EGQB106', 'Culture et techniques de base du numérique', 'GE_OQE_Q', 'S2', 25, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (272, 'M101', 'Se situer au regard du métier et de la démarche de formation', 'GE_OQE_Q', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (273, 'M102', 'Appliquer les règles de l''hygiène, de sécurité au travail et de protection de l’environnement', 'GE_OQE_Q', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (274, 'M103', 'Vérifier des circuits électriques à c.c. et c.a.', 'GE_OQE_Q', 'S1', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (275, 'M104', 'Représenter des pièces et des ensembles simples en dessin industriel', 'GE_OQE_Q', 'S1', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (276, 'M105', 'Utiliser les outils de l’électricien et le matériel de manutention pour installer des câbles électriques et des canalisations', 'GE_OQE_Q', 'S2', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (277, 'M106', 'Effectuer des opérations d’usinage manuel', 'GE_OQE_Q', 'S2', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (278, 'M107', 'Vérifier le fonctionnement des circuits électroniques de base', 'GE_OQE_Q', 'S2', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (279, 'M108', 'Se familiariser avec les notions d''efficacité énergétique et les notions de base sur la qualité', 'GE_OQE_Q', 'S2', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (280, 'EGQ102', 'Français', 'GM_OFM_Q', 'S2', 95, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (281, 'EGQ103', 'Anglais  (notions de base)', 'GM_OFM_Q', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (282, 'EGQ105', 'Compétences comportementales', 'GM_OFM_Q', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (283, 'EGQ107', 'Sport', 'GM_OFM_Q', 'S1', 20, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (284, 'EGQ108', 'Entrepreneuriat-PIE 1', 'GM_OFM_Q', 'S2', 27.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (285, 'EGQB106', 'Culture et techniques de base du numérique', 'GM_OFM_Q', 'S2', 25, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (286, 'M101', 'Métier et Formation', 'GM_OFM_Q', 'S1', 15, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (287, 'M102', 'Lecture et interprétation de plans', 'GM_OFM_Q', 'S2', 100, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (288, 'M103', 'Matériaux et Procédés de fabrication Mécanique', 'GM_OFM_Q', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (289, 'M104', 'Calculs liés à l''usinage', 'GM_OFM_Q', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (290, 'M105', 'Hygiène, Sécurité et Environnement', 'GM_OFM_Q', 'S1', 25, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (291, 'M106', 'Métrologie Conventionnelle', 'GM_OFM_Q', 'S2', 50, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (292, 'M107', 'Travaux d''Ajustage-Perçage', 'GM_OFM_Q', 'S2', 80, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (293, 'M108', 'Modes opératoires d''usinage des pièces unitaires', 'GM_OFM_Q', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (294, 'M109', 'Usinage et réglages simples sur tour conventionnel', 'GM_OFM_Q', 'S2', 140, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (295, 'M110', 'Usinage et réglages simples sur fraiseuse conventionnelle', 'GM_OFM_Q', 'S2', 140, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (296, 'EGT102', 'Français', 'FGT_GT_T', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (297, 'EGT103', 'Anglais technique', 'FGT_GT_T', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (298, 'EGT105', 'Compétences comportementales', 'FGT_GT_T', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (299, 'EGT108', 'Entrepreneuriat-PIE 1', 'FGT_GT_T', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (300, 'EGTI106', 'Culture et techniques intermédiaires du numérique', 'FGT_GT_T', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (301, 'M101', 'Métier et formation', 'FGT_GT_T', 'S1', 15, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (302, 'M102', 'Froid, Génie thermique et Stratégie Enérgétique nationale', 'FGT_GT_T', 'S1', 12.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (303, 'M103', 'Electricité & Electronique Appliquées à l''énergétique', 'FGT_GT_T', 'S1', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (304, 'M104', 'Thermodynamique Appliquée', 'FGT_GT_T', 'S1', 32.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (305, 'M105', 'Thermique Générale & Thermique des Echangeurs', 'FGT_GT_T', 'S1', 27.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (306, 'M106', 'Aéraulique et Hydraulique : Théorie et technologie', 'FGT_GT_T', 'S1', 50, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (307, 'M107', 'Moteurs électriques dans les équipements énergétiques', 'FGT_GT_T', 'S1', 52.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (308, 'M108', 'Traitement d''air', 'FGT_GT_T', 'S2', 27.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (309, 'M109', 'Acoustique appliquée', 'FGT_GT_T', 'S2', 12.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (310, 'M110', 'Traitement des eaux', 'FGT_GT_T', 'S2', 25, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (311, 'M111', 'Cycle frigorifique : Théorie & Analyse', 'FGT_GT_T', 'S2', 55, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (312, 'M112', 'Dessin Technique et Architectural', 'FGT_GT_T', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (313, 'M113', 'Confection des réseaux fluides', 'FGT_GT_T', 'S2', 85, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (314, 'M114', 'Métrologie appliquée à l''Energétique', 'FGT_GT_T', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (315, 'EGT102', 'Français', 'GE_EI_T', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (316, 'EGT103', 'Anglais technique', 'GE_EI_T', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (317, 'EGT105', 'Compétences comportementales', 'GE_EI_T', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (318, 'EGTI106', 'Culture et techniques intermédiaires du numérique', 'GE_EI_T', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (319, 'M101', 'Métier et formation', 'GE_EI_T', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (320, 'M102', 'Le secteur électrique dans tous ses états et perspectives d''évolution', 'GE_EI_T', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (321, 'M103', 'Hygiène, Sécurité et Environnement', 'GE_EI_T', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (322, 'M104', 'Réalisation des croquis et des schémas', 'GE_EI_T', 'S1', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (323, 'M105', 'Analyse des circuits à courant continu et courant alternatif', 'GE_EI_T', 'S1', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (324, 'M106', 'Travaux d’usinage manuel', 'GE_EI_T', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (325, 'M107', 'Installation et le raccordement de tableaux de distribution basse tension et des circuits de dérivation', 'GE_EI_T', 'S2', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (326, 'M108', 'Entretien des dispositifs de transmission de mouvement', 'GE_EI_T', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (327, 'M109', 'Installation et raccordement des transformateurs, des machines rotatives et leurs circuits de commande', 'GE_EI_T', 'S2', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (328, 'M110', 'Assemblage des composants d’une armoire électrique industrielle', 'GE_EI_T', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (329, 'M111', 'Analyse des circuits électronique analogique', 'GE_EI_T', 'S2', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (330, 'M112', 'Montage des circuits pneumatiques et électropneumatiques', 'GE_EI_T', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (331, 'EGT102', 'Français', 'GM_PM_T', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (332, 'EGT103', 'Anglais technique', 'GM_PM_T', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (333, 'EGT105', 'Compétences comportementales', 'GM_PM_T', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (334, 'EGTI106', 'Culture et techniques intermédiaires du numérique', 'GM_PM_T', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (335, 'M101', 'Métier et formation', 'GM_PM_T', 'S1', 15, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (336, 'M102', 'Interprétation de plans', 'GM_PM_T', 'S2', 85, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (337, 'M103', 'Technologie professionnelle', 'GM_PM_T', 'S2', 85, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (338, 'M104', 'Mécanique appliquée', 'GM_PM_T', 'S2', 35, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (339, 'M105', 'Hygiène, Sécurité, Environnement et Manutention', 'GM_PM_T', 'S1', 15, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (340, 'M106', 'Travaux de fabrication mécanique conventionnelle', 'GM_PM_T', 'S2', 184, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (341, 'M107', 'Travaux de construction métallique', 'GM_PM_T', 'S2', 216, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (342, 'M108', 'Métrologie dimensionnelle et géométrique', 'GM_PM_T', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (343, 'M109', 'Qualité, Organisation, et maintenance du premier niveau', 'GM_PM_T', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (344, 'EGT102', 'Français', 'MA_EEM_T', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (345, 'EGT103', 'Anglais technique', 'MA_EEM_T', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (346, 'EGT105', 'Compétences comportementales', 'MA_EEM_T', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (347, 'EGT108', 'Entrepreneuriat-PIE 1', 'MA_EEM_T', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (348, 'EGTI106', 'Culture et techniques intermédiaires du numérique', 'MA_EEM_T', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (349, 'M101', 'Métier et formation dans le secteur automobile', 'MA_EEM_T', 'S1', 25, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (350, 'M102', 'Santé et sécurité au travail en REM', 'MA_EEM_T', 'S1', 25, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (351, 'M103', 'TRAVAUX D’ATELIER', 'MA_EEM_T', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (352, 'M104', 'Application des bases d’ajustage et soudage', 'MA_EEM_T', 'S1', 50, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (353, 'M105', 'Exploitation de la Documentation Technique', 'MA_EEM_T', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (354, 'M106', 'MOTEUR A COMBUSTION INTERNE', 'MA_EEM_T', 'S2', 130, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (355, 'M107', 'Electricité des engins à moteur', 'MA_EEM_T', 'S2', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (356, 'M108', 'Electronique des engins à moteur', 'MA_EEM_T', 'S2', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (357, 'M109', 'Méthodes et outils de diagnostic', 'MA_EEM_T', 'S2', 55, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (358, 'M110', 'Entretien et réparation du circuit de climatisation', 'MA_EEM_T', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (359, 'EGTS102', 'Français', 'EV_QHSE_TS', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (360, 'EGTS103', 'Anglais technique', 'EV_QHSE_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (361, 'EGTS105', 'Compétences comportementales', 'EV_QHSE_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (362, 'EGTS108', 'Entrepreneuriat-PIE 1', 'EV_QHSE_TS', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (363, 'EGTSI106', 'Culture et techniques intermédiaires du numérique', 'EV_QHSE_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (364, 'M101', 'Métier et  démarche de formation', 'EV_QHSE_TS', 'S1', 15, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (365, 'M102', 'Importance de la QHSE et de son évolution', 'EV_QHSE_TS', 'S1', 15, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (366, 'M103', 'Principes de base de la démarche QHSE', 'EV_QHSE_TS', 'S1', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (367, 'M104', 'Documents techniques et réglementaires', 'EV_QHSE_TS', 'S1', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (368, 'M105', 'Plan de prévention des risques en matière QHSE', 'EV_QHSE_TS', 'S2', 120, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (369, 'M106', 'Management de la qualité', 'EV_QHSE_TS', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (370, 'M107', 'Méthodes et les outils de management de la qualité', 'EV_QHSE_TS', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (371, 'M108', 'Management de la santé et de la sécurité au travail', 'EV_QHSE_TS', 'S2', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (372, 'EGTS102', 'Français', 'FGT_GE_TS', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (373, 'EGTS103', 'Anglais technique', 'FGT_GE_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (374, 'EGTS105', 'Compétences comportementales', 'FGT_GE_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (375, 'EGTS108', 'Entrepreneuriat-PIE 1', 'FGT_GE_TS', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (376, 'EGTSI106', 'Culture et techniques intermédiaires du numérique', 'FGT_GE_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (377, 'M101', 'Métier et formation', 'FGT_GE_TS', 'S1', 15, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (378, 'M102', 'Froid, Génie thermique et Stratégie Enérgétique nationale', 'FGT_GE_TS', 'S1', 8.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (379, 'M103', 'Electricité & Electronique Appliquées à l''énergétique', 'FGT_GE_TS', 'S1', 80, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (380, 'M104', 'Thermodynamique Appliquée', 'FGT_GE_TS', 'S1', 35, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (381, 'M105', 'Thermique Générale & Thermique des Echangeurs', 'FGT_GE_TS', 'S1', 35, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (382, 'M106', 'Aéraulique et Hydraulique : Théorie et technologie', 'FGT_GE_TS', 'S1', 70, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (383, 'M107', 'Moteurs électriques dans les équipements énergétiques', 'FGT_GE_TS', 'S1', 55, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (384, 'M108', 'Traitement d''air', 'FGT_GE_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (385, 'M109', 'Acoustique appliquée', 'FGT_GE_TS', 'S2', 25, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (386, 'M110', 'Traitement des eaux', 'FGT_GE_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (387, 'M111', 'Cycle frigorifique : Théorie & Analyse', 'FGT_GE_TS', 'S2', 50, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (388, 'M112', 'Dessin Technique et Architectural', 'FGT_GE_TS', 'S2', 70, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (389, 'M113', 'Confection des réseaux fluides', 'FGT_GE_TS', 'S2', 50, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (390, 'M114', 'Métrologie appliquée à l''Energétique', 'FGT_GE_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (391, 'EGTS102', 'Français', 'GE_GE_TS', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (392, 'EGTS103', 'Anglais technique', 'GE_GE_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (393, 'EGTS105', 'Compétences comportementales', 'GE_GE_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (394, 'EGTS108', 'Entrepreneuriat-PIE 1', 'GE_GE_TS', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (395, 'EGTSI106', 'Culture et techniques intermédiaires du numérique', 'GE_GE_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (396, 'M101', 'Métier et formation', 'GE_GE_TS', 'S1', 15, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (397, 'M102', 'Hygiène, Sécurité et Environnement', 'GE_GE_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (398, 'M103', 'Analyse des circuits à courant continu et courant alternatif', 'GE_GE_TS', 'S1', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (399, 'M105', 'Analyse du fonctionnement des moteurs électriques à CC et à CA', 'GE_GE_TS', 'S1', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (400, 'M106', 'Installation des circuits de puissance et de commande des tableaux électriques', 'GE_GE_TS', 'S1', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (401, 'M107', 'Analyse des circuits pneumatiques', 'GE_GE_TS', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (402, 'M108', 'Le secteur électrique dans tous ses états et perspectives  d''évolution', 'GE_GE_TS', 'S2', 15, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (403, 'M109', 'Analyse des circuits électronique analogique', 'GE_GE_TS', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (404, 'M110', 'Application des outils de CAO dans les domaines électriques, électroniques, pneumatiques', 'GE_GE_TS', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (405, 'M111', 'Logique combinatoire et séquentielle', 'GE_GE_TS', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (406, 'M112', 'Installation et dépannage des systèmes industriels à base d''automates programmables', 'GE_GE_TS', 'S2', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (407, 'M113', 'Dépannage des circuits d’électronique de puissance', 'GE_GE_TS', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (408, 'M114', 'Installation et dépannage des systèmes d’instrumentation et de régulation industrielle', 'GE_GE_TS', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (409, 'M104', 'Techniques de production, de transport et de distribution de l''énergie électrique', 'GE_GE_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (410, 'EGTS102', 'Français', 'GM_GM_TS', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (411, 'EGTS103', 'Anglais technique', 'GM_GM_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (412, 'EGTS105', 'Compétences comportementales', 'GM_GM_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (413, 'EGTS108', 'Entrepreneuriat-PIE 1', 'GM_GM_TS', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (414, 'EGTSI106', 'Culture et techniques intermédiaires du numérique', 'GM_GM_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (415, 'M101', 'Métier et Formation', 'GM_GM_TS', 'S1', 15, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (416, 'M102', 'Interprétation de plans', 'GM_GM_TS', 'S1', 140, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (417, 'M103', 'Matériaux & traitements thermiques', 'GM_GM_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (418, 'M104', 'Hygiène, Sécurité et Environnement', 'GM_GM_TS', 'S1', 15, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (419, 'M105', 'Fabrication Mécanique', 'GM_GM_TS', 'S2', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (420, 'M106', 'Construction Métallique', 'GM_GM_TS', 'S2', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (421, 'M107', 'Conception Assistée par Ordinateur', 'GM_GM_TS', 'S2', 85, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (422, 'M108', 'Mécanique appliqué et Résistance des Matériaux', 'GM_GM_TS', 'S2', 70, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (423, 'M110', 'Technologie de soudage', 'GM_GM_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (424, 'M111', 'Processus de Fabrication', 'GM_GM_TS', 'S2', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (425, 'EGTS102', 'Français', 'GM_PQA_TS', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (426, 'EGTS103', 'Anglais technique', 'GM_PQA_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (427, 'EGTS105', 'Compétences comportementales', 'GM_PQA_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (428, 'EGTS108', 'Entrepreneuriat-PIE 1', 'GM_PQA_TS', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (429, 'EGTSI106', 'Culture et techniques intermédiaires du numérique', 'GM_PQA_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (430, 'M101', 'Métier et formation', 'GM_PQA_TS', 'S1', 15, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (431, 'M102', 'Dessin industriel', 'GM_PQA_TS', 'S1', 78, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (432, 'M103', 'Matériaux et traitements', 'GM_PQA_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (433, 'M104', 'Résistance des matériaux', 'GM_PQA_TS', 'S1', 34, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (434, 'M105', 'Procédés d''obtention des pièces', 'GM_PQA_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (435, 'M106', 'Procédés de transformations des tôles', 'GM_PQA_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (436, 'M107', 'Construction Mécanique', 'GM_PQA_TS', 'S2', 68, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (437, 'M108', 'Fabrication mécanique', 'GM_PQA_TS', 'S2', 70, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (438, 'M109', 'Métrologie conventionnelle', 'GM_PQA_TS', 'S2', 50, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (439, 'M111', 'Technologie Automobile', 'GM_PQA_TS', 'S2', 24, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (440, 'M112', 'Gammes de montage', 'GM_PQA_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (441, 'M113', 'Contrôle non destructif', 'GM_PQA_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (442, 'M115', 'Système Management Qualité', 'GM_PQA_TS', 'S2', 70, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (443, 'EGTS102', 'Français', 'MA_DEEA_TS', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (444, 'EGTS103', 'Anglais technique', 'MA_DEEA_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (445, 'EGTS105', 'Compétences comportementales', 'MA_DEEA_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (446, 'EGTSI106', 'Culture et techniques intermédiaires du numérique', 'MA_DEEA_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (447, 'M101', 'Métier et formation', 'MA_DEEA_TS', 'S1', 20, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (448, 'M102', 'hygiène, sécurité et environnement', 'MA_DEEA_TS', 'S1', 35, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (449, 'M103', 'Recherche et lecture de la documentation technique', 'MA_DEEA_TS', 'S1', 55, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (450, 'M104', 'Travaux d’atelier', 'MA_DEEA_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (451, 'M105', 'Méthodes et  outils de diagnostic', 'MA_DEEA_TS', 'S1', 35, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (452, 'M106', 'Moteur à combustion interne', 'MA_DEEA_TS', 'S1', 95, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (453, 'M107', 'Tenue de route', 'MA_DEEA_TS', 'S2', 135, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (454, 'M108', 'Systèmes électriques automobile', 'MA_DEEA_TS', 'S2', 105, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (455, 'M109', 'Systèmes électroniques automobile', 'MA_DEEA_TS', 'S2', 105, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (456, 'M110', 'Transmission de puissance', 'MA_DEEA_TS', 'S2', 80, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (457, 'EGTS102', 'Français', 'MTI_GI_TS', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (458, 'EGTS103', 'Anglais technique', 'MTI_GI_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (459, 'EGTS105', 'Compétences comportementales', 'MTI_GI_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (460, 'EGTSI106', 'Culture et techniques intermédiaires du numérique', 'MTI_GI_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (461, 'M101', 'Métier et formation', 'MTI_GI_TS', 'S1', 15, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (462, 'M102', 'Hygiène, Sécurité et Environnement', 'MTI_GI_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (463, 'M103', 'Fonctionnement et organisation des entreprises', 'MTI_GI_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (464, 'M104', 'Analyse des circuits électriques à CC et CA', 'MTI_GI_TS', 'S1', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (465, 'M105', 'Analyse des moteurs électriques à CC et à CA', 'MTI_GI_TS', 'S1', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (466, 'M106', 'Installation des circuits de puissance et de commande des tableaux électriques', 'MTI_GI_TS', 'S1', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (467, 'M107', 'Analyse des circuits pneumatiques', 'MTI_GI_TS', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (468, 'M108', 'Le secteur industriel dans tous ses états et perspectives d''évolution', 'MTI_GI_TS', 'S2', 15, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (469, 'M109', 'Application des outils de CAO dans les domaines électriques, électroniques, pneumatiques', 'MTI_GI_TS', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (470, 'M111', 'Techniques de mesures métrologiques et d’usinage manuel', 'MTI_GI_TS', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (471, 'M112', 'Fonctionnement des principaux équipements de la mécanique et de l''hydraulique industrielle', 'MTI_GI_TS', 'S2', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (472, 'M113', 'Fonctionnement des principaux équipements thermiques', 'MTI_GI_TS', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (473, 'M114', 'Principes de la gestion de la production', 'MTI_GI_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (474, 'M115', 'Principes de la gestion de la maintenance', 'MTI_GI_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (475, 'EGTS108', 'Entrepreneuriat-PIE 1', 'MTI_GI_TS', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (476, 'M110', 'Logiciels de dessin industriel et Interprétation des schémas', 'MTI_GI_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (477, 'EGQ102', 'Français', 'THR_ART_Q', 'S2', 95, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (478, 'EGQ103', 'Anglais  (notions de base)', 'THR_ART_Q', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (479, 'EGQ105', 'Compétences comportementales', 'THR_ART_Q', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (480, 'EGQ107', 'Sport', 'THR_ART_Q', 'S1', 20, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (481, 'EGQB106', 'Culture et techniques de base du numérique', 'THR_ART_Q', 'S2', 25, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (482, 'M101', 'Métier et formation', 'THR_ART_Q', 'S1', 25, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (483, 'M102', 'Hygiène et sécurité alimentaire', 'THR_ART_Q', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (484, 'M103', 'Environnement professionnel', 'THR_ART_Q', 'S1', 25, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (485, 'M104', 'Mise en place', 'THR_ART_Q', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (486, 'M105', 'Réceptionner les denrées', 'THR_ART_Q', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (487, 'M106', 'Préparations fondamentales', 'THR_ART_Q', 'S1', 50, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (488, 'M107', 'Accueil et vente en salle', 'THR_ART_Q', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (489, 'M108', 'Techniques de cuisson', 'THR_ART_Q', 'S1', 55, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (490, 'M109', 'TIC Restaurant', 'THR_ART_Q', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (491, 'M110', 'TIC Cuisine', 'THR_ART_Q', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (492, 'M111', 'Patrimoine Culinaire marocain', 'THR_ART_Q', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (493, 'EGQ102', 'Français', 'THR_HK_Q', 'S2', 95, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (494, 'EGQ103', 'Anglais  (notions de base)', 'THR_HK_Q', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (495, 'EGQ105', 'Compétences comportementales', 'THR_HK_Q', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (496, 'EGQ107', 'Sport', 'THR_HK_Q', 'S1', 20, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (497, 'EGQ108', 'Entrepreneuriat-PIE 1', 'THR_HK_Q', 'S2', 27.5, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (498, 'EGQB106', 'Culture et techniques de base du numérique', 'THR_HK_Q', 'S2', 25, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (499, 'M101', 'Métier et formation', 'THR_HK_Q', 'S1', 15, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (500, 'M102', 'Relation professionnelles', 'THR_HK_Q', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (501, 'M103', 'Exploration du milieu de travail', 'THR_HK_Q', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (502, 'M104', 'Santé et sécurité au travail', 'THR_HK_Q', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (503, 'M105', 'Matériel et produits d’entretien', 'THR_HK_Q', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (504, 'M106', 'Entretien des espaces communs', 'THR_HK_Q', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (505, 'M107', 'Maintien de l’office', 'THR_HK_Q', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (506, 'M108', 'Service à la clientèle', 'THR_HK_Q', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (507, 'M109', 'Entretien de la chambre', 'THR_HK_Q', 'S2', 120, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (508, 'EGT102', 'Français', 'THR_AC_T', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (509, 'EGT103', 'Anglais technique', 'THR_AC_T', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (510, 'EGT105', 'Compétences comportementales', 'THR_AC_T', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (511, 'EGT108', 'Entrepreneuriat-PIE 1', 'THR_AC_T', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (512, 'EGTI106', 'Culture et techniques intermédiaires du numérique', 'THR_AC_T', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (513, 'M101', 'Se situer au regard du métier et de la démarche de formation', 'THR_AC_T', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (514, 'M102', 'Maintenir un environnement de travail salubre et sécuritaire', 'THR_AC_T', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (515, 'M103', 'Effectuer les calculs mathèmatiques de base', 'THR_AC_T', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (516, 'M104', 'Utiliser l''équipement de cuisine', 'THR_AC_T', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (517, 'M105', 'Évaluer les qualités organoleptiques des aliments', 'THR_AC_T', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (518, 'M106', 'Effectuer des activités liées à l''organisation d''une cuisine', 'THR_AC_T', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (519, 'M107', 'Rechercher et échanger de l''information', 'THR_AC_T', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (520, 'M108', 'Se situer au regard du tourisme durable', 'THR_AC_T', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (521, 'M109', 'Associer des techniques de cuisson classiques à la préparation des aliments', 'THR_AC_T', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (522, 'M110', 'Réaliser des préparations fondamentales', 'THR_AC_T', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (523, 'M111', 'Apprêter les fruits et légumes', 'THR_AC_T', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (524, 'M112', 'Etablir des relations professionnelles', 'THR_AC_T', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (525, 'M113', 'Effectuer la mise en place et la confection des pâtes de base et des desserts', 'THR_AC_T', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (526, 'EGT102', 'Français', 'THR_SRAT_T', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (527, 'EGT103', 'Anglais technique', 'THR_SRAT_T', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (528, 'EGT105', 'Compétences comportementales', 'THR_SRAT_T', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (529, 'EGT108', 'Entrepreneuriat-PIE 1', 'THR_SRAT_T', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (530, 'EGTI106', 'Culture et techniques intermédiaires du numérique', 'THR_SRAT_T', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (531, 'M101', 'Se situer au regard du métier et de la démarche de formation', 'THR_SRAT_T', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (532, 'M102', 'Maintenir un environnement de travail salubre et sécuritaire', 'THR_SRAT_T', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (533, 'M103', 'Établir des relations professionnelles', 'THR_SRAT_T', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (534, 'M104', 'Effectuer la mise en place de la salle à manger et de l''office', 'THR_SRAT_T', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (535, 'M105', 'Appliquer les règles de l''étiquette en restauration', 'THR_SRAT_T', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (536, 'M106', 'Établir des liens entre la confection des mets et leur service', 'THR_SRAT_T', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (537, 'M107', 'Effectuer les calculs mathématique liés au métier', 'THR_SRAT_T', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (538, 'M108', 'Exploiter les outils et les logiciels propres au métier', 'THR_SRAT_T', 'S2', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (539, 'M109', 'Effectuer un service simple', 'THR_SRAT_T', 'S2', 120, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (540, 'M110', 'Communiquer en français appliqué à la salle', 'THR_SRAT_T', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (541, 'EGTS102', 'Français', 'THR_MH_TS', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (542, 'EGTS103', 'Anglais technique', 'THR_MH_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (543, 'EGTS105', 'Compétences comportementales', 'THR_MH_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (544, 'EGTSI106', 'Culture et techniques intermédiaires du numérique', 'THR_MH_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (545, 'M101', 'Se situer au regard du métier et de la démarche de formation', 'THR_MH_TS', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (546, 'M102', 'Maintenir un environnement de travail salubre et sécuritaire', 'THR_MH_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (547, 'M103', 'Exploiter des notions relatives à la réglementation juridique', 'THR_MH_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (548, 'M104', 'Établir des relations professionnelles en hôtellerie', 'THR_MH_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (549, 'M105', 'Effectuer des calculs mathèmatiques de base', 'THR_MH_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (550, 'M106', 'Appliquer des notions de comptabilité générale', 'THR_MH_TS', 'S1', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (551, 'M107', 'Se situer au regard du tourisme durable', 'THR_MH_TS', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (552, 'M108', 'Analyser la dynamique de l''industrie hôtelière marocaine', 'THR_MH_TS', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (553, 'M109', 'Appliquer les règles de l''étiquette en hôtellerie', 'THR_MH_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (554, 'M110', 'Appliquer des notions de marketing fondamental', 'THR_MH_TS', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (555, 'M111', 'Effectuer des activités liées à la restauration', 'THR_MH_TS', 'S2', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (556, 'M112', 'Effectuer des activités de management des èquipes', 'THR_MH_TS', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (557, 'EGTS108', 'Entrepreneuriat-PIE 1', 'THR_MH_TS', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (558, 'EGTS102', 'Français', 'THR_MT_TS', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (559, 'EGTS103', 'Anglais technique', 'THR_MT_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (560, 'EGTS105', 'Compétences comportementales', 'THR_MT_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (561, 'EGTSI106', 'Culture et techniques intermédiaires du numérique', 'THR_MT_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (562, 'M101', 'Se situer au regard du métier et de la démarche de formation', 'THR_MT_TS', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (563, 'M102', 'Management des risques dans les circuits et séjours touristiques', 'THR_MT_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (564, 'M103', 'Effectuer des calculs mathématiques de base', 'THR_MT_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (565, 'M104', 'Exploiter des notions relatives à la réglementation juridique', 'THR_MT_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (566, 'M105', 'Établir des relations professionnelles en tourisme', 'THR_MT_TS', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (567, 'M106', 'Appliquer des notions de comptabilité générale', 'THR_MT_TS', 'S1', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (568, 'M107', 'Établir des liens entre les activités du secteur touristique et le développement économique', 'THR_MT_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (569, 'M108', 'Se situer au regard du tourisme durable', 'THR_MT_TS', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (570, 'M109', 'Analyser l''industrie touristique marocaine', 'THR_MT_TS', 'S2', 35, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (571, 'M110', 'Analyser le potentiel touristique des régions du monde', 'THR_MT_TS', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (572, 'M111', 'Appliquer les règles de l''étiquette en tourisme', 'THR_MT_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (573, 'M112', 'Exploiter divers moyens d''information, de relations publiques et de publicité', 'THR_MT_TS', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (574, 'M113', 'Effectuer des activités de gestion du personnel', 'THR_MT_TS', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (575, 'M114', 'Exploiter les outils du marketing du tourisme', 'THR_MT_TS', 'S2', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (576, 'EGT101', 'Arabe', 'ART_MA_T', 'S1', 20, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (577, 'EGT102', 'Français', 'ART_MA_T', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (578, 'EGT103', 'Anglais technique', 'ART_MA_T', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (579, 'EGT105', 'Compétences comportementales', 'ART_MA_T', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (580, 'EGT108', 'Entrepreneuriat-PIE 1', 'ART_MA_T', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (581, 'EGTI106', 'Culture et techniques intermédiaires du numérique', 'ART_MA_T', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (582, 'M101', 'Métier et formation', 'ART_MA_T', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (583, 'M102', 'Règles d''hygiène, de santé, de sécurité et de protection de l''environnement', 'ART_MA_T', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (584, 'M103', 'Caractéristiques de la  matière première et de la fourniture', 'ART_MA_T', 'S1', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (585, 'M104', 'Techniques de calcul professionnel', 'ART_MA_T', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (586, 'M105', 'Techniques de dessin professionnel', 'ART_MA_T', 'S1', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (587, 'M106', 'Maintenance du matériel, de l''outillage et des équipements', 'ART_MA_T', 'S1', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (588, 'M107', 'Techniques de débitage de la matière première', 'ART_MA_T', 'S1', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (589, 'M108', 'Techniques de façonnage des pièces', 'ART_MA_T', 'S2', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (590, 'M109', 'Techniques d’assemblage des composants consécutifs d’un ouvrage en bois', 'ART_MA_T', 'S2', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (591, 'M110', 'Travaux d''ornementation et de décoration', 'ART_MA_T', 'S2', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (592, 'EGT101', 'Arabe', 'ART_TPS_T', 'S1', 20, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (593, 'EGT102', 'Français', 'ART_TPS_T', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (594, 'EGT103', 'Anglais technique', 'ART_TPS_T', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (595, 'EGT105', 'Compétences comportementales', 'ART_TPS_T', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (596, 'EGT108', 'Entrepreneuriat-PIE 1', 'ART_TPS_T', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (597, 'EGTI106', 'Culture et techniques intermédiaires du numérique', 'ART_TPS_T', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (598, 'M101', 'Métier et formation', 'ART_TPS_T', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (599, 'M102', 'Règles d''hygiène, santé, sécurité et de protection de l’environnement', 'ART_TPS_T', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (600, 'M103', 'Caractéristiques des matières d''œuvre et accessoires de la tapisserie', 'ART_TPS_T', 'S1', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (601, 'M104', 'Techniques d''utilisation et d’entretien du matériel et équipement', 'ART_TPS_T', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (602, 'M106', 'Préparation des éléments constitutifs des ouvrages', 'ART_TPS_T', 'S1', 105, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (603, 'M107', 'Montage des structures', 'ART_TPS_T', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (604, 'M108', 'Assemblages et garnissages', 'ART_TPS_T', 'S2', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (605, 'M109', 'Dessin professionnel', 'ART_TPS_T', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (606, 'M110', 'CAO et DAO', 'ART_TPS_T', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (607, 'EGTS101', 'Arabe', 'ART_BJ_TS', 'S1', 20, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (608, 'EGTS102', 'Français', 'ART_BJ_TS', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (609, 'EGTS105', 'Compétences comportementales', 'ART_BJ_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (610, 'EGTS108', 'Entrepreneuriat-PIE 1', 'ART_BJ_TS', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (611, 'EGTSI106', 'Culture et techniques intermédiaires du numérique', 'ART_BJ_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (612, 'M101', 'Métier et formation', 'ART_BJ_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (613, 'M102', 'Tendances artistiques, de design et de l’histoire des arts traditionnels et de la bijouterie', 'ART_BJ_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (614, 'M103', 'Caractéristiques des métaux et des matériaux en bijouterie', 'ART_BJ_TS', 'S1', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (615, 'M104', 'Hygiène et sécurité au travail en bijouterie', 'ART_BJ_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (616, 'M105', 'Dessin professionnel', 'ART_BJ_TS', 'S1', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (617, 'M106', 'Calcul professionnel', 'ART_BJ_TS', 'S1', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (618, 'M107', 'Préparation de la production de bijoux', 'ART_BJ_TS', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (619, 'M108', 'Fabrication d’un bijou traditionnel', 'ART_BJ_TS', 'S2', 90, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (620, 'M109', 'Démarche qualité', 'ART_BJ_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (621, 'M110', 'Réglementation en vigueur', 'ART_BJ_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (622, 'M111', 'Approvisionnement et gestion de stock', 'ART_BJ_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (623, 'M112', 'notions de gemmologie', 'ART_BJ_TS', 'S2', 45, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (624, 'EGTS101', 'Arabe', 'ART_HC_TS', 'S1', 20, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (625, 'EGTS102', 'Français', 'ART_HC_TS', 'S2', 65, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (626, 'EGTS103', 'Anglais technique', 'ART_HC_TS', 'S2', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (627, 'EGTS105', 'Compétences comportementales', 'ART_HC_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (628, 'EGTS108', 'Entrepreneuriat-PIE 1', 'ART_HC_TS', 'S2', 72, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (629, 'EGTSI106', 'Culture et techniques intermédiaires du numérique', 'ART_HC_TS', 'S1', 40, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (630, 'M101', 'Métier et formation', 'ART_HC_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (631, 'M102', 'Histoire de la haute couture et tendance artistiques', 'ART_HC_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (632, 'M103', 'Règles de santé, de sécurité au travail et de protection de l’environnement', 'ART_HC_TS', 'S1', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (633, 'M104', 'Caractéristiques des matières textiles et fournitures', 'ART_HC_TS', 'S1', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (634, 'M105', 'Techniques d’assemblage, de pose de garnitures et de fermeture', 'ART_HC_TS', 'S2', 105, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (635, 'M106', 'Patrons de vêtements pour femmes', 'ART_HC_TS', 'S1', 105, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (636, 'M107', 'Patrons de vêtements pour hommes', 'ART_HC_TS', 'S2', 75, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (637, 'M108', 'Opérations de coupe du tissu', 'ART_HC_TS', 'S2', 60, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (638, 'M109', 'Démarche qualité', 'ART_HC_TS', 'S2', 30, 0);
INSERT IGNORE INTO modules (id, code, intitule, filiere, semestre, volume_horaire, has_efm) VALUES (639, 'M110', 'Dessin professionnel', 'ART_HC_TS', 'S2', 90, 0);

INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (100, 'INFPP101', 'INFPP101', 'AIG_INFPP_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (101, 'INFPP102', 'INFPP102', 'AIG_INFPP_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (102, 'PG101', 'PG101', 'AIG_PG_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (103, 'PG102', 'PG102', 'AIG_PG_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (104, 'PG103', 'PG103', 'AIG_PG_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (105, 'OA101', 'OA101', 'AGRI_OA_Q', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (106, 'OA102', 'OA102', 'AGRI_OA_Q', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (107, 'OA103', 'OA103', 'AGRI_OA_Q', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (108, 'AP101', 'AP101', 'AGRI_AP_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (109, 'MA101', 'MA101', 'AGRI_MA_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (110, 'MA102', 'MA102', 'AGRI_MA_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (111, 'TA101', 'TA101', 'AGRI_TA_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (112, 'TA102', 'TA102', 'AGRI_TA_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (113, 'TA103', 'TA103', 'AGRI_TA_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (114, 'TA104', 'TA104', 'AGRO_TA_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (115, 'AA101', 'AA101', 'GC_AA_T', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (116, 'AA102', 'AA102', 'GC_AA_T', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (117, 'AA103', 'AA103', 'GC_AA_T', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (118, 'AA104', 'AA104', 'GC_AA_T', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (119, 'AA105', 'AA105', 'GC_AA_T', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (120, 'AA106', 'AA106', 'GC_AA_T', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (121, 'GE101', 'GE101', 'GC_GE_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (122, 'GE102', 'GE102', 'GC_GE_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (123, 'GE103', 'GE103', 'GC_GE_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (124, 'GE104', 'GE104', 'GC_GE_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (125, 'GE105', 'GE105', 'GC_GE_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (126, 'GE106', 'GE106', 'GC_GE_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (127, 'GE107', 'GE107', 'GC_GE_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (128, 'DEV101', 'DEV101', 'DIA_DEV_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (129, 'DEV102', 'DEV102', 'DIA_DEV_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (130, 'DEV103', 'DEV103', 'DIA_DEV_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (131, 'DEV104', 'DEV104', 'DIA_DEV_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (132, 'DEV105', 'DEV105', 'DIA_DEV_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (133, 'ID106', 'ID106', 'DIA_ID_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (134, 'IAOADA201', 'IAOADA201', 'DIA_IAOADA_TS', '2', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (135, 'IAOADA202', 'IAOADA202', 'DIA_IAOADA_TS', '2', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (136, 'IAOBD201', 'IAOBD201', 'DIA_IAOBD_TS', '2', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (137, 'IAODC201', 'IAODC201', 'DIA_IAODC_TS', '2', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (138, 'OQE101', 'OQE101', 'GE_OQE_Q', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (139, 'OFM101', 'OFM101', 'GM_OFM_Q', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (140, 'GT101', 'GT101', 'FGT_GT_T', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (141, 'EI101', 'EI101', 'GE_EI_T', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (142, 'PM101', 'PM101', 'GM_PM_T', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (143, 'PM102', 'PM102', 'GM_PM_T', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (144, 'EEM101', 'EEM101', 'MA_EEM_T', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (145, 'QHSE101', 'QHSE101', 'EV_QHSE_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (146, 'QHSE102', 'QHSE102', 'EV_QHSE_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (147, 'GM101', 'GM101', 'GM_GM_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (148, 'GM102', 'GM102', 'GM_GM_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (149, 'PQA101', 'PQA101', 'GM_PQA_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (150, 'DEEA101', 'DEEA101', 'MA_DEEA_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (151, 'GI101', 'GI101', 'MTI_GI_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (152, 'GI102', 'GI102', 'MTI_GI_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (153, 'ART101', 'ART101', 'THR_ART_Q', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (154, 'HK101', 'HK101', 'THR_HK_Q', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (155, 'AC101', 'AC101', 'THR_AC_T', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (156, 'AC102', 'AC102', 'THR_AC_T', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (157, 'AC103', 'AC103', 'THR_AC_T', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (158, 'AC104', 'AC104', 'THR_AC_T', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (159, 'AC105', 'AC105', 'THR_AC_T', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (160, 'AC106', 'AC106', 'THR_AC_T', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (161, 'SRAT101', 'SRAT101', 'THR_SRAT_T', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (162, 'MH101', 'MH101', 'THR_MH_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (163, 'MH102', 'MH102', 'THR_MH_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (164, 'MH103', 'MH103', 'THR_MH_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (165, 'MH104', 'MH104', 'THR_MH_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (166, 'MH105', 'MH105', 'THR_MH_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (167, 'MT101', 'MT101', 'THR_MT_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (168, 'MT102', 'MT102', 'THR_MT_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (169, 'MT103', 'MT103', 'THR_MT_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (170, 'MT104', 'MT104', 'THR_MT_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (171, 'TPS101', 'TPS101', 'ART_TPS_T', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (172, 'BJ101', 'BJ101', 'ART_BJ_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (173, 'HC101', 'HC101', 'ART_HC_TS', '1', 20, 1);
INSERT IGNORE INTO groupes (id, code, nom, filiere, annee_scolaire, effectif, actif) VALUES (174, 'HC102', 'HC102', 'ART_HC_TS', '1', 20, 1);





INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (100, 100, 100, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (101, 101, 101, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (102, 100, 102, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (103, 102, 103, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (104, 103, 104, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (105, 104, 105, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (106, 104, 106, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (107, 105, 107, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (108, 103, 108, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (109, 106, 109, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (110, 104, 110, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (111, 106, 111, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (112, 105, 112, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (113, 104, 113, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (114, 103, 114, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (115, 107, 115, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (116, 101, 116, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (117, 100, 117, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (118, 102, 118, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (119, 106, 119, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (120, 103, 120, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (121, 103, 121, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (122, 105, 122, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (123, 103, 123, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (124, 103, 124, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (125, 106, 125, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (126, 106, 126, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (127, 103, 127, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (128, 106, 128, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (129, 105, 129, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (130, 108, 120, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (131, 108, 121, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (132, 108, 123, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (133, 108, 124, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (134, 108, 127, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (135, 108, 128, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (136, 109, 117, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (137, 105, 120, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (138, 105, 121, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (139, 104, 124, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (140, 105, 128, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (141, 100, 130, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (142, 101, 131, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (143, 110, 132, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (144, 111, 133, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (145, 102, 134, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (146, 112, 135, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (147, 113, 136, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (148, 114, 137, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (149, 112, 138, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (150, 115, 139, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (151, 113, 140, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (152, 112, 141, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (153, 112, 142, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (154, 114, 143, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (155, 116, 130, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (156, 117, 131, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (157, 118, 135, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (158, 113, 138, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (159, 119, 139, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (160, 120, 140, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (161, 118, 141, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (162, 113, 142, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (163, 109, 130, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (164, 121, 134, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (165, 122, 135, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (166, 118, 136, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (167, 114, 138, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (168, 118, 140, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (169, 113, 143, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (170, 123, 144, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (171, 117, 145, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (172, 110, 146, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (173, 124, 147, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (174, 113, 148, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (175, 113, 149, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (176, 119, 150, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (177, 120, 151, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (178, 120, 152, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (179, 114, 153, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (180, 112, 154, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (181, 112, 155, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (182, 117, 156, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (183, 125, 157, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (184, 113, 158, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (185, 113, 159, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (186, 115, 160, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (187, 122, 161, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (188, 113, 162, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (189, 122, 163, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (190, 120, 164, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (191, 122, 165, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (192, 122, 166, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (193, 123, 167, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (194, 125, 168, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (195, 102, 157, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (196, 122, 169, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (197, 122, 158, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (198, 119, 159, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (199, 120, 160, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (200, 120, 161, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (201, 118, 162, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (202, 120, 163, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (203, 122, 164, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (204, 126, 170, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (205, 127, 167, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (206, 114, 171, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (207, 117, 172, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (208, 120, 173, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (209, 110, 174, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (210, 122, 174, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (211, 118, 175, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (212, 128, 176, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (213, 114, 177, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (214, 113, 178, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (215, 114, 179, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (216, 114, 180, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (217, 115, 181, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (218, 129, 181, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (219, 110, 172, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (220, 122, 172, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (221, 121, 174, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (222, 120, 182, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (223, 113, 175, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (224, 120, 177, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (225, 122, 183, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (226, 115, 179, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (227, 129, 180, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (228, 127, 181, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (229, 120, 181, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (230, 120, 184, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (231, 118, 171, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (232, 113, 173, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (233, 118, 182, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (234, 114, 176, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (235, 119, 177, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (236, 129, 178, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (237, 127, 179, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (238, 112, 179, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (239, 118, 180, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (240, 118, 185, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (241, 123, 184, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (242, 101, 186, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (243, 130, 187, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (244, 116, 188, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (245, 119, 188, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (246, 102, 189, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (247, 115, 190, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (248, 131, 191, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (249, 115, 192, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (250, 119, 193, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (251, 115, 194, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (252, 130, 195, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (253, 131, 186, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (254, 126, 196, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (255, 131, 196, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (256, 115, 197, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (257, 131, 189, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (258, 119, 190, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (259, 130, 198, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (260, 117, 194, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (261, 115, 187, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (262, 131, 197, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (263, 115, 189, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (264, 119, 191, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (265, 129, 192, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (266, 130, 192, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (267, 101, 193, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (268, 115, 199, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (269, 131, 195, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (270, 132, 200, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (271, 101, 201, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (272, 110, 202, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (273, 124, 203, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (274, 133, 204, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (275, 134, 205, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (276, 135, 206, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (277, 136, 207, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (278, 137, 208, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (279, 138, 209, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (280, 138, 210, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (281, 139, 211, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (282, 136, 212, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (283, 140, 213, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (284, 141, 214, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (285, 107, 200, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (286, 117, 201, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (287, 126, 202, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (288, 134, 204, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (289, 142, 205, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (290, 143, 206, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (291, 144, 208, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (292, 145, 211, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (293, 142, 212, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (294, 146, 213, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (295, 144, 214, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (296, 147, 205, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (297, 148, 206, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (298, 142, 207, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (299, 149, 208, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (300, 148, 209, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (301, 149, 211, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (302, 148, 212, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (303, 134, 213, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (304, 143, 214, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (305, 150, 203, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (306, 148, 204, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (307, 151, 206, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (308, 151, 207, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (309, 152, 208, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (310, 133, 210, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (311, 152, 211, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (312, 151, 212, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (313, 153, 202, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (314, 145, 205, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (315, 141, 208, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (316, 134, 210, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (317, 133, 213, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (318, 154, 204, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (319, 154, 206, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (320, 135, 207, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (321, 155, 208, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (322, 134, 209, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (323, 155, 211, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (324, 156, 215, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (325, 127, 216, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (326, 153, 217, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (327, 102, 218, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (328, 133, 219, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (329, 140, 220, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (330, 157, 221, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (331, 157, 222, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (332, 137, 223, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (333, 139, 224, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (334, 136, 225, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (335, 137, 226, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (336, 155, 227, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (337, 157, 228, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (338, 143, 229, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (339, 101, 216, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (340, 128, 218, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (341, 154, 219, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (342, 142, 220, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (343, 143, 221, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (344, 158, 222, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (345, 144, 223, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (346, 146, 224, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (347, 158, 225, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (348, 144, 226, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (349, 140, 227, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (350, 144, 229, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (351, 159, 218, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (352, 145, 220, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (353, 138, 221, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (354, 142, 222, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (355, 149, 223, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (356, 160, 224, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (357, 142, 225, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (358, 149, 226, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (359, 134, 227, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (360, 145, 228, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (361, 145, 229, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (362, 117, 216, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (363, 140, 219, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (364, 158, 220, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (365, 147, 221, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (366, 151, 222, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (367, 152, 223, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (368, 151, 225, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (369, 152, 226, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (370, 135, 227, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (371, 147, 228, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (372, 123, 217, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (373, 136, 220, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (374, 135, 221, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (375, 141, 223, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (376, 141, 226, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (377, 154, 229, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (378, 150, 218, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (379, 145, 219, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (380, 133, 220, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (381, 146, 221, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (382, 139, 222, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (383, 155, 223, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (384, 133, 224, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (385, 155, 226, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (386, 138, 219, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (387, 139, 220, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (388, 158, 221, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (389, 135, 222, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (390, 146, 223, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (391, 154, 224, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (392, 148, 225, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (393, 146, 226, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (394, 116, 230, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (395, 101, 231, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (396, 162, 232, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (397, 128, 233, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (398, 163, 234, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (399, 164, 235, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (400, 165, 236, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (401, 163, 237, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (402, 166, 238, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (403, 163, 239, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (404, 167, 235, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (405, 168, 240, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (406, 165, 241, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (407, 132, 230, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (408, 169, 235, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (409, 166, 240, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (410, 170, 242, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (411, 166, 241, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (412, 171, 238, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (413, 171, 235, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (414, 167, 242, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (415, 163, 235, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (416, 170, 240, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (417, 172, 243, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (418, 173, 244, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (419, 174, 245, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (420, 175, 246, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (421, 176, 247, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (422, 177, 248, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (423, 176, 249, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (424, 177, 250, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (425, 174, 251, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (426, 174, 246, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (427, 174, 249, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (428, 175, 245, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (429, 178, 251, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (430, 179, 250, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (431, 174, 252, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (432, 174, 253, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (433, 180, 254, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (434, 181, 255, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (435, 177, 256, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (436, 176, 257, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (437, 177, 258, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (438, 175, 259, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (439, 178, 260, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (440, 178, 261, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (441, 180, 262, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (442, 175, 263, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (443, 180, 264, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (444, 180, 265, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (445, 123, 266, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (446, 101, 267, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (447, 125, 268, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (448, 111, 269, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (449, 159, 270, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (450, 182, 271, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (451, 183, 272, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (452, 184, 273, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (453, 185, 274, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (454, 186, 275, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (455, 185, 276, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (456, 187, 277, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (457, 183, 278, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (458, 188, 279, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (459, 156, 280, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (460, 127, 281, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (461, 125, 282, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (462, 111, 283, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (463, 124, 284, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (464, 189, 285, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (465, 190, 286, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (466, 191, 287, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (467, 190, 288, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (468, 192, 289, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (469, 186, 290, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (470, 191, 291, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (471, 190, 292, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (472, 191, 293, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (473, 192, 294, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (474, 190, 295, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (475, 109, 296, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (476, 101, 297, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (477, 125, 298, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (478, 124, 299, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (479, 193, 300, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (480, 194, 301, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (481, 194, 302, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (482, 193, 303, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (483, 194, 304, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (484, 195, 305, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (485, 196, 306, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (486, 193, 307, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (487, 196, 308, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (488, 194, 309, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (489, 193, 310, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (490, 194, 311, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (491, 196, 312, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (492, 193, 313, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (493, 195, 314, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (494, 123, 315, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (495, 101, 316, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (496, 197, 317, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (497, 198, 318, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (498, 183, 319, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (499, 188, 320, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (500, 184, 321, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (501, 199, 322, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (502, 185, 323, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (503, 192, 324, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (504, 198, 325, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (505, 199, 326, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (506, 183, 327, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (507, 183, 328, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (508, 200, 329, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (509, 188, 330, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (510, 107, 331, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (511, 127, 332, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (512, 125, 333, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (513, 188, 334, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (514, 192, 335, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (515, 191, 336, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (516, 190, 337, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (517, 201, 338, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (518, 186, 339, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (519, 192, 340, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (520, 187, 341, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (521, 191, 342, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (522, 192, 343, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (523, 117, 332, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (524, 192, 336, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (525, 186, 341, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (526, 153, 344, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (527, 117, 345, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (528, 129, 346, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (529, 128, 347, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (530, 188, 348, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (531, 202, 349, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (532, 202, 350, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (533, 202, 351, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (534, 186, 352, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (535, 202, 353, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (536, 202, 354, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (537, 202, 355, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (538, 202, 356, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (539, 202, 357, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (540, 202, 358, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (541, 109, 359, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (542, 117, 360, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (543, 123, 361, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (544, 150, 362, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (545, 188, 363, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (546, 203, 364, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (547, 203, 365, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (548, 203, 366, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (549, 203, 367, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (550, 203, 368, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (551, 203, 369, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (552, 203, 370, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (553, 203, 371, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (554, 109, 372, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (555, 117, 373, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (556, 125, 374, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (557, 124, 375, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (558, 193, 376, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (559, 196, 377, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (560, 194, 378, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (561, 193, 379, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (562, 196, 380, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (563, 194, 381, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (564, 195, 382, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (565, 193, 383, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (566, 196, 384, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (567, 196, 385, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (568, 193, 386, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (569, 195, 387, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (570, 195, 388, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (571, 193, 389, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (572, 195, 390, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (573, 194, 380, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (574, 196, 382, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (575, 194, 387, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (576, 196, 390, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (577, 109, 391, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (578, 127, 392, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (579, 197, 393, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (580, 159, 394, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (581, 198, 395, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (582, 198, 396, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (583, 199, 397, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (584, 199, 398, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (585, 204, 399, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (586, 188, 400, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (587, 188, 401, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (588, 204, 402, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (589, 188, 403, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (590, 204, 404, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (591, 200, 405, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (592, 204, 406, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (593, 183, 407, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (594, 185, 408, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (595, 121, 394, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (596, 182, 395, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (597, 205, 409, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (598, 183, 400, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (599, 101, 392, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (600, 128, 394, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (601, 204, 398, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (602, 204, 400, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (603, 200, 403, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (604, 185, 406, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (605, 107, 410, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (606, 117, 411, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (607, 126, 412, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (608, 159, 413, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (609, 188, 414, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (610, 192, 415, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (611, 187, 416, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (612, 187, 417, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (613, 186, 418, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (614, 190, 419, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (615, 186, 420, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (616, 201, 421, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (617, 201, 422, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (618, 186, 423, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (619, 191, 424, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (620, 197, 412, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (621, 190, 415, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (622, 153, 425, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (623, 101, 426, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (624, 206, 427, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (625, 128, 428, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (626, 188, 429, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (627, 191, 430, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (628, 201, 431, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (629, 187, 432, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (630, 201, 433, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (631, 190, 434, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (632, 187, 435, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (633, 201, 436, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (634, 190, 437, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (635, 191, 438, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (636, 201, 439, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (637, 191, 440, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (638, 187, 441, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (639, 199, 442, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (640, 162, 443, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (641, 101, 444, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (642, 197, 445, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (643, 188, 446, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (644, 207, 447, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (645, 207, 448, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (646, 207, 449, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (647, 207, 450, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (648, 207, 451, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (649, 207, 452, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (650, 207, 453, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (651, 207, 454, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (652, 207, 455, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (653, 207, 456, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (654, 109, 457, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (655, 117, 458, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (656, 197, 459, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (657, 182, 460, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (658, 182, 461, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (659, 199, 462, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (660, 188, 463, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (661, 205, 464, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (662, 183, 465, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (663, 185, 466, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (664, 188, 467, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (665, 188, 468, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (666, 185, 469, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (667, 191, 470, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (668, 199, 471, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (669, 188, 472, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (670, 200, 473, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (671, 199, 474, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (672, 116, 457, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (673, 101, 458, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (674, 159, 475, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (675, 198, 460, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (676, 198, 464, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (677, 205, 466, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (678, 187, 476, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (679, 107, 477, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (680, 117, 478, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (681, 129, 479, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (682, 111, 480, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (683, 208, 481, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (684, 209, 482, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (685, 210, 483, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (686, 210, 484, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (687, 211, 485, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (688, 211, 486, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (689, 212, 487, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (690, 210, 488, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (691, 208, 489, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (692, 211, 490, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (693, 209, 491, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (694, 208, 492, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (695, 109, 493, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (696, 101, 494, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (697, 116, 495, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (698, 111, 496, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (699, 128, 497, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (700, 213, 498, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (701, 214, 499, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (702, 215, 500, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (703, 213, 501, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (704, 214, 502, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (705, 214, 503, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (706, 214, 504, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (707, 214, 505, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (708, 214, 506, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (709, 214, 507, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (710, 153, 508, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (711, 117, 509, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (712, 129, 510, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (713, 121, 511, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (714, 209, 512, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (715, 212, 513, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (716, 209, 514, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (717, 208, 515, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (718, 208, 516, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (719, 216, 517, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (720, 216, 518, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (721, 208, 519, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (722, 217, 520, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (723, 209, 521, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (724, 212, 522, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (725, 209, 523, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (726, 212, 524, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (727, 216, 525, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (728, 206, 508, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (729, 126, 510, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (730, 127, 509, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (731, 116, 510, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (732, 206, 526, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (733, 117, 527, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (734, 123, 528, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (735, 159, 529, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (736, 211, 530, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (737, 210, 531, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (738, 210, 532, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (739, 210, 533, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (740, 211, 534, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (741, 210, 535, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (742, 211, 536, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (743, 210, 537, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (744, 210, 538, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (745, 211, 539, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (746, 210, 540, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (747, 206, 541, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (748, 101, 542, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (749, 206, 543, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (750, 218, 544, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (751, 218, 545, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (752, 213, 546, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (753, 217, 547, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (754, 213, 548, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (755, 210, 549, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (756, 219, 550, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (757, 217, 551, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (758, 213, 552, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (759, 218, 553, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (760, 220, 554, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (761, 216, 555, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (762, 220, 556, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (763, 107, 541, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (764, 117, 542, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (765, 159, 557, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (766, 218, 547, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (767, 210, 555, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (768, 121, 557, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (769, 156, 558, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (770, 127, 559, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (771, 129, 560, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (772, 215, 561, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (773, 217, 562, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (774, 220, 563, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (775, 221, 564, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (776, 222, 565, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (777, 162, 566, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (778, 160, 567, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (779, 215, 568, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (780, 217, 569, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (781, 222, 570, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (782, 215, 571, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (783, 221, 572, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (784, 221, 573, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (785, 222, 574, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (786, 214, 575, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (787, 153, 558, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (788, 101, 559, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (789, 206, 560, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (790, 214, 566, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (791, 107, 558, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (792, 215, 574, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (793, 109, 560, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (794, 110, 576, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (795, 223, 577, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (796, 117, 578, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (797, 110, 579, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (798, 102, 580, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (799, 224, 581, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (800, 225, 582, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (801, 225, 583, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (802, 225, 584, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (803, 225, 585, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (804, 225, 586, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (805, 225, 587, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (806, 225, 588, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (807, 225, 589, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (808, 225, 590, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (809, 225, 591, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (810, 123, 592, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (811, 109, 593, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (812, 117, 594, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (813, 129, 595, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (814, 121, 596, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (815, 224, 597, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (816, 226, 598, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (817, 226, 599, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (818, 226, 600, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (819, 226, 601, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (820, 226, 602, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (821, 226, 603, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (822, 226, 604, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (823, 226, 605, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (824, 226, 606, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (825, 110, 607, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (826, 123, 608, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (827, 110, 609, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (828, 150, 610, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (829, 224, 611, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (830, 227, 612, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (831, 227, 613, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (832, 227, 614, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (833, 228, 615, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (834, 228, 616, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (835, 227, 617, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (836, 227, 618, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (837, 227, 619, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (838, 229, 620, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (839, 229, 621, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (840, 229, 622, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (841, 227, 623, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (842, 230, 624, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (843, 132, 625, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (844, 127, 626, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (845, 125, 627, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (846, 121, 628, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (847, 224, 629, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (848, 231, 630, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (849, 231, 631, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (850, 231, 632, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (851, 231, 633, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (852, 231, 634, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (853, 231, 635, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (854, 231, 636, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (855, 231, 637, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (856, 231, 638, 2026);
INSERT IGNORE INTO affectations (id, formateur_id, module_id, annee) VALUES (857, 231, 639, 2026);

INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (100, 100, 100);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (101, 101, 100);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (102, 102, 100);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (103, 103, 100);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (104, 104, 100);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (105, 105, 100);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (106, 106, 100);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (107, 107, 100);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (108, 108, 100);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (109, 109, 100);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (110, 110, 100);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (111, 111, 100);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (112, 112, 100);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (113, 113, 100);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (114, 114, 100);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (115, 100, 101);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (116, 101, 101);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (117, 102, 101);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (118, 103, 101);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (119, 104, 101);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (120, 105, 101);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (121, 106, 101);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (122, 107, 101);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (123, 108, 101);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (124, 109, 101);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (125, 110, 101);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (126, 111, 101);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (127, 112, 101);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (128, 113, 101);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (129, 114, 101);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (130, 115, 102);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (131, 116, 102);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (132, 117, 102);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (133, 118, 102);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (134, 119, 102);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (135, 120, 102);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (136, 121, 102);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (137, 122, 102);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (138, 123, 102);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (139, 124, 102);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (140, 125, 102);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (141, 126, 102);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (142, 127, 102);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (143, 128, 102);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (144, 129, 102);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (145, 115, 103);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (146, 116, 103);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (147, 117, 103);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (148, 118, 103);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (149, 119, 103);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (150, 120, 103);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (151, 121, 103);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (152, 122, 103);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (153, 123, 103);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (154, 124, 103);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (155, 125, 103);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (156, 126, 103);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (157, 127, 103);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (158, 128, 103);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (159, 129, 103);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (160, 115, 104);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (161, 116, 104);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (162, 117, 104);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (163, 118, 104);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (164, 119, 104);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (165, 120, 104);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (166, 121, 104);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (167, 122, 104);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (168, 123, 104);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (169, 124, 104);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (170, 125, 104);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (171, 126, 104);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (172, 127, 104);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (173, 128, 104);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (174, 129, 104);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (175, 130, 105);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (176, 131, 105);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (177, 132, 105);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (178, 133, 105);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (179, 134, 105);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (180, 135, 105);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (181, 136, 105);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (182, 137, 105);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (183, 138, 105);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (184, 139, 105);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (185, 140, 105);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (186, 141, 105);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (187, 142, 105);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (188, 143, 105);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (189, 130, 106);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (190, 131, 106);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (191, 132, 106);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (192, 133, 106);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (193, 135, 106);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (194, 136, 106);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (195, 137, 106);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (196, 138, 106);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (197, 139, 106);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (198, 140, 106);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (199, 141, 106);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (200, 142, 106);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (201, 143, 106);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (202, 130, 107);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (203, 131, 107);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (204, 132, 107);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (205, 133, 107);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (206, 134, 107);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (207, 135, 107);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (208, 136, 107);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (209, 137, 107);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (210, 138, 107);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (211, 139, 107);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (212, 140, 107);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (213, 141, 107);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (214, 142, 107);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (215, 143, 107);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (216, 144, 108);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (217, 145, 108);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (218, 146, 108);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (219, 147, 108);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (220, 148, 108);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (221, 149, 108);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (222, 150, 108);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (223, 151, 108);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (224, 152, 108);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (225, 153, 108);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (226, 154, 108);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (227, 155, 108);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (228, 156, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (229, 157, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (230, 158, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (231, 159, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (232, 160, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (233, 161, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (234, 162, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (235, 163, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (236, 164, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (237, 165, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (238, 166, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (239, 167, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (240, 168, 110);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (241, 157, 110);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (242, 169, 110);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (243, 158, 110);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (244, 159, 110);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (245, 160, 110);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (246, 161, 110);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (247, 162, 110);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (248, 163, 110);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (249, 164, 110);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (250, 165, 110);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (251, 170, 110);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (252, 167, 110);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (253, 171, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (254, 172, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (255, 173, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (256, 174, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (257, 175, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (258, 176, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (259, 177, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (260, 178, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (261, 179, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (262, 180, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (263, 181, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (264, 172, 112);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (265, 174, 112);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (266, 182, 112);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (267, 175, 112);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (268, 177, 112);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (269, 183, 112);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (270, 179, 112);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (271, 180, 112);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (272, 181, 112);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (273, 184, 112);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (274, 171, 113);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (275, 173, 113);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (276, 182, 113);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (277, 176, 113);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (278, 177, 113);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (279, 178, 113);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (280, 179, 113);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (281, 180, 113);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (282, 185, 113);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (283, 184, 113);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (284, 186, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (285, 187, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (286, 188, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (287, 189, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (288, 190, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (289, 191, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (290, 192, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (291, 193, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (292, 194, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (293, 195, 111);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (294, 186, 112);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (295, 196, 112);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (296, 197, 112);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (297, 189, 112);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (298, 190, 112);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (299, 191, 112);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (300, 193, 112);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (301, 198, 112);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (302, 194, 112);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (303, 187, 113);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (304, 197, 113);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (305, 189, 113);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (306, 191, 113);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (307, 192, 113);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (308, 193, 113);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (309, 199, 113);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (310, 195, 113);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (311, 187, 114);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (312, 197, 114);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (313, 189, 114);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (314, 191, 114);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (315, 192, 114);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (316, 193, 114);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (317, 199, 114);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (318, 195, 114);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (319, 200, 115);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (320, 201, 115);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (321, 202, 115);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (322, 203, 115);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (323, 204, 115);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (324, 205, 115);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (325, 206, 115);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (326, 207, 115);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (327, 208, 115);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (328, 209, 115);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (329, 210, 115);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (330, 211, 115);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (331, 212, 115);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (332, 213, 115);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (333, 214, 115);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (334, 200, 116);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (335, 201, 116);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (336, 202, 116);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (337, 203, 116);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (338, 204, 116);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (339, 205, 116);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (340, 206, 116);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (341, 207, 116);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (342, 208, 116);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (343, 209, 116);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (344, 210, 116);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (345, 211, 116);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (346, 212, 116);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (347, 213, 116);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (348, 214, 116);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (349, 200, 117);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (350, 201, 117);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (351, 203, 117);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (352, 204, 117);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (353, 205, 117);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (354, 206, 117);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (355, 207, 117);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (356, 208, 117);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (357, 209, 117);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (358, 210, 117);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (359, 211, 117);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (360, 212, 117);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (361, 213, 117);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (362, 214, 117);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (363, 200, 118);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (364, 201, 118);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (365, 202, 118);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (366, 203, 118);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (367, 204, 118);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (368, 205, 118);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (369, 206, 118);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (370, 207, 118);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (371, 208, 118);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (372, 209, 118);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (373, 210, 118);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (374, 211, 118);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (375, 212, 118);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (376, 213, 118);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (377, 214, 118);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (378, 200, 119);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (379, 201, 119);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (380, 202, 119);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (381, 203, 119);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (382, 204, 119);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (383, 205, 119);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (384, 206, 119);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (385, 207, 119);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (386, 208, 119);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (387, 209, 119);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (388, 210, 119);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (389, 211, 119);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (390, 212, 119);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (391, 213, 119);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (392, 214, 119);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (393, 200, 120);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (394, 201, 120);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (395, 202, 120);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (396, 203, 120);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (397, 204, 120);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (398, 205, 120);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (399, 206, 120);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (400, 207, 120);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (401, 208, 120);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (402, 209, 120);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (403, 210, 120);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (404, 211, 120);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (405, 212, 120);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (406, 213, 120);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (407, 214, 120);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (408, 215, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (409, 216, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (410, 217, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (411, 218, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (412, 219, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (413, 220, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (414, 221, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (415, 222, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (416, 223, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (417, 224, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (418, 225, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (419, 226, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (420, 227, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (421, 228, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (422, 229, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (423, 215, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (424, 216, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (425, 217, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (426, 218, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (427, 219, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (428, 220, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (429, 221, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (430, 222, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (431, 223, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (432, 224, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (433, 225, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (434, 226, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (435, 227, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (436, 228, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (437, 229, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (438, 215, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (439, 216, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (440, 217, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (441, 218, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (442, 219, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (443, 220, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (444, 221, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (445, 222, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (446, 223, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (447, 224, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (448, 225, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (449, 226, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (450, 227, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (451, 228, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (452, 229, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (453, 215, 124);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (454, 216, 124);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (455, 217, 124);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (456, 218, 124);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (457, 219, 124);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (458, 220, 124);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (459, 221, 124);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (460, 222, 124);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (461, 223, 124);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (462, 224, 124);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (463, 225, 124);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (464, 226, 124);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (465, 227, 124);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (466, 228, 124);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (467, 229, 124);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (468, 215, 125);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (469, 216, 125);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (470, 217, 125);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (471, 218, 125);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (472, 219, 125);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (473, 220, 125);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (474, 221, 125);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (475, 222, 125);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (476, 223, 125);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (477, 224, 125);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (478, 225, 125);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (479, 226, 125);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (480, 227, 125);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (481, 228, 125);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (482, 229, 125);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (483, 215, 126);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (484, 216, 126);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (485, 217, 126);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (486, 218, 126);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (487, 219, 126);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (488, 220, 126);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (489, 221, 126);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (490, 222, 126);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (491, 223, 126);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (492, 224, 126);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (493, 225, 126);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (494, 226, 126);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (495, 227, 126);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (496, 228, 126);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (497, 229, 126);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (498, 215, 127);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (499, 216, 127);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (500, 217, 127);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (501, 218, 127);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (502, 219, 127);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (503, 220, 127);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (504, 221, 127);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (505, 222, 127);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (506, 223, 127);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (507, 224, 127);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (508, 225, 127);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (509, 226, 127);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (510, 227, 127);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (511, 228, 127);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (512, 229, 127);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (513, 230, 128);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (514, 231, 128);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (515, 232, 128);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (516, 233, 128);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (517, 234, 128);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (518, 235, 128);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (519, 236, 128);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (520, 237, 128);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (521, 238, 128);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (522, 239, 128);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (523, 230, 129);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (524, 231, 129);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (525, 232, 129);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (526, 234, 129);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (527, 235, 129);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (528, 240, 129);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (529, 241, 129);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (530, 236, 129);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (531, 237, 129);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (532, 238, 129);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (533, 239, 129);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (534, 230, 130);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (535, 231, 130);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (536, 232, 130);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (537, 234, 130);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (538, 235, 130);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (539, 240, 130);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (540, 242, 130);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (541, 241, 130);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (542, 237, 130);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (543, 238, 130);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (544, 239, 130);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (545, 230, 131);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (546, 231, 131);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (547, 232, 131);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (548, 234, 131);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (549, 235, 131);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (550, 240, 131);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (551, 242, 131);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (552, 241, 131);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (553, 237, 131);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (554, 238, 131);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (555, 239, 131);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (556, 230, 132);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (557, 231, 132);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (558, 232, 132);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (559, 234, 132);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (560, 235, 132);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (561, 240, 132);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (562, 243, 133);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (563, 244, 133);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (564, 245, 134);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (565, 246, 134);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (566, 247, 134);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (567, 248, 134);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (568, 249, 134);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (569, 250, 134);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (570, 251, 134);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (571, 246, 135);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (572, 249, 135);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (573, 247, 135);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (574, 248, 135);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (575, 245, 135);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (576, 251, 135);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (577, 250, 135);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (578, 252, 136);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (579, 253, 136);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (580, 254, 136);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (581, 255, 136);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (582, 256, 136);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (583, 257, 136);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (584, 258, 136);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (585, 259, 137);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (586, 260, 137);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (587, 261, 137);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (588, 262, 137);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (589, 263, 137);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (590, 264, 137);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (591, 265, 137);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (592, 266, 138);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (593, 267, 138);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (594, 268, 138);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (595, 269, 138);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (596, 270, 138);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (597, 271, 138);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (598, 272, 138);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (599, 273, 138);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (600, 274, 138);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (601, 275, 138);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (602, 276, 138);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (603, 277, 138);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (604, 278, 138);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (605, 279, 138);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (606, 280, 139);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (607, 281, 139);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (608, 282, 139);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (609, 283, 139);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (610, 284, 139);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (611, 285, 139);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (612, 286, 139);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (613, 287, 139);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (614, 288, 139);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (615, 289, 139);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (616, 290, 139);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (617, 291, 139);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (618, 292, 139);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (619, 293, 139);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (620, 294, 139);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (621, 295, 139);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (622, 296, 140);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (623, 297, 140);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (624, 298, 140);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (625, 299, 140);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (626, 300, 140);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (627, 301, 140);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (628, 302, 140);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (629, 303, 140);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (630, 304, 140);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (631, 305, 140);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (632, 306, 140);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (633, 307, 140);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (634, 308, 140);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (635, 309, 140);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (636, 310, 140);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (637, 311, 140);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (638, 312, 140);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (639, 313, 140);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (640, 314, 140);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (641, 315, 141);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (642, 316, 141);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (643, 317, 141);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (644, 318, 141);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (645, 319, 141);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (646, 320, 141);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (647, 321, 141);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (648, 322, 141);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (649, 323, 141);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (650, 324, 141);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (651, 325, 141);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (652, 326, 141);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (653, 327, 141);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (654, 328, 141);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (655, 329, 141);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (656, 330, 141);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (657, 331, 142);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (658, 332, 142);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (659, 333, 142);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (660, 334, 142);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (661, 335, 142);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (662, 336, 142);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (663, 337, 142);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (664, 338, 142);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (665, 339, 142);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (666, 340, 142);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (667, 341, 142);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (668, 342, 142);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (669, 343, 142);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (670, 331, 143);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (671, 332, 143);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (672, 333, 143);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (673, 334, 143);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (674, 335, 143);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (675, 336, 143);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (676, 337, 143);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (677, 338, 143);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (678, 339, 143);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (679, 340, 143);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (680, 341, 143);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (681, 342, 143);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (682, 343, 143);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (683, 344, 144);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (684, 345, 144);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (685, 346, 144);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (686, 347, 144);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (687, 348, 144);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (688, 349, 144);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (689, 350, 144);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (690, 351, 144);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (691, 352, 144);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (692, 353, 144);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (693, 354, 144);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (694, 355, 144);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (695, 356, 144);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (696, 357, 144);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (697, 358, 144);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (698, 359, 145);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (699, 360, 145);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (700, 361, 145);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (701, 362, 145);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (702, 363, 145);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (703, 364, 145);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (704, 365, 145);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (705, 366, 145);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (706, 367, 145);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (707, 368, 145);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (708, 369, 145);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (709, 370, 145);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (710, 371, 145);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (711, 359, 146);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (712, 360, 146);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (713, 361, 146);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (714, 362, 146);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (715, 363, 146);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (716, 364, 146);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (717, 365, 146);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (718, 366, 146);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (719, 367, 146);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (720, 368, 146);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (721, 369, 146);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (722, 370, 146);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (723, 371, 146);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (724, 372, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (725, 373, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (726, 374, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (727, 375, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (728, 376, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (729, 377, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (730, 378, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (731, 379, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (732, 380, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (733, 381, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (734, 382, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (735, 383, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (736, 384, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (737, 385, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (738, 386, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (739, 387, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (740, 388, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (741, 389, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (742, 390, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (743, 372, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (744, 373, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (745, 374, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (746, 375, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (747, 376, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (748, 377, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (749, 378, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (750, 379, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (751, 380, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (752, 381, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (753, 382, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (754, 383, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (755, 384, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (756, 385, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (757, 386, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (758, 387, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (759, 388, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (760, 389, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (761, 390, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (762, 391, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (763, 392, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (764, 393, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (765, 394, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (766, 395, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (767, 396, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (768, 397, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (769, 398, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (770, 399, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (771, 400, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (772, 401, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (773, 402, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (774, 403, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (775, 404, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (776, 405, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (777, 406, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (778, 407, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (779, 408, 121);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (780, 391, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (781, 392, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (782, 393, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (783, 394, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (784, 395, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (785, 396, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (786, 397, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (787, 409, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (788, 399, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (789, 400, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (790, 401, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (791, 402, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (792, 403, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (793, 404, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (794, 405, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (795, 406, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (796, 407, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (797, 408, 122);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (798, 391, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (799, 392, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (800, 393, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (801, 394, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (802, 395, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (803, 396, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (804, 397, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (805, 398, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (806, 399, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (807, 400, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (808, 401, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (809, 403, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (810, 404, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (811, 405, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (812, 406, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (813, 407, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (814, 408, 123);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (815, 410, 147);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (816, 411, 147);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (817, 412, 147);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (818, 413, 147);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (819, 414, 147);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (820, 415, 147);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (821, 416, 147);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (822, 417, 147);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (823, 418, 147);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (824, 419, 147);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (825, 420, 147);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (826, 421, 147);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (827, 422, 147);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (828, 423, 147);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (829, 424, 147);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (830, 410, 148);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (831, 411, 148);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (832, 412, 148);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (833, 414, 148);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (834, 415, 148);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (835, 416, 148);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (836, 417, 148);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (837, 418, 148);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (838, 419, 148);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (839, 420, 148);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (840, 421, 148);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (841, 422, 148);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (842, 423, 148);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (843, 424, 148);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (844, 425, 149);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (845, 426, 149);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (846, 427, 149);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (847, 428, 149);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (848, 429, 149);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (849, 430, 149);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (850, 431, 149);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (851, 432, 149);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (852, 433, 149);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (853, 434, 149);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (854, 435, 149);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (855, 436, 149);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (856, 437, 149);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (857, 438, 149);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (858, 439, 149);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (859, 440, 149);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (860, 441, 149);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (861, 442, 149);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (862, 443, 150);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (863, 444, 150);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (864, 445, 150);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (865, 446, 150);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (866, 447, 150);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (867, 448, 150);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (868, 449, 150);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (869, 450, 150);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (870, 451, 150);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (871, 452, 150);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (872, 453, 150);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (873, 454, 150);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (874, 455, 150);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (875, 456, 150);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (876, 457, 151);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (877, 458, 151);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (878, 459, 151);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (879, 460, 151);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (880, 461, 151);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (881, 462, 151);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (882, 463, 151);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (883, 464, 151);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (884, 465, 151);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (885, 466, 151);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (886, 467, 151);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (887, 468, 151);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (888, 469, 151);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (889, 470, 151);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (890, 471, 151);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (891, 472, 151);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (892, 473, 151);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (893, 474, 151);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (894, 457, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (895, 458, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (896, 459, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (897, 475, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (898, 460, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (899, 461, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (900, 462, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (901, 463, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (902, 464, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (903, 465, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (904, 466, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (905, 467, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (906, 468, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (907, 469, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (908, 476, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (909, 470, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (910, 471, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (911, 472, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (912, 473, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (913, 474, 152);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (914, 477, 153);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (915, 478, 153);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (916, 479, 153);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (917, 480, 153);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (918, 481, 153);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (919, 482, 153);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (920, 483, 153);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (921, 484, 153);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (922, 485, 153);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (923, 486, 153);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (924, 487, 153);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (925, 488, 153);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (926, 489, 153);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (927, 490, 153);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (928, 491, 153);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (929, 492, 153);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (930, 493, 154);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (931, 494, 154);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (932, 495, 154);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (933, 496, 154);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (934, 497, 154);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (935, 498, 154);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (936, 499, 154);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (937, 500, 154);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (938, 501, 154);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (939, 502, 154);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (940, 503, 154);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (941, 504, 154);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (942, 505, 154);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (943, 506, 154);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (944, 507, 154);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (945, 508, 155);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (946, 509, 155);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (947, 510, 155);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (948, 511, 155);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (949, 512, 155);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (950, 513, 155);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (951, 514, 155);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (952, 515, 155);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (953, 516, 155);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (954, 517, 155);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (955, 518, 155);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (956, 519, 155);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (957, 520, 155);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (958, 521, 155);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (959, 522, 155);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (960, 523, 155);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (961, 524, 155);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (962, 525, 155);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (963, 508, 156);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (964, 509, 156);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (965, 510, 156);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (966, 512, 156);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (967, 513, 156);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (968, 514, 156);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (969, 515, 156);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (970, 516, 156);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (971, 517, 156);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (972, 518, 156);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (973, 519, 156);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (974, 520, 156);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (975, 521, 156);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (976, 522, 156);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (977, 523, 156);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (978, 524, 156);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (979, 525, 156);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (980, 508, 157);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (981, 509, 157);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (982, 510, 157);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (983, 512, 157);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (984, 513, 157);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (985, 514, 157);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (986, 515, 157);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (987, 516, 157);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (988, 517, 157);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (989, 518, 157);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (990, 519, 157);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (991, 520, 157);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (992, 521, 157);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (993, 522, 157);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (994, 523, 157);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (995, 524, 157);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (996, 525, 157);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (997, 508, 158);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (998, 509, 158);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (999, 510, 158);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1000, 512, 158);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1001, 513, 158);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1002, 514, 158);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1003, 515, 158);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1004, 516, 158);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1005, 517, 158);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1006, 518, 158);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1007, 519, 158);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1008, 520, 158);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1009, 521, 158);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1010, 522, 158);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1011, 523, 158);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1012, 524, 158);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1013, 525, 158);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1014, 508, 159);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1015, 509, 159);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1016, 510, 159);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1017, 512, 159);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1018, 513, 159);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1019, 514, 159);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1020, 515, 159);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1021, 516, 159);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1022, 517, 159);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1023, 518, 159);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1024, 519, 159);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1025, 520, 159);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1026, 521, 159);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1027, 522, 159);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1028, 523, 159);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1029, 524, 159);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1030, 525, 159);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1031, 508, 160);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1032, 509, 160);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1033, 510, 160);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1034, 512, 160);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1035, 513, 160);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1036, 514, 160);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1037, 515, 160);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1038, 516, 160);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1039, 517, 160);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1040, 518, 160);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1041, 519, 160);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1042, 520, 160);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1043, 521, 160);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1044, 522, 160);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1045, 523, 160);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1046, 524, 160);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1047, 525, 160);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1048, 526, 161);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1049, 527, 161);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1050, 528, 161);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1051, 529, 161);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1052, 530, 161);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1053, 531, 161);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1054, 532, 161);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1055, 533, 161);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1056, 534, 161);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1057, 535, 161);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1058, 536, 161);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1059, 537, 161);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1060, 538, 161);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1061, 539, 161);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1062, 540, 161);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1063, 541, 162);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1064, 542, 162);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1065, 543, 162);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1066, 544, 162);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1067, 545, 162);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1068, 546, 162);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1069, 547, 162);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1070, 548, 162);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1071, 549, 162);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1072, 550, 162);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1073, 551, 162);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1074, 552, 162);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1075, 553, 162);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1076, 554, 162);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1077, 555, 162);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1078, 556, 162);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1079, 541, 163);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1080, 542, 163);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1081, 543, 163);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1082, 557, 163);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1083, 544, 163);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1084, 545, 163);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1085, 546, 163);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1086, 547, 163);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1087, 548, 163);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1088, 549, 163);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1089, 550, 163);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1090, 551, 163);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1091, 552, 163);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1092, 553, 163);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1093, 554, 163);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1094, 555, 163);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1095, 556, 163);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1096, 541, 164);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1097, 542, 164);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1098, 543, 164);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1099, 557, 164);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1100, 544, 164);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1101, 545, 164);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1102, 546, 164);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1103, 547, 164);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1104, 548, 164);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1105, 549, 164);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1106, 550, 164);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1107, 551, 164);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1108, 552, 164);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1109, 553, 164);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1110, 554, 164);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1111, 555, 164);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1112, 556, 164);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1113, 541, 165);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1114, 542, 165);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1115, 543, 165);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1116, 544, 165);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1117, 545, 165);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1118, 546, 165);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1119, 547, 165);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1120, 548, 165);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1121, 549, 165);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1122, 550, 165);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1123, 551, 165);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1124, 552, 165);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1125, 553, 165);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1126, 554, 165);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1127, 555, 165);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1128, 556, 165);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1129, 541, 166);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1130, 542, 166);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1131, 543, 166);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1132, 557, 166);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1133, 544, 166);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1134, 545, 166);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1135, 546, 166);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1136, 547, 166);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1137, 548, 166);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1138, 549, 166);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1139, 550, 166);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1140, 551, 166);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1141, 552, 166);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1142, 553, 166);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1143, 554, 166);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1144, 555, 166);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1145, 556, 166);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1146, 558, 167);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1147, 559, 167);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1148, 560, 167);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1149, 561, 167);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1150, 562, 167);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1151, 563, 167);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1152, 564, 167);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1153, 565, 167);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1154, 566, 167);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1155, 567, 167);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1156, 568, 167);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1157, 569, 167);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1158, 570, 167);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1159, 571, 167);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1160, 572, 167);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1161, 573, 167);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1162, 574, 167);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1163, 575, 167);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1164, 558, 168);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1165, 559, 168);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1166, 560, 168);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1167, 561, 168);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1168, 562, 168);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1169, 563, 168);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1170, 564, 168);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1171, 565, 168);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1172, 566, 168);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1173, 567, 168);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1174, 568, 168);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1175, 569, 168);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1176, 570, 168);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1177, 571, 168);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1178, 572, 168);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1179, 573, 168);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1180, 574, 168);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1181, 575, 168);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1182, 558, 169);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1183, 559, 169);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1184, 560, 169);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1185, 561, 169);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1186, 562, 169);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1187, 563, 169);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1188, 564, 169);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1189, 565, 169);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1190, 566, 169);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1191, 567, 169);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1192, 568, 169);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1193, 569, 169);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1194, 570, 169);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1195, 571, 169);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1196, 572, 169);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1197, 573, 169);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1198, 574, 169);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1199, 575, 169);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1200, 558, 170);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1201, 559, 170);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1202, 560, 170);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1203, 561, 170);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1204, 562, 170);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1205, 563, 170);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1206, 564, 170);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1207, 565, 170);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1208, 566, 170);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1209, 567, 170);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1210, 568, 170);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1211, 569, 170);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1212, 570, 170);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1213, 571, 170);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1214, 572, 170);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1215, 573, 170);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1216, 574, 170);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1217, 575, 170);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1218, 576, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1219, 577, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1220, 578, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1221, 579, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1222, 580, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1223, 581, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1224, 582, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1225, 583, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1226, 584, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1227, 585, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1228, 586, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1229, 587, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1230, 588, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1231, 589, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1232, 590, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1233, 591, 109);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1234, 592, 171);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1235, 593, 171);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1236, 594, 171);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1237, 595, 171);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1238, 596, 171);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1239, 597, 171);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1240, 598, 171);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1241, 599, 171);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1242, 600, 171);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1243, 601, 171);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1244, 602, 171);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1245, 603, 171);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1246, 604, 171);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1247, 605, 171);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1248, 606, 171);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1249, 607, 172);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1250, 608, 172);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1251, 609, 172);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1252, 610, 172);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1253, 611, 172);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1254, 612, 172);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1255, 613, 172);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1256, 614, 172);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1257, 615, 172);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1258, 616, 172);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1259, 617, 172);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1260, 618, 172);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1261, 619, 172);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1262, 620, 172);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1263, 621, 172);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1264, 622, 172);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1265, 623, 172);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1266, 624, 173);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1267, 625, 173);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1268, 626, 173);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1269, 627, 173);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1270, 628, 173);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1271, 629, 173);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1272, 630, 173);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1273, 631, 173);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1274, 632, 173);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1275, 633, 173);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1276, 634, 173);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1277, 635, 173);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1278, 636, 173);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1279, 637, 173);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1280, 638, 173);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1281, 639, 173);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1282, 624, 174);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1283, 625, 174);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1284, 626, 174);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1285, 627, 174);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1286, 628, 174);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1287, 629, 174);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1288, 630, 174);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1289, 631, 174);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1290, 632, 174);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1291, 633, 174);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1292, 634, 174);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1293, 635, 174);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1294, 636, 174);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1295, 637, 174);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1296, 638, 174);
INSERT IGNORE INTO module_groupes (id, module_id, groupe_id) VALUES (1297, 639, 174);






INSERT IGNORE INTO salles (id, code, nom, batiment, capacite) VALUES 
(100, 'S-100', 'Salle Numérique 100', 'Bâtiment A', 24),
(101, 'S-101', 'Atelier 101', 'Bâtiment B', 30),
(102, 'S-102', 'Salle Théorique 102', 'Bâtiment C', 20);

INSERT IGNORE INTO utilisateurs (id, formateur_id, nom, email, username, mot_de_passe, role_id, statut, theme_preference) VALUES 
(100, 100, 'MARIAM OULED BEN BRAHIM', 'mariamouledbenbrahim_100@ofppt.ma', 'mariamouledbenbrahim100', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(101, 101, 'ADIL ZAHRI', 'adilzahri_101@ofppt.ma', 'adilzahri101', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(102, 102, 'SAKINA ELHOURRI', 'sakinaelhourri_102@ofppt.ma', 'sakinaelhourri102', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(103, 103, 'JAOUAD EZZAGHOUB', 'jaouadezzaghoub_103@ofppt.ma', 'jaouadezzaghoub103', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(104, 104, 'MARIAM AMYN', 'mariamamyn_104@ofppt.ma', 'mariamamyn104', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(105, 105, 'MOHAMED ASSADE', 'mohamedassade_105@ofppt.ma', 'mohamedassade105', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(106, 106, 'NADIA BEKHOUCH', 'nadiabekhouch_106@ofppt.ma', 'nadiabekhouch106', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(107, 107, 'ZAINEB LAHMIDI', 'zaineblahmidi_107@ofppt.ma', 'zaineblahmidi107', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(108, 108, 'SIHAM HOUMADY', 'sihamhoumady_108@ofppt.ma', 'sihamhoumady108', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(109, 109, 'ANASS BENHASSOU', 'anassbenhassou_109@ofppt.ma', 'anassbenhassou109', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(110, 110, 'OMAR OUAFIDI', 'omarouafidi_110@ofppt.ma', 'omarouafidi110', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(111, 111, 'ABDELMOULA KAKA', 'abdelmoulakaka_111@ofppt.ma', 'abdelmoulakaka111', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(112, 112, 'HANANE ESSAHLI', 'hananeessahli_112@ofppt.ma', 'hananeessahli112', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(113, 113, 'LAMIAE ELHAISSOUK', 'lamiaeelhaissouk_113@ofppt.ma', 'lamiaeelhaissouk113', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(114, 114, 'SARA AIT-IJJA', 'saraait-ijja_114@ofppt.ma', 'saraait-ijja114', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(115, 115, 'SAMI MAHFOUD', 'samimahfoud_115@ofppt.ma', 'samimahfoud115', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(116, 116, 'HAJAR GADDARINE', 'hajargaddarine_116@ofppt.ma', 'hajargaddarine116', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(117, 117, 'MOUHSSINE HOU', 'mouhssinehou_117@ofppt.ma', 'mouhssinehou117', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(118, 118, 'HOUDA LABAZI', 'houdalabazi_118@ofppt.ma', 'houdalabazi118', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(119, 119, 'SAMIR CHBERREQ', 'samirchberreq_119@ofppt.ma', 'samirchberreq119', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(120, 120, 'FIRDAOUS OUYIDIR', 'firdaousouyidir_120@ofppt.ma', 'firdaousouyidir120', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(121, 121, 'BASMA LAFHAL', 'basmalafhal_121@ofppt.ma', 'basmalafhal121', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(122, 122, 'MOURAD BELHADJ', 'mouradbelhadj_122@ofppt.ma', 'mouradbelhadj122', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(123, 123, 'SABAH HALLOUTY', 'sabahhallouty_123@ofppt.ma', 'sabahhallouty123', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(124, 124, 'HANAE HAMZAOUI', 'hanaehamzaoui_124@ofppt.ma', 'hanaehamzaoui124', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(125, 125, 'ASMAA ZORGUI', 'asmaazorgui_125@ofppt.ma', 'asmaazorgui125', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(126, 126, 'ZAHRA SALOHI', 'zahrasalohi_126@ofppt.ma', 'zahrasalohi126', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(127, 127, 'FATIMA-EZZAHRA SAADOUNI', 'fatima-ezzahrasaadouni_127@ofppt.ma', 'fatima-ezzahrasaadouni127', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(128, 128, 'FATIMA ZAHRA BOUCHIKHI', 'fatimazahrabouchikhi_128@ofppt.ma', 'fatimazahrabouchikhi128', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(129, 129, 'SABRINE OUAJIDI', 'sabrineouajidi_129@ofppt.ma', 'sabrineouajidi129', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(130, 130, 'LAYLA CHEMLAL', 'laylachemlal_130@ofppt.ma', 'laylachemlal130', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(131, 131, 'HAMZA CHAHID', 'hamzachahid_131@ofppt.ma', 'hamzachahid131', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(132, 132, 'NOUREDDINE RIFFI', 'noureddineriffi_132@ofppt.ma', 'noureddineriffi132', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(133, 133, 'SAFA LAARAJ', 'safalaaraj_133@ofppt.ma', 'safalaaraj133', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(134, 134, 'SAID AIT ELHAROUACH', 'saidaitelharouach_134@ofppt.ma', 'saidaitelharouach134', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(135, 135, 'CHAIMAE YETTIFTI GAROUCH', 'chaimaeyettiftigarouch_135@ofppt.ma', 'chaimaeyettiftigarouch135', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(136, 136, 'AOUZAL AYMAN', 'aouzalayman_136@ofppt.ma', 'aouzalayman136', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(137, 137, 'HANANE EL FADILI', 'hananeelfadili_137@ofppt.ma', 'hananeelfadili137', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(138, 138, 'RIM TAJEDDINE', 'rimtajeddine_138@ofppt.ma', 'rimtajeddine138', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(139, 139, 'HALIMA EZAHIDI', 'halimaezahidi_139@ofppt.ma', 'halimaezahidi139', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(140, 140, 'YOUSRA SAID', 'yousrasaid_140@ofppt.ma', 'yousrasaid140', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(141, 141, 'MOHAMMED ZAKI BELAHBIB', 'mohammedzakibelahbib_141@ofppt.ma', 'mohammedzakibelahbib141', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(142, 142, 'KAWTAR MESRAR', 'kawtarmesrar_142@ofppt.ma', 'kawtarmesrar142', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(143, 143, 'CHAIMAA RABTI', 'chaimaarabti_143@ofppt.ma', 'chaimaarabti143', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(144, 144, 'SOUMIA RAOUF', 'soumiaraouf_144@ofppt.ma', 'soumiaraouf144', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(145, 145, 'YOUSSEF IGUELD', 'youssefigueld_145@ofppt.ma', 'youssefigueld145', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(146, 146, 'MOUNA DALLI', 'mounadalli_146@ofppt.ma', 'mounadalli146', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(147, 147, 'MOHAMED SAAD LAABORI', 'mohamedsaadlaabori_147@ofppt.ma', 'mohamedsaadlaabori147', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(148, 148, 'SALMA EL AATID', 'salmaelaatid_148@ofppt.ma', 'salmaelaatid148', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(149, 149, 'SOHAYB RIFI', 'sohaybrifi_149@ofppt.ma', 'sohaybrifi149', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(150, 150, 'WAFAA ADOUI', 'wafaaadoui_150@ofppt.ma', 'wafaaadoui150', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(151, 151, 'ISSAM ELOUALI', 'issamelouali_151@ofppt.ma', 'issamelouali151', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(152, 152, 'KHALID MAGOUANI', 'khalidmagouani_152@ofppt.ma', 'khalidmagouani152', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(153, 153, 'AYMANE EZZAIM', 'aymaneezzaim_153@ofppt.ma', 'aymaneezzaim153', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(154, 154, 'LARBI ZROUALI', 'larbizrouali_154@ofppt.ma', 'larbizrouali154', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(155, 155, 'MOURAD FAZAZI', 'mouradfazazi_155@ofppt.ma', 'mouradfazazi155', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(156, 156, 'ABDERRAHIM TANFOUSS', 'abderrahimtanfouss_156@ofppt.ma', 'abderrahimtanfouss156', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(157, 157, 'MERIEM MASROUR', 'meriemmasrour_157@ofppt.ma', 'meriemmasrour157', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(158, 158, 'SELMA AIT BELLA', 'selmaaitbella_158@ofppt.ma', 'selmaaitbella158', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(159, 159, 'SARA TALHA', 'saratalha_159@ofppt.ma', 'saratalha159', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(160, 160, 'HICHAM AIT EL HADJ', 'hichamaitelhadj_160@ofppt.ma', 'hichamaitelhadj160', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(161, 161, 'AMINE FILALI ANSARI', 'aminefilaliansari_161@ofppt.ma', 'aminefilaliansari161', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(162, 162, 'OTHMANE ABALI', 'othmaneabali_162@ofppt.ma', 'othmaneabali162', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(163, 163, 'RAJAE LAKHAL', 'rajaelakhal_163@ofppt.ma', 'rajaelakhal163', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(164, 164, 'MOHAMMED GOUMIH', 'mohammedgoumih_164@ofppt.ma', 'mohammedgoumih164', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(165, 165, 'KAOUTAR ELBENNANI', 'kaoutarelbennani_165@ofppt.ma', 'kaoutarelbennani165', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(166, 166, 'ELMEHDI KORCHI', 'elmehdikorchi_166@ofppt.ma', 'elmehdikorchi166', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(167, 167, 'ANASS LAZRAQ', 'anasslazraq_167@ofppt.ma', 'anasslazraq167', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(168, 168, 'IMANE ACHERRAT', 'imaneacherrat_168@ofppt.ma', 'imaneacherrat168', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(169, 169, 'SALAHEDDINE LAARAJ', 'salaheddinelaaraj_169@ofppt.ma', 'salaheddinelaaraj169', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(170, 170, 'RACHID EL BERKAOUI ALAOUI', 'rachidelberkaouialaoui_170@ofppt.ma', 'rachidelberkaouialaoui170', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(171, 171, 'ZAKARIA BENZYANE', 'zakariabenzyane_171@ofppt.ma', 'zakariabenzyane171', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(172, 172, 'SALMA KAMILIA BENCHANAA', 'salmakamiliabenchanaa_172@ofppt.ma', 'salmakamiliabenchanaa172', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(173, 173, 'TARIK BAAMMAR', 'tarikbaammar_173@ofppt.ma', 'tarikbaammar173', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(174, 174, 'BEN CHERQUI M''HAMED', 'bencherquimhamed_174@ofppt.ma', 'bencherquimhamed174', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(175, 175, 'BENAMMOU ABDESSAMAD', 'benammouabdessamad_175@ofppt.ma', 'benammouabdessamad175', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(176, 176, 'EL BAKKALI Mohamed', 'elbakkalimohamed_176@ofppt.ma', 'elbakkalimohamed176', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(177, 177, 'SABER HAMZA', 'saberhamza_177@ofppt.ma', 'saberhamza177', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(178, 178, 'KELLA OMAR', 'kellaomar_178@ofppt.ma', 'kellaomar178', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(179, 179, 'SAOUD SAAD', 'saoudsaad_179@ofppt.ma', 'saoudsaad179', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(180, 180, 'MILOUDI OUALID', 'miloudioualid_180@ofppt.ma', 'miloudioualid180', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(181, 181, 'EL MOUDEN ABDELAZIZ', 'elmoudenabdelaziz_181@ofppt.ma', 'elmoudenabdelaziz181', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(182, 182, 'IKRAM AZIZI', 'ikramazizi_182@ofppt.ma', 'ikramazizi182', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(183, 183, 'KAOUTAR MAKHLOUFI', 'kaoutarmakhloufi_183@ofppt.ma', 'kaoutarmakhloufi183', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(184, 184, 'SAMIRA CHEBLI', 'samirachebli_184@ofppt.ma', 'samirachebli184', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(185, 185, 'MOHAMMED ENNAMRI', 'mohammedennamri_185@ofppt.ma', 'mohammedennamri185', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(186, 186, 'BRAHIM MILI', 'brahimmili_186@ofppt.ma', 'brahimmili186', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(187, 187, 'YOUSSEF ABOUTARA BELRHITI', 'youssefaboutarabelrhiti_187@ofppt.ma', 'youssefaboutarabelrhiti187', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(188, 188, 'KARIMA BOUDI', 'karimaboudi_188@ofppt.ma', 'karimaboudi188', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(189, 189, 'ABDESSAMAD KAMLI', 'abdessamadkamli_189@ofppt.ma', 'abdessamadkamli189', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(190, 190, 'AYOUB ABDELMOUTTALIB', 'ayoubabdelmouttalib_190@ofppt.ma', 'ayoubabdelmouttalib190', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(191, 191, 'ABDELMAJID EL HENNIOUI', 'abdelmajidelhennioui_191@ofppt.ma', 'abdelmajidelhennioui191', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(192, 192, 'KAMAL DAIF', 'kamaldaif_192@ofppt.ma', 'kamaldaif192', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(193, 193, 'ABDELHAKIM EL KABBAY', 'abdelhakimelkabbay_193@ofppt.ma', 'abdelhakimelkabbay193', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(194, 194, 'HANANE SALLAH', 'hananesallah_194@ofppt.ma', 'hananesallah194', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(195, 195, 'IMANE BEN OMAR', 'imanebenomar_195@ofppt.ma', 'imanebenomar195', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(196, 196, 'OUSSAMA LAKMALE', 'oussamalakmale_196@ofppt.ma', 'oussamalakmale196', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(197, 197, 'AMINA EL OUMARY', 'aminaeloumary_197@ofppt.ma', 'aminaeloumary197', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(198, 198, 'ZINEB BENHOUMAID', 'zinebbenhoumaid_198@ofppt.ma', 'zinebbenhoumaid198', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(199, 199, 'FATIMA ZOHRA HRIBANE', 'fatimazohrahribane_199@ofppt.ma', 'fatimazohrahribane199', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(200, 200, 'NOURA BELAJI', 'nourabelaji_200@ofppt.ma', 'nourabelaji200', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(201, 201, 'YASSINE HIKMI', 'yassinehikmi_201@ofppt.ma', 'yassinehikmi201', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(202, 202, 'ZAKARIA DKHISSI', 'zakariadkhissi_202@ofppt.ma', 'zakariadkhissi202', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(203, 203, 'WAFAA EL QUACHANI', 'wafaaelquachani_203@ofppt.ma', 'wafaaelquachani203', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(204, 204, 'ALI ELJIKOUNI', 'alieljikouni_204@ofppt.ma', 'alieljikouni204', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(205, 205, 'FOUAD EL YEBADRI', 'fouadelyebadri_205@ofppt.ma', 'fouadelyebadri205', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(206, 206, 'HAJAR ZEJLI', 'hajarzejli_206@ofppt.ma', 'hajarzejli206', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(207, 207, 'YOUNES ELKAMARI', 'youneselkamari_207@ofppt.ma', 'youneselkamari207', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(208, 208, 'NAHID MOUSTAKIM', 'nahidmoustakim_208@ofppt.ma', 'nahidmoustakim208', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(209, 209, 'MOHAMED AIT LAHOUCINE', 'mohamedaitlahoucine_209@ofppt.ma', 'mohamedaitlahoucine209', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(210, 210, 'TOURIA SALHI', 'touriasalhi_210@ofppt.ma', 'touriasalhi210', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(211, 211, 'RACHID THABIT', 'rachidthabit_211@ofppt.ma', 'rachidthabit211', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(212, 212, 'JAMILA ABOUDRAR', 'jamilaaboudrar_212@ofppt.ma', 'jamilaaboudrar212', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(213, 213, 'MOHAMED AMINE OUAISSI', 'mohamedamineouaissi_213@ofppt.ma', 'mohamedamineouaissi213', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(214, 214, 'ZINEB GUENNOUNI HASSANI', 'zinebguennounihassani_214@ofppt.ma', 'zinebguennounihassani214', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(215, 215, 'MERYEM BAJOUDI', 'meryembajoudi_215@ofppt.ma', 'meryembajoudi215', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(216, 216, 'WASSIM LECHGUER', 'wassimlechguer_216@ofppt.ma', 'wassimlechguer216', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(217, 217, 'YASSINE MAGHFOUL', 'yassinemaghfoul_217@ofppt.ma', 'yassinemaghfoul217', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(218, 218, 'YASSINE MOUHETTA', 'yassinemouhetta_218@ofppt.ma', 'yassinemouhetta218', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(219, 219, 'ZAINEB TROKY', 'zainebtroky_219@ofppt.ma', 'zainebtroky219', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(220, 220, 'MOHAMMED EL MEHDI RIDA', 'mohammedelmehdirida_220@ofppt.ma', 'mohammedelmehdirida220', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(221, 221, 'SOUKAINA GOUNINE', 'soukainagounine_221@ofppt.ma', 'soukainagounine221', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(222, 222, 'MEHDI BOUKIL', 'mehdiboukil_222@ofppt.ma', 'mehdiboukil222', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(223, 223, 'MOHAMED LAHLOU', 'mohamedlahlou_223@ofppt.ma', 'mohamedlahlou223', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(224, 224, 'KAWTAR CHENNADI', 'kawtarchennadi_224@ofppt.ma', 'kawtarchennadi224', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(225, 225, 'HAMZA RHNIA', 'hamzarhnia_225@ofppt.ma', 'hamzarhnia225', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(226, 226, 'HAMZA IFKIRANE', 'hamzaifkirane_226@ofppt.ma', 'hamzaifkirane226', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(227, 227, 'AMINE OUARROUCH', 'amineouarrouch_227@ofppt.ma', 'amineouarrouch227', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(228, 228, 'SOUKAINA BOUBRAHMI', 'soukainaboubrahmi_228@ofppt.ma', 'soukainaboubrahmi228', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(229, 229, 'ZINEB ES-SAMI', 'zinebes-sami_229@ofppt.ma', 'zinebes-sami229', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(230, 230, 'OUAJIDI SABRINE', 'ouajidisabrine_230@ofppt.ma', 'ouajidisabrine230', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light'),
(231, 231, 'MOHAMED AMINE BOUDNIB', 'mohamedamineboudnib_231@ofppt.ma', 'mohamedamineboudnib231', '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.', 3, 'actif', 'light');

INSERT IGNORE INTO planning (id, formateur_id, module_id, semaine, heures) VALUES 
(100, 100, 100, 11, 4.00),
(101, 100, 100, 11, 6.00),
(102, 101, 101, 11, 8.00);

INSERT IGNORE INTO planning_sessions (id, formateur_id, module_id, groupe_id, salle_id, week_number, day_of_week, start_time, end_time, status) VALUES 
(100, 100, 100, 100, 100, 11, 1, '08:30:00', '12:30:00', 'validated'),
(101, 100, 100, 100, 101, 11, 2, '14:30:00', '18:30:00', 'scheduled'),
(102, 101, 101, 101, 102, 11, 3, '08:30:00', '14:30:00', 'confirmed');

INSERT IGNORE INTO evaluation_questionnaires (id, title) VALUES (100, 'Évaluation Excel Demo');
INSERT IGNORE INTO evaluation_questions (id, questionnaire_id, question_text, type) VALUES 
(100, 100, 'Le formateur maitrise le contenu?', 'rating'),
(101, 100, 'Respect des horaires?', 'yes/no');

INSERT IGNORE INTO evaluation_answers (id, formateur_id, module_id, question_id, value) VALUES
(100, 100, 100, 100, '4'),
(101, 100, 100, 101, 'yes');

INSERT IGNORE INTO evaluation_scores (id, formateur_id, module_id, total_score, max_score, percentage) VALUES
(100, 100, 100, 8.00, 10.00, 80.00);

INSERT IGNORE INTO ai_scores (id, formateur_id, module_id, score, reason) VALUES 
(100, 100, 100, 85.50, '{"competence":4, "notes":["Good pedagogical skills"]}'),
(101, 101, 101, 92.00, '{"competence":5, "notes":["Expert in domain"]}');

INSERT IGNORE INTO recent_activities (id, formateur_id, module_id, action_label, action_description) VALUES 
(100, 100, 100, 'Session validée', 'Le directeur a validé la session de lundi.'),
(101, 101, 101, 'Note ajoutée', 'Score AI calculé pour ce formateur.');

INSERT IGNORE INTO reports (id, type, format, title, file_path) VALUES
(100, 'workload', 'pdf', 'Rapport Charge Demo', '/storage/reports/demo.pdf');




COMMIT;

SET FOREIGN_KEY_CHECKS = 1;

ALTER TABLE `formateurs`
  ADD INDEX `idx_formateurs_nom` (`nom`),
  ADD INDEX `idx_formateurs_email_specialite` (`email`,`specialite`),
  ADD INDEX `idx_formateurs_nom_email_specialite` (`nom`,`email`,`specialite`);

ALTER TABLE `modules`
  ADD INDEX `idx_modules_intitule` (`intitule`),
  ADD INDEX `idx_modules_code_filiere_semestre` (`code`,`filiere`,`semestre`),
  ADD INDEX `idx_modules_search_catalog` (`filiere`,`intitule`,`code`),
  ADD INDEX `idx_modules_semestre_efm` (`semestre`,`has_efm`);

ALTER TABLE `groupes`
  ADD INDEX `idx_groupes_code` (`code`),
  ADD INDEX `idx_groupes_search_catalog` (`code`,`nom`,`filiere`);

ALTER TABLE `utilisateurs`
  ADD INDEX `idx_utilisateurs_role_statut` (`role_id`,`statut`),
  ADD INDEX `idx_utilisateurs_email_role_statut` (`email`,`role_id`,`statut`);

ALTER TABLE `planning_submissions`
  ADD INDEX `idx_planning_submissions_status_year_week` (`status`,`academic_year`,`semaine`),
  ADD INDEX `idx_planning_submissions_formateur_year_week` (`formateur_id`,`academic_year`,`semaine`);

ALTER TABLE `planning_change_requests`
  ADD INDEX `idx_change_requests_status_year_created` (`status`,`academic_year`,`created_at`),
  ADD INDEX `idx_change_requests_formateur_year_week` (`formateur_id`,`academic_year`,`request_week`);

ALTER TABLE `planning_sessions`
  ADD INDEX `idx_planning_sessions_formateur_week_status` (`formateur_id`,`week_number`,`status`),
  ADD INDEX `idx_planning_sessions_module_week_status` (`module_id`,`week_number`,`status`),
  ADD INDEX `idx_planning_sessions_session_date_status_formateur` (`session_date`,`status`,`formateur_id`),
  ADD INDEX `idx_planning_sessions_validated_by` (`validated_by`);

ALTER TABLE `recent_activities`
  ADD INDEX `idx_recent_activities_created_at` (`created_at`),
  ADD INDEX `idx_recent_activities_tone_created_at` (`action_tone`,`created_at`),
  ADD INDEX `idx_recent_activities_module_created_at` (`module_id`,`created_at`);

ALTER TABLE `request_throttles`
  ADD INDEX `idx_request_throttles_cleanup` (`blocked_until`,`last_attempt_at`,`updated_at`),
  ADD INDEX `idx_request_throttles_action_blocked_until` (`action_key`,`blocked_until`);

ALTER TABLE `reports`
  ADD INDEX `idx_reports_generated_by` (`generated_by`);

DROP EVENT IF EXISTS `ev_nightly_cleanup_operational_logs`;

DELIMITER $$

CREATE EVENT `ev_nightly_cleanup_operational_logs`
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURRENT_DATE, '02:15:00')
DO
BEGIN
  DELETE FROM `request_throttles`
  WHERE `blocked_until` IS NOT NULL
    AND `blocked_until` < NOW() - INTERVAL 1 DAY;

  DELETE FROM `request_throttles`
  WHERE `blocked_until` IS NULL
    AND `last_attempt_at` < NOW() - INTERVAL 14 DAY;

  DELETE FROM `recent_activities`
  WHERE `created_at` < NOW() - INTERVAL 90 DAY;
END$$

DELIMITER ;
