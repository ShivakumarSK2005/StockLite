# StockLite Backend Foundation

This folder contains the initial Express backend and MySQL connection.

## Requirements

- Node.js LTS
- MySQL Server running locally
- The `stocklite` database already created using the project's SQL files

## Setup on Windows PowerShell

1. Extract this folder as `stocklite/backend` or copy its contents into your existing `backend` directory.
2. Create a local `.env` file by copying `.env.example`.
3. Set the correct MySQL username and password in `.env`.
4. Open PowerShell in this directory and run:

```powershell
npm install
npm run dev
```

5. Open http://localhost:5000/api/health.

Expected JSON:

```json
{
  "success": true,
  "message": "StockLite API is running",
  "database": "connected"
}
```

Do not commit `.env` to Git. The `.env.example` file is safe to commit.

## Included

- Express app configuration
- MySQL promise connection pool
- `GET /api/health`
- 404 handling for unknown API routes
- Centralized error handling
- Graceful shutdown of the HTTP server and database pool

This is the backend foundation only. Authentication, categories, products, stock operations, reports, and automated tests will be added as complete modules in subsequent steps.
