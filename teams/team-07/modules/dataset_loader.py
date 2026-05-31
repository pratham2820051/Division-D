import pandas as pd

def load_routes():

    df = pd.read_csv("data/routes.csv")

    return df[
        [
            'route_id',
            'route_long_name'
        ]
    ]