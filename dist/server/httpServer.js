import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import { env } from "../config/env.js";
import { performChangeUid, isUserAllowed } from "../services/changeUidService.js";
import { verifyTelegramInitData } from "../services/telegramInitData.js";
import { logger } from "../utils/logger.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, "../../frontend");
export function createHttpServer() {
    const app = express();
    app.disable("x-powered-by");
    app.use(express.json({ limit: "32kb" }));
    // Static Mini App
    app.use(express.static(frontendRoot));
    app.get("/api/stats", (_req, res) => {
        const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const usedMem = (parseFloat(totalMem) - parseFloat(freeMem)).toFixed(2);
        let ut = os.uptime();
        const h = Math.floor(ut / 3600);
        const m = Math.floor((ut % 3600) / 60);
        const s = Math.floor(ut % 60);
        res.json({
            cpuModel: os.cpus()[0]?.model.trim() || 'Unknown CPU',
            loadAvg: os.loadavg()[0].toFixed(2),
            cpus: os.cpus().length,
            usedMem,
            totalMem,
            uptime: `${h}h ${m}m ${s}s`
        });
    });
    app.get("/health", (_req, res) => {
        const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const usedMem = (parseFloat(totalMem) - parseFloat(freeMem)).toFixed(2);
        let ut = os.uptime();
        const h = Math.floor(ut / 3600);
        const m = Math.floor((ut % 3600) / 60);
        const s = Math.floor(ut % 60);
        const uptimeStr = `${h}h ${m}m ${s}s`;
        const loadAvg = os.loadavg()[0].toFixed(2);
        const cpus = os.cpus().length;
        const cpuModel = os.cpus()[0]?.model.trim() || 'Unknown CPU';
        res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>System Status - RXKINGUID</title>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-deep: #0a0a0c;
      --bg-card: #12121a;
      --bg-panel: #16161f;
      --border: #2a1a1a;
      --border-glow: #5c1a1a;
      --text: #d4cfc7;
      --text-dim: #8a857d;
      --accent: #c41e3a;          /* blood crimson */
      --accent-soft: #8b1a2b;
      --gold: #c9a227;
      --gold-dim: #8a7220;
      --success: #3d9b6a;
      --shadow: 0 0 40px rgba(196, 30, 58, 0.15);
    }

    * {
      box-sizing: border-box;
    }

    body {
      background: var(--bg-deep);
      color: var(--text);
      font-family: 'Inter', system-ui, sans-serif;
      min-height: 100vh;
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 24px;
      position: relative;
    }

    body::before {
      content: "";
      position: fixed;
      top: -20px; left: -20px; right: -20px; bottom: -20px;
      background-image: 
        radial-gradient(ellipse at top, rgba(60, 10, 20, 0.45) 0%, transparent 65%),
        radial-gradient(ellipse at bottom right, rgba(40, 10, 30, 0.3) 0%, transparent 60%),
        url('/background.jpg');
      background-size: cover;
      background-position: center;
      filter: blur(3px) brightness(0.5);
      z-index: -1;
    }

    .fantasy-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 36px 40px;
      max-width: 520px;
      width: 100%;
      position: relative;
      box-shadow: 
        var(--shadow),
        inset 0 1px 0 rgba(255, 255, 255, 0.03);
    }

    /* Ornate corner decorations */
    .fantasy-card::before,
    .fantasy-card::after {
      content: '';
      position: absolute;
      width: 28px;
      height: 28px;
      border-color: var(--gold-dim);
      border-style: solid;
      opacity: 0.7;
    }
    .fantasy-card::before {
      top: 10px;
      left: 10px;
      border-width: 2px 0 0 2px;
    }
    .fantasy-card::after {
      bottom: 10px;
      right: 10px;
      border-width: 0 2px 2px 0;
    }

    .card-header {
      text-align: center;
      margin-bottom: 28px;
      position: relative;
    }

    h1 {
      font-family: 'Cinzel', serif;
      margin: 0 0 6px;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #f0e6d8;
      text-shadow: 0 0 20px rgba(196, 30, 58, 0.35);
    }

    .subtitle {
      margin: 0;
      font-size: 13px;
      color: var(--text-dim);
      letter-spacing: 0.5px;
    }

    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--border-glow), transparent);
      margin: 22px 0 26px;
      position: relative;
    }
    .divider::after {
      content: '◆';
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-card);
      color: var(--gold-dim);
      font-size: 10px;
      padding: 0 10px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 28px;
    }

    .stat-box {
      background: var(--bg-panel);
      border: 1px solid var(--border);
      padding: 18px 14px;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: border-color 0.25s ease, box-shadow 0.25s ease;
    }
    .stat-box:hover {
      border-color: var(--border-glow);
      box-shadow: 0 0 18px rgba(196, 30, 58, 0.12);
    }

    .stat-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 600;
      color: var(--text-dim);
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 18px;
      font-weight: 600;
      color: #e8e0d5;
      font-variant-numeric: tabular-nums;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 14px 20px;
      border-radius: 4px;
      background: linear-gradient(180deg, rgba(61, 155, 106, 0.08), rgba(61, 155, 106, 0.03));
      border: 1px solid rgba(61, 155, 106, 0.35);
      font-weight: 600;
      font-size: 13px;
      letter-spacing: 1.5px;
      color: var(--success);
      text-transform: uppercase;
    }

    .pulse {
      width: 10px;
      height: 10px;
      background-color: var(--success);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--success);
      animation: pulse-anim 1.8s infinite;
    }

    @keyframes pulse-anim {
      0%   { box-shadow: 0 0 0 0 rgba(61, 155, 106, 0.6); }
      70%  { box-shadow: 0 0 0 10px rgba(61, 155, 106, 0); }
      100% { box-shadow: 0 0 0 0 rgba(61, 155, 106, 0); }
    }

    /* subtle runic feel on corners */
    .corner-tl, .corner-br {
      position: absolute;
      width: 18px;
      height: 18px;
      pointer-events: none;
    }
    .corner-tl {
      top: 8px;
      right: 10px;
      border-top: 2px solid var(--gold-dim);
      border-right: 2px solid var(--gold-dim);
      opacity: 0.55;
    }
    .corner-br {
      bottom: 8px;
      left: 10px;
      border-bottom: 2px solid var(--gold-dim);
      border-left: 2px solid var(--gold-dim);
      opacity: 0.55;
    }
  </style>
</head>
<body>
  <div class="fantasy-card">
    <div class="corner-tl"></div>
    <div class="corner-br"></div>

    <div class="card-header">
      <h1>HOSTING CORE</h1>
      <p class="subtitle">${cpuModel}</p>
    </div>

    <div class="divider"></div>
    
    <div class="stats-grid">
      <div class="stat-box">
        <span class="stat-label">CPU Load</span>
        <span class="stat-value" id="val-load">${loadAvg}</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Cores</span>
        <span class="stat-value">${cpus} vCPUs</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">RAM Usage</span>
        <span class="stat-value" id="val-ram">${usedMem} / ${totalMem} GB</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Uptime</span>
        <span class="stat-value" id="val-uptime">${uptimeStr}</span>
      </div>
    </div>

    <div class="status-indicator">
      <div class="pulse"></div>
      ALL SYSTEMS OPERATIONAL
    </div>
  </div>

  <script>
    function updateStats() {
      fetch('/api/stats')
        .then(res => res.json())
        .then(data => {
          document.getElementById('val-load').innerText = data.loadAvg;
          document.getElementById('val-ram').innerText = data.usedMem + ' / ' + data.totalMem + ' GB';
          document.getElementById('val-uptime').innerText = data.uptime;
        })
        .catch(err => console.error("Error fetching stats:", err));
    }
    setInterval(updateStats, 1000);
  </script>
</body>
</html>`);
    });
    /**
     * Mini App API: change UID
     * Requires Telegram WebApp initData in X-Telegram-Init-Data header
     */
    app.post("/api/change-uid", async (req, res) => {
        try {
            const initData = (req.header("X-Telegram-Init-Data") ||
                req.header("x-telegram-init-data") ||
                "");
            if (!initData) {
                res.status(401).json({
                    ok: false,
                    message: "Missing Telegram init data.",
                });
                return;
            }
            const verified = verifyTelegramInitData(initData, env.TELEGRAM_BOT_TOKEN);
            if (!verified.ok) {
                res.status(401).json({
                    ok: false,
                    message: "Invalid or expired Telegram session.",
                });
                return;
            }
            const username = verified.user && typeof verified.user.username === "string"
                ? verified.user.username
                : undefined;
            if (!isUserAllowed(verified.userId, username)) {
                res.status(403).json({
                    ok: false,
                    message: "You are not authorized to use this service.",
                });
                return;
            }
            const result = await performChangeUid(verified.userId, {
                old_uid: req.body?.old_uid,
                new_uid: req.body?.new_uid,
            });
            const status = result.ok
                ? 200
                : result.code === "validation"
                    ? 400
                    : result.code === "rate_limit" || result.code === "locked"
                        ? 429
                        : result.code === "auth"
                            ? 403
                            : 502;
            if (status === 429) {
                res.setHeader("Retry-After", "60");
            }
            res.status(status).json({
                ok: result.ok,
                message: result.message,
            });
        }
        catch (err) {
            logger.error("HTTP /api/change-uid error", {
                message: err instanceof Error ? err.message : String(err),
            });
            res.status(500).json({
                ok: false,
                message: "Internal server error.",
            });
        }
    });
    // SPA fallback for Mini App
    app.get("*", (_req, res) => {
        res.sendFile(path.join(frontendRoot, "index.html"));
    });
    return app;
}
export function startHttpServer() {
    const app = createHttpServer();
    app.listen(env.PORT, env.HOST, () => {
        logger.info(`HTTP server listening on http://${env.HOST}:${env.PORT}`);
    });
}
//# sourceMappingURL=httpServer.js.map