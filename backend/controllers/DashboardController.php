<?php

require_once __DIR__ . '/../services/DashboardService.php';
require_once __DIR__ . '/../services/FormateurService.php';
require_once __DIR__ . '/../core/InputValidator.php';
require_once __DIR__ . '/../core/helpers.php';

class DashboardController
{
    private DashboardService $dashboard;
    private FormateurService $formateurs;

    public function __construct(PDO $db)
    {
        $this->dashboard = new DashboardService($db);
        $this->formateurs = new FormateurService($db);
    }

    public function stats(): void
    {
        $stats = $this->dashboard->stats();

        jsonResponse([
            'status' => 'success',
            'data' => $stats,
            'stats' => $stats,
        ]);
    }

    public function directorOverview(): void
    {
        $overview = $this->dashboard->directorOverview();

        jsonResponse([
            'status' => 'success',
            'data' => $overview,
            'overview' => $overview,
        ]);
    }

    public function trainerOverview(): void
    {
        $userId = requireRole([3]);
        $formateur = $this->formateurs->findByUserId($userId);
        $week = InputValidator::integer(['week' => requestQuery('week') ?? requestQuery('semaine')], 'week', 'semaine', false, 1, ACADEMIC_MAX_WEEKS) ?? currentAcademicWeek();
        $overview = $this->dashboard->trainerOverview(intval($formateur['id']), $week, currentAcademicYear());

        jsonResponse([
            'status' => 'success',
            'data' => $overview,
            'overview' => $overview,
        ]);
    }
}
