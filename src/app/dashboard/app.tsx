"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Project { id: string; name: string; createdAt: string; }
interface ApiKey { id: string; name: string; key: string; plan: string; createdAt: string; projectId: string; }
interface AnalyticsData {
  totalCalls: number; totalValid: number; totalInvalid: number;
  successRate: number; todayCalls: number;
  daily: { date: string; calls: number; valid: number; invalid: number }[];
  recentCalls: { ts: string; keyId: string; valid: boolean; ip: string; ms: number }[];
}

function UpgradeModal({ onClose, email }: { onClose: () => void; email: string }) {
  const [upgrading, setUpgrading] = useState<"pro" | "scale" | null>(null);
  async function checkout(plan: "pro" | "scale") {
    setUpgrading(plan);
    try {
      const r = await fetch("/api/stripe/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email }),
      });
      const d = await r.json();
      if (d.url) window.location.href = d.url;
      else { alert("Could not open checkout. Please try again."); setUpgrading(null); }
    } catch { alert("Network error."); setUpgrading(null); }
  }
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:100,
               display:"flex", alignItems:"center", justifyContent:"center",
               backdropFilter:"blur(6px)", padding:"0 16px" }}>
      <div style={{ background:"#0a1628", border:"1px solid rgba(255,255,255,0.1)",
                    borderRadius:24, padding:"40px 36px", width:680, maxWidth:"100%",
                    position:"relative", boxShadow:"0 25px 80px rgba(0,0,0,0.8)" }}>
        <button onClick={onClose} style={{ position:"absolute", top:18, right:20,
          background:"transparent", border:"none", color:"#475569",
          fontSize:22, cursor:"pointer", lineHeight:1, padding:"4px 8px" }}>×</button>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:24, fontWeight:800, color:"#fff", marginBottom:6 }}>Choose your plan</div>
          <div style={{ color:"#475569", fontSize:14 }}>Cancel anytime · Instant setup · Secured by Stripe</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div style={{ background:"rgba(14,165,233,0.06)", border:"1.5px solid rgba(14,165,233,0.25)",
                        borderRadius:18, padding:"28px 22px", display:"flex", flexDirection:"column" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div>
                <span style={{ background:"rgba(14,165,233,0.15)", color:"#38bdf8", fontSize:11, fontWeight:700,
                               padding:"3px 10px", borderRadius:20, textTransform:"uppercase" as const }}>Most popular</span>
                <div style={{ fontWeight:800, fontSize:20, color:"#fff", marginTop:10 }}>Pro</div>
              </div>
              <div style={{ textAlign:"right" as const }}>
                <div style={{ fontSize:30, fontWeight:900, color:"#fff", lineHeight:1 }}>$49</div>
                <div style={{ color:"#475569", fontSize:12 }}>/month</div>
              </div>
            </div>
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:16, marginTop:8,
                          display:"flex", flexDirection:"column", gap:9, flex:1 }}>
              {["Up to 2M API calls/mo","10 API projects","Full analytics (90-day)",
                "Custom-branded portal","Webhook events","0.3% transaction fee","Email support"].map(f => (
                <div key={f} style={{ display:"flex", gap:9, fontSize:13, color:"#94a3b8" }}>
                  <span style={{ color:"#0ea5e9", fontWeight:700 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <button onClick={() => checkout("pro")} disabled={upgrading !== null}
              style={{ marginTop:20, width:"100%", padding:"11px 0",
                       background:upgrading==="pro"?"#0369a1":"#0ea5e9",
                       color:"#fff", border:"none", borderRadius:12, fontWeight:700,
                       fontSize:14, cursor:upgrading!==null?"not-allowed":"pointer",
                       opacity:upgrading!==null&&upgrading!=="pro"?0.5:1 }}>
              {upgrading==="pro"?"Opening Stripe…":"Upgrade to Pro →"}
            </button>
          </div>
          <div style={{ background:"rgba(139,92,246,0.06)", border:"1.5px solid rgba(139,92,246,0.3)",
                        borderRadius:18, padding:"28px 22px", display:"flex", flexDirection:"column",
                        position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:14, right:14, background:"rgba(139,92,246,0.2)",
                          color:"#a78bfa", fontSize:10, fontWeight:800, padding:"4px 10px",
                          borderRadius:20 }}>BEST VALUE</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div>
                <span style={{ background:"rgba(139,92,246,0.15)", color:"#a78bfa", fontSize:11, fontWeight:700,
                               padding:"3px 10px", borderRadius:20, textTransform:"uppercase" as const }}>For serious APIs</span>
                <div style={{ fontWeight:800, fontSize:20, color:"#fff", marginTop:10 }}>Scale</div>
              </div>
              <div style={{ textAlign:"right" as const }}>
                <div style={{ fontSize:30, fontWeight:900, color:"#fff", lineHeight:1 }}>$299</div>
                <div style={{ color:"#475569", fontSize:12 }}>/month</div>
              </div>
            </div>
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:16, marginTop:8,
                          display:"flex", flexDirection:"column", gap:9, flex:1 }}>
              {["Unlimited API calls","Unlimited projects","Full analytics (1-year)",
                "Custom domain portal","Advanced abuse prevention","0.1% transaction fee",
                "Priority support + SLA","Custom contracts","SSO & team management"].map(f => (
                <div key={f} style={{ display:"flex", gap:9, fontSize:13, color:"#94a3b8" }}>
                  <span style={{ color:"#a78bfa", fontWeight:700 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <button onClick={() => checkout("scale")} disabled={upgrading !== null}
              style={{ marginTop:20, width:"100%", padding:"11px 0",
                       background:upgrading==="scale"?"#6d28d9":"#7c3aed",
                       color:"#fff", border:"none", borderRadius:12, fontWeight:700,
                       fontSize:14, cursor:upgrading!==null?"not-allowed":"pointer",
                       opacity:upgrading!==null&&upgrading!=="scale"?0.5:1 }}>
              {upgrading==="scale"?"Opening Stripe…":"Upgrade to Scale →"}
            </button>
          </div>
        </div>
        <p style={{ textAlign:"center", marginTop:20, color:"#334155", fontSize:12 }}>
          All plans include a 14-day money-back guarantee · Powered by Stripe
        </p>
      </div>
    </div>
  );
}

export default function DashboardApp({ email }: { email: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const upgradedPlan = searchParams.get("upgraded");
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(!!upgradedPlan);

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
  useEffect(() => {
    if (!showUpgradeBanner) return;
    const t = setTimeout(() => setShowUpgradeBanner(false), 6000);
    return () => clearTimeout(t);
  }, [showUpgradeBanner]);

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
      method: "POST", headers: { "Content-Type": "application/json" },
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
      method: "POST", headers: { "Content-Type": "application/json" },
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
  const planName = upgradedPlan === "scale" ? "Scale" : "Pro";

  return (
    <div style={{ minHeight:"100vh", background:"#020617", color:"#fff", fontFamily:"Inter, system-ui, sans-serif" }}>
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} email={email} />}
      {showUpgradeBanner && (
        <div style={{ background:"linear-gradient(90deg, #0ea5e9, #06b6d4)", padding:"12px 24px",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:12, position:"relative" }}>
          <span style={{ fontSize:18 }}>🎉</span>
          <span style={{ fontWeight:700, fontSize:14 }}>Welcome to Harbor {planName}! Your subscription is active.</span>
          <span style={{ fontSize:13, opacity:0.8 }}>Check your email for a receipt.</span>
          <button onClick={() => setShowUpgradeBanner(false)}
            style={{ position:"absolute", right:16, background:"transparent", border:"none",
                     color:"#fff", fontSize:20, cursor:"pointer", opacity:0.7 }}>×</button>
        </div>
      )}
      <div style={{ borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"14px 28px",
                    display:"flex", justifyContent:"space-between", alignItems:"center",
                    background:"rgba(2,6,23,0.9)", backdropFilter:"blur(12px)",
                    position:"sticky", top:0, zIndex:50 }}>
        <div style={{ fontWeight:800, fontSize:18, color:"#0ea5e9" }}>⚓ harbor</div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <span style={{ color:"#475569", fontSize:13 }}>{email}</span>
          <button onClick={() => setShowUpgradeModal(true)}
            style={{ padding:"7px 16px", background:"rgba(14,165,233,0.1)",
                     border:"1px solid rgba(14,165,233,0.3)", borderRadius:8,
                     color:"#0ea5e9", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            ↑ Upgrade plan
          </button>
          <button onClick={handleLogout}
            style={{ padding:"7px 14px", background:"transparent",
                     border:"1px solid rgba(255,255,255,0.08)", borderRadius:8,
                     color:"#64748b", fontSize:13, cursor:"pointer" }}>Sign out</button>
        </div>
      </div>
      <div style={{ display:"flex", height:"calc(100vh - 57px)" }}>
        <div style={{ width:230, borderRight:"1px solid rgba(255,255,255,0.06)",
                      padding:"22px 14px", overflowY:"auto" as const, flexShrink:0,
                      background:"rgba(0,0,0,0.15)" }}>
          <div style={{ color:"#334155", fontSize:10, fontWeight:700,
                        textTransform:"uppercase" as const, letterSpacing:1.2, marginBottom:12 }}>Projects</div>
          {projects.map(p => (
            <button key={p.id} onClick={() => selectProject(p.id)}
              style={{ width:"100%", textAlign:"left" as const, padding:"9px 12px", borderRadius:8,
                       border:"none", background:selectedProject===p.id?"rgba(14,165,233,0.12)":"transparent",
                       color:selectedProject===p.id?"#0ea5e9":"#64748b", cursor:"pointer",
                       marginBottom:3, fontSize:13, fontWeight:500,
                       borderLeft:selectedProject===p.id?"2px solid #0ea5e9":"2px solid transparent" }}>
              {p.name}
            </button>
          ))}
          <form onSubmit={createProject} style={{ marginTop:16 }}>
            <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
              placeholder="New project name…"
              style={{ padding:"8px 11px", background:"rgba(255,255,255,0.04)",
                       border:"1px solid rgba(255,255,255,0.08)", borderRadius:8,
                       color:"#fff", fontSize:12, outline:"none",
                       width:"100%", marginBottom:8, boxSizing:"border-box" as const }} />
            <button type="submit" disabled={loading}
              style={{ padding:"8px 0", background:"transparent",
                       border:"1px solid rgba(255,255,255,0.08)", borderRadius:8,
                       color:"#64748b", cursor:"pointer", fontSize:12,
                       width:"100%", textAlign:"center" as const }}>+ Create project</button>
          </form>
          <div onClick={() => setShowUpgradeModal(true)}
            style={{ marginTop:24, padding:"14px 12px", background:"rgba(14,165,233,0.05)",
                     border:"1px solid rgba(14,165,233,0.12)", borderRadius:10, cursor:"pointer" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#0ea5e9", marginBottom:3 }}>Upgrade plan</div>
            <div style={{ fontSize:11, color:"#334155", lineHeight:1.5 }}>More calls, analytics & priority support</div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto" as const, padding:32 }}>
          {!selectedProject ? (
            <div style={{ color:"#334155", marginTop:80, textAlign:"center" }}>
              <div style={{ fontSize:40, marginBottom:16 }}>⚓</div>
              <div style={{ fontSize:18, fontWeight:700, color:"#475569", marginBottom:8 }}>Select a project</div>
              <div style={{ fontSize:14, color:"#334155" }}>Create a project on the left to get started</div>
            </div>
          ) : (
            <>
              <div style={{ display:"flex", gap:0, marginBottom:28, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                {(["keys","analytics"] as const).map(tab => (
                  <button key={tab} onClick={() => switchTab(tab)}
                    style={{ padding:"10px 20px", background:"transparent", border:"none",
                             borderBottom:activeTab===tab?"2px solid #0ea5e9":"2px solid transparent",
                             color:activeTab===tab?"#fff":"#475569", cursor:"pointer",
                             fontSize:14, fontWeight:activeTab===tab?700:400, marginBottom:-1 }}>
                    {tab==="keys"?"API Keys":"Analytics"}
                  </button>
                ))}
              </div>
              {activeTab==="keys" && (
                <>
                  <div style={{ marginBottom:24 }}>
                    <div style={{ fontSize:11, color:"#334155", fontWeight:600,
                                  textTransform:"uppercase" as const, letterSpacing:0.8, marginBottom:6 }}>Project ID</div>
                    <code style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)",
                                   borderRadius:8, padding:"6px 12px", fontSize:12, color:"#64748b" }}>{selectedProject}</code>
                  </div>
                  <div style={{ marginBottom:24 }}>
                    {keys.length===0 ? (
                      <div style={{ color:"#334155", fontSize:14, padding:"32px 0", textAlign:"center" }}>No API keys yet — create one below.</div>
                    ) : keys.map(k => (
                      <div key={k.id} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)",
                                               borderRadius:12, padding:"14px 18px", marginBottom:10,
                                               display:"flex", alignItems:"center", gap:14 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:600, fontSize:14, marginBottom:5, color:"#e2e8f0" }}>{k.name}</div>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <code style={{ fontSize:12, color:"#475569" }}>{k.key}</code>
                            <span style={{ background:k.plan==="scale"?"rgba(139,92,246,0.12)":k.plan==="pro"?"rgba(14,165,233,0.12)":"rgba(255,255,255,0.05)",
                                           color:k.plan==="scale"?"#a78bfa":k.plan==="pro"?"#38bdf8":"#64748b",
                                           borderRadius:6, padding:"2px 9px", fontSize:11, fontWeight:600,
                                           textTransform:"uppercase" as const, letterSpacing:0.4 }}>{k.plan}</span>
                          </div>
                        </div>
                        <button onClick={() => copyKey(k.key)}
                          style={{ padding:"7px 14px", background:"transparent",
                                   border:"1px solid rgba(255,255,255,0.08)", borderRadius:8,
                                   color:copiedKey===k.key?"#10b981":"#94a3b8", cursor:"pointer", fontSize:12 }}>
                          {copiedKey===k.key?"✓ Copied":"Copy"}
                        </button>
                        <button onClick={() => deleteKey(k.id)}
                          style={{ padding:"7px 12px", background:"transparent",
                                   border:"1px solid rgba(255,255,255,0.06)", borderRadius:8,
                                   color:"#475569", cursor:"pointer", fontSize:14 }}>×</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)",
                                borderRadius:14, padding:"20px 22px", marginBottom:20 }}>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:16, color:"#e2e8f0" }}>Create API Key</div>
                    <form onSubmit={createKey} style={{ display:"flex", gap:10, flexWrap:"wrap" as const }}>
                      <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                        placeholder="Key name (e.g. Production)" required
                        style={{ flex:"1 1 200px", padding:"9px 13px", background:"rgba(255,255,255,0.04)",
                                 border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, color:"#fff",
                                 fontSize:14, outline:"none" }} />
                      <select value={newKeyPlan} onChange={e => setNewKeyPlan(e.target.value)}
                        style={{ padding:"9px 13px", background:"rgba(255,255,255,0.06)",
                                 border:"1px solid rgba(255,255,255,0.08)", borderRadius:8,
                                 color:"#fff", fontSize:14, outline:"none" }}>
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="scale">Scale</option>
                      </select>
                      <button type="submit" disabled={loading}
                        style={{ padding:"9px 22px", background:"#0ea5e9", color:"#fff",
                                 border:"none", borderRadius:8, fontWeight:700,
                                 cursor:"pointer", fontSize:14, opacity:loading?0.7:1 }}>
                        {loading?"…":"Create"}
                      </button>
                    </form>
                  </div>
                  <div style={{ background:"linear-gradient(135deg,rgba(14,165,233,0.07),rgba(139,92,246,0.07))",
                                border:"1px solid rgba(14,165,233,0.15)", borderRadius:14,
                                padding:"18px 22px", display:"flex", justifyContent:"space-between",
                                alignItems:"center", gap:16, flexWrap:"wrap" as const }}>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, background:"linear-gradient(90deg,#38bdf8,#a78bfa)",
                                    WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                        Unlock Pro or Scale
                      </div>
                      <div style={{ fontSize:13, color:"#475569", marginTop:3 }}>
                        More calls · Full analytics · Webhooks · Priority support
                      </div>
                    </div>
                    <button onClick={() => setShowUpgradeModal(true)}
                      style={{ padding:"10px 22px", background:"linear-gradient(135deg,#0ea5e9,#7c3aed)",
                               color:"#fff", border:"none", borderRadius:10, fontWeight:700,
                               cursor:"pointer", fontSize:14, whiteSpace:"nowrap" as const,
                               boxShadow:"0 4px 20px rgba(14,165,233,0.25)" }}>
                      View plans →
                    </button>
                  </div>
                </>
              )}
              {activeTab==="analytics" && (
                <div>
                  {analyticsLoading ? (
                    <div style={{ color:"#334155", textAlign:"center", marginTop:80 }}>Loading analytics…</div>
                  ) : analytics ? (
                    <>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
                        {[{label:"Total Calls (7d)",value:analytics.totalCalls.toLocaleString()},
                          {label:"Today",value:analytics.todayCalls.toLocaleString()},
                          {label:"Success Rate",value:analytics.successRate+"%"},
                          {label:"Invalid Keys",value:analytics.totalInvalid.toLocaleString()}].map(s => (
                          <div key={s.label} style={{ background:"rgba(255,255,255,0.02)",
                                                      border:"1px solid rgba(255,255,255,0.06)",
                                                      borderRadius:12, padding:"18px 20px" }}>
                            <div style={{ color:"#334155", fontSize:11, fontWeight:600,
                                          textTransform:"uppercase" as const, letterSpacing:0.6, marginBottom:8 }}>{s.label}</div>
                            <div style={{ fontSize:26, fontWeight:800, color:"#e2e8f0" }}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)",
                                    borderRadius:14, padding:"22px 24px", marginBottom:24 }}>
                        <div style={{ fontSize:14, fontWeight:700, marginBottom:18, color:"#e2e8f0" }}>Calls — Last 7 Days</div>
                        <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:100 }}>
                          {analytics.daily.map(d => {
                            const h = maxCalls>0?Math.round((d.calls/maxCalls)*100):0;
                            return (
                              <div key={d.date} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                                <div title={d.calls+" calls"} style={{ width:"100%", height:Math.max(h,2),
                                             background:d.calls>0?"linear-gradient(180deg,#38bdf8,#0ea5e9)":"rgba(255,255,255,0.04)",
                                             borderRadius:"4px 4px 0 0", minHeight:2 }} />
                                <div style={{ fontSize:10, color:"#334155", whiteSpace:"nowrap" as const }}>{d.date.slice(5)}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)",
                                    borderRadius:14, padding:"22px 24px" }}>
                        <div style={{ fontSize:14, fontWeight:700, marginBottom:16, color:"#e2e8f0" }}>Recent Calls</div>
                        {analytics.recentCalls.length===0 ? (
                          <div style={{ color:"#334155", fontSize:13, textAlign:"center", padding:"20px 0" }}>No calls yet.</div>
                        ) : (
                          <table style={{ width:"100%", borderCollapse:"collapse" as const, fontSize:13 }}>
                            <thead>
                              <tr style={{ color:"#334155", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                                {["Time","Key ID","Status","IP","Latency"].map(h => (
                                  <th key={h} style={{ textAlign:"left" as const, paddingBottom:10,
                                                        fontWeight:600, fontSize:11, textTransform:"uppercase" as const,
                                                        letterSpacing:0.6 }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.recentCalls.slice(0,20).map((c,i) => (
                                <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                                  <td style={{ padding:"9px 0", color:"#475569" }}>{new Date(c.ts).toLocaleTimeString()}</td>
                                  <td style={{ padding:"9px 0" }}><code style={{ fontSize:11, color:"#475569" }}>{c.keyId?.substring(0,16)}…</code></td>
                                  <td style={{ padding:"9px 0" }}>
                                    <span style={{ background:c.valid?"#052e16":"#450a0a",
                                                   color:c.valid?"#10b981":"#f87171",
                                                   borderRadius:5, padding:"3px 8px", fontSize:11, fontWeight:600 }}>
                                      {c.valid?"valid":"invalid"}
                                    </span>
                                  </td>
                                  <td style={{ padding:"9px 0", color:"#475569", fontFamily:"monospace", fontSize:12 }}>{c.ip}</td>
                                  <td style={{ padding:"9px 0", color:"#475569" }}>{c.ms}ms</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{ color:"#334155", textAlign:"center", marginTop:80 }}>No analytics data yet.</div>
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
