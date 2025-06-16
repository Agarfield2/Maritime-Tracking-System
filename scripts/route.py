#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json, os, sys, random, traceback

def main():
    """Main function to process request and return data."""
    debug_info = []

    try:
        import mysql.connector as mc
        debug_info.append("Dependency 'mysql.connector' loaded successfully.")
    except ImportError:
        mc = None  # Continue without DB access
        debug_info.append("WARNING: 'mysql.connector' not available; using fallback prediction.")

    if len(sys.argv) < 2:
        debug_info.append("ERROR: MMSI argument is missing in the command line call.")
        print(json.dumps({"error": "MMSI parameter missing.", "debug": debug_info}))
        sys.exit(1)
    
    MMSI = sys.argv[1]
    debug_info.append(f"MMSI = '{MMSI}' received from command line.")

    actual = []
    conn = None
    try:
        DB_CONF = {
            "host": os.getenv("AIS_DB_HOST", "localhost"),
            "user": os.getenv("AIS_DB_USER", "bateau"),
            "password": os.getenv("AIS_DB_PASS", "123456mdp"),
            "database": os.getenv("AIS_DB_NAME", "marine_db"),
        }
        debug_info.append(f"Attempting to connect to DB '{DB_CONF['database']}' on host '{DB_CONF['host']}'")
        conn = mc.connect(**DB_CONF)
        debug_info.append("Database connection successful.")

        cur = conn.cursor(dictionary=True)
        sql_actual = (
            "SELECT p.LAT, p.LON FROM position_AIS p "
            "JOIN possede po ON p.id_position=po.id_position "
            "JOIN bateau b ON po.id_bateau = b.id_bateau "
            "WHERE b.MMSI=%s ORDER BY p.BaseDateTime ASC"
        )
        cur.execute(sql_actual, (MMSI,))
        actual_from_db = cur.fetchall()
        actual = [{'lat': float(r['LAT']), 'lon': float(r['LON'])} for r in actual_from_db]
        # Ne gardons que les 200 derniers points pour limiter la taille du JSON
        if len(actual) > 200:
            actual = actual[-200:]
        debug_info.append(f"Actual trajectory query returned {len(actual)} points.")
        if len(actual) == 0:
            debug_info.append("WARNING: Query returned 0 rows. Check if MMSI exists.")

    except mc.Error as err:
        debug_info.append(f"DATABASE ERROR: {err}")
    except Exception as e:
        debug_info.append(f"An unexpected error occurred: {e}")
        debug_info.append(traceback.format_exc())
    finally:
        if conn and conn.is_connected():
            conn.close()
            debug_info.append("Database connection closed.")

    predicted = None
    if len(actual) >= 2:
        p0, p1 = actual[-1], actual[-2]
        lat_rate = p0['lat'] - p1['lat']
        lon_rate = p0['lon'] - p1['lon']
        predicted = [{
            "lat": p0['lat'] + lat_rate * h, "lon": p0['lon'] + lon_rate * h, "t_plus_h": h
        } for h in (1, 2, 3, 4)]
        debug_info.append("Prediction generated from the last 2 actual points.")
    
    if not predicted:
        def make_random_track():
            lat0, lon0 = 18 + random.random() * 13, -(80 + random.random() * 18)
            lat_rate, lon_rate = random.uniform(-0.5, 0.5), random.uniform(-0.5, 0.5)
            return [{"lat": lat0 + lat_rate*h, "lon": lon0 + lon_rate*h, "t_plus_h": h} for h in (0.25, 0.5, 0.75, 1.0)]
        predicted = make_random_track()
        debug_info.append("Using random fallback track.")

    output_data = {"id_bateau": MMSI, "predicted": predicted, "actual": actual, "debug": debug_info}
    print(json.dumps(output_data))

if __name__ == "__main__":
    main()
    # Assure une terminaison propre avec code 0 pour que PHP n'envoie pas 500
    sys.exit(0)
