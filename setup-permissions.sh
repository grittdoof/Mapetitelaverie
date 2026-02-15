#!/bin/bash
# Script de configuration des permissions - Ma Petite Laverie

echo "🔧 Configuration des permissions..."

# Fichiers PHP exécutables
chmod 755 submit-form.php
echo "✅ submit-form.php : 755"

# Fichiers HTML lisibles
chmod 644 index.html mentions-legales.html
echo "✅ Fichiers HTML : 644"

# Dossier logs avec permissions d'écriture
mkdir -p logs
chmod 777 logs
echo "✅ Dossier logs/ : 777"

# Dossier images
chmod 755 images
chmod 644 images/*
echo "✅ Dossier images/ et contenu : 755/644"

# .htaccess
chmod 644 .htaccess
echo "✅ .htaccess : 644"

# Fichiers de documentation
chmod 644 README.md QUICK-START.md PROJET-RECAP.md .gitignore
echo "✅ Fichiers documentation : 644"

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "📋 Vérification :"
ls -lh | head -20

