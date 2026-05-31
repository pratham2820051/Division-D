import pandas as pd
import numpy as np


def clean_data(df):

    # Remove duplicates
    df = df.drop_duplicates()

    # Convert timestamp
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    # Sort
    df = df.sort_values("timestamp")

    # Fill missing numeric values

    numeric_cols = df.select_dtypes(include=np.number).columns

    for col in numeric_cols:
        df[col] = df[col].fillna(df[col].median())

    # Remove unrealistic temperatures

    df = df[
        (df["temp_mean"] >= -20)
        &
        (df["temp_mean"] <= 60)
    ]

    return df


def create_features(df):

    # Temperature range

    df["temp_range"] = (
        df["temp_max"]
        - df["temp_min"]
    )

    # Hour

    df["hour"] = df["timestamp"].dt.hour

    # Date

    df["date"] = df["timestamp"].dt.date

    # Temperature status

    df["temp_status"] = np.where(
        (df["temp_mean"] >= 2)
        &
        (df["temp_mean"] <= 6),
        "Safe",
        "Excursion"
    )

    return df


def get_summary(df):

    summary = {

        "records":
        len(df),

        "avg_temp":
        round(df["temp_mean"].mean(), 2),

        "max_temp":
        round(df["temp_mean"].max(), 2),

        "min_temp":
        round(df["temp_mean"].min(), 2),

        "avg_humidity":
        round(df["hum_mean"].mean(), 2),

        "avg_health":
        round(df["Health_Index"].mean(), 2)
    }

    return summary