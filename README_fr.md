# Projet Web3 - Système de Suivi Maritime

> **Note** : Ce projet nécessite une configuration serveur avec PHP 7.4+ et Python 3.9 pour fonctionner correctement.

>pour le icones sur github
[![PHP 7.4+](https://img.shields.io/badge/PHP-7.4+-8892BF.svg)](https://php.net/)
[![Python 3.9+](https://img.shields.io/badge/Python-3.9+-3776AB.svg)](https://www.python.org/)

## Table des matières

1. [Description](#1-description)
2. [Prérequis](#2-prérequis)  
   2.1. [Serveur Web](#21-serveur-web)  
   2.2. [Python](#22-python)
3. [Installation](#3-installation)  
   3.1. [Configuration Python](#31-Configuration-Python)  
   3.2. [Configuration de l'application web](#32-configuration-de-lapplication-web)
4. [Accès administrateur](#4-accès-administrateur)
5. [Structure du projet complète](#5-structure-du-projet-complète)
6. [Fonctionnalités](#6-fonctionnalités)  
   6.1. [Pour les utilisateurs](#61-pour-les-utilisateurs)  
   6.2. [Pour les administrateurs](#62-pour-les-administrateurs)  
   6.3. [Fonctionnalités avancées](#63-fonctionnalités-avancées)
7. [Dépannage](#7-dépannage)
8. [Sécurité](#8-sécurité)
9. [Maintenance](#9-maintenance)
10. [Développement](#10-développement)  
    10.1. [Structure des dossiers](#101-structure-des-dossiers)
11. [Documentation de l'API](#11-documentation-de-lapi)  
12. [Dépannage avancé](#12-dépannage-avancé)  
    12.1. [Problèmes courants](#121-problèmes-courants)  
    12.2. [Logs](#122-logs)
13. [Aide et support](#13-aide-et-support)   
    13.1. [Équipe de développement](#131-équipe-de-développement)

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

### 3. Configuration de la base de données

1. Créez une base de données MySQL nommée `etuXXXX`
2. Importez le fichier SQL initial en utilisant phpMyAdmin ou la ligne de commande :
   - **Méthode 1 (phpMyAdmin)** :
     1. Connectez-vous à phpMyAdmin ('adresse http://etuXXXX.projets.isen-ouest.info/phpmyadmin)
     2. Sélectionnez la base de données `etuXXXX`
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
   $db   = 'etuXXXX';
   $user = 'etuXXXX';
   $pass = 'mdp_etu';
   ```

### 3.1. Configuration Python

#### Configuration des variables d'environnement
Le script utilise des variables d'environnement pour la connexion à la base de données. Créez un fichier `.env` à la racine du projet avec les informations de connexion :

```ini
# Configuration de la base de données
AIS_DB_HOST=localhost
AIS_DB_USER=etuXXXX
AIS_DB_PASS=mdp_etu
AIS_DB_NAME=etuXXXX
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

### 3.2. Configuration de l'application web
1. Placez le projet dans le répertoire `www` de WAMP (par défaut : `C:\wamp64\www\`)
2. Assurez-vous que le serveur web a les permissions nécessaires pour écrire dans les dossiers de logs
3. Configurez la base de données en important le fichier SQL :
   ```sql
   mysql -u root -p etuXXXX < assets/sql/AIS_TRINOME_5.sql
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
- Visualisation des navires sur une carte interactive
- Recherche de navires par nom ou MMSI
- Affichage des détails du navire au clic

### 6.2. Pour les administrateurs
- Tableau de bord complet
- Modifaction, ajout, suppression de données.

### 6.3. Fonctionnalités avancées
- Prédiction des trajectoires (5,10 et 15 min)
- Visualisation des clusters de navigation
- Prédiction du type


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

#### Vérification des droits administrateur
- `GET /api/admin_auth.php` : Vérification des droits administrateur
  - Vérifie que l'utilisateur est authentifié et a les droits administrateur
  - Nécessite un cookie `auth_token` valide
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

### 13.1 Équipe de développement

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
