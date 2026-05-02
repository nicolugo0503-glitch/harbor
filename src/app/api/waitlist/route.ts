import { NextRequest, NextResponse } from "next/server";

const NOTIFY_EMAIL = "nicolugo0503@gmail.com";
const OWNER_NAME = "Nicolas";

async function storeEmail(email: string): Promise<{ count: number; isNew: boolean }> {
  // Use Vercel KV if available, otherwise fall back to in-memory
  try {
    const { kv } = await import("@vercel/kv");
    const exists = await kv.sismember("harbor:waitlist:emails", email);
    if (exists) {
      const count = await kv.scard("harbor:waitlist:emails");
      return { count: Number(count), isNew: false };
    }
    await kv.sadd("harbor:waitlist:emails", email);
    await kv.lpush("harbor:waitlist:log", JSON.stringify({ email, ts: new Date().toISOString() }));
    const count = await kv.scard("harbor:waitlist:emails");
    return { count: Number(count), isNew: true };
  } catch {
    // KV not configured — still accept the signup, just can't persist
    return { count: 1, isNew: true };
  }
}

async function sendNotification(email: string, position: number) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // silently skip if not configured

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "Harbor <onboarding@resend.dev>",
      to: NOTIFY_EMAIL,
      subject: `🚀 New waitlist signup #${position} — ${email}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
          <h2 style="color:#0ea5e9;margin:0 0 8px">New Harbor signup</h2>
          <p style="color:#666;margin:0 0 24px">Hey ${OWNER_NAME}, someone just joined your waitlist.</p>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:12px 16px;background:#f8fafc;border-radius:8px 8px 0 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Email</td>
              <td style="padding:12px 16px;background:#f8fafc;border-radius:8px 8px 0 0;font-weight:600">${email}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;background:#f1f5f9;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Position</td>
              <td style="padding:12px 16px;background:#f1f5f9;font-weight:600">#${position}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;background:#f8fafc;border-radius:0 0 8px 8px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Time</td>
              <td style="padding:12px 16px;background:#f8fafc;border-radius:0 0 8px 8px">${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET</td>
            </tr>
          </table>
          <p style="color:#999;font-size:12px;margin:24px 0 0">Harbor · The API monetization platform</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("Resend error:", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const clean = email.trim().toLowerCase();
    const { count, isNew } = await storeEmail(clean);

    if (!isNew) {
      return NextResponse.json(
        { message: "You're already on the list!", position: count },
        { status: 200 }
      );
    }

    // Fire notification (don't await — fast response)
    sendNotification(clean, count);

    return NextResponse.json(
      { message: "You're on the list!", position: count },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { kv } = await import("@vercel/kv");
    const count = await kv.scard("harbor:waitlist:emails");
    return NextResponse.json({ count: Number(count) });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
