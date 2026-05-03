import { NextRequest, NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/kv";
import { v4 as uuidv4 } from "uuid";

/** Derive a stable ownerId from an email address. Matches the webhook's convention. */
function ownerIdFromEmail(email: string): string {
  return `stripe_${email.toLowerCase().replace(/[^a-z0-9]/gi, "_")}`;
}

/** Read the caller's email from the X-Customer-Email header. Falls back to demo owner. */
function getOwnerId(req: NextRequest): string {
  const email = req.headers.get("x-customer-email");
  if (email && email.includes("@")) return ownerIdFromEmail(email);
  return "owner_demo";
}

export async function GET(req: NextRequest) {
  try {
    const ownerId = getOwnerId(req);
    const projects = await listProjects(ownerId);
    return NextResponse.json({ projects });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to list projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, plan = "free" } = await req.json();
    if (!name || typeof name !== "string" || name.trim().length < 1) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }
    const ownerId = getOwnerId(req);
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
