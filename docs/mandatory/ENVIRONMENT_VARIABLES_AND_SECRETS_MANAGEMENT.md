# Environment Variables & Secrets Management — Engineering Guide

This document details the environment variable structure, secrets management strategy, and security best practices implemented in the **DocPulse Healthcare Platform**.

---

## 1. Core Principles

1. **Zero Secret Leaks**: No API keys, database credentials, or JWT signing secrets are committed to version control.
2. **Template Parity**: The `.env.example` file contains all runtime configuration variables with placeholder values and descriptions.
3. **Runtime Validation**: On startup in production mode (`NODE_ENV=production`), the application validates that required secrets (`JWT_SECRET`, `MONGO_URI`, `DATABASE_URL`) are present and meet minimum length/entropy requirements.
4. **Backend-Only AI Secrets**: The Google Gemini API key (`GEMINI_API_KEY`) is strictly confined to the backend server and never exposed in client bundles or network responses.

---

## 2. Environment Variables Catalog

| Variable | Required | Default / Format | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `5000` | HTTP port on which the Express server listens. |
| `NODE_ENV` | Yes | `development` / `production` / `test` | Runtime environment. Enforces strict validation in `production`. |
| `CLIENT_URL` | Yes | `http://localhost:5173` | Allowed frontend origin for CORS and WebSocket handshake. |
| `JWT_SECRET` | Yes | 32+ character string | High-entropy secret used for HMAC-SHA256 signature verification. |
| `JWT_EXPIRES_IN` | No | `7d` | JWT session lifetime. |
| `BCRYPT_SALT_ROUNDS` | No | `10` | Salt rounds for password hashing. |
| `MONGO_URI` | Yes | `mongodb://...` | Connection URI for the MongoDB clinical document store. |
| `DATABASE_URL` | Yes | `postgresql://...` | Connection string for the PostgreSQL Prisma relational database. |
| `GEMINI_API_KEY` | Yes | Alphanumeric API key | Google Gemini API key for clinical intake summaries and search mapping. |
| `REDIS_URL` | No | `redis://127.0.0.1:6379` | Connection string for Redis in-memory caching. |
| `RATE_LIMIT_WINDOW_MS`| No | `900000` (15 mins) | Express rate limiter time window. |
| `RATE_LIMIT_MAX` | No | `200` | Maximum allowed API requests per IP per window. |

---

## 3. Local Setup Instructions

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate `.env` with your local credentials.
3. Verify that `.env` is listed in `.gitignore`:
   ```text
   # .gitignore
   .env
   .env.local
   .env.*.local
   ```
