<?php

require_once __DIR__ . '/../repositories/DashboardRepository.php';
require_once __DIR__ . '/../repositories/FormateurRepository.php';
require_once __DIR__ . '/../services/PlanningService.php';

class DashboardService
{
    private DashboardRepository $dashboard;
    private FormateurRepository $formateurs;
    private PlanningService $planning;

    public function __construct(PDO $db)
    {
        $this->dashboard = new DashboardRepository($db);
        $this->formateurs = new FormateurRepository($db);
        $this->planning = new PlanningService($db);
    }

    public function stats(): array
    {
        $overview = $this->dashboard->getOverview();
        $trainerRows = $this->dashboard->getTrainerRows();
        $weeklyOverloads = $this->dashboard->getWeeklyOverloads();

        $alerts = [];
        $trainerStats = [];
        $globalS1 = 0.0;
        $globalS2 = 0.0;

        foreach ($trainerRows as $row) {
            $annualHours = round(floatval($row['annual_hours'] ?? 0), 2);
            $s1Hours = round(floatval($row['s1_hours'] ?? 0), 2);
            $s2Hours = round(floatval($row['s2_hours'] ?? 0), 2);
            $difference = round(abs($s1Hours - $s2Hours), 2);
            $questionnairePercentage = $row['questionnaire_percentage'] !== null
                ? round(floatval($row['questionnaire_percentage']), 2)
                : null;

            $globalS1 += $s1Hours;
            $globalS2 += $s2Hours;

            $rowAlerts = [];

            if ($annualHours > floatval($row['max_heures'])) {
                $rowAlerts[] = 'annual_limit_exceeded';
                $alerts[] = [
                    'type' => 'annual_limit_exceeded',
                    'formateur_id' => intval($row['id']),
                    'message' => $row['nom'] . ' depasse sa limite annuelle.',
                ];
            }

            if ($difference > max(30, ($s1Hours + $s2Hours) * 0.20)) {
                $rowAlerts[] = 'semester_imbalance';
                $alerts[] = [
                    'type' => 'semester_imbalance',
                    'formateur_id' => intval($row['id']),
                    'message' => $row['nom'] . ' a une repartition S1/S2 desequilibree.',
                ];
            }

            $trainerStats[] = [
                'id' => intval($row['id']),
                'nom' => $row['nom'],
                'email' => $row['email'],
                'specialite' => $row['specialite'],
                'annual_hours' => $annualHours,
                'max_heures' => intval($row['max_heures']),
                's1_hours' => $s1Hours,
                's2_hours' => $s2Hours,
                'semester_gap' => $difference,
                'questionnaire_percentage' => $questionnairePercentage,
                'alerts' => $rowAlerts,
            ];
        }

        foreach ($weeklyOverloads as $row) {
            $alerts[] = [
                'type' => 'weekly_overload',
                'formateur_id' => intval($row['formateur_id']),
                'message' => $row['nom'] . ' depasse 26h en semaine ' . intval($row['semaine']) . '.',
            ];
        }

        return [
            'overview' => [
                'total_formateurs' => intval($overview['total_formateurs'] ?? 0),
                'total_modules' => intval($overview['total_modules'] ?? 0),
                'total_affectations' => intval($overview['total_affectations'] ?? 0),
                'total_planning_rows' => intval($overview['total_planning_rows'] ?? 0),
                'total_module_hours' => round(floatval($overview['total_module_hours'] ?? 0), 2),
            ],
            'semester_balance' => [
                'S1' => round($globalS1, 2),
                'S2' => round($globalS2, 2),
                'imbalance' => round(abs($globalS1 - $globalS2), 2),
            ],
            'formateurs' => $trainerStats,
            'alerts' => $alerts,
        ];
    }

    public function directorOverview(): array
    {
        $kpis = $this->dashboard->getDirectorKpis();
        $validationStatus = $this->dashboard->getValidationStatusBreakdown();
        $filiereProgress = $this->dashboard->getFiliereProgress();
        $recentActivities = $this->dashboard->getRecentActivities();
        $stats = $this->stats();

        $totalSubmissions = max(1, intval($kpis['total_submissions'] ?? 0));
        $approvedCount = intval($validationStatus['validated'] ?? 0);
        $validationRate = round(($approvedCount / $totalSubmissions) * 100);

        return [
            'hero' => [
                'title' => 'Tableau de Bord - Directeur Pedagogique',
                'subtitle' => 'Suivi et validation des activites pedagogiques',
            ],
            'kpis' => [
                'pending_validations' => intval($kpis['pending_validations'] ?? 0),
                'validation_rate' => $validationRate,
                'validation_rate_delta' => intval($kpis['approved_this_week'] ?? 0),
                'modules_in_progress' => intval($kpis['modules_in_progress'] ?? 0),
                'active_groups' => intval($kpis['active_groups'] ?? 0),
            ],
            'validation_status' => [
                'validated' => $approvedCount,
                'pending' => intval($validationStatus['pending'] ?? 0),
                'revision' => intval($validationStatus['revision'] ?? 0),
            ],
            'filiere_progress' => $filiereProgress,
            'recent_activities' => $recentActivities,
            'alerts' => $stats['alerts'],
        ];
    }

    public function trainerOverview(int $formateurId, int $week, int $annee): array
    {
        $kpis = $this->dashboard->getTrainerKpis($formateurId, $week, $annee);
        if (!$kpis) {
            throw new NotFoundException('Formateur introuvable.');
        }

        $modules = $this->dashboard->getTrainerAssignedModules($formateurId, $annee, $week);
        $groups = $this->dashboard->getTrainerGroups($formateurId, $annee);
        $questionnaireScore = $this->dashboard->getTrainerQuestionnaireScore($formateurId);
        $requestsSummary = $this->dashboard->getTrainerChangeRequestSummary($formateurId, $annee);
        $visibility = $this->planning->trainerVisibility($formateurId, $week, $annee);
        $alerts = $visibility['alerts'];
        $annualCompleted = round(floatval($kpis['annual_completed_hours'] ?? 0), 2);
        $annualTarget = intval($kpis['max_heures'] ?? 910);
        $progressPercent = $annualTarget > 0 ? round(($annualCompleted / $annualTarget) * 100) : 0;
        $averageProgress = count($modules) > 0
            ? round(array_sum(array_map(static fn (array $module): int => intval($module['progress_percent'] ?? 0), $modules)) / count($modules))
            : 0;

        if ($annualCompleted > $annualTarget) {
            $alerts[] = [
                'type' => 'warning',
                'tone' => 'warning',
                'code' => 'annual_limit_exceeded',
                'message' => 'Limite annuelle depassee',
                'details' => 'Vous etes au-dessus de votre objectif annuel.',
            ];
        }

        if (intval($requestsSummary['pending_count'] ?? 0) > 0) {
            $alerts[] = [
                'type' => 'warning',
                'tone' => 'warning',
                'code' => 'pending_requests',
                'message' => 'Demandes en attente',
                'details' => 'Certaines demandes de modification sont encore en attente.',
            ];
        }

        return [
            'profile' => [
                'id' => intval($kpis['id']),
                'nom' => $kpis['nom'],
                'email' => $kpis['email'],
                'telephone' => $kpis['telephone'],
                'specialite' => $kpis['specialite'],
                'max_heures' => $annualTarget,
            ],
            'stats' => [
                'annual_completed_hours' => $annualCompleted,
                'annual_target_hours' => $annualTarget,
                'weekly_hours' => round(floatval($kpis['weekly_hours'] ?? 0), 2),
                'assigned_modules' => intval($kpis['assigned_modules'] ?? 0),
                'groups_count' => intval($kpis['groups_count'] ?? 0),
                'pending_requests' => intval($kpis['pending_requests'] ?? 0),
                'average_progress' => intval($averageProgress),
                'week' => $week,
                'academic_year' => $annee,
                'planning_entries' => intval($visibility['summary']['entries_count'] ?? 0),
                'planning_alerts' => intval($visibility['summary']['alerts_count'] ?? 0),
            ],
            'progress' => [
                'value' => $annualCompleted,
                'target' => $annualTarget,
                'percent' => max(0, intval($progressPercent)),
                'is_above_target' => $annualCompleted > $annualTarget,
            ],
            'modules' => $modules,
            'groups' => $groups,
            'planning' => [
                'week_range' => $visibility['week_range'],
                'periods' => $visibility['periods'],
                'daily_totals' => $visibility['daily_totals'],
                'schedule' => $visibility['schedule'],
            ],
            'evaluation' => [
                'submitted' => $questionnaireScore !== null,
                'total_score' => $questionnaireScore ? round(floatval($questionnaireScore['total_score'] ?? 0), 2) : 0,
                'max_score' => $questionnaireScore ? round(floatval($questionnaireScore['max_score'] ?? 0), 2) : 0,
                'percentage' => $questionnaireScore ? round(floatval($questionnaireScore['percentage'] ?? 0), 2) : null,
                'created_at' => $questionnaireScore['created_at'] ?? null,
            ],
            'alerts' => $alerts,
        ];
    }

    public function trainerNotifications(int $formateurId, int $week, int $annee): array
    {
        $overview = $this->trainerOverview($formateurId, $week, $annee);
        $events = $this->dashboard->getTrainerTimelineEvents($formateurId, $annee);
        $alertEvents = array_map(static function (array $alert, int $index): array {
            return [
                'id' => 'alert-' . $index,
                'type' => 'alert',
                'tone' => $alert['tone'] ?? 'warning',
                'title' => $alert['title'] ?? 'Alerte',
                'message' => $alert['message'] ?? '',
                'date' => date('Y-m-d H:i:s'),
                'target_path' => '/formateur',
            ];
        }, $overview['alerts'], array_keys($overview['alerts']));

        $notifications = array_merge($events, $alertEvents);
        usort($notifications, static function (array $left, array $right): int {
            return strcmp((string) ($right['date'] ?? ''), (string) ($left['date'] ?? ''));
        });

        $validationCount = 0;
        $alertCount = 0;
        foreach ($notifications as $notification) {
            if (($notification['type'] ?? '') === 'validation') {
                $validationCount++;
                continue;
            }

            if (($notification['type'] ?? '') === 'alert') {
                $alertCount++;
            }
        }

        return [
            'summary' => [
                'total' => count($notifications),
                'validations' => $validationCount,
                'alertes' => $alertCount,
                'unread' => min(2, count($notifications)),
            ],
            'notifications' => $notifications,
        ];
    }

    public function trainerChangeRequests(int $formateurId, int $week, int $annee): array
    {
        $overview = $this->trainerOverview($formateurId, $week, $annee);
        $history = $this->dashboard->getTrainerChangeRequests($formateurId, $annee);

        return [
            'profile' => $overview['profile'],
            'summary' => $this->dashboard->getTrainerChangeRequestSummary($formateurId, $annee),
            'modules' => $overview['modules'],
            'history' => $history,
        ];
    }

    public function createTrainerChangeRequest(int $formateurId, array $payload, int $annee): array
    {
        $created = $this->dashboard->createTrainerChangeRequest([
            'formateur_id' => $formateurId,
            'module_id' => intval($payload['module_id']),
            'groupe_code' => trim((string) ($payload['groupe_code'] ?? '')),
            'semaine' => trim((string) ($payload['semaine'] ?? '')),
            'request_week' => !empty($payload['request_week']) ? intval($payload['request_week']) : null,
            'academic_year' => $annee,
            'reason' => trim((string) ($payload['reason'] ?? '')),
        ]);

        if (!$created) {
            throw new RuntimeException('Impossible de creer la demande de modification.');
        }

        return $created;
    }

    public function chefNotifications(): array
    {
        $notifications = $this->dashboard->getChefNotifications();

        return [
            'count' => count($notifications),
            'notifications' => $notifications,
        ];
    }

    public function reviewTrainerChangeRequest(int $requestId, string $status, ?string $note = null): array
    {
        $normalizedStatus = $status === 'validated' ? 'approved' : ($status === 'confirmed' ? 'rejected' : $status);

        if (!in_array($normalizedStatus, ['approved', 'rejected'], true)) {
            throw new ValidationException('Le statut de revue est invalide.');
        }

        $reviewed = $this->dashboard->reviewTrainerChangeRequest($requestId, $normalizedStatus, $note);

        if (!$reviewed) {
            throw new NotFoundException('La demande de planning est introuvable.');
        }

        return $reviewed;
    }
}
