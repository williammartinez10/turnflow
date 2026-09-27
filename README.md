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
