
# Game Vault - Go Backend Setup (Windows)

This guide will help you set up the Go backend on a Windows machine.

## Prerequisites

1.  **Go (Golang)**:
    *   Download the installer from [go.dev/dl](https://go.dev/dl/).
    *   Run the `.msi` installer and follow the prompts.
    *   Open Command Prompt (`cmd`) and type `go version` to verify.

2.  **PostgreSQL**:
    *   Download the installer from [postgresql.org](https://www.postgresql.org/download/windows/).
    *   Run the installer. Remember the password you set for the `postgres` user (default is often `root` or `password`).
    *   Open pgAdmin (installed with Postgres) or use SQL Shell.
    *   Create a database named `gamevault`:
        ```sql
        CREATE DATABASE gamevault;
        ```

## Installation Steps

1.  **Prepare the Folder**:
    *   Navigate to the `gobackend` folder in File Explorer.
    *   **Important**: The source files provided have a `.txt` extension. You must rename them to `.go` files.
    *   Example: Rename `main.go.txt` -> `main.go`, `go.mod.txt` -> `go.mod`.
    *   Ensure the folder structure matches:
        ```
        gobackend/
        ├── main.go
        ├── go.mod
        ├── database/
        │   └── database.go
        ├── models/
        │   └── models.go
        ├── middleware/
        │   └── auth_middleware.go
        └── controllers/
            └── auth_controller.go
            └── ... (other controllers)
        ```

2.  **Configuration**:
    *   Create a file named `.env` in the `gobackend` folder.
    *   Add your database credentials:
        ```env
        DB_USER=postgres
        DB_PASSWORD=your_password_here
        DB_NAME=gamevault
        JWT_SECRET=my_super_secret_key_123
        PORT=8080
        ```

3.  **Install Dependencies**:
    *   Open Command Prompt inside the `gobackend` folder.
    *   Run:
        ```bash
        go mod tidy
        ```
    *   This downloads Gin, GORM, and other libraries defined in `go.mod`.

4.  **Run the App**:
    *   Run:
        ```bash
        go run main.go
        ```
    *   You should see "Database connected!" and "[GIN-debug] Listening and serving HTTP on :8080".

## Connecting Frontend

1.  Open `constants.ts` in the frontend folder.
2.  Set `USE_MOCK_DATA = false`.
3.  Ensure `API_BASE_URL` points to `http://localhost:8080/api`.
4.  Refresh the frontend.

## Troubleshooting

*   **Firewall**: If accessing from another device on the network, allow port 8080 in Windows Firewall.
*   **Database Error**: Double-check the password in `.env` matches what you set during Postgres installation.
