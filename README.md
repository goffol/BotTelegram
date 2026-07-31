# RXKINGUID — Secure Telegram Bot + Mini App

High-performance Telegram bot (Grammy) with optional **Neumorphic Mini App** that calls a UID bypass upstream API. Credentials stay in `.env`; requests are validated, rate-limited, and authorized by Telegram user ID / WebApp `initData`.

## Features

- **Bot commands**: `/start`, `/help`, `/change`, `/change <old> <new>`, `/cancel`, `/status`
- **Upstream API**: `POST` with `X-API-KEY` + JSON `{ old_uid, new_uid }`
- **Security**: Zod config validation, UID sanitization, allowlist, initData HMAC verification, redacted logs, masked user errors
- **Abuse controls**: per-user rate limit (default 3/min), concurrent request locks
- **Resilience**: 10s timeout, exponential backoff on 5xx/network
- **Mini App**: dark neumorphic UI + Express `/api/change-uid`

## Project layout

```
src/
  config/env.ts          # Zod-validated environment
  bot/                   # Grammy bot + auth middleware
  services/              # API client, rate limiter, initData, orchestration
  server/httpServer.ts   # Express + static frontend
  utils/                 # logger, validation
frontend/                # Telegram Mini App (HTML/CSS/JS)
.env.example
```

## Setup

### 1. Requirements

- Node.js **18+**
- Telegram bot token from [@BotFather](https://t.me/BotFather)
- Upstream `UPSTREAM_API_KEY`

### 2. Install

```bash
npm install
cp .env.example .env
```

Edit `.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | yes | BotFather token |
| `UPSTREAM_API_KEY` | yes | Sent as `X-API-KEY` |
| `ALLOWED_ADMIN_IDS` | recommended | Comma-separated Telegram user IDs |
| `MINI_APP_URL` | optional | Public **HTTPS** URL of this app (menu button) |
| `PORT` / `HOST` | optional | HTTP bind (default `3000` / `0.0.0.0`) |
| `RATE_LIMIT_MAX` | optional | Default `3` |
| `RATE_LIMIT_WINDOW_MS` | optional | Default `60000` |
| `UPSTREAM_TIMEOUT_MS` | optional | Default `10000` |

### 3. Run

Development (TypeScript watch):

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

Health check: `GET http://localhost:3000/health`

### 4. Mini App (optional)

1. Deploy this process behind **HTTPS** (Telegram requirement for Web Apps).
2. Set `MINI_APP_URL` to that public URL (e.g. `https://uid.example.com`).
3. In BotFather → Bot Settings → Menu Button / Web App, point to the same URL (or rely on the bot setting menu button at startup).
4. Open the app **from Telegram**; bare browser tabs have no signed `initData`.

## Bot usage

```
/change
→ bot asks for old UID, then new UID

/change 12345 67890
→ one-shot change
```

## API (Mini App backend)

`POST /api/change-uid`

Headers:

- `Content-Type: application/json`
- `X-Telegram-Init-Data: <Telegram.WebApp.initData>`

Body:

```json
{ "old_uid": "string", "new_uid": "string" }
```

## Security notes

- Never commit `.env` or hardcode `X-API-KEY` / bot tokens.
- Empty `ALLOWED_ADMIN_IDS` allows **all** users (dev only); set a whitelist in production.
- Upstream keys are never returned to clients; logs redact sensitive headers.
- For multi-instance deploys, replace the in-memory rate limiter with Redis.

## License

Private / use as authorized by your upstream API terms.
