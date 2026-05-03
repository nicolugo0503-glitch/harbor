import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getProject } from "@/lib/kv";

function ownerIdFromEmail(email: string): string {
  return "stripe_" + email.toLowerCase().replace(/[^a-z0-9]/gi, "_");
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const projectId = searchParams.get("projectId");
  const email = searchParams.get("email");
  const days = Math.min(parseInt(searchParams.get("days") || "7"), 90);

  if (!projectId || !email) {
    return NextResponse.json({ error: "Missing projectId or email" }, { status: 400 });
  }

  try {
    const project = await getProject(projectId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const expectedOwnerId = ownerIdFromEmail(email);
    if (project.ownerId !== expectedOwnerId && project.ownerId !== "owner_demo") {
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
      const analyticsKey = "analytics:" + projectId + ":" + date;
      const validKey = "analytics:" + projectId + ":valid:" + date;
      const invalidKey = "analytics:" + projectId + ":invalid:" + date;
      const [hourly, valid, invalid] = await Promise.all([
        kv.hgetall(analyticsKey),
        kv.get<number>(validKey),
        kv.get<number>(invalidKey),
      ]);
      const hours = hourly as Record<string, string> | null;
      const totalCalls = hours
        ? Object.values(hours).reduce((sum, v) => sum + parseInt(v || "0"), 0)
        : 0;
      return {
        date,
        calls: totalCalls,
        valid: valid || 0,
        invalid: invalid || 0,
        hourly: hours
          ? Array.from({ length: 24 }, (_, h) => ({ hour: h, calls: parseInt((hours["h" + h]) || "0") }))
          : Array.from({ length: 24 }, (_, h) => ({ hour: h, calls: 0 })),
      };
    })
  );

  let recentCalls: unknown[] = [];
  try {
    const calllogKey = "calllog:" + projectId;
    const rawLog = await kv.lrange(calllogKey, 0, 49);
    recentCalls = rawLog
      .map((entry) => {
        try { return typeof entry === "string" ? JSON.parse(entry) : entry; }
        catch { return null; }
      })
      .filter(Boolean);
  } catch {}

  const totalCalls = dailyData.reduce((sum, d) => sum + d.calls, 0);
  const totalValid = dailyData.reduce((sum, d) => sum + d.valid, 0);
  const totalInvalid = dailyData.reduce((sum, d) => sum + d.invalid, 0);
  const successRate = totalCalls > 0 ? Math.round((totalValid / totalCalls) * 100) : 100;
  const todayCalls = dailyData[dailyData.length - 1]?.calls || 0;

  return NextResponse.json({
    projectId, days, totalCalls, totalValid, totalInvalid,
    successRate, todayCalls, daily: dailyData, recentCalls,
  });
}
