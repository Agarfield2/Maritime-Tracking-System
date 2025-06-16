#!/usr/bin/env python3
"""Prédit le type IMO du navire donné.
Appel: python type.py <id_bateau>
Sortie JSON: {"id_bateau":int, "predicted_type": str}
Approche simple: règle heuristique basée sur length / cargo.
"""
import json, os, sys

if len(sys.argv) < 2:
    print(json.dumps({"error": "id_bateau manquant"}))
    sys.exit(1)

try:
    import mysql.connector as mc
except ImportError as e:
    print(json.dumps({"error": f"Missing package: {e}"}))
    sys.exit(1)

ID = int(sys.argv[1])
DB_CONF = {
    "host": os.getenv("AIS_DB_HOST", "localhost"),
    "user": os.getenv("AIS_DB_USER", "root"),
    "password": os.getenv("AIS_DB_PASS", ""),
    "database": os.getenv("AIS_DB_NAME", "navires"),
}

try:
    conn = mc.connect(**DB_CONF)
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM bateau WHERE id_bateau=%s", (ID,))
    boat = cur.fetchone()
except mc.Error as err:
    print(json.dumps({"error": str(err)}))
    sys.exit(1)

if not boat:
    print(json.dumps({"error": "Navire introuvable"}))
    sys.exit(1)

# Règle heuristique très basique
if boat["Length"] and boat["Length"] > 200:
    predicted = "Tanker"
elif "CARGO" in (boat["Cargo"] or "").upper():
    predicted = "Cargo"
else:
    predicted = "Autre"

print(json.dumps({"id_bateau": ID, "predicted_type": predicted}))
