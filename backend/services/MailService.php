<?php

require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../core/AppLogger.php';

$envPath = __DIR__ . '/../.env';
loadEnvironment($envPath);

if (!is_file($envPath)) {
    loadEnvironment(__DIR__ . '/../.env.example');
}

class MailService
{
    private string $frontendUrl;

    public function __construct()
    {
        $this->frontendUrl = rtrim(getenv('APP_FRONTEND_URL') ?: 'http://localhost:5173', '/');
    }

    public function resetPasswordUrl(string $token): string
    {
        return $this->frontendUrl . '/reset-password/' . rawurlencode($token);
    }

    public function sendResetPasswordEmail(string $recipientEmail, string $recipientName, string $token): void
    {
        $resetUrl = $this->resetPasswordUrl($token);

        if (!$this->canUsePhpMailer()) {
            AppLogger::warning('SMTP not configured, reset link written to application log.', [
                'email' => $recipientEmail,
            ]);
            $this->logResetLink($recipientEmail, $resetUrl);
            return;
        }

        require_once __DIR__ . '/../vendor/autoload.php';

        $lastException = null;

        for ($attempt = 1; $attempt <= 2; $attempt++) {
            try {
                $mailer = $this->buildMailer();
                $mailer->addAddress($recipientEmail, $recipientName !== '' ? $recipientName : $recipientEmail);
                $mailer->isHTML(true);
                $mailer->Subject = 'Reinitialisation du mot de passe';
                $mailer->Body = sprintf(
                    '<p>Bonjour %s,</p><p>Pour reinitialiser votre mot de passe, cliquez sur le lien suivant :</p><p><a href="%s">%s</a></p><p>Ce lien expire dans 1 heure.</p>',
                    htmlspecialchars($recipientName !== '' ? $recipientName : 'utilisateur', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'),
                    htmlspecialchars($resetUrl, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'),
                    htmlspecialchars($resetUrl, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')
                );
                $mailer->AltBody = "Bonjour {$recipientName},\n\nPour reinitialiser votre mot de passe, utilisez ce lien : {$resetUrl}\n\nCe lien expire dans 1 heure.";
                $mailer->send();

                AppLogger::info('Reset password email sent.', [
                    'email' => $recipientEmail,
                    'attempt' => $attempt,
                ]);
                return;
            } catch (Throwable $exception) {
                $lastException = $exception;
                AppLogger::error('Reset password email attempt failed.', [
                    'email' => $recipientEmail,
                    'attempt' => $attempt,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        throw new RuntimeException(
            'Impossible d envoyer l email de reinitialisation.',
            0,
            $lastException
        );
    }

    private function canUsePhpMailer(): bool
    {
        return is_file(__DIR__ . '/../vendor/autoload.php')
            && (getenv('SMTP_USERNAME') ?: '') !== ''
            && (getenv('SMTP_PASSWORD') ?: '') !== '';
    }

    private function buildMailer(): PHPMailer\PHPMailer\PHPMailer
    {
        $mailer = new PHPMailer\PHPMailer\PHPMailer(true);
        $mailer->isSMTP();
        $mailer->Host = getenv('SMTP_HOST') ?: 'smtp.gmail.com';
        $mailer->Port = intval(getenv('SMTP_PORT') ?: 587);
        $mailer->SMTPAuth = true;
        $mailer->Username = getenv('SMTP_USERNAME') ?: '';
        $mailer->Password = getenv('SMTP_PASSWORD') ?: '';
        $mailer->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mailer->CharSet = 'UTF-8';

        $fromEmail = getenv('SMTP_FROM_EMAIL') ?: $mailer->Username;
        $fromName = getenv('SMTP_FROM_NAME') ?: 'Gestion des horaires';

        $mailer->setFrom($fromEmail, $fromName);

        return $mailer;
    }

    private function logResetLink(string $recipientEmail, string $resetUrl): void
    {
        AppLogger::info('Reset password preview link generated.', [
            'email' => $recipientEmail,
            'reset_url' => $resetUrl,
        ]);
    }
}
