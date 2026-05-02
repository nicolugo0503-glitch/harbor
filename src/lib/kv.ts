/**
 * Harbor KV helpers — thin wrappers around Vercel KV (Redis).
 * Falls back gracefully if KV env vars aren't set yet.
 */

export type Project = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  plan: "free" | "pro" | "scale";
};

export type ApiKey = {
  id: string;
  key: string; // hbr_live_XXXX
  projectId: string;
  name: string;
  createdAt: string;
  lastUsed: string | null;
  callsThisMonth: number;
  active: boolean;
};

async function getKV() {
  const { kv } = await import("@vercel/kv");
  return kv;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export async function createProject(data: Omit<Project, "createdAt">): Promise<Project> {
  const kv = await getKV();
  const project: Project = { ...data, createdAt: new Date().toISOString() };
  await kv.set(`harbor:project:${data.id}`, project);
  await kv.sadd(`harbor:owner:${data.ownerId}:projects`, data.id);
  return project;
}

export async function getProject(id: string): Promise<Project | null> {
  const kv = await getKV();
  return kv.get<Project>(`harbor:project:${id}`);
}

export async function listProjects(ownerId: string): Promise<Project[]> {
  const kv = await getKV();
  const ids = await kv.smembers(`harbor:owner:${ownerId}:projects`);
  if (!ids.length) return [];
  const projects = await Promise.all(ids.map((id) => kv.get<Project>(`harbor:project:${id}`)));
  return projects.filter(Boolean) as Project[];
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

export async function createApiKey(data: Omit<ApiKey, "createdAt" | "lastUsed" | "callsThisMonth">): Promise<ApiKey> {
  const kv = await getKV();
  const apiKey: ApiKey = {
    ...data,
    createdAt: new Date().toISOString(),
    lastUsed: null,
    callsThisMonth: 0,
  };
  await kv.set(`harbor:key:${data.id}`, apiKey);
  await kv.set(`harbor:keyval:${data.key}`, data.id); // reverse lookup
  await kv.sadd(`harbor:project:${data.projectId}:keys`, data.id);
  return apiKey;
}

export async function listKeys(projectId: string): Promise<ApiKey[]> {
  const kv = await getKV();
  const ids = await kv.smembers(`harbor:project:${projectId}:keys`);
  if (!ids.length) return [];
  const keys = await Promise.all(ids.map((id) => kv.get<ApiKey>(`harbor:key:${id}`)));
  return (keys.filter(Boolean) as ApiKey[]).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function revokeKey(keyId: string): Promise<void> {
  const kv = await getKV();
  const key = await kv.get<ApiKey>(`harbor:key:${keyId}`);
  if (!key) return;
  await kv.set(`harbor:key:${keyId}`, { ...key, active: false });
}

// ─── Validate (used by middleware) ───────────────────────────────────────────

export async function validateApiKey(rawKey: string): Promise<ApiKey | null> {
  try {
    const kv = await getKV();
    const keyId = await kv.get<string>(`harbor:keyval:${rawKey}`);
    if (!keyId) return null;
    const key = await kv.get<ApiKey>(`harbor:key:${keyId}`);
    if (!key || !key.active) return null;
    // Update last used + increment counter (fire and forget)
    kv.set(`harbor:key:${keyId}`, {
      ...key,
      lastUsed: new Date().toISOString(),
      callsThisMonth: key.callsThisMonth + 1,
    });
    return key;
  } catch {
    return null;
  }
}

// ─── Waitlist helpers ─────────────────────────────────────────────────────────

export async function getWaitlistEmails(): Promise<string[]> {
  const kv = await getKV();
  return kv.smembers("harbor:waitlist:emails");
}
