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
```

## Start an empty PostgreSQL database (optional)

From the project root: `docker compose up -d db`. No schema or seed data is created. If port 5432 is already in use, stop the other service or change the host port and backend connection URL.

The `frontend/src/pages` directories are organized by Customer, Staff, and Admin roles as shown in Screens Canvas. The backend folders are placeholders for future work.


Version 0.2

# TurnFlow

## First-Time Setup

### Frontend

1. Use Node.js `24.21.0`.
    - The expected version is also stored in `frontend/.nvmrc`.

2. Go to the `frontend` folder.

3. Install dependencies:

   ```bash
   npm install
   
4. Start the development server:
   npm run dev