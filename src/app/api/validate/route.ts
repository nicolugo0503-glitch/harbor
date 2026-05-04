import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { validateApiKey, getProject } from "@/lib/kv";

// Monthly call limits per plan — must match what the UI advertises
const PLAN_LIMITS: Record<string, number> = {
  free: 1_000,
  pro: 2_000_000,   // "Up to 2M API calls/mo"
  scale: Infinity,  // "Unlimited API calls"
};

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const windowMs = 60_000;
  const maxReqs = 120;
  const bucketKey = `rl:ip:${ip}:${Math.floor(now / windowMs)}`;
  try {
    const count = await kv.incr(bucketKey);
    if (count === 1) await kv.expire(bucketKey, 120);
    return { allowed: count <= maxReqs, remaining: Math.max(0, maxReqs - count) };
  } catch {
    return { allowed: true, remaining: maxReqs };
  }
}

async function logCall(data: {
  keyId: string;
  projectId: string;
  valid: boolean;
  ip: string;
  latencyMs: number;
  plan?: string;
}) {
  try {
    const now = new Date();
    const dateKey = now.toISOString().split("T")[0];
    const hour = now.getUTCHours();
    // Analytics retention: 90 days for pro, 365 days for scale, 30 for free
    const retentionDays = data.plan === "scale" ? 365 : data.plan === "pro" ? 90 : 30;
    const retentionSecs = retentionDays * 24 * 60 * 60;
    await kv.hincrby(`analytics:${data.projectId}:${dateKey}`, `h${hour}`, 1);
    await kv.expire(`analytics:${data.projectId}:${dateKey}`, retentionSecs);
    await kv.incr(`analytics:key:${data.keyId}:${dateKey}`);
    await kv.expire(`analytics:key:${data.keyId}:${dateKey}`, retentionSecs);
    const logEntry = JSON.stringify({
      ts: now.toISOString(),
      keyId: data.keyId,
      valid: data.valid,
      ip: data.ip.split(",")[0].trim().substring(0, 45),
      ms: data.latencyMs,
      plan: data.plan,
    });
    await kv.lpush(`calllog:${data.projectId}`, logEntry);
    await kv.ltrim(`calllog:${data.projectId}`, 0, 499);
    await kv.expire(`calllog:${data.projectId}`, retentionSecs);
    if (data.valid) {
      await kv.incr(`analytics:${data.projectId}:valid:${dateKey}`);
    } else {
      await kv.incr(`analytics:${data.projectId}:invalid:${dateKey}`);
    }
  } catch {}
}

async function handleValidate(req: NextRequest) {
  const start = Date.now();
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const country = req.headers.get("x-vercel-ip-country") || "unknown";

  const { allowed, remaining } = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { valid: false, error: "Rate limit exceeded. Try again in 60 seconds." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": "120",
          "X-RateLimit-Remaining": "0",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  let apiKey: string | null = null;
  if (req.method === "GET") {
    apiKey = req.nextUrl.searchParams.get("key");
  } else {
    try {
      const body = await req.json();
      apiKey = body.key;
    } catch {
      apiKey = req.nextUrl.searchParams.get("key");
    }
  }

  if (!apiKey || typeof apiKey !== "string") {
    return NextResponse.json(
      { valid: false, error: "Missing key parameter" },
      { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  let keyData = null;
  try {
    keyData = await validateApiKey(apiKey);
  } catch {
    return NextResponse.json(
      { valid: false, error: "Validation service unavailable" },
      { status: 503, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  const latencyMs = Date.now() - start;

  if (!keyData) {
    void logCall({ keyId: "unknown", projectId: "unknown", valid: false, ip, latencyMs });
    return NextResponse.json(
      { valid: false, error: "Invalid or revoked API key" },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "X-RateLimit-Remaining": String(remaining),
        },
      }
    );
  }

  // Fetch the project to get the real plan
  const project = await getProject(keyData.projectId).catch(() => null);
  const plan: "free" | "pro" | "scale" = (project?.plan ?? "pro") as "free" | "pro" | "scale";

  // Enforce monthly call limits
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.pro;
  const callsThisMonth = keyData.callsThisMonth || 0;
  if (isFinite(limit) && callsThisMonth > limit) {
    void logCall({ keyId: keyData.id, projectId: keyData.projectId, valid: false, ip, latencyMs, plan });
    return NextResponse.json(
      {
        valid: false,
        error: `Monthly call limit reached (${limit.toLocaleString()} calls for ${plan} plan). Upgrade to continue.`,
        plan,
        callsThisMonth,
        limit,
      },
      {
        status: 429,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "X-RateLimit-Remaining": String(remaining),
          "X-Harbor-Plan": plan,
        },
      }
    );
  }

  void logCall({ keyId: keyData.id, projectId: keyData.projectId, valid: true, ip, latencyMs, plan });

  return NextResponse.json(
    {
      valid: true,
      keyId: keyData.id,
      projectId: keyData.projectId,
      plan,
      callsThisMonth,
      limit: isFinite(limit) ? limit : null,
      name: keyData.name,
      country,
    },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "X-RateLimit-Remaining": String(remaining),
        "X-Harbor-Latency": String(latencyMs),
        "X-Harbor-Plan": plan,
      },
    }
  );
}

export async function GET(req: NextRequest) {
  return handleValidate(req);
}

export async function POST(req: NextRequest) {
  return handleValidate(req);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
