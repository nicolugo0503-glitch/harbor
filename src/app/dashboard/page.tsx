"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, Plus, Trash2, Key, Layers, ChevronRight, Eye, EyeOff, Check, RefreshCw, Zap, BarChart2, LogOut, Mail } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Project = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  plan: "free" | "pro" | "scale";
};

type ApiKey = {
  id: string;
  key: string;
  projectId: string;
  name: string;
  createdAt: string;
  lastUsed: string | null;
  callsThisMonth: number;
  active: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  free: "bg-slate-700 text-slate-300",
  pro: "bg-sky-900 text-sky-300",
  scale: "bg-violet-900 text-violet-300",
};

const PLAN_LIMITS: Record<string, string> = {
  free: "10K calls/mo",
  pro: "500K calls/mo",
  scale: "Unlimited",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function maskKey(key: string) {
  return key.slice(0, 12) + "••••••••••••••••••••" + key.slice(-4);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-sky-400 transition-colors" title="Copy">
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
    </button>
  );
}

function Badge({ plan }: { plan: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[plan] ?? "bg-slate-700 text-slate-300"}`}>
      {plan}
    </span>
  );
}

// ─── Email Gate ───────────────────────────────────────────────────────────────

function EmailGate({ onEmail }: { onEmail: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    setError("");
    // Store email and proceed — actual validation happens via Stripe webhook data
    onEmail(trimmed);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">Harbor</span>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 mx-auto mb-4">
            <Mail size={22} className="text-sky-400" />
          </div>
          <h1 className="text-xl font-bold text-white text-center mb-1">Sign in to Dashboard</h1>
          <p className="text-slate-400 text-sm text-center mb-6">
            Enter the email you used to subscribe. We&apos;ll load your API keys.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoFocus
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Access my dashboard"
              )}
            </button>
          </form>
          <p className="text-center text-xs text-slate-500 mt-4">
            No account?{" "}
            <a href="/#pricing" className="text-sky-400 hover:text-sky-300">
              Subscribe to a plan →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [showNewKey, setShowNewKey] = useState<ApiKey | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ── On mount: check localStorage or session_id from Stripe ──
  useEffect(() => {
    const stored = localStorage.getItem("harbor_customer_email");
    const sessionId = searchParams.get("session_id");
    const isSuccess = searchParams.get("success") === "1";

    if (stored) {
      setCustomerEmail(stored);
      if (isSuccess) setSuccessMessage("🎉 Payment successful! Your API keys are ready.");
      return;
    }

    if (sessionId) {
      setSessionLoading(true);
      fetch(`/api/stripe/session?session_id=${sessionId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.email) {
            localStorage.setItem("harbor_customer_email", data.email);
            setCustomerEmail(data.email);
            setSuccessMessage("🎉 Payment successful! Your API keys are ready below.");
          }
        })
        .catch(() => {})
        .finally(() => setSessionLoading(false));
    }
  }, [searchParams]);

  function handleEmailSet(email: string) {
    localStorage.setItem("harbor_customer_email", email);
    setCustomerEmail(email);
  }

  function handleSignOut() {
    localStorage.removeItem("harbor_customer_email");
    setCustomerEmail(null);
    setProjects([]);
    setSelectedProject(null);
    setKeys([]);
  }

  // ── API helpers with auth header ──
  function authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (customerEmail) headers["x-customer-email"] = customerEmail;
    return headers;
  }

  // ── Load projects ──
  const loadProjects = useCallback(async () => {
    if (!customerEmail) return;
    setLoadingProjects(true);
    try {
      const res = await fetch("/api/projects", { headers: { "x-customer-email": customerEmail } });
      const data = await res.json();
      const sorted = (data.projects ?? []).sort(
        (a: Project, b: Project) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setProjects(sorted);
      if (sorted.length > 0) setSelectedProject((prev) => prev ?? sorted[0]);
    } catch {
      // KV not set up yet — show empty state
    } finally {
      setLoadingProjects(false);
    }
  }, [customerEmail]);

  // ── Load keys for selected project ──
  const loadKeys = useCallback(async (projectId: string) => {
    setLoadingKeys(true);
    try {
      const res = await fetch(`/api/keys?projectId=${projectId}`);
      const data = await res.json();
      setKeys(data.keys ?? []);
    } catch {
      setKeys([]);
    } finally {
      setLoadingKeys(false);
    }
  }, []);

  useEffect(() => { if (customerEmail) loadProjects(); }, [customerEmail, loadProjects]);
  useEffect(() => {
    if (selectedProject) loadKeys(selectedProject.id);
    else setKeys([]);
  }, [selectedProject, loadKeys]);

  // ── Create project ──
  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreatingProject(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: newProjectName.trim(), plan: "free" }),
      });
      const data = await res.json();
      if (data.project) {
        setProjects((prev) => [data.project, ...prev]);
        setSelectedProject(data.project);
        setNewProjectName("");
        setShowProjectForm(false);
      }
    } finally {
      setCreatingProject(false);
    }
  }

  // ── Create API key ──
  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName.trim() || !selectedProject) return;
    setCreatingKey(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ projectId: selectedProject.id, name: newKeyName.trim() }),
      });
      const data = await res.json();
      if (data.apiKey) {
        setShowNewKey(data.apiKey);
        setKeys((prev) => [data.apiKey, ...prev]);
        setNewKeyName("");
      }
    } finally {
      setCreatingKey(false);
    }
  }

  // ── Revoke key ──
  async function handleRevokeKey(keyId: string) {
    if (!confirm("Revoke this key? Apps using it will stop working immediately.")) return;
    await fetch("/api/keys", {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({ keyId }),
    });
    setKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, active: false } : k)));
  }

  function toggleReveal(keyId: string) {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(keyId)) next.delete(keyId);
      else next.add(keyId);
      return next;
    });
  }

  // ── Loading spinner while resolving Stripe session ──
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading your account…</p>
        </div>
      </div>
    );
  }

  // ── Email gate ──
  if (!customerEmail) {
    return <EmailGate onEmail={handleEmailSet} />;
  }

  // ── Render ──
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-100 flex">
      {/* ── Sidebar ── */}
      <aside className="w-64 border-r border-slate-800 flex flex-col bg-[#0d1321]">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg">Harbor</span>
          <span className="ml-auto text-xs text-slate-500">v0.1</span>
        </div>

        {/* Customer email */}
        <div className="px-5 py-3 border-b border-slate-800/50 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {customerEmail[0].toUpperCase()}
          </div>
          <span className="text-xs text-slate-400 truncate flex-1">{customerEmail}</span>
          <button onClick={handleSignOut} title="Sign out" className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0">
            <LogOut size={13} />
          </button>
        </div>

        {/* Projects list */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Projects</span>
            <button
              onClick={() => setShowProjectForm((v) => !v)}
              className="text-slate-400 hover:text-sky-400 transition-colors"
              title="New project"
            >
              <Plus size={15} />
            </button>
          </div>

          {/* New project form */}
          {showProjectForm && (
            <form onSubmit={handleCreateProject} className="mb-3">
              <input
                autoFocus
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 mb-1.5"
              />
              <div className="flex gap-1.5">
                <button
                  type="submit"
                  disabled={creatingProject || !newProjectName.trim()}
                  className="flex-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs py-1.5 rounded-md font-medium transition-colors"
                >
                  {creatingProject ? "Creating…" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowProjectForm(false); setNewProjectName(""); }}
                  className="px-2 text-slate-400 hover:text-white text-xs py-1.5 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {loadingProjects ? (
            <div className="text-slate-500 text-xs px-1 py-2">Loading…</div>
          ) : projects.length === 0 ? (
            <div className="text-slate-500 text-xs px-1 py-2">No projects yet. Create one above.</div>
          ) : (
            projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-0.5 flex items-center gap-2 transition-colors text-sm ${
                  selectedProject?.id === p.id
                    ? "bg-sky-600/20 text-sky-300 border border-sky-600/30"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Layers size={13} className="shrink-0" />
                <span className="truncate flex-1">{p.name}</span>
                <ChevronRight size={12} className="shrink-0 opacity-50" />
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between">
          <a href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← Back to site</a>
          <a href="/#pricing" className="text-xs text-sky-600 hover:text-sky-400 transition-colors">Upgrade</a>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        {/* Success banner */}
        {successMessage && (
          <div className="bg-green-900/30 border-b border-green-700/40 px-8 py-3 flex items-center justify-between">
            <p className="text-green-400 text-sm font-medium">{successMessage}</p>
            <button onClick={() => setSuccessMessage("")} className="text-green-600 hover:text-green-400 text-xs">Dismiss</button>
          </div>
        )}

        {!selectedProject ? (
          // ── Empty state ──
          <div className="flex flex-col items-center justify-center h-full text-center p-12">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4">
              <Layers size={28} className="text-sky-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No project selected</h2>
            <p className="text-slate-400 mb-6 max-w-sm">
              Create your first project to start generating API keys and monetizing your APIs.
            </p>
            <button
              onClick={() => setShowProjectForm(true)}
              className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              New Project
            </button>
          </div>
        ) : (
          <div className="p-8 max-w-4xl">
            {/* ── Project header ── */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white">{selectedProject.name}</h1>
                <Badge plan={selectedProject.plan} />
              </div>
              <p className="text-slate-400 text-sm">
                Created {formatDate(selectedProject.createdAt)} · {PLAN_LIMITS[selectedProject.plan]}
              </p>
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "API Keys", value: keys.filter((k) => k.active).length, icon: Key },
                { label: "Calls This Month", value: keys.reduce((s, k) => s + k.callsThisMonth, 0).toLocaleString(), icon: BarChart2 },
                { label: "Plan", value: selectedProject.plan.charAt(0).toUpperCase() + selectedProject.plan.slice(1), icon: Zap },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <Icon size={13} />
                    {label}
                  </div>
                  <div className="text-2xl font-bold text-white">{value}</div>
                </div>
              ))}
            </div>

            {/* ── New key revealed ── */}
            {showNewKey && (
              <div className="mb-6 bg-green-900/20 border border-green-700/40 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-green-400 font-semibold text-sm">🎉 New API key created — copy it now!</p>
                    <p className="text-slate-400 text-xs mt-0.5">This is the only time the full key will be shown.</p>
                  </div>
                  <button onClick={() => setShowNewKey(null)} className="text-slate-500 hover:text-white text-xs">Dismiss</button>
                </div>
                <div className="bg-slate-900 rounded-lg px-4 py-2.5 font-mono text-sm text-sky-300 flex items-center justify-between">
                  <span className="truncate">{showNewKey.key}</span>
                  <CopyButton text={showNewKey.key} />
                </div>
              </div>
            )}

            {/* ── API Keys section ── */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl">
              <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key size={16} className="text-sky-400" />
                  <h2 className="font-semibold text-white">API Keys</h2>
                  <span className="text-slate-500 text-xs">{keys.filter((k) => k.active).length} active</span>
                </div>
                <button
                  onClick={() => loadKeys(selectedProject.id)}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {/* Create key form */}
              <div className="px-5 py-4 border-b border-slate-700/50 bg-slate-800/20">
                <form onSubmit={handleCreateKey} className="flex gap-3">
                  <input
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Key name (e.g. Production, Mobile App)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={creatingKey || !newKeyName.trim()}
                    className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus size={14} />
                    {creatingKey ? "Creating…" : "Create Key"}
                  </button>
                </form>
              </div>

              {/* Keys list */}
              {loadingKeys ? (
                <div className="px-5 py-8 text-center text-slate-500 text-sm">Loading keys…</div>
              ) : keys.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Key size={24} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No API keys yet. Create one above.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/40">
                  {keys.map((k) => (
                    <div key={k.id} className={`px-5 py-4 flex items-center gap-4 ${!k.active ? "opacity-50" : ""}`}>
                      {/* Key info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-white">{k.name}</span>
                          {!k.active && (
                            <span className="text-xs bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded">Revoked</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs text-slate-400">
                            {revealedKeys.has(k.id) ? k.key : maskKey(k.key)}
                          </code>
                          {k.active && (
                            <>
                              <button
                                onClick={() => toggleReveal(k.id)}
                                className="text-slate-500 hover:text-slate-300 transition-colors"
                                title={revealedKeys.has(k.id) ? "Hide" : "Reveal"}
                              >
                                {revealedKeys.has(k.id) ? <EyeOff size={12} /> : <Eye size={12} />}
                              </button>
                              <CopyButton text={k.key} />
                            </>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="text-right shrink-0">
                        <div className="text-xs text-slate-400">{k.callsThisMonth.toLocaleString()} calls</div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {k.lastUsed ? `Last used ${formatDate(k.lastUsed)}` : `Created ${formatDate(k.createdAt)}`}
                        </div>
                      </div>

                      {/* Actions */}
                      {k.active && (
                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          className="shrink-0 p-2 rounded-lg hover:bg-red-900/30 text-slate-500 hover:text-red-400 transition-colors"
                          title="Revoke key"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Integration snippet ── */}
            <div className="mt-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
              <div className="px-5 py-4 border-b border-slate-700/50">
                <h2 className="font-semibold text-white">Quick Integration</h2>
                <p className="text-slate-400 text-xs mt-0.5">Use your API key in requests</p>
              </div>
              <div className="p-5 space-y-3">
                {[
                  {
                    lang: "cURL",
                    code: `curl -H "X-Harbor-Key: hbr_live_your_key_here" https://your-api.com/endpoint`,
                  },
                  {
                    lang: "Node.js",
                    code: `const res = await fetch("https://your-api.com/endpoint", {\n  headers: { "X-Harbor-Key": "hbr_live_your_key_here" }\n});`,
                  },
                  {
                    lang: "Python",
                    code: `import requests\nres = requests.get("https://your-api.com/endpoint",\n  headers={"X-Harbor-Key": "hbr_live_your_key_here"})`,
                  },
                ].map(({ lang, code }) => (
                  <div key={lang}>
                    <div className="text-xs text-slate-500 mb-1.5 font-medium">{lang}</div>
                    <div className="relative bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-300 leading-relaxed">
                      <pre className="whitespace-pre-wrap">{code}</pre>
                      <div className="absolute top-2 right-2">
                        <CopyButton text={code} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
