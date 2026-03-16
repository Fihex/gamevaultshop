
# Game Vault - The Ultimate Beginner's Deployment Guide

This guide explains how to take the code from your computer and make it run on the internet using a **VPS** (Virtual Private Server).

## 🌍 The Two Paths

You have two ways to deploy this. Choose **one**:

### Path A: Manual Deployment (The "Hands-On" Way)
*   **Analogy:** Like building IKEA furniture. You have to install the tools (Java, Node.js), assemble the pieces (Build), and place them in the room (Folders).
*   **Pros:** You learn exactly how Linux works. Easier to debug specific files.
*   **Cons:** Takes more steps. If you move to a new server, you have to do it all again.

### Path B: Docker Deployment (The "Container" Way)
*   **Analogy:** Like a shipping container. You pack your furniture in a box (Image) at home. You ship the box to the server. The server just opens the box, and the room is ready.
*   **Pros:** Very clean. "It works on my machine" means it works on the server. One command to start everything.
*   **Cons:** Learning curve for the `Dockerfile` syntax (though I provided them for you).

---

## 🛠️ Prerequisites (For Both Paths)

1.  **A Linux VPS:**
    *   Rent one from DigitalOcean, Linode, AWS, or Hetzner.
    *   **OS:** Choose **Ubuntu 22.04 LTS**.
    *   **Specs:** At least 2GB RAM (Java is heavy).

2.  **A Domain Name (Optional):**
    *   Bought from Namecheap, GoDaddy, etc. (e.g., `mygamevault.com`).

3.  **Tools on Your PC:**
    *   **Terminal** (Mac/Linux) or **PowerShell/Putty** (Windows) to control the server.
    *   **FileZilla** (Free) to upload files visually.

---

# 🚀 Phase 1: Connecting & Preparing

Before choosing Path A or B, do this first.

### 1. Log into your Server
You will receive an IP address (e.g., `123.45.67.89`) and a password for the `root` user from your VPS provider.

**Open your Terminal/PowerShell and type:**
```bash
ssh root@123.45.67.89
# It will ask for your password. You won't see the letters as you type. Hit Enter.
```

### 2. Update the Server
Once logged in, run this to update existing software:
```bash
apt update && apt upgrade -y
```

---

# 🛣️ Path A: Manual Deployment

### 1. Install Necessary Software
We need to install the programs that run your code.

```bash
# Install Java (for Backend), Node.js (for Frontend), Nginx (Web Server), and Postgres (Database)
sudo apt install openjdk-17-jdk postgresql postgresql-contrib nginx certbot python3-certbot-nginx -y

# Install Node.js 20 (Newer version)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Set up the Database
We need to create a "room" in the database for your app.

```bash
# Switch to the postgres user
sudo -u postgres psql

# You are now in the SQL shell. Run these lines one by one:
CREATE DATABASE gamevault;
CREATE USER vaultuser WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE gamevault TO vaultuser;
GRANT ALL ON SCHEMA public TO vaultuser;
\q
# The \q command exits the SQL shell
```

### 3. Upload Your Files
We will put your code in `/var/www/gamevault`.

1.  **On Server:** Create the folder.
    ```bash
    mkdir -p /var/www/gamevault/backend
    mkdir -p /var/www/gamevault/frontend
    ```
2.  **On Your PC:** Open **FileZilla**.
    *   **Host:** `sftp://123.45.67.89` (Your VPS IP)
    *   **User:** `root`
    *   **Pass:** Your VPS password
    *   **Connect.**
3.  **Transfer:**
    *   Drag contents of your local `backend` folder -> Server `/var/www/gamevault/backend`.
    *   Drag contents of your local `root` (frontend) -> Server `/var/www/gamevault/frontend`.

### 4. Setup Backend (Spring Boot)

1.  **Go to the folder:**
    ```bash
    cd /var/www/gamevault/backend
    ```
2.  **Make it executable (if using Gradle):**
    ```bash
    chmod +x gradlew
    ```
3.  **Build the App (Turn code into a runnable file):**
    ```bash
    # If using Maven (pom.xml exists):
    apt install maven -y
    mvn clean package -DskipTests
    
    # If using Gradle (build.gradle exists):
    ./gradlew build -x test
    ```
4.  **Create a Service:**
    We use `systemd` to keep the app running in the background, even if you disconnect.
    
    `nano /etc/systemd/system/gamevault.service`
    
    *Paste this inside (Right-click to paste in Terminal):*
    ```ini
    [Unit]
    Description=GameVault Backend
    After=network.target

    [Service]
    User=root
    WorkingDirectory=/var/www/gamevault/backend
    # IMPORTANT: Check your target/ folder. The name might be slightly different.
    ExecStart=/usr/bin/java -jar target/gamevault-backend-0.0.1-SNAPSHOT.jar
    Restart=always

    [Install]
    WantedBy=multi-user.target
    ```
    *Save: Press `Ctrl+X`, then `Y`, then `Enter`.*

5.  **Start it:**
    ```bash
    systemctl enable gamevault
    systemctl start gamevault
    ```

### 5. Setup Frontend (React)

1.  **Go to the folder:**
    ```bash
    cd /var/www/gamevault/frontend
    ```
2.  **Configure API URL:**
    We need to tell the frontend to look for the API on the same domain (`/api`), not localhost:8080.
    
    `nano constants.ts`
    *   Change `USE_MOCK_DATA` to `false`.
    *   Change `API_BASE_URL` to `'/api'`. (Important: relative path).
3.  **Build:**
    ```bash
    npm install
    npm run build
    ```
    This creates a `dist` folder. This is the only thing Nginx needs.

### 6. Setup Nginx (The Traffic Controller)

Nginx listens for visitors and decides: "Is this a website request? Show `dist/index.html`. Is this a data request? Send to `Java Backend`."

1.  **Create Config:**
    `nano /etc/nginx/sites-available/gamevault`

2.  **Paste Config (Choose Scenario):**

    **Scenario A: Just an IP Address (No Domain)**
    ```nginx
    server {
        listen 80;
        server_name _; # Catch all

        root /var/www/gamevault/frontend/dist;
        index index.html;

        # Serve Frontend
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Proxy API to Java
        location /api {
            proxy_pass http://localhost:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
    ```

    **Scenario B: With a Domain (e.g., example.com)**
    *   Replace `example.com` with your actual domain.
    *   This config forces `www` (e.g. `example.com` -> `www.example.com`).

    ```nginx
    # 1. Redirect root to www
    server {
        listen 80;
        server_name example.com;
        return 301 $scheme://www.example.com$request_uri;
    }

    # 2. Main Server
    server {
        listen 80;
        server_name www.example.com;

        root /var/www/gamevault/frontend/dist;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api {
            proxy_pass http://localhost:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
    ```

3.  **Enable and Restart:**
    ```bash
    ln -s /etc/nginx/sites-available/gamevault /etc/nginx/sites-enabled/
    rm /etc/nginx/sites-enabled/default
    systemctl restart nginx
    ```

4.  **Add HTTPS (SSL) - Domain Only:**
    ```bash
    certbot --nginx -d example.com -d www.example.com
    ```

---

# 📦 Path B: Docker Deployment

This method creates "images" of your app. You prepare everything **on your computer first**, then upload one folder to the VPS.

### 1. Prepare Locally (On Your PC)

1.  **Create `Dockerfile` in `/backend` folder:**
    (Create a new file named `Dockerfile` inside the backend folder).
    ```dockerfile
    # Use Java 17 to build
    FROM maven:3.8.5-openjdk-17 AS build
    WORKDIR /app
    COPY pom.xml .
    COPY src ./src
    # Build the app inside the container
    RUN mvn clean package -DskipTests

    # Run the app
    FROM openjdk:17-jdk-slim
    WORKDIR /app
    COPY --from=build /app/target/*.jar app.jar
    EXPOSE 8080
    ENTRYPOINT ["java", "-jar", "app.jar"]
    ```

2.  **Create `Dockerfile` in `/root` (Frontend) folder:**
    (Create a new file named `Dockerfile` next to `package.json`).
    ```dockerfile
    # Build React App
    FROM node:20-alpine as build
    WORKDIR /app
    COPY package*.json ./
    RUN npm install
    COPY . .
    # Ensure constants.ts has API_BASE_URL='/api' before building!
    RUN npm run build

    # Serve with Nginx
    FROM nginx:alpine
    COPY --from=build /app/dist /usr/share/nginx/html
    # Default Nginx config in container needs a tweak for React Router
    RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]
    ```

3.  **Create `docker-compose.yml` in Root Folder:**
    (This file tells Docker how to run everything together).
    ```yaml
    version: '3.8'
    services:
      # The Database Container
      db:
        image: postgres:15
        environment:
          POSTGRES_DB: gamevault
          POSTGRES_USER: vaultuser
          POSTGRES_PASSWORD: secure_password
        volumes:
          - postgres_data:/var/lib/postgresql/data

      # The Backend Container
      backend:
        build: ./backend
        ports:
          - "8080:8080"
        environment:
          # Special URL to talk to 'db' container
          spring.datasource.url: jdbc:postgresql://db:5432/gamevault
          spring.datasource.username: vaultuser
          spring.datasource.password: secure_password
        depends_on:
          - db

      # The Frontend Container
      frontend:
        build: .
        ports:
          - "8081:80" # Maps port 8081 on VPS to port 80 inside container
        depends_on:
          - backend

    volumes:
      postgres_data:
    ```

### 2. Upload to VPS
1.  Use **FileZilla**.
2.  Create a folder `/opt/gamevault` on the server.
3.  Upload your entire project folder (excluding `node_modules` or `target` folders to save time) to `/opt/gamevault`.

### 3. Run on VPS
1.  **Install Docker:**
    ```bash
    apt update
    apt install docker.io docker-compose-v2 -y
    ```
2.  **Run the App:**
    ```bash
    cd /opt/gamevault
    docker compose up -d --build
    ```
    *   `-d` means "detached" (run in background).
    *   `--build` forces it to create the images.

### 4. Expose to Public (Nginx)
Docker is running your frontend on port `8081` (as defined in compose file). We need Nginx to forward port 80 (public web) to 8081.

1.  **Install Nginx on Host:**
    ```bash
    apt install nginx certbot python3-certbot-nginx -y
    ```
2.  **Configure:**
    `nano /etc/nginx/sites-available/gamevault`
    
    ```nginx
    server {
        listen 80;
        server_name YOUR_DOMAIN_OR_IP;

        location / {
            proxy_pass http://127.0.0.1:8081; # Forward to Docker Frontend
            proxy_set_header Host $host;
        }

        location /api {
            proxy_pass http://127.0.0.1:8080; # Forward to Docker Backend
            proxy_set_header Host $host;
        }
    }
    ```
3.  **Restart Nginx:**
    ```bash
    ln -s /etc/nginx/sites-available/gamevault /etc/nginx/sites-enabled/
    rm /etc/nginx/sites-enabled/default
    systemctl restart nginx
    ```

---

# 🌐 Part 3: Using Cloudflare (Optional but Recommended)

If you have a domain, Cloudflare makes life easier.

1.  **Create Account:** Go to Cloudflare, add your site.
2.  **Change Nameservers:** Update your domain registrar (GoDaddy/Namecheap) to point to Cloudflare's nameservers.
3.  **DNS Records:**
    *   Add `A` record: `@` points to `YOUR_VPS_IP`.
    *   Add `CNAME` record: `www` points to `YOUR_DOMAIN.com`.
4.  **SSL:**
    *   In Cloudflare SSL/TLS settings, set to **Full**.
    *   On your VPS, run `certbot --nginx` to generate a certificate so Cloudflare can talk to your VPS securely.

---

# ❓ Common Questions for Beginners

**Q: How do I update my code?**
*   **Manual:** Upload the new file via FileZilla, then run the build command again (e.g., `npm run build` or `mvn package`), then `systemctl restart gamevault`.
*   **Docker:** Upload files, then run `docker compose up -d --build`. It replaces the old container with a new one.

**Q: "Connection Refused"?**
*   Check if your firewall is blocking ports. Run `ufw allow 80`, `ufw allow 443`, `ufw allow 8080`.

**Q: My images aren't loading.**
*   Make sure you uploaded the `uploads` folder in the backend if you had one locally.
*   Make sure Nginx allows large uploads: Add `client_max_body_size 10M;` inside your `nginx.conf`.
