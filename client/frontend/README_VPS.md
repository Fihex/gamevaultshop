

# Game Vault - Manual VPS Deployment Guide (No Docker)

This guide covers how to deploy the Game Vault application to a Linux VPS (e.g., Ubuntu 22.04) manually.

## Prerequisites
- A VPS running Ubuntu 22.04 (or similar Linux distro).
- Root access via SSH.
- A domain name (optional, but recommended).

---

## 1. System Preparation

Update your system packages and install the necessary tools.

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install openjdk-17-jdk maven nodejs npm nginx postgresql postgresql-contrib certbot python3-certbot-nginx -y
```

---

## 2. Database Setup (PostgreSQL)

Create a user and database for the application.

```bash
sudo -u postgres psql

# Inside the SQL shell:
CREATE DATABASE gamevault;
CREATE USER vaultuser WITH ENCRYPTED PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE gamevault TO vaultuser;
GRANT ALL PRIVILEGES ON SCHEMA public TO vaultuser;
\q
```

---

## 3. Backend Deployment (Spring Boot)

1.  **Upload Code**: Upload the `backend` folder to `/var/www/gamevault/backend`.
2.  **Configure**: Edit `/var/www/gamevault/backend/src/main/resources/application.properties`.

    ```properties
    spring.datasource.url=jdbc:postgresql://localhost:5432/gamevault
    spring.datasource.username=vaultuser
    spring.datasource.password=secure_password_123
    # Use a random long string
    app.jwtSecret=YOUR_VERY_LONG_SECRET_KEY_HERE
    ```

3.  **Build**:
    ```bash
    cd /var/www/gamevault/backend
    # Rename .txt files to actual files if you haven't locally
    # e.g., mv pom.xml.txt pom.xml
    mvn clean package -DskipTests
    ```
    This creates a JAR file in `target/` (e.g., `gamevault-backend-0.0.1-SNAPSHOT.jar`).

4.  **Create Service**: Set up a systemd service to keep the app running.
    
    `sudo nano /etc/systemd/system/gamevault.service`

    ```ini
    [Unit]
    Description=GameVault Backend
    After=syslog.target network.target

    [Service]
    User=root
    ExecStart=/usr/bin/java -jar /var/www/gamevault/backend/target/gamevault-backend-0.0.1-SNAPSHOT.jar
    SuccessExitStatus=143
    Restart=always
    WorkingDirectory=/var/www/gamevault/backend

    [Install]
    WantedBy=multi-user.target
    ```

5.  **Start Backend**:
    ```bash
    sudo systemctl enable gamevault
    sudo systemctl start gamevault
    ```

---

## 4. Frontend Deployment (React + Vite)

1.  **Upload Code**: Upload the frontend files (root directory) to `/var/www/gamevault/frontend`.
2.  **Install Dependencies**:
    ```bash
    cd /var/www/gamevault/frontend
    npm install
    ```
3.  **Build**:
    ```bash
    npm run build
    ```
    This creates a `dist/` folder containing static HTML/CSS/JS files.

---

## 5. Nginx Configuration (Reverse Proxy)

We will configure Nginx to serve the Frontend files and proxy API requests to the Backend.

**Scenario A: Using IP Address (No Domain)**

`sudo nano /etc/nginx/sites-available/gamevault`

```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP; # e.g., 192.0.2.1

    root /var/www/gamevault/frontend/dist;
    index index.html;

    # Serve Frontend (React Router support)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Backend
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Scenario B: Using a Domain (e.g., example.com)**

`sudo nano /etc/nginx/sites-available/gamevault`

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

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
sudo nginx -t
sudo systemctl restart nginx
```

---

## 6. SSL Setup (Domain Only)

If you used **Scenario B** (Domain), secure it with free SSL using Certbot.

```bash
sudo certbot --nginx -d example.com -d www.example.com
```
Follow the prompts to redirect HTTP to HTTPS automatically.

---

## 7. Service Management (Start / Stop)

If you need to restart your application or frontend server, use `systemctl`.

### Backend Service (Java/Go)
*   **Start:** `sudo systemctl start gamevault`
*   **Stop:** `sudo systemctl stop gamevault`
*   **Restart:** `sudo systemctl restart gamevault`
*   **Check Status:** `sudo systemctl status gamevault`

### Frontend Server (Nginx)
The frontend is just static files served by Nginx. Restarting Nginx restarts the frontend availability.
*   **Start:** `sudo systemctl start nginx`
*   **Stop:** `sudo systemctl stop nginx`
*   **Restart:** `sudo systemctl restart nginx`

---

## 8. Creating an Admin User

Since the database is initially empty, you must manually promote the first registered user to **ADMIN** to access the dashboard.

1.  **Register a User**: Go to your deployed website (e.g., `http://YOUR_IP`) and Sign Up (e.g., username `admin`).
2.  **SSH into VPS**: Connect to your server.
3.  **Access Database**:
    ```bash
    sudo -u postgres psql -d gamevault
    ```
4.  **Run SQL Command**:
    ```sql
    UPDATE users SET role = 'ADMIN' WHERE username = 'admin';
    ```
    *(Replace 'admin' with the username you created)*
5.  **Exit SQL**:
    ```sql
    \q
    ```
6.  **Verify**: Log out and log back in on the website. You should now see the Admin Dashboard in the profile menu.

---

## 9. Final Verification

1.  Open your browser and go to `http://YOUR_IP` or `https://example.com`.
2.  You should see the Game Vault store.
3.  Try to Login/Register. If it works, the API proxy is functioning correctly.
