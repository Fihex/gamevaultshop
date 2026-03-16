

# Game Vault - Universal Deployment Guide

This guide covers how to deploy the Game Vault application to a Linux VPS (Ubuntu 22.04 LTS recommended). 

**Choose your path:**
1. **Manual Deployment:** Install Java/Go, Node.js, Nginx, and Postgres directly on the server.
2. **Docker Deployment:** Use containers for a unified, portable setup.

---

## Prerequisites (For All Methods)

1. **A Linux VPS** (Ubuntu 22.04 LTS recommended).
2. **SSH Access** as root or a sudo user.
3. **Networking:** Ensure ports 80 (HTTP) and 443 (HTTPS) are open.

---

# Part 1: Manual Deployment (No Docker)

### 1. System Setup
Update system and install common tools.
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install postgresql postgresql-contrib nginx certbot python3-certbot-nginx -y
```

### 2. Database Setup (PostgreSQL)
```bash
sudo -u postgres psql

# Inside SQL Shell:
CREATE DATABASE gamevault;
CREATE USER vaultuser WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE gamevault TO vaultuser;
GRANT ALL ON SCHEMA public TO vaultuser;
\q
```

### 3. Backend Setup

#### Option A: Spring Boot (Java)

1.  **Install Java 17:**
    ```bash
    sudo apt install openjdk-17-jdk -y
    ```

2.  **Upload & Build:**
    Upload your `backend` project folder to `/var/www/gamevault/backend`.
    
    *Note: Ensure your files are standard `.java` and `pom.xml` (Maven) or `build.gradle` (Gradle) files.*

    **If using Maven:**
    ```bash
    sudo apt install maven -y
    cd /var/www/gamevault/backend
    
    # Configure DB in application.properties
    nano src/main/resources/application.properties 
    
    # Build
    mvn clean package -DskipTests
    ```
    
    **If using Gradle:**
    ```bash
    sudo apt install gradle -y
    cd /var/www/gamevault/backend
    
    # Configure DB in application.properties
    nano src/main/resources/application.properties
    
    # Build
    chmod +x gradlew
    ./gradlew build -x test
    ```

3.  **Create Service:**
    `sudo nano /etc/systemd/system/gamevault-backend.service`
    
    *Update the Jar name below based on your build output (e.g., inside `target/` or `build/libs/`).*

    ```ini
    [Unit]
    Description=GameVault Java Backend
    After=network.target

    [Service]
    User=root
    WorkingDirectory=/var/www/gamevault/backend
    # Check your target folder for the actual .jar name
    ExecStart=/usr/bin/java -jar target/gamevault-backend-0.0.1-SNAPSHOT.jar
    Restart=always

    [Install]
    WantedBy=multi-user.target
    ```

#### Option B: Go (Golang)
1. **Install Go:**
   ```bash
   sudo apt install golang-go -y
   ```
2. **Upload & Build:**
   Upload the `gobackend` folder to `/var/www/gamevault/gobackend`.
   ```bash
   cd /var/www/gamevault/gobackend
   
   # Build the binary
   go mod tidy
   go build -o gamevault-api main.go
   ```
3. **Create Service:**
   `sudo nano /etc/systemd/system/gamevault-backend.service`
   ```ini
   [Unit]
   Description=GameVault Go Backend
   After=network.target

   [Service]
   User=root
   WorkingDirectory=/var/www/gamevault/gobackend
   ExecStart=/var/www/gamevault/gobackend/gamevault-api
   Environment="DB_USER=vaultuser"
   Environment="DB_PASSWORD=secure_password"
   Environment="DB_NAME=gamevault"
   Environment="JWT_SECRET=prod_secret"
   Environment="PORT=8080"
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

**Start Backend Service:**
```bash
sudo systemctl enable gamevault-backend
sudo systemctl start gamevault-backend
```

### 4. Frontend Setup (React)
1. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```
2. **Upload & Build:**
   Upload frontend files to `/var/www/gamevault/frontend`.
   ```bash
   cd /var/www/gamevault/frontend
   
   # Configure API URL for production
   nano constants.ts 
   # 1. Set API_BASE_URL to '/api'
   # 2. Set USE_MOCK_DATA to false

   npm install
   npm run build
   ```
   This creates a `dist` folder with the production build.

### 5. Nginx Configuration (Reverse Proxy)

We will configure Nginx to serve the Frontend and proxy API requests.

**Create config file:** `sudo nano /etc/nginx/sites-available/gamevault`

#### Scenario A: IP Address Only (No Domain)
Use this if you don't have a domain name.

```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP; # e.g., 192.168.1.1

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

#### Scenario B: Domain Name (Choosing WWW or Non-WWW)
It is best practice to enforce one version of your domain (e.g., `example.com`) and redirect the other (e.g., `www.example.com`) to it. Choose **Option 1** or **Option 2**.

**Option 1: Force Non-WWW (Recommended)**
*   Visitors to `www.example.com` will be redirected to `example.com`.
*   Cleanest URL structure.

```nginx
# 1. Redirect Block: WWW -> Non-WWW
server {
    listen 80;
    server_name www.example.com;
    return 301 $scheme://example.com$request_uri;
}

# 2. Main Server Block
server {
    listen 80;
    server_name example.com; 

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

**Option 2: Force WWW**
*   Visitors to `example.com` will be redirected to `www.example.com`.
*   Useful if you prefer the traditional URL style.

```nginx
# 1. Redirect Block: Non-WWW -> WWW
server {
    listen 80;
    server_name example.com;
    return 301 $scheme://www.example.com$request_uri;
}

# 2. Main Server Block
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

**Activate Site:**
```bash
sudo ln -s /etc/nginx/sites-available/gamevault /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl restart nginx
```

### 6. SSL Setup (Domain Only)
First, ensure you have setup **Scenario B** (HTTP) and your site is accessible via browser. Then run Certbot.

```bash
# If you chose Option 1 (Non-WWW), run:
sudo certbot --nginx -d example.com -d www.example.com

# If you chose Option 2 (WWW), run:
sudo certbot --nginx -d www.example.com -d example.com
```

---

# Part 2: Docker Deployment

### 1. Install Docker
```bash
sudo apt update
sudo apt install docker.io docker-compose-v2 -y
sudo usermod -aG docker $USER
# Log out and log back in
```

### 2. Create Dockerfiles

Create these files inside your project folders before uploading to VPS.

**A. Frontend Dockerfile (`frontend/Dockerfile`)**
```dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Important: Ensure constants.ts has API_BASE_URL='/api'
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**B. Frontend Nginx Config (`frontend/nginx.conf`)**
```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
    }
}
```

**C. Backend Dockerfile - CHOOSE ONE**

*Option 1: Java (Spring Boot)* (`backend/Dockerfile`)
```dockerfile
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

*Option 2: Go (Golang)* (`gobackend/Dockerfile`)
```dockerfile
FROM golang:1.21-alpine AS build
WORKDIR /app
COPY go.mod ./
# COPY go.sum ./  # Uncomment if you have go.sum
RUN go mod download
COPY . .
# Rename files from .txt to .go if needed (assuming context provided txt files)
RUN if [ -f main.go.txt ]; then mv main.go.txt main.go; fi
RUN find . -name "*.go.txt" -exec sh -c 'mv "$1" "${1%.txt}"' _ {} \;

RUN go build -o main .

FROM alpine:latest
WORKDIR /root/
COPY --from=build /app/main .
RUN mkdir uploads
EXPOSE 8080
CMD ["./main"]
```

### 3. Create Docker Compose

Create `docker-compose.yml` in the root folder.

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: gamevault
      POSTGRES_USER: vaultuser
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    # Use './backend' for Java OR './gobackend' for Go
    build: ./gobackend 
    ports:
      - "8080:8080"
    environment:
      # If using Java
      # spring.datasource.url: jdbc:postgresql://db:5432/gamevault
      # spring.datasource.username: vaultuser
      # spring.datasource.password: secure_password
      # If using Go
       DB_USER: vaultuser
       DB_PASSWORD: secure_password
       DB_NAME: gamevault
       PORT: 8080
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      # We map 8081 on host to 80 in container to avoid conflict if using Nginx Proxy
      - "8081:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 4. Configuration Scenarios

Choose how you want to expose your Docker app to the world.

#### Scenario A: IP Address Only (Simplest)
If you don't have a domain, we will map the frontend directly to port 80.

1.  Edit `docker-compose.yml`.
2.  Change frontend ports to `"80:80"`.
3.  Run:
    ```bash
    docker compose up -d --build
    ```
4.  Visit `http://YOUR_VPS_IP`.

#### Scenario B: Domain Name with SSL (HTTPS)
The standard way to secure Docker containers is to run Nginx **on the host machine** (outside Docker) to handle SSL and proxy traffic to the Docker container.

1.  **Configure Docker:**
    *   Keep `docker-compose.yml` frontend ports as `"8081:80"` (or any unused port like 3000).
    *   Run `docker compose up -d --build`.

2.  **Install Nginx on Host:**
    ```bash
    sudo apt install nginx certbot python3-certbot-nginx -y
    ```

3.  **Configure Nginx:**
    `sudo nano /etc/nginx/sites-available/gamevault`
    
    *Use the same **WWW** or **Non-WWW** logic here as in Part 1, Step 5.*

    ```nginx
    # Force Non-WWW Example
    server {
        listen 80;
        server_name www.example.com;
        return 301 $scheme://example.com$request_uri;
    }

    server {
        listen 80;
        server_name example.com;

        location / {
            # Proxy to the Docker Container running on localhost:8081
            proxy_pass http://127.0.0.1:8081;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
    ```

4.  **Activate & SSL:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/gamevault /etc/nginx/sites-enabled/
    sudo rm /etc/nginx/sites-enabled/default
    sudo systemctl restart nginx
    
    # Generate SSL Cert
    sudo certbot --nginx -d example.com
    ```

5.  **Visit:** `https://example.com`

---

# Part 3: Cloudflare Setup (Recommended)

Using Cloudflare adds a layer of security (DDoS protection) and speed (CDN).

### Step 1: Add Site to Cloudflare
1.  Sign up at [cloudflare.com](https://www.cloudflare.com).
2.  Add your domain (e.g., `example.com`).
3.  Cloudflare will scan your DNS records.
4.  Update your domain registrar to use Cloudflare's Nameservers.

### Step 2: Configure DNS Records
Go to the **DNS** tab in Cloudflare. You need two records to handle both `www` and `non-www`.

1.  **Root Domain (`@`):**
    *   **Type**: `A`
    *   **Name**: `@` (or `example.com`)
    *   **Content**: `YOUR_VPS_IP`
    *   **Proxy Status**: `DNS Only` (Grey Cloud) initially (switch to Orange Cloud after SSL setup).

2.  **Subdomain (`www`):**
    *   **Type**: `CNAME`
    *   **Name**: `www`
    *   **Content**: `example.com` (or `@`)
    *   **Proxy Status**: `DNS Only` (Grey Cloud) initially.

### Step 3: Setup SSL on VPS
To use **Full (Strict)** encryption (recommended), your VPS must have a valid SSL certificate.

1.  **Ensure Grey Cloud:** In Cloudflare DNS, ensure records are **DNS Only** (Grey Cloud).
    *   *Why?* Certbot needs to connect directly to your IP to verify ownership.
2.  **Run Certbot:** SSH into your VPS and run the command:
    ```bash
    # If forcing Non-WWW (recommended):
    sudo certbot --nginx -d example.com -d www.example.com
    
    # If forcing WWW:
    sudo certbot --nginx -d www.example.com -d example.com
    ```
3.  **Verify:** Select "Redirect" if asked to redirect HTTP to HTTPS.

### Step 4: Enable Cloudflare Proxy & Redirects
Once Certbot works:

1.  **Proxy:** Go back to Cloudflare DNS and switch **Proxy Status** to `Proxied` (Orange Cloud) for both records.
2.  **SSL Mode:** Go to **SSL/TLS** menu and set mode to **Full (Strict)**.

---

# Part 4: Generic Domain Registrar Setup (No Cloudflare)

If you use a registrar like Namecheap, GoDaddy, Google Domains, etc., and do not want to use Cloudflare, follow these steps.

### Step 1: DNS Configuration
Log in to your registrar's control panel and find the **DNS Management** or **Advanced DNS** section.

1.  **Point the Root Domain:**
    *   **Type**: `A Record`
    *   **Host**: `@`
    *   **Value**: `YOUR_VPS_IP` (e.g., 123.45.67.89)
    *   **TTL**: Automatic or 3600 (1 hour)

2.  **Point the WWW Subdomain:**
    *   **Type**: `CNAME Record`
    *   **Host**: `www`
    *   **Value**: `example.com` (or `@` if supported)
    *   *Alternative*: You can create another A Record for `www` pointing to the same IP.

### Step 2: Handling Redirection
Unlike Cloudflare Page Rules, you don't need external rules. The **Nginx Configuration** you set up in **Part 1 (Step 5)** or **Part 2 (Step 4)** handles the logic.

*   If you chose **Option 1 (Force Non-WWW)**, Nginx will catch requests to `www.example.com` and automatically 301 Redirect them to `example.com`.
*   If you chose **Option 2 (Force WWW)**, it will do the reverse.

### Step 3: SSL Setup
Because traffic goes directly to your server, you must generate a certificate that covers **both** the root and `www` domains.

Run Certbot for both:
```bash
sudo certbot --nginx -d example.com -d www.example.com
```

Certbot will update your Nginx config blocks to ensure both the redirect block and the main block are served over HTTPS.

---

# Part 5: Service Management (Stop/Start/Restart)

Once deployed, you may need to restart the application to apply changes or stop it for maintenance.

### Manual Deployment Management

The backend is managed by `systemd`, and the frontend is served by Nginx.

*   **Check Status:**
    ```bash
    sudo systemctl status gamevault-backend nginx postgresql
    ```

*   **Restart Application:**
    If you uploaded new backend code or changed config:
    ```bash
    sudo systemctl restart gamevault-backend
    ```

*   **Stop Application:**
    ```bash
    sudo systemctl stop gamevault-backend
    sudo systemctl stop nginx
    ```

*   **View Live Logs:**
    Great for debugging 500 errors.
    ```bash
    journalctl -u gamevault-backend -f
    ```

### Docker Deployment Management

Everything is managed via `docker compose`. Run these commands in the folder containing `docker-compose.yml`.

*   **Start/Restart in Background:**
    Applies configuration changes and restarts containers.
    ```bash
    docker compose up -d --build
    ```

*   **Stop Application:**
    Stops and removes containers (data in volumes is preserved).
    ```bash
    docker compose down
    ```

*   **View Logs:**
    ```bash
    # View all logs
    docker compose logs -f
    
    # View specific service logs
    docker compose logs -f backend
    ```

---

# Part 6: Database Migration (pgAdmin to VPS)

If you developed locally using **pgAdmin** (Windows/Mac) and want to move your data to the VPS.

### Step 1: Export from pgAdmin (Local Computer)
1.  Open **pgAdmin**.
2.  Right-click on your `gamevault` database.
3.  Select **Backup...**
4.  **Filename:** Click the folder icon, choose a location, and name it `backup.sql`.
5.  **Format:** Select **Plain** (this is important for compatibility).
6.  Click **Backup**.

### Step 2: Upload to VPS
Use `scp` (Terminal) or a tool like **FileZilla** to upload `backup.sql` to your VPS.

```bash
# Example using SCP from your local terminal
scp path/to/backup.sql root@YOUR_VPS_IP:/root/
```

### Step 3: Import to VPS

**For Manual Deployment:**
1.  SSH into your VPS.
2.  Run the import command using the `postgres` user.
    *   *Warning: This will add data. If the DB already has conflicting data, you might want to drop/create the DB first.*
    ```bash
    sudo -u postgres psql -d gamevault -f /root/backup.sql
    ```

**For Docker Deployment:**
1.  SSH into your VPS.
2.  Find your database container name:
    ```bash
    docker ps
    # Look for the name, usually 'gamevault-db-1' or similar
    ```
3.  Pipe the file into the container:
    ```bash
    cat /root/backup.sql | docker exec -i gamevault-db-1 psql -U vaultuser -d gamevault
    ```

---

# Part 7: Essential Security & Troubleshooting

### 1. Firewall (UFW)
Ubuntu comes with `ufw` (Uncomplicated Firewall). You should enable it to block unauthorized access.

```bash
# Allow SSH (Critical: Do not skip this or you will lock yourself out!)
sudo ufw allow 22

# Allow Web Traffic
sudo ufw allow 'Nginx Full'
# OR if not using Nginx directly:
# sudo ufw allow 80
# sudo ufw allow 443

# Enable Firewall
sudo ufw enable
```

### 2. Troubleshooting Common Errors

**Error: "Connection Refused" when visiting site**
*   Check if Nginx is running: `sudo systemctl status nginx`
*   Check if Backend is running: `sudo systemctl status gamevault-backend`
*   Check Firewall: `sudo ufw status`

**Error: "502 Bad Gateway"**
*   This means Nginx cannot talk to the Backend.
*   Check Backend logs: 
    *   Java: `journalctl -u gamevault-backend -f`
    *   Docker: `docker logs gamevault-backend-1`
*   Ensure Backend is listening on port 8080.

**Error: "413 Request Entity Too Large" (Image Uploads)**
*   Nginx limits upload size by default (1MB).
*   Edit `nginx.conf`:
    ```nginx
    server {
        ...
        client_max_body_size 10M;
        ...
    }
    ```
*   Restart Nginx: `sudo systemctl restart nginx`

**Error: "Mixed Content" (Styles not loading / Images broken)**
*   Ensure `API_BASE_URL` in `constants.ts` is set correctly.
*   If using HTTPS, ensure API requests are also going to HTTPS (or relative path `/api`).

### 3. Database Backups
It is crucial to backup your data.

**Manual Postgres Backup:**
```bash
# Backup
pg_dump -U vaultuser gamevault > backup.sql

# Restore
psql -U vaultuser gamevault < backup.sql
```

**Docker Postgres Backup:**
```bash
docker exec -t gamevault-db-1 pg_dump -U vaultuser gamevault > backup.sql
```
