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
   - [3.1. Configuration de la base de données](#31-configuration-de-la-base-de-données)
   - [3.2. Configuration Python](#32-configuration-python)
   - [3.3. Configuration de l'application web](#33-configuration-de-lapplication-web)
4. [Accès administrateur](#4-accès-administrateur)
5. [Structure du projet](#5-structure-du-projet)
6. [Fonctionnalités](#6-fonctionnalités)
   - [6.1. Pour les utilisateurs](#61-pour-les-utilisateurs)
   - [6.2. Pour les administrateurs](#62-pour-les-administrateurs)
   - [6.3. Fonctionnalités avancées](#63-fonctionnalités-avancées)
7. [Dépannage](#7-dépannage)
8. [Sécurité](#8-sécurité)

## 1. Description
Ce projet est une application web de suivi maritime qui permet de visualiser et d'analyser les données AIS (Automatic Identification System) des navires. L'application inclut des fonctionnalités d'authentification, de visualisation de cartes, et d'analyse prédictive des routes maritimes.

## 2. Prérequis

### 2.1. Serveur Web
- WAMP (Windows) ou LAMP (Linux) avec PHP 7.4+
- MySQL 5.7+ ou MariaDB 10.3+
- Apache 2.4+

### 2.2. Python
- Python 3.9
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

### 3.1. Configuration de la base de données
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

### 3.2. Configuration Python
1. Installez les dépendances Python requises :
   ```
   python3.9 -m pip install -r documentation/requirements.txt
   ```

2. Assurez-vous que le script Python a les permissions d'exécution :
   ```
   chmod +x scripts/cluster.py
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

> **Note** : Pour modifier les identifiants administrateur par défaut, modifiez le fichier `api/admin_auth.php` et changez les valeurs dans le tableau `$users`.

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

```
Projet_web3/
├── api/                     # Fichiers backend PHP
│   ├── admin_auth.php       # Authentification admin
│   ├── db.php               # Configuration de la base de données
│   ├── login.php            # Gestion de la connexion
│   ├── get_vessels.php      # API pour récupérer les navires
│   ├── update_position.php  # Mise à jour des positions
│   └── ...
│
├── assets/
│   ├── css/                # Feuilles de style
│   │   ├── style.css      # Styles principaux
│   │   └── admin.css      # Styles de l'interface admin
│   ├── js/                 # Scripts JavaScript
│   │   ├── main.js       # Script principal
│   │   ├── map.js        # Gestion de la carte interactive
│   │   └── admin.js      # Fonctionnalités admin
│   ├── img/                # Images et icônes
│   └── sql/                # Scripts SQL
│       └── AIS_TRINOME_5.sql  # Script de création de la BDD
│
├── scripts/
│   ├── cluster.py         # Script Python pour le clustering
│   └── requirements.txt    # Dépendances Python
│
├── logs/                   # Fichiers de log
├── documentation/          # Documentation supplémentaire
├── admin.html              # Interface d'administration
├── index.html              # Page d'accueil
├── login.html              # Page de connexion
├──  README.md               # Ce fichier
└── ...
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

## 11. API Documentation

### 11.1. Authentification
- `POST /api/login.php` : Authentification utilisateur
- `GET /api/check_auth.php` : Vérification de l'authentification
- `GET /api/logout.php` : Déconnexion

### 11.2. Données des navires
- `GET /api/boats.php` : Liste des navires
- `GET /api/positions.php` : Positions des navires
- `POST /api/add_position.php` : Ajouter une position

### 11.3. Prédictions
- `GET /api/predict_cluster.php` : Prédire un cluster
- `GET /api/predict_route.php` : Prédire une route
- `GET /api/predict_type.php` : Prédire le type de navire

## 12. Dépannage avancé

### 12.1. Problèmes courants
- **Erreur de connexion à la base de données** : Vérifiez les identifiants dans `api/db.php`
- **Problèmes de permissions** : Assurez-vous que le serveur web a les droits d'écriture sur `logs/`
- **Erreurs Python** : Vérifiez les logs dans `logs/cluster_errors.log`

### 12.2. Logs
- `logs/access.log` : Accès à l'application
- `logs/error.log` : Erreurs PHP
- `logs/cluster_errors.log` : Erreurs des scripts Python

## 13. Licence
Ce projet est sous licence [MIT](LICENSE).

## 14. Aide et support

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
- [Guide d'installation détaillé](documentation/INSTALL.md)
- [Guide utilisateur](documentation/USER_GUIDE.md)
- [Documentation technique](documentation/TECH_DOC.md)
- [Charte graphique](documentation/Charte_graphique.pdf)

### Équipe de développement
- [Votre nom] - Développeur principal
- [Collègue] - Développeur backend
- [Designer] - Design UI/UX

### Remerciements
- [Bibliothèques tierces](documentation/CREDITS.md)
- Sources de données
- Contributeurs

