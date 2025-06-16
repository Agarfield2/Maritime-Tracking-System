#!/usr/bin/env python3
"""Clusterise les navires selon leur position moyenne via K-Means.
Retour JSON: [{"id_bateau":int, "cluster":int}]
Dépendances: pandas, scikit-learn, mysql-connector-python
"""
import json
import os
import sys

try:
    import mysql.connector as mc
    import pandas as pd
    from sklearn.cluster import KMeans
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

print(boats[["id_bateau", "cluster"]].to_json(orient="records"))
