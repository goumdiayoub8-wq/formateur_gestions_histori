<?php

require_once __DIR__ . '/../services/PlanningService.php';
require_once __DIR__ . '/../services/FormateurService.php';
require_once __DIR__ . '/../services/DashboardService.php';
require_once __DIR__ . '/../core/InputValidator.php';
require_once __DIR__ . '/../core/helpers.php';

class PlanningController
{
    private PlanningService $planning;
    private FormateurService $formateurs;
    private DashboardService $dashboard;

    public function __construct(PDO $db)
    {
        $this->planning = new PlanningService($db);
        $this->formateurs = new FormateurService($db);
        $this->dashboard = new DashboardService($db);
    }

    private function planningPayload(array $payload): array
    {
        return [
            'formateur_id' => InputValidator::integer($payload, 'formateur_id', 'formateur', true, 1),
            'module_id' => InputValidator::integer($payload, 'module_id', 'module', true, 1),
            'semaine' => InputValidator::integer(
                ['semaine' => $payload['semaine'] ?? $payload['week_number'] ?? null],
                'semaine',
                'semaine',
                true,
                SYSTEM_WEEK_MIN,
                SYSTEM_WEEK_MAX
            ),
            'heures' => InputValidator::decimal(
                ['heures' => $payload['heures'] ?? $payload['heures_prevues'] ?? null],
                'heures',
                'heures',
                true,
                0.5
            ),
        ];
    }

    private function sessionPayload(array $payload): array
    {
        $startTime = InputValidator::string($payload, 'start_time', 'heure de debut', true, 8);
        $endTime = InputValidator::string($payload, 'end_time', 'heure de fin', false, 8);
        $taskTitle = InputValidator::string($payload, 'task_title', 'tache', false, 120) ?? 'Cours';
        $taskDescription = InputValidator::string($payload, 'task_description', 'description', false, 255);

        return [
            'id' => InputValidator::integer($payload, 'id', 'id', false, 1),
            'formateur_id' => InputValidator::integer($payload, 'formateur_id', 'formateur', true, 1),
            'module_id' => InputValidator::integer($payload, 'module_id', 'module', true, 1),
            'groupe_id' => InputValidator::integer($payload, 'groupe_id', 'groupe', false, 1),
            'salle_id' => InputValidator::integer($payload, 'salle_id', 'salle', false, 1),
            'week_number' => InputValidator::integer(
                ['week_number' => $payload['week_number'] ?? $payload['week'] ?? $payload['semaine'] ?? null],
                'week_number',
                'semaine',
                true,
                SYSTEM_WEEK_MIN,
                SYSTEM_WEEK_MAX
            ),
            'day_of_week' => InputValidator::integer($payload, 'day_of_week', 'jour', true, 1, 7),
            'start_time' => $startTime,
            'end_time' => $endTime,
            'duration_minutes' => InputValidator::integer($payload, 'duration_minutes', 'duree', false, 1, 720),
            'task_title' => $taskTitle,
            'task_description' => $taskDescription,
        ];
    }

    public function index(): void
    {
        $rows = $this->planning->all([
            'formateur_id' => requestQuery('formateur_id'),
            'module_id' => requestQuery('module_id'),
            'semaine' => requestQuery('semaine') ?? requestQuery('week'),
        ]);

        jsonResponse([
            'status' => 'success',
            'data' => $rows,
            'planning' => $rows,
            'entries' => $rows,
        ]);
    }

    public function show(int $id): void
    {
        $row = $this->planning->find($id);

        jsonResponse([
            'status' => 'success',
            'data' => $row,
            'entry' => $row,
        ]);
    }

    public function store(): void
    {
        $created = $this->planning->create($this->planningPayload(readJsonBody()));

        jsonResponse([
            'status' => 'success',
            'message' => 'Planning cree.',
            'data' => $created,
            'entry' => $created,
        ], 201);
    }

    public function update(int $id): void
    {
        $updated = $this->planning->update($id, $this->planningPayload(readJsonBody()));

        jsonResponse([
            'status' => 'success',
            'message' => 'Planning mis a jour.',
            'data' => $updated,
            'entry' => $updated,
        ]);
    }

    public function destroy(int $id): void
    {
        $this->planning->delete($id);
        noContentResponse();
    }

    public function getWeeklyPlanning(): void
    {
        $this->index();
    }

    public function getSessions(): void
    {
        $week = InputValidator::integer(['week' => requestQuery('week') ?? requestQuery('semaine')], 'week', 'semaine', false, SYSTEM_WEEK_MIN, SYSTEM_WEEK_MAX) ?? currentAcademicWeek();
        $formateurId = InputValidator::integer(['formateur_id' => requestQuery('formateur_id')], 'formateur_id', 'formateur', false, 1);
        $rows = $this->planning->sessions($week, $formateurId);

        jsonResponse([
            'status' => 'success',
            'data' => $rows,
            'sessions' => $rows,
        ]);
    }

    public function getSessionOptions(): void
    {
        $formateurId = InputValidator::integer(['formateur_id' => requestQuery('formateur_id')], 'formateur_id', 'formateur', true, 1);
        $rows = $this->planning->sessionOptions($formateurId, currentAcademicYear());

        jsonResponse([
            'status' => 'success',
            'data' => $rows,
            'options' => $rows,
        ]);
    }

    public function saveSession(): void
    {
        $payload = $this->sessionPayload(readJsonBody());
        $session = $this->planning->saveSession($payload);

        jsonResponse([
            'status' => 'success',
            'message' => 'Creneau de planning enregistre.',
            'data' => $session,
            'session' => $session,
        ], !empty($payload['id']) ? 200 : 201);
    }

    public function destroySession(): void
    {
        $payload = readJsonBody();
        $id = InputValidator::integer($payload, 'id', 'id', true, 1);
        $this->planning->deleteSession($id);
        noContentResponse();
    }

    public function updateSessionStatus(): void
    {
        $payload = readJsonBody();
        $id = InputValidator::integer($payload, 'id', 'id', true, 1);
        $status = strtolower(trim((string) (InputValidator::string($payload, 'status', 'statut', false, 20) ?? 'completed')));
        if (!in_array($status, ['completed', 'done'], true)) {
            throw new ValidationException('Seuls les statuts completed et done sont autorises pour cette action.');
        }

        $userId = requireRole([1, 2, 3]);
        $roleId = currentUserRoleId();
        $actorFormateurId = null;

        if ($roleId === 3) {
            $formateur = $this->formateurs->findByUserId($userId);
            $actorFormateurId = intval($formateur['id'] ?? 0);
        }

        $session = $this->planning->completeSession($id, $actorFormateurId, $roleId);

        jsonResponse([
            'status' => 'success',
            'message' => 'Creneau marque comme realise.',
            'data' => $session,
            'session' => $session,
        ]);
    }

    public function getTrainerVisibility(): void
    {
        $requestedTrainerId = requestQuery('formateur_id') ?? requestQuery('id');
        $week = InputValidator::integer(['week' => requestQuery('week') ?? requestQuery('semaine')], 'week', 'semaine', false, SYSTEM_WEEK_MIN, SYSTEM_WEEK_MAX) ?? currentAcademicWeek();
        $annee = InputValidator::integer(['annee' => requestQuery('annee')], 'annee', 'annee', false, 2000) ?? currentAcademicYear();

        if ($requestedTrainerId !== null && $requestedTrainerId !== '') {
            $formateurId = InputValidator::integer(['formateur_id' => $requestedTrainerId], 'formateur_id', 'formateur', true, 1);
        } else {
            $formateur = $this->formateurs->findByUserId(requireRole([3]));
            $formateurId = intval($formateur['id']);
        }

        $payload = $this->planning->trainerVisibility($formateurId, $week, $annee);

        jsonResponse([
            'status' => 'success',
            'data' => $payload,
            'visibility' => $payload,
        ]);
    }

    public function getTeamVisibility(): void
    {
        requireRole([1, 2]);
        $week = InputValidator::integer(['week' => requestQuery('week') ?? requestQuery('semaine')], 'week', 'semaine', false, SYSTEM_WEEK_MIN, SYSTEM_WEEK_MAX) ?? currentAcademicWeek();
        $annee = InputValidator::integer(['annee' => requestQuery('annee')], 'annee', 'annee', false, 2000) ?? currentAcademicYear();
        $payload = $this->planning->teamVisibility($week, $annee);

        jsonResponse([
            'status' => 'success',
            'data' => $payload,
            'visibility' => $payload,
        ]);
    }

    public function getWeeklyStats(): void
    {
        $requestedTrainerId = requestQuery('formateur_id') ?? requestQuery('id');
        $week = InputValidator::integer(['semaine' => requestQuery('week') ?? requestQuery('semaine')], 'semaine', 'semaine', false, SYSTEM_WEEK_MIN, SYSTEM_WEEK_MAX) ?? currentAcademicWeek();

        if ($requestedTrainerId !== null && $requestedTrainerId !== '') {
            $formateurId = InputValidator::integer(['formateur_id' => $requestedTrainerId], 'formateur_id', 'formateur', true, 1);
        } elseif (currentUserRoleId() === 3 && currentUserId() !== null) {
            $formateur = $this->formateurs->findByUserId(currentUserId());
            $formateurId = intval($formateur['id']);
        } else {
            throw new ValidationException('Le formateur est obligatoire pour les statistiques.');
        }

        $overview = $this->dashboard->trainerOverview($formateurId, $week, currentAcademicYear());
        $stats = array_merge($overview['stats'], [
            'annual_completed' => $overview['stats']['annual_completed_hours'],
            'annual_target' => $overview['stats']['annual_target_hours'],
            'assigned_modules' => $overview['stats']['assigned_modules'],
            'pending_requests' => $overview['stats']['pending_requests'],
            'weekly_target' => $overview['stats']['weekly_target_hours'] ?? 0,
            'weekly_limit' => $overview['stats']['weekly_limit_hours'] ?? 44,
        ]);

        jsonResponse([
            'status' => 'success',
            'data' => $stats,
            'stats' => $stats,
        ]);
    }

    public function saveWeeklyEntry(): void
    {
        $payload = readJsonBody();
        if (!empty($payload['day_of_week']) || !empty($payload['start_time']) || !empty($payload['duration_minutes'])) {
            $this->saveSession();
            return;
        }

        if (!empty($payload['id'])) {
            $this->update(intval($payload['id']));
            return;
        }

        $this->store();
    }

    public function deleteWeeklyEntry(): void
    {
        $payload = readJsonBody();
        if (!empty($payload['session']) || !empty($payload['kind']) && $payload['kind'] === 'session') {
            $this->destroySession();
            return;
        }

        $id = InputValidator::integer($payload, 'id', 'id', true, 1);
        $this->destroy($id);
    }

    public function getMesModules(): void
    {
        $userId = requireRole([3]);
        $formateur = $this->formateurs->findByUserId($userId);
        $week = InputValidator::integer(['semaine' => requestQuery('week') ?? requestQuery('semaine')], 'semaine', 'semaine', false, SYSTEM_WEEK_MIN, SYSTEM_WEEK_MAX) ?? currentAcademicWeek();
        $overview = $this->dashboard->trainerOverview(intval($formateur['id']), $week, currentAcademicYear());
        $rows = $overview['modules'];

        jsonResponse([
            'status' => 'success',
            'data' => $rows,
            'modules' => $rows,
        ]);
    }

    public function createEntryDecisionRequest(): void
    {
        $userId = requireRole([3]);
        $formateur = $this->formateurs->findByUserId($userId);
        $payload = readJsonBody();

        $decision = InputValidator::oneOf($payload, 'decision', 'decision', ['accept', 'reject']);
        $moduleId = InputValidator::integer($payload, 'module_id', 'module', true, 1);
        $groupeCode = InputValidator::string($payload, 'groupe_code', 'groupe', true, 60);
        $weekNumber = InputValidator::integer($payload, 'request_week', 'semaine numerique', true, SYSTEM_WEEK_MIN, SYSTEM_WEEK_MAX);
        $dayLabel = InputValidator::string($payload, 'day_label', 'jour', false, 50) ?? '';
        $timeRange = InputValidator::string($payload, 'time_range', 'horaire', false, 60) ?? '';

        $reason = $decision === 'accept'
            ? sprintf('Confirmation du creneau %s %s pour le groupe %s.', trim($dayLabel), trim($timeRange), $groupeCode)
            : sprintf('Refus du creneau %s %s pour le groupe %s.', trim($dayLabel), trim($timeRange), $groupeCode);

        $created = $this->dashboard->createTrainerChangeRequest(intval($formateur['id']), [
            'module_id' => $moduleId,
            'groupe_code' => $groupeCode,
            'semaine' => sprintf('Semaine %s', $weekNumber),
            'request_week' => $weekNumber,
            'reason' => trim($reason),
        ], currentAcademicYear());

        jsonResponse([
            'status' => 'success',
            'message' => $decision === 'accept'
                ? 'Votre acceptation a ete envoyee au chef de pôle.'
                : 'Votre refus a ete envoye au chef de pôle.',
            'data' => $created,
            'request' => $created,
        ], 201);
    }

    public function reviewEntryDecisionRequest(): void
    {
        $payload = readJsonBody();
        $requestId = InputValidator::integer($payload, 'id', 'demande', true, 1);
        $status = InputValidator::oneOf($payload, 'status', 'statut', ['approved', 'rejected', 'validated']);
        $note = InputValidator::string($payload, 'note', 'note', false, 255);

        $updated = $this->dashboard->reviewTrainerChangeRequest($requestId, $status, $note);

        jsonResponse([
            'status' => 'success',
            'message' => 'La demande a ete traitee.',
            'data' => $updated,
        ]);
    }

    private function readValidationStatus(array $payload): string
    {
        return InputValidator::oneOf($payload, 'status', 'statut', ['approved', 'rejected', 'revision']);
    }

    public function validationDashboard(): void
    {
        $filters = [
            'q' => requestQuery('q'),
            'status' => requestQuery('status'),
        ];
        $data = $this->planning->validationDashboard($filters);

        jsonResponse([
            'status' => 'success',
            'data' => $data,
            'dashboard' => $data,
        ]);
    }

    public function validationSummary(): void
    {
        $summary = $this->planning->validationSummary();

        jsonResponse([
            'status' => 'success',
            'data' => $summary,
            'summary' => $summary,
        ]);
    }

    public function validationHistory(): void
    {
        $limit = InputValidator::integer(['limit' => requestQuery('limit')], 'limit', 'limit', false, 1, 20) ?? 5;
        $rows = $this->planning->validationHistory($limit);

        jsonResponse([
            'status' => 'success',
            'data' => $rows,
            'history' => $rows,
        ]);
    }

    public function validationQueue(): void
    {
        $filters = [
            'q' => requestQuery('q'),
            'status' => requestQuery('status'),
        ];
        $rows = $this->planning->validationQueue($filters);

        jsonResponse([
            'status' => 'success',
            'data' => $rows,
            'rows' => $rows,
            'queue' => $rows,
        ]);
    }

    public function submissionDetail(): void
    {
        $submissionId = InputValidator::integer(['id' => requestQuery('id')], 'id', 'soumission', true, 1);
        $detail = $this->planning->submissionDetail($submissionId);

        jsonResponse([
            'status' => 'success',
            'data' => $detail,
            'submission' => $detail,
        ]);
    }

    public function updateValidationStatus(): void
    {
        $payload = readJsonBody();
        $submissionId = InputValidator::integer($payload, 'planning_id', 'soumission', true, 1);
        $status = $this->readValidationStatus($payload);
        $note = InputValidator::string($payload, 'note', 'note', false, 255);

        $detail = $this->planning->updateValidationStatus(
            $submissionId,
            $status,
            $note,
            currentUserId() ?? requireAuthentication()
        );

        jsonResponse([
            'status' => 'success',
            'message' => 'Le statut de validation a ete mis a jour.',
            'data' => $detail,
            'submission' => $detail,
        ]);
    }

    public function bulkUpdateValidationStatus(): void
    {
        $payload = readJsonBody();
        $status = $this->readValidationStatus($payload);
        $note = InputValidator::string($payload, 'note', 'note', false, 255);
        $ids = $payload['ids'] ?? [];

        if (!is_array($ids) || $ids === []) {
            throw new ValidationException('La liste des soumissions visibles est obligatoire.');
        }

        $sanitizedIds = array_values(array_unique(array_map('intval', array_filter($ids, static fn ($id) => intval($id) > 0))));
        if ($sanitizedIds === []) {
            throw new ValidationException('La liste des soumissions visibles est invalide.');
        }

        $result = $this->planning->bulkUpdateValidationStatus(
            $sanitizedIds,
            $status,
            $note,
            currentUserId() ?? requireAuthentication()
        );

        jsonResponse([
            'status' => 'success',
            'message' => 'Les validations visibles ont ete mises a jour.',
            'data' => $result,
        ]);
    }
}
