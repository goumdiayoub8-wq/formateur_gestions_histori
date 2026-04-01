<?php

require_once __DIR__ . '/../services/FormateurService.php';
require_once __DIR__ . '/../services/DashboardService.php';
require_once __DIR__ . '/../core/InputValidator.php';
require_once __DIR__ . '/../core/helpers.php';

class FormateurController
{
    private FormateurService $formateurs;
    private DashboardService $dashboard;

    public function __construct(PDO $db)
    {
        $this->formateurs = new FormateurService($db);
        $this->dashboard = new DashboardService($db);
    }

    private function formateurPayload(array $payload): array
    {
        $nom = $payload['nom'] ?? $payload['utilisateur_nom'] ?? null;
        $email = $payload['email'] ?? $payload['utilisateur_email'] ?? $payload['email_professionnel'] ?? null;
        $specialite = $payload['specialite'] ?? $payload['specialite_nom'] ?? null;

        if ($specialite === null && !empty($payload['specialite_id'])) {
            $specialite = 'Specialite ' . intval($payload['specialite_id']);
        }

        $data = [
            'nom' => InputValidator::string(['nom' => $nom], 'nom', 'nom'),
            'email' => InputValidator::string(['email' => $email], 'email', 'email'),
            'specialite' => InputValidator::string(['specialite' => $specialite], 'specialite', 'specialite'),
            'max_heures' => InputValidator::integer(
                ['max_heures' => $payload['max_heures'] ?? $payload['heures_annuelles'] ?? null],
                'max_heures',
                'max_heures',
                false,
                1
            ) ?? 910,
            'weekly_hours' => InputValidator::decimal(
                ['weekly_hours' => $payload['weekly_hours'] ?? $payload['heures_hebdomadaires'] ?? null],
                'weekly_hours',
                'heures hebdomadaires',
                false,
                0.5,
                44
            ) ?? null,
        ];

        if (!empty($payload['mot_de_passe'])) {
            $data['mot_de_passe'] = InputValidator::string($payload, 'mot_de_passe', 'mot de passe', false);
        }

        return $data;
    }

    public function index(): void
    {
        $rows = $this->formateurs->all();

        jsonResponse([
            'status' => 'success',
            'data' => $rows,
            'formateurs' => $rows,
        ]);
    }

    public function show(int $id): void
    {
        $row = $this->formateurs->find($id);

        jsonResponse([
            'status' => 'success',
            'data' => $row,
            'formateur' => $row,
        ]);
    }

    public function store(): void
    {
        $created = $this->formateurs->create($this->formateurPayload(readJsonBody()));

        jsonResponse([
            'status' => 'success',
            'message' => 'Formateur cree.',
            'data' => $created,
            'formateur' => $created,
        ], 201);
    }

    public function update(int $id): void
    {
        $updated = $this->formateurs->update($id, $this->formateurPayload(readJsonBody()));

        jsonResponse([
            'status' => 'success',
            'message' => 'Formateur mis a jour.',
            'data' => $updated,
            'formateur' => $updated,
        ]);
    }

    public function destroy(int $id): void
    {
        $this->formateurs->delete($id);
        noContentResponse();
    }

    public function hours(int $id): void
    {
        $hours = $this->formateurs->hours($id);

        jsonResponse([
            'status' => 'success',
            'data' => $hours,
            'hours' => $hours,
        ]);
    }

    public function getProfil(): void
    {
        $userId = requireRole([3]);
        $formateur = $this->formateurs->findByUserId($userId);

        jsonResponse([
            'status' => 'success',
            'data' => $formateur,
            'formateur' => $formateur,
        ]);
    }

    public function getNotifications(): void
    {
        $userId = requireRole([3]);
        $formateur = $this->formateurs->findByUserId($userId);
        $week = InputValidator::integer(['week' => requestQuery('week') ?? requestQuery('semaine')], 'week', 'semaine', false, SYSTEM_WEEK_MIN, SYSTEM_WEEK_MAX) ?? currentAcademicWeek();
        $payload = $this->dashboard->trainerNotifications(intval($formateur['id']), $week, currentAcademicYear());

        jsonResponse([
            'status' => 'success',
            'data' => $payload,
            'notifications' => $payload['notifications'],
            'summary' => $payload['summary'],
        ]);
    }

    public function getDemandesOverview(): void
    {
        $userId = requireRole([3]);
        $formateur = $this->formateurs->findByUserId($userId);
        $week = InputValidator::integer(['week' => requestQuery('week') ?? requestQuery('semaine')], 'week', 'semaine', false, SYSTEM_WEEK_MIN, SYSTEM_WEEK_MAX) ?? currentAcademicWeek();
        $payload = $this->dashboard->trainerChangeRequests(intval($formateur['id']), $week, currentAcademicYear());

        jsonResponse([
            'status' => 'success',
            'data' => $payload,
            'overview' => $payload,
        ]);
    }

    public function getModulesQuestionnaires(): void
    {
        $userId = requireRole([3]);
        $formateur = $this->formateurs->findByUserId($userId);
        $rows = $this->formateurs->moduleQuestionnaires(intval($formateur['id']), currentAcademicYear());

        jsonResponse([
            'status' => 'success',
            'data' => $rows,
            'modules_questionnaires' => $rows,
        ]);
    }

    public function createDemande(): void
    {
        $userId = requireRole([3]);
        $formateur = $this->formateurs->findByUserId($userId);
        $payload = readJsonBody();

        $created = $this->dashboard->createTrainerChangeRequest(intval($formateur['id']), [
            'module_id' => InputValidator::integer($payload, 'module_id', 'module', true, 1),
            'groupe_code' => InputValidator::string($payload, 'groupe_code', 'groupe', false, 40),
            'semaine' => InputValidator::string($payload, 'semaine', 'semaine', false, 30),
            'request_week' => InputValidator::integer($payload, 'request_week', 'semaine numerique', false, SYSTEM_WEEK_MIN, SYSTEM_WEEK_MAX),
            'reason' => InputValidator::string($payload, 'reason', 'raison', true, 500),
        ], currentAcademicYear());

        jsonResponse([
            'status' => 'success',
            'message' => 'Demande de modification envoyee.',
            'data' => $created,
            'request' => $created,
        ], 201);
    }
}
