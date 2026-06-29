const MAX_REQUESTS = 30;
const WINDOW_MS = 60_000;
const KV_KEY = 'rate-limit-bucket';
const MAX_WAIT_MS = 90_000;

interface RateLimitState {
  count: number;
  windowStart: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForRateLimit(kv: KVNamespace): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt++) {
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

    const waitMs = Math.min(WINDOW_MS - (now - state.windowStart), MAX_WAIT_MS);

    if (attempt >= 4) {
      return;
    }

    await sleep(waitMs);
  }
}
