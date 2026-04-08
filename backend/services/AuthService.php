<?php

require_once __DIR__ . '/../repositories/UserRepository.php';
require_once __DIR__ . '/../repositories/FormateurRepository.php';
require_once __DIR__ . '/../services/MailService.php';
require_once __DIR__ . '/../services/RequestThrottleService.php';
require_once __DIR__ . '/../core/AppLogger.php';
require_once __DIR__ . '/../core/HttpException.php';
require_once __DIR__ . '/../core/helpers.php';

class AuthService
{
    private PDO $db;
    private UserRepository $users;
    private FormateurRepository $formateurs;
    private MailService $mailer;
    private RequestThrottleService $throttles;

    private const LOGIN_MAX_ATTEMPTS = 5;
    private const LOGIN_WINDOW_SECONDS = 900;
    private const LOGIN_BLOCK_SECONDS = 900;
    private const FORGOT_MAX_ATTEMPTS = 4;
    private const FORGOT_WINDOW_SECONDS = 900;
    private const FORGOT_BLOCK_SECONDS = 900;
    private const FORGOT_EMAIL_COOLDOWN_SECONDS = 300;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->users = new UserRepository($db);
        $this->formateurs = new FormateurRepository($db);
        $this->mailer = new MailService();
        $this->throttles = new RequestThrottleService($db);
    }

    private function buildUsernameSeed(string $value): string
    {
        $value = strtolower(trim($value));
        $value = preg_replace('/[^a-z0-9._-]+/', '.', $value) ?? '';
        $value = trim($value, '.-_');

        return $value !== '' ? substr($value, 0, 100) : 'utilisateur';
    }

    private function buildAvailableUsername(string $name, string $email, ?int $ignoreUserId = null): string
    {
        $base = $this->buildUsernameSeed(strstr($email, '@', true) ?: $name);
        $candidate = $base;
        $suffix = 1;

        while (true) {
            $existing = $this->users->findByUsername($candidate);
            if (!$existing || ($ignoreUserId !== null && intval($existing['id']) === $ignoreUserId)) {
                return $candidate;
            }

            $candidate = substr($base, 0, 94) . '-' . $suffix;
            $suffix++;
        }
    }

    public function login(string $email, string $password): array
    {
        $this->assertLoginAllowed($email);

        $user = $this->users->findByEmail($email);
        $isActive = ($user['statut'] ?? 'actif') === 'actif';

        if (!$user || !$isActive || !password_verify($password, $user['mot_de_passe'])) {
            $this->registerLoginFailure($email);
            AppLogger::warning('Authentication failed.', [
                'email' => $email,
                'ip' => clientIp(),
            ]);
            throw new UnauthorizedException('Email ou mot de passe incorrect.');
        }

        if (password_needs_rehash($user['mot_de_passe'], PASSWORD_DEFAULT)) {
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            $this->users->updatePassword(intval($user['id']), $newHash);
            $user['mot_de_passe'] = $newHash;
        }

        $this->clearLoginFailures($email);

        ensureSessionStarted();
        session_regenerate_id(true);
        $_SESSION['user_id'] = intval($user['id']);
        $_SESSION['role'] = intval($user['role_id']);

        unset($user['mot_de_passe'], $user['reset_token'], $user['reset_token_expiration']);

        return $user;
    }

    public function register(string $name, string $email, string $password, int $roleId): array
    {
        if ($roleId !== 3) {
            throw new ValidationException('Le role selectionne est invalide.');
        }

        if ($this->users->findByEmail($email)) {
            throw new ConflictException('Un compte existe deja avec cet email.');
        }

        if ($roleId === 3 && $this->formateurs->findByEmail($email)) {
            throw new ConflictException('Un formateur existe deja avec cet email.');
        }

        $this->db->beginTransaction();

        try {
            $formateurId = null;

            if ($roleId === 3) {
                $formateurId = $this->formateurs->create([
                    'nom' => $name,
                    'email' => $email,
                    'specialite' => 'A definir',
                    'max_heures' => 910,
                ]);
            }

            $userId = $this->users->create([
                'formateur_id' => $formateurId,
                'nom' => $name,
                'email' => $email,
                'mot_de_passe' => password_hash($password, PASSWORD_DEFAULT),
                'username' => $this->buildAvailableUsername($name, $email),
                'role_id' => $roleId,
                'statut' => 'actif',
            ]);

            $this->db->commit();

            $user = $this->users->findById($userId);
            unset($user['mot_de_passe'], $user['reset_token'], $user['reset_token_expiration']);

            return $user;
        } catch (Throwable $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $exception;
        }
    }

    public function forgotPassword(string $email): void
    {
        $this->throttles->hit(
            'auth.forgot-password.ip',
            $this->scopeKey(clientIp()),
            self::FORGOT_MAX_ATTEMPTS,
            self::FORGOT_WINDOW_SECONDS,
            self::FORGOT_BLOCK_SECONDS,
            'Trop de demandes de reinitialisation. Veuillez reessayer dans quelques minutes.'
        );

        $user = $this->users->findByEmail($email);

        if (!$user || ($user['statut'] ?? 'actif') !== 'actif') {
            AppLogger::warning('Password reset requested for unknown or inactive account.', [
                'email' => $email,
                'ip' => clientIp(),
            ]);
            return;
        }

        $emailScope = $this->scopeKey($email);
        if ($this->throttles->isCoolingDown('auth.forgot-password.email', $emailScope, self::FORGOT_EMAIL_COOLDOWN_SECONDS)) {
            AppLogger::warning('Password reset skipped because of email cooldown.', [
                'email' => $email,
                'ip' => clientIp(),
            ]);
            return;
        }

        $this->throttles->touch('auth.forgot-password.email', $emailScope);

        $token = bin2hex(random_bytes(32));
        $hashedToken = hash('sha256', $token);
        $expiration = date('Y-m-d H:i:s', time() + 3600);

        $this->users->updateResetToken(intval($user['id']), $hashedToken, $expiration);

        try {
            $this->mailer->sendResetPasswordEmail(
                $user['email'],
                $user['nom'] ?? '',
                $token
            );
        } catch (Throwable $exception) {
            $this->users->clearResetToken(intval($user['id']));
            AppLogger::error('Password reset email delivery failed.', [
                'email' => $user['email'],
                'ip' => clientIp(),
                'error' => $exception->getMessage(),
            ]);
        }
    }

    public function resetPassword(string $token, string $newPassword): void
    {
        $user = $this->users->findByResetToken(hash('sha256', $token));

        if (!$user) {
            AppLogger::warning('Password reset rejected because token was invalid.', [
                'ip' => clientIp(),
            ]);
            throw new ValidationException('Le lien de reinitialisation est invalide ou expire.');
        }

        $expiration = $user['reset_token_expiration'] ?? null;
        if ($expiration === null || strtotime($expiration) === false || strtotime($expiration) < time()) {
            $this->users->clearResetToken(intval($user['id']));
            AppLogger::warning('Password reset rejected because token expired.', [
                'user_id' => intval($user['id']),
                'ip' => clientIp(),
            ]);
            throw new ValidationException('Le lien de reinitialisation est invalide ou expire.');
        }

        $this->users->updatePassword(intval($user['id']), password_hash($newPassword, PASSWORD_DEFAULT));
        AppLogger::info('Password reset completed.', [
            'user_id' => intval($user['id']),
            'ip' => clientIp(),
        ]);
    }

    public function logout(): void
    {
        ensureSessionStarted();
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }

        session_destroy();
    }

    public function currentUser(): array
    {
        $userId = requireAuthentication();
        $user = $this->users->findById($userId);

        if (!$user || ($user['statut'] ?? 'actif') !== 'actif') {
            throw new UnauthorizedException();
        }

        unset($user['mot_de_passe'], $user['reset_token'], $user['reset_token_expiration']);

        return $user;
    }

    public function updateProfile(array $data): array
    {
        $userId = requireAuthentication();
        $user = $this->users->findById($userId);

        if (!$user || ($user['statut'] ?? 'actif') !== 'actif') {
            throw new UnauthorizedException();
        }

        $emailOwner = $this->users->findByEmail($data['email']);
        if ($emailOwner && intval($emailOwner['id']) !== $userId) {
            throw new ConflictException('Un compte existe deja avec cet email.');
        }

        $usernameOwner = $this->users->findByUsername($data['username']);
        if ($usernameOwner && intval($usernameOwner['id']) !== $userId) {
            throw new ConflictException('Ce nom d utilisateur est deja utilise.');
        }

        if (!empty($data['new_password'])) {
            if (empty($data['current_password']) || !password_verify($data['current_password'], $user['mot_de_passe'])) {
                throw new ValidationException('Le mot de passe actuel est incorrect.');
            }

            if (strlen($data['new_password']) < 6) {
                throw new ValidationException('Le nouveau mot de passe doit contenir au moins 6 caracteres.');
            }

            if (($data['confirm_password'] ?? '') !== $data['new_password']) {
                throw new ValidationException('La confirmation du mot de passe ne correspond pas.');
            }
        }

        $this->db->beginTransaction();

        try {
            $this->users->updateProfile($userId, [
                'nom' => $data['name'],
                'email' => $data['email'],
                'username' => $data['username'],
                'photo' => $data['photo'] ?? null,
            ]);

            if (!empty($data['new_password'])) {
                $this->users->updatePassword($userId, password_hash($data['new_password'], PASSWORD_DEFAULT));
            }

            if (!empty($user['formateur_id'])) {
                $this->formateurs->syncIdentity(intval($user['formateur_id']), $data['name'], $data['email']);
            }

            $this->db->commit();
        } catch (Throwable $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $exception;
        }

        return $this->currentUser();
    }

    public function updateThemePreference(string $theme): array
    {
        $userId = requireAuthentication();
        $user = $this->users->findById($userId);

        if (!$user || ($user['statut'] ?? 'actif') !== 'actif') {
            throw new UnauthorizedException();
        }

        if (!in_array($theme, ['light', 'dark'], true)) {
            throw new ValidationException('Le theme selectionne est invalide.');
        }

        $this->users->updateThemePreference($userId, $theme);

        return $this->currentUser();
    }

    private function assertLoginAllowed(string $email): void
    {
        $message = 'Trop de tentatives de connexion. Veuillez reessayer dans quelques minutes.';

        try {
            $this->throttles->assertAllowed(
                'auth.login.ip',
                $this->scopeKey(clientIp()),
                self::LOGIN_WINDOW_SECONDS,
                $message
            );
            $this->throttles->assertAllowed(
                'auth.login.email',
                $this->scopeKey($email),
                self::LOGIN_WINDOW_SECONDS,
                $message
            );
        } catch (TooManyRequestsException $exception) {
            AppLogger::warning('Authentication blocked by rate limit.', [
                'email' => $email,
                'ip' => clientIp(),
                'retry_after' => $exception->getErrors()['retry_after'] ?? null,
            ]);
            throw $exception;
        }
    }

    private function registerLoginFailure(string $email): void
    {
        $this->throttles->registerFailure(
            'auth.login.ip',
            $this->scopeKey(clientIp()),
            self::LOGIN_MAX_ATTEMPTS,
            self::LOGIN_WINDOW_SECONDS,
            self::LOGIN_BLOCK_SECONDS
        );
        $this->throttles->registerFailure(
            'auth.login.email',
            $this->scopeKey($email),
            self::LOGIN_MAX_ATTEMPTS,
            self::LOGIN_WINDOW_SECONDS,
            self::LOGIN_BLOCK_SECONDS
        );
    }

    private function clearLoginFailures(string $email): void
    {
        $this->throttles->clear('auth.login.ip', $this->scopeKey(clientIp()));
        $this->throttles->clear('auth.login.email', $this->scopeKey($email));
    }

    private function scopeKey(string $value): string
    {
        return hash('sha256', strtolower(trim($value)));
    }
}
