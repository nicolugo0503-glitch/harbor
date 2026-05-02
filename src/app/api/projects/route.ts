import { NextRequest, NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/kv";
import { v4 as uuidv4 } from "uuid";

// Simple auth: read ownerId from a header (in production you'd use Clerk/Auth.js)
// For now we use a fixed demo owner so the dashboard works without a full auth system
const DEMO_OWNER = "owner_demo";

export async function GET() {
  try {
    const projects = await listProjects(DEMO_OWNER);
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
    const project = await createProject({
      id: uuidv4(),
      name: name.trim(),
      ownerId: DEMO_OWNER,
      plan,
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
