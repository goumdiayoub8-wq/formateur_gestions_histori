USE `gestion_formateurs`;

ALTER TABLE `formateurs`
  ADD INDEX `idx_formateurs_nom` (`nom`),
  ADD INDEX `idx_formateurs_nom_email_specialite` (`nom`, `email`, `specialite`);

ALTER TABLE `modules`
  ADD INDEX `idx_modules_intitule` (`intitule`),
  ADD INDEX `idx_modules_search_catalog` (`filiere`, `intitule`, `code`);

ALTER TABLE `groupes`
  ADD INDEX `idx_groupes_code` (`code`),
  ADD INDEX `idx_groupes_search_catalog` (`code`, `nom`, `filiere`);

ALTER TABLE `planning_sessions`
  ADD INDEX `idx_planning_sessions_formateur_week_status` (`formateur_id`, `week_number`, `status`),
  ADD INDEX `idx_planning_sessions_module_week_status` (`module_id`, `week_number`, `status`);

ALTER TABLE `planning_submissions`
  ADD INDEX `idx_planning_submissions_status_year_week` (`status`, `academic_year`, `semaine`),
  ADD INDEX `idx_planning_submissions_formateur_year_week` (`formateur_id`, `academic_year`, `semaine`);

ALTER TABLE `planning_change_requests`
  ADD INDEX `idx_change_requests_status_year_created` (`status`, `academic_year`, `created_at`),
  ADD INDEX `idx_change_requests_formateur_year_week` (`formateur_id`, `academic_year`, `request_week`);

ALTER TABLE `recent_activities`
  ADD INDEX `idx_recent_activities_created_at` (`created_at`),
  ADD INDEX `idx_recent_activities_tone_created_at` (`action_tone`, `created_at`);

ALTER TABLE `request_throttles`
  ADD INDEX `idx_request_throttles_cleanup` (`blocked_until`, `last_attempt_at`, `updated_at`);

SET GLOBAL event_scheduler = ON;

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
