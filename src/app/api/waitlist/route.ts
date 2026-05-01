import { NextRequest, NextResponse } from "next/server";

const waitlist: { email: string; ts: string }[] = [];

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const already = waitlist.find((e) => e.email === email);
    if (already) {
      return NextResponse.json({ message: "Already on the list!", position: waitlist.length }, { status: 200 });
    }
    waitlist.push({ email, ts: new Date().toISOString() });
    return NextResponse.json({ message: "You're on the list!", position: waitlist.length }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ count: waitlist.length });
}
