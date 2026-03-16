
# Game Vault - Data Import Guide

This guide explains how to import game data into the Game Vault Postgres database using the provided Python script. The script supports both **CSV** and **JSON** formats.

## 1. How it Works

We do **not** import data directly into PostgreSQL using SQL commands. Why?
1.  **Relationships**: Games are linked to Categories (Platforms, Genres) in a separate join table (`game_categories`).
2.  **Data Integrity**: The API handles creating ID numbers and ensuring categories exist.
3.  **Automatic Categories**: This script checks if "PlayStation 5" exists. If not, it creates it for you automatically.

## 2. Prerequisites

You need **Python 3** installed.
```bash
# Check if python is installed
python3 --version

# Install the requests library (required to talk to the API)
pip install requests
```

## 3. Using the CSV File

Format your CSV with these headers (order doesn't matter):
`title`, `quantity`, `price`, `platform`

### Multiple Platforms
To assign a game to multiple platforms, separate them with a pipe symbol `|`.

**Example `games_import.csv`:**
```csv
title,quantity,price,platform
ARK: Survival Evolved,0,31.99,PlayStation 4|PC
God of War,10,49.99,PlayStation 5
Elden Ring,5,59.99,PC|PlayStation 5|Xbox Series X
```

## 4. Running Locally (Windows/Mac/Linux)

1.  Ensure your **Game Vault Backend** is running (`localhost:8080`).
2.  Ensure you have created an admin user in the web app (Username: `admin_user`, Password: `password` - or update script variables).
3.  Run the script:

```bash
python3 import_games.py games_import.csv
```

## 5. Running on VPS

If your application is deployed on a VPS, follow these steps.

### Step 1: Upload Files
Upload `import_games.py` and your CSV file to the VPS. You can use `scp` (Linux/Mac) or FileZilla/WinSCP (Windows).

**Command Line Example:**
```bash
# Upload script
scp import_games.py root@YOUR_VPS_IP:/var/www/gamevault/

# Upload data
scp games_import.csv root@YOUR_VPS_IP:/var/www/gamevault/
```

### Step 2: Connect to VPS
```bash
ssh root@YOUR_VPS_IP
```

### Step 3: Install Python Dependencies
```bash
sudo apt update
sudo apt install python3-pip
pip3 install requests
```

### Step 4: Run Import
Navigate to the folder and run the script. 
*Note: Since the script runs **on the VPS**, it can still talk to `localhost:8080` because the backend is running on the same machine.*

```bash
cd /var/www/gamevault/
python3 import_games.py games_import.csv
```
