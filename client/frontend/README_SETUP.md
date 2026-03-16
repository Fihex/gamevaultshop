# Game Vault - Full Stack Setup Guide

This document provides step-by-step instructions to set up the Spring Boot backend and connect it with the React frontend.

## 1. Backend Configuration

The backend files are generated as `.txt` files for safety. You need to rename them and set up your environment.

### Prerequisites
- **Java 17** or higher
- **PostgreSQL** Database
- **Maven** or **Gradle**

### Step 1: Prepare the File Structure
1. Navigate to the `backend/` folder.
2. Rename the build file of your choice:
   - For **Maven**: Rename `pom.xml.txt` to `pom.xml`.
   - For **Gradle**: Rename `build.gradle.txt` to `build.gradle`.
3. Navigate to `backend/src/main/java/com/gamevault/` and recursively rename all `.java.txt` files to `.java`.
4. Navigate to `backend/src/main/resources/` and rename `application.properties.txt` to `application.properties`.

### Step 2: Database Setup
1. Ensure PostgreSQL is running.
2. Create a database named `gamevault`.
   ```sql
   CREATE DATABASE gamevault;
   ```
3. Open `backend/src/main/resources/application.properties`.
4. Update the username and password to match your local PostgreSQL installation:
   ```properties
   spring.datasource.username=your_postgres_user
   spring.datasource.password=your_postgres_password
   ```

### Step 3: Run the Backend
Open a terminal in the `backend/` directory.

**Using Maven:**
```bash
mvn spring-boot:run
```

**Using Gradle:**
```bash
./gradlew bootRun
```

The server will start at `http://localhost:8080`.

---

## 2. Frontend Integration

By default, the frontend uses **Mock Data** so you can preview the UI without the backend running.

### Step 1: Connect to Backend
1. Open `constants.ts` in the root directory.
2. Change `USE_MOCK_DATA` to `false`.

```typescript
// constants.ts
export const USE_MOCK_DATA = false; // Set to false to use real API
export const API_BASE_URL = 'http://localhost:8080/api';
```

### Step 2: Run Frontend
The frontend should already be running. If not, refresh the browser window.

---

## 3. Creating an Admin User

Since the database is empty initially, you need to create an Admin account to manage the store.

1. Go to the **Sign Up** page on the frontend.
2. Register a new user (e.g., `admin`).
3. Access your PostgreSQL database and run the following SQL to promote the user:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE username = 'admin';
   ```
4. Log out and log back in. You will now see the **Admin Dashboard** in the profile menu.

---

## 4. Features

- **Authentication:** JWT-based login/signup.
- **Dynamic Store:** Products fetched from the database.
- **Image Uploads:** Drag & drop images in the Admin Dashboard (stored in `backend/uploads`).
- **Cart & Orders:** Complete checkout flow saves orders to the database.
