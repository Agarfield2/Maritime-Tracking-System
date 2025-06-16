#!/usr/bin/env python3
"""Stub de clustering : à remplacer par ton modèle.
Lit la base de données (ou un CSV) et renvoie un JSON [{mmsi:..., cluster:...}, ...]
"""
import json, sys

# TODO: charger les données et effectuer un clustering réel
mock = [
    {"MMSI": "123456789", "cluster": 1},
    {"MMSI": "987654321", "cluster": 2}
]
print(json.dumps(mock))
