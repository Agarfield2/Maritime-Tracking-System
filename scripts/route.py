#!/usr/bin/env python3
"""Prédit la trajectoire future sur 1 h d'un navire (extrapolation simpliste).
Appel: python route.py <id_bateau>
Sortie JSON: {"id_bateau":int, "predicted_positions":[{"lat":..,"lon":..}, ...]}
"""
import json, os, sys, datetime

if len(sys.argv) < 2:
    print(json.dumps({"error": "id_bateau manquant"}))
    sys.exit(1)

try:
    import mysql.connector as mc
    import pandas as pd
except ImportError as e:
    print(json.dumps({"error": f"Missing package: {e}"}))
    sys.exit(1)

ID = int(sys.argv[1])
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

sql = "SELECT BaseDateTime, LAT, LON, SOG, COG FROM position_AIS p JOIN possede po ON p.id_position=po.id_position WHERE po.id_bateau=%s ORDER BY BaseDateTime DESC LIMIT 2"
track = pd.read_sql(sql, conn, params=[ID])

if len(track) < 2:
    print(json.dumps({"error": "Pas assez de points"}))
    sys.exit(0)

p1, p0 = track.iloc[1], track.iloc[0]  # plus ancien, plus récent
# delta en heures
hours = (p0.BaseDateTime - p1.BaseDateTime).total_seconds() / 3600.0
if hours == 0:
    print(json.dumps({"error": "Delta temps nul"}))
    sys.exit(0)
# vitesses
lat_rate = (p0.LAT - p1.LAT) / hours
lon_rate = (p0.LON - p1.LON) / hours

future = []
for h in [0.25, 0.5, 0.75, 1.0]:
    future.append({
        "lat": p0.LAT + lat_rate * h,
        "lon": p0.LON + lon_rate * h,
        "t_plus_h": h
    })

print(json.dumps({"id_bateau": ID, "predicted_positions": future}))
