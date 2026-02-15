<?php
/**
 * Ma Petite Laverie - Form Submission Handler
 * Handles lead form submissions with email notifications and Pushover alerts
 */

// Load dependencies
require_once __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Security headers
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Check if request is AJAX
if (empty($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'xmlhttprequest') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid request']);
    exit;
}

// Configuration from environment variables
$CONFIG = [
    // Email settings
    'email_to' => explode(',', $_ENV['EMAIL_TO']),
    'smtp_host' => $_ENV['SMTP_HOST'],
    'smtp_port' => $_ENV['SMTP_PORT'],
    'smtp_user' => $_ENV['SMTP_USER'],
    'smtp_pass' => $_ENV['SMTP_PASS'],
    'smtp_from_email' => $_ENV['SMTP_FROM_EMAIL'],
    'smtp_from_name' => $_ENV['SMTP_FROM_NAME'],

    // Pushover settings
    'pushover_enabled' => !empty($_ENV['PUSHOVER_TOKEN']),
    'pushover_token' => $_ENV['PUSHOVER_TOKEN'] ?? '',
    'pushover_user' => $_ENV['PUSHOVER_USER'] ?? '',

    // Rate limiting
    'rate_limit_enabled' => filter_var($_ENV['RATE_LIMIT_ENABLED'] ?? true, FILTER_VALIDATE_BOOLEAN),
    'rate_limit_max_submissions' => (int)($_ENV['RATE_LIMIT_MAX_SUBMISSIONS'] ?? 3),
    'rate_limit_time_window' => (int)($_ENV['RATE_LIMIT_TIME_WINDOW'] ?? 3600),
];

// Initialize response
$response = [
    'success' => false,
    'error' => null,
    'data' => null
];

// CSRF Protection
function validateCSRFToken($token) {
    if (empty($token) || strlen($token) < 20) {
        return false;
    }
    // In production, validate against session token
    // For now, basic validation
    return true;
}

// XSS Protection - Sanitize input
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

// Validate phone number (French format)
function validatePhone($phone) {
    $pattern = '/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/';
    return preg_match($pattern, $phone);
}

// Validate email
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Rate limiting
function checkRateLimit($ip, $config) {
    if (!$config['rate_limit_enabled']) {
        return true;
    }

    $logFile = __DIR__ . '/logs/rate_limit.json';

    // Create logs directory if it doesn't exist
    if (!file_exists(__DIR__ . '/logs')) {
        mkdir(__DIR__ . '/logs', 0755, true);
    }

    $data = [];
    if (file_exists($logFile)) {
        $data = json_decode(file_get_contents($logFile), true) ?: [];
    }

    $now = time();
    $timeWindow = $config['rate_limit_time_window'];

    // Clean old entries
    $data = array_filter($data, function($entry) use ($now, $timeWindow) {
        return ($now - $entry['time']) < $timeWindow;
    });

    // Count submissions from this IP
    $ipSubmissions = array_filter($data, function($entry) use ($ip) {
        return $entry['ip'] === $ip;
    });

    if (count($ipSubmissions) >= $config['rate_limit_max_submissions']) {
        return false;
    }

    // Add new entry
    $data[] = [
        'ip' => $ip,
        'time' => $now
    ];

    file_put_contents($logFile, json_encode($data));

    return true;
}

// Log submission to database/file
function logSubmission($formData) {
    $logFile = __DIR__ . '/logs/submissions.json';

    // Create logs directory if it doesn't exist
    if (!file_exists(__DIR__ . '/logs')) {
        mkdir(__DIR__ . '/logs', 0755, true);
    }

    $submissions = [];
    if (file_exists($logFile)) {
        $submissions = json_decode(file_get_contents($logFile), true) ?: [];
    }

    $submissions[] = [
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR'],
        'data' => $formData
    ];

    file_put_contents($logFile, json_encode($submissions, JSON_PRETTY_PRINT));
}

// Send email notification using PHPMailer
function sendEmail($formData, $config) {
    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = $config['smtp_host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $config['smtp_user'];
        $mail->Password   = $config['smtp_pass'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = $config['smtp_port'];
        $mail->CharSet    = 'UTF-8';

        // Recipients
        $mail->setFrom($config['smtp_from_email'], $config['smtp_from_name']);
        foreach ($config['email_to'] as $recipient) {
            $mail->addAddress(trim($recipient));
        }
        $mail->addReplyTo($formData['email'], $formData['prenom'] . ' ' . $formData['nom']);

        // Content
        $mail->isHTML(true);
        $mail->Subject = 'Nouvelle demande de devis - Ma Petite Laverie';

        // Build email body
        $body = "
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0b5ed7; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .field { margin-bottom: 15px; padding: 10px; background: white; border-left: 4px solid #0b5ed7; }
        .label { font-weight: bold; color: #0b5ed7; display: block; margin-bottom: 5px; }
        .value { color: #333; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .badge { display: inline-block; padding: 5px 10px; background: #FFD100; color: #333; border-radius: 4px; font-weight: bold; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🎯 Nouvelle Demande de Devis</h1>
            <p>Une personne intéressée vient de remplir le formulaire</p>
        </div>

        <div class='content'>
            <h2>📋 Détails du Projet</h2>

            <div class='field'>
                <span class='label'>Type de projet</span>
                <span class='value'>" . ucfirst(str_replace('_', ' ', $formData['type_projet'])) . "</span>
            </div>

            <div class='field'>
                <span class='label'>Budget envisagé</span>
                <span class='value'><span class='badge'>" . strtoupper($formData['budget']) . "</span></span>
            </div>

            <div class='field'>
                <span class='label'>Emplacement disponible</span>
                <span class='value'>" . ucfirst($formData['emplacement_disponible']) . "</span>
            </div>";

        if ($formData['emplacement_disponible'] === 'oui') {
            $body .= "
            <div class='field'>
                <span class='label'>Type d'emplacement</span>
                <span class='value'>" . ($formData['type_emplacement'] ?: 'Non spécifié') . "</span>
            </div>

            <div class='field'>
                <span class='label'>Ville / Département</span>
                <span class='value'>" . ($formData['ville_emplacement'] ?: 'Non spécifié') . "</span>
            </div>";
        }

        $body .= "
            <div class='field'>
                <span class='label'>Timing du projet</span>
                <span class='value'>" . ucfirst(str_replace('_', ' ', $formData['timing'])) . "</span>
            </div>

            <div class='field'>
                <span class='label'>Surface disponible</span>
                <span class='value'>" . $formData['surface'] . "</span>
            </div>

            <h2>👤 Coordonnées du Contact</h2>

            <div class='field'>
                <span class='label'>Nom complet</span>
                <span class='value'>" . $formData['prenom'] . " " . $formData['nom'] . "</span>
            </div>

            <div class='field'>
                <span class='label'>📞 Téléphone</span>
                <span class='value'><strong>" . $formData['telephone'] . "</strong></span>
            </div>

            <div class='field'>
                <span class='label'>📧 Email</span>
                <span class='value'><strong>" . $formData['email'] . "</strong></span>
            </div>

            <div class='field'>
                <span class='label'>Newsletter opt-in</span>
                <span class='value'>" . (isset($formData['newsletter_optin']) && $formData['newsletter_optin'] === 'yes' ? '✅ Oui' : '❌ Non') . "</span>
            </div>
        </div>

        <div class='footer'>
            <p>Reçu le " . date('d/m/Y à H:i') . "</p>
            <p>IP: " . $_SERVER['REMOTE_ADDR'] . "</p>
        </div>
    </div>
</body>
</html>";

        $mail->Body = $body;
        $mail->send();
        return true;

    } catch (Exception $e) {
        error_log("Email sending failed: {$mail->ErrorInfo}");
        return false;
    }
}

// Send Pushover notification
function sendPushoverNotification($formData, $config) {
    if (!$config['pushover_enabled']) {
        return true;
    }

    // Build complete message with all form data
    $message = "🎯 Nouvelle demande de devis\n\n" .
               "👤 " . $formData['prenom'] . " " . $formData['nom'] . "\n" .
               "📞 " . $formData['telephone'] . "\n" .
               "📧 " . $formData['email'] . "\n\n" .
               "📋 PROJET\n" .
               "• Type: " . ucfirst(str_replace('_', ' ', $formData['type_projet'])) . "\n" .
               "• Budget: " . strtoupper($formData['budget']) . "\n" .
               "• Timing: " . ucfirst(str_replace('_', ' ', $formData['timing'])) . "\n" .
               "• Surface: " . $formData['surface'] . "\n\n" .
               "📍 EMPLACEMENT\n" .
               "• Disponible: " . ucfirst($formData['emplacement_disponible']) . "\n";

    if ($formData['emplacement_disponible'] === 'oui') {
        $message .= "• Type: " . ($formData['type_emplacement'] ?: 'Non spécifié') . "\n" .
                   "• Ville: " . ($formData['ville_emplacement'] ?: 'Non spécifié') . "\n";
    }

    $message .= "\n📰 Newsletter: " . ($formData['newsletter_optin'] === 'yes' ? '✅ Oui' : '❌ Non');

    $data = [
        'token' => $config['pushover_token'],
        'user' => $config['pushover_user'],
        'message' => $message,
        'title' => 'Ma Petite Laverie - Lead',
        'priority' => 1,
        'sound' => 'pushover',
        'url' => 'mailto:' . $formData['email'],
        'url_title' => 'Répondre par email'
    ];

    $ch = curl_init('https://api.pushover.net/1/messages.json');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $data,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5
    ]);

    $result = curl_exec($ch);
    curl_close($ch);

    return $result !== false;
}

// Send confirmation email to user
function sendConfirmationEmail($formData, $config) {
    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = $config['smtp_host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $config['smtp_user'];
        $mail->Password   = $config['smtp_pass'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = $config['smtp_port'];
        $mail->CharSet    = 'UTF-8';

        // Recipients
        $mail->setFrom($config['smtp_from_email'], $config['smtp_from_name']);
        $mail->addAddress($formData['email'], $formData['prenom'] . ' ' . $formData['nom']);

        // Content
        $mail->isHTML(true);
        $mail->Subject = 'Demande de devis bien reçue - Ma Petite Laverie';

        $body = "
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0b5ed7; color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 15px 30px; background: #FFD100; color: #333; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>✅ Demande bien reçue !</h1>
        </div>

        <div class='content'>
            <p>Bonjour " . $formData['prenom'] . ",</p>

            <p><strong>Merci pour votre confiance !</strong></p>

            <p>Nous avons bien reçu votre demande de devis pour un projet de laverie automatique.</p>

            <p>Un expert Ma Petite Laverie va analyser votre demande et vous contactera dans les <strong>24 heures ouvrées</strong> pour :</p>

            <ul>
                <li>Échanger sur votre projet en détail</li>
                <li>Vous proposer une solution personnalisée</li>
                <li>Répondre à toutes vos questions</li>
            </ul>

            <p style='text-align: center;'>
                <a href='tel:0240316600' class='button'>📞 Nous joindre : 02 40 31 66 00</a>
            </p>

            <p><strong>Pourquoi choisir Ma Petite Laverie ?</strong></p>
            <ul>
                <li>✓ 30 ans d'expérience dans le secteur</li>
                <li>✓ Fabrication 100% française</li>
                <li>✓ SAV d'excellence et accompagnement personnalisé</li>
                <li>✓ 15 laveries exploitées en propre</li>
            </ul>

            <p>À très bientôt,<br>
            <strong>L'équipe Ma Petite Laverie</strong></p>
        </div>

        <div class='footer'>
            <p><strong>INNOPRESS</strong><br>
            7 Rue de l'Industrie, 44310 Saint Philbert de Grand Lieu<br>
            📞 02 40 31 66 00 | ✉️ direction@mapetitelaverie.fr</p>
        </div>
    </div>
</body>
</html>";

        $mail->Body = $body;
        $mail->send();
        return true;

    } catch (Exception $e) {
        error_log("Confirmation email failed: {$mail->ErrorInfo}");
        return false;
    }
}

try {
    // Check rate limiting
    $clientIP = $_SERVER['REMOTE_ADDR'];
    if (!checkRateLimit($clientIP, $CONFIG)) {
        http_response_code(429);
        $response['error'] = 'Trop de demandes. Veuillez réessayer plus tard.';
        echo json_encode($response);
        exit;
    }

    // Validate CSRF token
    $csrfToken = $_POST['csrf_token'] ?? '';
    if (!validateCSRFToken($csrfToken)) {
        http_response_code(400);
        $response['error'] = 'Token de sécurité invalide';
        echo json_encode($response);
        exit;
    }

    // Sanitize all input data
    $formData = [
        'type_projet' => sanitizeInput($_POST['type_projet'] ?? ''),
        'budget' => sanitizeInput($_POST['budget'] ?? ''),
        'emplacement_disponible' => sanitizeInput($_POST['emplacement_disponible'] ?? ''),
        'type_emplacement' => sanitizeInput($_POST['type_emplacement'] ?? ''),
        'ville_emplacement' => sanitizeInput($_POST['ville_emplacement'] ?? ''),
        'timing' => sanitizeInput($_POST['timing'] ?? ''),
        'surface' => sanitizeInput($_POST['surface'] ?? ''),
        'prenom' => sanitizeInput($_POST['prenom'] ?? ''),
        'nom' => sanitizeInput($_POST['nom'] ?? ''),
        'telephone' => sanitizeInput($_POST['telephone'] ?? ''),
        'email' => sanitizeInput($_POST['email'] ?? ''),
        'newsletter_optin' => isset($_POST['newsletter_optin']) ? 'yes' : 'no',
        'rgpd_consent' => isset($_POST['rgpd_consent']) ? 'yes' : 'no'
    ];

    // Validate required fields
    $requiredFields = ['type_projet', 'budget', 'emplacement_disponible', 'timing', 'surface', 'prenom', 'nom', 'telephone', 'email'];
    foreach ($requiredFields as $field) {
        if (empty($formData[$field])) {
            http_response_code(400);
            $response['error'] = 'Champ requis manquant: ' . $field;
            echo json_encode($response);
            exit;
        }
    }

    // Validate email
    if (!validateEmail($formData['email'])) {
        http_response_code(400);
        $response['error'] = 'Email invalide';
        echo json_encode($response);
        exit;
    }

    // Validate phone
    if (!validatePhone($formData['telephone'])) {
        http_response_code(400);
        $response['error'] = 'Numéro de téléphone invalide';
        echo json_encode($response);
        exit;
    }

    // Validate RGPD consent
    if ($formData['rgpd_consent'] !== 'yes') {
        http_response_code(400);
        $response['error'] = 'Consentement RGPD requis';
        echo json_encode($response);
        exit;
    }

    // Log submission
    logSubmission($formData);

    // Send notification email
    $emailSent = sendEmail($formData, $CONFIG);
    if (!$emailSent) {
        error_log('Failed to send email notification');
    }

    // Send Pushover notification
    $pushoverSent = sendPushoverNotification($formData, $CONFIG);
    if (!$pushoverSent) {
        error_log('Failed to send Pushover notification');
    }

    // Send confirmation email to user
    $confirmationSent = sendConfirmationEmail($formData, $CONFIG);
    if (!$confirmationSent) {
        error_log('Failed to send confirmation email to user');
    }

    // Success response
    $response['success'] = true;
    $response['data'] = [
        'message' => 'Demande envoyée avec succès',
        'email_sent' => $emailSent,
        'confirmation_sent' => $confirmationSent
    ];

    echo json_encode($response);

} catch (Exception $e) {
    error_log('Form submission error: ' . $e->getMessage());
    http_response_code(500);
    $response['error'] = 'Une erreur est survenue. Veuillez réessayer.';
    echo json_encode($response);
}
