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
      subject: `\uD83D\uDE80 Your Harbor ${plan} API key is ready`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px">
          <h2 style="color:#0ea5e9;margin:0 0 8px">Welcome to Harbor ${plan.charAt(0).toUpperCase() + plan.slice(1)}!</h2>
          <p style="color:#666;margin:0 0 24px">Here's your API key. Keep it safe.</p>
          <div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:24px">
            <p style="color:#94a3b8;font-size:12px;margin:0 0 8px;text-transform:uppercase">Your API Key</p>
            <code style="color:#38bdf8;font-size:14px;word-break:break-all">${apiKey}</code>
          </div>
          <a href="https://harbor-black.vercel.app/dashboard" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Go to Dashboard \u2192</a>
          <p style="color:#999;font-size:12px;margin:24px 0 0">Harbor \u00b7 The API monetization platform</p>
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
      subject: `\uD83D\uDCB0 New Harbor ${plan} subscriber \u2014 ${email}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
          <h2 style="color:#0ea5e9">New paying customer!</h2>
          <p style="color:#666">Plan: <strong>${plan}</strong> | Revenue: <strong style="color:#16a34a">${plan === "pro" ? "$49/mo" : "$299/mo"}</strong></p>
          <p style="color:#666">Email: ${email}</p>
          <p style="color:#999;font-size:12px">Harbor \u00b7 The API monetization platform</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("Owner notification error:", e);
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
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret) as typeof event;
    } else {
      event = JSON.parse(body);
    }
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { metadata?: { plan?: string; email?: string }; customer_email?: string };
    const plan = (session.metadata?.plan ?? "pro") as "free" | "pro" | "scale";
    const email = session.metadata?.email ?? session.customer_email ?? "";
    if (email) {
      try {
        const projectId = uuidv4();
        const project = await createProject({ id: projectId, name: `${email.split("@")[0]}'s API`, ownerId: `stripe_${email.replace(/[^a-z0-9]/gi, "_")}`, plan });
        const key = generateApiKey();
        await createApiKey({ id: uuidv4(), key, projectId: project.id, name: "Production", active: true });
        await Promise.all([sendWelcomeEmail(email, plan, key), sendOwnerNotification(email, plan)]);
      } catch (e) { console.error("Post-payment error:", e); }
    }
  }
  return NextResponse.json({ received: true });
}
