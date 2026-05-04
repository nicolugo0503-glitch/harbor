import { NextRequest, NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/kv";
import { v4 as uuidv4 } from "uuid";

// Project limits per plan — must match UI
const PROJECT_LIMITS: Record<string, number> = {
  free: 1,
  pro: 10,
  scale: Infinity,
};

function ownerIdFromEmail(email: string): string {
  return `stripe_${email.toLowerCase().replace(/[^a-z0-9]/gi, "_")}`;
}

function getEmail(req: NextRequest, body?: Record<string, unknown>): string | null {
  const headerEmail = req.headers.get("x-customer-email");
  if (headerEmail && headerEmail.includes("@")) return headerEmail;
  const queryEmail = req.nextUrl.searchParams.get("email");
  if (queryEmail && queryEmail.includes("@")) return queryEmail;
  if (body?.email && typeof body.email === "string" && body.email.includes("@")) return body.email;
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const email = getEmail(req);
    const ownerId = email ? ownerIdFromEmail(email) : "owner_demo";
    const projects = await listProjects(ownerId);
    return NextResponse.json({ projects });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to list projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, plan = "free" } = body;

    if (!name || typeof name !== "string" || name.trim().length < 1) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const email = getEmail(req, body);
    const ownerId = email ? ownerIdFromEmail(email) : "owner_demo";

    // Enforce project count limit for this owner based on their plan
    const existing = await listProjects(ownerId);
    // Determine the owner's plan from their most recently created project
    const ownerPlan = existing.length > 0
      ? (existing.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].plan ?? "free")
      : plan;
    const limit = PROJECT_LIMITS[ownerPlan] ?? PROJECT_LIMITS.free;

    if (isFinite(limit) && existing.length >= limit) {
      return NextResponse.json(
        {
          error: `Project limit reached. Your ${ownerPlan} plan allows up to ${limit} project${limit === 1 ? "" : "s"}. Upgrade to create more.`,
          limit,
          current: existing.length,
          plan: ownerPlan,
        },
        { status: 403 }
      );
    }

    const project = await createProject({
      id: uuidv4(),
      name: name.trim(),
      ownerId,
      plan,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
