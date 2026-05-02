import { NextRequest, NextResponse } from "next/server";
import { createApiKey, listKeys, revokeKey } from "@/lib/kv";
import { v4 as uuidv4 } from "uuid";

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "hbr_live_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    const keys = await listKeys(projectId);
    return NextResponse.json({ keys });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to list keys" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, name } = await req.json();
    if (!projectId || !name) {
      return NextResponse.json({ error: "projectId and name are required" }, { status: 400 });
    }
    const apiKey = await createApiKey({
      id: uuidv4(),
      key: generateApiKey(),
      projectId,
      name: name.trim(),
      active: true,
    });
    return NextResponse.json({ apiKey }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create key" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { keyId } = await req.json();
    if (!keyId) {
      return NextResponse.json({ error: "keyId is required" }, { status: 400 });
    }
    await revokeKey(keyId);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to revoke key" }, { status: 500 });
  }
}
