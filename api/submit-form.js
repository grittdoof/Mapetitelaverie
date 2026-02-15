/**
 * Ma Petite Laverie - Form Submission Handler (Vercel Serverless Function)
 * Handles lead form submissions with email notifications and Pushover alerts
 */

import nodemailer from 'nodemailer';
import { put, list } from '@vercel/blob';
import { decode } from 'html-entities';

// In-memory rate limiting cache (resets on function cold start)
const rateLimitCache = new Map();

// Configuration from environment variables
const CONFIG = {
  // Email settings
  emailTo: process.env.EMAIL_TO?.split(',') || [],
  smtpHost: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  smtpPort: parseInt(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFromEmail: process.env.FROM_EMAIL || 'noreply@mapetitelaverie.fr',
  smtpFromName: 'Ma Petite Laverie',

  // Pushover settings
  pushoverEnabled: !!process.env.PUSHOVER_TOKEN,
  pushoverToken: process.env.PUSHOVER_TOKEN || '',
  pushoverUser: process.env.PUSHOVER_USER || '',

  // Rate limiting
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 3,
  rateLimitPeriod: parseInt(process.env.RATE_LIMIT_PERIOD) || 3600,
};

/**
 * Validate CSRF token (basic validation)
 */
function validateCSRFToken(token) {
  if (!token || token.length < 20) {
    return false;
  }
  return true;
}

/**
 * Sanitize input to prevent XSS
 */
function sanitizeInput(data) {
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  if (typeof data !== 'string') {
    return data;
  }

  // Remove HTML tags and encode entities
  return data
    .trim()
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '');
}

/**
 * Validate phone number (French format)
 */
function validatePhone(phone) {
  const pattern = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return pattern.test(phone);
}

/**
 * Validate email
 */
function validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

/**
 * Check rate limiting using in-memory cache
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const timeWindow = CONFIG.rateLimitPeriod * 1000; // Convert to milliseconds

  // Clean old entries
  for (const [cachedIp, timestamps] of rateLimitCache.entries()) {
    const filtered = timestamps.filter(time => (now - time) < timeWindow);
    if (filtered.length === 0) {
      rateLimitCache.delete(cachedIp);
    } else {
      rateLimitCache.set(cachedIp, filtered);
    }
  }

  // Check submissions from this IP
  const ipSubmissions = rateLimitCache.get(ip) || [];

  if (ipSubmissions.length >= CONFIG.rateLimitMax) {
    return false;
  }

  // Add new entry
  ipSubmissions.push(now);
  rateLimitCache.set(ip, ipSubmissions);

  return true;
}

/**
 * Log submission to Vercel Blob Storage
 */
async function logSubmission(formData, ip) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ip: ip,
      data: formData
    };

    // Create a unique filename with timestamp
    const filename = `submissions/submission_${Date.now()}.json`;

    await put(filename, JSON.stringify(logEntry, null, 2), {
      access: 'public',
      contentType: 'application/json',
    });

    console.log('Submission logged to Vercel Blob:', filename);
    return true;
  } catch (error) {
    console.error('Failed to log submission:', error);
    return false;
  }
}

/**
 * Send email notification using Nodemailer
 */
async function sendEmail(formData) {
  const transporter = nodemailer.createTransport({
    host: CONFIG.smtpHost,
    port: CONFIG.smtpPort,
    secure: false, // STARTTLS
    auth: {
      user: CONFIG.smtpUser,
      pass: CONFIG.smtpPass,
    },
  });

  const emailBody = `
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
                <span class='value'>${formData.type_projet.replace(/_/g, ' ')}</span>
            </div>

            <div class='field'>
                <span class='label'>Budget envisagé</span>
                <span class='value'><span class='badge'>${formData.budget.toUpperCase()}</span></span>
            </div>

            <div class='field'>
                <span class='label'>Emplacement disponible</span>
                <span class='value'>${formData.emplacement_disponible}</span>
            </div>

            ${formData.emplacement_disponible === 'oui' ? `
            <div class='field'>
                <span class='label'>Type d'emplacement</span>
                <span class='value'>${formData.type_emplacement || 'Non spécifié'}</span>
            </div>

            <div class='field'>
                <span class='label'>Ville / Département</span>
                <span class='value'>${formData.ville_emplacement || 'Non spécifié'}</span>
            </div>
            ` : ''}

            <div class='field'>
                <span class='label'>Timing du projet</span>
                <span class='value'>${formData.timing.replace(/_/g, ' ')}</span>
            </div>

            <div class='field'>
                <span class='label'>Surface disponible</span>
                <span class='value'>${formData.surface}</span>
            </div>

            <h2>👤 Coordonnées du Contact</h2>

            <div class='field'>
                <span class='label'>Nom complet</span>
                <span class='value'>${formData.prenom} ${formData.nom}</span>
            </div>

            <div class='field'>
                <span class='label'>📞 Téléphone</span>
                <span class='value'><strong>${formData.telephone}</strong></span>
            </div>

            <div class='field'>
                <span class='label'>📧 Email</span>
                <span class='value'><strong>${formData.email}</strong></span>
            </div>

            <div class='field'>
                <span class='label'>Newsletter opt-in</span>
                <span class='value'>${formData.newsletter_optin === 'yes' ? '✅ Oui' : '❌ Non'}</span>
            </div>
        </div>

        <div class='footer'>
            <p>Reçu le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        </div>
    </div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"${CONFIG.smtpFromName}" <${CONFIG.smtpFromEmail}>`,
      to: CONFIG.emailTo.join(', '),
      replyTo: `"${formData.prenom} ${formData.nom}" <${formData.email}>`,
      subject: 'Nouvelle demande de devis - Ma Petite Laverie',
      html: emailBody,
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

/**
 * Send Pushover notification
 */
async function sendPushoverNotification(formData) {
  if (!CONFIG.pushoverEnabled) {
    return true;
  }

  const message = `🎯 Nouvelle demande de devis\n\n` +
    `👤 ${formData.prenom} ${formData.nom}\n` +
    `📞 ${formData.telephone}\n` +
    `📧 ${formData.email}\n\n` +
    `📋 PROJET\n` +
    `• Type: ${formData.type_projet.replace(/_/g, ' ')}\n` +
    `• Budget: ${formData.budget.toUpperCase()}\n` +
    `• Timing: ${formData.timing.replace(/_/g, ' ')}\n` +
    `• Surface: ${formData.surface}\n\n` +
    `📍 EMPLACEMENT\n` +
    `• Disponible: ${formData.emplacement_disponible}\n` +
    (formData.emplacement_disponible === 'oui' ?
      `• Type: ${formData.type_emplacement || 'Non spécifié'}\n` +
      `• Ville: ${formData.ville_emplacement || 'Non spécifié'}\n` : '') +
    `\n📰 Newsletter: ${formData.newsletter_optin === 'yes' ? '✅ Oui' : '❌ Non'}`;

  const payload = new URLSearchParams({
    token: CONFIG.pushoverToken,
    user: CONFIG.pushoverUser,
    message: message,
    title: 'Ma Petite Laverie - Lead',
    priority: '1',
    sound: 'pushover',
    url: `mailto:${formData.email}`,
    url_title: 'Répondre par email'
  });

  try {
    const response = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString(),
    });

    return response.ok;
  } catch (error) {
    console.error('Pushover notification failed:', error);
    return false;
  }
}

/**
 * Send confirmation email to user
 */
async function sendConfirmationEmail(formData) {
  const transporter = nodemailer.createTransport({
    host: CONFIG.smtpHost,
    port: CONFIG.smtpPort,
    secure: false,
    auth: {
      user: CONFIG.smtpUser,
      pass: CONFIG.smtpPass,
    },
  });

  const confirmationBody = `
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
            <p>Bonjour ${formData.prenom},</p>

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
</html>`;

  try {
    await transporter.sendMail({
      from: `"${CONFIG.smtpFromName}" <${CONFIG.smtpFromEmail}>`,
      to: `"${formData.prenom} ${formData.nom}" <${formData.email}>`,
      subject: 'Demande de devis bien reçue - Ma Petite Laverie',
      html: confirmationBody,
    });
    return true;
  } catch (error) {
    console.error('Confirmation email failed:', error);
    return false;
  }
}

/**
 * Main handler function
 */
export default async function handler(req, res) {
  // Security headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Check if request is AJAX
  if (!req.headers['x-requested-with'] || req.headers['x-requested-with'].toLowerCase() !== 'xmlhttprequest') {
    return res.status(400).json({ success: false, error: 'Invalid request' });
  }

  try {
    // Get client IP (handle Vercel proxy)
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] ||
                     req.headers['x-real-ip'] ||
                     req.socket.remoteAddress ||
                     'unknown';

    // Check rate limiting
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        success: false,
        error: 'Trop de demandes. Veuillez réessayer plus tard.'
      });
    }

    // Validate CSRF token
    const csrfToken = req.body.csrf_token || '';
    if (!validateCSRFToken(csrfToken)) {
      return res.status(400).json({
        success: false,
        error: 'Token de sécurité invalide'
      });
    }

    // Sanitize input data
    const formData = {
      type_projet: sanitizeInput(req.body.type_projet || ''),
      budget: sanitizeInput(req.body.budget || ''),
      emplacement_disponible: sanitizeInput(req.body.emplacement_disponible || ''),
      type_emplacement: sanitizeInput(req.body.type_emplacement || ''),
      ville_emplacement: sanitizeInput(req.body.ville_emplacement || ''),
      timing: sanitizeInput(req.body.timing || ''),
      surface: sanitizeInput(req.body.surface || ''),
      prenom: sanitizeInput(req.body.prenom || ''),
      nom: sanitizeInput(req.body.nom || ''),
      telephone: sanitizeInput(req.body.telephone || ''),
      email: sanitizeInput(req.body.email || ''),
      newsletter_optin: req.body.newsletter_optin ? 'yes' : 'no',
      rgpd_consent: req.body.rgpd_consent ? 'yes' : 'no'
    };

    // Validate required fields
    const requiredFields = ['type_projet', 'budget', 'emplacement_disponible', 'timing', 'surface', 'prenom', 'nom', 'telephone', 'email'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        return res.status(400).json({
          success: false,
          error: `Champ requis manquant: ${field}`
        });
      }
    }

    // Validate email
    if (!validateEmail(formData.email)) {
      return res.status(400).json({
        success: false,
        error: 'Email invalide'
      });
    }

    // Validate phone
    if (!validatePhone(formData.telephone)) {
      return res.status(400).json({
        success: false,
        error: 'Numéro de téléphone invalide'
      });
    }

    // Validate RGPD consent
    if (formData.rgpd_consent !== 'yes') {
      return res.status(400).json({
        success: false,
        error: 'Consentement RGPD requis'
      });
    }

    // Log submission
    await logSubmission(formData, clientIP);

    // Send notification email
    const emailSent = await sendEmail(formData);
    if (!emailSent) {
      console.error('Failed to send email notification');
    }

    // Send Pushover notification
    const pushoverSent = await sendPushoverNotification(formData);
    if (!pushoverSent) {
      console.error('Failed to send Pushover notification');
    }

    // Send confirmation email to user
    const confirmationSent = await sendConfirmationEmail(formData);
    if (!confirmationSent) {
      console.error('Failed to send confirmation email to user');
    }

    // Success response
    return res.status(200).json({
      success: true,
      data: {
        message: 'Demande envoyée avec succès',
        email_sent: emailSent,
        confirmation_sent: confirmationSent
      }
    });

  } catch (error) {
    console.error('Form submission error:', error);
    return res.status(500).json({
      success: false,
      error: 'Une erreur est survenue. Veuillez réessayer.'
    });
  }
}
