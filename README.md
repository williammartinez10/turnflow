# TurnFlow boilerplate

Folder structure and minimum runtime configuration only. No screens, API endpoints, database tables, authentication, queue logic, or SMS integration have been implemented.

## Run frontend

```sh
cd frontend
npm install
npm run dev
```

## Run backend (optional)

```sh
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

install docker
write docker run --name TurnFlow -e POSTGRES_PASSWORD=Medical@ffice20 -e POSTGRES_USER=dbuser -e PGDATA=/var/lib/postgresql/data --volume some-postgres:/var/lib/postgresql -p 8982:5432 -e POSTGRES_DB=TurnFlow_Database -d postgres:17 into terminal
run turnflow/backend/ETL/Initialize_Tables.py in coderunne (like vscode)
```

## Start an empty PostgreSQL database (optional)

From the project root: `docker compose up -d db`. No schema or seed data is created. If port 5432 is already in use, stop the other service or change the host port and backend connection URL.

The `frontend/src/pages` directories are organized by Customer, Staff, and Admin roles as shown in Screens Canvas. The backend folders are placeholders for future work.


Version 0.5

# TurnFlow

## First-Time Setup

### 1. Frontend

1. Use Node.js `24.21.0`.
   - The expected version is also stored in `frontend/.nvmrc`.

2. Go to the `frontend` folder.

3. Install dependencies:

   ```bash
   npm install
   ```

---

### 2. Backend

1. Make sure Python is installed.

2. Create or select the project virtual environment:

   ```text
   .venv
   ```

3. Install the dependencies from:

   ```text
   backend/requirements.txt
   ```

4. Create the backend environment file:

   ```text
   backend/.env
   ```

5. Add a session secret to `backend/.env`:

   ```text
   SESSION_SECRET_KEY=<your-secret-key>
   ```

---

### 3. Database

1. Install Docker Desktop.

2. Make sure Docker Desktop is running.

3. Run the project's:

   ```text
   docker-compose.yml
   ```

   This starts the PostgreSQL database used by TurnFlow.

4. For the initial database setup, run:

   ```text
   backend/Initialize_Tables.py
   ```

   This creates the required TurnFlow database tables.

   **Important:** `Initialize_Tables.py` drops and recreates the tables. Do not run it during normal startup unless you intentionally want to reset the database.

---

# Running TurnFlow

After the first-time setup is complete, use these steps whenever starting the project.

## 1. Start the Database

1. Open Docker Desktop.

2. Make sure Docker is running.

3. Run:

   ```text
   docker-compose.yml
   ```

This starts the PostgreSQL database.

PostgreSQL is available at:

```text
localhost:8982
```

---

## 2. Start the Backend

Run the WebStorm configuration:

```text
FastAPI
```

The FastAPI backend should start at:

```text
http://127.0.0.1:8000
```

---

## 3. Start the Frontend

Go to the `frontend` folder and run:

```bash
npm run dev
```

The frontend should start at:

```text
http://localhost:5173
```

---

## Running Services

When TurnFlow is running normally:

```text
Frontend    → http://localhost:5173
FastAPI     → http://127.0.0.1:8000
PostgreSQL  → localhost:8982
```

Recommended startup order:

```text
Docker / PostgreSQL
        ↓
FastAPI backend
        ↓
Frontend
```

---

## Normal Startup Reminder

You do **not** need to run `Initialize_Tables.py` every time.

For normal development, only start:

1. Docker / PostgreSQL
2. FastAPI
3. Frontend

Run `Initialize_Tables.py` only when setting up the tables for the first time or when intentionally resetting the database.
