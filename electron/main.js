/**
 * VaultAI — Electron main process
 *
 * Lifecycle:
 *   1. Start the OpenClaw gateway as a child process (localhost-only)
 *   2. Start the Next.js dev/production server
 *   3. Open a BrowserWindow pointing at the Next.js URL
 *   4. On quit: kill both child processes
 *
 * Security hardening:
 *   - Gateway bound to 127.0.0.1 only (no remote exposure)
 *   - contextIsolation + sandbox enabled on renderer
 *   - No nodeIntegration in renderer
 */

import { app, BrowserWindow, shell } from "electron";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import net from "net";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const IS_DEV = !app.isPackaged;

const NEXT_PORT = 3100; // Use a different port from dev to avoid conflicts
const GATEWAY_PORT = 18789;
const GATEWAY_PROFILE = "vaultai";

let mainWindow = null;
let gatewayProcess = null;
let nextProcess = null;

// ---------------------------------------------------------------------------
// Port check
// ---------------------------------------------------------------------------
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close();
      resolve(false);
    });
    server.listen(port, "127.0.0.1");
  });
}

// ---------------------------------------------------------------------------
// Wait for a port to accept connections
// ---------------------------------------------------------------------------
function waitForPort(port, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const socket = new net.Socket();
      socket.setTimeout(500);
      socket
        .on("connect", () => {
          socket.destroy();
          resolve();
        })
        .on("timeout", () => {
          socket.destroy();
          retry();
        })
        .on("error", () => {
          retry();
        });
      socket.connect(port, "127.0.0.1");
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Port ${port} did not become available within ${timeoutMs}ms`));
      } else {
        setTimeout(check, 300);
      }
    };
    check();
  });
}

// ---------------------------------------------------------------------------
// Start OpenClaw gateway (if not already running)
// ---------------------------------------------------------------------------
async function startGateway() {
  const inUse = await isPortInUse(GATEWAY_PORT);
  if (inUse) {
    console.log(`[vaultai] Gateway already running on port ${GATEWAY_PORT}`);
    return;
  }

  try {
    console.log(`[vaultai] Starting OpenClaw gateway on port ${GATEWAY_PORT}...`);
    gatewayProcess = spawn("openclaw", ["--profile", GATEWAY_PROFILE, "gateway", "--port", String(GATEWAY_PORT)], {
      cwd: ROOT,
      stdio: "pipe",
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    gatewayProcess.stdout?.on("data", (d) => console.log(`[gateway] ${d.toString().trim()}`));
    gatewayProcess.stderr?.on("data", (d) => console.error(`[gateway] ${d.toString().trim()}`));
    gatewayProcess.on("exit", (code) => {
      console.log(`[gateway] exited with code ${code}`);
      gatewayProcess = null;
    });

    await waitForPort(GATEWAY_PORT);
    console.log("[vaultai] Gateway ready.");
  } catch (err) {
    console.warn("[vaultai] Gateway failed to start (optional):", err.message);
    console.warn("[vaultai] App will still work with cloud LLM providers.");
    gatewayProcess = null;
  }
}

// ---------------------------------------------------------------------------
// Start Next.js
// ---------------------------------------------------------------------------
async function startNext() {
  const inUse = await isPortInUse(NEXT_PORT);
  if (inUse) {
    console.log(`[vaultai] Next.js already running on port ${NEXT_PORT}`);
    return;
  }

  const cmd = IS_DEV ? "dev" : "start";
  console.log(`[vaultai] Starting Next.js (${cmd}) on port ${NEXT_PORT}...`);
  // Use node_modules/.bin/next directly — npx may not be on PATH in packaged app
  const nextBin = IS_DEV
    ? "npx"
    : path.join(ROOT, "node_modules", ".bin", "next");
  const nextArgs = IS_DEV
    ? ["next", cmd, "-p", String(NEXT_PORT)]
    : [cmd, "-p", String(NEXT_PORT)];
  nextProcess = spawn(nextBin, nextArgs, {
    cwd: ROOT,
    stdio: "pipe",
    env: { ...process.env, PORT: String(NEXT_PORT) },
  });

  nextProcess.stdout?.on("data", (d) => console.log(`[next] ${d.toString().trim()}`));
  nextProcess.stderr?.on("data", (d) => console.error(`[next] ${d.toString().trim()}`));
  nextProcess.on("exit", (code) => {
    console.log(`[next] exited with code ${code}`);
    nextProcess = null;
  });

  await waitForPort(NEXT_PORT);
  console.log("[vaultai] Next.js ready.");
}

// ---------------------------------------------------------------------------
// Create window
// ---------------------------------------------------------------------------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    title: "VaultAI",
    titleBarStyle: "hiddenInset",
    backgroundColor: "#050505",
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${NEXT_PORT}`);

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
let appReady = false;

async function ensureServersAndCreateWindow() {
  await startGateway();
  await startNext();
  appReady = true;
  createWindow();
}

app.whenReady().then(async () => {
  try {
    await ensureServersAndCreateWindow();
  } catch (err) {
    console.error("[vaultai] Startup failed:", err);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (!appReady) {
      try {
        await ensureServersAndCreateWindow();
      } catch (err) {
        console.error("[vaultai] Re-launch failed:", err);
      }
    } else {
      createWindow();
    }
  }
});

app.on("before-quit", () => {
  if (gatewayProcess) {
    console.log("[vaultai] Stopping gateway...");
    gatewayProcess.kill("SIGTERM");
  }
  if (nextProcess) {
    console.log("[vaultai] Stopping Next.js...");
    nextProcess.kill("SIGTERM");
  }
});
