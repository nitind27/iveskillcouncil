/**
 * Local TCP proxy: 127.0.0.1:3307 -> Hostinger MySQL
 * Prefers IPv4 when reachable (many Windows networks time out on IPv6).
 * Falls back to IPv6 if IPv4 connect fails.
 */
import net from "net";
import dns from "dns/promises";

const LOCAL_PORT = Number(process.env.DB_PROXY_PORT || 3307);
const REMOTE_HOST = process.env.DB_PROXY_HOST || "srv948.hstgr.io";
const REMOTE_PORT = Number(process.env.DB_PROXY_REMOTE_PORT || 3306);
const CONNECT_TIMEOUT_MS = Number(process.env.DB_PROXY_CONNECT_TIMEOUT_MS || 10_000);

type Target = { address: string; family: 4 | 6 };

async function resolveTargets(host: string): Promise<Target[]> {
  if (net.isIP(host)) {
    return [{ address: host, family: (net.isIPv6(host) ? 6 : 4) as 4 | 6 }];
  }

  const targets: Target[] = [];
  try {
    const v4 = await dns.lookup(host, { all: true, family: 4 });
    for (const r of v4) targets.push({ address: r.address, family: 4 });
  } catch {
    /* no v4 */
  }
  try {
    const v6 = await dns.lookup(host, { all: true, family: 6 });
    for (const r of v6) targets.push({ address: r.address, family: 6 });
  } catch {
    /* no v6 */
  }
  if (!targets.length) throw new Error(`No A/AAAA records for ${host}`);
  return targets;
}

function probe(target: Target, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({
      host: target.address,
      port,
      family: target.family,
    });
    const done = (ok: boolean) => {
      socket.removeAllListeners();
      if (!socket.destroyed) socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.on("connect", () => done(true));
    socket.on("error", () => done(false));
  });
}

async function pickWorkingTarget(targets: Target[]): Promise<Target> {
  // Prefer IPv4 first — Windows/ISP stacks often break IPv6 to Hostinger
  const ordered = [
    ...targets.filter((t) => t.family === 4),
    ...targets.filter((t) => t.family === 6),
  ];

  for (const t of ordered) {
    const ok = await probe(t, REMOTE_PORT, Math.min(CONNECT_TIMEOUT_MS, 5000));
    console.log(
      `[db-proxy] probe ${t.family === 6 ? `[${t.address}]` : t.address}:${REMOTE_PORT} → ${ok ? "ok" : "fail"}`
    );
    if (ok) return t;
  }
  // Last resort: first target (may still work intermittently)
  return ordered[0];
}

function pipeSockets(a: net.Socket, b: net.Socket) {
  a.pipe(b);
  b.pipe(a);
  const endBoth = () => {
    if (!a.destroyed) a.destroy();
    if (!b.destroyed) b.destroy();
  };
  a.on("error", endBoth);
  b.on("error", endBoth);
  a.on("close", endBoth);
  b.on("close", endBoth);
}

async function main() {
  let targets = await resolveTargets(REMOTE_HOST);
  let active = await pickWorkingTarget(targets);
  console.log(
    `[db-proxy] ${REMOTE_HOST} using ${active.family === 6 ? "IPv6" : "IPv4"} ${active.address}`
  );

  // Refresh DNS + re-probe periodically
  setInterval(() => {
    resolveTargets(REMOTE_HOST)
      .then(async (next) => {
        targets = next;
        const picked = await pickWorkingTarget(next);
        if (picked.address !== active.address || picked.family !== active.family) {
          console.log(
            `[db-proxy] switch ${active.address} → ${picked.address} (v${picked.family})`
          );
          active = picked;
        }
      })
      .catch(() => {});
  }, 60_000);

  const server = net.createServer((client) => {
    client.setNoDelay(true);

    const remote = net.connect({
      host: active.address,
      port: REMOTE_PORT,
      family: active.family,
    });
    remote.setNoDelay(true);

    let settled = false;
    const fail = (reason: string) => {
      if (settled) return;
      settled = true;
      if (!client.destroyed) client.destroy();
      if (!remote.destroyed) remote.destroy();
      if (reason) console.error(`[db-proxy] ${reason}`);
    };

    const connectTimer = setTimeout(
      () => fail(`remote connect timeout (v${active.family} ${active.address})`),
      CONNECT_TIMEOUT_MS
    );

    remote.on("connect", () => {
      clearTimeout(connectTimer);
      settled = true;
      pipeSockets(client, remote);
    });

    remote.on("error", (e) => {
      clearTimeout(connectTimer);
      fail(`remote: ${e.message}`);
    });
    client.on("error", () => {
      clearTimeout(connectTimer);
      fail("");
    });
  });

  server.on("error", (e: NodeJS.ErrnoException) => {
    if (e.code === "EADDRINUSE") {
      console.error(`[db-proxy] port ${LOCAL_PORT} already in use — reuse existing proxy`);
      process.exit(0);
    }
    console.error("[db-proxy] server error", e);
    process.exit(1);
  });

  server.listen(LOCAL_PORT, "127.0.0.1", () => {
    console.log(
      `[db-proxy] listening on 127.0.0.1:${LOCAL_PORT} -> ${
        active.family === 6 ? `[${active.address}]` : active.address
      }:${REMOTE_PORT}`
    );
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
