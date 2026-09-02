import Redis from "ioredis";
import { getEnv } from "./env";

declare global {
  var __ncrrRedis: Redis | undefined;
}

export function getRedis(): Redis {
  if (globalThis.__ncrrRedis) return globalThis.__ncrrRedis;
  const r = new Redis(getEnv().REDIS_URL, {
    maxRetriesPerRequest: 2,
    enableOfflineQueue: true,
    lazyConnect: false,
    keyPrefix: "ncrr:", // namespace: never collides with other apps on a shared Redis
  });
  r.on("error", () => { /* logged by callers; keep process alive */ });
  globalThis.__ncrrRedis = r;
  return r;
}
