import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { plan, email } = await req.json();

    if (!plan || !email) {
      return NextResponse.json({ error: "plan and email are required" }, { status: 400 });
    }

    const priceId =
      plan === "pro"
        ? process.env.STRIPE_PRO_PRICE_ID
        : plan === "scale"
        ? process.env.STRIPE_SCALE_PRICE_ID
        : null;

    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const { Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://harbor-black.vercel.app"}/dashboard?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://harbor-black.vercel.app"}/#pricing`,
      metadata: { plan, email },
      subscription_data: {
        metadata: { plan, email },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Stripe checkout error:", e);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
