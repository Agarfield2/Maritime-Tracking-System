#!/usr/bin/env python3
"""Clusterise les navires selon leur position moyenne via K-Means.
Retour JSON: [{"id_bateau":int, "cluster":int}]
Dépendances: pandas, scikit-learn, mysql-connector-python
"""
import argparse, random, json, sys, os, site
# Ajoute systématiquement le site-packages de l'utilisateur "arman" pour que Python lancé par Apache y accède
site.addsitedir(r"C:\\Users\\arman\\AppData\\Roaming\\Python\\Python312\\site-packages")
import warnings
warnings.filterwarnings("ignore")
# Mode aléatoire temporaire
parser = argparse.ArgumentParser(add_help=False)
parser.add_argument('--sog', type=float)
parser.add_argument('--cog', type=float)
parser.add_argument('--heading', type=float)
parser.add_argument('--generate', type=int)
args, _ = parser.parse_known_args()

if args.sog is not None and args.cog is not None and args.heading is not None:
    # Renvoie un numéro de cluster aléatoire entre 0 et 7
    print(random.randint(0, 7))
    sys.exit(0)

# Par défaut (aucun argument), on prélève 5 000 positions aléatoires depuis la base
if len(sys.argv) == 1:
    SAMPLE_SIZE = 5000
    try:
        import mysql.connector as mc
        import pandas as pd
    except ImportError:
        # Ajoute le dossier site-packages utilisateur puis retente
        user_sp = os.path.expanduser(r"~\\AppData\\Roaming\\Python\\Python312\\site-packages")
        if os.path.isdir(user_sp):
            site.addsitedir(user_sp)
        try:
            import mysql.connector as mc
            import pandas as pd
        except ImportError as e:
            print(json.dumps({"error": f"Missing package: {e}"}))
            sys.exit(1)

    DB_CONF = {
        "host": os.getenv("AIS_DB_HOST", "localhost"),
        "user": os.getenv("AIS_DB_USER", "bateau"),
        "password": os.getenv("AIS_DB_PASS", "123456mdp"),
        "database": os.getenv("AIS_DB_NAME", "marine_db"),
    }

    try:
        conn = mc.connect(**DB_CONF)
    except mc.Error as err:
        print(json.dumps({"error": str(err)}))
        sys.exit(1)

    query = (
        "SELECT b.id_bateau, b.MMSI, b.VesselName AS name, b.Length, b.Width, b.Draft, UNIX_TIMESTAMP(p.BaseDateTime) AS ts, "
        "p.LAT AS lat, p.LON AS lon, p.SOG, p.COG, p.Heading AS heading "
        "FROM position_AIS p "
        "JOIN possede po ON p.id_position = po.id_position "
        "JOIN bateau b ON po.id_bateau = b.id_bateau "
        "ORDER BY RAND() LIMIT %s" % SAMPLE_SIZE
    )

    df = pd.read_sql(query, conn)
    if df.empty:
        print("[]")
        sys.exit(0)

    df["cluster"] = [random.randint(0,7) for _ in range(len(df))]
    print(df.to_json(orient="records"))
    sys.exit(0)

# ---- Ci-dessous l'ancien mode basé sur la base de données (agrégation) ----
import os
import sys

try:
    import mysql.connector as mc
    import pandas as pd
    
except ImportError as e:
    # Renvoie une erreur lisible côté PHP
    print(json.dumps({"error": f"Missing package: {e}"}))
    sys.exit(1)

DB_CONF = {
    "host": os.getenv("AIS_DB_HOST", "localhost"),
    "user": os.getenv("AIS_DB_USER", "bateau"),
    "password": os.getenv("AIS_DB_PASS", "123456mdp"),
    "database": os.getenv("AIS_DB_NAME", "marine_db"),
}

try:
    conn = mc.connect(**DB_CONF)
except mc.Error as err:
    print(json.dumps({"error": str(err)}))
    sys.exit(1)

query = (
    "SELECT b.id_bateau, AVG(p.LAT) AS lat, AVG(p.LON) AS lon "
    "FROM bateau b "
    "JOIN possede po ON b.id_bateau = po.id_bateau "
    "JOIN position_AIS p ON p.id_position = po.id_position "
    "GROUP BY b.id_bateau"
)

boats = pd.read_sql(query, conn)
if len(boats) < 2:
    # Pas assez de points, renvoyer cluster 0
    result = [{"id_bateau": int(r.id_bateau), "cluster": 0} for r in boats.itertuples()]
    print(json.dumps(result))
    sys.exit(0)

k = min(4, len(boats))
km = KMeans(n_clusters=k, random_state=0).fit(boats[["lat", "lon"]])
boats["cluster"] = km.labels_

print(boats[["id_bateau", "lat", "lon", "cluster"]].to_json(orient="records"))
