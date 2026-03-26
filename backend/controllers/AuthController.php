<?php

require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../core/InputValidator.php';
require_once __DIR__ . '/../core/helpers.php';

class AuthController
{
    private AuthService $auth;

    public function __construct(PDO $db)
    {
        $this->auth = new AuthService($db);
    }

    public function login(): void
    {
        $payload = readJsonBody();
        $user = $this->auth->login(
            InputValidator::email($payload, 'email', 'email'),
            InputValidator::string($payload, 'password', 'mot de passe')
        );

        jsonResponse([
            'status' => 'success',
            'user' => $user,
        ]);
    }

    public function register(): void
    {
        $payload = readJsonBody();
        $password = InputValidator::string($payload, 'password', 'mot de passe', true, 255);
        $confirmPassword = InputValidator::string($payload, 'confirm_password', 'confirmation du mot de passe', true, 255);

        if (strlen($password) < 6) {
            throw new ValidationException('Le mot de passe doit contenir au moins 6 caracteres.');
        }

        if ($password !== $confirmPassword) {
            throw new ValidationException('La confirmation du mot de passe ne correspond pas.');
        }

        $user = $this->auth->register(
            InputValidator::string($payload, 'name', 'nom', true, 120),
            InputValidator::email($payload, 'email', 'email'),
            $password,
            InputValidator::integer($payload, 'role_id', 'role', true, 1, 3)
        );

        jsonResponse([
            'status' => 'success',
            'message' => 'Compte cree avec succes.',
            'user' => $user,
        ], 201);
    }

    public function forgotPassword(): void
    {
        $payload = readJsonBody();
        $email = InputValidator::email($payload, 'email', 'email');
        $this->auth->forgotPassword($email);

        jsonResponse([
            'status' => 'success',
            'message' => 'Si cet email existe, un lien a ete envoye.',
        ]);
    }

    public function resetPassword(): void
    {
        $payload = readJsonBody();
        $token = InputValidator::string($payload, 'token', 'token', true, 128);
        $password = InputValidator::string($payload, 'password', 'mot de passe', true, 255);
        $confirmPassword = InputValidator::string($payload, 'confirm_password', 'confirmation du mot de passe', true, 255);

        if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
            throw new ValidationException('Le token de reinitialisation est invalide.');
        }

        if (strlen($password) < 6) {
            throw new ValidationException('Le mot de passe doit contenir au moins 6 caracteres.');
        }

        if ($password !== $confirmPassword) {
            throw new ValidationException('La confirmation du mot de passe ne correspond pas.');
        }

        $this->auth->resetPassword($token, $password);

        jsonResponse([
            'status' => 'success',
            'message' => 'Mot de passe reinitialise avec succes.',
        ]);
    }

    public function logout(): void
    {
        $this->auth->logout();

        jsonResponse([
            'status' => 'success',
            'message' => 'Deconnecte.',
        ]);
    }

    public function check(): void
    {
        jsonResponse([
            'status' => 'success',
            'user' => $this->auth->currentUser(),
        ]);
    }

    public function updateProfile(): void
    {
        $payload = readJsonBody();
        $photo = $payload['photo'] ?? null;

        if ($photo !== null && !is_string($photo)) {
            throw new ValidationException('Le format de photo est invalide.');
        }

        if (is_string($photo) && strlen($photo) > 2000000) {
            throw new ValidationException('La photo depasse la taille autorisee.');
        }

        $user = $this->auth->updateProfile([
            'name' => InputValidator::string($payload, 'name', 'nom complet', true, 120),
            'email' => InputValidator::email($payload, 'email', 'email'),
            'username' => InputValidator::string($payload, 'username', 'nom d utilisateur', true, 120),
            'photo' => is_string($photo) && trim($photo) !== '' ? trim($photo) : null,
            'current_password' => InputValidator::string($payload, 'current_password', 'mot de passe actuel', false, 255),
            'new_password' => InputValidator::string($payload, 'new_password', 'nouveau mot de passe', false, 255),
            'confirm_password' => InputValidator::string($payload, 'confirm_password', 'confirmation du mot de passe', false, 255),
        ]);

        jsonResponse([
            'status' => 'success',
            'message' => 'Profil mis a jour avec succes.',
            'user' => $user,
        ]);
    }

    public function updateThemePreference(): void
    {
        $payload = readJsonBody();
        $theme = InputValidator::string($payload, 'theme', 'theme', true, 10);

        $user = $this->auth->updateThemePreference($theme);

        jsonResponse([
            'status' => 'success',
            'message' => 'Theme mis a jour avec succes.',
            'user' => $user,
        ]);
    }
}
