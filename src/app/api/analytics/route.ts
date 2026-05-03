import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

// GET /api/analytics?projectId=xxx&email=xxx&days=7
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const projectId = searchParams.get("projectId");
  const email = searchParams.get("email");
  const days = Math.min(parseInt(searchParams.get("days") || "7"), 90);

  if (!projectId || !email) {
    return NextResponse.json({ error: "Missing projectId or email" }, { status: 400 });
  }

  try {
    const project = await kv.get<Record<string, unknown>>(`project:${projectId}`);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (project.ownerEmail !== email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }

  const dailyData = await Promise.all(
    dates.map(async (date) => {
      const [hourly, valid, invalid] = await Promise.all([
        kv.hgetall(`analytics:${projectId}:${date}`),
        kv.get<number>(`analytics:${projectId}:valid:${date}`),
        kv.get<number>(`analytics:${projectId}:invalid:${date}`),
      ]);
      const hours = hourly as Record<string, string> | null;
      const totalCalls = hours ? Object.values(hours).reduce((sum, v) => sum + parseInt(v || "0"), 0) : 0;
      return {
        date,
        calls: totalCalls,
        valid: valid || 0,
        invalid: invalid || 0,
        hourly: hours
          ? Array.from({ length: 24 }, (_, h) => ({ hour: h, calls: parseInt(hours[`h${h}`] || "0") }))
          : Array.from({ length: 24 }, (_, h) => ({ hour: h, calls: 0 })),
      };
    })
  );

  let recentCalls: unknown[] = [];
  try {
    const rawLog = await kv.lrange(`calllog:${projectId}`, 0, 49);
    recentCalls = rawLog.map((entry) => {
      try { return typeof entry === "string" ? JSON.parse(entry) : entry; } catch { return null; }
    }).filter(Boolean);
  } catch {}

  const totalCalls = dailyData.reduce((sum, d) => sum + d.calls, 0);
  const totalValid = dailyData.reduce((sum, d) => sum + d.valid, 0);
  const totalInvalid = dailyData.reduce((sum, d) => sum + d.invalid, 0);
  const successRate = totalCalls > 0 ? Math.round((totalValid / totalCalls) * 100) : 100;
  const todayCalls = dailyData[dailyData.length - 1]?.calls || 0;

  return NextResponse.json({ projectId, days, totalCalls, totalValid, totalInvalid, successRate, todayCalls, daily: dailyData, recentCalls });
          }
