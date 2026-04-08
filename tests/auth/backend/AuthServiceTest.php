<?php

require_once __DIR__ . '/../../../backend/services/AuthService.php';

use PHPUnit\Framework\TestCase;

final class AuthServiceTest extends TestCase
{
    private PDO $db;
    private AuthService $service;

    protected function setUp(): void
    {
        $this->db = $GLOBALS['test_db_connection'];
        beginBackendTestTransaction($this->db);
        $this->service = new AuthService($this->db);

        $_SERVER['REMOTE_ADDR'] = '127.0.0.1';
        ensureSessionStarted();
        $_SESSION = [];

        putenv('SMTP_USERNAME=');
        putenv('SMTP_PASSWORD=');
    }

    protected function tearDown(): void
    {
        $_SESSION = [];

        rollbackBackendTestTransaction($this->db);
    }

    public function testLoginStoresSessionAndClearsThrottleRecordsAfterPreviousFailures(): void
    {
        $fixture = $this->createUserFixture('auth-login-ok', 2);

        try {
            $this->service->login($fixture['email'], 'wrong-password');
            self::fail('La connexion avec un mauvais mot de passe devait echouer.');
        } catch (UnauthorizedException $exception) {
            self::assertSame(401, $exception->getStatusCode());
        }

        $user = $this->service->login($fixture['email'], $fixture['password']);

        self::assertSame($fixture['email'], $user['email']);
        self::assertSame($fixture['user_id'], intval($_SESSION['user_id'] ?? 0));
        self::assertSame(2, intval($_SESSION['role'] ?? 0));
        self::assertSame(0, $this->countThrottleRows('auth.login.email', $fixture['email']));
        self::assertSame(0, $this->countThrottleRows('auth.login.ip', $_SERVER['REMOTE_ADDR']));
    }

    public function testLoginBlocksAfterTooManyFailures(): void
    {
        $fixture = $this->createUserFixture('auth-rate-limit', 2);

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            try {
                $this->service->login($fixture['email'], 'bad-secret');
                self::fail('La tentative invalide devait lever une exception.');
            } catch (UnauthorizedException $exception) {
                self::assertSame('Email ou mot de passe incorrect.', $exception->getMessage());
            }
        }

        $this->expectException(TooManyRequestsException::class);
        $this->expectExceptionMessage('Trop de tentatives de connexion');

        try {
            $this->service->login($fixture['email'], 'bad-secret');
        } catch (TooManyRequestsException $exception) {
            self::assertGreaterThan(0, intval($exception->getErrors()['retry_after'] ?? 0));
            throw $exception;
        }
    }

    public function testForgotPasswordStoresTokenForKnownUserWhenSmtpIsDisabled(): void
    {
        $fixture = $this->createUserFixture('forgot-password', 3);

        $this->service->forgotPassword($fixture['email']);
        $row = $this->findUserById($fixture['user_id']);

        self::assertNotNull($row['reset_token']);
        self::assertSame(64, strlen((string) $row['reset_token']));
        self::assertNotNull($row['reset_token_expiration']);
    }

    public function testResetPasswordRejectsExpiredTokensAndClearsThem(): void
    {
        $fixture = $this->createUserFixture('expired-reset', 3);
        $plainToken = bin2hex(random_bytes(32));
        $this->setResetToken(
            $fixture['user_id'],
            hash('sha256', $plainToken),
            date('Y-m-d H:i:s', strtotime('-1 hour'))
        );

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('invalide ou expire');

        try {
            $this->service->resetPassword($plainToken, 'new-secret-456');
        } finally {
            $row = $this->findUserById($fixture['user_id']);
            self::assertNull($row['reset_token']);
            self::assertNull($row['reset_token_expiration']);
        }
    }

    public function testUpdateThemePreferencePersistsOnlySupportedValues(): void
    {
        $fixture = $this->createUserFixture('theme-pref', 2);
        $_SESSION['user_id'] = $fixture['user_id'];
        $_SESSION['role'] = 2;

        $updated = $this->service->updateThemePreference('light');

        self::assertSame('light', $updated['theme_preference']);
        self::assertSame('light', $this->findUserById($fixture['user_id'])['theme_preference']);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('theme selectionne est invalide');
        $this->service->updateThemePreference('sepia');
    }

    private function createUserFixture(string $suffix, int $roleId): array
    {
        $password = 'secret123';
        $formateurId = null;

        if ($roleId === 3) {
            $stmt = $this->db->prepare(
                'INSERT INTO formateurs (nom, email, telephone, specialite, max_heures, current_hours, weekly_hours)
                 VALUES (:nom, :email, :telephone, :specialite, 910, 0, 12)'
            );
            $stmt->execute([
                'nom' => 'Formateur ' . $suffix,
                'email' => $suffix . '@example.com',
                'telephone' => '+212601' . substr(md5($suffix), 0, 6),
                'specialite' => 'Auth QA',
            ]);
            $formateurId = intval($this->db->lastInsertId());
        }

        $stmt = $this->db->prepare(
            'INSERT INTO utilisateurs (
                formateur_id,
                nom,
                email,
                username,
                mot_de_passe,
                role_id,
                statut,
                theme_preference
             ) VALUES (
                :formateur_id,
                :nom,
                :email,
                :username,
                :mot_de_passe,
                :role_id,
                :statut,
                :theme_preference
             )'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'nom' => 'Utilisateur ' . $suffix,
            'email' => $suffix . '@example.com',
            'username' => 'user.' . $suffix,
            'mot_de_passe' => password_hash($password, PASSWORD_DEFAULT),
            'role_id' => $roleId,
            'statut' => 'actif',
            'theme_preference' => 'dark',
        ]);

        return [
            'user_id' => intval($this->db->lastInsertId()),
            'formateur_id' => $formateurId,
            'email' => $suffix . '@example.com',
            'password' => $password,
        ];
    }

    private function countThrottleRows(string $actionKey, string $scopeValue): int
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*)
             FROM request_throttles
             WHERE action_key = :action_key
               AND scope_key = :scope_key'
        );
        $stmt->execute([
            'action_key' => $actionKey,
            'scope_key' => hash('sha256', strtolower(trim($scopeValue))),
        ]);

        return intval($stmt->fetchColumn() ?: 0);
    }

    private function setResetToken(int $userId, string $hashedToken, string $expiration): void
    {
        $stmt = $this->db->prepare(
            'UPDATE utilisateurs
             SET reset_token = :reset_token,
                 reset_token_expiration = :reset_token_expiration
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $userId,
            'reset_token' => $hashedToken,
            'reset_token_expiration' => $expiration,
        ]);
    }

    private function findUserById(int $userId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM utilisateurs WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $userId]);
        $row = $stmt->fetch();

        self::assertIsArray($row);

        return $row;
    }
}
