# Worker Management App - Boilerplate Structure

This archive contains a starter project structure for a Worker Management App.
It includes both backend (Node/Express + Mongoose) and frontend (React) folders
with placeholder files and basic boilerplate to get started.

## Notes
- Replace placeholder logic with actual implementation (authentication, business logic).
- Update .env values in backend/.env before running.
- Install dependencies in backend and frontend folders (npm install).

## About

Worker Management App is a full-stack solution designed to streamline the management of workers, attendance, and performance. Built with Node.js, Express, MongoDB, and React, it enables companies to efficiently track worker details, generate reports, and manage daily operations. The app features secure authentication, user-friendly interfaces, and robust reporting tools to help businesses improve productivity and transparency.

## Quick start (backend)

1. Open a terminal and install backend dependencies:

```powershell
cd backend
npm install
```

2. Create a `.env` file in `backend/` (copy `.env.example` if present) and set at minimum:

- `PORT` (optional, default 5002)
- `MONGODB_URI` (e.g. `mongodb://localhost:27017/worker-management`)
- `SESSION_SECRET`
- (optional for email) `GMAIL_USER` and `GMAIL_PASS`

3. Run backend in development (uses `nodemon`):

```powershell
npm run dev
```

4. Health check:

```powershell
Invoke-WebRequest http://localhost:5002/health -UseBasicParsing
```

## Quick start (frontend)

1. In a new terminal:

```powershell
cd frontend
npm install
npm start
```

2. For production build (so backend can serve static files):

```powershell
cd frontend
npm run build
```

Then start the backend with `NODE_ENV=production` and it will serve `frontend/build` when available.

## What I changed to optimize for 50–100 users

- Enabled gzip response compression (`compression`) to reduce payload sizes.
- Added a modest API rate limiter (per-IP limits) to avoid accidental floods.
- Shortened session lifetime from 7 days → 1 day to reduce session store churn.
- Added `Cache-Control` headers for uploaded assets and serve frontend static files with long cache TTLs in production.
- Removed Google sign-in flows and related runtime routes; registration/login now use email + OTP and password.
- Simplified frontend auth flows to avoid extra dynamic imports and OAuth handling on the client.

These changes keep the app lightweight and responsive for a single Node process serving ~50–100 active users. If you expect heavier usage later, consider adding a job queue (e.g., Bull/Redis) and horizontal scaling behind a load balancer.

## Next steps I recommend

- Add a small process manager (pm2) and lightweight monitoring (CPU, memory, response time).
- Add a production-grade session store (Mongo / Redis) when running multiple Node instances.
- Configure a reliable SMTP provider for OTP emails in production.
- Optionally run a short synthetic load test to validate expected responsiveness before public deployment.

## Production deployment & performance checklist

Follow these steps to deploy a fast, production-ready instance that handles sign-in, sign-up and dashboard traffic reliably:

- Build the frontend for production and serve the static files from the backend or a CDN:
	```powershell
	cd frontend
	npm install
	npm run build
	# copy frontend/build -> backend/frontend/build if you will serve from Node
	```

- Install backend production dependencies and enable a production session store (recommended):
	```powershell
	cd backend
	npm install --production
	# Recommended: install connect-mongo and ensure MONGODB_URI is set
	npm install connect-mongo
	```

- Run backend in cluster mode with PM2 (recommended for multi-core throughput):
	```powershell
	# from repo root
	npm i -g pm2
	pm2 start ecosystem.config.js --env production
	pm2 save
	```

- Use environment variables in production (example):
	- `NODE_ENV=production`
	- `PORT=5002`
	- `MONGODB_URI=mongodb://user:pass@host:port/db`
	- `SESSION_SECRET=your_very_secret_value`

- Add a reverse proxy (nginx) in front of Node for TLS, HTTP/2 and to serve static files or as a CDN edge.

- Performance considerations to verify:
	- Use a Mongo-backed session store (`connect-mongo`) to avoid MemoryStore issues under load.
	- Ensure static assets are served with `Cache-Control` and consider a CDN for uploads.
	- Verify DB indexes for queries (e.g., worker id, date filters) to avoid slow queries on dashboard load.
	- Monitor app with an APM or logs (response times); tune rate limits or add caching where needed.

- For PDF generation at scale consider moving to server-side rendering with Puppeteer (headless Chrome) to avoid client CPU spikes.

If you want I can: add a PM2 ecosystem file (done in repo), add a small `nginx` sample config, or implement the Puppeteer PDF endpoint.
