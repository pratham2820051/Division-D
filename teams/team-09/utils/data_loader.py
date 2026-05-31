import pandas as pd


REQUIRED_COLUMNS = [
    "timestamp",
    "temp_mean",
    "temp_min",
    "temp_max",
    "hum_mean",
    "Health_Index"
]


def load_data(file):

    try:
        df = pd.read_csv(file)

        return df

    except Exception as e:
        raise Exception(f"Error loading dataset: {e}")


def validate_columns(df):

    missing = []

    for col in REQUIRED_COLUMNS:

        if col not in df.columns:
            missing.append(col)

    return missing


def prepare_timestamp(df):

    df["timestamp"] = pd.to_datetime(df["timestamp"])

    df = df.sort_values("timestamp")

    return df