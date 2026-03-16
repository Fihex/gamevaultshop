
import json
import requests
import sys
import os
import csv

# --- CONFIGURATION ---
# If running on VPS, keep localhost:8080 if running script on the VPS itself.
# If running locally connecting to VPS, change to http://YOUR_VPS_IP/api
API_URL = "http://localhost:8080/api"

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin" 
# ---------------------

def login():
    """Authenticates with the backend and returns a JWT token."""
    print(f"🔑 Logging in as {ADMIN_USERNAME}...")
    try:
        resp = requests.post(f"{API_URL}/auth/signin", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        if resp.status_code == 200:
            return resp.json().get("token")
        else:
            print(f"❌ Login failed: {resp.text}")
            print("   Ensure you have created the admin user in the web app first.")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("   Make sure the backend is running.")
        sys.exit(1)

# Global cache to prevent fetching the list 100 times
CATEGORY_CACHE = []

def refresh_category_cache(headers):
    """Fetches current categories from DB to avoid duplicates."""
    global CATEGORY_CACHE
    resp = requests.get(f"{API_URL}/categories", headers=headers)
    if resp.status_code == 200:
        CATEGORY_CACHE = resp.json()

def get_or_create_category(headers, type_name, cat_name):
    """
    1. Checks if category exists in cache.
    2. If yes, returns it.
    3. If no, POSTs to API to create it, adds to cache, and returns it.
    """
    global CATEGORY_CACHE
    
    if not cat_name or not cat_name.strip():
        return None
        
    cat_name = cat_name.strip()

    # 1. Check Cache (Case-insensitive check)
    existing = next((c for c in CATEGORY_CACHE if c['type'] == type_name and c['name'].lower() == cat_name.lower()), None)
    
    if existing:
        return existing
    
    # 2. Create New Category
    print(f"   ✨ Creating new {type_name}: {cat_name}")
    create_payload = {
        "type": type_name,
        "name": cat_name,
        "isVisible": True
    }
    
    resp = requests.post(f"{API_URL}/categories", headers=headers, json=create_payload)
    
    if resp.status_code == 200:
        new_cat = resp.json()
        CATEGORY_CACHE.append(new_cat) # Update cache immediately
        return new_cat
    else:
        print(f"   ⚠️ Failed to create category {cat_name}: {resp.text}")
        return None

def process_game_import(headers, game_data):
    """Sends a single game payload to the API"""
    title = game_data.get("title")
    print(f"➡️ Processing: {title}")

    resp = requests.post(f"{API_URL}/games", headers=headers, json=game_data)
    
    if resp.status_code == 200:
        print("   ✅ Imported successfully")
        return True
    else:
        print(f"   ❌ Failed: {resp.text}")
        return False

def import_from_json(filename, headers):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError:
        print("❌ Invalid JSON file format.")
        return

    print(f"📦 Found {len(data)} games in JSON file...")
    success_count = 0
    
    for entry in data:
        # 1. Process Categories
        final_categories = []
        for p_name in entry.get("platforms", []):
            cat = get_or_create_category(headers, "PLATFORM", p_name)
            if cat: final_categories.append(cat)
        for g_name in entry.get("genres", []):
            cat = get_or_create_category(headers, "GENRE", g_name)
            if cat: final_categories.append(cat)

        # 2. Payload
        payload = {
            "title": entry.get("title"),
            "description": entry.get("description", ""),
            "price": entry.get("price", 0.0),
            "quantity": entry.get("quantity", 0),
            "images": entry.get("images", []),
            "categories": final_categories
        }

        if process_game_import(headers, payload):
            success_count += 1
            
    print(f"\n🎉 Finished! Imported {success_count}/{len(data)} games.")

def import_from_csv(filename, headers):
    games_payloads = []
    
    try:
        with open(filename, mode='r', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile)
            
            # Normalize headers (strip spaces, lowercase)
            reader.fieldnames = [name.strip().lower() for name in reader.fieldnames]
            
            for row in reader:
                # CSV Columns: title, quantity, price, platform
                title = row.get('title', '').strip()
                if not title: continue
                
                try:
                    price = float(row.get('price', 0))
                    quantity = int(row.get('quantity', 0))
                except ValueError:
                    print(f"   ⚠️ Skipping {title}: Invalid price or quantity format")
                    continue

                platform_name = row.get('platform', '').strip()
                
                # Create Category
                categories = []
                if platform_name:
                    # Handle multiple platforms if separated by | (optional feature)
                    if '|' in platform_name:
                        platforms = platform_name.split('|')
                        for p in platforms:
                            cat = get_or_create_category(headers, "PLATFORM", p)
                            if cat: categories.append(cat)
                    else:
                        cat = get_or_create_category(headers, "PLATFORM", platform_name)
                        if cat: categories.append(cat)

                payload = {
                    "title": title,
                    "description": f"{title} - {platform_name}", # Default description if missing
                    "price": price,
                    "quantity": quantity,
                    "images": [], # CSV doesn't have images, API handles empty list
                    "categories": categories
                }
                games_payloads.append(payload)
                
    except Exception as e:
        print(f"❌ Error reading CSV: {e}")
        return

    print(f"📦 Found {len(games_payloads)} games in CSV file...")
    success_count = 0
    for payload in games_payloads:
        if process_game_import(headers, payload):
            success_count += 1

    print(f"\n🎉 Finished! Imported {success_count}/{len(games_payloads)} games.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 import_games.py <filename>")
        print("Supported formats: .json, .csv")
        sys.exit(1)

    filename = sys.argv[1]
    if not os.path.exists(filename):
        print(f"❌ File not found: {filename}")
        sys.exit(1)

    # Login & Cache
    token = login()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    refresh_category_cache(headers)

    # Determine format
    if filename.lower().endswith('.csv'):
        import_from_csv(filename, headers)
    elif filename.lower().endswith('.json'):
        import_from_json(filename, headers)
    else:
        print("❌ Unknown file extension. Please use .csv or .json")
