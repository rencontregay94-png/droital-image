# 📋 Gestionnaire d'Autorisation Droit à l'Image — NDM Saint-Pierre

Application web complète de gestion des autorisations relatives au droit à l'image des élèves pour l'**Ensemble Scolaire Notre Dame des Missions Saint Pierre**.

Elle permet aux familles de remplir le formulaire officiel en ligne, de générer instantanément l'exemplaire PDF A4 réglementaire prêt pour signature manuscrite, et met à la disposition de l'équipe de direction un tableau de bord complet avec gestion des classes, suivi des retours, personnalisation des consignes de remise et export Excel/CSV.

---

## 🌟 Fonctionnalités Principales

- 👨‍👩‍👧 **Portail Familles sans inscription préalable** :
  - Saisie simplifiée : civilité et nom du représentant légal, élève, choix de la classe parmi les divisions réelles.
  - Choix clairs et conformes RGPD : *Publication interne seule*, *Publication interne + internet*, ou *Refus*.
  - Rappel automatique et dynamique de la consigne de remise (destinataire et date limite).
- 📄 **Génération PDF A4 Officiel Ultra-Fidèle** :
  - Respect scrupuleux de la mise en page administrative de l'établissement (en-têtes, textes juridiques officiels, cadres de signature parents et direction).
  - Téléchargement direct ou impression immédiate.
- 🔒 **Espace d'Administration Sécurisé** :
  - Authentification avec mot de passe haché et salé en SHA-256 + token de session.
  - Suivi en temps réel des formulaires : statuts (*À imprimer*, *À récupérer*, *Signé & reçu*, *Problème signalé*).
  - Statistiques complètes par classe et par type d'autorisation.
  - Export instantané au format Excel / CSV des retours.
  - **Gestion dynamique des classes** : ajout et suppression de classes en un clic sans redémarrer le serveur.
  - **Paramètres de remise modifiables** : saisie du destinataire (*ex: Mikael JOUBIN (Adjoint de direction)*) et sélecteur de date d'échéance.
  - **Gestion du Logo & Signature** : téléversement sécurisé réservé à l'administrateur avec prévisualisation en temps réel.
- 💾 **Stockage autonome & Léger** :
  - Base de données JSON locale (`data/db.json`) sans dépendance complexe à un SGBD lourd, facilitant les sauvegardes simples par copie de fichier.

---

## 💻 Prérequis Système

Pour héberger et exécuter l'application sur votre serveur (Linux / Debian / Ubuntu / Conteneur Proxmox LXC, Raspberry Pi, Windows ou macOS) :

- **Node.js** : Version `20 LTS` ou `22 LTS` recommandée (minimum `18.0.0`)
- **npm** : Version `9+` ou `10+` (inclus avec Node.js)
- **Git** : pour cloner et mettre à jour le projet
- **Mémoire RAM** : 512 Mo minimum (1 Go recommandé pour le build)
- **Disque** : ~250 Mo d'espace libre

---

## 🚀 Guide d'Installation Rapide (Mode Développement / Test Local)

Pour tester immédiatement l'application sur votre machine ou en local :

```bash
# 1. Cloner le dépôt ou copier le dossier du projet
git clone <URL_DU_DEPOT> ndm-droit-image
cd ndm-droit-image

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev
```

L'application est immédiatement accessible sur votre navigateur à l'adresse :  
👉 **http://localhost:3000**

---

## 🏢 Guide d'Installation Pas à Pas en Production (Serveur / VPS / Debian / Ubuntu / Proxmox LXC)

Ce guide détaille la mise en service industrielle sur un serveur Linux (Debian 11/12 ou Ubuntu 22.04/24.04 LTS).

### Étape 1 : Mettre à jour le système et installer Node.js 20 LTS

Connectez-vous en SSH à votre serveur :

```bash
# Mettre à jour les paquets système
sudo apt update && sudo apt upgrade -y

# Installer les outils de base
sudo apt install -y curl git build-essential ufw nginx

# Installer Node.js 20 LTS via le dépôt officiel NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier les versions
node -v   # Doit afficher v20.x.x
npm -v    # Doit afficher 10.x.x
```

---

### Étape 2 : Déployer le code de l'application

Créez un utilisateur système dédié ou installez l'application dans `/var/www` :

```bash
# Créer le répertoire de l'application
sudo mkdir -p /var/www/ndm-droit-image
sudo chown -R $USER:$USER /var/www/ndm-droit-image

# Naviguer dans le dossier
cd /var/www/ndm-droit-image

# Cloner votre code ou décompresser l'archive du projet
git clone <URL_DU_DEPOT> .

# Installer les dépendances
npm install
```

---

### Étape 3 : Compiler l'application pour la production

Le script de compilation génère à la fois le bundle frontend optimisé dans `dist/` et le serveur backend Node.js autonome dans `dist/server.cjs` :

```bash
npm run build
```

Vous devez voir le message de confirmation confirmant la création de `dist/` et `dist/server.cjs`.

---

### Étape 4 : Configurer le gestionnaire de processus PM2 (Démarrage automatique)

**PM2** permet de maintenir l'application en fonctionnement continu, de la redémarrer automatiquement en cas de plantage et de la relancer automatiquement au redémarrage du serveur.

```bash
# Installer PM2 globalement
sudo npm install -g pm2

# Démarrer l'application avec PM2
pm2 start "npm start" --name "ndm-droit-image"

# Vérifier que le processus tourne correctement
pm2 status

# Sauvegarder la liste des processus actifs
pm2 save

# Configurer le démarrage automatique au boot du serveur
pm2 startup
# (Copiez-collez la commande sudo fournie par le terminal si demandée)
```

Commandes utiles avec PM2 :
- Consulter les logs en direct : `pm2 logs ndm-droit-image`
- Redémarrer l'application : `pm2 restart ndm-droit-image`
- Arrêter l'application : `pm2 stop ndm-droit-image`

---

### Étape 5 : Configurer Nginx en Reverse-Proxy (Ports 80 et 443 HTTPS)

Nginx va intercepter les requêtes sur les ports 80/443 et les rediriger en toute sécurité vers l'application Node.js qui tourne sur le port `3000`.

Créez le fichier de configuration Nginx :

```bash
sudo nano /etc/nginx/sites-available/ndm-droit-image
```

Collez la configuration suivante (remplacez `droit-image.ndm-stpierre.fr` par votre nom de domaine ou l'adresse IP de votre serveur) :

```nginx
server {
    listen 80;
    server_name droit-image.ndm-stpierre.fr;

    # Augmenter la taille maximale pour l'upload éventuel de signatures/logos HD
    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activez le site et redémarrez Nginx :

```bash
sudo ln -s /etc/nginx/sites-available/ndm-droit-image /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### Étape 6 : Activer le chiffrement HTTPS (SSL gratuit avec Certbot)

Pour sécuriser la transmission des données des familles :

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d droit-image.ndm-stpierre.fr
```

Suivez les instructions à l'écran. Certbot configurera automatiquement le renouvellement du certificat SSL.

---

## 🔑 Accès Administrateur & Identifiants

- **URL d'administration** : Cliquez sur le lien discret **« Accès Direction / Administration »** situé en haut à droite du portail ou dans le pied de page, ou accédez directement à la page.
- **Identifiant par défaut** : `admin`
- **Mot de passe par défaut** : `admin123`

*(Lors de la première connexion, il est conseillé de modifier les identifiants ou de restreindre l'accès à votre réseau interne).*

---

## 🛠️ Configuration & Personnalisation de l'Établissement

Toutes les configurations se font directement depuis l'interface d'administration sans toucher au code :

1. **Destinataire et Date limite de remise** :
   - Rendez-vous dans l'onglet **« Destinataire & Date »**.
   - Indiquez le nom de la personne responsable (*ex : Mikael JOUBIN (Adjoint de direction)*) et sélectionnez la date limite de remise au plus tard.
   - Les modifications s'appliquent immédiatement sur l'accueil, les avertissements et le PDF officiel A4.
2. **Gestion des Classes** :
   - Rendez-vous dans l'onglet **« Gestion des classes »**.
   - Saisissez le libellé de la nouvelle classe (*ex : 6ème D, ULIS, CP B...*) puis cliquez sur **« Créer la classe »**.
   - Les classes supprimées n'affectent pas les formulaires historiques déjà reçus.
3. **Logo et Signature Officielle** :
   - Rendez-vous dans l'onglet **« Logo & Signature »**.
   - Vous pouvez uploader un fichier PNG/JPEG pour remplacer le logo de l'en-tête ou la signature de direction.
   - Un bouton de restauration permet de revenir à tout moment aux images par défaut.

---

## 💾 Sauvegarde et Restauration des Données

Toutes les données de l'application (formulaires reçus, statut de signature, historique, classes personnalisées, dates et logos) sont conservées dans un unique fichier JSON :

```text
/var/www/ndm-droit-image/data/db.json
```

### Pour sauvegarder :
```bash
# Exemple de sauvegarde manuelle avec horodatage
cp /var/www/ndm-droit-image/data/db.json /var/backups/ndm_db_$(date +%F).json
```

### Automatisation de la sauvegarde quotidienne (Cron) :
Ajoutez une ligne dans votre crontab (`crontab -e`) pour archiver chaque nuit la base :
```cron
0 2 * * * cp /var/www/ndm-droit-image/data/db.json /var/backups/ndm_db_$(date +\%F).json
```

---

## 🔄 Procédure de Mise à Jour de l'Application

Lorsque vous recevez une mise à jour du code :

```bash
cd /var/www/ndm-droit-image

# 1. Sauvegarder la base de données par sécurité
cp data/db.json data/db.json.bak

# 2. Récupérer le nouveau code
git pull

# 3. Réinstaller les dépendances et recompiler
npm install
npm run build

# 4. Relancer le serveur avec PM2
pm2 restart ndm-droit-image
```

---

## ❓ Dépannage Fréquent

- **Le port 3000 est déjà utilisé** :
  Vérifiez les processus actifs avec `sudo lsof -i :3000` ou `netstat -tlpn | grep 3000` et arrêtez l'ancien processus avant de lancer PM2.
- **Erreur de compilation `npm run build`** :
  Vérifiez que vous disposez d'au moins 512 Mo de RAM libre. Sur un petit VPS ou conteneur LXC, vous pouvez activer un fichier d'échange (swap) temporaire : `sudo fallocate -l 1G /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`.
- **Accès aux logs en temps réel** :
  Exécutez `pm2 logs ndm-droit-image` pour observer les requêtes et les éventuelles erreurs serveur.
