import { NextRequest, NextResponse } from "next/server";
import { createProject, createApiKey } from "@/lib/kv";
import { v4 as uuidv4 } from "uuid";

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "hbr_live_";
  for (let i = 0; i < 32; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

async function sendWelcomeEmail(email: string, plan: string, apiKey: string) {
  const apiKeyResend = process.env.RESEND_API_KEY;
  if (!apiKeyResend) return;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKeyResend);
    await resend.emails.send({
      from: "Harbor <onboarding@resend.dev>",
      to: email,
      subject: `🚀 Your Harbor ${plan} API key is ready`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px">
          <h2 style="color:#0ea5e9;margin:0 0 8px">Welcome to Harbor ${plan.charAt(0).toUpperCase() + plan.slice(1)}!</h2>
          <p style="color:#666;margin:0 0 24px">Here’s your API key. Keep it safe — you can always manage it from your dashboard.</p>
          <div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:24px">
            <p style="color:#94a3b8;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em">Your API Key</p>
            <code style="color:#38bdf8;font-size:14px;word-break:break-all">${apiKey}</code>
          </div>
          <p style="color:#666;margin:0 0 16px">Add it to your API calls:</p>
          <div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:24px">
            <code style="color:#94a3b8;font-size:13px">curl -H "X-Harbor-Key: ${apiKey}" https://your-api.com/endpoint</code>
          </div>
          <a href="https://harbor-black.vercel.app/dashboard" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Go to Dashboard →</a>
          <p style="color:#999;font-size:12px;margin:24px 0 0">Harbor · The API monetization platform</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("Resend error:", e);
  }
}

async function sendOwnerNotification(email: string, plan: string) {
  const apiKeyResend = process.env.RESEND_API_KEY;
  if (!apiKeyResend) return;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKeyResend);
    await resend.emails.send({
      from: "Harbor <onboarding@resend.dev>",
      to: "nicolugo0503@gmail.com",
      subject: `💰 New Harbor ${plan} subscriber — ${email}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
          <h2 style="color:#0ea5e9;margin:0 0 8px">New paying customer!</h2>
          <p style="color:#666">Someone just subscribed to Harbor ${plan.charAt(0).toUpperCase() + plan.slice(1)}.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <tr><td style="padding:10px 14px;background:#f8fafc;font-size:12px;color:#888;text-transform:uppercase">Email</td><td style="padding:10px 14px;background:#f8fafc;font-weight:600">${email}</td></tr>
            <tr><td style="padding:10px 14px;background:#f1f5f9;font-size:12px;color:#888;text-transform:uppercase">Plan</td><td style="padding:10px 14px;background:#f1f5f9;font-weight:600">${plan}</td></tr>
            <tr><td style="padding:10px 14px;background:#f8fafc;font-size:12px;color:#888;text-transform:uppercase">Revenue</td><td style="padding:10px 14px;background:#f8fafc;font-weight:600;color:#16a34a">${plan === "pro" ? "$49/mo" : "$299/mo"}</td></tr>
            <tr><td style="padding:10px 14px;background:#f1f5f9;font-size:12px;color:#888;text-transform:uppercase">Time</td><td style="padding:10px 14px;background:#f1f5f9">${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET</td></tr>
          </table>
          <p style="color:#999;font-size:12px;margin:24px 0 0">Harbor · The API monetization platform</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("Resend owner notification error:", e);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: { type: string; data: { object: Record<string, unknown> } };

  try {
    if (webhookSecret && sig) {
      const { Stripe } = await import("stripe");
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret) as unknown as typeof event;
    } else {
      // During initial setup before webhook secret is configured
      event = JSON.parse(body);
    }
  } catch (e) {
    console.error("Webhook signature error:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      metadata?: { plan?: string; email?: string };
      customer_email?: string;
    };
    const plan = (session.metadata?.plan ?? "pro") as "free" | "pro" | "scale";
    const email = session.metadata?.email ?? session.customer_email ?? "";

    if (email) {
      try {
        // Create a project for this customer
        const projectId = uuidv4();
        const project = await createProject({
          id: projectId,
          name: `${email.split("@")[0]}'s API`,
          ownerId: `stripe_${email.toLowerCase().replace(/[^a-z0-9]/gi, "_")}`,
          plan,
        });

        // Generate their first API key
        const key = generateApiKey();
        await createApiKey({
          id: uuidv4(),
          key,
          projectId: project.id,
          name: "Production",
          active: true,
        });

        // Email customer their key + notify owner
        await Promise.all([
          sendWelcomeEmail(email, plan, key),
          sendOwnerNotification(email, plan),
        ]);
      } catch (e) {
        console.error("Post-payment setup error:", e);
      }
    }
  }

  return NextResponse.json({ received: true });
}
