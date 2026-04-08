START TRANSACTION;

SET @academic_year := 2026;
SET @seed_password_hash := '$2y$12$71wcxT22m3nsV61nV0jPiOLUIiEnAvgKnaCQcJQwqqO4uxZ4RnQ5.';

DELETE FROM formateur_module_preferences WHERE formateur_id BETWEEN 101 AND 120;
DELETE FROM evaluation_answers WHERE (formateur_id BETWEEN 101 AND 120 OR formateur_id = 1) AND question_id BETWEEN 10101 AND 10108;
DELETE FROM evaluation_scores WHERE formateur_id BETWEEN 101 AND 120 OR formateur_id = 1;
DELETE FROM evaluation_questions WHERE questionnaire_id = 101;
DELETE FROM evaluation_questionnaires WHERE id = 101;
DELETE FROM recent_activities WHERE id BETWEEN 6001 AND 6020 OR formateur_id BETWEEN 101 AND 120 OR module_id BETWEEN 101 AND 115;
DELETE FROM planning_change_requests WHERE id BETWEEN 4101 AND 4108 OR formateur_id BETWEEN 101 AND 120 OR module_id BETWEEN 101 AND 115;
DELETE FROM planning_submissions WHERE id BETWEEN 4001 AND 4032 OR formateur_id BETWEEN 101 AND 120 OR (formateur_id = 1 AND semaine = 30 AND academic_year = @academic_year);
DELETE FROM planning WHERE formateur_id BETWEEN 101 AND 120 OR module_id BETWEEN 101 AND 115 OR (formateur_id = 1 AND module_id IN (1, 2) AND semaine = 30);
DELETE FROM planning_sessions WHERE id BETWEEN 5001 AND 5060 OR id BETWEEN 5201 AND 5203 OR formateur_id BETWEEN 101 AND 120 OR module_id BETWEEN 101 AND 115 OR groupe_id BETWEEN 101 AND 108 OR salle_id BETWEEN 101 AND 104;
DELETE FROM ai_scores WHERE formateur_id BETWEEN 101 AND 120 OR module_id BETWEEN 101 AND 115;
DELETE FROM formateur_module_scores WHERE formateur_id BETWEEN 101 AND 120 OR module_id BETWEEN 101 AND 115;
DELETE FROM formateur_modules WHERE formateur_id BETWEEN 101 AND 120 OR module_id BETWEEN 101 AND 115;
DELETE FROM affectations WHERE id BETWEEN 2001 AND 2050 OR formateur_id BETWEEN 101 AND 120 OR module_id BETWEEN 101 AND 115;
DELETE FROM module_questionnaires WHERE id BETWEEN 1001 AND 1015 OR module_id BETWEEN 101 AND 115;
DELETE FROM module_groupes WHERE id BETWEEN 1001 AND 1025 OR module_id BETWEEN 101 AND 115 OR groupe_id BETWEEN 101 AND 108;
DELETE FROM utilisateurs WHERE id BETWEEN 101 AND 123 OR formateur_id BETWEEN 101 AND 120;
DELETE FROM salles WHERE id BETWEEN 101 AND 104;
DELETE FROM groupes WHERE id BETWEEN 101 AND 108;
DELETE FROM modules WHERE id BETWEEN 101 AND 115;
DELETE FROM formateurs WHERE id BETWEEN 101 AND 120;

INSERT INTO formateurs (`id`, `nom`, `email`, `telephone`, `specialite`, `max_heures`, `weekly_hours`, `current_hours`, `created_at`, `updated_at`) VALUES
  (101, 'Amina El Idrissi', 'amina.elidrissi@smartlogistics.ma', '+212661000101', 'Supply Chain', 910, 22.00, 168.00, '2025-09-05 08:00:00', NULL),
  (102, 'Youssef Berrada', 'youssef.berrada@smartlogistics.ma', '+212661000102', 'Gestion de projet', 910, 18.00, 126.00, '2025-09-05 08:05:00', NULL),
  (103, 'Imane Sqalli', 'imane.sqalli@smartlogistics.ma', '+212661000103', 'Achats et approvisionnement', 910, 20.00, 134.00, '2025-09-05 08:10:00', NULL),
  (104, 'Mehdi Amrani', 'mehdi.amrani@smartlogistics.ma', '+212661000104', 'Data Science', 910, 24.00, 178.00, '2025-09-05 08:15:00', NULL),
  (105, 'Salma Bennani', 'salma.bennani@smartlogistics.ma', '+212661000105', 'Communication professionnelle', 910, 16.00, 102.00, '2025-09-05 08:20:00', NULL),
  (106, 'Hamza El Fassi', 'hamza.elfassi@smartlogistics.ma', '+212661000106', 'Machine Learning', 910, 22.00, 151.00, '2025-09-05 08:25:00', NULL),
  (107, 'Kawtar Mernissi', 'kawtar.mernissi@smartlogistics.ma', '+212661000107', 'Business Intelligence', 910, 20.00, 143.00, '2025-09-05 08:30:00', NULL),
  (108, 'Ayoub Chraibi', 'ayoub.chraibi@smartlogistics.ma', '+212661000108', 'Frontend React', 910, 24.00, 182.00, '2025-09-05 08:35:00', NULL),
  (109, 'Sara Lahlou', 'sara.lahlou@smartlogistics.ma', '+212661000109', 'Bases de donnees', 910, 21.00, 149.00, '2025-09-05 08:40:00', NULL),
  (110, 'Zakaria Benjelloun', 'zakaria.benjelloun@smartlogistics.ma', '+212661000110', 'WMS et TMS', 910, 23.00, 171.00, '2025-09-05 08:45:00', NULL),
  (111, 'Oumaima Naciri', 'oumaima.naciri@smartlogistics.ma', '+212661000111', 'ERP Odoo', 910, 21.00, 156.00, '2025-09-05 08:50:00', NULL),
  (112, 'Anas Ait Lahcen', 'anas.aitlahcen@smartlogistics.ma', '+212661000112', 'Backend PHP API', 910, 24.00, 184.00, '2025-09-05 08:55:00', NULL),
  (113, 'Hind El Mansouri', 'hind.elmansouri@smartlogistics.ma', '+212661000113', 'Infrastructure et cloud', 910, 20.00, 138.00, '2025-09-05 09:00:00', NULL),
  (114, 'Yassir Boussaid', 'yassir.boussaid@smartlogistics.ma', '+212661000114', 'ERP logistique', 910, 19.00, 132.00, '2025-09-05 09:05:00', NULL),
  (115, 'Meryem Tazi', 'meryem.tazi@smartlogistics.ma', '+212661000115', 'Data visualisation', 910, 19.00, 141.00, '2025-09-05 09:10:00', NULL),
  (116, 'Reda Ouhammou', 'reda.ouhammou@smartlogistics.ma', '+212661000116', 'Transport et douane', 910, 22.00, 165.00, '2025-09-05 09:15:00', NULL),
  (117, 'Soukaina Ait Ali', 'soukaina.aitali@smartlogistics.ma', '+212661000117', 'Logistique urbaine', 910, 22.00, 158.00, '2025-09-05 09:20:00', NULL),
  (118, 'Bilal Skalli', 'bilal.skalli@smartlogistics.ma', '+212661000118', 'Cybersecurite reseaux', 910, 18.00, 122.00, '2025-09-05 09:25:00', NULL),
  (119, 'Nabila Ouarzazi', 'nabila.ouarzazi@smartlogistics.ma', '+212661000119', 'Pedagogie digitale', 910, 17.00, 118.00, '2025-09-05 09:30:00', NULL),
  (120, 'Adil Lamrani', 'adil.lamrani@smartlogistics.ma', '+212661000120', 'Integrations et API', 910, 24.00, 176.00, '2025-09-05 09:35:00', NULL);

INSERT INTO utilisateurs (`id`, `formateur_id`, `nom`, `email`, `username`, `photo`, `mot_de_passe`, `reset_token`, `reset_token_expiration`, `role_id`, `statut`, `theme_preference`, `created_at`) VALUES
  (101, 101, 'Amina El Idrissi', 'amina.elidrissi@smartlogistics.ma', 'amina.elidrissi', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:00:00'),
  (102, 102, 'Youssef Berrada', 'youssef.berrada@smartlogistics.ma', 'youssef.berrada', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:02:00'),
  (103, 103, 'Imane Sqalli', 'imane.sqalli@smartlogistics.ma', 'imane.sqalli', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:04:00'),
  (104, 104, 'Mehdi Amrani', 'mehdi.amrani@smartlogistics.ma', 'mehdi.amrani', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:06:00'),
  (105, 105, 'Salma Bennani', 'salma.bennani@smartlogistics.ma', 'salma.bennani', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:08:00'),
  (106, 106, 'Hamza El Fassi', 'hamza.elfassi@smartlogistics.ma', 'hamza.elfassi', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:10:00'),
  (107, 107, 'Kawtar Mernissi', 'kawtar.mernissi@smartlogistics.ma', 'kawtar.mernissi', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:12:00'),
  (108, 108, 'Ayoub Chraibi', 'ayoub.chraibi@smartlogistics.ma', 'ayoub.chraibi', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:14:00'),
  (109, 109, 'Sara Lahlou', 'sara.lahlou@smartlogistics.ma', 'sara.lahlou', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:16:00'),
  (110, 110, 'Zakaria Benjelloun', 'zakaria.benjelloun@smartlogistics.ma', 'zakaria.benjelloun', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:18:00'),
  (111, 111, 'Oumaima Naciri', 'oumaima.naciri@smartlogistics.ma', 'oumaima.naciri', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:20:00'),
  (112, 112, 'Anas Ait Lahcen', 'anas.aitlahcen@smartlogistics.ma', 'anas.aitlahcen', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:22:00'),
  (113, 113, 'Hind El Mansouri', 'hind.elmansouri@smartlogistics.ma', 'hind.elmansouri', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:24:00'),
  (114, 114, 'Yassir Boussaid', 'yassir.boussaid@smartlogistics.ma', 'yassir.boussaid', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:26:00'),
  (115, 115, 'Meryem Tazi', 'meryem.tazi@smartlogistics.ma', 'meryem.tazi', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:28:00'),
  (116, 116, 'Reda Ouhammou', 'reda.ouhammou@smartlogistics.ma', 'reda.ouhammou', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:30:00'),
  (117, 117, 'Soukaina Ait Ali', 'soukaina.aitali@smartlogistics.ma', 'soukaina.aitali', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:32:00'),
  (118, 118, 'Bilal Skalli', 'bilal.skalli@smartlogistics.ma', 'bilal.skalli', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:34:00'),
  (119, 119, 'Nabila Ouarzazi', 'nabila.ouarzazi@smartlogistics.ma', 'nabila.ouarzazi', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:36:00'),
  (120, 120, 'Adil Lamrani', 'adil.lamrani@smartlogistics.ma', 'adil.lamrani', NULL, @seed_password_hash, NULL, NULL, 3, 'actif', 'dark', '2025-09-05 10:38:00');

INSERT INTO utilisateurs (`id`, `formateur_id`, `nom`, `email`, `username`, `photo`, `mot_de_passe`, `reset_token`, `reset_token_expiration`, `role_id`, `statut`, `theme_preference`, `created_at`) VALUES
  (121, NULL, 'Administration Centrale Demo', 'admin.demo@smartlogistics.ma', 'admin.demo', NULL, @seed_password_hash, NULL, NULL, 2, 'actif', 'light', '2025-09-05 11:00:00'),
  (122, NULL, 'Nadia Bennis', 'directrice.demo@smartlogistics.ma', 'nadia.bennis', NULL, @seed_password_hash, NULL, NULL, 1, 'actif', 'light', '2025-09-05 11:05:00'),
  (123, NULL, 'Rachid El Gharbi', 'chef.demo@smartlogistics.ma', 'rachid.elgharbi', NULL, @seed_password_hash, NULL, NULL, 2, 'actif', 'dark', '2025-09-05 11:10:00');

INSERT INTO groupes (`id`, `code`, `nom`, `filiere`, `annee_scolaire`, `effectif`, `actif`, `created_at`, `updated_at`) VALUES
  (101, 'SCM-1A', 'Supply Chain 1A', 'Supply Chain et Logistique', '2025-2026', 28, 1, '2025-09-08 09:00:00', NULL),
  (102, 'SCM-2A', 'Supply Chain 2A', 'Supply Chain et Logistique', '2025-2026', 24, 1, '2025-09-08 09:05:00', NULL),
  (103, 'TSL-1A', 'Transport et Stockage 1A', 'Supply Chain et Logistique', '2025-2026', 26, 1, '2025-09-08 09:10:00', NULL),
  (104, 'TSL-2A', 'Transport et Stockage 2A', 'Supply Chain et Logistique', '2025-2026', 22, 1, '2025-09-08 09:15:00', NULL),
  (105, 'DEV-APP', 'Developpement Applications', 'Developpement Digital', '2025-2026', 25, 1, '2025-09-08 09:20:00', NULL),
  (106, 'DEV-WEB', 'Developpement Web Full Stack', 'Developpement Digital', '2025-2026', 23, 1, '2025-09-08 09:25:00', NULL),
  (107, 'DATA-AI', 'Data et Intelligence Artificielle', 'Data et IA', '2025-2026', 21, 1, '2025-09-08 09:30:00', NULL),
  (108, 'ERP-OPS', 'ERP et Pilotage Operations', 'ERP et Pilotage', '2025-2026', 20, 1, '2025-09-08 09:35:00', NULL);

INSERT INTO salles (`id`, `code`, `nom`, `batiment`, `capacite`, `created_at`) VALUES
  (101, 'LAB-LOG-01', 'Lab Logistique 01', 'Batiment C', 28, '2025-09-08 10:00:00'),
  (102, 'LAB-IT-02', 'Lab IT 02', 'Batiment D', 24, '2025-09-08 10:05:00'),
  (103, 'ROOM-ERP-03', 'Salle ERP 03', 'Batiment C', 20, '2025-09-08 10:10:00'),
  (104, 'ROOM-DATA-04', 'Salle Data 04', 'Batiment D', 22, '2025-09-08 10:15:00');

INSERT INTO modules (`id`, `code`, `intitule`, `filiere`, `semestre`, `volume_horaire`, `has_efm`, `created_at`, `updated_at`) VALUES
  (101, 'LOG101', 'Gestion des stocks et inventaires WMS', 'Supply Chain et Logistique', 'S1', 24, 0, '2025-09-09 08:00:00', NULL),
  (102, 'LOG102', 'Approvisionnement et planification MRP', 'Supply Chain et Logistique', 'S1', 28, 0, '2025-09-09 08:05:00', NULL),
  (103, 'LOG201', 'Transport multimodal et documentation', 'Supply Chain et Logistique', 'S2', 32, 1, '2025-09-09 08:10:00', NULL),
  (104, 'LOG202', 'Optimisation des tournees TMS', 'Supply Chain et Logistique', 'S2', 24, 1, '2025-09-09 08:15:00', NULL),
  (105, 'ERP101', 'Prise en main Odoo achats et stock', 'ERP et Pilotage', 'S1', 30, 0, '2025-09-09 08:20:00', NULL),
  (106, 'ERP201', 'Tableaux de bord KPI logistiques', 'ERP et Pilotage', 'S2', 36, 1, '2025-09-09 08:25:00', NULL),
  (107, 'WEB101', 'HTML CSS pour interfaces metier', 'Developpement Digital', 'S1', 30, 0, '2025-09-09 08:30:00', NULL),
  (108, 'WEB201', 'React pour cockpit logistique', 'Developpement Digital', 'S2', 34, 1, '2025-09-09 08:35:00', NULL),
  (109, 'API201', 'API PHP PDO et securite applicative', 'Developpement Digital', 'S2', 32, 1, '2025-09-09 08:40:00', NULL),
  (110, 'DB201', 'Modelisation MySQL et optimisation', 'Data et IA', 'S1', 28, 0, '2025-09-09 08:45:00', NULL),
  (111, 'BI201', 'Power BI et data visualisation', 'Data et IA', 'S2', 30, 0, '2025-09-09 08:50:00', NULL),
  (112, 'AI201', 'Machine Learning pour prevision de demande', 'Data et IA', 'S2', 24, 1, '2025-09-09 08:55:00', NULL),
  (113, 'NET101', 'Reseaux et securite des SI', 'Developpement Digital', 'S1', 30, 0, '2025-09-09 09:00:00', NULL),
  (114, 'CLD201', 'Supervision cloud et sauvegarde', 'Developpement Digital', 'S2', 24, 0, '2025-09-09 09:05:00', NULL),
  (115, 'PM101', 'Gestion de projet Agile et reporting', 'ERP et Pilotage', 'S1', 20, 0, '2025-09-09 09:10:00', NULL);

INSERT INTO module_groupes (`id`, `module_id`, `groupe_id`, `created_at`) VALUES
  (1001, 101, 101, '2025-09-12 09:00:00'),
  (1002, 101, 103, '2025-09-12 09:01:00'),
  (1003, 102, 101, '2025-09-12 09:02:00'),
  (1004, 102, 102, '2025-09-12 09:03:00'),
  (1005, 103, 103, '2025-09-12 09:04:00'),
  (1006, 103, 104, '2025-09-12 09:05:00'),
  (1007, 104, 102, '2025-09-12 09:06:00'),
  (1008, 104, 104, '2025-09-12 09:07:00'),
  (1009, 105, 101, '2025-09-12 09:08:00'),
  (1010, 105, 108, '2025-09-12 09:09:00'),
  (1011, 106, 102, '2025-09-12 09:10:00'),
  (1012, 106, 108, '2025-09-12 09:11:00'),
  (1013, 107, 105, '2025-09-12 09:12:00'),
  (1014, 108, 106, '2025-09-12 09:13:00'),
  (1015, 109, 106, '2025-09-12 09:14:00'),
  (1016, 109, 108, '2025-09-12 09:15:00'),
  (1017, 110, 107, '2025-09-12 09:16:00'),
  (1018, 111, 107, '2025-09-12 09:17:00'),
  (1019, 111, 108, '2025-09-12 09:18:00'),
  (1020, 112, 107, '2025-09-12 09:19:00'),
  (1021, 113, 106, '2025-09-12 09:20:00'),
  (1022, 114, 106, '2025-09-12 09:21:00'),
  (1023, 114, 107, '2025-09-12 09:22:00'),
  (1024, 115, 108, '2025-09-12 09:23:00'),
  (1025, 115, 105, '2025-09-12 09:24:00');

INSERT INTO module_questionnaires (`id`, `module_id`, `questionnaire_id`, `questionnaire_token`, `total_questions`, `created_at`, `updated_at`) VALUES
  (1001, 101, 'module-101', 'qtk-log101-2026', 20, '2025-09-12 11:00:00', NULL),
  (1002, 102, 'module-102', 'qtk-log102-2026', 20, '2025-09-12 11:01:00', NULL),
  (1003, 103, 'module-103', 'qtk-log201-2026', 20, '2025-09-12 11:02:00', NULL),
  (1004, 104, 'module-104', 'qtk-log202-2026', 20, '2025-09-12 11:03:00', NULL),
  (1005, 105, 'module-105', 'qtk-erp101-2026', 20, '2025-09-12 11:04:00', NULL),
  (1006, 106, 'module-106', 'qtk-erp201-2026', 20, '2025-09-12 11:05:00', NULL),
  (1007, 107, 'module-107', 'qtk-web101-2026', 20, '2025-09-12 11:06:00', NULL),
  (1008, 108, 'module-108', 'qtk-web201-2026', 20, '2025-09-12 11:07:00', NULL),
  (1009, 109, 'module-109', 'qtk-api201-2026', 20, '2025-09-12 11:08:00', NULL),
  (1010, 110, 'module-110', 'qtk-db201-2026', 20, '2025-09-12 11:09:00', NULL),
  (1011, 111, 'module-111', 'qtk-bi201-2026', 20, '2025-09-12 11:10:00', NULL),
  (1012, 112, 'module-112', 'qtk-ai201-2026', 20, '2025-09-12 11:11:00', NULL),
  (1013, 113, 'module-113', 'qtk-net101-2026', 20, '2025-09-12 11:12:00', NULL),
  (1014, 114, 'module-114', 'qtk-cld201-2026', 20, '2025-09-12 11:13:00', NULL),
  (1015, 115, 'module-115', 'qtk-pm101-2026', 20, '2025-09-12 11:14:00', NULL);

INSERT INTO affectations (`id`, `formateur_id`, `module_id`, `annee`, `created_at`) VALUES
  (2001, 101, 101, @academic_year, '2025-09-20 08:00:00'),
  (2002, 110, 101, @academic_year, '2025-09-20 08:02:00'),
  (2003, 103, 101, @academic_year, '2025-09-20 08:04:00'),
  (2004, 119, 101, @academic_year, '2025-09-20 08:06:00'),
  (2005, 110, 102, @academic_year, '2025-09-20 08:08:00'),
  (2006, 116, 102, @academic_year, '2025-09-20 08:10:00'),
  (2007, 117, 102, @academic_year, '2025-09-20 08:12:00'),
  (2008, 116, 103, @academic_year, '2025-09-20 08:14:00'),
  (2009, 117, 103, @academic_year, '2025-09-20 08:16:00'),
  (2010, 102, 103, @academic_year, '2025-09-20 08:18:00'),
  (2011, 114, 103, @academic_year, '2025-09-20 08:20:00'),
  (2012, 117, 104, @academic_year, '2025-09-20 08:22:00'),
  (2013, 110, 104, @academic_year, '2025-09-20 08:24:00'),
  (2014, 101, 104, @academic_year, '2025-09-20 08:26:00'),
  (2015, 111, 105, @academic_year, '2025-09-20 08:28:00'),
  (2016, 114, 105, @academic_year, '2025-09-20 08:30:00'),
  (2017, 102, 105, @academic_year, '2025-09-20 08:32:00'),
  (2018, 105, 105, @academic_year, '2025-09-20 08:34:00'),
  (2019, 111, 106, @academic_year, '2025-09-20 08:36:00'),
  (2020, 107, 106, @academic_year, '2025-09-20 08:38:00'),
  (2021, 115, 106, @academic_year, '2025-09-20 08:40:00'),
  (2022, 109, 106, @academic_year, '2025-09-20 08:42:00'),
  (2023, 108, 107, @academic_year, '2025-09-20 08:44:00'),
  (2024, 119, 107, @academic_year, '2025-09-20 08:46:00'),
  (2025, 120, 107, @academic_year, '2025-09-20 08:48:00'),
  (2026, 105, 107, @academic_year, '2025-09-20 08:50:00'),
  (2027, 108, 108, @academic_year, '2025-09-20 08:52:00'),
  (2028, 112, 108, @academic_year, '2025-09-20 08:54:00'),
  (2029, 120, 108, @academic_year, '2025-09-20 08:56:00'),
  (2030, 101, 108, @academic_year, '2025-09-20 08:58:00'),
  (2031, 112, 109, @academic_year, '2025-09-20 09:00:00'),
  (2032, 120, 109, @academic_year, '2025-09-20 09:02:00'),
  (2033, 109, 109, @academic_year, '2025-09-20 09:04:00'),
  (2034, 104, 109, @academic_year, '2025-09-20 09:06:00'),
  (2035, 109, 110, @academic_year, '2025-09-20 09:08:00'),
  (2036, 115, 110, @academic_year, '2025-09-20 09:10:00'),
  (2037, 104, 110, @academic_year, '2025-09-20 09:12:00'),
  (2038, 115, 111, @academic_year, '2025-09-20 09:14:00'),
  (2039, 107, 111, @academic_year, '2025-09-20 09:16:00'),
  (2040, 104, 111, @academic_year, '2025-09-20 09:18:00'),
  (2041, 104, 112, @academic_year, '2025-09-20 09:20:00'),
  (2042, 106, 112, @academic_year, '2025-09-20 09:22:00'),
  (2043, 107, 112, @academic_year, '2025-09-20 09:24:00'),
  (2044, 118, 113, @academic_year, '2025-09-20 09:26:00'),
  (2045, 113, 113, @academic_year, '2025-09-20 09:28:00'),
  (2046, 120, 113, @academic_year, '2025-09-20 09:30:00'),
  (2047, 113, 114, @academic_year, '2025-09-20 09:32:00'),
  (2048, 118, 114, @academic_year, '2025-09-20 09:34:00'),
  (2049, 102, 115, @academic_year, '2025-09-20 09:36:00'),
  (2050, 105, 115, @academic_year, '2025-09-20 09:38:00');

INSERT INTO planning_sessions (`id`, `formateur_id`, `module_id`, `groupe_id`, `salle_id`, `week_number`, `week_start_date`, `week_end_date`, `day_of_week`, `start_time`, `end_time`, `session_date`, `status`, `task_title`, `task_description`, `note_formateur`, `chef_response`, `change_request_note`, `confirmed_at`, `validated_at`, `validated_by`, `created_at`, `updated_at`) VALUES
  (5001, 101, 101, 101, 101, 22, '2026-02-09', '2026-02-15', 1, '08:30:00', '14:30:00', '2026-02-09', 'done', 'Flux de stock WMS', 'Inventaires tournants et valorisation.', NULL, 'Valide', NULL, '2026-02-08 18:00:00', '2026-02-09 14:35:00', 2, '2026-02-06 09:00:00', '2026-02-09 14:35:00'),
  (5002, 101, 101, 103, 101, 23, '2026-02-16', '2026-02-22', 3, '08:30:00', '14:30:00', '2026-02-18', 'done', 'Flux de stock WMS', 'Parametrage des mouvements logistiques.', NULL, 'Valide', NULL, '2026-02-15 18:00:00', '2026-02-18 14:35:00', 2, '2026-02-13 09:00:00', '2026-02-18 14:35:00'),
  (5003, 101, 101, 101, 101, 24, '2026-02-23', '2026-03-01', 5, '08:30:00', '14:30:00', '2026-02-27', 'done', 'Flux de stock WMS', 'Cas pratique d inventaire annuel.', NULL, 'Valide', NULL, '2026-02-22 18:00:00', '2026-02-27 14:35:00', 2, '2026-02-20 09:00:00', '2026-02-27 14:35:00'),
  (5004, 101, 101, 103, 101, 28, '2026-03-23', '2026-03-29', 2, '09:00:00', '15:00:00', '2026-03-24', 'done', 'Flux de stock WMS', 'Audit de stock et tableaux de bord.', NULL, 'Valide', NULL, '2026-03-22 18:00:00', '2026-03-24 15:05:00', 2, '2026-03-20 09:00:00', '2026-03-24 15:05:00'),

  (5005, 110, 102, 101, 101, 22, '2026-02-09', '2026-02-15', 2, '09:00:00', '16:00:00', '2026-02-10', 'done', 'Planification MRP', 'Calcul des besoins nets.', NULL, 'Valide', NULL, '2026-02-08 18:00:00', '2026-02-10 16:05:00', 2, '2026-02-06 09:30:00', '2026-02-10 16:05:00'),
  (5006, 110, 102, 102, 101, 23, '2026-02-16', '2026-02-22', 4, '09:00:00', '16:00:00', '2026-02-19', 'done', 'Planification MRP', 'Simulation de rupture fournisseur.', NULL, 'Valide', NULL, '2026-02-15 18:00:00', '2026-02-19 16:05:00', 2, '2026-02-13 09:30:00', '2026-02-19 16:05:00'),
  (5007, 110, 102, 101, 101, 28, '2026-03-23', '2026-03-29', 1, '08:00:00', '15:00:00', '2026-03-23', 'done', 'Planification MRP', 'Pilotage des approvisionnements critiques.', NULL, 'Valide', NULL, '2026-03-22 18:00:00', '2026-03-23 15:05:00', 2, '2026-03-20 09:30:00', '2026-03-23 15:05:00'),
  (5008, 110, 102, 102, 101, 30, '2026-04-06', '2026-04-12', 3, '08:30:00', '15:30:00', '2026-04-08', 'scheduled', 'Planification MRP', 'Preparation du scenario S2.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-03 09:30:00', '2026-04-03 09:30:00'),

  (5009, 116, 103, 103, 101, 22, '2026-02-09', '2026-02-15', 1, '08:30:00', '12:30:00', '2026-02-09', 'done', 'Transport multimodal', 'Documents de transit et assurance.', NULL, 'Valide', NULL, '2026-02-08 18:00:00', '2026-02-09 12:35:00', 2, '2026-02-06 10:00:00', '2026-02-09 12:35:00'),
  (5010, 116, 103, 104, 101, 23, '2026-02-16', '2026-02-22', 3, '08:30:00', '12:30:00', '2026-02-18', 'done', 'Transport multimodal', 'Consolidation et palettisation.', NULL, 'Valide', NULL, '2026-02-15 18:00:00', '2026-02-18 12:35:00', 2, '2026-02-13 10:00:00', '2026-02-18 12:35:00'),
  (5011, 116, 103, 103, 101, 28, '2026-03-23', '2026-03-29', 5, '08:00:00', '13:00:00', '2026-03-27', 'done', 'Transport multimodal', 'Incoterms et risques contractuels.', NULL, 'Valide', NULL, '2026-03-22 18:00:00', '2026-03-27 13:05:00', 2, '2026-03-20 10:00:00', '2026-03-27 13:05:00'),
  (5012, 116, 103, 104, 101, 30, '2026-04-06', '2026-04-12', 2, '08:30:00', '13:30:00', '2026-04-07', 'scheduled', 'Transport multimodal', 'Etude de cas transit import.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-03 10:00:00', '2026-04-03 10:00:00'),

  (5013, 117, 104, 102, 101, 22, '2026-02-09', '2026-02-15', 2, '13:00:00', '19:00:00', '2026-02-10', 'done', 'Tournees TMS', 'Affectation flotte et chauffeurs.', NULL, 'Valide', NULL, '2026-02-08 18:00:00', '2026-02-10 19:05:00', 2, '2026-02-06 10:30:00', '2026-02-10 19:05:00'),
  (5014, 117, 104, 104, 101, 23, '2026-02-16', '2026-02-22', 4, '13:00:00', '19:00:00', '2026-02-19', 'done', 'Tournees TMS', 'Optimisation des kilometrages.', NULL, 'Valide', NULL, '2026-02-15 18:00:00', '2026-02-19 19:05:00', 2, '2026-02-13 10:30:00', '2026-02-19 19:05:00'),
  (5015, 117, 104, 102, 101, 28, '2026-03-23', '2026-03-29', 1, '13:00:00', '19:00:00', '2026-03-23', 'done', 'Tournees TMS', 'KPI de livraison dernier kilometre.', NULL, 'Valide', NULL, '2026-03-22 18:00:00', '2026-03-23 19:05:00', 2, '2026-03-20 10:30:00', '2026-03-23 19:05:00'),
  (5016, 117, 104, 104, 101, 30, '2026-04-06', '2026-04-12', 5, '13:00:00', '19:00:00', '2026-04-10', 'scheduled', 'Tournees TMS', 'Scenario de tournage pour semaine suivante.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-03 10:30:00', '2026-04-03 10:30:00'),

  (5017, 111, 105, 108, 103, 22, '2026-02-09', '2026-02-15', 1, '08:30:00', '16:00:00', '2026-02-09', 'done', 'Odoo achats et stock', 'Mise en place des entrepots.', NULL, 'Valide', NULL, '2026-02-08 18:00:00', '2026-02-09 16:05:00', 2, '2026-02-06 11:00:00', '2026-02-09 16:05:00'),
  (5018, 111, 105, 101, 103, 23, '2026-02-16', '2026-02-22', 3, '08:30:00', '16:00:00', '2026-02-18', 'done', 'Odoo achats et stock', 'Flux achat reception stockage.', NULL, 'Valide', NULL, '2026-02-15 18:00:00', '2026-02-18 16:05:00', 2, '2026-02-13 11:00:00', '2026-02-18 16:05:00'),
  (5019, 111, 105, 108, 103, 24, '2026-02-23', '2026-03-01', 5, '08:30:00', '16:00:00', '2026-02-27', 'done', 'Odoo achats et stock', 'Inventaire et reappro automatique.', NULL, 'Valide', NULL, '2026-02-22 18:00:00', '2026-02-27 16:05:00', 2, '2026-02-20 11:00:00', '2026-02-27 16:05:00'),
  (5020, 111, 105, 101, 103, 28, '2026-03-23', '2026-03-29', 2, '08:30:00', '16:00:00', '2026-03-24', 'done', 'Odoo achats et stock', 'Cas complet supply chain Odoo.', NULL, 'Valide', NULL, '2026-03-22 18:00:00', '2026-03-24 16:05:00', 2, '2026-03-20 11:00:00', '2026-03-24 16:05:00'),

  (5021, 111, 106, 108, 103, 22, '2026-02-09', '2026-02-15', 2, '09:00:00', '14:00:00', '2026-02-10', 'done', 'KPI logistiques', 'Construction du tableau OTIF.', NULL, 'Valide', NULL, '2026-02-08 18:00:00', '2026-02-10 14:05:00', 2, '2026-02-06 11:30:00', '2026-02-10 14:05:00'),
  (5022, 111, 106, 102, 103, 23, '2026-02-16', '2026-02-22', 4, '09:00:00', '14:00:00', '2026-02-19', 'done', 'KPI logistiques', 'Suivi service client et taux de casse.', NULL, 'Valide', NULL, '2026-02-15 18:00:00', '2026-02-19 14:05:00', 2, '2026-02-13 11:30:00', '2026-02-19 14:05:00'),
  (5023, 111, 106, 108, 103, 28, '2026-03-23', '2026-03-29', 1, '09:00:00', '13:30:00', '2026-03-23', 'done', 'KPI logistiques', 'Pilotage des couts et lead time.', NULL, 'Valide', NULL, '2026-03-22 18:00:00', '2026-03-23 13:35:00', 2, '2026-03-20 11:30:00', '2026-03-23 13:35:00'),
  (5024, 111, 106, 102, 103, 30, '2026-04-06', '2026-04-12', 3, '09:00:00', '13:30:00', '2026-04-08', 'scheduled', 'KPI logistiques', 'Atelier de dashboarding avance.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-03 11:30:00', '2026-04-03 11:30:00'),

  (5025, 108, 107, 105, 102, 22, '2026-02-09', '2026-02-15', 1, '08:30:00', '14:30:00', '2026-02-09', 'done', 'HTML CSS metier', 'Structure et integration responsive.', NULL, 'Valide', NULL, '2026-02-08 18:00:00', '2026-02-09 14:35:00', 2, '2026-02-06 12:00:00', '2026-02-09 14:35:00'),
  (5026, 108, 107, 105, 102, 23, '2026-02-16', '2026-02-22', 3, '08:30:00', '14:30:00', '2026-02-18', 'done', 'HTML CSS metier', 'Design system dark SaaS.', NULL, 'Valide', NULL, '2026-02-15 18:00:00', '2026-02-18 14:35:00', 2, '2026-02-13 12:00:00', '2026-02-18 14:35:00'),
  (5027, 108, 107, 105, 102, 24, '2026-02-23', '2026-03-01', 5, '08:30:00', '14:30:00', '2026-02-27', 'done', 'HTML CSS metier', 'Composants carte et tableau premium.', NULL, 'Valide', NULL, '2026-02-22 18:00:00', '2026-02-27 14:35:00', 2, '2026-02-20 12:00:00', '2026-02-27 14:35:00'),
  (5028, 108, 107, 105, 102, 28, '2026-03-23', '2026-03-29', 2, '09:00:00', '15:00:00', '2026-03-24', 'done', 'HTML CSS metier', 'Mini projet interface suivi stock.', NULL, 'Valide', NULL, '2026-03-22 18:00:00', '2026-03-24 15:05:00', 2, '2026-03-20 12:00:00', '2026-03-24 15:05:00'),

  (5029, 108, 108, 106, 102, 22, '2026-02-09', '2026-02-15', 2, '09:00:00', '14:30:00', '2026-02-10', 'done', 'React cockpit logistique', 'State management et cards KPI.', NULL, 'Valide', NULL, '2026-02-08 18:00:00', '2026-02-10 14:35:00', 2, '2026-02-06 12:30:00', '2026-02-10 14:35:00'),
  (5030, 108, 108, 106, 102, 23, '2026-02-16', '2026-02-22', 4, '09:00:00', '14:30:00', '2026-02-19', 'done', 'React cockpit logistique', 'Pagination et hooks custom.', NULL, 'Valide', NULL, '2026-02-15 18:00:00', '2026-02-19 14:35:00', 2, '2026-02-13 12:30:00', '2026-02-19 14:35:00'),
  (5031, 108, 108, 106, 102, 28, '2026-03-23', '2026-03-29', 1, '09:00:00', '15:00:00', '2026-03-23', 'done', 'React cockpit logistique', 'Integration Framer Motion.', NULL, 'Valide', NULL, '2026-03-22 18:00:00', '2026-03-23 15:05:00', 2, '2026-03-20 12:30:00', '2026-03-23 15:05:00'),
  (5032, 108, 108, 106, 102, 30, '2026-04-06', '2026-04-12', 3, '09:00:00', '15:00:00', '2026-04-08', 'scheduled', 'React cockpit logistique', 'Page dashboard directeur.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-03 12:30:00', '2026-04-03 12:30:00'),

  (5033, 112, 109, 106, 102, 22, '2026-02-09', '2026-02-15', 1, '08:00:00', '16:00:00', '2026-02-09', 'done', 'API PHP PDO', 'Architecture controllers services repositories.', NULL, 'Valide', NULL, '2026-02-08 18:00:00', '2026-02-09 16:05:00', 2, '2026-02-06 13:00:00', '2026-02-09 16:05:00'),
  (5034, 112, 109, 108, 102, 23, '2026-02-16', '2026-02-22', 3, '08:00:00', '16:00:00', '2026-02-18', 'done', 'API PHP PDO', 'Pagination serveur et validation.', NULL, 'Valide', NULL, '2026-02-15 18:00:00', '2026-02-18 16:05:00', 2, '2026-02-13 13:00:00', '2026-02-18 16:05:00'),
  (5035, 112, 109, 106, 102, 24, '2026-02-23', '2026-03-01', 5, '08:00:00', '16:00:00', '2026-02-27', 'done', 'API PHP PDO', 'Cache dashboard et erreurs API.', NULL, 'Valide', NULL, '2026-02-22 18:00:00', '2026-02-27 16:05:00', 2, '2026-02-20 13:00:00', '2026-02-27 16:05:00'),
  (5036, 112, 109, 108, 102, 28, '2026-03-23', '2026-03-29', 2, '08:00:00', '16:00:00', '2026-03-24', 'done', 'API PHP PDO', 'Audit securite endpoints.', NULL, 'Valide', NULL, '2026-03-22 18:00:00', '2026-03-24 16:05:00', 2, '2026-03-20 13:00:00', '2026-03-24 16:05:00'),

  (5037, 109, 110, 107, 104, 22, '2026-02-09', '2026-02-15', 2, '09:00:00', '12:00:00', '2026-02-10', 'done', 'Modelisation MySQL', 'Normalisation et indexation.', NULL, 'Valide', NULL, '2026-02-08 18:00:00', '2026-02-10 12:05:00', 2, '2026-02-06 13:30:00', '2026-02-10 12:05:00'),
  (5038, 109, 110, 107, 104, 23, '2026-02-16', '2026-02-22', 4, '09:00:00', '13:00:00', '2026-02-19', 'done', 'Modelisation MySQL', 'FK, cardinalites et jointures.', NULL, 'Valide', NULL, '2026-02-15 18:00:00', '2026-02-19 13:05:00', 2, '2026-02-13 13:30:00', '2026-02-19 13:05:00'),
  (5039, 109, 110, 107, 104, 28, '2026-03-23', '2026-03-29', 1, '09:00:00', '13:00:00', '2026-03-23', 'done', 'Modelisation MySQL', 'Optimisation des requetes volumineuses.', NULL, 'Valide', NULL, '2026-03-22 18:00:00', '2026-03-23 13:05:00', 2, '2026-03-20 13:30:00', '2026-03-23 13:05:00'),
  (5040, 109, 110, 107, 104, 30, '2026-04-06', '2026-04-12', 3, '09:00:00', '13:00:00', '2026-04-08', 'scheduled', 'Modelisation MySQL', 'Partage demo EXPLAIN.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-03 13:30:00', '2026-04-03 13:30:00'),

  (5041, 115, 111, 107, 104, 22, '2026-02-09', '2026-02-15', 1, '08:30:00', '15:30:00', '2026-02-09', 'done', 'Power BI logistique', 'Modeles et mesures DAX.', NULL, 'Valide', NULL, '2026-02-08 18:00:00', '2026-02-09 15:35:00', 2, '2026-02-06 14:00:00', '2026-02-09 15:35:00'),
  (5042, 115, 111, 108, 104, 23, '2026-02-16', '2026-02-22', 3, '08:30:00', '15:30:00', '2026-02-18', 'done', 'Power BI logistique', 'Dashboard transport et stock.', NULL, 'Valide', NULL, '2026-02-15 18:00:00', '2026-02-18 15:35:00', 2, '2026-02-13 14:00:00', '2026-02-18 15:35:00'),
  (5043, 115, 111, 107, 104, 28, '2026-03-23', '2026-03-29', 5, '08:30:00', '15:30:00', '2026-03-27', 'done', 'Power BI logistique', 'Publication et alertes de suivi.', NULL, 'Valide', NULL, '2026-03-22 18:00:00', '2026-03-27 15:35:00', 2, '2026-03-20 14:00:00', '2026-03-27 15:35:00'),
  (5044, 115, 111, 108, 104, 30, '2026-04-06', '2026-04-12', 2, '08:30:00', '15:30:00', '2026-04-07', 'scheduled', 'Power BI logistique', 'Atelier drill down direction.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-03 14:00:00', '2026-04-03 14:00:00'),

  (5045, 104, 112, 107, 104, 22, '2026-02-09', '2026-02-15', 2, '09:00:00', '15:00:00', '2026-02-10', 'done', 'ML prevision de demande', 'Regression lineaire sur historique ventes.', NULL, 'Valide', NULL, '2026-02-08 18:00:00', '2026-02-10 15:05:00', 2, '2026-02-06 14:30:00', '2026-02-10 15:05:00'),
  (5046, 104, 112, 107, 104, 23, '2026-02-16', '2026-02-22', 4, '09:00:00', '15:00:00', '2026-02-19', 'done', 'ML prevision de demande', 'Evaluation des modeles et erreurs.', NULL, 'Valide', NULL, '2026-02-15 18:00:00', '2026-02-19 15:05:00', 2, '2026-02-13 14:30:00', '2026-02-19 15:05:00'),
  (5047, 104, 112, 107, 104, 24, '2026-02-23', '2026-03-01', 1, '09:00:00', '15:00:00', '2026-02-23', 'done', 'ML prevision de demande', 'Feature engineering supply chain.', NULL, 'Valide', NULL, '2026-02-22 18:00:00', '2026-02-23 15:05:00', 2, '2026-02-20 14:30:00', '2026-02-23 15:05:00'),
  (5048, 104, 112, 107, 104, 28, '2026-03-23', '2026-03-29', 3, '09:00:00', '15:00:00', '2026-03-25', 'done', 'ML prevision de demande', 'Cas de prevision hebdomadaire.', NULL, 'Valide', NULL, '2026-03-22 18:00:00', '2026-03-25 15:05:00', 2, '2026-03-20 14:30:00', '2026-03-25 15:05:00'),

  (5049, 118, 113, 106, 102, 22, '2026-02-09', '2026-02-15', 1, '14:00:00', '18:00:00', '2026-02-09', 'done', 'Reseaux et securite', 'Segmentation reseau et VLAN.', NULL, 'Valide', NULL, '2026-02-08 18:00:00', '2026-02-09 18:05:00', 2, '2026-02-06 15:00:00', '2026-02-09 18:05:00'),
  (5050, 118, 113, 106, 102, 23, '2026-02-16', '2026-02-22', 3, '14:00:00', '18:00:00', '2026-02-18', 'done', 'Reseaux et securite', 'Pare-feu et politiques d acces.', NULL, 'Valide', NULL, '2026-02-15 18:00:00', '2026-02-18 18:05:00', 2, '2026-02-13 15:00:00', '2026-02-18 18:05:00'),
  (5051, 118, 113, 106, 102, 28, '2026-03-23', '2026-03-29', 5, '14:00:00', '18:00:00', '2026-03-27', 'done', 'Reseaux et securite', 'Durcissement postes et supervision.', NULL, 'Valide', NULL, '2026-03-22 18:00:00', '2026-03-27 18:05:00', 2, '2026-03-20 15:00:00', '2026-03-27 18:05:00'),
  (5052, 118, 113, 106, 102, 30, '2026-04-06', '2026-04-12', 2, '14:00:00', '18:00:00', '2026-04-07', 'scheduled', 'Reseaux et securite', 'Audit securite labo.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-03 15:00:00', '2026-04-03 15:00:00'),

  (5053, 113, 114, 106, 104, 22, '2026-02-09', '2026-02-15', 2, '08:30:00', '14:30:00', '2026-02-10', 'done', 'Supervision cloud', 'Sauvegardes et PRA.', NULL, 'Valide', NULL, '2026-02-08 18:00:00', '2026-02-10 14:35:00', 2, '2026-02-06 15:30:00', '2026-02-10 14:35:00'),
  (5054, 113, 114, 107, 104, 23, '2026-02-16', '2026-02-22', 4, '08:30:00', '14:30:00', '2026-02-19', 'done', 'Supervision cloud', 'Monitorings et incidents.', NULL, 'Valide', NULL, '2026-02-15 18:00:00', '2026-02-19 14:35:00', 2, '2026-02-13 15:30:00', '2026-02-19 14:35:00'),
  (5055, 113, 114, 106, 104, 28, '2026-03-23', '2026-03-29', 1, '08:30:00', '14:30:00', '2026-03-23', 'done', 'Supervision cloud', 'Alerting et journalisation.', NULL, 'Valide', NULL, '2026-03-22 18:00:00', '2026-03-23 14:35:00', 2, '2026-03-20 15:30:00', '2026-03-23 14:35:00'),
  (5056, 113, 114, 107, 104, 30, '2026-04-06', '2026-04-12', 3, '08:30:00', '14:30:00', '2026-04-08', 'scheduled', 'Supervision cloud', 'Atelier PRA et reprise.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-03 15:30:00', '2026-04-03 15:30:00'),

  (5057, 102, 115, 108, 103, 22, '2026-02-09', '2026-02-15', 1, '16:00:00', '20:00:00', '2026-02-09', 'done', 'Gestion de projet Agile', 'Sprint planning et backlog.', NULL, 'Valide', NULL, '2026-02-08 18:00:00', '2026-02-09 20:05:00', 2, '2026-02-06 16:00:00', '2026-02-09 20:05:00'),
  (5058, 102, 115, 105, 103, 23, '2026-02-16', '2026-02-22', 3, '16:00:00', '20:00:00', '2026-02-18', 'done', 'Gestion de projet Agile', 'Kanban et suivi de sprint.', NULL, 'Valide', NULL, '2026-02-15 18:00:00', '2026-02-18 20:05:00', 2, '2026-02-13 16:00:00', '2026-02-18 20:05:00'),
  (5059, 102, 115, 108, 103, 28, '2026-03-23', '2026-03-29', 5, '16:00:00', '20:00:00', '2026-03-27', 'scheduled', 'Gestion de projet Agile', 'Retrospective et indicateurs projet.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-20 16:00:00', '2026-03-20 16:00:00'),
  (5060, 102, 115, 105, 103, 30, '2026-04-06', '2026-04-12', 2, '16:00:00', '20:00:00', '2026-04-07', 'scheduled', 'Gestion de projet Agile', 'Preparation demo PFE.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-03 16:00:00', '2026-04-03 16:00:00');

INSERT INTO planning_sessions (`id`, `formateur_id`, `module_id`, `groupe_id`, `salle_id`, `week_number`, `week_start_date`, `week_end_date`, `day_of_week`, `start_time`, `end_time`, `session_date`, `status`, `task_title`, `task_description`, `note_formateur`, `chef_response`, `change_request_note`, `confirmed_at`, `validated_at`, `validated_by`, `created_at`, `updated_at`) VALUES
  (5201, 1, 1, 1, 1, 30, '2026-04-06', '2026-04-12', 1, '08:30:00', '13:00:00', '2026-04-06', 'validated', 'Interface HTML CSS', 'Atelier responsive et revue composant.', NULL, 'Valide pour la semaine en cours', NULL, '2026-04-05 18:00:00', '2026-04-06 12:55:00', 122, '2026-04-04 16:30:00', '2026-04-06 12:55:00'),
  (5202, 1, 2, 2, 1, 30, '2026-04-06', '2026-04-12', 3, '14:00:00', '18:00:00', '2026-04-08', 'scheduled', 'Atelier React dashboard', 'Construction de cartes KPI et navigation.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-04 16:40:00', '2026-04-04 16:40:00'),
  (5203, 1, 2, 1, 1, 30, '2026-04-06', '2026-04-12', 5, '09:00:00', '12:30:00', '2026-04-10', 'scheduled', 'Atelier React dashboard', 'Mise en page des blocs statistiques.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-04 16:45:00', '2026-04-04 16:45:00');

INSERT INTO planning (`formateur_id`, `module_id`, `semaine`, `heures`, `created_at`, `updated_at`)
SELECT
  ps.formateur_id,
  ps.module_id,
  ps.week_number,
  ROUND(SUM(TIMESTAMPDIFF(MINUTE, ps.start_time, ps.end_time)) / 60, 2) AS heures,
  MIN(ps.created_at) AS created_at,
  MAX(ps.updated_at) AS updated_at
FROM planning_sessions ps
WHERE ps.formateur_id BETWEEN 101 AND 120
  AND ps.module_id BETWEEN 101 AND 115
GROUP BY ps.formateur_id, ps.module_id, ps.week_number;

INSERT INTO planning (`formateur_id`, `module_id`, `semaine`, `heures`, `created_at`, `updated_at`) VALUES
  (1, 1, 30, 4.50, '2026-04-04 16:30:00', '2026-04-06 12:55:00'),
  (1, 2, 30, 7.50, '2026-04-04 16:40:00', '2026-04-04 16:45:00');

INSERT INTO planning_submissions (`id`, `formateur_id`, `semaine`, `academic_year`, `submitted_hours`, `status`, `submitted_at`, `reviewed_at`, `created_at`, `updated_at`, `processed_at`, `processed_by`, `decision_note`, `snapshot_entries`, `snapshot_total_hours`, `snapshot_captured_at`) VALUES
  (4001, 101, 28, @academic_year, 6.00, 'approved', '2026-04-05 08:10:00', '2026-04-06 09:00:00', '2026-04-05 08:10:00', '2026-04-06 09:00:00', '2026-04-06 09:00:00', 2, 'Charge validee et execution reguliere.', NULL, NULL, NULL),
  (4002, 110, 28, @academic_year, 7.00, 'approved', '2026-04-05 08:20:00', '2026-04-06 09:15:00', '2026-04-05 08:20:00', '2026-04-06 09:15:00', '2026-04-06 09:15:00', 2, 'Bonne repartition sur la semaine.', NULL, NULL, NULL),
  (4003, 116, 28, @academic_year, 5.00, 'rejected', '2026-04-05 08:30:00', '2026-04-06 09:25:00', '2026-04-05 08:30:00', '2026-04-06 09:25:00', '2026-04-06 09:25:00', 1, 'Revoir la ventilation des heures sur les groupes.', NULL, NULL, NULL),
  (4004, 117, 28, @academic_year, 6.00, 'approved', '2026-04-05 08:40:00', '2026-04-06 09:35:00', '2026-04-05 08:40:00', '2026-04-06 09:35:00', '2026-04-06 09:35:00', 2, 'Validation immediate pour la demo.', NULL, NULL, NULL),
  (4005, 111, 28, @academic_year, 12.00, 'approved', '2026-04-05 08:50:00', '2026-04-06 09:45:00', '2026-04-05 08:50:00', '2026-04-06 09:45:00', '2026-04-06 09:45:00', 2, 'Tres bonne couverture Odoo et KPI.', NULL, NULL, NULL),
  (4006, 108, 28, @academic_year, 11.50, 'approved', '2026-04-05 09:00:00', '2026-04-06 09:55:00', '2026-04-05 09:00:00', '2026-04-06 09:55:00', '2026-04-06 09:55:00', 1, 'Execution propre sur les modules frontend.', NULL, NULL, NULL),
  (4007, 112, 28, @academic_year, 8.00, 'approved', '2026-04-05 09:10:00', '2026-04-06 10:05:00', '2026-04-05 09:10:00', '2026-04-06 10:05:00', '2026-04-06 10:05:00', 1, 'API stable et progression conforme.', NULL, NULL, NULL),
  (4008, 109, 28, @academic_year, 4.00, 'revision', '2026-04-05 09:20:00', '2026-04-06 10:15:00', '2026-04-05 09:20:00', '2026-04-06 10:15:00', '2026-04-06 10:15:00', 2, 'Ajouter plus de detail sur la seance de restitution.', NULL, NULL, NULL),
  (4009, 115, 28, @academic_year, 7.00, 'approved', '2026-04-05 09:30:00', '2026-04-06 10:25:00', '2026-04-05 09:30:00', '2026-04-06 10:25:00', '2026-04-06 10:25:00', 2, 'Dashboard BI complet et coherent.', NULL, NULL, NULL),
  (4010, 104, 28, @academic_year, 6.00, 'approved', '2026-04-05 09:40:00', '2026-04-06 10:35:00', '2026-04-05 09:40:00', '2026-04-06 10:35:00', '2026-04-06 10:35:00', 1, 'Modeles ML bien executes.', NULL, NULL, NULL),
  (4011, 118, 28, @academic_year, 4.00, 'pending', '2026-04-05 09:50:00', NULL, '2026-04-05 09:50:00', '2026-04-05 09:50:00', NULL, NULL, NULL, NULL, NULL, NULL),
  (4012, 113, 28, @academic_year, 6.00, 'revision', '2026-04-05 10:00:00', '2026-04-06 10:45:00', '2026-04-05 10:00:00', '2026-04-06 10:45:00', '2026-04-06 10:45:00', 2, 'Clarifier les sauvegardes et les incidents traites.', NULL, NULL, NULL),
  (4013, 102, 28, @academic_year, 4.00, 'pending', '2026-04-05 10:10:00', NULL, '2026-04-05 10:10:00', '2026-04-05 10:10:00', NULL, NULL, NULL, NULL, NULL, NULL),
  (4014, 107, 28, @academic_year, 4.50, 'pending', '2026-04-05 10:20:00', NULL, '2026-04-05 10:20:00', '2026-04-05 10:20:00', NULL, NULL, NULL, NULL, NULL, NULL),
  (4015, 106, 28, @academic_year, 6.00, 'pending', '2026-04-05 10:30:00', NULL, '2026-04-05 10:30:00', '2026-04-05 10:30:00', NULL, NULL, NULL, NULL, NULL, NULL),
  (4016, 114, 28, @academic_year, 6.00, 'approved', '2026-04-05 10:40:00', '2026-04-06 10:55:00', '2026-04-05 10:40:00', '2026-04-06 10:55:00', '2026-04-06 10:55:00', 2, 'Bonne tenue de la plateforme ERP.', NULL, NULL, NULL),
  (4017, 103, 28, @academic_year, 5.00, 'pending', '2026-04-05 10:50:00', NULL, '2026-04-05 10:50:00', '2026-04-05 10:50:00', NULL, NULL, NULL, NULL, NULL, NULL),
  (4018, 119, 28, @academic_year, 6.00, 'approved', '2026-04-05 11:00:00', '2026-04-06 11:05:00', '2026-04-05 11:00:00', '2026-04-06 11:05:00', '2026-04-06 11:05:00', 1, 'Animation pedagogique reussie.', NULL, NULL, NULL),
  (4019, 120, 28, @academic_year, 8.00, 'approved', '2026-04-05 11:10:00', '2026-04-06 11:15:00', '2026-04-05 11:10:00', '2026-04-06 11:15:00', '2026-04-06 11:15:00', 1, 'Integrations API conformes au cahier des charges.', NULL, NULL, NULL),
  (4020, 105, 28, @academic_year, 6.00, 'rejected', '2026-04-05 11:20:00', '2026-04-06 11:25:00', '2026-04-05 11:20:00', '2026-04-06 11:25:00', '2026-04-06 11:25:00', 2, 'Completer les livrables de reporting avant validation.', NULL, NULL, NULL);

INSERT INTO planning_submissions (`id`, `formateur_id`, `semaine`, `academic_year`, `submitted_hours`, `status`, `submitted_at`, `reviewed_at`, `created_at`, `updated_at`, `processed_at`, `processed_by`, `decision_note`, `snapshot_entries`, `snapshot_total_hours`, `snapshot_captured_at`) VALUES
  (4021, 101, 30, @academic_year, 6.00, 'approved', '2026-04-06 07:50:00', '2026-04-07 08:40:00', '2026-04-06 07:50:00', '2026-04-07 08:40:00', '2026-04-07 08:40:00', 123, 'Validation rapide pour la semaine en cours.', '[{"module_id":101,"hours":6}]', 6.00, '2026-04-06 07:48:00'),
  (4022, 110, 30, @academic_year, 7.00, 'approved', '2026-04-06 08:00:00', '2026-04-07 08:45:00', '2026-04-06 08:00:00', '2026-04-07 08:45:00', '2026-04-07 08:45:00', 123, 'Scenario MRP valide et salle confirmee.', '[{"module_id":102,"hours":7}]', 7.00, '2026-04-06 07:58:00'),
  (4023, 116, 30, @academic_year, 5.00, 'pending', '2026-04-06 08:05:00', NULL, '2026-04-06 08:05:00', '2026-04-06 08:05:00', NULL, NULL, NULL, '[{"module_id":103,"hours":5}]', 5.00, '2026-04-06 08:04:00'),
  (4024, 117, 30, @academic_year, 6.00, 'pending', '2026-04-06 08:12:00', NULL, '2026-04-06 08:12:00', '2026-04-06 08:12:00', NULL, NULL, NULL, '[{"module_id":104,"hours":6}]', 6.00, '2026-04-06 08:10:00'),
  (4025, 111, 30, @academic_year, 4.50, 'approved', '2026-04-06 08:18:00', '2026-04-07 08:52:00', '2026-04-06 08:18:00', '2026-04-07 08:52:00', '2026-04-07 08:52:00', 122, 'Dashboard KPI maintenu dans la cible.', '[{"module_id":106,"hours":4.5}]', 4.50, '2026-04-06 08:16:00'),
  (4026, 108, 30, @academic_year, 6.00, 'approved', '2026-04-06 08:25:00', '2026-04-07 09:00:00', '2026-04-06 08:25:00', '2026-04-07 09:00:00', '2026-04-07 09:00:00', 122, 'Planning React pertinent pour la demo direction.', '[{"module_id":108,"hours":6}]', 6.00, '2026-04-06 08:23:00'),
  (4027, 109, 30, @academic_year, 4.00, 'revision', '2026-04-06 08:32:00', '2026-04-07 09:08:00', '2026-04-06 08:32:00', '2026-04-07 09:08:00', '2026-04-07 09:08:00', 123, 'Ajouter un mini livrable optimisation avant validation.', '[{"module_id":110,"hours":4}]', 4.00, '2026-04-06 08:30:00'),
  (4028, 115, 30, @academic_year, 7.00, 'approved', '2026-04-06 08:38:00', '2026-04-07 09:15:00', '2026-04-06 08:38:00', '2026-04-07 09:15:00', '2026-04-07 09:15:00', 122, 'Atelier BI prioritaire pour le copil.', '[{"module_id":111,"hours":7}]', 7.00, '2026-04-06 08:36:00'),
  (4029, 118, 30, @academic_year, 4.00, 'pending', '2026-04-06 08:45:00', NULL, '2026-04-06 08:45:00', '2026-04-06 08:45:00', NULL, NULL, NULL, '[{"module_id":113,"hours":4}]', 4.00, '2026-04-06 08:43:00'),
  (4030, 113, 30, @academic_year, 6.00, 'approved', '2026-04-06 08:52:00', '2026-04-07 09:24:00', '2026-04-06 08:52:00', '2026-04-07 09:24:00', '2026-04-07 09:24:00', 123, 'Seance cloud maintenue pour la semaine courante.', '[{"module_id":114,"hours":6}]', 6.00, '2026-04-06 08:50:00'),
  (4031, 102, 30, @academic_year, 4.00, 'pending', '2026-04-06 09:00:00', NULL, '2026-04-06 09:00:00', '2026-04-06 09:00:00', NULL, NULL, NULL, '[{"module_id":115,"hours":4}]', 4.00, '2026-04-06 08:58:00'),
  (4032, 1, 30, @academic_year, 12.00, 'approved', '2026-04-06 07:40:00', '2026-04-07 08:35:00', '2026-04-06 07:40:00', '2026-04-07 08:35:00', '2026-04-07 08:35:00', 122, 'Planning demo du formateur principal valide.', '[{"module_id":1,"hours":4.5},{"module_id":2,"hours":7.5}]', 12.00, '2026-04-06 07:38:00');

INSERT INTO planning_change_requests (`id`, `formateur_id`, `module_id`, `groupe_code`, `semaine`, `request_week`, `academic_year`, `reason`, `status`, `created_at`, `updated_at`, `processed_at`) VALUES
  (4101, 110, 102, 'SCM-2A', 'Semaine 28', 28, @academic_year, 'Demande de permutation de la seance du mardi pour disponibilite salle.', 'validated', '2026-04-02 09:00:00', '2026-04-03 10:00:00', '2026-04-03 10:00:00'),
  (4102, 116, 103, 'TSL-2A', 'Semaine 28', 28, @academic_year, 'Besoin de decaler l atelier transport apres la visite terrain.', 'rejected', '2026-04-02 09:20:00', '2026-04-03 10:20:00', '2026-04-03 10:20:00'),
  (4103, 108, 108, 'DEV-WEB', 'Semaine 30', 30, @academic_year, 'Demande de confirmation de la salle demo React.', 'pending', '2026-04-04 11:00:00', NULL, NULL),
  (4104, 112, 109, 'ERP-OPS', 'Semaine 30', 30, @academic_year, 'Validation d un atelier API avec expose final.', 'planned', '2026-04-04 11:20:00', '2026-04-05 15:00:00', '2026-04-05 15:00:00'),
  (4105, 113, 114, 'DATA-AI', 'Semaine 30', 30, @academic_year, 'Passage d une seance cloud au laboratoire data.', 'validated', '2026-04-04 11:40:00', '2026-04-05 15:20:00', '2026-04-05 15:20:00'),
  (4106, 117, 104, 'TSL-2A', 'Semaine 29', 29, @academic_year, 'Demande de regroupement de deux micro-seances TMS.', 'pending', '2026-04-04 12:00:00', NULL, NULL),
  (4107, 118, 113, 'DEV-WEB', 'Semaine 30', 30, @academic_year, 'Demande de report pour intervention securite invitee.', 'rejected', '2026-04-04 12:20:00', '2026-04-05 15:40:00', '2026-04-05 15:40:00'),
  (4108, 101, 101, 'SCM-1A', 'Semaine 29', 29, @academic_year, 'Validation d une seance supplementaire de revision WMS.', 'planned', '2026-04-04 12:40:00', '2026-04-05 16:00:00', '2026-04-05 16:00:00');

INSERT INTO recent_activities (`id`, `formateur_id`, `module_id`, `action_label`, `action_tone`, `action_description`, `created_at`) VALUES
  (6001, 120, 109, 'Soumission validee', 'success', 'Le planning de Adil Lamrani sur API PHP PDO a ete valide pour la semaine 28.', '2026-04-06 11:16:00'),
  (6002, 105, 115, 'Soumission refusee', 'danger', 'Le reporting de Salma Bennani doit etre complete avant validation finale.', '2026-04-06 11:26:00'),
  (6003, 113, 114, 'Revision demandee', 'warning', 'Une precision sur les sauvegardes cloud a ete demandee.', '2026-04-06 10:46:00'),
  (6004, 112, 109, 'Soumission validee', 'success', 'La semaine API de Anas Ait Lahcen est validee.', '2026-04-06 10:06:00'),
  (6005, 108, 108, 'Soumission validee', 'success', 'Le module React cockpit logistique avance selon le plan.', '2026-04-06 09:56:00'),
  (6006, 111, 105, 'Soumission validee', 'success', 'Le module Odoo achats et stock a recu une validation sans reserve.', '2026-04-06 09:46:00'),
  (6007, 117, 104, 'Soumission validee', 'success', 'La charge TMS de Soukaina Ait Ali est approuvee.', '2026-04-06 09:36:00'),
  (6008, 116, 103, 'Soumission refusee', 'danger', 'La ventilation des heures de transport multimodal doit etre revue.', '2026-04-06 09:26:00'),
  (6009, 110, 102, 'Soumission validee', 'success', 'Le planning MRP de Zakaria Benjelloun est valide.', '2026-04-06 09:16:00'),
  (6010, 101, 101, 'Soumission validee', 'success', 'Le planning WMS de Amina El Idrissi est valide.', '2026-04-06 09:01:00'),
  (6011, 110, 102, 'Demande planning validee', 'success', 'La permutation de salle du module LOG102 a ete acceptee.', '2026-04-03 10:05:00'),
  (6012, 116, 103, 'Demande planning refusee', 'danger', 'Le decalage du module LOG201 n a pas ete retenu.', '2026-04-03 10:25:00'),
  (6013, 112, 109, 'Demande planifiee', 'info', 'L atelier API de la semaine 30 est maintenant planifie.', '2026-04-05 15:05:00'),
  (6014, 113, 114, 'Demande planning validee', 'success', 'La bascule cloud vers la salle Data a ete validee.', '2026-04-05 15:25:00'),
  (6015, 118, 113, 'Demande planning refusee', 'danger', 'Le report de la seance securite reseau a ete refuse.', '2026-04-05 15:45:00'),
  (6016, 101, 101, 'Demande planifiee', 'info', 'Une seance de revision WMS supplementaire a ete programmee.', '2026-04-05 16:05:00'),
  (6017, 115, 111, 'Performance module', 'info', 'Le module BI201 affiche une progression de 70 pour cent.', '2026-04-04 09:00:00'),
  (6018, 104, 112, 'Performance module', 'success', 'Le module AI201 est termine a 100 pour cent.', '2026-04-04 09:10:00'),
  (6019, 109, 110, 'Performance module', 'warning', 'Le module DB201 reste a 39 pour cent et demande un renfort.', '2026-04-04 09:20:00'),
  (6020, 118, 113, 'Performance module', 'warning', 'Le module NET101 reste a 40 pour cent avant la phase reseau avancee.', '2026-04-04 09:30:00');

INSERT INTO formateur_modules (`formateur_id`, `module_id`, `competence_level`, `created_at`)
SELECT
  a.formateur_id,
  a.module_id,
  3 + MOD(a.formateur_id + a.module_id, 3),
  '2025-09-21 09:00:00'
FROM affectations a
WHERE a.id BETWEEN 2001 AND 2050;

INSERT INTO formateur_module_scores (`formateur_id`, `module_id`, `score`, `last_updated_at`)
SELECT
  a.formateur_id,
  a.module_id,
  ROUND(68 + MOD(a.formateur_id * a.module_id, 27) + (MOD(a.module_id, 5) * 0.5), 2),
  '2026-03-28 10:00:00'
FROM affectations a
WHERE a.id BETWEEN 2001 AND 2050;

INSERT INTO ai_scores (`formateur_id`, `module_id`, `score`, `reason`, `created_at`) VALUES
  (101, 101, 92.50, '{"competence":5,"experience":4,"fit":"WMS","notes":["animation stable","bonne maitrise terrain"]}', '2026-03-29 09:00:00'),
  (110, 102, 91.20, '{"competence":5,"experience":5,"fit":"MRP","notes":["bonne planification","bonne tenue de groupe"]}', '2026-03-29 09:05:00'),
  (116, 103, 88.40, '{"competence":4,"experience":5,"fit":"transport","notes":["cas terrain solides","cadre douane maitrise"]}', '2026-03-29 09:10:00'),
  (117, 104, 90.10, '{"competence":5,"experience":4,"fit":"TMS","notes":["bonne approche KPI","bonne gestion atelier"]}', '2026-03-29 09:15:00'),
  (111, 105, 93.30, '{"competence":5,"experience":4,"fit":"odoo","notes":["parametrage propre","bonne progression groupe"]}', '2026-03-29 09:20:00'),
  (111, 106, 89.60, '{"competence":4,"experience":4,"fit":"kpi","notes":["suivi clair","vision metier"]}', '2026-03-29 09:25:00'),
  (108, 107, 91.80, '{"competence":5,"experience":4,"fit":"frontend","notes":["ui premium","bonne cadence"]}', '2026-03-29 09:30:00'),
  (108, 108, 94.10, '{"competence":5,"experience":5,"fit":"react","notes":["animations fluides","bonne structure"]}', '2026-03-29 09:35:00'),
  (112, 109, 93.00, '{"competence":5,"experience":5,"fit":"api","notes":["bonne architecture","gestion propre des erreurs"]}', '2026-03-29 09:40:00'),
  (109, 110, 87.20, '{"competence":4,"experience":4,"fit":"mysql","notes":["indexation correcte","effort sur optimisation"]}', '2026-03-29 09:45:00'),
  (115, 111, 90.70, '{"competence":5,"experience":4,"fit":"bi","notes":["visualisations claires","storytelling data"]}', '2026-03-29 09:50:00'),
  (104, 112, 92.10, '{"competence":5,"experience":4,"fit":"ml","notes":["bonne rigueur","exemples concrets"]}', '2026-03-29 09:55:00'),
  (118, 113, 86.90, '{"competence":4,"experience":4,"fit":"cyber","notes":["bons labs","rythme a renforcer"]}', '2026-03-29 10:00:00'),
  (113, 114, 88.30, '{"competence":4,"experience":4,"fit":"cloud","notes":["bonne surveillance","cas de reprise solides"]}', '2026-03-29 10:05:00'),
  (102, 115, 85.40, '{"competence":4,"experience":3,"fit":"agile","notes":["bonne posture produit","supports clairs"]}', '2026-03-29 10:10:00');

INSERT INTO formateur_module_preferences (`formateur_id`, `module_id`, `status`, `message_chef`, `created_at`, `updated_at`) VALUES
  (101, 102, 'accepted', 'Bonne complementarite entre stocks et planification.', '2026-03-10 09:00:00', '2026-03-12 10:00:00'),
  (103, 102, 'rejected', 'Priorite donnee a un profil deja engage sur la filiere SCM.', '2026-03-10 09:10:00', '2026-03-12 10:05:00'),
  (106, 112, 'accepted', 'Votre profil ML est retenu pour renforcer la filiere Data.', '2026-03-10 09:20:00', '2026-03-12 10:10:00'),
  (114, 106, 'accepted', 'Experience ERP terrain tres utile pour ce module KPI.', '2026-03-10 09:30:00', '2026-03-12 10:15:00'),
  (118, 114, 'pending', NULL, '2026-03-10 09:40:00', '2026-03-10 09:40:00'),
  (119, 107, 'pending', NULL, '2026-03-10 09:50:00', '2026-03-10 09:50:00'),
  (120, 109, 'accepted', 'Integrations et securisation API en adequation avec le besoin.', '2026-03-10 10:00:00', '2026-03-12 10:20:00'),
  (105, 115, 'rejected', 'Le module reste pilote par la filiere projet cette annee.', '2026-03-10 10:10:00', '2026-03-12 10:25:00');

INSERT INTO evaluation_questionnaires (`id`, `title`, `created_at`) VALUES
  (101, 'Barometre qualite pedagogique - printemps 2026', '2026-02-01 08:00:00');

INSERT INTO evaluation_questions (`id`, `questionnaire_id`, `question_text`, `type`, `weight`, `created_at`) VALUES
  (10101, 101, 'Le formateur maitrise le contenu du module.', 'rating', 1.00, '2026-02-01 08:01:00'),
  (10102, 101, 'Les explications sont claires et structurees.', 'rating', 1.00, '2026-02-01 08:02:00'),
  (10103, 101, 'Le rythme de la seance est adapte au groupe.', 'rating', 1.00, '2026-02-01 08:03:00'),
  (10104, 101, 'Le formateur favorise-t-il la participation du groupe ?', 'yes/no', 1.00, '2026-02-01 08:04:00'),
  (10105, 101, 'Le planning et les horaires sont-ils respectes ?', 'yes/no', 1.00, '2026-02-01 08:05:00'),
  (10106, 101, 'La qualite des exercices et ateliers est satisfaisante.', 'rating', 1.00, '2026-02-01 08:06:00'),
  (10107, 101, 'Les supports pedagogiques sont utiles.', 'rating', 1.00, '2026-02-01 08:07:00'),
  (10108, 101, 'Commentaire libre sur cette intervention.', 'text', 0.00, '2026-02-01 08:08:00');

UPDATE module_questionnaires
SET total_questions = 8,
    updated_at = '2026-02-01 08:10:00'
WHERE module_id BETWEEN 101 AND 115;

INSERT INTO evaluation_answers (`formateur_id`, `module_id`, `question_id`, `value`, `created_at`) VALUES
  (1, 1, 10101, '5', '2026-03-27 17:30:00'),
  (1, 1, 10102, '4', '2026-03-27 17:30:10'),
  (1, 1, 10103, '4', '2026-03-27 17:30:20'),
  (1, 1, 10104, 'yes', '2026-03-27 17:30:30'),
  (1, 1, 10105, 'yes', '2026-03-27 17:30:40'),
  (1, 1, 10106, '5', '2026-03-27 17:30:50'),
  (1, 1, 10107, '4', '2026-03-27 17:31:00'),
  (1, 1, 10108, 'Atelier dynamique et tres accessible pour le groupe.', '2026-03-27 17:31:10'),
  (1, 2, 10101, '5', '2026-03-27 17:35:00'),
  (1, 2, 10102, '4', '2026-03-27 17:35:10'),
  (1, 2, 10103, '4', '2026-03-27 17:35:20'),
  (1, 2, 10104, 'yes', '2026-03-27 17:35:30'),
  (1, 2, 10105, 'yes', '2026-03-27 17:35:40'),
  (1, 2, 10106, '4', '2026-03-27 17:35:50'),
  (1, 2, 10107, '4', '2026-03-27 17:36:00'),
  (1, 2, 10108, 'Bonne progression sur React et cas pratiques motivants.', '2026-03-27 17:36:10'),
  (101, 101, 10101, '5', '2026-03-28 09:00:00'),
  (101, 101, 10102, '5', '2026-03-28 09:00:10'),
  (101, 101, 10103, '4', '2026-03-28 09:00:20'),
  (101, 101, 10104, 'yes', '2026-03-28 09:00:30'),
  (101, 101, 10105, 'yes', '2026-03-28 09:00:40'),
  (101, 101, 10106, '5', '2026-03-28 09:00:50'),
  (101, 101, 10107, '4', '2026-03-28 09:01:00'),
  (101, 101, 10108, 'Tres bonne maitrise terrain et supports utiles.', '2026-03-28 09:01:10'),
  (110, 102, 10101, '4', '2026-03-28 09:05:00'),
  (110, 102, 10102, '4', '2026-03-28 09:05:10'),
  (110, 102, 10103, '4', '2026-03-28 09:05:20'),
  (110, 102, 10104, 'yes', '2026-03-28 09:05:30'),
  (110, 102, 10105, 'yes', '2026-03-28 09:05:40'),
  (110, 102, 10106, '4', '2026-03-28 09:05:50'),
  (110, 102, 10107, '4', '2026-03-28 09:06:00'),
  (110, 102, 10108, 'Bon niveau MRP et cas fournisseurs credibles.', '2026-03-28 09:06:10'),
  (116, 103, 10101, '4', '2026-03-28 09:10:00'),
  (116, 103, 10102, '4', '2026-03-28 09:10:10'),
  (116, 103, 10103, '3', '2026-03-28 09:10:20'),
  (116, 103, 10104, 'yes', '2026-03-28 09:10:30'),
  (116, 103, 10105, 'yes', '2026-03-28 09:10:40'),
  (116, 103, 10106, '4', '2026-03-28 09:10:50'),
  (116, 103, 10107, '3', '2026-03-28 09:11:00'),
  (116, 103, 10108, 'Contenu solide mais rythme a lisser sur les cas de transit.', '2026-03-28 09:11:10'),
  (117, 104, 10101, '5', '2026-03-28 09:15:00'),
  (117, 104, 10102, '4', '2026-03-28 09:15:10'),
  (117, 104, 10103, '4', '2026-03-28 09:15:20'),
  (117, 104, 10104, 'yes', '2026-03-28 09:15:30'),
  (117, 104, 10105, 'yes', '2026-03-28 09:15:40'),
  (117, 104, 10106, '4', '2026-03-28 09:15:50'),
  (117, 104, 10107, '4', '2026-03-28 09:16:00'),
  (117, 104, 10108, 'Bonne animation et exemples concrets de TMS.', '2026-03-28 09:16:10'),
  (111, 105, 10101, '5', '2026-03-28 09:20:00'),
  (111, 105, 10102, '5', '2026-03-28 09:20:10'),
  (111, 105, 10103, '5', '2026-03-28 09:20:20'),
  (111, 105, 10104, 'yes', '2026-03-28 09:20:30'),
  (111, 105, 10105, 'yes', '2026-03-28 09:20:40'),
  (111, 105, 10106, '5', '2026-03-28 09:20:50'),
  (111, 105, 10107, '5', '2026-03-28 09:21:00'),
  (111, 105, 10108, 'Excellente prise en main Odoo et animation tres claire.', '2026-03-28 09:21:10'),
  (111, 106, 10101, '4', '2026-03-28 09:25:00'),
  (111, 106, 10102, '4', '2026-03-28 09:25:10'),
  (111, 106, 10103, '4', '2026-03-28 09:25:20'),
  (111, 106, 10104, 'yes', '2026-03-28 09:25:30'),
  (111, 106, 10105, 'yes', '2026-03-28 09:25:40'),
  (111, 106, 10106, '5', '2026-03-28 09:25:50'),
  (111, 106, 10107, '4', '2026-03-28 09:26:00'),
  (111, 106, 10108, 'Dashboard KPI utile et bien contextualise.', '2026-03-28 09:26:10'),
  (108, 107, 10101, '5', '2026-03-28 09:30:00'),
  (108, 107, 10102, '5', '2026-03-28 09:30:10'),
  (108, 107, 10103, '4', '2026-03-28 09:30:20'),
  (108, 107, 10104, 'yes', '2026-03-28 09:30:30'),
  (108, 107, 10105, 'yes', '2026-03-28 09:30:40'),
  (108, 107, 10106, '5', '2026-03-28 09:30:50'),
  (108, 107, 10107, '5', '2026-03-28 09:31:00'),
  (108, 107, 10108, 'Interface moderne et exercices tres motivants.', '2026-03-28 09:31:10'),
  (108, 108, 10101, '5', '2026-03-28 09:35:00'),
  (108, 108, 10102, '5', '2026-03-28 09:35:10'),
  (108, 108, 10103, '5', '2026-03-28 09:35:20'),
  (108, 108, 10104, 'yes', '2026-03-28 09:35:30'),
  (108, 108, 10105, 'yes', '2026-03-28 09:35:40'),
  (108, 108, 10106, '5', '2026-03-28 09:35:50'),
  (108, 108, 10107, '4', '2026-03-28 09:36:00'),
  (108, 108, 10108, 'Tres bonne energie sur React et bonnes demonstrations live.', '2026-03-28 09:36:10'),
  (112, 109, 10101, '5', '2026-03-28 09:40:00'),
  (112, 109, 10102, '4', '2026-03-28 09:40:10'),
  (112, 109, 10103, '5', '2026-03-28 09:40:20'),
  (112, 109, 10104, 'yes', '2026-03-28 09:40:30'),
  (112, 109, 10105, 'yes', '2026-03-28 09:40:40'),
  (112, 109, 10106, '4', '2026-03-28 09:40:50'),
  (112, 109, 10107, '5', '2026-03-28 09:41:00'),
  (112, 109, 10108, 'Architecture backend claire et exemples tres concrets.', '2026-03-28 09:41:10'),
  (109, 110, 10101, '4', '2026-03-28 09:45:00'),
  (109, 110, 10102, '4', '2026-03-28 09:45:10'),
  (109, 110, 10103, '4', '2026-03-28 09:45:20'),
  (109, 110, 10104, 'yes', '2026-03-28 09:45:30'),
  (109, 110, 10105, 'yes', '2026-03-28 09:45:40'),
  (109, 110, 10106, '4', '2026-03-28 09:45:50'),
  (109, 110, 10107, '4', '2026-03-28 09:46:00'),
  (109, 110, 10108, 'Cours utile, surtout la partie optimisation et indexes.', '2026-03-28 09:46:10'),
  (115, 111, 10101, '5', '2026-03-28 09:50:00'),
  (115, 111, 10102, '4', '2026-03-28 09:50:10'),
  (115, 111, 10103, '4', '2026-03-28 09:50:20'),
  (115, 111, 10104, 'yes', '2026-03-28 09:50:30'),
  (115, 111, 10105, 'yes', '2026-03-28 09:50:40'),
  (115, 111, 10106, '5', '2026-03-28 09:50:50'),
  (115, 111, 10107, '5', '2026-03-28 09:51:00'),
  (115, 111, 10108, 'Visualisations propres et bonne lecture des KPIs.', '2026-03-28 09:51:10'),
  (104, 112, 10101, '4', '2026-03-28 09:55:00'),
  (104, 112, 10102, '4', '2026-03-28 09:55:10'),
  (104, 112, 10103, '4', '2026-03-28 09:55:20'),
  (104, 112, 10104, 'yes', '2026-03-28 09:55:30'),
  (104, 112, 10105, 'no', '2026-03-28 09:55:40'),
  (104, 112, 10106, '4', '2026-03-28 09:55:50'),
  (104, 112, 10107, '4', '2026-03-28 09:56:00'),
  (104, 112, 10108, 'Bonne expertise mais il faut mieux caler le rythme des labs.', '2026-03-28 09:56:10'),
  (118, 113, 10101, '4', '2026-03-28 10:00:00'),
  (118, 113, 10102, '3', '2026-03-28 10:00:10'),
  (118, 113, 10103, '4', '2026-03-28 10:00:20'),
  (118, 113, 10104, 'yes', '2026-03-28 10:00:30'),
  (118, 113, 10105, 'yes', '2026-03-28 10:00:40'),
  (118, 113, 10106, '4', '2026-03-28 10:00:50'),
  (118, 113, 10107, '3', '2026-03-28 10:01:00'),
  (118, 113, 10108, 'Bon contenu securite, supports a densifier un peu.', '2026-03-28 10:01:10'),
  (113, 114, 10101, '4', '2026-03-28 10:05:00'),
  (113, 114, 10102, '4', '2026-03-28 10:05:10'),
  (113, 114, 10103, '4', '2026-03-28 10:05:20'),
  (113, 114, 10104, 'yes', '2026-03-28 10:05:30'),
  (113, 114, 10105, 'yes', '2026-03-28 10:05:40'),
  (113, 114, 10106, '4', '2026-03-28 10:05:50'),
  (113, 114, 10107, '4', '2026-03-28 10:06:00'),
  (113, 114, 10108, 'Seances cloud bien structurees et cas incident utiles.', '2026-03-28 10:06:10'),
  (102, 115, 10101, '4', '2026-03-28 10:10:00'),
  (102, 115, 10102, '5', '2026-03-28 10:10:10'),
  (102, 115, 10103, '4', '2026-03-28 10:10:20'),
  (102, 115, 10104, 'yes', '2026-03-28 10:10:30'),
  (102, 115, 10105, 'yes', '2026-03-28 10:10:40'),
  (102, 115, 10106, '4', '2026-03-28 10:10:50'),
  (102, 115, 10107, '4', '2026-03-28 10:11:00'),
  (102, 115, 10108, 'Bonne posture agile et bon pilotage des ateliers.', '2026-03-28 10:11:10');

INSERT INTO evaluation_scores (`formateur_id`, `module_id`, `total_score`, `max_score`, `percentage`, `created_at`) VALUES
  (1, 1, 32.00, 35.00, 91.43, '2026-03-27 18:00:00'),
  (1, 2, 31.00, 35.00, 88.57, '2026-03-27 18:05:00'),
  (101, 101, 33.00, 35.00, 94.29, '2026-03-28 18:00:00'),
  (110, 102, 30.00, 35.00, 85.71, '2026-03-28 18:05:00'),
  (116, 103, 28.00, 35.00, 80.00, '2026-03-28 18:10:00'),
  (117, 104, 31.00, 35.00, 88.57, '2026-03-28 18:15:00'),
  (111, 105, 35.00, 35.00, 100.00, '2026-03-28 18:20:00'),
  (111, 106, 31.00, 35.00, 88.57, '2026-03-28 18:25:00'),
  (108, 107, 34.00, 35.00, 97.14, '2026-03-28 18:30:00'),
  (108, 108, 34.00, 35.00, 97.14, '2026-03-28 18:35:00'),
  (112, 109, 33.00, 35.00, 94.29, '2026-03-28 18:40:00'),
  (109, 110, 30.00, 35.00, 85.71, '2026-03-28 18:45:00'),
  (115, 111, 33.00, 35.00, 94.29, '2026-03-28 18:50:00'),
  (104, 112, 26.00, 35.00, 74.29, '2026-03-28 18:55:00'),
  (118, 113, 28.00, 35.00, 80.00, '2026-03-28 19:00:00'),
  (113, 114, 30.00, 35.00, 85.71, '2026-03-28 19:05:00'),
  (102, 115, 31.00, 35.00, 88.57, '2026-03-28 19:10:00');

UPDATE formateur_module_scores
SET
  score = CASE
    WHEN formateur_id = 1 AND module_id = 1 THEN 91.43
    WHEN formateur_id = 1 AND module_id = 2 THEN 88.57
    WHEN formateur_id = 101 AND module_id = 101 THEN 94.29
    WHEN formateur_id = 110 AND module_id = 102 THEN 85.71
    WHEN formateur_id = 116 AND module_id = 103 THEN 80.00
    WHEN formateur_id = 117 AND module_id = 104 THEN 88.57
    WHEN formateur_id = 111 AND module_id = 105 THEN 100.00
    WHEN formateur_id = 111 AND module_id = 106 THEN 88.57
    WHEN formateur_id = 108 AND module_id = 107 THEN 97.14
    WHEN formateur_id = 108 AND module_id = 108 THEN 97.14
    WHEN formateur_id = 112 AND module_id = 109 THEN 94.29
    WHEN formateur_id = 109 AND module_id = 110 THEN 85.71
    WHEN formateur_id = 115 AND module_id = 111 THEN 94.29
    WHEN formateur_id = 104 AND module_id = 112 THEN 74.29
    WHEN formateur_id = 118 AND module_id = 113 THEN 80.00
    WHEN formateur_id = 113 AND module_id = 114 THEN 85.71
    WHEN formateur_id = 102 AND module_id = 115 THEN 88.57
    ELSE score
  END,
  last_updated_at = CASE
    WHEN formateur_id = 1 AND module_id = 1 THEN '2026-03-27 18:00:00'
    WHEN formateur_id = 1 AND module_id = 2 THEN '2026-03-27 18:05:00'
    WHEN formateur_id = 101 AND module_id = 101 THEN '2026-03-28 18:00:00'
    WHEN formateur_id = 110 AND module_id = 102 THEN '2026-03-28 18:05:00'
    WHEN formateur_id = 116 AND module_id = 103 THEN '2026-03-28 18:10:00'
    WHEN formateur_id = 117 AND module_id = 104 THEN '2026-03-28 18:15:00'
    WHEN formateur_id = 111 AND module_id = 105 THEN '2026-03-28 18:20:00'
    WHEN formateur_id = 111 AND module_id = 106 THEN '2026-03-28 18:25:00'
    WHEN formateur_id = 108 AND module_id = 107 THEN '2026-03-28 18:30:00'
    WHEN formateur_id = 108 AND module_id = 108 THEN '2026-03-28 18:35:00'
    WHEN formateur_id = 112 AND module_id = 109 THEN '2026-03-28 18:40:00'
    WHEN formateur_id = 109 AND module_id = 110 THEN '2026-03-28 18:45:00'
    WHEN formateur_id = 115 AND module_id = 111 THEN '2026-03-28 18:50:00'
    WHEN formateur_id = 104 AND module_id = 112 THEN '2026-03-28 18:55:00'
    WHEN formateur_id = 118 AND module_id = 113 THEN '2026-03-28 19:00:00'
    WHEN formateur_id = 113 AND module_id = 114 THEN '2026-03-28 19:05:00'
    WHEN formateur_id = 102 AND module_id = 115 THEN '2026-03-28 19:10:00'
    ELSE last_updated_at
  END
WHERE
  (formateur_id = 1 AND module_id = 1) OR
  (formateur_id = 1 AND module_id = 2) OR
  (formateur_id = 101 AND module_id = 101) OR
  (formateur_id = 110 AND module_id = 102) OR
  (formateur_id = 116 AND module_id = 103) OR
  (formateur_id = 117 AND module_id = 104) OR
  (formateur_id = 111 AND module_id = 105) OR
  (formateur_id = 111 AND module_id = 106) OR
  (formateur_id = 108 AND module_id = 107) OR
  (formateur_id = 108 AND module_id = 108) OR
  (formateur_id = 112 AND module_id = 109) OR
  (formateur_id = 109 AND module_id = 110) OR
  (formateur_id = 115 AND module_id = 111) OR
  (formateur_id = 104 AND module_id = 112) OR
  (formateur_id = 118 AND module_id = 113) OR
  (formateur_id = 113 AND module_id = 114) OR
  (formateur_id = 102 AND module_id = 115);

INSERT INTO `system_meta` (`meta_key`, `meta_value`, `updated_at`) VALUES
  ('demo_seed_dataset', 'smart-logistics-spring-2026', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
  `meta_value` = VALUES(`meta_value`),
  `updated_at` = VALUES(`updated_at`);

COMMIT;
