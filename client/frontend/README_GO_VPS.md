
# Game Vault - Go Backend Deployment (VPS)

This guide explains how to deploy the Go backend to a Linux VPS (e.g., Ubuntu 22.04) manually without Docker.

## 1. Server Setup

 SSH into your VPS:
 ```bash
 ssh root@your_vps_ip
 ```

 Update packages and install tools:
 ```bash
 sudo apt update && sudo apt upgrade -y
 sudo apt install golang postgresql postgresql-contrib nginx -y
 ```

## 2. Database Setup

 Create the database and user:
 ```bash
 sudo -u postgres psql

 CREATE DATABASE gamevault;
 CREATE USER vaultuser WITH ENCRYPTED PASSWORD 'secure_pass_123';
 GRANT ALL PRIVILEGES ON DATABASE gamevault TO vaultuser;
 GRANT ALL ON SCHEMA public TO vaultuser;
 \q
 ```

## 3. Build & Deploy Backend

 1. **Upload Files**: Copy the `gobackend` folder from your local machine to the VPS (e.g., `/var/www/gamevault/gobackend`).
    *   *Note*: Ensure files are renamed from `.txt` to `.go` if you uploaded the raw text files.

 2. **Build Binary**:
    ```bash
    cd /var/www/gamevault/gobackend
    go mod tidy
    go build -o gamevault-api main.go
    ```

 3. **Create System Service**:
    Create `/etc/systemd/system/gamevault.service`:
    ```ini
    [Unit]
    Description=GameVault Go API
    After=network.target

    [Service]
    User=root
    WorkingDirectory=/var/www/gamevault/gobackend
    ExecStart=/var/www/gamevault/gobackend/gamevault-api
    Environment="DB_USER=vaultuser"
    Environment="DB_PASSWORD=secure_pass_123"
    Environment="DB_NAME=gamevault"
    Environment="JWT_SECRET=super_secret_prod_key"
    Environment="PORT=8080"
    Environment="GIN_MODE=release"
    Restart=always

    [Install]
    WantedBy=multi-user.target
    ```

 4. **Start Service**:
    ```bash
    sudo systemctl enable gamevault
    sudo systemctl start gamevault
    ```

## 4. Configure Nginx (Reverse Proxy)

 Edit `/etc/nginx/sites-available/gamevault`:
 ```nginx
 server {
     listen 80;
     server_name your_domain.com; # or IP address

     root /var/www/gamevault/frontend/dist;
     index index.html;

     # Frontend
     location / {
         try_files $uri $uri/ /index.html;
     }

     # Backend API
     location /api {
         proxy_pass http://localhost:8080;
         proxy_set_header Host $host;
         proxy_set_header X-Real-IP $remote_addr;
         client_max_body_size 10M;
     }
 }
 ```

 Activate and Restart:
 ```bash
 sudo ln -s /etc/nginx/sites-available/gamevault /etc/nginx/sites-enabled/
 sudo rm /etc/nginx/sites-enabled/default
 sudo nginx -t
 sudo systemctl restart nginx
 ```
