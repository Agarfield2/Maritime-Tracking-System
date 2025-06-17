import argparse
import pandas as pd
import numpy as np
import tensorflow as tf
import joblib
from pathlib import Path

SEQUENCE_LENGTH = 20
FEATURE_COLS = ["LAT", "LON", "SOG", "COG", "Heading"]
STANDARD_FEATURES = ["LAT", "LON"]
MINMAX_FEATURES = ["SOG", "COG", "Heading"]

def load_and_prepare_data(csv_path, target_mmsi):
    required_cols = ["MMSI", "BaseDateTime"] + FEATURE_COLS
    data = pd.read_csv(csv_path, low_memory=False)
    data = data[required_cols].copy()
    data["BaseDateTime"] = pd.to_datetime(data["BaseDateTime"], errors="coerce")
    data["MMSI"] = pd.to_numeric(data["MMSI"], errors="coerce")
    for col in FEATURE_COLS:
        data[col] = pd.to_numeric(data[col], errors="coerce")
    data = data.dropna(subset=["MMSI", "BaseDateTime"] + FEATURE_COLS)

    data = data[data["MMSI"] == target_mmsi]
    if data.empty:
        print(f"[ERREUR] Aucun donnée pour MMSI={target_mmsi}")
        return None
    return data

def create_sequences_for_prediction(df, seq_len):
    df = df.sort_values("BaseDateTime").reset_index(drop=True)
    if len(df) < seq_len:
        print(f"[ERREUR] Pas assez de données pour créer une séquence (min {seq_len}, trouvé {len(df)})")
        return None, None
    sequences = []
    timestamps = []
    for i in range(len(df) - seq_len + 1):
        seq_data = df[FEATURE_COLS].iloc[i:i+seq_len].values
        sequences.append(seq_data)
        timestamps.append(df["BaseDateTime"].iloc[i+seq_len-1])
    return np.array(sequences), timestamps

def normalize_features(data, scaler_std_path, scaler_mm_path):
    scaler_std = joblib.load(scaler_std_path)
    scaler_mm = joblib.load(scaler_mm_path)
    data_norm = data.copy()

    if STANDARD_FEATURES:
        std_indices = [FEATURE_COLS.index(col) for col in STANDARD_FEATURES]
        data_norm[:, :, std_indices] = scaler_std.transform(
            data_norm[:, :, std_indices].reshape(-1, len(STANDARD_FEATURES))
        ).reshape(data_norm.shape[0], data_norm.shape[1], len(STANDARD_FEATURES))

    if MINMAX_FEATURES:
        mm_indices = [FEATURE_COLS.index(col) for col in MINMAX_FEATURES]
        data_norm[:, :, mm_indices] = scaler_mm.transform(
            data_norm[:, :, mm_indices].reshape(-1, len(MINMAX_FEATURES))
        ).reshape(data_norm.shape[0], data_norm.shape[1], len(MINMAX_FEATURES))

    return data_norm

def denormalize_predictions(predictions, scaler_std_path):
    scaler_std = joblib.load(scaler_std_path)
    return scaler_std.inverse_transform(predictions)

def predict_with_lstm_model(model_path, scaler_std_path, scaler_mm_path, X_sequences):
    model = tf.keras.models.load_model(
        model_path,
        custom_objects={'mse': tf.keras.losses.MeanSquaredError()}
    )
    X_normalized = normalize_features(X_sequences, scaler_std_path, scaler_mm_path)
    predictions = model.predict(X_normalized, batch_size=32, verbose=0)
    predictions_denorm = denormalize_predictions(predictions, scaler_std_path)
    return predictions_denorm

def main():
    parser = argparse.ArgumentParser(description="Prédiction pour un seul bateau et un horizon donné")
    parser.add_argument('--input', required=True, help="Fichier CSV d'entrée")
    parser.add_argument('--models-dir', required=True, help="Dossier contenant le modèle et scalers")
    parser.add_argument('--output', required=True, help="Fichier CSV de sortie")
    parser.add_argument('--mmsi', type=int, required=True, help="MMSI du bateau à prédire")
    parser.add_argument('--horizon', type=int, required=True, help="Horizon de prédiction en minutes (ex: 10)")

    args = parser.parse_args()

    data = load_and_prepare_data(args.input, args.mmsi)
    if data is None:
        return

    X_sequences, timestamps = create_sequences_for_prediction(data, SEQUENCE_LENGTH)
    if X_sequences is None or len(X_sequences) == 0:
        print("[ERREUR] Pas de séquence créée pour prédiction")
        return

    model_file = f"lstm_{args.horizon}min.h5"
    scaler_std_file = f"std_{args.horizon}min.pkl"
    scaler_mm_file = f"mm_{args.horizon}min.pkl"

    model_path = Path(args.models_dir) / model_file
    scaler_std_path = Path(args.models_dir) / scaler_std_file
    scaler_mm_path = Path(args.models_dir) / scaler_mm_file

    if not model_path.exists() or not scaler_std_path.exists() or not scaler_mm_path.exists():
        print("[ERREUR] Modèle ou scalers manquants pour cet horizon")
        return

    preds = predict_with_lstm_model(str(model_path), str(scaler_std_path), str(scaler_mm_path), X_sequences)
    if preds is None:
        print("[ERREUR] Prédiction échouée")
        return

    df_out = pd.DataFrame({
        "MMSI": args.mmsi,
        "BaseDateTime": timestamps,
        "Predicted_LAT": preds[:, 0],
        "Predicted_LON": preds[:, 1],
    })

    df_out.to_csv(args.output, index=False)
    print(f"[INFO] Prédictions sauvegardées dans {args.output}")

if __name__ == "__main__":
    main()
