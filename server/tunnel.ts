import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { db } from './db.ts';

let tunnelProcess: ChildProcess | null = null;
let currentPublicUrl: string = '';
let isStarting = false;
let restartAttempts = 0;

const BIN_PATH = path.resolve(process.cwd(), 'bin', 'cloudflared');

/**
 * Downloads cloudflared if missing.
 */
async function ensureBinary(): Promise<boolean> {
  if (fs.existsSync(BIN_PATH)) {
    return true;
  }

  console.log('[TunnelManager] cloudflared binary not found in ./bin, downloading...');
  try {
    fs.mkdirSync(path.dirname(BIN_PATH), { recursive: true });
    const { execSync } = await import('node:child_process');
    execSync(`curl -s -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o "${BIN_PATH}" && chmod +x "${BIN_PATH}"`, {
      timeout: 30000
    });
    return fs.existsSync(BIN_PATH);
  } catch (err) {
    console.warn('[TunnelManager] Could not download cloudflared:', err);
    return false;
  }
}

/**
 * Launches the Cloudflare tunnel and parses the assigned trycloudflare.com URL
 */
export async function startTunnel(): Promise<string> {
  if (tunnelProcess && currentPublicUrl) {
    return currentPublicUrl;
  }
  if (isStarting) return currentPublicUrl;
  isStarting = true;

  try {
    const ready = await ensureBinary();
    if (!ready) {
      console.warn('[TunnelManager] Binary unavailable, skipping tunnel launch.');
      isStarting = false;
      return '';
    }

    // Kill any orphan cloudflared process before launching fresh
    if (tunnelProcess) {
      try {
        tunnelProcess.kill('SIGKILL');
      } catch {}
      tunnelProcess = null;
    }

    console.log('[TunnelManager] Spawning cloudflared HTTP/2 tunnel on http://localhost:3000...');

    tunnelProcess = spawn(BIN_PATH, [
      'tunnel',
      '--protocol',
      'http2',
      '--url',
      'http://localhost:3000'
    ], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const handleOutput = (data: Buffer) => {
      const text = data.toString();
      const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
      if (match && match[0]) {
        const foundUrl = match[0].trim();
        if (foundUrl !== currentPublicUrl) {
          currentPublicUrl = foundUrl;
          restartAttempts = 0;
          console.log('\n=============================================================');
          console.log(`[TunnelManager] 🚀 LIVE 100% PUBLIC URL ESTABLISHED:`);
          console.log(`Main Store:    ${currentPublicUrl}/`);
          console.log(`Customer Order: ${currentPublicUrl}/order?ref=VIP_CLIENT&src=whatsapp`);
          console.log('=============================================================\n');

          // Tunnel is available as diagnostic fallback, and automatically published to Firestore cloud database
          console.log(`[TunnelManager] Tunnel active at: ${foundUrl}`);
          db.publishServerInfo(foundUrl).catch(() => {});
        }
      }
    };

    tunnelProcess.stdout?.on('data', handleOutput);
    tunnelProcess.stderr?.on('data', handleOutput);

    tunnelProcess.on('exit', (code, signal) => {
      console.warn(`[TunnelManager] Tunnel process exited (code=${code}, signal=${signal}).`);
      tunnelProcess = null;
      // Auto-heal with exponential backoff if not manually stopped
      if (restartAttempts < 20) {
        restartAttempts++;
        const delay = Math.min(3000 * restartAttempts, 15000);
        console.log(`[TunnelManager] Auto-restarting tunnel in ${delay / 1000}s (attempt ${restartAttempts})...`);
        setTimeout(() => {
          isStarting = false;
          startTunnel().catch(() => {});
        }, delay);
      }
    });

    tunnelProcess.on('error', (err) => {
      console.error('[TunnelManager] Process error:', err);
    });

    // Wait up to 10s to capture initial URL
    const startTime = Date.now();
    while (!currentPublicUrl && Date.now() - startTime < 10000) {
      await new Promise(r => setTimeout(r, 400));
    }

    return currentPublicUrl;
  } catch (err) {
    console.error('[TunnelManager] Failed to start tunnel:', err);
    return '';
  } finally {
    isStarting = false;
  }
}

export function getTunnelUrl(): string {
  return currentPublicUrl;
}

export async function restartTunnel(): Promise<string> {
  restartAttempts = 0;
  if (tunnelProcess) {
    try {
      tunnelProcess.kill('SIGKILL');
    } catch {}
    tunnelProcess = null;
  }
  currentPublicUrl = '';
  isStarting = false;
  return await startTunnel();
}
