<?php

class UserRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM utilisateurs WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM utilisateurs WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function findByUsername(string $username): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM utilisateurs WHERE username = :username LIMIT 1');
        $stmt->execute(['username' => $username]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function findByResetToken(string $token): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM utilisateurs WHERE reset_token = :token LIMIT 1');
        $stmt->execute(['token' => $token]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO utilisateurs (formateur_id, nom, email, username, photo, mot_de_passe, role_id, statut)
             VALUES (:formateur_id, :nom, :email, :username, :photo, :mot_de_passe, :role_id, :statut)'
        );
        $stmt->execute([
            'formateur_id' => $data['formateur_id'] ?? null,
            'nom' => $data['nom'],
            'email' => $data['email'],
            'username' => $data['username'] ?? null,
            'photo' => $data['photo'] ?? null,
            'mot_de_passe' => $data['mot_de_passe'],
            'role_id' => $data['role_id'] ?? 3,
            'statut' => $data['statut'] ?? 'actif',
        ]);

        return intval($this->db->lastInsertId());
    }

    public function updateProfile(int $userId, array $data): void
    {
        $stmt = $this->db->prepare(
            'UPDATE utilisateurs
             SET nom = :nom,
                 email = :email,
                 username = :username,
                 photo = :photo
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $userId,
            'nom' => $data['nom'],
            'email' => $data['email'],
            'username' => $data['username'] ?? null,
            'photo' => $data['photo'] ?? null,
        ]);
    }

    public function updateThemePreference(int $userId, string $theme): void
    {
        $stmt = $this->db->prepare(
            'UPDATE utilisateurs
             SET theme_preference = :theme_preference
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $userId,
            'theme_preference' => $theme,
        ]);
    }

    public function updateByFormateurId(int $formateurId, array $data): void
    {
        $stmt = $this->db->prepare(
            'UPDATE utilisateurs
             SET nom = :nom,
                 email = :email,
                 statut = :statut
             WHERE formateur_id = :formateur_id'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'nom' => $data['nom'],
            'email' => $data['email'],
            'statut' => $data['statut'] ?? 'actif',
        ]);
    }

    public function updatePassword(int $userId, string $hashedPassword): void
    {
        $stmt = $this->db->prepare(
            'UPDATE utilisateurs
             SET mot_de_passe = :mot_de_passe,
                 reset_token = NULL,
                 reset_token_expiration = NULL
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $userId,
            'mot_de_passe' => $hashedPassword,
        ]);
    }

    public function updateResetToken(int $userId, string $token, string $expiration): void
    {
        $stmt = $this->db->prepare(
            'UPDATE utilisateurs
             SET reset_token = :reset_token,
                 reset_token_expiration = :reset_token_expiration
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $userId,
            'reset_token' => $token,
            'reset_token_expiration' => $expiration,
        ]);
    }

    public function clearResetToken(int $userId): void
    {
        $stmt = $this->db->prepare(
            'UPDATE utilisateurs
             SET reset_token = NULL,
                 reset_token_expiration = NULL
             WHERE id = :id'
        );
        $stmt->execute(['id' => $userId]);
    }

    public function findByFormateurId(int $formateurId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM utilisateurs WHERE formateur_id = :formateur_id LIMIT 1');
        $stmt->execute(['formateur_id' => $formateurId]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function deleteByFormateurId(int $formateurId): void
    {
        $stmt = $this->db->prepare('DELETE FROM utilisateurs WHERE formateur_id = :formateur_id');
        $stmt->execute(['formateur_id' => $formateurId]);
    }
}
