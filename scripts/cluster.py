#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de prédiction de cluster pour les données de navigation maritime.

Ce script permet de prédire le cluster d'un navire à partir de ses caractéristiques
(SOG, COG, Heading) en utilisant un modèle de clustering pré-entraîné.

Exemple d'utilisation :
    python predict_cluster.py --sog 12.5 --cog 45 --heading 90
    python predict_cluster.py --sog 12.5 --cog 45 --heading 90 --model_path clustering_results/kmeans_model.joblib
"""

import os
import argparse
import site
# Ajout du site-packages utilisateur « arman » pour Apache
site.addsitedir(r"C:\\Users\\arman\\AppData\\Roaming\\Python\\Python312\\site-packages")
try:
    import joblib 
except ModuleNotFoundError:
    import site, os as _os, sys as _sys
    user_home = _os.path.expanduser('~')
    for _pth in [
        rf"{user_home}\AppData\Roaming\Python\Python312\site-packages",
        rf"{user_home}\AppData\Local\Programs\Python\Python312\Lib\site-packages",
    ]:
        if _os.path.isdir(_pth) and _pth not in _sys.path:
            site.addsitedir(_pth)
    import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

# ----- Compatibilité MySQL connector dans environnement Apache -----
try:
    import mysql.connector as mc
except ModuleNotFoundError:
    import site, os as _os
    site.addsitedir(_os.path.expanduser('~') + r'/AppData/Local/Programs/Python/Python312/Lib/site-packages')
    import mysql.connector as mc

import random, json, sys

DEBUG = bool(os.getenv('CLUSTER_DEBUG'))

SAMPLE_SIZE = int(os.getenv('CLUSTER_SAMPLE', '5000'))
# Configuration DB (identique aux autres scripts)
DB_CONF = {
    "host": os.getenv("AIS_DB_HOST", "localhost"),
    "user": os.getenv("AIS_DB_USER", "bateau"),
    "password": os.getenv("AIS_DB_PASS", "123456mdp"),
    "database": os.getenv("AIS_DB_NAME", "marine_db"),
    "charset": "utf8mb4",
}

FEATURE_COLS_ORDER = ['SOG', 'COG_sin', 'COG_cos', 'Heading_sin', 'Heading_cos']

# ----- Détection flexible du chemin du modèle -----
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_CANDIDATES = [
    os.getenv('CLUSTER_MODEL_PATH', '').strip(),
    'models/cluster_model.joblib',
    'models/kmeans_clustering_model.joblib',
    'clustering_results/cluster_model.joblib',
    'clustering_results/kmeans_clustering_model.joblib',
]

def find_model_path():
    """Retourne le premier chemin de modèle existant parmi les candidats."""
    for p in MODEL_CANDIDATES:
        if not p:
            continue
        # Si chemin relatif, chercher par rapport au dossier du script
        if not os.path.isabs(p):
            abs_p = os.path.join(SCRIPT_DIR, p)
            if os.path.exists(abs_p):
                return abs_p
        if os.path.exists(p):
            return p
    # Dernier recours: retourne chemin absolu du dernier candidat
    return os.path.join(SCRIPT_DIR, MODEL_CANDIDATES[-1])



def fetch_positions(limit=SAMPLE_SIZE):
    """Récupère les dernières positions pour clustering."""
    query = (
        "SELECT p.LAT AS lat, p.LON AS lon, p.SOG, p.COG, p.Heading AS heading, UNIX_TIMESTAMP(p.BaseDateTime) AS ts, "
        "b.MMSI, b.VesselName AS name, b.Length, b.Width, b.Draft "
        "FROM position_AIS p "
        "JOIN possede po ON p.id_position = po.id_position "
        "JOIN bateau b ON po.id_bateau = b.id_bateau "
        "ORDER BY p.BaseDateTime DESC LIMIT %s"
    )
    conn = mc.connect(**DB_CONF)
    cur = conn.cursor(dictionary=True)
    cur.execute(query, (limit,))
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows


def assign_clusters_bulk(rows):
    """Assigne un cluster à chaque ligne (via modèle si dispo, sinon random)."""
    if not rows:
        return []
    # Essaye de charger modèle/scaler/pca via fonctions existantes
    model_path = find_model_path()
    if DEBUG:
        sys.stderr.write(f"[cluster.py] Using model path: {model_path}\n")
    model = None
    try:
        model, scaler, pca = load_model_and_components(model_path)
    except Exception as e:
        if DEBUG:
            sys.stderr.write(f"[cluster.py] Could not load clustering model: {e}\n")
    if model is None:
        for r in rows:
            r['cluster'] = random.randint(0,7)
        return rows

    import numpy as _np, pandas as _pd
    df = _pd.DataFrame(rows)
    # Pour compatibilité modèle: duplique "heading" en "Heading"
    if 'heading' in df.columns:
        df['Heading'] = df['heading']
    for angle_col in ['COG','Heading']:
        df[f'{angle_col}_sin'] = _np.sin(_np.radians(df[angle_col].fillna(0)))
        df[f'{angle_col}_cos'] = _np.cos(_np.radians(df[angle_col].fillna(0)))
    X = df[FEATURE_COLS_ORDER].fillna(0.0)
    try:
        X_scaled = scaler.transform(X.to_numpy())
        X_pca = pca.transform(X_scaled)
        df['cluster'] = model.predict(X_pca).astype(int)
    except Exception as e:
        if DEBUG:
            sys.stderr.write(f"[cluster.py] Prediction failed, fallback random clusters: {e}\n")
        df['cluster'] = [random.randint(0,7) for _ in range(len(df))]
    return df.to_dict(orient='records')


def bulk_mode():
    rows = fetch_positions()
    result = assign_clusters_bulk(rows)
    print(json.dumps(result, default=str, ensure_ascii=False))


def load_model_and_components(model_path):
    """
    Charge le modèle KMeans et les composantes nécessaires.
    
    Args:
        model_path (str): Chemin vers le modèle sauvegardé
        
    Returns:
        tuple: (model, scaler, pca, n_features)
    """
    # Vérifier que le modèle existe
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Le modèle {model_path} n'existe pas.")
    
    # Charger le modèle et les composantes
    model = joblib.load(model_path)
    
    # Déterminer le répertoire du modèle
    model_dir = os.path.dirname(model_path)
    
    # Charger le scaler
    scaler_path = os.path.join(model_dir, 'scaler.joblib')
    if not os.path.exists(scaler_path):
        raise FileNotFoundError(f"Le fichier du scaler {scaler_path} est introuvable.")
    scaler = joblib.load(scaler_path)
    
    # Charger le PCA
    pca_path = os.path.join(model_dir, 'pca.joblib')
    if not os.path.exists(pca_path):
        raise FileNotFoundError(f"Le fichier du modèle PCA {pca_path} est introuvable.")
    pca = joblib.load(pca_path)
    
    return model, scaler, pca

def preprocess_input(sog, cog, heading, scaler, pca):
    """
    Prétraite les données d'entrée de la même manière que lors de l'entraînement.
    
    Args:
        sog (float): Speed Over Ground
        cog (float): Course Over Ground (degrés)
        heading (float): Cap du navire (degrés)
        scaler: StandardScaler entraîné
        pca: Modèle PCA entraîné
        
    Returns:
        numpy.ndarray: Données prétraitées pour la prédiction
    """
    # Créer un DataFrame avec les entrées
    data = {
        'SOG': [sog],
        'COG': [cog],
        'Heading': [heading]
    }
    df = pd.DataFrame(data)
    
    # Convertir les angles en sin/cos
    for angle_col in ['COG', 'Heading']:
        df[f'{angle_col}_sin'] = np.sin(np.radians(df[angle_col]))
        df[f'{angle_col}_cos'] = np.cos(np.radians(df[angle_col]))
    
    # Sélectionner les caractéristiques dans le bon ordre
    features = ['SOG', 'COG_sin', 'COG_cos', 'Heading_sin', 'Heading_cos']
    X = df[features]
    
    # Appliquer la même mise à l'échelle
    X_scaled = scaler.transform(X.to_numpy())
    
    # Appliquer la réduction de dimension
    X_pca = pca.transform(X_scaled)
    
    return X_pca

def predict_cluster(model_path, sog, cog, heading):
    """
    Prédit le cluster pour un ensemble de caractéristiques de navigation.
    
    Args:
        model_path (str): Chemin vers le modèle sauvegardé
        sog (float): Speed Over Ground
        cog (float): Course Over Ground (degrés)
        heading (float): Cap du navire (degrés)
        
    Returns:
        int: Numéro du cluster prédit
    """
    try:
        # Charger le modèle et les composantes
        model, scaler, pca = load_model_and_components(model_path)
        
        # Prétraiter les entrées
        X_processed = preprocess_input(sog, cog, heading, scaler, pca)
        
        # Faire la prédiction
        cluster = model.predict(X_processed)[0]
        
        return cluster
    except Exception as e:
        print(f"Erreur lors de la prédiction : {e}")
        return None

def main():
    # Configuration de l'analyseur d'arguments
    parser = argparse.ArgumentParser(description='Prédire le cluster pour un navire')
    
    # Arguments obligatoires
    parser.add_argument('--sog', type=float, required=True,
                       help='Speed Over Ground (en noeuds)')
    parser.add_argument('--cog', type=float, required=True,
                       help='Course Over Ground (en degrés, 0-360)')
    parser.add_argument('--heading', type=float, required=True,
                       help='Cap du navire (en degrés, 0-360)')
    
    # Arguments optionnels
    parser.add_argument('--model_path', type=str, default=find_model_path(),
                       help='Chemin vers le modèle sauvegardé (défaut: clustering_results/kmeans_clustering_model.joblib)')
    
    # Parser les arguments
    args = parser.parse_args()
    
    # Valider les entrées
    if not (0 <= args.cog <= 360):
        print("Erreur: COG doit être compris entre 0 et 360 degrés")
        return
        
    if not (0 <= args.heading <= 360):
        print("Erreur: Le cap doit être compris entre 0 et 360 degrés")
        return
        
    if args.sog < 0:
        print("Erreur: La vitesse (SOG) ne peut pas être négative")
        return
    
    # Faire la prédiction
    cluster = predict_cluster(args.model_path, args.sog, args.cog, args.heading)
    
    if cluster is not None:
        print(f"\n=== Résultat de la prédiction ===")
        print(f"Caractéristiques du navire :")
        print(f"- Vitesse (SOG)   : {args.sog} noeuds")
        print(f"- Cap sur le fond (COG) : {args.cog}°")
        print(f"- Cap du navire   : {args.heading}°")
        print(f"\nCluster prédit : {cluster}")

if __name__ == "__main__":
    # Si aucun argument -> mode bulk (pour API)
    if len(sys.argv) == 1:
        bulk_mode()
    else:
        main()
