import os
import argparse
import pandas as pd
from joblib import load

# Chemins des modèles
MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'models'))
PREPROCESSOR_PATH = os.path.join(MODEL_DIR, 'preprocessor.joblib')
CLASSIFIER_PATH = os.path.join(MODEL_DIR, 'classifier.joblib')

# Colonnes attendues
FEATURES = ['SOG', 'COG', 'Heading', 'Length', 'Width', 'Draft']

def parse_args():
    parser = argparse.ArgumentParser(description="Prédiction du type de navire à partir de ses caractéristiques.")

    for feature in FEATURES:
        parser.add_argument(f'--{feature}', type=float, required=True, help=f"Valeur de {feature}")

    return parser.parse_args()

def main():
    args = parse_args()

    # Récupération des données dans le bon ordre
    input_data = {feature: getattr(args, feature) for feature in FEATURES}

    # Création du DataFrame
    X = pd.DataFrame([input_data])

    # Chargement des modèles
    preprocessor = load(PREPROCESSOR_PATH)
    clf = load(CLASSIFIER_PATH)

    # Prétraitement et prédiction
    X_prep = preprocessor.transform(X)
    prediction = clf.predict(X_prep)

    print(f"\nCaractéristiques du navire :")
    for k, v in input_data.items():
        print(f"  {k} : {v}")

    print(f"\n Type de navire prédit : {prediction[0]}")

if __name__ == '__main__':
    main()