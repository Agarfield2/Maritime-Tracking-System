# Projet Web3 - Système de Suivi Maritime

> **Note** : Ce projet nécessite une configuration serveur avec PHP 7.4+ et Python 3.9 pour fonctionner correctement.

[![Licence MIT](https://img.shields.io/badge/Licence-MIT-blue.svg)](LICENSE)
[![PHP 7.4+](https://img.shields.io/badge/PHP-7.4+-8892BF.svg)](https://php.net/)
[![Python 3.9+](https://img.shields.io/badge/Python-3.9+-3776AB.svg)](https://www.python.org/)

## Table des matières
1. [Description](#1-description)
2. [Prérequis](#2-prérequis)
   - [2.1. Serveur Web](#21-serveur-web)
   - [2.2. Python](#22-python)
3. [Installation](#3-installation)
   - [3.1. Installation sous Apache](#31-installation-sous-apache)
   - [3.2. Configuration de la base de données](#32-configuration-de-la-base-de-données)
   - [3.3. Configuration Python](#33-configuration-python)
4. [Accès administrateur](#4-accès-administrateur)
5. [Structure du projet complète](#5-structure-du-projet-complète)
6. [Fonctionnalités](#fonctionnalités)
   - [6.1. Pour les utilisateurs](#61-pour-les-utilisateurs)
   - [6.2. Pour les administrateurs](#62-pour-les-administrateurs)
   - [6.3. Fonctionnalités avancées](#63-fonctionnalités-avancées)
7. [Dépannage](#7-dépannage)
8. [Sécurité](#8-sécurité)
9. [Maintenance](#9-maintenance)
10. [Développement](#10-développement)
    - [10.1. Structure des dossiers](#101-structure-des-dossiers)
11. [Documentation de l'API](#11-documentation-de-lapi)
    - [11.1. Authentification](#111-authentification)
    - [11.2. Données des navires](#112-données-des-navires)
    - [11.3. Gestion des positions (CRUD)](#113-gestion-des-positions-crud)
    - [11.4. Prédictions et analyse](#114-prédictions-et-analyse)
    - [11.5. Authentification et autorisation](#115-authentification-et-autorisation)
12. [Dépannage avancé](#12-dépannage-avancé)
    - [12.1. Problèmes courants](#121-problèmes-courants)
    - [12.2. Logs](#122-logs)
13. [Aide et support](#13-aide-et-support)
    - [13.1. Support technique](#131-support-technique)
    - [13.2. Contribution](#132-contribution)
    - [13.3. Documentation complémentaire](#133-documentation-complémentaire)
    - [13.4. Équipe de développement](#134-équipe-de-développement)

## 1. Description
Ce projet est une application web de suivi maritime qui permet de visualiser et d'analyser les données AIS (Automatic Identification System) des navires. L'application inclut des fonctionnalités d'authentification, de visualisation de cartes, et d'analyse prédictive des routes maritimes.

## 2. Prérequis

### 2.1. Serveur Web
- WAMP (Windows) ou LAMP (Linux) avec PHP 7.4+
- MySQL 5.7+ ou MariaDB 10.3+
- Apache 2.4+

### 2.2. Python
- Python 3.9.X
- Bibliothèques Python (installer avec la commande ci-dessous) :
  ```
  # Installation des dépendances principales
  python3.9 -m pip install --upgrade --force-reinstall \
    "tensorflow>=2.8.0" \
    "numpy>=1.26.4" \
    "pandas>=2.2.2" \
    "scikit-learn>=1.0.0" \
    "joblib>=1.1.0" \
    "mysql-connector-python>=8.0.0" \
    "SQLAlchemy>=1.4.0"
  
  # Dépendances optionnelles pour des fonctionnalités avancées
  python3.9 -m pip install \
    "matplotlib" \
    "folium" \
    "flask" \
    "flask-cors" \
    "python-dotenv" \
    "pymysql" \
    "geopy" \
    "requests>=2.26.0"
  ```

  Ou en utilisant le fichier requirements.txt :
  ```
  python3.9 -m pip install -r documentation/requirements.txt
  ```

## 3. Installation

### 3.1. Installation sous Apache

#### Configuration d'Apache

1. **Activer les modules requis** :
   ```bash
   # Activer le module de réécriture
   sudo a2enmod rewrite
   
   # Activer les en-têtes pour CORS
   sudo a2enmod headers
   
   # Redémarrer Apache
   sudo systemctl restart apache2
   ```

2. **Configurer le Virtual Host** :
   Créez un fichier de configuration dans `/etc/apache2/sites-available/votre-site.conf` avec le contenu suivant :
   ```apache
   <VirtualHost *:80>
       ServerName votre-domaine.com
       ServerAdmin webmaster@localhost
       DocumentRoot /chemin/vers/dossiers
       
       <Directory /chemin/vers/dossiers>
           Options -Indexes +FollowSymLinks
           AllowOverride All
           Require all granted
           
           # Autoriser le .htaccess
           <IfModule mod_rewrite.c>
               RewriteEngine On
               RewriteBase /
               
               # Rediriger vers le frontend pour les routes inconnues
               RewriteCond %{REQUEST_FILENAME} !-f
               RewriteCond %{REQUEST_FILENAME} !-d
               RewriteRule ^(.*)$ /index.html [L]
           </IfModule>
           
           # En-têtes CORS pour l'API
           <FilesMatch "\.(php)$">
               Header set Access-Control-Allow-Origin "*"
               Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
               Header set Access-Control-Allow-Headers "Content-Type, Authorization"
           </FilesMatch>
       </Directory>
       
       # Journalisation
       ErrorLog ${APACHE_LOG_DIR}/projet_web3_error.log
       CustomLog ${APACHE_LOG_DIR}/projet_web3_access.log combined
   </VirtualHost>
   ```

3. **Activer le site et redémarrer Apache** :
   ```bash
   sudo a2ensite votre-site.conf
   sudo systemctl restart apache2
   ```

4. **Vérifier les permissions** :
   ```bash
   # Définir le propriétaire correct
   sudo chown -R www-data:www-data /chemin/vers/dossiers
   
   # Définir les permissions
   sudo find /chemin/vers/dossiers -type d -exec chmod 755 {} \;
   sudo find /chemin/vers/dossiers -type f -exec chmod 644 {} \;
   
   # Rendre les dossiers de log et upload écrivables
   sudo chmod -R 775 /chemin/vers/dossiers/logs
   sudo chmod -R 775 /chemin/vers/dossiers/uploads
   ```

5. **Configuration de PHP** :
   Assurez-vous que ces paramètres sont correctement définis dans votre `php.ini` :
   ```ini
   upload_max_filesize = 20M
   post_max_size = 20M
   memory_limit = 256M
   max_execution_time = 300
   date.timezone = Europe/Paris
   ```

6. **Activer le site** :
   ```bash
   sudo a2dissite 000-default.conf
   sudo a2ensite votre-site.conf
   sudo systemctl restart apache2
   ```

### 3.2. Configuration de la base de données

1. Créez une base de données MySQL nommée `marine_db`
2. Importez le fichier SQL initial en utilisant phpMyAdmin ou la ligne de commande :
   - **Méthode 1 (phpMyAdmin)** :
     1. Connectez-vous à phpMyAdmin (généralement à l'adresse http://localhost/phpmyadmin)
     2. Sélectionnez la base de données `marine_db`
     3. Allez dans l'onglet "Importer"
     4. Sélectionnez le fichier `assets/sql/AIS_TRINOME_5.sql`
     5. Cliquez sur "Exécuter"
   
   - **Méthode 2 (ligne de commande)** :
     ```
     mysql -u root -p marine_db < assets/sql/AIS_TRINOME_5.sql
     ```
3. Configurez les accès dans `api/db.php` :
   ```php
   $host = 'localhost';
   $db   = 'marine_db';
   $user = 'bateau';
   $pass = '123456mdp';
   ```

### 3.3. Configuration Python

#### Installation des dépendances Python
```bash
# Installation des dépendances requises
python3.9 -m pip install -r documentation/requirements.txt

# Installation spécifique de mysql-connector-python si nécessaire
python3.9 -m pip install mysql-connector-python>=8.0.0
```

#### Configuration des variables d'environnement
Le script utilise des variables d'environnement pour la connexion à la base de données. Créez un fichier `.env` à la racine du projet avec les informations de connexion :

```ini
# Configuration de la base de données
AIS_DB_HOST=localhost
AIS_DB_USER=bateau
AIS_DB_PASS=123456mdp
AIS_DB_NAME=marine_db
```

#### Utilisation du script d'import CSV

Le script `scripts/import_csv.py` permet d'importer des données AIS depuis un fichier CSV vers la base de données.

**Prérequis** :
- Avoir configuré la base de données MySQL/MariaDB
- Avoir installé les dépendances Python requises
- Avoir un fichier CSV au bon format (export_IA.csv)

**Utilisation** :
```bash
# Se placer dans le répertoire du projet
cd /chemin/vers/Projet_web3

# Lancer l'import
python3.9 scripts/import_csv.py chemin/vers/export_IA.csv
```

**Fonctionnalités** :
- Importe les données dans les tables `statut`, `bateau`, `position_AIS` et `possede`
- Gère les doublons (ne crée pas de doublons de navires avec le même MMSI)
- Convertit automatiquement les formats de date et les types de données

**Exemple de sortie** :
```
Connexion à la base de données... OK
Traitement de 1000 lignes...
- 850 positions importées
- 45 navires ajoutés
- 1000 positions liées
Import terminé avec succès !
```

#### Configuration des permissions
Assurez-vous que le script a les permissions d'exécution :
```bash
chmod +x scripts/import_csv.py
```

### 3.3. Configuration de l'application web
1. Placez le projet dans le répertoire `www` de WAMP (par défaut : `C:\wamp64\www\`)
2. Assurez-vous que le serveur web a les permissions nécessaires pour écrire dans les dossiers de logs
3. Configurez la base de données en important le fichier SQL :
   ```sql
   mysql -u root -p marine_db < assets/sql/AIS_TRINOME_5.sql
   ```
4. Configurez les paramètres de connexion dans `api/db.php`
5. Pour la production, modifiez la clé secrète JWT dans `api/jwt_functions.php`
6. Vérifiez les configurations dans `assets/js/config.js` si nécessaire

## 4. Accès administrateur
- **URL de connexion** : `/login.html`
- **Identifiants par défaut** :
  - Nom d'utilisateur : `admin`
  - Mot de passe : `admin`

> **Note** : Pour modifier les identifiants administrateur par défaut, modifiez le fichier `api/admin_auth.php` et changez les valeurs dans le tableau `$users`. Nous avons choisi de mettre la visualisation des données complètes dans une autre page que la visualisation de données qui est notre page admin, donc dans la page visualisation des données nous avons choisi de mettre juste le MMSI et le nom du navire et dans la page admin les données au complet.

## 5. Structure du projet complète

Voici la structure complète du projet avec une description de chaque composant :

```
Projet_web3/
├── api/                     # API PHP
│   ├── add_position.php     # Ajout de position
│   ├── admin_auth.php       # Authentification admin
│   ├── boats.php            # Gestion des navires
│   ├── check_auth.php       # Vérification auth
│   ├── db.php               # Configuration BDD
│   ├── jwt_functions.php    # Gestion des tokens JWT
│   ├── login.php            # Connexion
│   ├── logout.php           # Déconnexion
│   ├── position_pages.php   # Pagination positions
│   ├── positions.php        # Gestion positions
│   ├── positions_crud.php   # CRUD positions
│   ├── predict_*.php       # Endpoints de prédiction
│   └── session_config.php   # Configuration sessions
│
├── assets/                # Ressources statiques
│   ├── css/                # Feuilles de style
│   │   ├── auth.css       # Style authentification
│   │   ├── common.css     # Styles communs
│   │   └── styles.css     # Styles principaux
│   │
│   ├── img/             # Images et icônes
│   │   ├── cargo.png     # Icône cargo
│   │   ├── connexion.png # Image connexion
│   │   └── ...
│   │
│   ├── js/              # Scripts JavaScript
│   │   ├── admin.js     # Fonctions admin
│   │   ├── auth.js      # Authentification
│   │   ├── clusters.js  # Gestion clusters
│   │   ├── config.js    # Configuration
│   │   ├── map.js       # Carte interactive
│   │   └── ...
│   │
│   └── sql/             # Scripts SQL
│       └── AIS_TRINOME_5.sql  # Structure BDD
│
├── documentation/       # Documentation
│   ├── requirements.txt  # Dépendances Python
│   └── Charte_graphique.pdf
│
├── scripts/            # Scripts Python
│   ├── clustering_results/  # Résultats clustering
│   ├── models/           # Modèles d'IA
│   ├── models_predict/   # Modèles de prédiction
│   ├── cluster.py        # Clustering
│   ├── horizons.py       # Prédiction horizons
│   ├── import_csv.py     # Import données
│   ├── route.py          # Calcul d'itinéraires
│   └── type.py           # Classification types
│
├── logs/               # Fichiers de log
├── utils/               # Utilitaires
└── *.html              # Pages web
```

### Description détaillée des dossiers
- **/api** : Contient tous les endpoints de l'API en PHP
- **/assets** : Ressources statiques (CSS, JS, images)
- **/scripts** : Scripts Python pour le traitement des données
- **/logs** : Fichiers de log de l'application
- **/documentation** : Documentation technique supplémentaire

## Fonctionnalités

### 6.1. Pour les utilisateurs
- Visualisation en temps réel des navires sur une carte interactive
- Filtrage des navires par type, taille et statut
- Recherche de navires par nom ou MMSI
- Affichage des détails du navire au clic

### 6.2. Pour les administrateurs
- Tableau de bord complet avec statistiques
- Gestion des utilisateurs et des rôles
- Visualisation des clusters de navigation
- Suivi des mouvements de flotte
- Export des données au format CSV/JSON

### 6.3. Fonctionnalités avancées
- Prédiction des routes maritimes basée sur l'historique
- Détection des anomalies de trajectoire
- Alertes en cas de comportement inhabituel
- Intégration avec les données météorologiques

## 7. Dépannage

### Problèmes de connexion à la base de données
- Vérifiez que le service MySQL est en cours d'exécution
- Vérifiez les identifiants dans `api/db.php`
- Assurez-vous que l'utilisateur a les droits nécessaires sur la base de données

### Problèmes avec Python
- Vérifiez que Python 3.9 est bien installé
- Assurez-vous que toutes les dépendances sont installées avec les bonnes versions
- Vérifiez les logs d'erreur dans `logs/cluster_errors.log`

## 8. Sécurité
- Changez les mots de passe par défaut (base de données et accès administrateur)
- Ne laissez pas les identifiants en clair dans le code en production
- Mettez à jour régulièrement les dépendances
- Utilisez HTTPS en production
- Restreignez les accès aux dossiers sensibles (comme `/api/`)
- Configurez correctement les en-têtes de sécurité HTTP
- Limitez les tentatives de connexion échouées

## 9. Maintenance

### 9.1. Sauvegarde des données
- Sauvegardez régulièrement la base de données MySQL
- Conservez une copie des modèles d'IA dans `scripts/models/`
- Archivez les logs importants du dossier `logs/`

### 9.2. Mise à jour
1. Sauvegardez la base de données
2. Mettez à jour les dépendances PHP avec Composer (si utilisé)
3. Mettez à jour les dépendances Python :
   ```
   python3.9 -m pip install --upgrade -r scripts/requirements.txt
   ```
4. Testez les fonctionnalités critiques après mise à jour

## 10. Développement

### 10.1. Structure des dossiers
- `/api/` : Points d'entrée de l'API PHP
- `/assets/` : Fichiers statiques (CSS, JS, images)
- `/scripts/` : Scripts Python pour le traitement des données
  - `/clustering_results/` : Modèles et résultats de clustering
  - `/models/` : Modèles d'IA
  - `/models_predict/` : Modèles de prédiction
- `/logs/` : Fichiers de journalisation
- `/utils/` : Utilitaires divers

### 10.2. Configuration avancée

### Variables d'environnement
Créez un fichier `.env` à la racine du projet avec :
```
# Configuration base de données
DB_HOST=localhost
DB_NAME=marine_db
DB_USER=bateau
DB_PASS=votre_mot_de_passe

# Sécurité
JWT_SECRET=votre_clé_secrète_ici
JWT_EXPIRE_DAYS=1

# Chemins importants
UPLOAD_DIR=uploads/
LOG_DIR=logs/

# Configuration mail (optionnel)
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=user@example.com
MAIL_PASS=password
MAIL_FROM=noreply@example.com
```

### Configuration JWT
Le fichier `api/jwt_functions.php` contient les paramètres d'authentification :
- Clé secrète pour la signature des tokens
- Durée de validité des tokens (24h par défaut)
- Configuration des cookies de session

### Configuration JavaScript
Le fichier `assets/js/config.js` contient :
- URLs des endpoints API
- Chemins des templates
- Configuration de l'interface utilisateur

## 11. Documentation de l'API

### 11.1. Authentification
- `POST /api/login.php` : Authentification utilisateur
  - Paramètres : `username`, `password`
  - Retourne : JWT token en cas de succès

- `GET /api/check_auth.php` : Vérification de l'authentification
  - Headers : `Authorization: Bearer <token>`
  - Retourne : Statut de l'authentification

- `GET /api/logout.php` : Déconnexion
  - Invalide le token JWT

### 11.2. Données des navires
- `GET /api/boats.php` : Liste des navires
  - Paramètres optionnels : `page`, `limit`, `search`
  - Retourne : Liste paginée des navires avec leurs détails

- `GET /api/positions.php` : Positions des navires
  - Paramètres : `id_bateau` (optionnel)
  - Retourne : Positions historiques d'un navire spécifique ou de tous les navires

- `GET /api/position_pages.php` : Récupération paginée des positions
  - Paramètres : `page`, `limit`, `id_bateau` (optionnel)
  - Retourne : Positions paginées avec métadonnées de pagination

- `GET /api/ship_names.php` : Liste des noms de navires pour l'autocomplétion
  - Paramètres : `term` (recherche)
  - Retourne : Liste des noms correspondants

### 11.3. Gestion des positions (CRUD)
- `POST /api/positions_crud.php` : Ajouter une position
  - Corps (JSON) : `BaseDateTime`, `LAT`, `LON`, `SOG`, `COG`, `Heading`, `id_statut`, `id_bateau`
  - Retourne : ID de la position créée

- `PUT /api/positions_crud.php` : Mettre à jour une position
  - Corps (JSON) : `id_position`, champs à mettre à jour (`BaseDateTime`, `LAT`, `LON`, etc.)
  - Retourne : Statut de la mise à jour

- `DELETE /api/positions_crud.php` : Supprimer une position
  - Corps (JSON) : `id_position`
  - Retourne : Statut de la suppression

### 11.4. Prédictions et analyse
- `GET /api/predict_cluster.php` : Prédire un cluster
  - Retourne : 3000 Cluster prédit avec les données (récupérer directement dans la base de données)

- `GET /api/predict_route.php` : Prédire une route
  - Paramètres : `mmsi` (identifiant du navire)
  - Retourne : Points de la route prédite

- `GET /api/predict_type.php` : Prédire le type de navire
  - Paramètres : `LAT`, `LON`, `SOG`, `COG`, `Heading`
  - Retourne : Type de navire prédit avec score de confiance

- `GET /api/predict_horizon.php` : Prédiction à horizon temporel
  - Paramètres : `mmsi`, `horizon` (en minutes (5-10-15))
  - Retourne : Position prédite à l'horizon spécifié

### 11.5. Authentification et autorisation

#### Authentification utilisateur
- `POST /api/login.php` : Connexion utilisateur
  - Paramètres : `username`, `password`
  - Retourne : JWT dans un cookie `auth_token`
  - Durée de validité : 30 jours

- `GET /api/check_auth.php` : Vérification de l'authentification
  - Vérifie la présence et la validité du JWT dans les cookies
  - Retourne : `{authenticated: true/false, user: {id, username, is_admin}}`

- `GET /api/logout.php` : Déconnexion
  - Invalide le cookie d'authentification

#### Vérification des droits administrateur
- `GET /api/admin_auth.php` : Vérification des droits administrateur
  - Vérifie que l'utilisateur est authentifié et a les droits administrateur
  - Nécessite un cookie `auth_token` valide avec `is_admin=true`
  - Redirige vers la page de connexion si non authentifié
  - Redirige vers une page d'erreur 403 si non autorisé
  - Retourne les informations de l'utilisateur administrateur si autorisé

#### Fonctionnement du JWT
- Le token JWT contient : `{user_id, username, is_admin, exp, iat}`
- Signé avec une clé secrète côté serveur
- Stocké dans un cookie HTTP-Only avec les drapeaux Secure et SameSite=Strict
- Valable 24 heures (renouvellement automatique à chaque requête)
- Invalidation lors de la déconnexion

## 12. Dépannage avancé

### 12.1. Problèmes courants
- **Erreur de connexion à la base de données** : Vérifiez les identifiants dans `api/db.php`
- **Problèmes de permissions** : Assurez-vous que le serveur web a les droits d'écriture sur `logs/`
- **Erreurs Python** : Vérifiez les logs dans `logs/cluster_errors.log`

### 12.2. Logs
- `logs/access.log` : Accès à l'application
- `logs/error.log` : Erreurs PHP
- `logs/cluster_errors.log` : Erreurs des scripts Python

## 13. Aide et support

### Support technique
Pour toute question ou problème :
1. Consultez la section [Dépannage](#7-dépannage)
2. Vérifiez les fichiers de log dans `logs/`
3. Ouvrez une issue sur le dépôt du projet

### Contribution
Les contributions sont les bienvenues ! Pour contribuer :
1. Forkez le dépôt
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Committez vos modifications (`git commit -am 'Ajout d\'une nouvelle fonctionnalité'`)
4. Poussez vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créez une Pull Request

### Documentation complémentaire
- [Guide de la répartition](documentation/Gantt_fin_web.pdf)
- [Maquette](documentation/Maquette)
- [Documentation Modèle Conceptuel de Données](documentation/MCD.pdf)
- [Charte graphique](documentation/Charte_graphique.pdf)

### 13.4. Équipe de développement

#### Armand BEHAREL CIR3 - Développeur principal
- **Gestion de projet** :
  - Organisation et planification (Gantt)
  - Coordination de l'équipe
  - Documentation technique

- **Développement Backend** :
  - Architecture et conception de l'application
  - Développement des API client-serveur
  - Scripts d'import/export Python
  - Configuration et maintenance des serveurs

- **Développement Frontend** :
  - Conception et développement de l'interface utilisateur
  - Tableau de visualisation des données
  - Système de filtrage avancé
  - Formulaire d'ajout de données
  - Page d'administration
  - Complétion automatique des champs

- **Fonctionnalités avancées** :
  - Intégration des modèles d'IA (clusters et prédictions)
  - Visualisation cartographique interactive
  - Gestion des données en temps réel
  - Système de gestion des erreurs

#### Xavier FAVE CIR3 - Développeur Frontend & Base de données
- **Conception** :
  - Modèle Conceptuel de Données (MCD)
  - Charte graphique
  - Documentation des requêtes client-serveur

- **Développement** :
  - Contribution à la page d'accueil
  - Mise en forme CSS/bootstrap
  - Éléments d'interface utilisateur
  - Design/Style de la section de prédiction (partie 5)
  - Documentation technique des API

#### Antoine TOURNEUX CIR3 - Développeur Frontend
- **Conception** :
  - Maquettes initiales du site
  - Charte graphique

- **Développement** :
  - Contribution majeur à la page d'accueil
  - Idées et début d'implémentation de l'interface admin et login
  - Mise en forme CSS/bootstrap
  - Éléments visuels et graphiques
  - header et footer
