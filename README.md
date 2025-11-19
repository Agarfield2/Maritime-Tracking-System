# Web3 Project - Maritime Tracking System

> **Note**: This project requires a server setup with PHP 7.4+ and Python 3.9 to function properly.

> GitHub badges:
> [![PHP 7.4+](https://img.shields.io/badge/PHP-7.4+-8892BF.svg)](https://php.net/)
> [![Python 3.9+](https://img.shields.io/badge/Python-3.9+-3776AB.svg)](https://www.python.org/)

## Table of Contents

1. [Description](#1-description)
2. [Requirements](#2-requirements)
   2.1. [Web Server](#21-web-server)
   2.2. [Python](#22-python)
3. [Installation](#3-installation)
   3.1. [Python Configuration](#31-python-configuration)
   3.2. [Web Application Setup](#32-web-application-setup)
4. [Admin Access](#4-admin-access)
5. [Full Project Structure](#5-full-project-structure)
6. [Features](#6-features)
   6.1. [For Users](#61-for-users)
   6.2. [For Admins](#62-for-admins)
   6.3. [Advanced Features](#63-advanced-features)
7. [Troubleshooting](#7-troubleshooting)
8. [Security](#8-security)
9. [Maintenance](#9-maintenance)
10. [Development](#10-development)
    10.1. [Folder Structure](#101-folder-structure)
11. [API Documentation](#11-api-documentation)
12. [Advanced Troubleshooting](#12-advanced-troubleshooting)
    12.1. [Common Issues](#121-common-issues)
    12.2. [Logs](#122-logs)
13. [Help & Support](#13-help-support)
    13.1. [Development Team](#131-development-team)

## 1. Description

This project is a web-based maritime tracking application that allows visualization and analysis of AIS (Automatic Identification System) vessel data. The application includes authentication features, map visualization, and predictive route analysis.

## 2. Requirements

### 2.1. Web Server

* WAMP (Windows) or LAMP (Linux) with PHP 7.4+
* MySQL 5.7+ or MariaDB 10.3+
* Apache 2.4+

### 2.2. Python

* Python 3.9.X
* Python libraries (install with the command below):

  ```
  # Install main dependencies
  python3.9 -m pip install --upgrade --force-reinstall \
    "tensorflow>=2.8.0" \
    "numpy>=1.26.4" \
    "pandas>=2.2.2" \
    "scikit-learn>=1.0.0" \
    "joblib>=1.1.0" \
    "mysql-connector-python>=8.0.0" \
    "SQLAlchemy>=1.4.0"

  # Optional dependencies for advanced features
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

  Or using the `requirements.txt` file:

  ```
  python3.9 -m pip install -r documentation/requirements.txt
  ```

### 3. Database Setup

1. Create a MySQL database named `etuXXXX`
2. Import the initial SQL file using phpMyAdmin or the command line:

   * **Method 1 (phpMyAdmin)**:

     1. Log in to phpMyAdmin ('[http://etuXXXX.projets.isen-ouest.info/phpmyadmin](http://etuXXXX.projets.isen-ouest.info/phpmyadmin)')
     2. Select the `etuXXXX` database
     3. Go to the "Import" tab
     4. Select `assets/sql/AIS_TRINOME_5.sql`
     5. Click "Go"
   * **Method 2 (Command line)**:

     ```
     mysql -u root -p marine_db < assets/sql/AIS_TRINOME_5.sql
     ```
3. Configure access in `api/db.php`:

   ```php
   $host = 'localhost';
   $db   = 'etuXXXX';
   $user = 'etuXXXX';
   $pass = 'mdp_etu';
   ```

### 3.1. Python Configuration

#### Environment Variables

The script uses environment variables for database connection. Create a `.env` file at the project root:

```ini
# Database configuration
AIS_DB_HOST=localhost
AIS_DB_USER=etuXXXX
AIS_DB_PASS=mdp_etu
AIS_DB_NAME=etuXXXX
```

#### CSV Import Script

The `scripts/import_csv.py` script imports AIS data from a CSV file into the database.

**Requirements**:

* Database configured
* Python dependencies installed
* CSV file in the correct format (`export_IA.csv`)

**Usage**:

```bash
# Navigate to project directory
cd /path/to/Projet_web3

# Run import
python3.9 scripts/import_csv.py path/to/export_IA.csv
```

**Features**:

* Imports data into `statut`, `bateau`, `position_AIS`, and `possede` tables
* Avoids duplicates (same MMSI)
* Automatically converts date and data types

### 3.2. Web Application Setup

1. Place the project in WAMP's `www` directory (default: `C:\wamp64\www\`)
2. Ensure web server has write permissions for log folders
3. Import SQL database:

   ```sql
   mysql -u root -p etuXXXX < assets/sql/AIS_TRINOME_5.sql
   ```
4. Configure credentials in `api/db.php`
5. For production, update JWT secret key in `api/jwt_functions.php`
6. Check configuration in `assets/js/config.js` if needed

## 4. Admin Access

* **Login URL**: `/login.html`
* **Default credentials**:

  * Username: `admin`
  * Password: `admin`

> **Note**: To change default admin credentials, edit `api/admin_auth.php` and update the `$users` array. Full data visualization is available on the admin page, while the regular data view only shows MMSI and vessel name.

## 5. Full Project Structure

```
Projet_web3/
├── api/                     
│   ├── add_position.php     
│   ├── admin_auth.php       
│   ├── boats.php            
│   ├── check_auth.php       
│   ├── db.php               
│   ├── jwt_functions.php    
│   ├── login.php            
│   ├── logout.php           
│   ├── position_pages.php   
│   ├── positions.php        
│   ├── positions_crud.php   
│   ├── predict_*.php        
│   └── session_config.php   
│
├── assets/                
│   ├── css/                
│   │   ├── auth.css       
│   │   ├── common.css     
│   │   └── styles.css     
│   │
│   ├── img/             
│   │   ├── cargo.png     
│   │   ├── connexion.png 
│   │   └── ...
│   │
│   ├── js/              
│   │   ├── admin.js     
│   │   ├── auth.js      
│   │   ├── clusters.js  
│   │   ├── config.js    
│   │   ├── map.js       
│   │   └── ...
│   │
│   └── sql/             
│       └── AIS_TRINOME_5.sql  
│
├── documentation/       
│   ├── requirements.txt  
│   └── Charte_graphique.pdf
│
├── scripts/            
│   ├── clustering_results/  
│   ├── models/           
│   ├── models_predict/   
│   ├── cluster.py        
│   ├── horizons.py       
│   ├── import_csv.py     
│   ├── route.py          
│   └── type.py           
│
├── logs/               
├── utils/               
└── *.html              
```

### Folder Descriptions

* **/api** : PHP API endpoints
* **/assets** : Static resources (CSS, JS, images)
* **/scripts** : Python data processing scripts
* **/logs** : Application logs
* **/documentation** : Technical documentation

## 6. Features

### 6.1. For Users

* Interactive map vessel visualization
* Search vessels by name or MMSI
* Click to view vessel details

### 6.2. For Admins

* Full dashboard
* Modify, add, delete data

### 6.3. Advanced Features

* Trajectory prediction (5, 10, 15 min)
* Navigation cluster visualization
* Type prediction

## 7. Troubleshooting

### Database Connection Issues

* Ensure MySQL service is running
* Check credentials in `api/db.php`
* Ensure user has correct database privileges

### Python Issues

* Verify Python 3.9 installation
* Ensure all dependencies are installed
* Check logs in `logs/cluster_errors.log`

## 8. Security

* Change default passwords (database & admin)
* Do not leave credentials in code in production
* Regularly update dependencies
* Use HTTPS in production
* Restrict access to sensitive folders (`/api/`)
* Configure HTTP security headers
* Limit failed login attempts

## 9. Maintenance

### 9.1. Data Backup

* Regularly back up MySQL database
* Keep AI models in `scripts/models/`
* Archive important logs in `logs/`

### 9.2. Updates

1. Backup database
2. Update PHP dependencies via Composer (if used)
3. Update Python dependencies:

   ```
   python3.9 -m pip install --upgrade -r scripts/requirements.txt
   ```
4. Test critical functionalities

## 10. Development

### 10.1. Folder Structure

* `/api/` : PHP API endpoints
* `/assets/` : Static files (CSS, JS, images)
* `/scripts/` : Python data processing

  * `/clustering_results/` : Clustering results
  * `/models/` : AI models
  * `/models_predict/` : Prediction models
* `/logs/` : Log files
* `/utils/` : Utilities

### 10.2. Advanced Configuration

#### JWT Configuration

`api/jwt_functions.php` contains:

* Secret key for token signing
* Token validity (default 24h)
* Session cookie configuration

#### JavaScript Configuration

`assets/js/config.js` contains:

* API endpoint URLs
* Template paths
* UI configuration

## 11. API Documentation

#### Admin Rights Check

* `GET /api/admin_auth.php` : Verify admin rights

  * Checks authentication and admin privileges
  * Requires valid `auth_token` cookie
  * Redirects to login if not authenticated
  * Redirects to 403 error page if unauthorized
  * Returns admin info if allowed

#### JWT Details

* JWT token contains `{user_id, username, is_admin, exp, iat}`
* Signed server-side
* Stored in HTTP-Only cookie with Secure & SameSite=Strict flags
* Valid 24h, auto-renewed on requests
* Invalidated on logout

## 12. Advanced Troubleshooting

### 12.1. Common Issues

* Database connection errors: check `api/db.php`
* Permission issues: web server must write to `logs/`
* Python errors: check `logs/cluster_errors.log`

### 12.2. Logs

* `logs/access.log` : app access
* `logs/error.log` : PHP errors
* `logs/cluster_errors.log` : Python script errors

## 13. Help & Support

### Technical Support

1. Check [Troubleshooting](#7-troubleshooting)
2. Review logs in `logs/`
3. Open an issue on the project repository

### 13.1. Development Team

#### Armand BEHAREL CIR3 - Lead Developer

* **Project Management**:

  * Planning (Gantt charts)
  * Team coordination
  * Technical documentation

* **Backend Development**:

  * Application architecture
  * Client-server API development
  * Python import/export scripts
  * Server configuration & maintenance

* **Frontend Development**:

  * UI design & development
  * Data visualization dashboard
  * Advanced filtering
  * Data entry forms
  * Admin page
  * Auto-complete fields

* **Advanced Features**:

  * AI model integration (clusters & predictions)
  * Interactive map visualization
  * Real-time data management
  * Error handling system

#### Xavier FAVE CIR3 - Frontend & Database Developer

* **Design**:

  * Conceptual Data Model (CDM)
  * Graphic charter
  * Client-server query documentation

* **Development**:

  * Homepage contributions
  * CSS/bootstrap styling
  * UI elements
  * Prediction section design
  * API documentation

#### Antoine TOURNEUX CIR3 - Frontend Developer

* **Design**:

  * Initial website mockups
  * Graphic charter

* **Development**:

  * Major homepage contributions
  * Admin & login interface initial implementation
  * CSS/bootstrap styling
  * Visual & graphical elements
  * Header & footer
