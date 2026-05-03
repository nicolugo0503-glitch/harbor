"use client";
import { useState, useEffect, useCallback } from "react";

interface Project { id: string; name: string; createdAt: string; }
interface ApiKey { id: string; name: string; key: string; plan: string; createdAt: string; projectId: string; }
interface AnalyticsData {
  totalCalls: number; totalValid: number; totalInvalid: number; successRate: number; todayCalls: number;
  daily: { date: string; calls: number; valid: number; invalid: number }[];
  recentCalls: { ts: string; keyId: string; valid: boolean; ip: string; ms: number; plan?: string }[];
}

export default function Dashboard() {
  const [email, setEmail] = useState("");
  const [authed, setAuthed] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPlan, setNewKeyPlan] = useState("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"keys" | "analytics">("keys");

  const loadProjects = useCallback(async (e: string) => {
    const r = await fetch(`/api/projects?email=${encodeURIComponent(e)}`);
    const d = await r.json();
    if (d.projects) setProjects(d.projects);
  }, []);

  const loadKeys = useCallback(async (projectId: string, e: string) => {
    const r = await fetch(`/api/keys?projectId=${projectId}&email=${encodeURIComponent(e)}`);
    const d = await r.json();
    if (d.keys) setKeys(d.keys);
  }, []);

  const loadAnalytics = useCallback(async (projectId: string, e: string) => {
    setAnalyticsLoading(true);
    try {
      const r = await fetch(`/api/analytics?projectId=${projectId}&email=${encodeURIComponent(e)}&days=7`);
      const d = await r.json();
      if (!d.error) setAnalytics(d);
    } catch {}
    setAnalyticsLoading(false);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/projects?email=${encodeURIComponent(email)}`);
      if (r.ok) { setAuthed(true); await loadProjects(email); }
      else setError("Unable to verify. Check your email.");
    } catch { setError("Network error."); }
    setLoading(false);
  };

  const selectProject = async (id: string) => {
    setSelectedProject(id);
    setKeys([]);
    setAnalytics(null);
    await loadKeys(id, email);
    if (activeTab === "analytics") await loadAnalytics(id, email);
  };

  const switchTab = async (tab: "keys" | "analytics") => {
    setActiveTab(tab);
    if (tab === "analytics" && selectedProject && !analytics) {
      await loadAnalytics(selectedProject, email);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setLoading(true);
    const r = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newProjectName, email }) });
    const d = await r.json();
    if (d.project) { setProjects(p => [...p, d.project]); setNewProjectName(""); }
    setLoading(false);
  };

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !selectedProject) return;
    setLoading(true);
    const r = await fetch("/api/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newKeyName, plan: newKeyPlan, projectId: selectedProject, email }) });
    const d = await r.json();
    if (d.key) { setKeys(k => [...k, d.key]); setNewKeyName(""); }
    setLoading(false);
  };

  const deleteKey = async (keyId: string) => {
    await fetch(`/api/keys?id=${keyId}&email=${encodeURIComponent(email)}`, { method: "DELETE" });
    setKeys(k => k.filter(x => x.id !== keyId));
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maxCalls = analytics ? Math.max(...analytics.daily.map(d => d.calls), 1) : 1;

  if (!authed) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 40, width: 360, textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Harbor</div>
        <div style={{ color: "#666", marginBottom: 28 }}>Enter your email to access your dashboard</div>
        <form onSubmit={handleAuth}>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="you@example.com"
            style={{ width: "100%", padding: "10px 14px", background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#fff", fontSize: 15, marginBottom: 12, boxSizing: "border-box" }} />
          {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 8 }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "10px 0", background: "#fff", color: "#000", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Checking..." : "Continue →"}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>⚓ Harbor</div>
        <div style={{ color: "#555", fontSize: 14 }}>{email}</div>
      </div>

      <div style={{ display: "flex", gap: 0, height: "calc(100vh - 57px)" }}>
        {/* Sidebar */}
        <div style={{ width: 240, borderRight: "1px solid #1a1a1a", padding: 20, overflowY: "auto", flexShrink: 0 }}>
          <div style={{ color: "#555", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Projects</div>
          {projects.map(p => (
            <button key={p.id} onClick={() => selectProject(p.id)}
              style={{ width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 8, border: "none", background: selectedProject === p.id ? "#1a1a1a" : "transparent", color: selectedProject === p.id ? "#fff" : "#888", cursor: "pointer", marginBottom: 4, fontSize: 14, transition: "all 0.15s" }}>
              {p.name}
            </button>
          ))}
          <form onSubmit={createProject} style={{ marginTop: 12 }}>
            <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="New project..." 
              style={{ width: "100%", padding: "7px 10px", background: "#111", border: "1px solid #222", borderRadius: 8, color: "#fff", fontSize: 13, marginBottom: 6, boxSizing: "border-box" }} />
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "6px 0", background: "#222", color: "#fff", border: "1px solid #333", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
              + Create
            </button>
          </form>
        </div>

        {/* Main */}
        <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          {!selectedProject ? (
            <div style={{ color: "#555", marginTop: 60, textAlign: "center" }}>Select or create a project to get started</div>
          ) : (
            <>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid #1a1a1a", paddingBottom: 0 }}>
                {(["keys", "analytics"] as const).map(tab => (
                  <button key={tab} onClick={() => switchTab(tab)}
                    style={{ padding: "8px 16px", background: "transparent", border: "none", borderBottom: activeTab === tab ? "2px solid #fff" : "2px solid transparent", color: activeTab === tab ? "#fff" : "#555", cursor: "pointer", fontSize: 14, fontWeight: activeTab === tab ? 600 : 400, transition: "all 0.15s", marginBottom: -1 }}>
                    {tab === "keys" ? "API Keys" : "Analytics"}
                  </button>
                ))}
              </div>

              {activeTab === "keys" && (
                <>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>Project ID</div>
                    <code style={{ background: "#111", border: "1px solid #222", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#888" }}>{selectedProject}</code>
                  </div>

                  {/* Key list */}
                  <div style={{ marginBottom: 24 }}>
                    {keys.length === 0 && <div style={{ color: "#444", fontSize: 14 }}>No API keys yet. Create one below.</div>}
                    {keys.map(k => (
                      <div key={k.id} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 10, padding: "14px 18px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{k.name}</div>
                          <code style={{ fontSize: 12, color: "#666" }}>{k.key}</code>
                          <span style={{ marginLeft: 10, background: "#1a1a1a", border: "1px solid #333", borderRadius: 4, padding: "2px 8px", fontSize: 11, color: "#888" }}>{k.plan}</span>
                        </div>
                        <button onClick={() => copyKey(k.key)} style={{ padding: "5px 12px", background: copiedKey === k.key ? "#16a34a" : "#1a1a1a", border: "1px solid #333", borderRadius: 6, color: copiedKey === k.key ? "#fff" : "#aaa", fontSize: 12, cursor: "pointer" }}>
                          {copiedKey === k.key ? "Copied!" : "Copy"}
                        </button>
                        <button onClick={() => deleteKey(k.id)} style={{ padding: "5px 10px", background: "transparent", border: "1px solid #333", borderRadius: 6, color: "#666", fontSize: 12, cursor: "pointer" }}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Create key form */}
                  <form onSubmit={createKey} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Create API Key</div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Key name (e.g. Production)" required
                        style={{ flex: 1, padding: "8px 12px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", fontSize: 14 }} />
                      <select value={newKeyPlan} onChange={e => setNewKeyPlan(e.target.value)}
                        style={{ padding: "8px 12px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", fontSize: 14 }}>
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="scale">Scale</option>
                      </select>
                      <button type="submit" disabled={loading} style={{ padding: "8px 20px", background: "#fff", color: "#000", border: "none", borderRadius: 8, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                        {loading ? "..." : "Create"}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {activeTab === "analytics" && (
                <div>
                  {analyticsLoading ? (
                    <div style={{ color: "#555", textAlign: "center", marginTop: 60 }}>Loading analytics...</div>
                  ) : analytics ? (
                    <>
                      {/* Stat cards */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
                        {[
                          { label: "Total Calls (7d)", value: analytics.totalCalls.toLocaleString() },
                          { label: "Today", value: analytics.todayCalls.toLocaleString() },
                          { label: "Success Rate", value: analytics.successRate + "%" },
                          { label: "Invalid Keys", value: analytics.totalInvalid.toLocaleString() },
                        ].map(stat => (
                          <div key={stat.label} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 10, padding: "16px 20px" }}>
                            <div style={{ color: "#555", fontSize: 12, marginBottom: 6 }}>{stat.label}</div>
                            <div style={{ fontSize: 24, fontWeight: 700 }}>{stat.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Bar chart */}
                      <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 10, padding: "20px 24px", marginBottom: 28 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Calls — Last 7 Days</div>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
                          {analytics.daily.map(d => {
                            const h = maxCalls > 0 ? Math.round((d.calls / maxCalls) * 100) : 0;
                            const label = d.date.slice(5);
                            return (
                              <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                <div title={`${d.calls} calls`}
                                  style={{ width: "100%", height: h || 2, background: d.calls > 0 ? "#fff" : "#222", borderRadius: "3px 3px 0 0", transition: "height 0.3s", minHeight: 2 }} />
                                <div style={{ fontSize: 10, color: "#555", whiteSpace: "nowrap" }}>{label}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recent calls */}
                      <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 10, padding: "20px 24px" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Recent Calls</div>
                        {analytics.recentCalls.length === 0 ? (
                          <div style={{ color: "#444", fontSize: 13 }}>No calls yet. Calls will appear here once your API is in use.</div>
                        ) : (
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                              <tr style={{ color: "#555", borderBottom: "1px solid #1a1a1a" }}>
                                {["Time", "Key ID", "Valid", "IP", "Latency"].map(h => (
                                  <th key={h} style={{ textAlign: "left", paddingBottom: 8, fontWeight: 500 }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.recentCalls.slice(0, 20).map((c, i) => (
                                <tr key={i} style={{ borderBottom: "1px solid #111" }}>
                                  <td style={{ padding: "7px 0", color: "#555" }}>{new Date(c.ts).toLocaleTimeString()}</td>
                                  <td style={{ padding: "7px 0" }}><code style={{ fontSize: 11, color: "#888" }}>{c.keyId?.substring(0,16)}...</code></td>
                                  <td style={{ padding: "7px 0" }}>
                                    <span style={{ background: c.valid ? "#14532d" : "#450a0a", color: c.valid ? "#86efac" : "#fca5a5", borderRadius: 4, padding: "2px 7px", fontSize: 11 }}>
                                      {c.valid ? "✓ valid" : "✗ invalid"}
                                    </span>
                                  </td>
                                  <td style={{ padding: "7px 0", color: "#555", fontFamily: "monospace" }}>{c.ip}</td>
                                  <td style={{ padding: "7px 0", color: "#555" }}>{c.ms}ms</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: "#555", textAlign: "center", marginTop: 60 }}>No analytics data yet. Start making API calls to see data here.</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
                      }
