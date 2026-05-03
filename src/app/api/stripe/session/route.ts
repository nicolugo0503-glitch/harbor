import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 });
    }

    const { Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const email = session.customer_email ?? (session.metadata?.email ?? null);
    const plan = session.metadata?.plan ?? "pro";

    if (!email) {
      return NextResponse.json({ error: "No email found for this session" }, { status: 404 });
    }

    return NextResponse.json({ email, plan });
  } catch (e) {
    console.error("Session lookup error:", e);
    return NextResponse.json({ error: "Failed to retrieve session" }, { status: 500 });
  }
}
