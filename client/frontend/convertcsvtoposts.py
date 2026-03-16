import pandas as pd
from sqlalchemy import create_engine

# ---------------------------------------------------
# 1. Load your CSV (line 1 = header: title, quantity, price)
# ---------------------------------------------------
# Load CSV with correct separator
df = pd.read_csv("games.csv", sep=";")

# Ensure correct column names
df = df.rename(
    columns={df.columns[0]: "title", df.columns[1]: "quantity", df.columns[2]: "price"}
)

# Keep only required columns
df = df[["title", "quantity", "price"]]

# ---------------------------------------------------
# 2. Connect to PostgreSQL
# ---------------------------------------------------
user = "postgres"
password = "83ythg22hy92eh"
host = "localhost"
port = 5432
database = "gamevaultgo"

engine = create_engine(f"postgresql://{user}:{password}@{host}:{port}/{database}")

# ---------------------------------------------------
# 3. Insert CSV rows into PostgreSQL table "games"
# ---------------------------------------------------
# Insert data into games table
df.to_sql("games", engine, index=False, if_exists="append")

print("CSV successfully inserted!")
