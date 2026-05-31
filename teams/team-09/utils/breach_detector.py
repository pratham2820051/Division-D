from utils.severity_classifier import classify_severity


SAFE_LIMIT = 6


def detect_excursions(df):

    excursions = []

    for bag_id, bag_data in df.groupby("bag_id"):

        breach_active = False

        start_time = None

        max_temp = 0

        for _, row in bag_data.iterrows():

            current_temp = row["temp_max"]

            current_time = row["timestamp"]

            if current_temp > SAFE_LIMIT:

                if not breach_active:

                    breach_active = True

                    start_time = current_time

                    max_temp = current_temp

                else:

                    max_temp = max(
                        max_temp,
                        current_temp
                    )

            else:

                if breach_active:

                    end_time = current_time

                    duration_minutes = (
                        end_time - start_time
                    ).total_seconds() / 60

                    excursions.append({

                        "bag_id": bag_id,

                        "start_time": start_time,

                        "end_time": end_time,

                        "duration_minutes": round(duration_minutes, 2),

                        "max_temperature": round(max_temp, 2),

                        "severity": classify_severity(max_temp)
                    })

                    breach_active = False

        # Handle excursion that continues until
        # the last record of the bag

        if breach_active:

            end_time = bag_data.iloc[-1]["timestamp"]

            duration_minutes = (
                end_time - start_time
            ).total_seconds() / 60

            excursions.append({

                "bag_id": bag_id,

                "start_time": start_time,

                "end_time": end_time,

                "duration_minutes": round(duration_minutes, 2),

                "max_temperature": round(max_temp, 2),

                "severity": classify_severity(max_temp)
            })

    return excursions


def get_excursion_statistics(excursions):

    if not excursions:

        return {
            "total_excursions": 0,
            "avg_duration": 0,
            "longest_duration": 0,
            "max_temperature": 0
        }

    total_excursions = len(excursions)

    avg_duration = sum(
        e["duration_minutes"]
        for e in excursions
    ) / total_excursions

    longest_duration = max(
        e["duration_minutes"]
        for e in excursions
    )

    max_temperature = max(
        e["max_temperature"]
        for e in excursions
    )

    return {

        "total_excursions":
        total_excursions,

        "avg_duration":
        round(avg_duration, 2),

        "longest_duration":
        round(longest_duration, 2),

        "max_temperature":
        round(max_temperature, 2)
    }