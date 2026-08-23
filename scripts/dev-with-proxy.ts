/**
 * Starts db-proxy, waits until 127.0.0.1:3307 accepts connections, then next dev.
 * Use `npm run dev` after laptop restart so MySQL proxy is always up.
 */
import { spawn, type ChildProcess } from "child_process";
import net from "net";
import path from "path";

const root = process.cwd();
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";
const npxCmd = isWin ? "npx.cmd" : "npx";

const PROXY_PORT = Number(process.env.DB_PROXY_PORT || 3307);
const PROXY_HOST = "127.0.0.1";
const WAIT_MS = 45_000;
const POLL_MS = 400;

const children: ChildProcess[] = [];

function run(cmd: string, args: string[], name: string): ChildProcess {
  const child = spawn(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: isWin,
    env: process.env,
  });
  children.push(child);
  child.on("exit", (code, signal) => {
    if (name === "next") {
      shutdown(code ?? (signal ? 1 : 0));
    }
  });
  return child;
}

function canConnect(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.setTimeout(800, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForProxy(): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < WAIT_MS) {
    if (await canConnect(PROXY_PORT, PROXY_HOST)) return true;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  return false;
}

function shutdown(code = 0) {
  for (const child of children) {
    try {
      if (!child.killed) child.kill();
    } catch {
      /* ignore */
    }
  }
  process.exit(code);
}

async function main() {
  console.log(`[dev] starting db-proxy on ${PROXY_HOST}:${PROXY_PORT}…`);
  run(npxCmd, ["tsx", path.join("scripts", "db-proxy.ts")], "db-proxy");

  const ready = await waitForProxy();
  if (!ready) {
    console.error(
      `[dev] db-proxy did not become ready on ${PROXY_HOST}:${PROXY_PORT} within ${WAIT_MS}ms.\n` +
        `  → Hostinger MySQL needs IPv6. Check network / VPN, then: npm run db:proxy\n` +
        `  → Or set DATABASE_URL to a reachable MySQL host.`
    );
    shutdown(1);
    return;
  }

  console.log(`[dev] db-proxy ready — starting Next.js…`);
  run(npmCmd, ["run", "dev:next"], "next");
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

main().catch((e) => {
  console.error(e);
  shutdown(1);
});
