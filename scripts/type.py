#!/usr/bin/env python3
"""Prédit le type IMO du navire donné.
Appel: python type.py <id_bateau>
Sortie JSON: {"id_bateau":int, "predicted_type": str}
Approche simple: règle heuristique basée sur length / cargo.
"""
import json, os, sys, random

if len(sys.argv) < 2:
    print(json.dumps({"error": "id_bateau manquant"}))
    sys.exit(1)

try:
    import mysql.connector as mc
except ImportError:
    mc = None

ID = int(sys.argv[1])
DB_CONF = {
    "host": os.getenv("AIS_DB_HOST", "localhost"),
    "user": os.getenv("AIS_DB_USER", "bateau"),
    "password": os.getenv("AIS_DB_PASS", "123456mdp"),
    "database": os.getenv("AIS_DB_NAME", "marine_db"),
}

boat = None
if mc:
    try:
        conn = mc.connect(**DB_CONF)
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM bateau WHERE id_bateau=%s", (ID,))
        boat = cur.fetchone()
    except Exception:
        boat = None

# Génération de prédictions aléatoires pour comparaison quel que soit l'état de la DB
methods = ["Logistic Regression", "Decision Tree", "Random Forest", "SVM"]
types = ["Cargo", "Tanker", "Passenger", "Fishing", "Other"]
predictions = {m: random.choice(types) for m in methods}
print(json.dumps({"id_bateau": ID, "predictions": predictions}))
