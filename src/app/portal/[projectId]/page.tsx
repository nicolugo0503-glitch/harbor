import { notFound } from "next/navigation";
import { kv } from "@vercel/kv";

interface Project { id: string; name: string; ownerEmail: string; createdAt: string; }
interface ApiKey { id: string; name: string; key: string; plan: string; callsThisMonth?: number; }

async function getProjectData(projectId: string) {
  const project = await kv.get<Project>(`project:${projectId}`);
  if (!project) return null;
  const keyIds: string[] = await kv.smembers(`project:${projectId}:keys`) || [];
  const keys = (await Promise.all(keyIds.map(id => kv.get<ApiKey>(`apikey:${id}`)))).filter(Boolean) as ApiKey[];
  return { project, keys };
}

export async function generateMetadata({ params }: { params: { projectId: string } }) {
  const data = await getProjectData(params.projectId);
  const name = data?.project?.name || "API";
  return { title: `${name} — API Keys`, description: `Manage your ${name} API keys` };
}

export default async function PortalPage({ params }: { params: { projectId: string } }) {
  const data = await getProjectData(params.projectId);
  if (!data) notFound();
  const { project, keys } = data;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{project.name}</div>
          <div style={{ color: "#555", fontSize: 13, marginTop: 2 }}>API Key Portal</div>
        </div>
        <a href="https://harbor-black.vercel.app" style={{ color: "#555", fontSize: 12, textDecoration: "none" }}>
          Powered by ⚓ Harbor
        </a>
      </div>

      <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 24px" }}>
        {/* Intro */}
        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "24px 28px", marginBottom: 28 }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Your API Keys</div>
          <p style={{ color: "#666", lineHeight: 1.6, margin: 0 }}>
            Use these keys to authenticate requests to the {project.name} API. 
            Include your key as the <code style={{ background: "#1a1a1a", padding: "1px 6px", borderRadius: 4, fontSize: 13 }}>x-harbor-key</code> header.
          </p>
        </div>

        {/* Keys */}
        {keys.length === 0 ? (
          <div style={{ textAlign: "center", color: "#555", padding: "60px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔑</div>
            <div>No API keys have been issued yet.</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Contact the {project.name} team to get access.</div>
          </div>
        ) : (
          keys.map(key => (
            <div key={key.id} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 10, padding: "20px 24px", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{key.name}</div>
                  <span style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 4, padding: "2px 8px", fontSize: 11, color: "#888", marginTop: 4, display: "inline-block" }}>
                    {key.plan}
                  </span>
                </div>
                {key.callsThisMonth !== undefined && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{key.callsThisMonth.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: "#555" }}>calls this month</div>
                  </div>
                )}
              </div>
              <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <code style={{ fontSize: 13, color: "#888", letterSpacing: 0.5 }}>{key.key}</code>
                <span style={{ fontSize: 11, color: "#444" }}>Keep this secret</span>
              </div>
            </div>
          ))
        )}

        {/* Usage example */}
        <div style={{ marginTop: 32, background: "#111", border: "1px solid #1a1a1a", borderRadius: 10, padding: "20px 24px" }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: "#888" }}>QUICK START</div>
          <pre style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "14px 16px", fontSize: 12, color: "#ccc", overflow: "auto", margin: 0 }}>
{keys.length > 0
  ? `curl https://your-api.com/endpoint \\
  -H "x-harbor-key: ${keys[0].key}"`
  : `curl https://your-api.com/endpoint \\
  -H "x-harbor-key: YOUR_API_KEY"`}
          </pre>
        </div>

        <div style={{ textAlign: "center", marginTop: 48, color: "#333", fontSize: 12 }}>
          Project ID: <code style={{ color: "#444" }}>{project.id}</code>
        </div>
      </div>
    </div>
  );
            }
