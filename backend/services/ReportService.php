<?php

require_once __DIR__ . '/../repositories/ReportRepository.php';
require_once __DIR__ . '/../repositories/DashboardRepository.php';
require_once __DIR__ . '/../core/HttpException.php';

class ReportService
{
    private const EXCEL_EXTENSION = 'xls';
    private const PDF_MEMORY_LIMIT = '768M';
    private const PDF_DPI = 96;

    private PDO $db;
    private ReportRepository $reports;
    private DashboardRepository $dashboard;
    private ?array $headerAssets = null;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->reports = new ReportRepository($db);
        $this->dashboard = new DashboardRepository($db);
    }

    public function recent(): array
    {
        return $this->reports->recent();
    }

    public function generateWorkload(string $format, int $generatedBy): array
    {
        $rows = $this->reports->getWorkloadRows(currentAcademicYear());
        $plannedSessionsTotal = array_sum(array_map(static fn(array $row): int => intval($row['planned_sessions'] ?? 0), $rows));
        $plannedHoursTotal = array_sum(array_map(static fn(array $row): float => floatval($row['planned_hours'] ?? 0), $rows));
        $annualHoursTotal = array_sum(array_map(static fn(array $row): float => floatval($row['annual_hours'] ?? 0), $rows));
        $completedHoursTotal = array_sum(array_map(static fn(array $row): float => floatval($row['completed_hours'] ?? 0), $rows));
        $pendingTotal = array_sum(array_map(static fn(array $row): int => intval($row['pending_submissions'] ?? 0), $rows));

        $dataRows = array_map(function (array $row): array {
            return [
                $this->textCell($row['nom'] ?? ''),
                $this->textCell($row['specialite'] ?? ''),
                $this->textCell($row['modules'] ?? ''),
                $this->numberCell(intval($row['planned_sessions'] ?? 0), 'integer'),
                $this->numberCell(floatval($row['planned_hours'] ?? 0), 'hours'),
                $this->numberCell(floatval($row['annual_hours'] ?? 0), 'hours'),
                $this->numberCell(floatval($row['completed_hours'] ?? 0), 'hours'),
                $this->numberCell(intval($row['pending_submissions'] ?? 0), 'integer'),
            ];
        }, $rows);

        $summary = [
            'Formateurs' => count($rows),
            'Heures planifiees validees' => $this->formatHours($plannedHoursTotal),
            'Heures assignees' => $this->formatHours($annualHoursTotal),
            'Heures realisees' => $this->formatHours($completedHoursTotal),
            'Taux de realisation moyen' => $rows !== []
                ? $this->formatPercent(($completedHoursTotal / max($plannedHoursTotal, 1)) * 100)
                : '0%',
        ];

        return $this->generate(
            'workload',
            $format,
            $this->reportTitle('Charge des enseignants'),
            $generatedBy,
            [],
            [],
            $summary,
            [
                'subtitle' => 'Pilotage de la charge pedagogique du pole',
                'sections' => [
                    $this->buildSection(
                        'Charge detaillee par formateur',
                        ['Formateur', 'Specialite', 'Modules', 'Seances planifiees', 'Heures planifiees', 'Charge annuelle', 'Heures realisees', 'Soumissions en attente'],
                        $dataRows,
                        $this->buildAggregateFooter(
                            'Totaux',
                            8,
                            count($dataRows),
                            [
                                3 => ['operation' => 'SUM', 'value' => $plannedSessionsTotal, 'format' => 'integer'],
                                4 => ['operation' => 'SUM', 'value' => $plannedHoursTotal, 'format' => 'hours'],
                                5 => ['operation' => 'SUM', 'value' => $annualHoursTotal, 'format' => 'hours'],
                                6 => ['operation' => 'SUM', 'value' => $completedHoursTotal, 'format' => 'hours'],
                                7 => ['operation' => 'SUM', 'value' => $pendingTotal, 'format' => 'integer'],
                            ]
                        )
                    ),
                ],
            ]
        );
    }

    public function generateModuleProgress(string $format, int $generatedBy): array
    {
        $rows = $this->reports->getModuleProgressRows(currentAcademicYear());
        $volumeTotal = array_sum(array_map(static fn(array $row): float => floatval($row['volume_horaire'] ?? 0), $rows));
        $completedTotal = array_sum(array_map(static fn(array $row): float => floatval($row['completed_hours'] ?? 0), $rows));
        $progressAverage = $rows !== []
            ? array_sum(array_map(static fn(array $row): float => floatval($row['progress_percent'] ?? 0), $rows)) / count($rows)
            : 0;

        $dataRows = array_map(function (array $row): array {
            return [
                $this->textCell($row['code'] ?? ''),
                $this->textCell($row['intitule'] ?? ''),
                $this->textCell($row['filiere'] ?? ''),
                $this->textCell($row['formateur_nom'] ?? ''),
                $this->textCell($row['groupes'] ?? ''),
                $this->numberCell(floatval($row['volume_horaire'] ?? 0), 'hours'),
                $this->numberCell(floatval($row['completed_hours'] ?? 0), 'hours'),
                $this->numberCell(floatval($row['progress_percent'] ?? 0), 'percent'),
            ];
        }, $rows);

        return $this->generate(
            'module_progress',
            $format,
            $this->reportTitle('Progression des modules'),
            $generatedBy,
            [],
            [],
            [
                'Modules' => count($rows),
                'Volume total' => $this->formatHours($volumeTotal),
                'Heures realisees' => $this->formatHours($completedTotal),
                'Progression moyenne' => $this->formatPercent($progressAverage),
            ],
            [
                'subtitle' => 'Etat d avancement pedagogique par module',
                'sections' => [
                    $this->buildSection(
                        'Progression par module',
                        ['Code', 'Module', 'Filiere', 'Formateur', 'Groupes', 'Heures', 'Realisees', 'Progression'],
                        $dataRows,
                        $this->buildAggregateFooter(
                            'Totaux / moyennes',
                            8,
                            count($dataRows),
                            [
                                5 => ['operation' => 'SUM', 'value' => $volumeTotal, 'format' => 'hours'],
                                6 => ['operation' => 'SUM', 'value' => $completedTotal, 'format' => 'hours'],
                                7 => ['operation' => 'AVERAGE', 'value' => $progressAverage, 'format' => 'percent'],
                            ]
                        )
                    ),
                ],
            ]
        );
    }

    public function generateAssignmentCoverage(string $format, int $generatedBy): array
    {
        $rows = $this->reports->getAssignmentCoverageRows(currentAcademicYear());
        $assignedCount = count(array_filter($rows, static fn(array $row): bool => ($row['statut'] ?? '') === 'Affecte'));
        $freeCount = count(array_filter($rows, static fn(array $row): bool => ($row['statut'] ?? '') === 'Libre'));
        $volumeTotal = array_sum(array_map(static fn(array $row): float => floatval($row['volume_horaire'] ?? 0), $rows));

        $dataRows = array_map(function (array $row): array {
            return [
                $this->textCell($row['code'] ?? ''),
                $this->textCell($row['intitule'] ?? ''),
                $this->textCell($row['filiere'] ?? ''),
                $this->textCell($row['semestre'] ?? ''),
                $this->textCell($row['groupes'] ?? ''),
                $this->numberCell(floatval($row['volume_horaire'] ?? 0), 'hours'),
                $this->textCell($row['formateur_nom'] ?? ''),
                $this->textCell($row['statut'] ?? ''),
            ];
        }, $rows);

        return $this->generate(
            'assignment_coverage',
            $format,
            $this->reportTitle('Couverture des affectations'),
            $generatedBy,
            [],
            [],
            [
                'Modules' => count($rows),
                'Affectes' => $assignedCount,
                'Libres' => $freeCount,
                'Volume horaire' => $this->formatHours($volumeTotal),
            ],
            [
                'subtitle' => 'Cartographie des modules affectes ou libres',
                'sections' => [
                    $this->buildSection(
                        'Couverture des affectations',
                        ['Code', 'Module', 'Filiere', 'Semestre', 'Groupes', 'Volume', 'Formateur', 'Statut'],
                        $dataRows,
                        $this->buildAggregateFooter(
                            'Totaux',
                            8,
                            count($dataRows),
                            [
                                5 => ['operation' => 'SUM', 'value' => $volumeTotal, 'format' => 'hours'],
                            ]
                        )
                    ),
                ],
            ]
        );
    }

    public function generateValidationStatus(string $format, int $generatedBy): array
    {
        $rows = $this->reports->getValidationStatusRows();
        $submittedTotal = array_sum(array_map(static fn(array $row): float => floatval($row['submitted_hours'] ?? 0), $rows));
        $pendingCount = count(array_filter($rows, static fn(array $row): bool => ($row['status'] ?? '') === 'pending'));
        $revisionCount = count(array_filter($rows, static fn(array $row): bool => in_array(($row['status'] ?? ''), ['revision', 'rejected'], true)));

        $dataRows = array_map(function (array $row): array {
            return [
                $this->textCell($row['formateur_nom'] ?? ''),
                $this->textCell($row['specialite'] ?? ''),
                $this->numberCell(intval($row['semaine'] ?? 0), 'integer'),
                $this->numberCell(intval($row['academic_year'] ?? 0), 'integer'),
                $this->numberCell(floatval($row['submitted_hours'] ?? 0), 'hours'),
                $this->textCell($row['status'] ?? ''),
                $this->textCell($row['submitted_at'] ?: '-'),
                $this->textCell($row['processed_at'] ?: '-'),
                $this->textCell(($row['decision_note'] ?? '') !== '' ? $row['decision_note'] : '-'),
            ];
        }, $rows);

        return $this->generate(
            'validation_status',
            $format,
            $this->reportTitle('Suivi des validations de planning'),
            $generatedBy,
            [],
            [],
            [
                'Soumissions' => count($rows),
                'Heures soumises' => $this->formatHours($submittedTotal),
                'En attente' => $pendingCount,
                'Revision / rejet' => $revisionCount,
            ],
            [
                'subtitle' => 'Suivi des statuts et de la charge soumise',
                'sections' => [
                    $this->buildSection(
                        'Validation du planning',
                        ['Formateur', 'Specialite', 'Semaine', 'Annee', 'Heures soumises', 'Statut', 'Soumis le', 'Traite le', 'Note'],
                        $dataRows,
                        $this->buildAggregateFooter(
                            'Totaux',
                            9,
                            count($dataRows),
                            [
                                4 => ['operation' => 'SUM', 'value' => $submittedTotal, 'format' => 'hours'],
                            ]
                        )
                    ),
                ],
            ]
        );
    }

    public function generateTrainerPerformance(string $format, int $generatedBy): array
    {
        $rows = $this->dashboard->getModulePerformanceRows(currentAcademicYear(), 1000);
        $modules = array_unique(array_map(static fn(array $row): int => intval($row['module_id'] ?? 0), $rows));
        $trainers = array_unique(array_map(static fn(array $row): int => intval($row['formateur_id'] ?? 0), $rows));
        $avgCompletion = $rows !== []
            ? array_sum(array_map(static fn(array $row): float => floatval($row['completion_percent'] ?? 0), $rows)) / count($rows)
            : 0;
        $questionnaireValues = array_values(array_filter(array_map(
            static fn(array $row): ?float => $row['questionnaire_percentage'] !== null ? floatval($row['questionnaire_percentage']) : null,
            $rows
        ), static fn($value): bool => $value !== null));
        $avgQuestionnaire = $questionnaireValues !== []
            ? array_sum($questionnaireValues) / count($questionnaireValues)
            : 0;

        $dataRows = array_map(function (array $row): array {
            return [
                $this->textCell($row['code'] ?? ''),
                $this->textCell($row['intitule'] ?? ''),
                $this->textCell($row['filiere'] ?? ''),
                $this->textCell($row['formateur_nom'] ?? ''),
                $this->numberCell(floatval($row['completed_hours'] ?? 0), 'hours'),
                $this->numberCell(floatval($row['volume_horaire'] ?? 0), 'hours'),
                $this->numberCell(floatval($row['completion_percent'] ?? 0), 'percent'),
                $this->nullablePercentCell($row['questionnaire_percentage']),
            ];
        }, $rows);

        return $this->generate(
            'trainer_performance',
            $format,
            $this->reportTitle('Performance formateur par module'),
            $generatedBy,
            [],
            [],
            [
                'Lignes analysees' => count($rows),
                'Modules couverts' => count($modules),
                'Formateurs concernes' => count($trainers),
                'Progression moyenne' => $this->formatPercent($avgCompletion),
                'Questionnaire moyen' => $this->formatPercent($avgQuestionnaire),
            ],
            [
                'subtitle' => 'Performance pedagogique croisee module et evaluation',
                'sections' => [
                    $this->buildSection(
                        'Performance par module',
                        ['Code', 'Module', 'Filiere', 'Formateur', 'Heures realisees', 'Volume', 'Progression', 'Questionnaire'],
                        $dataRows,
                        $this->buildAggregateFooter(
                            'Totaux / moyennes',
                            8,
                            count($dataRows),
                            [
                                4 => ['operation' => 'SUM', 'value' => array_sum(array_map(static fn(array $row): float => floatval($row['completed_hours'] ?? 0), $rows)), 'format' => 'hours'],
                                5 => ['operation' => 'SUM', 'value' => array_sum(array_map(static fn(array $row): float => floatval($row['volume_horaire'] ?? 0), $rows)), 'format' => 'hours'],
                                6 => ['operation' => 'AVERAGE', 'value' => $avgCompletion, 'format' => 'percent'],
                                7 => ['operation' => 'AVERAGE', 'value' => $avgQuestionnaire, 'format' => 'percent'],
                            ]
                        )
                    ),
                ],
            ]
        );
    }

    public function generateTeachingHours(string $format, int $generatedBy): array
    {
        $timeline = $this->dashboard->getTeachingLoadTimeline(12, 12);
        $weeklyRows = $timeline['weekly'] ?? [];
        $monthlyRows = $timeline['monthly'] ?? [];
        $weeklyTotal = array_sum(array_map(static fn(array $row): float => floatval($row['hours'] ?? 0), $weeklyRows));
        $monthlyTotal = array_sum(array_map(static fn(array $row): float => floatval($row['hours'] ?? 0), $monthlyRows));
        $weeklyAverage = $weeklyRows !== [] ? $weeklyTotal / count($weeklyRows) : 0;
        $monthlyAverage = $monthlyRows !== [] ? $monthlyTotal / count($monthlyRows) : 0;

        return $this->generate(
            'teaching_load',
            $format,
            $this->reportTitle('Heures d enseignement semaine et mois'),
            $generatedBy,
            [],
            [],
            [
                'Semaines analysees' => count($weeklyRows),
                'Heures hebdomadaires totales' => $this->formatHours($weeklyTotal),
                'Moyenne hebdomadaire' => $this->formatHours($weeklyAverage),
                'Mois analyses' => count($monthlyRows),
                'Heures mensuelles totales' => $this->formatHours($monthlyTotal),
                'Moyenne mensuelle' => $this->formatHours($monthlyAverage),
            ],
            [
                'subtitle' => 'Evolution recente de la charge d enseignement',
                'sections' => [
                    $this->buildSection(
                        'Charge hebdomadaire validee',
                        ['Periode', 'Heures validees'],
                        array_map(fn(array $row): array => [
                            $this->textCell($row['label'] ?? ''),
                            $this->numberCell(floatval($row['hours'] ?? 0), 'hours'),
                        ], $weeklyRows),
                        $this->buildAggregateFooter(
                            'Totaux / moyennes',
                            2,
                            count($weeklyRows),
                            [
                                1 => ['operation' => 'AVERAGE', 'value' => $weeklyAverage, 'format' => 'hours', 'label' => 'Moyenne'],
                            ]
                        )
                    ),
                    $this->buildSection(
                        'Charge mensuelle realisee',
                        ['Periode', 'Heures realisees'],
                        array_map(fn(array $row): array => [
                            $this->textCell($row['label'] ?? ''),
                            $this->numberCell(floatval($row['hours'] ?? 0), 'hours'),
                        ], $monthlyRows),
                        $this->buildAggregateFooter(
                            'Totaux / moyennes',
                            2,
                            count($monthlyRows),
                            [
                                1 => ['operation' => 'AVERAGE', 'value' => $monthlyAverage, 'format' => 'hours', 'label' => 'Moyenne'],
                            ]
                        )
                    ),
                ],
            ]
        );
    }

    public function generateQuestionnaireResults(string $format, int $generatedBy): array
    {
        $rows = $this->dashboard->getModulePerformanceRows(currentAcademicYear(), 1000);
        $grouped = [];

        foreach ($rows as $row) {
            if ($row['questionnaire_percentage'] === null) {
                continue;
            }

            $moduleId = intval($row['module_id'] ?? 0);
            if (!isset($grouped[$moduleId])) {
                $grouped[$moduleId] = [
                    'code' => $row['code'] ?? '',
                    'intitule' => $row['intitule'] ?? '',
                    'filiere' => $row['filiere'] ?? '',
                    'scores' => [],
                    'completion_scores' => [],
                ];
            }

            $grouped[$moduleId]['scores'][] = floatval($row['questionnaire_percentage']);
            $grouped[$moduleId]['completion_scores'][] = floatval($row['completion_percent'] ?? 0);
        }

        $moduleRows = array_values(array_map(function (array $row): array {
            $responseCount = count($row['scores']);
            $averageScore = $responseCount > 0 ? array_sum($row['scores']) / $responseCount : 0;
            $averageCompletion = $responseCount > 0 ? array_sum($row['completion_scores']) / $responseCount : 0;

            return [
                'code' => $row['code'],
                'intitule' => $row['intitule'],
                'filiere' => $row['filiere'],
                'response_count' => $responseCount,
                'average_score' => $averageScore,
                'average_completion' => $averageCompletion,
            ];
        }, $grouped));

        usort($moduleRows, static function (array $left, array $right): int {
            if ($right['average_score'] !== $left['average_score']) {
                return $right['average_score'] <=> $left['average_score'];
            }

            return $right['response_count'] <=> $left['response_count'];
        });

        $analytics = $this->dashboard->getQuestionnaireAnalytics(currentAcademicYear());
        $averageScore = $moduleRows !== []
            ? array_sum(array_map(static fn(array $row): float => floatval($row['average_score']), $moduleRows)) / count($moduleRows)
            : 0;

        return $this->generate(
            'questionnaire_results',
            $format,
            $this->reportTitle('Resultats des questionnaires'),
            $generatedBy,
            [],
            [],
            [
                'Questionnaires affectes' => intval($analytics['assigned_questionnaires'] ?? 0),
                'Questionnaires completes' => intval($analytics['completed_questionnaires'] ?? 0),
                'Taux de reponse' => $this->formatPercent(
                    (intval($analytics['assigned_questionnaires'] ?? 0) > 0)
                        ? (intval($analytics['completed_questionnaires'] ?? 0) / intval($analytics['assigned_questionnaires'])) * 100
                        : 0
                ),
                'Score moyen par module' => $this->formatPercent($averageScore),
            ],
            [
                'subtitle' => 'Moyennes questionnaire par module et filiere',
                'sections' => [
                    $this->buildSection(
                        'Scores moyens des questionnaires',
                        ['Code', 'Module', 'Filiere', 'Reponses', 'Score moyen', 'Progression moyenne'],
                        array_map(fn(array $row): array => [
                            $this->textCell($row['code']),
                            $this->textCell($row['intitule']),
                            $this->textCell($row['filiere']),
                            $this->numberCell(intval($row['response_count']), 'integer'),
                            $this->numberCell(floatval($row['average_score']), 'percent'),
                            $this->numberCell(floatval($row['average_completion']), 'percent'),
                        ], $moduleRows),
                        $this->buildAggregateFooter(
                            'Totaux / moyennes',
                            6,
                            count($moduleRows),
                            [
                                3 => ['operation' => 'SUM', 'value' => array_sum(array_map(static fn(array $row): int => intval($row['response_count']), $moduleRows)), 'format' => 'integer'],
                                4 => ['operation' => 'AVERAGE', 'value' => $averageScore, 'format' => 'percent'],
                                5 => ['operation' => 'AVERAGE', 'value' => $moduleRows !== [] ? array_sum(array_map(static fn(array $row): float => floatval($row['average_completion']), $moduleRows)) / count($moduleRows) : 0, 'format' => 'percent'],
                            ]
                        )
                    ),
                ],
            ]
        );
    }

    public function generateGlobalPlatformSummary(string $format, int $generatedBy): array
    {
        $overview = $this->dashboard->getOverview();
        $trainerRows = $this->dashboard->getTrainerRows();
        $hoursByFiliere = $this->dashboard->getHoursByFiliere();
        $validation = $this->dashboard->getValidationStatusBreakdown();
        $questionnaires = $this->dashboard->getQuestionnaireAnalytics(currentAcademicYear());
        $ranking = $this->buildTrainerRanking($trainerRows);

        $summary = [
            'Formateurs' => intval($overview['total_formateurs'] ?? 0),
            'Modules' => intval($overview['total_modules'] ?? 0),
            'Affectations' => intval($overview['total_affectations'] ?? 0),
            'Heures catalogue' => $this->formatHours(floatval($overview['total_module_hours'] ?? 0)),
            'Validations approuvees' => intval($validation['validated'] ?? 0),
            'Validations en attente' => intval($validation['pending'] ?? 0),
            'Questionnaires completes' => intval($questionnaires['completed_questionnaires'] ?? 0),
        ];

        return $this->generate(
            'global_platform_summary',
            $format,
            $this->reportTitle('Synthese globale plateforme'),
            $generatedBy,
            [],
            [],
            $summary,
            [
                'subtitle' => 'Indicateurs globaux de pilotage pedagogique',
                'sections' => [
                    $this->buildSection(
                        'Synthese plateforme',
                        ['Indicateur', 'Valeur'],
                        array_map(fn(string $label, $value): array => [
                            $this->textCell($label),
                            $this->textCell((string) $value),
                        ], array_keys($summary), array_values($summary))
                    ),
                    $this->buildSection(
                        'Top formateurs',
                        ['Rang', 'Formateur', 'Specialite', 'Heures realisees', 'Questionnaire', 'Score global'],
                        array_map(fn(array $row): array => [
                            $this->numberCell(intval($row['rank']), 'integer'),
                            $this->textCell($row['nom']),
                            $this->textCell($row['specialite']),
                            $this->numberCell(floatval($row['completed_hours']), 'hours'),
                            $this->nullablePercentCell($row['questionnaire_percentage']),
                            $this->numberCell(floatval($row['score']), 'decimal'),
                        ], array_slice($ranking, 0, 5))
                    ),
                    $this->buildSection(
                        'Heures par filiere',
                        ['Filiere', 'Modules', 'Volume', 'Planifie', 'Realise', 'Completion'],
                        array_map(fn(array $row): array => [
                            $this->textCell($row['filiere']),
                            $this->numberCell(intval($row['module_count']), 'integer'),
                            $this->numberCell(floatval($row['total_module_hours']), 'hours'),
                            $this->numberCell(floatval($row['planned_hours']), 'hours'),
                            $this->numberCell(floatval($row['completed_hours']), 'hours'),
                            $this->numberCell(floatval($row['completion_percent']), 'percent'),
                        ], $hoursByFiliere)
                    ),
                ],
            ]
        );
    }

    public function generateHoursByDepartment(string $format, int $generatedBy): array
    {
        $rows = $this->dashboard->getHoursByFiliere();
        $totalVolume = array_sum(array_map(static fn(array $row): float => floatval($row['total_module_hours'] ?? 0), $rows));
        $totalPlanned = array_sum(array_map(static fn(array $row): float => floatval($row['planned_hours'] ?? 0), $rows));
        $totalCompleted = array_sum(array_map(static fn(array $row): float => floatval($row['completed_hours'] ?? 0), $rows));

        return $this->generate(
            'hours_by_department',
            $format,
            $this->reportTitle('Heures par filiere'),
            $generatedBy,
            [],
            [],
            [
                'Filieres' => count($rows),
                'Volume total' => $this->formatHours($totalVolume),
                'Heures planifiees' => $this->formatHours($totalPlanned),
                'Heures realisees' => $this->formatHours($totalCompleted),
            ],
            [
                'subtitle' => 'Volume horaire par departement pedagogique',
                'sections' => [
                    $this->buildSection(
                        'Heures par filiere',
                        ['Filiere', 'Modules', 'Volume total', 'Heures planifiees', 'Heures realisees', 'Completion'],
                        array_map(fn(array $row): array => [
                            $this->textCell($row['filiere']),
                            $this->numberCell(intval($row['module_count']), 'integer'),
                            $this->numberCell(floatval($row['total_module_hours']), 'hours'),
                            $this->numberCell(floatval($row['planned_hours']), 'hours'),
                            $this->numberCell(floatval($row['completed_hours']), 'hours'),
                            $this->numberCell(floatval($row['completion_percent']), 'percent'),
                        ], $rows),
                        $this->buildAggregateFooter(
                            'Totaux / moyennes',
                            6,
                            count($rows),
                            [
                                1 => ['operation' => 'SUM', 'value' => array_sum(array_map(static fn(array $row): int => intval($row['module_count']), $rows)), 'format' => 'integer'],
                                2 => ['operation' => 'SUM', 'value' => $totalVolume, 'format' => 'hours'],
                                3 => ['operation' => 'SUM', 'value' => $totalPlanned, 'format' => 'hours'],
                                4 => ['operation' => 'SUM', 'value' => $totalCompleted, 'format' => 'hours'],
                                5 => ['operation' => 'AVERAGE', 'value' => $rows !== [] ? array_sum(array_map(static fn(array $row): float => floatval($row['completion_percent'] ?? 0), $rows)) / count($rows) : 0, 'format' => 'percent'],
                            ]
                        )
                    ),
                ],
            ]
        );
    }

    public function generateTopTrainers(string $format, int $generatedBy): array
    {
        $ranking = $this->buildTrainerRanking($this->dashboard->getTrainerRows());
        $topRows = array_slice($ranking, 0, 10);

        return $this->generate(
            'top_trainers',
            $format,
            $this->reportTitle('Top formateurs'),
            $generatedBy,
            [],
            [],
            [
                'Formateurs analyses' => count($ranking),
                'Top exporte' => count($topRows),
                'Score moyen top 10' => $this->formatDecimal(
                    $topRows !== []
                        ? array_sum(array_map(static fn(array $row): float => floatval($row['score']), $topRows)) / count($topRows)
                        : 0
                ),
            ],
            [
                'subtitle' => 'Classement des formateurs selon execution et evaluation',
                'sections' => [
                    $this->buildSection(
                        'Classement des formateurs',
                        ['Rang', 'Formateur', 'Specialite', 'Heures planifiees', 'Heures realisees', 'Questionnaire', 'Score global'],
                        array_map(fn(array $row): array => [
                            $this->numberCell(intval($row['rank']), 'integer'),
                            $this->textCell($row['nom']),
                            $this->textCell($row['specialite']),
                            $this->numberCell(floatval($row['planned_hours']), 'hours'),
                            $this->numberCell(floatval($row['completed_hours']), 'hours'),
                            $this->nullablePercentCell($row['questionnaire_percentage']),
                            $this->numberCell(floatval($row['score']), 'decimal'),
                        ], $topRows),
                        $this->buildAggregateFooter(
                            'Moyennes',
                            7,
                            count($topRows),
                            [
                                3 => ['operation' => 'AVERAGE', 'value' => $topRows !== [] ? array_sum(array_map(static fn(array $row): float => floatval($row['planned_hours']), $topRows)) / count($topRows) : 0, 'format' => 'hours'],
                                4 => ['operation' => 'AVERAGE', 'value' => $topRows !== [] ? array_sum(array_map(static fn(array $row): float => floatval($row['completed_hours']), $topRows)) / count($topRows) : 0, 'format' => 'hours'],
                                5 => ['operation' => 'AVERAGE', 'value' => $topRows !== [] ? array_sum(array_map(static fn(array $row): float => floatval($row['questionnaire_percentage'] ?? 0), $topRows)) / max(count(array_filter($topRows, static fn(array $row): bool => $row['questionnaire_percentage'] !== null)), 1) : 0, 'format' => 'percent'],
                                6 => ['operation' => 'AVERAGE', 'value' => $topRows !== [] ? array_sum(array_map(static fn(array $row): float => floatval($row['score']), $topRows)) / count($topRows) : 0, 'format' => 'decimal'],
                            ]
                        )
                    ),
                ],
            ]
        );
    }

    public function generateModuleSuccessRates(string $format, int $generatedBy): array
    {
        $rows = $this->dashboard->getModuleCompletionRows(1000, 'DESC');
        $avgProgress = $rows !== []
            ? array_sum(array_map(static fn(array $row): float => floatval($row['progress_percent'] ?? 0), $rows)) / count($rows)
            : 0;

        return $this->generate(
            'module_success_rates',
            $format,
            $this->reportTitle('Taux de reussite des modules'),
            $generatedBy,
            [],
            [],
            [
                'Modules analyses' => count($rows),
                'Progression moyenne' => $this->formatPercent($avgProgress),
                'Heures realisees' => $this->formatHours(array_sum(array_map(static fn(array $row): float => floatval($row['completed_hours'] ?? 0), $rows))),
            ],
            [
                'subtitle' => 'Suivi de la reussite et de la completion des modules',
                'sections' => [
                    $this->buildSection(
                        'Succes des modules',
                        ['Code', 'Module', 'Filiere', 'Formateur', 'Heures realisees', 'Volume', 'Progression'],
                        array_map(fn(array $row): array => [
                            $this->textCell($row['code']),
                            $this->textCell($row['intitule']),
                            $this->textCell($row['filiere']),
                            $this->textCell($row['formateur_nom']),
                            $this->numberCell(floatval($row['completed_hours'] ?? 0), 'hours'),
                            $this->numberCell(floatval($row['volume_horaire'] ?? 0), 'hours'),
                            $this->numberCell(floatval($row['progress_percent'] ?? 0), 'percent'),
                        ], $rows),
                        $this->buildAggregateFooter(
                            'Totaux / moyennes',
                            7,
                            count($rows),
                            [
                                4 => ['operation' => 'SUM', 'value' => array_sum(array_map(static fn(array $row): float => floatval($row['completed_hours'] ?? 0), $rows)), 'format' => 'hours'],
                                5 => ['operation' => 'SUM', 'value' => array_sum(array_map(static fn(array $row): float => floatval($row['volume_horaire'] ?? 0), $rows)), 'format' => 'hours'],
                                6 => ['operation' => 'AVERAGE', 'value' => $avgProgress, 'format' => 'percent'],
                            ]
                        )
                    ),
                ],
            ]
        );
    }

    public function downloadable(int $reportId): array
    {
        $report = $this->reports->find($reportId);
        if (!$report) {
            throw new NotFoundException('Rapport introuvable.');
        }

        $absolutePath = dirname(__DIR__) . '/' . ltrim($report['file_path'], '/');
        $extension = strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION));
        $contentType = match ($extension) {
            'pdf' => 'application/pdf',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xls' => 'application/vnd.ms-excel',
            default => 'application/octet-stream',
        };

        return [
            'report' => $report,
            'absolute_path' => $absolutePath,
            'content_type' => $contentType,
            'download_name' => basename($absolutePath),
        ];
    }

    private function generate(
        string $type,
        string $format,
        string $title,
        int $generatedBy,
        array $headers,
        array $rows,
        array $summary = [],
        array $options = []
    ): array {
        $storageDir = dirname(__DIR__) . '/storage/reports';
        if (!is_dir($storageDir)) {
            mkdir($storageDir, 0775, true);
        }

        $sections = $options['sections'] ?? [
            $this->buildSection('Details', $headers, $rows),
        ];

        $filename = $this->buildFilename($type, $format);
        $absolutePath = $storageDir . '/' . $filename;

        if ($format === 'pdf') {
            $this->writePdfReport($absolutePath, $title, $sections, $summary, $options['subtitle'] ?? 'Edition automatique du rapport pedagogique');
        } else {
            $this->writeExcelReport($absolutePath, $title, $sections, $summary);
        }

        $relativePath = 'storage/reports/' . $filename;
        $reportId = $this->reports->create([
            'type' => $type,
            'format' => $format,
            'title' => $title,
            'file_path' => $relativePath,
            'generated_by' => $generatedBy,
        ]);

        $report = $this->reports->find($reportId);
        if (!$report) {
            throw new RuntimeException('Rapport genere mais introuvable en base.');
        }

        return $report;
    }

    private function reportTitle(string $label): string
    {
        return 'CMC Casablanca - ' . $label;
    }

    private function buildSection(string $title, array $headers, array $rows, ?array $footer = null): array
    {
        return [
            'title' => $title,
            'headers' => $headers,
            'rows' => $rows,
            'footer' => $footer,
        ];
    }

    private function buildAggregateFooter(string $label, int $columnCount, int $dataRowCount, array $aggregates): ?array
    {
        if ($columnCount <= 0) {
            return null;
        }

        $cells = [];
        for ($index = 0; $index < $columnCount; $index++) {
            $cells[$index] = $index === 0 ? $this->footerTextCell($label) : $this->footerTextCell('');
        }

        foreach ($aggregates as $columnIndex => $definition) {
            $operation = strtoupper((string) ($definition['operation'] ?? 'SUM'));
            $value = floatval($definition['value'] ?? 0);
            $format = (string) ($definition['format'] ?? 'decimal');
            $cellLabel = $definition['label'] ?? null;

            if ($cellLabel !== null && $columnIndex > 0) {
                $cells[0] = $this->footerTextCell((string) $cellLabel);
            }

            $formula = $dataRowCount > 0
                ? sprintf('=%s(R[-%d]C:R[-1]C)', in_array($operation, ['SUM', 'AVERAGE'], true) ? $operation : 'SUM', $dataRowCount)
                : null;

            $cells[$columnIndex] = $this->formulaCell($value, $format, $formula);
        }

        return $cells;
    }

    private function buildTrainerRanking(array $trainerRows): array
    {
        $ranking = array_map(function (array $row): array {
            $completedHours = round(floatval($row['completed_hours'] ?? 0), 2);
            $plannedHours = round(floatval($row['planned_hours'] ?? 0), 2);
            $annualHours = round(floatval($row['annual_hours'] ?? 0), 2);
            $questionnairePercentage = $row['questionnaire_percentage'] !== null
                ? round(floatval($row['questionnaire_percentage']), 2)
                : null;
            $loadReference = $plannedHours > 0 ? $plannedHours : $annualHours;
            $deliveryRate = $loadReference > 0 ? min(100, ($completedHours / $loadReference) * 100) : 0;
            $blendedScore = round(($deliveryRate * 0.45) + (($questionnairePercentage ?? 0) * 0.55), 1);

            return [
                'id' => intval($row['id'] ?? 0),
                'nom' => $row['nom'] ?? 'Formateur',
                'specialite' => $row['specialite'] ?? '',
                'planned_hours' => $plannedHours,
                'completed_hours' => $completedHours,
                'questionnaire_percentage' => $questionnairePercentage,
                'score' => $blendedScore,
            ];
        }, $trainerRows);

        usort($ranking, static function (array $left, array $right): int {
            if ($right['score'] !== $left['score']) {
                return $right['score'] <=> $left['score'];
            }

            if (($right['questionnaire_percentage'] ?? -1) !== ($left['questionnaire_percentage'] ?? -1)) {
                return ($right['questionnaire_percentage'] ?? -1) <=> ($left['questionnaire_percentage'] ?? -1);
            }

            return $right['completed_hours'] <=> $left['completed_hours'];
        });

        return array_map(static function (array $row, int $index): array {
            $row['rank'] = $index + 1;
            return $row;
        }, $ranking, array_keys($ranking));
    }

    private function textCell($value): array
    {
        $display = $this->normalizeCell($value);

        return [
            'type' => 'String',
            'value' => $display,
            'display' => $display,
            'style' => 'data_text',
        ];
    }

    private function footerTextCell(string $value): array
    {
        return [
            'type' => 'String',
            'value' => $this->normalizeCell($value),
            'display' => $this->normalizeCell($value),
            'style' => 'footer_text',
        ];
    }

    private function nullablePercentCell($value, string $emptyLabel = 'En attente'): array
    {
        if ($value === null) {
            return $this->textCell($emptyLabel);
        }

        return $this->numberCell(floatval($value), 'percent');
    }

    private function numberCell(float $value, string $format = 'decimal', ?string $displayOverride = null): array
    {
        return [
            'type' => 'Number',
            'value' => $this->normalizeNumericValue($value, $format),
            'display' => $displayOverride ?? $this->formatCellDisplay($value, $format),
            'style' => $this->excelNumericStyle($format, false),
            'format' => $format,
        ];
    }

    private function formulaCell(float $value, string $format, ?string $formula = null): array
    {
        return [
            'type' => 'Number',
            'value' => $this->normalizeNumericValue($value, $format),
            'display' => $this->formatCellDisplay($value, $format),
            'style' => $this->excelNumericStyle($format, true),
            'format' => $format,
            'formula' => $formula,
        ];
    }

    private function normalizeNumericValue(float $value, string $format): float|int
    {
        return match ($format) {
            'integer' => intval(round($value)),
            'percent' => round($value, 1),
            'hours', 'decimal' => round($value, 2),
            default => round($value, 2),
        };
    }

    private function formatCellDisplay(float $value, string $format): string
    {
        return match ($format) {
            'integer' => (string) intval(round($value)),
            'hours' => $this->formatHours($value),
            'percent' => $this->formatPercent($value),
            default => $this->formatDecimal($value),
        };
    }

    private function formatHours(float $value): string
    {
        return $this->formatDecimal($value) . 'h';
    }

    private function formatPercent(float $value): string
    {
        return rtrim(rtrim(number_format($value, 1, '.', ''), '0'), '.') . '%';
    }

    private function formatDecimal(float $value): string
    {
        return rtrim(rtrim(number_format($value, 2, '.', ''), '0'), '.');
    }

    private function excelNumericStyle(string $format, bool $isFooter): string
    {
        $prefix = $isFooter ? 'footer_' : 'data_';

        return match ($format) {
            'integer' => $prefix . 'integer',
            'hours' => $prefix . 'hours',
            'percent' => $prefix . 'percent',
            default => $prefix . 'decimal',
        };
    }

    private function writePdfReport(string $absolutePath, string $title, array $sections, array $summary, string $subtitle): void
    {
        $this->ensurePdfDependenciesAreAvailable();

        try {
            $data = $this->buildPdfData($title, $sections, $summary, $subtitle);
            $html = $this->buildPdfHtml($data);
            $options = $this->buildPdfOptions();
            $dompdf = new \Dompdf\Dompdf($options);
            $dompdf->loadHtml($html, 'UTF-8');
            $dompdf->setPaper('A4', 'landscape');
            $dompdf->render();
            $contents = $dompdf->output();
            unset($dompdf, $options, $html, $data);
            gc_collect_cycles();
        } catch (Throwable $exception) {
            throw new HttpException(500, 'La generation du PDF a echoue.');
        }

        if (@file_put_contents($absolutePath, $contents) === false) {
            throw new RuntimeException('Impossible d ecrire le fichier PDF du rapport.');
        }
    }

    private function writeExcelReport(string $absolutePath, string $title, array $sections, array $summary): void
    {
        $data = $this->buildExcelData($title, $sections, $summary);
        $contents = $this->buildExcelSpreadsheetXml($data);
        if (@file_put_contents($absolutePath, $contents) === false) {
            throw new RuntimeException('Impossible d ecrire le fichier Excel du rapport.');
        }
    }

    private function ensurePdfDependenciesAreAvailable(): void
    {
        $autoloadPath = __DIR__ . '/../vendor/autoload.php';

        if (!is_file($autoloadPath)) {
            throw new HttpException(
                503,
                'Generation PDF indisponible en local. Installez les dependances Composer dans backend avant de demander un export PDF.'
            );
        }

        require_once $autoloadPath;

        if (!class_exists(\Dompdf\Dompdf::class)) {
            throw new HttpException(
                503,
                'Generation PDF indisponible car DomPDF n est pas disponible.'
            );
        }

        $this->ensurePdfMemoryLimit();
    }

    private function buildPdfOptions(): \Dompdf\Options
    {
        $cacheDir = __DIR__ . '/../storage/cache/dompdf';
        if (!is_dir($cacheDir)) {
            @mkdir($cacheDir, 0775, true);
        }

        return new \Dompdf\Options([
            'tempDir' => $cacheDir,
            'fontDir' => $cacheDir,
            'fontCache' => $cacheDir,
            'chroot' => dirname(__DIR__),
            'defaultFont' => 'DejaVu Sans',
            'isRemoteEnabled' => false,
            'isHtml5ParserEnabled' => true,
            'dpi' => self::PDF_DPI,
        ]);
    }

    private function ensurePdfMemoryLimit(): void
    {
        $currentLimit = $this->memoryLimitToBytes(ini_get('memory_limit'));
        $requiredLimit = $this->memoryLimitToBytes(self::PDF_MEMORY_LIMIT);

        if ($currentLimit === -1 || $currentLimit >= $requiredLimit) {
            return;
        }

        @ini_set('memory_limit', self::PDF_MEMORY_LIMIT);
    }

    private function memoryLimitToBytes(string|false $value): int
    {
        if ($value === false || $value === '') {
            return 0;
        }

        $normalized = trim($value);
        if ($normalized === '-1') {
            return -1;
        }

        $unit = strtolower(substr($normalized, -1));
        $number = (float) $normalized;

        return match ($unit) {
            'g' => (int) round($number * 1024 * 1024 * 1024),
            'm' => (int) round($number * 1024 * 1024),
            'k' => (int) round($number * 1024),
            default => (int) round($number),
        };
    }

    private function buildPdfData(string $title, array $sections, array $summary, string $subtitle): array
    {
        return [
            'title' => $this->normalizeText($title, '-'),
            'subtitle' => $this->normalizeText($subtitle, '-'),
            'generated_label' => 'Genere le ' . date('d/m/Y H:i'),
            'summary' => $this->normalizeSummary($summary),
            'sections' => array_map(function (array $section): array {
                return [
                    'title' => $this->normalizeText((string) ($section['title'] ?? 'Details'), 'Details'),
                    'headers' => array_map(fn(string $header): string => $this->normalizeText($header, '-'), $section['headers'] ?? []),
                    'rows' => array_map(function (array $row): array {
                        return array_map(fn($cell): string => $this->cellDisplay($cell), $row);
                    }, $section['rows'] ?? []),
                    'footer' => $section['footer'] ? array_map(fn($cell): string => $this->cellDisplay($cell), $section['footer']) : null,
                ];
            }, $sections),
        ];
    }

    private function buildPdfHtml(array $data): string
    {
        $sectionsHtml = '';
        foreach ($data['sections'] as $section) {
            $head = implode('', array_map(fn(string $header): string => '<th>' . $this->escape($header) . '</th>', $section['headers']));
            $body = implode('', array_map(function (array $row): string {
                $cells = implode('', array_map(fn(string $cell): string => '<td>' . $this->escape($cell) . '</td>', $row));
                return '<tr>' . $cells . '</tr>';
            }, $section['rows']));

            if ($section['footer']) {
                $footerCells = implode('', array_map(fn(string $cell): string => '<td class="report-footer-cell">' . $this->escape($cell) . '</td>', $section['footer']));
                $body .= '<tr class="report-footer-row">' . $footerCells . '</tr>';
            }

            $sectionsHtml .= '<div class="report-section">' .
                '<h2 class="report-section-title">' . $this->escape($section['title']) . '</h2>' .
                '<table class="report-table"><thead><tr>' . $head . '</tr></thead><tbody>' . $body . '</tbody></table>' .
            '</div>';
        }

        return '<html><head><meta charset="UTF-8"><style>' .
            $this->buildSharedDocumentStyles() .
            '</style></head><body>' .
            $this->buildDocumentHeader($data['title'], $data['subtitle']) .
            '<div class="report-meta">' . $this->escape($data['generated_label']) . '</div>' .
            $this->buildSummaryHtml($data['summary']) .
            $sectionsHtml .
            '</body></html>';
    }

    private function buildExcelData(string $title, array $sections, array $summary): array
    {
        return [
            'title' => $this->normalizeText($title, '-'),
            'generated_label' => 'Genere le ' . date('d/m/Y H:i'),
            'summary_rows' => array_map(
                fn(string $label, $value): array => [
                    $this->footerTextCell($label),
                    $this->footerTextCell((string) $value),
                ],
                array_keys($this->normalizeSummary($summary)),
                array_values($this->normalizeSummary($summary))
            ),
            'sections' => $sections,
        ];
    }

    private function buildExcelSpreadsheetXml(array $data): string
    {
        $maxColumns = $this->determineMaxColumns($data);
        $mergeAcross = max(0, $maxColumns - 1);
        $columnWidths = $this->computeColumnWidths($data, $maxColumns);
        $xmlRows = [];
        $xmlRows[] = $this->buildMergedSpreadsheetRow($data['title'], 'title', $mergeAcross);
        $xmlRows[] = $this->buildMergedSpreadsheetRow($data['generated_label'], 'meta', $mergeAcross);
        $xmlRows[] = $this->buildSpreadsheetRow([], 'data_text');

        if ($data['summary_rows'] !== []) {
            $xmlRows[] = $this->buildMergedSpreadsheetRow('Synthese executive', 'section', $mergeAcross);
            $xmlRows[] = $this->buildSpreadsheetRow(['Indicateur', 'Valeur'], 'header');
            foreach ($data['summary_rows'] as $row) {
                $xmlRows[] = $this->buildSpreadsheetRow($row, 'footer_text');
            }
            $xmlRows[] = $this->buildSpreadsheetRow([], 'data_text');
        }

        foreach ($data['sections'] as $section) {
            $xmlRows[] = $this->buildMergedSpreadsheetRow((string) ($section['title'] ?? 'Details'), 'section', $mergeAcross);
            $xmlRows[] = $this->buildSpreadsheetRow($section['headers'] ?? [], 'header');

            foreach ($section['rows'] as $row) {
                $xmlRows[] = $this->buildSpreadsheetRow($row, 'data_text');
            }

            if (!empty($section['footer'])) {
                $xmlRows[] = $this->buildSpreadsheetRow($section['footer'], 'footer_text');
            }

            $xmlRows[] = $this->buildSpreadsheetRow([], 'data_text');
        }

        return '<?xml version="1.0" encoding="UTF-8"?>' .
            '<?mso-application progid="Excel.Sheet"?>' .
            '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
                xmlns:o="urn:schemas-microsoft-com:office:office"
                xmlns:x="urn:schemas-microsoft-com:office:excel"
                xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
                xmlns:html="http://www.w3.org/TR/REC-html40">' .
                '<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">' .
                    '<Title>' . $this->escapeXml($data['title']) . '</Title>' .
                    '<Created>' . date('c') . '</Created>' .
                '</DocumentProperties>' .
                '<Styles>' . $this->buildExcelStylesXml() . '</Styles>' .
                '<Worksheet ss:Name="Rapport">' .
                    '<Table x:FullColumns="1" x:FullRows="1">' .
                        $this->buildExcelColumnsXml($columnWidths) .
                        implode('', $xmlRows) .
                    '</Table>' .
                    '<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">' .
                        '<Selected/>' .
                        '<FreezePanes/>' .
                        '<FrozenNoSplit/>' .
                        '<SplitHorizontal>4</SplitHorizontal>' .
                        '<TopRowBottomPane>4</TopRowBottomPane>' .
                        '<ActivePane>2</ActivePane>' .
                    '</WorksheetOptions>' .
                '</Worksheet>' .
            '</Workbook>';
    }

    private function determineMaxColumns(array $data): int
    {
        $maxColumns = 2;
        foreach ($data['sections'] as $section) {
            $maxColumns = max($maxColumns, count($section['headers'] ?? []));
            foreach ($section['rows'] ?? [] as $row) {
                $maxColumns = max($maxColumns, count($row));
            }
            if (!empty($section['footer'])) {
                $maxColumns = max($maxColumns, count($section['footer']));
            }
        }

        return $maxColumns;
    }

    private function computeColumnWidths(array $data, int $maxColumns): array
    {
        $widths = array_fill(0, $maxColumns, 80.0);

        $registerRow = function (array $row) use (&$widths): void {
            foreach ($row as $index => $cell) {
                $display = is_array($cell) ? $this->cellDisplay($cell) : (string) $cell;
                $widths[$index] = max($widths[$index] ?? 80.0, min(240.0, 18.0 + (mb_strlen($display) * 6.2)));
            }
        };

        $registerRow([$data['title']]);
        $registerRow([$data['generated_label']]);
        foreach ($data['summary_rows'] as $row) {
            $registerRow($row);
        }

        foreach ($data['sections'] as $section) {
            $registerRow($section['headers'] ?? []);
            foreach ($section['rows'] ?? [] as $row) {
                $registerRow($row);
            }
            if (!empty($section['footer'])) {
                $registerRow($section['footer']);
            }
        }

        return $widths;
    }

    private function buildExcelColumnsXml(array $widths): string
    {
        return implode('', array_map(static fn(float $width): string => '<Column ss:AutoFitWidth="0" ss:Width="' . number_format($width, 2, '.', '') . '"/>', $widths));
    }

    private function buildExcelStylesXml(): string
    {
        return
            '<Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Borders/><Font ss:FontName="Calibri" ss:Size="11"/><Interior/><NumberFormat/><Protection/></Style>' .
            '<Style ss:ID="title"><Font ss:Bold="1" ss:Size="16"/><Alignment ss:Vertical="Center"/></Style>' .
            '<Style ss:ID="meta"><Font ss:Italic="1" ss:Size="10" ss:Color="#5B6B83"/></Style>' .
            '<Style ss:ID="section"><Font ss:Bold="1" ss:Size="12" ss:Color="#12385A"/><Interior ss:Color="#EEF4FB" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>' .
            '<Style ss:ID="header"><Font ss:Bold="1" ss:Color="#12385A"/><Alignment ss:Vertical="Center" ss:WrapText="1"/><Interior ss:Color="#DCEAF7" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>' .
            '<Style ss:ID="data_text"><Alignment ss:Vertical="Top" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>' .
            '<Style ss:ID="data_integer"><Alignment ss:Horizontal="Right" ss:Vertical="Top"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><NumberFormat ss:Format="0"/></Style>' .
            '<Style ss:ID="data_decimal"><Alignment ss:Horizontal="Right" ss:Vertical="Top"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><NumberFormat ss:Format="0.00"/></Style>' .
            '<Style ss:ID="data_hours"><Alignment ss:Horizontal="Right" ss:Vertical="Top"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><NumberFormat ss:Format="0.00&quot;h&quot;"/></Style>' .
            '<Style ss:ID="data_percent"><Alignment ss:Horizontal="Right" ss:Vertical="Top"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><NumberFormat ss:Format="0.0&quot;%&quot;"/></Style>' .
            '<Style ss:ID="footer_text"><Font ss:Bold="1"/><Alignment ss:Vertical="Center" ss:WrapText="1"/><Interior ss:Color="#F4F8FC" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>' .
            '<Style ss:ID="footer_integer"><Font ss:Bold="1"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Interior ss:Color="#F4F8FC" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><NumberFormat ss:Format="0"/></Style>' .
            '<Style ss:ID="footer_decimal"><Font ss:Bold="1"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Interior ss:Color="#F4F8FC" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><NumberFormat ss:Format="0.00"/></Style>' .
            '<Style ss:ID="footer_hours"><Font ss:Bold="1"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Interior ss:Color="#F4F8FC" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><NumberFormat ss:Format="0.00&quot;h&quot;"/></Style>' .
            '<Style ss:ID="footer_percent"><Font ss:Bold="1"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Interior ss:Color="#F4F8FC" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><NumberFormat ss:Format="0.0&quot;%&quot;"/></Style>';
    }

    private function buildMergedSpreadsheetRow(string $value, string $styleId, int $mergeAcross): string
    {
        return '<Row><Cell ss:StyleID="' . $styleId . '" ss:MergeAcross="' . $mergeAcross . '"><Data ss:Type="String">' . $this->escapeXml($value) . '</Data></Cell></Row>';
    }

    private function buildSpreadsheetRow(array $cells, string $defaultStyle): string
    {
        if ($cells === []) {
            return '<Row><Cell ss:StyleID="' . $defaultStyle . '"><Data ss:Type="String"></Data></Cell></Row>';
        }

        $xmlCells = '';
        foreach ($cells as $cell) {
            $cellDefinition = is_array($cell) ? $cell : [
                'type' => 'String',
                'value' => $this->normalizeCell($cell),
                'style' => $defaultStyle,
            ];

            $styleId = $cellDefinition['style'] ?? $defaultStyle;
            $type = $cellDefinition['type'] ?? 'String';
            $value = $cellDefinition['value'] ?? '';
            $formula = $cellDefinition['formula'] ?? null;
            $attribute = $formula ? ' ss:Formula="' . $this->escapeXml($formula) . '"' : '';

            $xmlCells .= '<Cell ss:StyleID="' . $styleId . '"' . $attribute . '><Data ss:Type="' . $type . '">' . $this->escapeXml((string) $value) . '</Data></Cell>';
        }

        return '<Row>' . $xmlCells . '</Row>';
    }

    private function buildSharedDocumentStyles(): string
    {
        return '
            body{font-family:DejaVu Sans, Arial, sans-serif;font-size:12px;color:#122033;margin:18px;background:#fff;}
            .report-header{border:3px solid #000;background:#fff;margin-bottom:18px;}
            .report-header-top{width:100%;border-collapse:collapse;table-layout:fixed;}
            .report-header-top td{height:86px;vertical-align:middle;text-align:center;}
            .report-header-logo-left{width:22%;border-right:3px solid #000;}
            .report-header-logo-right{width:22%;border-left:3px solid #000;}
            .report-header-logo-left img{width:62px;height:62px;object-fit:contain;}
            .report-header-logo-right img{width:66px;height:66px;object-fit:contain;}
            .report-header-org-ar{margin:0 0 2px 0;text-align:center;}
            .report-header-org-ar img{width:360px;height:auto;display:inline-block;}
            .report-header-org-fr{font-size:13px;font-weight:600;margin:2px 0 0 0;}
            .report-header-title{padding:10px 16px 6px;text-align:center;}
            .report-header-title h1{font-size:22px;font-weight:700;color:#3f7cc4;margin:0;}
            .report-header-title p{font-size:14px;font-weight:700;color:#f27424;margin:4px 0 0 0;}
            .report-header-meta{padding:0 16px 14px;}
            .report-header-meta table{width:100%;border-collapse:collapse;table-layout:fixed;}
            .report-header-meta td{vertical-align:middle;}
            .report-campus{font-size:12px;font-weight:700;text-transform:uppercase;line-height:1.5;}
            .report-campus p{margin:0;}
            .report-campus .report-campus-line{margin-top:2px;}
            .report-header-info{border:2px solid #000;padding:6px 10px;text-align:center;font-size:12px;font-weight:700;}
            .report-header-info-fill{background:#c7d9ec;}
            .report-meta{margin:14px 0 16px;font-size:11px;color:#5b6b83;}
            .report-summary{width:100%;border-collapse:separate;border-spacing:0 8px;margin:0 0 18px 0;}
            .report-summary td{border:1px solid #d7dfeb;padding:8px 10px;background:#fff;}
            .report-summary .report-summary-label{background:#f4f8fc;font-weight:700;color:#12385a;width:28%;}
            .report-section{margin:0 0 18px 0;}
            .report-section-title{margin:0 0 10px 0;padding:8px 12px;background:#eef4fb;color:#12385a;font-size:14px;font-weight:700;border:1px solid #d7dfeb;}
            .report-table{width:100%;border-collapse:collapse;table-layout:auto;}
            .report-table th,.report-table td{border:1px solid #d7dfeb;padding:8px 9px;text-align:left;vertical-align:top;}
            .report-table th{background:#edf4fb;color:#12385a;font-size:11px;font-weight:700;}
            .report-table tbody tr:nth-child(even){background:#f9fbfd;}
            .report-footer-row td{background:#f4f8fc;font-weight:700;}
            .report-footer-cell{text-align:right;}
            .report-footer-row td:first-child{text-align:left;}
        ';
    }

    private function buildDocumentHeader(string $title, string $subtitle): string
    {
        $assets = $this->getHeaderAssets();

        $arabicHeader = $assets['arabic_header'] !== ''
            ? '<p class="report-header-org-ar"><img src="' . $assets['arabic_header'] . '" alt="مكتب التكوين المهني و إنعاش الشغل"></p>'
            : '<p class="report-header-org-ar" lang="ar" dir="rtl">مكتب التكوين المهني و إنعاش الشغل</p>';

        return '<div class="report-header">
            <table class="report-header-top">
                <tr>
                    <td class="report-header-logo-left"><img src="' . $assets['region_logo'] . '" alt="Casablanca Settat"></td>
                    <td>
                        ' . $arabicHeader . '
                        <p class="report-header-org-fr">Office de la formation professionnelle et</p>
                        <p class="report-header-org-fr">de la promotion du travail</p>
                    </td>
                    <td class="report-header-logo-right"><img src="' . $assets['ofppt_logo'] . '" alt="OFPPT"></td>
                </tr>
            </table>
            <div class="report-header-title">
                <h1>' . $this->escape($title) . '</h1>
                <p>' . $this->escape($subtitle) . '</p>
            </div>
            <div class="report-header-meta">
                <table>
                    <tr>
                        <td style="width:28%;" class="report-campus">
                            <p>DRRSK / CMC CASABLANCA</p>
                            <p class="report-campus-line">POLE : DIRECTION PEDAGOGIQUE</p>
                        </td>
                        <td style="width:44%;">
                            <table style="width:100%;border-collapse:collapse;">
                                <tr>
                                    <td class="report-header-info" style="width:40%;">Rapport institutionnel</td>
                                    <td class="report-header-info" style="width:36%;">Centre de Management de Casablanca</td>
                                    <td style="width:24%;text-align:center;font-size:12px;font-weight:700;">Edition 2025/2026</td>
                                </tr>
                            </table>
                        </td>
                        <td style="width:28%;text-align:right;">
                            <table style="display:inline-table;width:220px;border-collapse:collapse;">
                                <tr>
                                    <td class="report-header-info report-header-info-fill">Annee de formation</td>
                                </tr>
                                <tr>
                                    <td class="report-header-info">2025/2026</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
        </div>';
    }

    private function getHeaderAssets(): array
    {
        if ($this->headerAssets !== null) {
            return $this->headerAssets;
        }

        $basePath = dirname(__DIR__, 2) . '/frontend/src/style/photos/';

        $this->headerAssets = [
            'region_logo' => $this->imageToDataUri($basePath . 'Casablanca-Settat_VF.png'),
            'ofppt_logo' => $this->imageToDataUri($basePath . 'logo1 (1).png'),
            'arabic_header' => $this->imageToDataUri(dirname(__DIR__) . '/assets/report-header-ar.png'),
        ];

        return $this->headerAssets;
    }

    private function imageToDataUri(string $path): string
    {
        if (!is_file($path)) {
            return '';
        }

        $contents = file_get_contents($path);
        if ($contents === false) {
            return '';
        }

        $mimeType = function_exists('mime_content_type') ? mime_content_type($path) : 'image/png';
        if (!$mimeType) {
            $mimeType = 'image/png';
        }

        return 'data:' . $mimeType . ';base64,' . base64_encode($contents);
    }

    private function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private function escapeXml(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private function buildSummaryHtml(array $summary): string
    {
        if ($summary === []) {
            return '';
        }

        $rows = '';
        foreach ($summary as $label => $value) {
            $rows .= '<tr><td class="report-summary-label">' . $this->escape((string) $label) . '</td><td>' . $this->escape((string) $value) . '</td></tr>';
        }

        return '<table class="report-summary"><tbody>' . $rows . '</tbody></table>';
    }

    private function cellDisplay($cell): string
    {
        if (is_array($cell)) {
            return $this->normalizeCell($cell['display'] ?? $cell['value'] ?? '-');
        }

        return $this->normalizeCell($cell);
    }

    private function buildFilename(string $type, string $format): string
    {
        $date = date('Y-m-d');
        $base = $format === 'pdf' ? 'report_export_' . $date : 'planning_export_' . $date;
        $extension = $format === 'pdf' ? 'pdf' : self::EXCEL_EXTENSION;
        $storageDir = dirname(__DIR__) . '/storage/reports';
        $filename = $base . '.' . $extension;
        $counter = 2;

        while (is_file($storageDir . '/' . $filename)) {
            $filename = $base . '_' . $counter . '.' . $extension;
            $counter++;
        }

        return $filename;
    }

    private function normalizeSummary(array $summary): array
    {
        $normalized = [];
        foreach ($summary as $label => $value) {
            $normalized[$this->normalizeText((string) $label, '-')] = $this->normalizeCell($value);
        }

        return $normalized;
    }

    private function normalizeCell($value): string
    {
        if ($value === null || $value === '') {
            return '-';
        }

        if (is_float($value) || is_int($value)) {
            return (string) $value;
        }

        return $this->normalizeText((string) $value, '-');
    }

    private function normalizeText(string $value, string $default = '-'): string
    {
        $trimmed = trim($value);

        return $trimmed === '' ? $default : $trimmed;
    }
}
