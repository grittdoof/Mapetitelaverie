# Guide de déploiement sur Vercel - Ma Petite Laverie

## 📋 Prérequis

- Compte Vercel (gratuit) : [vercel.com/signup](https://vercel.com/signup)
- Vercel CLI installé (optionnel mais recommandé)
- Vos clés API Brevo SMTP et Pushover

---

## 🚀 Méthode 1 : Déploiement via l'interface Vercel (Recommandé)

### Étape 1 : Préparer le repository Git

Si ce n'est pas déjà fait, initialisez un repo Git :

```bash
cd /Users/aureliengiorgino/app/public/petitelaverie
git init
git add .
git commit -m "Migration vers Vercel - Conversion PHP vers Node.js"
```

Poussez ensuite vers GitHub/GitLab/Bitbucket.

### Étape 2 : Importer le projet sur Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Add New..."** → **"Project"**
3. Sélectionnez votre repository Git
4. Vercel détectera automatiquement le projet Node.js

### Étape 3 : Configurer les variables d'environnement

Dans **Project Settings** → **Environment Variables**, ajoutez :

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `SMTP_HOST` | `smtp-relay.brevo.com` | Production, Preview, Development |
| `SMTP_PORT` | `587` | Production, Preview, Development |
| `SMTP_USER` | Votre identifiant SMTP Brevo | Production, Preview, Development |
| `SMTP_PASS` | Votre clé API Brevo | Production, Preview, Development |
| `FROM_EMAIL` | `noreply@mapetitelaverie.fr` | Production, Preview, Development |
| `EMAIL_TO` | `agiorgino@vpstrat.com` | Production, Preview, Development |
| `PUSHOVER_TOKEN` | Votre token Pushover | Production, Preview, Development |
| `PUSHOVER_USER` | Votre user key Pushover | Production, Preview, Development |
| `RATE_LIMIT_MAX` | `3` | Production, Preview, Development |
| `RATE_LIMIT_PERIOD` | `3600` | Production, Preview, Development |

**Important :** Obtenez vos clés :
- Brevo SMTP : [app.brevo.com/settings/keys/smtp](https://app.brevo.com/settings/keys/smtp)
- Pushover : [pushover.net](https://pushover.net/)

### Étape 4 : Configurer le stockage Vercel Blob

Pour le logging des soumissions :

1. Dans votre projet Vercel, allez dans **Storage**
2. Cliquez sur **Create Database** → **Blob**
3. Nommez-le `submissions`
4. Les variables `BLOB_READ_WRITE_TOKEN` seront automatiquement ajoutées

### Étape 5 : Déployer

Cliquez sur **"Deploy"** - Vercel va :
1. Installer les dépendances (`npm install`)
2. Builder le projet
3. Déployer sur le CDN global
4. Vous fournir une URL de preview

---

## 🚀 Méthode 2 : Déploiement via CLI (Alternative)

### Installation Vercel CLI

```bash
npm install -g vercel
```

### Login

```bash
vercel login
```

### Déploiement initial

```bash
cd /Users/aureliengiorgino/app/public/petitelaverie
vercel
```

Suivez les prompts :
- **Set up and deploy?** → Yes
- **Which scope?** → Votre compte
- **Link to existing project?** → No
- **What's your project's name?** → `ma-petite-laverie`
- **In which directory is your code located?** → `./`

### Ajouter les variables d'environnement

```bash
vercel env add SMTP_HOST
# Entrer la valeur : smtp-relay.brevo.com
# Sélectionner : Production, Preview, Development

vercel env add SMTP_PORT
# Entrer : 587

vercel env add SMTP_USER
# Entrer votre identifiant SMTP Brevo

vercel env add SMTP_PASS
# Entrer votre clé API Brevo

vercel env add FROM_EMAIL
# Entrer : noreply@mapetitelaverie.fr

vercel env add EMAIL_TO
# Entrer : agiorgino@vpstrat.com

vercel env add PUSHOVER_TOKEN
# Entrer votre token Pushover

vercel env add PUSHOVER_USER
# Entrer votre user key Pushover

vercel env add RATE_LIMIT_MAX
# Entrer : 3

vercel env add RATE_LIMIT_PERIOD
# Entrer : 3600
```

### Déploiement en production

```bash
vercel --prod
```

---

## 🔧 Configuration du domaine personnalisé

### Sur Vercel

1. Allez dans **Settings** → **Domains**
2. Cliquez sur **Add**
3. Entrez votre domaine : `mapetitelaverie.fr`

### Configuration DNS

Chez votre registrar (OVH, Gandi, etc.), ajoutez :

**Option A - CNAME (sous-domaine)** :
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Option B - A Record (domaine racine)** :
```
Type: A
Name: @
Value: 76.76.21.21
```

---

## ✅ Tests post-déploiement

### Test 1 : Vérifier l'URL

Accédez à votre URL Vercel : `https://ma-petite-laverie.vercel.app`

Le site doit se charger normalement.

### Test 2 : Tester le formulaire

1. Remplissez le formulaire en 6 étapes
2. Soumettez
3. Vérifiez :
   - ✅ Message de succès affiché
   - ✅ Email reçu sur `EMAIL_TO`
   - ✅ Email de confirmation reçu
   - ✅ Notification Pushover reçue

### Test 3 : Vérifier les logs Vercel

Dans **Deployment** → **Functions** :
- Cliquez sur `/api/submit-form`
- Vérifiez les logs de la fonction

### Test 4 : Vérifier le stockage Blob

Dans **Storage** → **Blob** :
- Vérifiez que les soumissions sont enregistrées dans `submissions/`

### Test 5 : Tester le rate limiting

Soumettez le formulaire 4 fois rapidement :
- Les 3 premières doivent passer
- La 4ème doit être bloquée avec erreur 429

---

## 📊 Monitoring et analytics

### Vercel Analytics

Activez Vercel Analytics (gratuit) :
1. **Analytics** → **Enable**
2. Suivez les performances en temps réel

### Logs des erreurs

Consultez les logs :
```bash
vercel logs ma-petite-laverie --prod
```

Ou dans l'interface : **Deployment** → **Runtime Logs**

---

## 🔄 Mises à jour continues

### Déploiement automatique

Chaque `git push` vers votre branche principale déclenchera automatiquement :
1. Un build Vercel
2. Des tests
3. Un déploiement en production

### Preview deployments

Chaque Pull Request aura son URL de preview unique :
- `https://ma-petite-laverie-git-branch-name.vercel.app`

---

## 🛠️ Développement local

### Tester localement avec Vercel Dev

```bash
vercel dev
```

Cela simule l'environnement Vercel en local sur `http://localhost:3000`

### Variables d'environnement locales

Créez un fichier `.env.local` (déjà dans `.gitignore`) :

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=votre_user
SMTP_PASS=votre_pass
FROM_EMAIL=noreply@mapetitelaverie.fr
EMAIL_TO=agiorgino@vpstrat.com
PUSHOVER_TOKEN=votre_token
PUSHOVER_USER=votre_user_key
RATE_LIMIT_MAX=3
RATE_LIMIT_PERIOD=3600
```

---

## 📦 Limites du plan gratuit Vercel (Hobby)

| Ressource | Limite |
|-----------|--------|
| Bandwidth | 100 GB/mois |
| Function invocations | 6000/jour |
| Function duration | 10 secondes max |
| Build time | 45 minutes |
| Storage (Blob) | 1 GB |

**Pour votre usage** (landing page + formulaire) : largement suffisant ✅

---

## ❓ Troubleshooting

### Erreur 500 sur `/api/submit-form`

1. Vérifiez les logs Vercel
2. Vérifiez que toutes les variables d'environnement sont définies
3. Testez localement avec `vercel dev`

### Emails non reçus

1. Vérifiez les credentials SMTP Brevo
2. Consultez les logs Vercel pour voir les erreurs Nodemailer
3. Vérifiez que `EMAIL_TO` est correct

### Rate limiting trop strict

Augmentez `RATE_LIMIT_MAX` ou `RATE_LIMIT_PERIOD` dans les variables d'environnement.

---

## 📞 Support

- Documentation Vercel : [vercel.com/docs](https://vercel.com/docs)
- Support Vercel : [vercel.com/support](https://vercel.com/support)
- Brevo SMTP : [help.brevo.com](https://help.brevo.com)

---

## ✨ Migration terminée !

Votre projet est maintenant :
- ✅ Serverless (Vercel Functions)
- ✅ CDN global (Edge Network)
- ✅ SSL automatique
- ✅ Déploiements automatiques via Git
- ✅ Preview URLs pour chaque PR
- ✅ Scalable automatiquement

**Bon lancement ! 🚀**
