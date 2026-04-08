<?php

require_once __DIR__ . '/../repositories/FormateurModulePreferenceRepository.php';
require_once __DIR__ . '/../repositories/FormateurRepository.php';
require_once __DIR__ . '/../core/HttpException.php';

class FormateurModulePreferenceService
{
    private PDO $db;
    private FormateurRepository $formateurs;
    private FormateurModulePreferenceRepository $preferences;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->formateurs = new FormateurRepository($db);
        $this->preferences = new FormateurModulePreferenceRepository($db);
    }

    private function normalizeModuleIds($moduleIds): array
    {
        if (!is_array($moduleIds)) {
            throw new ValidationException('Le tableau des modules est obligatoire.');
        }

        $normalized = [];

        foreach ($moduleIds as $moduleId) {
            if (filter_var($moduleId, FILTER_VALIDATE_INT) === false || intval($moduleId) <= 0) {
                throw new ValidationException('Chaque module selectionne doit etre un entier valide.');
            }

            $normalized[] = intval($moduleId);
        }

        $normalized = array_values(array_unique($normalized));

        if (count($normalized) > 30) {
            throw new ValidationException('Vous ne pouvez pas selectionner plus de 30 modules.');
        }

        return $normalized;
    }

    private function assertFormateurExists(int $formateurId): array
    {
        $formateur = $this->formateurs->find($formateurId);

        if (!$formateur) {
            throw new NotFoundException('Formateur introuvable.');
        }

        return $formateur;
    }

    private function validateModulesExist(array $moduleIds): void
    {
        if ($moduleIds === []) {
            return;
        }

        if ($this->preferences->countModulesByIds($moduleIds) !== count($moduleIds)) {
            throw new NotFoundException('Un ou plusieurs modules selectionnes sont introuvables.');
        }
    }

    private function buildSummary(array $preferences): array
    {
        $summary = [
            'total' => count($preferences),
            'pending' => 0,
            'accepted' => 0,
            'rejected' => 0,
        ];

        foreach ($preferences as $preference) {
            $status = strval($preference['status'] ?? 'pending');
            if (array_key_exists($status, $summary)) {
                $summary[$status]++;
            }
        }

        return $summary;
    }

    private function formatCatalogRows(array $rows): array
    {
        return array_map(static function (array $row): array {
            $status = $row['status'] !== null ? strval($row['status']) : null;
            $selected = in_array($status, ['pending', 'accepted'], true);

            return [
                'preference_id' => $row['preference_id'] !== null ? intval($row['preference_id']) : null,
                'module_id' => intval($row['module_id']),
                'module_code' => $row['module_code'],
                'module_title' => $row['module_title'],
                'filiere' => $row['filiere'],
                'semestre' => $row['semestre'],
                'volume_horaire' => intval($row['volume_horaire'] ?? 0),
                'status' => $status,
                'message_chef' => $row['message_chef'] !== null ? strval($row['message_chef']) : null,
                'selected' => $selected,
                'locked' => $status === 'accepted',
                'created_at' => $row['preference_created_at'] ?? null,
                'updated_at' => $row['preference_updated_at'] ?? null,
            ];
        }, $rows);
    }

    private function formatPreferenceRows(array $rows): array
    {
        return array_map(static function (array $row): array {
            return [
                'id' => intval($row['id']),
                'formateur_id' => intval($row['formateur_id']),
                'module_id' => intval($row['module_id']),
                'module_code' => $row['module_code'],
                'module_title' => $row['module_title'],
                'filiere' => $row['filiere'],
                'semestre' => $row['semestre'],
                'volume_horaire' => intval($row['volume_horaire'] ?? 0),
                'status' => strval($row['status']),
                'message_chef' => $row['message_chef'] !== null ? strval($row['message_chef']) : null,
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
            ];
        }, $rows);
    }

    public function getFormateurPreferences(int $formateurId): array
    {
        $formateur = $this->assertFormateurExists($formateurId);
        $catalog = $this->formatCatalogRows($this->preferences->getCatalogWithPreferences($formateurId));
        $selectedPreferences = array_values(array_filter(
            $catalog,
            static fn(array $row): bool => $row['status'] !== null
        ));

        return [
            'formateur' => [
                'id' => intval($formateur['id']),
                'nom' => $formateur['nom'],
                'email' => $formateur['email'],
                'specialite' => $formateur['specialite'],
            ],
            'summary' => $this->buildSummary($selectedPreferences),
            'modules' => $catalog,
            'selected_module_ids' => array_values(array_map(
                static fn(array $row): int => intval($row['module_id']),
                array_filter($catalog, static fn(array $row): bool => $row['selected'] === true)
            )),
        ];
    }

    public function submitFormateurPreferences(int $formateurId, $moduleIds): array
    {
        $this->assertFormateurExists($formateurId);
        $normalizedModuleIds = $this->normalizeModuleIds($moduleIds);
        $this->validateModulesExist($normalizedModuleIds);

        $existingRows = $this->preferences->getPreferencesForFormateur($formateurId);
        $existingByModuleId = [];

        foreach ($existingRows as $row) {
            $existingByModuleId[intval($row['module_id'])] = $row;
        }

        $this->db->beginTransaction();

        try {
            $this->preferences->deletePendingPreferencesNotInSelection($formateurId, $normalizedModuleIds);

            foreach ($normalizedModuleIds as $moduleId) {
                $existing = $existingByModuleId[$moduleId] ?? null;

                if ($existing && strval($existing['status'] ?? '') === 'accepted') {
                    continue;
                }

                $this->preferences->upsertPreference($formateurId, $moduleId, 'pending', null);
            }

            $this->db->commit();
        } catch (Throwable $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $exception;
        }

        return $this->getFormateurPreferences($formateurId);
    }

    public function getTrainerPreferenceReview(int $formateurId): array
    {
        $formateur = $this->assertFormateurExists($formateurId);
        $preferences = $this->formatPreferenceRows($this->preferences->getPreferencesForFormateur($formateurId));

        return [
            'formateur' => [
                'id' => intval($formateur['id']),
                'nom' => $formateur['nom'],
                'email' => $formateur['email'],
                'specialite' => $formateur['specialite'],
            ],
            'summary' => $this->buildSummary($preferences),
            'preferences' => $preferences,
            'pending_preferences' => array_values(array_filter(
                $preferences,
                static fn(array $row): bool => $row['status'] === 'pending'
            )),
        ];
    }

    public function reviewTrainerPreferences(int $formateurId, $moduleIds, string $status, ?string $message): array
    {
        $formateur = $this->assertFormateurExists($formateurId);
        $normalizedModuleIds = $moduleIds === null ? [] : $this->normalizeModuleIds($moduleIds);

        if (!in_array($status, ['accepted', 'rejected'], true)) {
            throw new ValidationException('Le statut de decision est invalide.');
        }

        $existingPreferences = $this->formatPreferenceRows($this->preferences->getPreferencesForFormateur($formateurId));
        if ($existingPreferences === []) {
            throw new NotFoundException('Aucune preference enregistree pour ce formateur.');
        }

        if ($normalizedModuleIds === []) {
            $normalizedModuleIds = array_values(array_map(
                static fn(array $row): int => intval($row['module_id']),
                array_filter($existingPreferences, static fn(array $row): bool => $row['status'] === 'pending')
            ));
        }

        if ($normalizedModuleIds === []) {
            throw new ValidationException('Aucune preference en attente a traiter.');
        }

        $targetPreferences = $this->formatPreferenceRows(
            $this->preferences->getPreferencesByFormateurAndModules($formateurId, $normalizedModuleIds)
        );

        if ($targetPreferences === []) {
            throw new NotFoundException('Les preferences selectionnees sont introuvables.');
        }

        $targetModuleIds = array_values(array_map(
            static fn(array $row): int => intval($row['module_id']),
            $targetPreferences
        ));

        $this->db->beginTransaction();

        try {
            $this->preferences->updateStatuses($formateurId, $targetModuleIds, $status, $message);

            $updatedRows = $this->formatPreferenceRows(
                $this->preferences->getPreferencesByFormateurAndModules($formateurId, $targetModuleIds)
            );

            foreach ($updatedRows as $row) {
                $label = $status === 'accepted'
                    ? 'Preference module acceptee'
                    : 'Preference module rejetee';
                $tone = $status === 'accepted' ? 'success' : 'danger';
                $description = sprintf(
                    '%s pour %s - %s.%s',
                    $status === 'accepted' ? 'Votre preference a ete acceptee' : 'Votre preference a ete rejetee',
                    $row['module_code'],
                    $row['module_title'],
                    $message ? ' Message du chef: ' . $message : ''
                );

                $this->preferences->insertRecentActivity(
                    intval($formateur['id']),
                    intval($row['module_id']),
                    $label,
                    $tone,
                    mb_substr($description, 0, 255)
                );
            }

            $this->db->commit();
        } catch (Throwable $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $exception;
        }

        $payload = $this->getTrainerPreferenceReview($formateurId);
        $payload['decision'] = [
            'status' => $status,
            'message' => $message,
            'processed_count' => count($targetModuleIds),
        ];

        return $payload;
    }
}
