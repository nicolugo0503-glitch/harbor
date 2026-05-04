"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Project { id: string; name: string; createdAt: string; }
interface ApiKey { id: string; name: string; key: string; plan: string; createdAt: string; projectId: string; }
interface AnalyticsData {
  totalCalls: number; totalValid: number; totalInvalid: number;
  successRate: number; todayCalls: number;
  daily: { date: string; calls: number; valid: number; invalid: number }[];
  recentCalls: { ts: string; keyId: string; valid: boolean; ip: string; ms: number; plan?: string }[];
}

export default function DashboardApp({ email }: { email: string }) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPlan, setNewKeyPlan] = useState("free");
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"keys" | "analytics">("keys");

  const loadProjects = useCallback(async () => {
    const r = await fetch("/api/projects?email=" + encodeURIComponent(email));
    const d = await r.json();
    if (d.projects) setProjects(d.projects);
  }, [email]);

  const loadKeys = useCallback(async (projectId: string) => {
    const r = await fetch("/api/keys?projectId=" + projectId + "&email=" + encodeURIComponent(email));
    const d = await r.json();
    if (d.keys) setKeys(d.keys);
  }, [email]);

  const loadAnalytics = useCallback(async (projectId: string) => {
    setAnalyticsLoading(true);
    try {
      const r = await fetch("/api/analytics?projectId=" + projectId + "&email=" + encodeURIComponent(email) + "&days=7");
      const d = await r.json();
      if (!d.error) setAnalytics(d);
    } catch {}
    setAnalyticsLoading(false);
  }, [email]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const selectProject = async (id: string) => {
    setSelectedProject(id); setKeys([]); setAnalytics(null);
    await loadKeys(id);
    if (activeTab === "analytics") await loadAnalytics(id);
  };

  const switchTab = async (tab: "keys" | "analytics") => {
    setActiveTab(tab);
    if (tab === "analytics" && selectedProject && !analytics) await loadAnalytics(selectedProject);
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setLoading(true);
    const r = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newProjectName, email }),
    });
    const d = await r.json();
    if (d.project) { setProjects(p => [...p, d.project]); setNewProjectName(""); }
    setLoading(false);
  };

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !selectedProject) return;
    setLoading(true);
    const r = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName, plan: newKeyPlan, projectId: selectedProject, email }),
    });
    const d = await r.json();
    if (d.key) { setKeys(k => [...k, d.key]); setNewKeyName(""); }
    setLoading(false);
  };

  const deleteKey = async (keyId: string) => {
    await fetch("/api/keys?id=" + keyId + "&email=" + encodeURIComponent(email), { method: "DELETE" });
    setKeys(k => k.filter(x => x.id !== keyId));
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maxCalls = analytics ? Math.max(...analytics.daily.map(d => d.calls), 1) : 1;

  // ── Styles ──────────────────────────────────────────────────────────────────
  const S = {
    root: { minHeight: "100vh", background: "#020617", color: "#fff", fontFamily: "Inter, system-ui, sans-serif" },
    nav: { borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(2,6,23,0.8)", backdropFilter: "blur(12px)", position: "sticky" as const, top: 0, zIndex: 50 },
    navLogo: { fontWeight: 700, fontSize: 18, color: "#0ea5e9", display: "flex", alignItems: "center", gap: 8 },
    navRight: { display: "flex", alignItems: "center", gap: 16 },
    navEmail: { color: "#475569", fontSize: 13 },
    logoutBtn: { padding: "6px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer" },
    body: { display: "flex", height: "calc(100vh - 57px)" },
    sidebar: { width: 220, borderRight: "1px solid rgba(255,255,255,0.06)", padding: "20px 14px", overflowY: "auto" as const, flexShrink: 0 },
    sideLabel: { color: "#334155", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 10 },
    projectBtn: (selected: boolean) => ({
      width: "100%", textAlign: "left" as const, padding: "8px 12px", borderRadius: 8, border: "none",
      background: selected ? "rgba(14,165,233,0.1)" : "transparent",
      color: selected ? "#0ea5e9" : "#64748b",
      cursor: "pointer", marginBottom: 4, fontSize: 13,
    }),
    main: { flex: 1, overflowY: "auto" as const, padding: 28 },
    card: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 20px" },
    input: { padding: "9px 13px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 14, outline: "none" },
    btnPrimary: { padding: "9px 20px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 },
    btnSecondary: { padding: "8px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#94a3b8", cursor: "pointer", fontSize: 13 },
    tab: (active: boolean) => ({
      padding: "8px 16px", background: "transparent", border: "none",
      borderBottom: active ? "2px solid #0ea5e9" : "2px solid transparent",
      color: active ? "#fff" : "#475569",
      cursor: "pointer", fontSize: 14, fontWeight: active ? 600 : 400, marginBottom: -1,
    }),
    statCard: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "16px 20px" },
    planBadge: (plan: string) => ({
      background: plan === "pro" ? "rgba(14,165,233,0.1)" : plan === "scale" ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.05)",
      color: plan === "pro" ? "#0ea5e9" : plan === "scale" ? "#a78bfa" : "#64748b",
      border: `1px solid ${plan === "pro" ? "rgba(14,165,233,0.2)" : plan === "scale" ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 500,
    }),
  };

  return (
    <div style={S.root}>
      {/* Nav */}
      <div style={S.nav}>
        <div style={S.navLogo}>
          &#9875; harbor
        </div>
        <div style={S.navRight}>
          <span style={S.navEmail}>{email}</span>
          <button
            onClick={async () => {
            const r = await fetch("/api/stripe/checkout", { method: "POST" });
            const d = await r.json();
            if (d.url) window.location.href = d.url;
            else alert("Could not open upgrade page. Please try again.");
          }}
            style={{ ...S.logoutBtn, color: "#0ea5e9", borderColor: "rgba(14,165,233,0.3)" }}
          >
            Upgrade plan
          </button>
          <button onClick={handleLogout} style={S.logoutBtn}>Sign out</button>
        </div>
      </div>

      <div style={S.body}>
        {/* Sidebar */}
        <div style={S.sidebar}>
          <div style={S.sideLabel}>Projects</div>
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => selectProject(p.id)}
              style={S.projectBtn(selectedProject === p.id)}
            >
              {p.name}
            </button>
          ))}
          <form onSubmit={createProject} style={{ marginTop: 14 }}>
            <input
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              placeholder="New project..."
              style={{ ...S.input, width: "100%", marginBottom: 8, boxSizing: "border-box" as const, fontSize: 13 }}
            />
            <button type="submit" disabled={loading} style={{ ...S.btnSecondary, width: "100%", textAlign: "center" as const }}>
              + Create project
            </button>
          </form>
        </div>

        {/* Main */}
        <div style={S.main}>
          {!selectedProject ? (
            <div style={{ color: "#334155", marginTop: 80, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>&#9875;</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Select a project</div>
              <div style={{ fontSize: 14, color: "#334155" }}>Create a project on the left to get started</div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {(["keys", "analytics"] as const).map(tab => (
                  <button key={tab} onClick={() => switchTab(tab)} style={S.tab(activeTab === tab)}>
                    {tab === "keys" ? "API Keys" : "Analytics"}
                  </button>
                ))}
              </div>

              {activeTab === "keys" && (
                <>
                  {/* Project ID */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: "#334155", marginBottom: 4 }}>Project ID</div>
                    <code style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#64748b" }}>
                      {selectedProject}
                    </code>
                  </div>

                  {/* Key list */}
                  <div style={{ marginBottom: 20 }}>
                    {keys.length === 0 && (
                      <div style={{ color: "#334155", fontSize: 14, padding: "20px 0" }}>No API keys yet. Create one below.</div>
                    )}
                    {keys.map(k => (
                      <div key={k.id} style={{ ...S.card, marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{k.name}</div>
                          <code style={{ fontSize: 12, color: "#475569" }}>{k.key}</code>
                          <span style={{ marginLeft: 10, ...S.planBadge(k.plan) }}>{k.plan}</span>
                        </div>
                        <button
                          onClick={() => copyKey(k.key)}
                          style={{ ...S.btnSecondary, color: copiedKey === k.key ? "#10b981" : "#94a3b8" }}
                        >
                          {copiedKey === k.key ? "Copied!" : "Copy"}
                        </button>
                        <button onClick={() => deleteKey(k.id)} style={S.btnSecondary}>&#10005;</button>
                      </div>
                    ))}
                  </div>

                  {/* Create key */}
                  <div style={S.card}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Create API Key</div>
                    <form onSubmit={createKey} style={{ display: "flex", gap: 10 }}>
                      <input
                        value={newKeyName}
                        onChange={e => setNewKeyName(e.target.value)}
                        placeholder="Key name (e.g. Production)"
                        required
                        style={{ ...S.input, flex: 1 }}
                      />
                      <select
                        value={newKeyPlan}
                        onChange={e => setNewKeyPlan(e.target.value)}
                        style={{ ...S.input, paddingRight: 8 }}
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="scale">Scale</option>
                      </select>
                      <button type="submit" disabled={loading} style={S.btnPrimary}>
                        {loading ? "..." : "Create"}
                      </button>
                    </form>
                  </div>

                  {/* Upgrade CTA */}
                  <div style={{ marginTop: 20, background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0ea5e9" }}>Unlock Pro features</div>
                      <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>Up to 2M calls/mo, full analytics, webhooks &amp; more</div>
                    </div>
                    <button
                      onClick={async () => {
            const r = await fetch("/api/stripe/checkout", { method: "POST" });
            const d = await r.json();
            if (d.url) window.location.href = d.url;
            else alert("Could not open upgrade page. Please try again.");
          }}
                      style={{ ...S.btnPrimary, whiteSpace: "nowrap" as const }}
                    >
                      Upgrade to Pro &rarr;
                    </button>
                  </div>
                </>
              )}

              {activeTab === "analytics" && (
                <div>
                  {analyticsLoading ? (
                    <div style={{ color: "#334155", textAlign: "center", marginTop: 80 }}>Loading analytics...</div>
                  ) : analytics ? (
                    <>
                      {/* Stat cards */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                        {[
                          { label: "Total Calls (7d)", value: analytics.totalCalls.toLocaleString() },
                          { label: "Today", value: analytics.todayCalls.toLocaleString() },
                          { label: "Success Rate", value: analytics.successRate + "%" },
                          { label: "Invalid Keys", value: analytics.totalInvalid.toLocaleString() },
                        ].map(s => (
                          <div key={s.label} style={S.statCard}>
                            <div style={{ color: "#334155", fontSize: 12, marginBottom: 6 }}>{s.label}</div>
                            <div style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Bar chart */}
                      <div style={{ ...S.card, marginBottom: 24, padding: "20px 24px" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Calls — Last 7 Days</div>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
                          {analytics.daily.map(d => {
                            const h = maxCalls > 0 ? Math.round((d.calls / maxCalls) * 100) : 0;
                            return (
                              <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                <div
                                  title={d.calls + " calls"}
                                  style={{ width: "100%", height: h || 2, background: d.calls > 0 ? "#0ea5e9" : "rgba(255,255,255,0.04)", borderRadius: "3px 3px 0 0", minHeight: 2 }}
                                />
                                <div style={{ fontSize: 10, color: "#334155", whiteSpace: "nowrap" }}>{d.date.slice(5)}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recent calls */}
                      <div style={{ ...S.card, padding: "20px 24px" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Recent Calls</div>
                        {analytics.recentCalls.length === 0 ? (
                          <div style={{ color: "#334155", fontSize: 13 }}>No calls yet. Start making API calls to see data here.</div>
                        ) : (
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                              <tr style={{ color: "#334155", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                {["Time", "Key ID", "Status", "IP", "Latency"].map(h => (
                                  <th key={h} style={{ textAlign: "left", paddingBottom: 8, fontWeight: 500 }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.recentCalls.slice(0, 20).map((c, i) => (
                                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                  <td style={{ padding: "7px 0", color: "#475569" }}>{new Date(c.ts).toLocaleTimeString()}</td>
                                  <td style={{ padding: "7px 0" }}><code style={{ fontSize: 11, color: "#475569" }}>{c.keyId?.substring(0, 16)}...</code></td>
                                  <td style={{ padding: "7px 0" }}>
                                    <span style={{ background: c.valid ? "#052e16" : "#450a0a", color: c.valid ? "#10b981" : "#f87171", borderRadius: 4, padding: "2px 7px", fontSize: 11 }}>
                                      {c.valid ? "valid" : "invalid"}
                                    </span>
                                  </td>
                                  <td style={{ padding: "7px 0", color: "#475569", fontFamily: "monospace" }}>{c.ip}</td>
                                  <td style={{ padding: "7px 0", color: "#475569" }}>{c.ms}ms</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: "#334155", textAlign: "center", marginTop: 80 }}>No analytics data yet.</div>
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
