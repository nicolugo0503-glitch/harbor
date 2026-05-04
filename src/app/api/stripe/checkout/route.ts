import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const email = session?.email ?? null;

    const { Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-06-20",
    });

    const priceId = process.env.STRIPE_PRO_PRICE_ID ?? process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "No Stripe price configured. Set STRIPE_PRO_PRICE_ID in Vercel env vars." },
        { status: 500 }
      );
    }

    const origin = req.headers.get("origin") ?? "https://harbor-black.vercel.app";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email ?? undefined,
      success_url: `${origin}/dashboard?upgraded=1`,
      cancel_url: `${origin}/dashboard`,
      metadata: { email: email ?? "" },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (e) {
    console.error("Stripe checkout error:", e);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
