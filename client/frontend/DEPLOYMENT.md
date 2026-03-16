
# Game Vault - Complete Deployment Guide

This guide covers everything you need to know to deploy Game Vault. 

**Choose your path:**
1.  **Docker Deployment (Recommended)**: Best if you are new to servers. It packages everything into "containers" so you don't have to install Java/Node manually.
2.  **Manual Deployment**: Best if you want to learn how Linux works or have a specific server setup.

---

## 🛠️ Prerequisites

1.  **A Linux VPS**: Ubuntu 22.04 LTS (Recommended providers: DigitalOcean, Hetzner, Linode, AWS).
2.  **SSH Client**: Terminal (Mac/Linux) or PowerShell/PuTTY (Windows).
3.  **File Transfer Tool**: FileZilla (to upload files easily).
4.  **Domain Name (Optional)**: If you want `your-site.com` instead of an IP address.

---

# 🐳 Option 1: Docker Deployment (Beginner Friendly)

Docker is like a shipping container. You don't need to install Java or Node.js on your server. You just run the container.

### Step 1: Prepare Files Locally
1.  Create a file named `Dockerfile` inside the `backend/` folder:
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

2.  Create a file named `Dockerfile` inside the root folder (where `package.json` is):
    ```dockerfile
    FROM node:20-alpine as build
    WORKDIR /app
    COPY package*.json ./
    RUN npm install
    COPY . .
    # Ensure constants.ts has API_BASE_URL='/api'
    RUN npm run build

    FROM nginx:alpine
    COPY --from=build /app/dist /usr/share/nginx/html
    RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]
    ```

3.  Create a `docker-compose.yml` in the root folder:
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
        build: ./backend
        ports:
          - "8080:8080"
        environment:
          spring.datasource.url: jdbc:postgresql://db:5432/gamevault
          spring.datasource.username: vaultuser
          spring.datasource.password: secure_password
        depends_on:
          - db
      frontend:
        build: .
        ports:
          - "8081:80"
        depends_on:
          - backend
    volumes:
      postgres_data:
    ```

### Step 2: Upload to Server
1.  Open **FileZilla**. Connect to your VPS (`sftp://YOUR_IP`, user: `root`).
2.  Create a folder `/opt/gamevault`.
3.  Upload your project files there.

### Step 3: Run on Server
SSH into your server and run:
```bash
# Install Docker
apt update
apt install docker.io docker-compose-v2 -y

# Run App
cd /opt/gamevault
docker compose up -d --build
```
Your app is now running! Frontend on port `8081`, Backend on `8080`.

---

# 🛠️ Option 2: Manual Deployment

### 1. Install Software
```bash
sudo apt update
sudo apt install openjdk-17-jdk postgresql postgresql-contrib nginx certbot python3-certbot-nginx -y
# Install Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Database Setup
```bash
sudo -u postgres psql
# In SQL Shell:
CREATE DATABASE gamevault;
CREATE USER vaultuser WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE gamevault TO vaultuser;
GRANT ALL ON SCHEMA public TO vaultuser;
\q
```

### 3. Backend Setup
1.  Upload `backend` folder to `/var/www/gamevault/backend`.
2.  Build: `mvn clean package -DskipTests` (install maven first: `apt install maven`).
3.  Create Service: `nano /etc/systemd/system/gamevault.service`
    ```ini
    [Unit]
    Description=GameVault Backend
    After=network.target
    [Service]
    User=root
    WorkingDirectory=/var/www/gamevault/backend
    ExecStart=/usr/bin/java -jar target/gamevault-backend-0.0.1-SNAPSHOT.jar
    Restart=always
    [Install]
    WantedBy=multi-user.target
    ```
4.  Start: `systemctl enable gamevault && systemctl start gamevault`.

### 4. Frontend Setup
1.  Upload root files to `/var/www/gamevault/frontend`.
2.  Edit `constants.ts`: Set `API_BASE_URL = '/api'`.
3.  Build: `npm install && npm run build`.

---

# 🌐 Domain & Nginx Configuration (The Traffic Controller)

This section explains how to point your domain (e.g., `gamevault.com`) to your server.

### Part A: DNS Setup (Choose your provider)

#### Scenario 1: Using Cloudflare (Recommended)
1.  **Add Site**: Add your domain to Cloudflare.
2.  **DNS Records**:
    *   **A Record**: Name `@`, Target `YOUR_VPS_IP`, Proxy Status `Proxied (Orange Cloud)`.
    *   **CNAME Record**: Name `www`, Target `gamevault.com` (or `@`), Proxy Status `Proxied`.
3.  **SSL/TLS**: Set to **Full** (not Flexible).

#### Scenario 2: Generic Registrar (GoDaddy, Namecheap, etc.)
1.  **Login** to your registrar's dashboard.
2.  **DNS Management**:
    *   **A Record**: Host `@`, Value `YOUR_VPS_IP`, TTL `Automatic`.
    *   **CNAME Record**: Host `www`, Value `gamevault.com`, TTL `Automatic`.
3.  **Wait**: DNS propagation can take 1-24 hours.

### Part B: Nginx Configuration

We need to tell Nginx how to handle the traffic.

**1. Create Config File:**
```bash
sudo nano /etc/nginx/sites-available/gamevault
```

**2. Paste the Configuration (Choose One):**

**Option A: IP Address Only (No Domain)**
If you are just testing or don't have a domain yet.
```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP; # e.g., 192.168.1.1

    # Frontend (If using Manual)
    root /var/www/gamevault/frontend/dist;
    
    # Frontend (If using Docker - Uncomment below, comment above)
    # location / { proxy_pass http://127.0.0.1:8081; }

    index index.html;

    # For Manual Deployment
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://localhost:8080; # Points to Java Backend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Option B: Domain with WWW Redirection (e.g., example.com -> www.example.com)**
Good for SEO. Keeps everything on `www`.
```nginx
# 1. Redirect root to www
server {
    listen 80;
    server_name example.com;
    return 301 $scheme://www.example.com$request_uri;
}

# 2. Main Server Block
server {
    listen 80;
    server_name www.example.com;

    # Frontend Root (Manual)
    root /var/www/gamevault/frontend/dist;
    index index.html;

    location / {
        # If Docker, use: proxy_pass http://127.0.0.1:8081;
        try_files $uri $uri/ /index.html; 
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Option C: Domain with Root (e.g., www.example.com -> example.com)**
Modern style. Keeps everything on the root domain.
```nginx
# 1. Redirect www to root
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

**3. Enable Site:**
```bash
sudo ln -s /etc/nginx/sites-available/gamevault /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t  # Check for errors
sudo systemctl restart nginx
```

**4. SSL Setup (HTTPS):**
If you used Option B or C, secure your site.
```bash
sudo certbot --nginx -d example.com -d www.example.com
```
Follow the prompts. Choose "2" to redirect HTTP to HTTPS automatically.

---

## 🏁 Final Steps

1.  Open your browser to your IP or Domain.
2.  You should see the Game Vault store!
3.  **Admin Setup**:
    *   Register a user (e.g., `admin`).
    *   Go to database: `sudo -u postgres psql -d gamevault`.
    *   Run: `UPDATE users SET role = 'ADMIN' WHERE username = 'admin';`.
    *   Logout and Login again to see the Admin Dashboard.
