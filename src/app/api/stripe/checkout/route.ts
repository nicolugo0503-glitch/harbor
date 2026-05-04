import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const plan: string = body.plan ?? "pro";
    const session = await getSession().catch(() => null);
    const email: string | null = body.email ?? session?.email ?? null;
    const { Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
    let priceId: string | undefined;
    if (plan === "scale") priceId = process.env.STRIPE_SCALE_PRICE_ID;
    if (!priceId) priceId = process.env.STRIPE_PRO_PRICE_ID ?? process.env.STRIPE_PRICE_ID;
    if (!priceId) return NextResponse.json({ error: "No price configured." }, { status: 500 });
    const origin = req.headers.get("origin") ?? "https://harbor-black.vercel.app";
    const cs = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      ...(email ? { customer_email: email } : {}),
      success_url: `${origin}/dashboard?upgraded=${plan}`,
      cancel_url: `${origin}/dashboard`,
      metadata: { email: email ?? "", plan },
    });
    return NextResponse.json({ url: cs.url });
  } catch (e) {
    console.error("Stripe checkout error:", e);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
