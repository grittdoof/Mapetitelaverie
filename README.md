# 📘 Landing Page Ma Petite Laverie - Guide Complet

Landing page de conversion optimisée pour campagnes Google Ads avec formulaire multi-étapes, tracking avancé et sécurité renforcée.

## 📋 Table des matières

1. [Fonctionnalités](#fonctionnalités)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Personnalisation](#personnalisation)
5. [Sécurité](#sécurité)
6. [Analytics & Tracking](#analytics--tracking)
7. [Maintenance](#maintenance)
8. [FAQ](#faq)

---

## 🎯 Fonctionnalités

### Page principale
- ✅ **Hero Section** impactant avec 3 CTA stratégiques
- ✅ **Section Problème/Solution** avec comparaison visuelle
- ✅ **Présentation de l'offre** (Kiosques, Bungalows, Locaux)
- ✅ **Galerie photos** + vidéo YouTube intégrée
- ✅ **Témoignages clients** avec système d'étoiles
- ✅ **Formulaire multi-étapes** avec barre de progression
- ✅ **Design responsive** mobile-first
- ✅ **Animations** Framer Motion / Tailwind CSS

### Formulaire intelligent
- ✅ **6 étapes de qualification** progressive
- ✅ **Barre de progression** animée (0 à 100%)
- ✅ **Validation en temps réel** avec messages d'erreur
- ✅ **Double opt-in** pour newsletter
- ✅ **Conformité RGPD complète**
- ✅ **Protection CSRF** et XSS
- ✅ **Rate limiting** (anti-spam)

### Backend & Notifications
- ✅ **Envoi d'emails** (notification admin + confirmation client)
- ✅ **Notifications Pushover** mobile
- ✅ **Logging** des soumissions (JSON)
- ✅ **Validation stricte** des données

### Analytics & SEO
- ✅ **Google Analytics** (GA4) intégré
- ✅ **Tracking d'événements** personnalisés
- ✅ **Conversion Google Ads** tracking
- ✅ **Meta tags** Open Graph + Twitter Cards
- ✅ **Schema.org** pour Google
- ✅ **Bannière cookies RGPD**

---

## 🚀 Installation

### Prérequis

- Serveur web (Apache/Nginx)
- PHP 7.4+ avec extension `mail` activée
- Accès FTP ou SSH
- Nom de domaine configuré

### Étape 1 : Upload des fichiers

```bash
# Structure des fichiers
petitelaverie/
├── index.html              # Page principale
├── submit-form.php         # Backend formulaire
├── images/                 # Dossier images
├── logs/                   # Dossier logs (créé auto)
└── README.md               # Ce fichier
```

**Via FTP :**
1. Connectez-vous à votre serveur FTP
2. Uploadez tous les fichiers dans le dossier `public_html/` ou `www/`
3. Assurez-vous que le dossier est accessible via votre domaine

**Via SSH :**
```bash
cd /var/www/html
git clone <votre-repo>
chmod 755 submit-form.php
chmod 777 logs/  # Permissions d'écriture
```

### Étape 2 : Vérification

1. Accédez à `https://votre-domaine.fr/`
2. Vérifiez que la page s'affiche correctement
3. Testez le formulaire (mode test)

---

## ⚙️ Configuration

### 1. Configuration Email (submit-form.php)

Ouvrez `submit-form.php` et modifiez la section `$CONFIG` :

```php
$CONFIG = [
    // Email settings
    'email_to' => 'direction@mapetitelaverie.fr',  // ← VOTRE EMAIL ICI
    'email_from' => 'noreply@mapetitelaverie.fr',
    'email_subject' => 'Nouvelle demande de devis - Ma Petite Laverie',

    // ... rest of config
];
```

**⚠️ Important :** Assurez-vous que votre serveur peut envoyer des emails. Testez avec :
```php
<?php
mail('votre@email.fr', 'Test', 'Email de test');
?>
```

### 2. Configuration Pushover (Notifications Mobile)

**Étape A : Créer un compte Pushover**
1. Allez sur [pushover.net](https://pushover.net)
2. Créez un compte (7 jours gratuit, puis 5$ unique)
3. Installez l'app mobile (iOS/Android)

**Étape B : Obtenir les clés**
1. Connectez-vous à Pushover
2. Créez une application (nom: "Ma Petite Laverie Leads")
3. Notez :
   - **App Token** : `azGDORePK8gMaC0QOYAMyEEuzJnyUi` (exemple)
   - **User Key** : `uQiRzpo4DXghDmr9QzzfQu27cmVRsG` (exemple)

**Étape C : Configuration**
```php
'pushover_enabled' => true,  // Activé
'pushover_token' => 'VOTRE_APP_TOKEN_ICI',
'pushover_user' => 'VOTRE_USER_KEY_ICI',
```

Pour **désactiver** Pushover :
```php
'pushover_enabled' => false,
```

### 3. Configuration Google Analytics

**Dans `index.html`, ligne 68-73**, remplacez `GA_MEASUREMENT_ID` :

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');  // ← REMPLACEZ ICI
</script>
```

**Où trouver votre ID Google Analytics ?**
1. Connectez-vous à [analytics.google.com](https://analytics.google.com)
2. Allez dans **Admin** > **Flux de données**
3. Sélectionnez votre flux Web
4. Copiez l'**ID de mesure** (format: `G-XXXXXXXXXX`)

### 4. Configuration Google Ads Conversion

**Dans `index.html`, ligne 684**, remplacez les IDs de conversion :

```javascript
trackEvent('conversion', {
    'send_to': 'AW-1234567890/AbC-D_efG-h12_34-567'  // ← REMPLACEZ
});
```

**Où trouver votre ID de conversion ?**
1. Google Ads > **Outils** > **Conversions**
2. Créez une conversion "Envoi de formulaire"
3. Copiez le **Tag** fourni (format: `AW-XXXXXXX/XXXXXXXXXXXXX`)

### 5. Permissions des dossiers

```bash
# Dossier logs doit être accessible en écriture
chmod 755 submit-form.php
chmod 777 logs/
chmod 666 logs/*.json  # Si fichiers déjà créés
```

---

## 🎨 Personnalisation

### 1. Couleurs du Site

**Dans `index.html`, ligne 79-87** (Tailwind config) :

```javascript
theme: {
    extend: {
        colors: {
            primary: '#0b5ed7',     // Bleu principal
            secondary: '#0a4fb8',   // Bleu foncé
            accent: '#FFD100',      // Jaune/Or
        }
    }
}
```

Changez les couleurs en modifiant les codes hexadécimaux.

### 2. Logo et Images

**Remplacer le logo :**
1. Placez votre logo dans `images/ma-petite-laverie-logo.png`
2. Dimensions recommandées : 200x200px (format PNG transparent)

**Remplacer les images :**
- Toutes les images sont dans le dossier `images/`
- Nommez vos nouvelles images de la même manière
- Optimisez-les avec [TinyPNG](https://tinypng.com) avant upload

### 3. Textes de la Page

Tous les textes sont modifiables directement dans `index.html`.

**Exemple : Modifier le titre Hero**
```html
<!-- Ligne ~180 -->
<h1 class="text-4xl md:text-6xl font-bold mb-6">
    Votre Kiosque Laverie<br>
    <span class="text-accent">Clé en Main</span>
</h1>
```

**Astuce :** Utilisez la recherche (Ctrl+F) pour trouver rapidement un texte.

### 4. Vidéo YouTube

**Ligne ~544**, remplacez l'ID de la vidéo :

```html
<iframe
    src="https://www.youtube.com/embed/H-EOXklBXtA"
    <!-- Remplacez H-EOXklBXtA par votre ID vidéo -->
```

**Comment obtenir l'ID YouTube ?**
- URL : `https://www.youtube.com/watch?v=**H-EOXklBXtA**`
- L'ID est la partie après `v=`

### 5. Formulaire - Ajouter/Modifier des Questions

**Structure d'une étape :**
```html
<div class="form-step" data-step="X">
    <h3>Titre de l'étape</h3>
    <div class="space-y-4">
        <!-- Vos champs ici -->
    </div>
    <div class="mt-8 flex justify-between">
        <button onclick="prevStep()">← Retour</button>
        <button onclick="nextStep()">Continuer →</button>
    </div>
</div>
```

**N'oubliez pas :**
1. Incrémenter `totalSteps` dans le JavaScript (ligne ~849)
2. Mettre à jour `submit-form.php` pour traiter les nouveaux champs

---

## 🔒 Sécurité

### Protection Implémentée

1. **CSRF Protection** : Token unique par session
2. **XSS Protection** : Sanitisation de toutes les entrées
3. **Rate Limiting** : Max 3 soumissions/heure par IP
4. **Validation stricte** : Email, téléphone, champs requis
5. **Headers sécurité** : X-Frame-Options, X-XSS-Protection, etc.

### Logs de Sécurité

Les tentatives suspectes sont logguées dans :
```
logs/rate_limit.json   # Limite de taux
logs/submissions.json  # Toutes les soumissions
```

**Consulter les logs :**
```bash
tail -f logs/submissions.json
```

### Recommandations Supplémentaires

1. **HTTPS obligatoire** : Installez un certificat SSL (Let's Encrypt gratuit)
2. **Mots de passe forts** : Pour FTP, base de données, etc.
3. **Mises à jour** : Gardez PHP et serveur web à jour
4. **Sauvegarde** : Sauvegardez régulièrement `logs/` et fichiers

---

## 📊 Analytics & Tracking

### Événements Trackés Automatiquement

| Événement | Déclencheur | Paramètres |
|-----------|-------------|------------|
| `phone_click_header` | Clic téléphone header | - |
| `phone_click_hero` | Clic téléphone hero | - |
| `form_step_completed` | Fin d'une étape form | `step: 1-6` |
| `form_submission` | Envoi formulaire | `event_category: Lead` |
| `conversion` | Conversion Google Ads | `send_to: AW-XXX` |
| `cookie_consent` | Choix cookies | `action: accepted/refused` |

### Visualiser dans Google Analytics

1. **Temps réel** : Analytics > Temps réel > Événements
2. **Rapports** : Analytics > Engagement > Événements
3. **Conversions** : Analytics > Engagement > Conversions

### Ajouter un Événement Personnalisé

```javascript
// Dans index.html
trackEvent('nom_evenement', {
    event_category: 'Categorie',
    event_label: 'Label',
    value: 123
});
```

**Exemple : Tracker un clic sur un bouton**
```html
<button onclick="trackEvent('cta_brochure_click'); window.location='#formulaire'">
    Télécharger la brochure
</button>
```

---

## 🛠 Maintenance

### Vérifications Régulières

**Hebdomadaire :**
- [ ] Vérifier que les emails arrivent bien
- [ ] Consulter `logs/submissions.json` pour nouveaux leads
- [ ] Tester le formulaire (soumission test)

**Mensuel :**
- [ ] Nettoyer `logs/rate_limit.json` (fichiers > 30 jours)
- [ ] Sauvegarder `logs/submissions.json`
- [ ] Vérifier Analytics (taux de conversion)

**Trimestriel :**
- [ ] Mettre à jour PHP si nécessaire
- [ ] Vérifier certificat SSL (renouvellement auto)
- [ ] Optimiser images si nouvelles ajoutées

### Commandes Utiles

**Nettoyer les logs anciens :**
```bash
# Logs > 30 jours
find logs/ -name "*.json" -mtime +30 -delete
```

**Sauvegarder les soumissions :**
```bash
cp logs/submissions.json backups/submissions_$(date +%Y%m%d).json
```

**Vérifier les erreurs PHP :**
```bash
tail -f /var/log/apache2/error.log  # Apache
tail -f /var/log/nginx/error.log    # Nginx
```

### Résolution de Problèmes

**❌ Les emails n'arrivent pas**
1. Vérifiez que PHP `mail()` fonctionne
2. Consultez les logs serveur
3. Vérifiez le dossier spam
4. Essayez avec un email différent
5. Envisagez d'utiliser un service SMTP (ex: SendGrid)

**❌ Formulaire ne s'envoie pas**
1. Ouvrez la console navigateur (F12)
2. Vérifiez les erreurs JavaScript
3. Testez `submit-form.php` directement
4. Vérifiez les permissions du dossier `logs/`

**❌ Pushover ne fonctionne pas**
1. Vérifiez les clés API (token + user key)
2. Testez avec l'API Pushover directement
3. Consultez `error_log` PHP
4. Désactivez temporairement : `pushover_enabled => false`

**❌ Google Analytics ne track pas**
1. Vérifiez que l'ID mesure est correct (`G-XXXXXXXXXX`)
2. Attendez 24-48h pour les premières données
3. Utilisez le mode "Temps réel" pour test immédiat
4. Désactivez les bloqueurs de pub pour tester

---

## 📖 FAQ

### Questions Fréquentes

**Q : Puis-je utiliser cette landing page sur plusieurs domaines ?**
R : Oui, mais configurez séparément Analytics et emails pour chaque instance.

**Q : Le formulaire fonctionne-t-il sans PHP ?**
R : Non, le backend nécessite PHP. Alternative : utiliser un service comme Formspree.

**Q : Comment ajouter une langue (multilingue) ?**
R : Dupliquez `index.html` en `index-en.html` et traduisez le contenu. Ajoutez un sélecteur de langue.

**Q : Puis-je intégrer un CRM (HubSpot, Salesforce) ?**
R : Oui, modifiez `submit-form.php` pour envoyer les données via API CRM.

**Q : Le site est-il conforme WCAG (accessibilité) ?**
R : Partiellement (AA). Pour conformité complète, ajoutez `aria-label` et testez avec un lecteur d'écran.

**Q : Puis-je personnaliser les animations ?**
R : Oui, modifiez les classes CSS `fade-in-up`, `fade-in` ou ajoutez-en de nouvelles.

**Q : Comment limiter les soumissions à 1 par personne ?**
R : Ajoutez une vérification par email/téléphone dans `submit-form.php` (stockage BDD recommandé).

---

## 🎯 Optimisations Recommandées

### Performance

1. **Minifier CSS/JS** avec [UglifyJS](https://www.npmjs.com/package/uglify-js)
2. **Compresser images** avec TinyPNG ou ImageOptim
3. **Activer la compression** Gzip/Brotli sur serveur
4. **CDN** : Utiliser Cloudflare pour servir les assets

### Conversion

1. **A/B Testing** : Tester différentes versions du hero
2. **Heatmaps** : Utiliser Hotjar pour voir où les users cliquent
3. **Exit Intent** : Popup avant fermeture de l'onglet
4. **Chat** : Ajouter un widget de chat (Intercom, Drift)

### SEO

1. **Sitemap XML** : Créer et soumettre à Google
2. **Robots.txt** : Configurer pour un meilleur crawl
3. **Blog** : Ajouter une section blog pour contenu
4. **Backlinks** : Stratégie de liens entrants

---

## 📞 Support

Pour toute question ou problème :

- **Email** : support@mapetitelaverie.fr
- **Téléphone** : 02 40 31 66 00
- **Documentation** : Ce fichier README

---

## 📄 Licence

© 2025 Ma Petite Laverie - Tous droits réservés.

Cette landing page est propriété exclusive de Ma Petite Laverie.
Toute reproduction ou redistribution sans autorisation est interdite.

---

**Version** : 1.0.0
**Dernière mise à jour** : 12 février 2025
**Auteur** : Développé avec Claude Sonnet 4.5
