<?php

class SearchRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function globalSearch(string $query, int $limit = 6): array
    {
        $like = '%' . $query . '%';

        $formateurs = $this->searchFormateurs($like, $limit);
        $modules = $this->searchModules($like, $limit);
        $groupes = $this->searchGroupes($like, $limit);

        return array_slice(array_merge($formateurs, $modules, $groupes), 0, $limit);
    }

    private function searchFormateurs(string $like, int $limit): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, nom, specialite, email
             FROM formateurs
             WHERE nom LIKE :q_nom OR email LIKE :q_email OR specialite LIKE :q_specialite
             ORDER BY nom
             LIMIT :limit'
        );
        $stmt->bindValue(':q_nom', $like);
        $stmt->bindValue(':q_email', $like);
        $stmt->bindValue(':q_specialite', $like);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return array_map(static function (array $row): array {
            return [
                'id' => 'formateur-' . intval($row['id']),
                'entity_type' => 'formateur',
                'entity_id' => intval($row['id']),
                'label' => $row['nom'],
                'title' => $row['nom'],
                'subtitle' => $row['specialite'],
                'description' => $row['email'],
            ];
        }, $stmt->fetchAll());
    }

    private function searchModules(string $like, int $limit): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, COALESCE(code, CONCAT("M", LPAD(id, 3, "0"))) AS code, intitule, filiere, semestre
             FROM modules
             WHERE intitule LIKE :q_intitule OR filiere LIKE :q_filiere OR COALESCE(code, "") LIKE :q_code
             ORDER BY intitule
             LIMIT :limit'
        );
        $stmt->bindValue(':q_intitule', $like);
        $stmt->bindValue(':q_filiere', $like);
        $stmt->bindValue(':q_code', $like);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return array_map(static function (array $row): array {
            return [
                'id' => 'module-' . intval($row['id']),
                'entity_type' => 'module',
                'entity_id' => intval($row['id']),
                'label' => $row['code'] . ' - ' . $row['intitule'],
                'title' => $row['intitule'],
                'subtitle' => $row['filiere'],
                'description' => $row['semestre'],
            ];
        }, $stmt->fetchAll());
    }

    private function searchGroupes(string $like, int $limit): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, code, nom, filiere
             FROM groupes
             WHERE code LIKE :q_code OR nom LIKE :q_nom OR filiere LIKE :q_filiere
             ORDER BY code
             LIMIT :limit'
        );
        $stmt->bindValue(':q_code', $like);
        $stmt->bindValue(':q_nom', $like);
        $stmt->bindValue(':q_filiere', $like);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return array_map(static function (array $row): array {
            return [
                'id' => 'groupe-' . intval($row['id']),
                'entity_type' => 'groupe',
                'entity_id' => intval($row['id']),
                'label' => $row['code'],
                'title' => $row['nom'],
                'subtitle' => $row['filiere'],
                'description' => 'Groupe actif',
            ];
        }, $stmt->fetchAll());
    }
}
