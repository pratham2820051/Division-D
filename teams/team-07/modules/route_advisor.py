def suggest_route(cause,duration):

    duration=int(duration)

    if duration>=40:

        return(
            "Use Metro / Parallel BMTC Route",
            "+15 minutes"
        )

    elif duration>=20:

        return(
            "Use Alternate BMTC Service",
            "+8 minutes"
        )

    else:

        return(
            "Continue Current Route",
            "+3 minutes"
        )