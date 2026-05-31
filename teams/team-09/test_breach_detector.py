import pandas as pd

from utils.data_cleaner import clean_data

from utils.breach_detector import (
    detect_excursions,
    get_excursion_statistics
)

df = pd.read_csv(
    "data/healthcare_iot_target_dataset.csv"
)

df = clean_data(df)

results = detect_excursions(df)

print("Total Excursions Found:")
print(len(results))

if results:
    print(results[0])

stats = get_excursion_statistics(results)

print("\nStatistics:")
print(stats)