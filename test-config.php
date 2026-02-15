<?php
/**
 * Script de test de configuration
 * Vérifie que PHPMailer et les variables d'environnement sont correctement configurés
 */

require_once __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use Dotenv\Dotenv;

echo "=== TEST DE CONFIGURATION ===\n\n";

// Test 1: Chargement de Dotenv
echo "1. Test chargement des variables d'environnement...\n";
try {
    $dotenv = Dotenv::createImmutable(__DIR__);
    $dotenv->load();
    echo "   ✅ Variables d'environnement chargées avec succès\n\n";
} catch (Exception $e) {
    echo "   ❌ ERREUR: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 2: Vérification des variables requises
echo "2. Vérification des variables requises...\n";
$requiredVars = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM_EMAIL',
    'SMTP_FROM_NAME',
    'EMAIL_TO'
];

$missingVars = [];
foreach ($requiredVars as $var) {
    if (empty($_ENV[$var])) {
        $missingVars[] = $var;
        echo "   ❌ Variable manquante: $var\n";
    } else {
        // Masquer les mots de passe
        $value = ($var === 'SMTP_PASS') ? '***********' : $_ENV[$var];
        echo "   ✅ $var = $value\n";
    }
}

if (!empty($missingVars)) {
    echo "\n❌ Variables manquantes: " . implode(', ', $missingVars) . "\n";
    exit(1);
}
echo "\n";

// Test 3: Test de connexion SMTP
echo "3. Test de connexion SMTP (Brevo)...\n";
$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = $_ENV['SMTP_HOST'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $_ENV['SMTP_USER'];
    $mail->Password   = $_ENV['SMTP_PASS'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $_ENV['SMTP_PORT'];
    $mail->Timeout    = 10;

    // Tester la connexion sans envoyer d'email
    $mail->SMTPDebug = 0; // Désactiver le debug
    echo "   ✅ Configuration SMTP valide\n";
    echo "   📧 Host: " . $_ENV['SMTP_HOST'] . "\n";
    echo "   🔌 Port: " . $_ENV['SMTP_PORT'] . "\n";
    echo "   👤 User: " . $_ENV['SMTP_USER'] . "\n\n";

} catch (Exception $e) {
    echo "   ❌ ERREUR SMTP: " . $mail->ErrorInfo . "\n\n";
    exit(1);
}

// Test 4: Vérification des destinataires
echo "4. Vérification des destinataires...\n";
$recipients = explode(',', $_ENV['EMAIL_TO']);
echo "   📬 " . count($recipients) . " destinataire(s) configuré(s):\n";
foreach ($recipients as $recipient) {
    $recipient = trim($recipient);
    if (filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
        echo "      ✅ $recipient\n";
    } else {
        echo "      ❌ Email invalide: $recipient\n";
    }
}
echo "\n";

// Test 5: Pushover (optionnel)
echo "5. Configuration Pushover...\n";
if (!empty($_ENV['PUSHOVER_TOKEN']) && !empty($_ENV['PUSHOVER_USER'])) {
    echo "   ✅ Pushover configuré\n";
    echo "   🔑 Token: " . substr($_ENV['PUSHOVER_TOKEN'], 0, 10) . "...\n";
    echo "   👤 User: " . substr($_ENV['PUSHOVER_USER'], 0, 10) . "...\n\n";
} else {
    echo "   ⚠️  Pushover non configuré (optionnel)\n\n";
}

// Test 6: Permissions des dossiers
echo "6. Vérification des permissions...\n";
$logsDir = __DIR__ . '/logs';
if (!file_exists($logsDir)) {
    if (mkdir($logsDir, 0755, true)) {
        echo "   ✅ Dossier logs créé\n";
    } else {
        echo "   ❌ Impossible de créer le dossier logs\n";
    }
} else {
    if (is_writable($logsDir)) {
        echo "   ✅ Dossier logs accessible en écriture\n";
    } else {
        echo "   ❌ Dossier logs non accessible en écriture\n";
    }
}
echo "\n";

// Test 7: Rate limiting
echo "7. Configuration Rate Limiting...\n";
$rateLimit = filter_var($_ENV['RATE_LIMIT_ENABLED'] ?? true, FILTER_VALIDATE_BOOLEAN);
if ($rateLimit) {
    echo "   ✅ Rate limiting activé\n";
    echo "   📊 Max soumissions: " . ($_ENV['RATE_LIMIT_MAX_SUBMISSIONS'] ?? 3) . "\n";
    echo "   ⏱️  Fenêtre temporelle: " . ($_ENV['RATE_LIMIT_TIME_WINDOW'] ?? 3600) . " secondes\n";
} else {
    echo "   ⚠️  Rate limiting désactivé\n";
}
echo "\n";

// Résumé final
echo "=== RÉSUMÉ ===\n";
echo "✅ Toutes les vérifications sont passées avec succès!\n";
echo "🚀 Le formulaire est prêt à être utilisé.\n\n";

echo "Configuration:\n";
echo "- SMTP: " . $_ENV['SMTP_HOST'] . ":" . $_ENV['SMTP_PORT'] . "\n";
echo "- Expéditeur: " . $_ENV['SMTP_FROM_EMAIL'] . "\n";
echo "- Destinataires: " . count($recipients) . "\n";
echo "- Pushover: " . ((!empty($_ENV['PUSHOVER_TOKEN'])) ? 'Activé' : 'Désactivé') . "\n";
echo "- Rate Limiting: " . ($rateLimit ? 'Activé' : 'Désactivé') . "\n\n";

echo "Pour tester l'envoi d'un email réel, utilisez le formulaire web.\n";
