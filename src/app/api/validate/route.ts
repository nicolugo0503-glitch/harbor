import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/kv";

/**
 * GET /api/validate?key=hbn_live_xxx
 * POST /api/validate  { "key": "hbr_live_xxx" }
 *
 * Public endpoint used by @harbor/sdk to validate API keys.
 * Returns plan info so developers can enforce plan-based access control.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Harbor-Key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") ?? req.headers.get("x-harbor-key");
  return handleValidation(key);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const key = body.key ?? req.headers.get("x-harbor-key");
    return handleValidation(key);
  } catch {
    return NextResponse.json(
      { valid: false, error: "Invalid request body" },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}

async function handleValidation(key: string | null) {
  if (!key || typeof key !== "string" || !key.startsWith("hbr_")) {
    return NextResponse.json(
      { valid: false, error: "Missing or malformed API key" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  try {
    const apiKey = await validateApiKey(key);

    if (!apiKey) {
      return NextResponse.json(
        { valid: false, error: "Invalid or revoked API key" },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        keyId: apiKey.id,
        projectId: apiKey.projectId,
        plan: "pro", // plan comes from the project â extendable
        callsThisMonth: apiKey.callsThisMonth,
        name: apiKey.name,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { valid: false, error: "Validation service unavailable" },
      { status: 503, headers: CORS_HEADERS }
    );
  }
}
