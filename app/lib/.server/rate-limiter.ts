const MAX_REQUESTS = 30;
const WINDOW_MS = 60_000;
const KV_KEY = 'rate-limit-bucket';

interface RateLimitState {
  count: number;
  windowStart: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForRateLimit(kv: KVNamespace): Promise<void> {
  while (true) {
    const now = Date.now();

    let state: RateLimitState;

    try {
      const raw = await kv.get(KV_KEY);
      state = raw ? JSON.parse(raw) : { count: 0, windowStart: now };
    } catch {
      return;
    }

    if (now - state.windowStart >= WINDOW_MS) {
      state = { count: 0, windowStart: now };
    }

    if (state.count < MAX_REQUESTS) {
      state.count += 1;

      try {
        await kv.put(KV_KEY, JSON.stringify(state), { expirationTtl: 120 });
      } catch {
        // KV write failed — allow the request through
      }

      return;
    }

    const waitMs = WINDOW_MS - (now - state.windowStart);
    await sleep(Math.max(waitMs, 1000));
  }
}
