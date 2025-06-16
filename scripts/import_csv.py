#!/usr/bin/env python3
"""Importe un fichier export_IA.csv vers la base MySQL `marine_db`.

Usage:
    python import_csv.py path/to/export_IA.csv

Le script gère :
1. Table `statut`          – insère le code de statut s'il n'existe pas.
2. Table `bateau`          – insère un navire s'il n'existe pas (clé MMSI).
3. Table `position_AIS`    – insère la position et récupère son id.
4. Table `possede`         – lie la position au navire.

Dépendances : mysql-connector-python (pip install mysql-connector-python)
"""
import csv
import datetime as dt
import os
import sys
from typing import Dict

import mysql.connector as mc

DB_CONF = {
    "host": os.getenv("AIS_DB_HOST", "localhost"),
    "user": os.getenv("AIS_DB_USER", "bateau"),
    "password": os.getenv("AIS_DB_PASS", "123456mdp"),
    "database": os.getenv("AIS_DB_NAME", "marine_db"),
    "charset": "utf8mb4",
}



def safe_float(val: str, default: float = 0.0) -> float:
    """Convertit une chaîne en float, gère '', '\\N', None."""
    if val in (None, '', '\\N'):
        return default
    try:
        return float(val)
    except ValueError:
        return default


def safe_int(val: str, default: int = 0) -> int:
    if val in (None, '', '\\N'):
        return default
    try:
        return int(float(val))  # gère valeurs décimales/texte
    except ValueError:
        return default


EXPECTED_COLS = [
    "id", "MMSI", "BaseDateTime", "LAT", "LON", "SOG", "COG", "Heading",
    "VesselName", "IMO", "CallSign", "VesselType", "Status", "Length",
    "Width", "Draft", "Cargo", "TransceiverClass"
]


def iso_to_mysql(dt_str: str) -> str:
    """Convertit 2023-05-25T00:07:27Z en '2023-05-25 00:07:27'.
    Compatible avec Python < 3.7 (sans datetime.fromisoformat)."""
    if dt_str.endswith("Z"):
        dt_str = dt_str[:-1]
    # Essaye différents formats ISO courants
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
        try:
            return dt.datetime.strptime(dt_str, fmt).strftime("%Y-%m-%d %H:%M:%S")
        except ValueError:
            continue
    # Fallback : renvoie la chaîne d'origine
    return dt_str


def get_or_insert(cursor, table: str, column: str, value) -> int:
    """Retourne l'id auto_increment pour la valeur `value` dans `table`.`column`."""
    cursor.execute(f"SELECT id_{table} FROM {table} WHERE {column}=%s", (value,))
    row = cursor.fetchone()
    if row:
        return row[0]
    cursor.execute(f"INSERT INTO {table} ({column}) VALUES (%s)", (value,))
    return cursor.lastrowid


def get_or_insert_ship(cursor, row: Dict[str, str]) -> int:
    cursor.execute("SELECT id_bateau FROM bateau WHERE MMSI=%s", (row["MMSI"],))
    res = cursor.fetchone()
    if res:
        return res[0]
    insert_sql = (
        "INSERT INTO bateau (MMSI, IMO, CallSign, VesselName, VesselType, Length, "
        "Width, Draft, Cargo, TransceiverClass) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"
    )
    cursor.execute(
        insert_sql,
        (
            row["MMSI"], row["IMO"], row["CallSign"], row["VesselName"],
            safe_int(row["VesselType"]), safe_float(row["Length"]), safe_float(row["Width"]),
            safe_float(row["Draft"]), row["Cargo"], row["TransceiverClass"],
        ),
    )
    return cursor.lastrowid


def main(csv_path: str):
    conn = mc.connect(**DB_CONF)
    cur = conn.cursor()
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        missing = [c for c in EXPECTED_COLS if c not in reader.fieldnames]
        if missing:
            print(f"Colonnes manquantes dans CSV : {missing}")
            sys.exit(1)
        count = 0
        for row in reader:
            # Statut
            statut_val = safe_int(row["Status"])
            id_statut = get_or_insert(cur, "statut", "statut", statut_val)

            # Bateau
            id_bateau = get_or_insert_ship(cur, row)

            # Position
            mysql_dt = iso_to_mysql(row["BaseDateTime"])
            cur.execute(
                "INSERT INTO position_AIS (BaseDateTime, LAT, LON, SOG, COG, Heading, id_statut) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s)",
                (
                    mysql_dt,
                    safe_float(row["LAT"]),
                    safe_float(row["LON"]),
                    safe_float(row["SOG"]),
                    safe_float(row["COG"]),
                    safe_float(row["Heading"]),
                    id_statut,
                ),
            )
            id_position = cur.lastrowid

            # Lien possede
            cur.execute(
                "INSERT INTO possede (id_position, id_bateau) VALUES (%s,%s)",
                (id_position, id_bateau),
            )
            count += 1
            if count % 100 == 0:
                conn.commit()
        conn.commit()
    cur.close()
    conn.close()
    print(f"Import terminé : {count} lignes insérées/traitées")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_csv.py export_IA.csv")
        sys.exit(1)
    main(sys.argv[1])
