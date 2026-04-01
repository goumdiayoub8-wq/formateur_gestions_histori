ALTER TABLE `module_questionnaires`
  ADD COLUMN `questionnaire_token` varchar(64) DEFAULT NULL AFTER `questionnaire_id`;

UPDATE `module_questionnaires`
SET `questionnaire_token` = LOWER(HEX(RANDOM_BYTES(24)))
WHERE `questionnaire_token` IS NULL OR TRIM(`questionnaire_token`) = '';

ALTER TABLE `module_questionnaires`
  ADD UNIQUE KEY `uq_module_questionnaires_token` (`questionnaire_token`);

ALTER TABLE `evaluation_answers`
  ADD COLUMN `module_id` int DEFAULT NULL AFTER `formateur_id`,
  ADD KEY `idx_answers_formateur` (`formateur_id`),
  ADD UNIQUE KEY `uq_answers_formateur_module_question` (`formateur_id`, `module_id`, `question_id`),
  ADD KEY `idx_answers_module` (`module_id`);

ALTER TABLE `evaluation_answers`
  DROP INDEX `uq_answers_formateur_question`;

ALTER TABLE `evaluation_scores`
  ADD COLUMN `module_id` int DEFAULT NULL AFTER `formateur_id`,
  ADD KEY `idx_scores_formateur` (`formateur_id`),
  ADD UNIQUE KEY `uq_scores_formateur_module` (`formateur_id`, `module_id`),
  ADD KEY `idx_scores_module` (`module_id`);

ALTER TABLE `evaluation_scores`
  DROP INDEX `uq_scores_formateur`;

ALTER TABLE `evaluation_answers`
  ADD CONSTRAINT `fk_evaluation_answers_module`
    FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `evaluation_scores`
  ADD CONSTRAINT `fk_evaluation_scores_module`
    FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
