import plotly.express as px
import plotly.graph_objects as go


def temperature_graph(df):

    fig = px.line(
        df,
        x="timestamp",
        y="temp_mean",
        title="Temperature Timeline"
    )

    fig.add_hline(
        y=2,
        line_dash="dash"
    )

    fig.add_hline(
        y=6,
        line_dash="dash"
    )

    return fig


def humidity_graph(df):

    fig = px.line(
        df,
        x="timestamp",
        y="hum_mean",
        title="Humidity Timeline"
    )

    return fig


def health_index_graph(df):

    fig = px.line(
        df,
        x="timestamp",
        y="Health_Index",
        title="Health Index Trend"
    )

    return fig


def temperature_distribution(df):

    fig = px.histogram(
        df,
        x="temp_mean",
        nbins=30,
        title="Temperature Distribution"
    )

    return fig


def route_analysis(df):

    route_df = (
        df.groupby("route")["temp_mean"]
        .mean()
        .reset_index()
    )

    fig = px.bar(
        route_df,
        x="route",
        y="temp_mean",
        title="Average Temperature by Route"
    )

    return fig


def product_analysis(df):

    product_df = (
        df.groupby("product_type")["Health_Index"]
        .mean()
        .reset_index()
    )

    fig = px.bar(
        product_df,
        x="product_type",
        y="Health_Index",
        title="Health Index by Product Type"
    )

    return fig