const MAX_REQUESTS = 30;
const WINDOW_MS = 60_000;
const KV_KEY = 'rate-limit-bucket';

interface RateLimitState {
  count: number;
  windowStart: number;
}

export async function checkRateLimit(kv: KVNamespace): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const now = Date.now();

  let state: RateLimitState;

  try {
    const raw = await kv.get(KV_KEY);
    state = raw ? JSON.parse(raw) : { count: 0, windowStart: now };
  } catch {
    state = { count: 0, windowStart: now };
  }

  if (now - state.windowStart >= WINDOW_MS) {
    state = { count: 0, windowStart: now };
  }

  if (state.count >= MAX_REQUESTS) {
    const retryAfterMs = WINDOW_MS - (now - state.windowStart);
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
  }

  state.count += 1;

  try {
    await kv.put(KV_KEY, JSON.stringify(state), { expirationTtl: 120 });
  } catch {
    // KV write failed — allow the request through rather than blocking users
  }

  return { allowed: true, retryAfterMs: 0 };
}

export function rateLimitResponse(retryAfterMs: number): Response {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded. Too many users are using the app right now. Please try again in a moment.',
      type: 'rate_limit',
      retryAfter: retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
      },
    },
  );
}
