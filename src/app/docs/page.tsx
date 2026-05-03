export default function DocsPage() {
  const codeStyle = { background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "16px 20px", fontSize: 13, color: "#ccc", overflowX: "auto" as const, fontFamily: "monospace", lineHeight: 1.6, display: "block", whiteSpace: "pre" as const };
  const sectionStyle = { marginBottom: 48 };
  const h2Style = { fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 16, marginTop: 0 };
  const h3Style = { fontSize: 16, fontWeight: 600, color: "#aaa", marginBottom: 12, marginTop: 24 };
  const pStyle = { color: "#666", lineHeight: 1.7, marginBottom: 16 };
  const tabStyle = (active: boolean) => ({ padding: "6px 14px", borderRadius: 6, border: "none", background: active ? "#fff" : "#1a1a1a", color: active ? "#000" : "#666", cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400 });

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontWeight: 700, fontSize: 18, color: "#fff", textDecoration: "none" }}>⚓ Harbor</a>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="/dashboard" style={{ color: "#666", textDecoration: "none", fontSize: 14 }}>Dashboard</a>
          <a href="/docs" style={{ color: "#fff", textDecoration: "none", fontSize: 14 }}>Docs</a>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "52px 24px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Documentation</h1>
        <p style={{ color: "#555", fontSize: 16, marginBottom: 48 }}>Everything you need to add API key auth to your API.</p>

        {/* Quick Start */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Quick Start</h2>
          <p style={pStyle}>Harbor validates API keys and tracks usage. Pick your language and add one line to your server.</p>

          {/* Node.js */}
          <h3 style={h3Style}>Node.js / Express</h3>
          <code style={codeStyle}>{String.raw`npm install harbor-sdk

const { harbor } = require('harbor-sdk');

// Add to your Express app — that's it
app.use(harbor({ projectId: 'proj_harbor_xyz' }));

// Access key info in any route
app.get('/data', (req, res) => {
  console.log(req.harbor.plan);          // 'pro'
  console.log(req.harbor.callsThisMonth); // 1042
  res.json({ data: 'protected!' });
});`}</code>

          {/* Python */}
          <h3 style={h3Style}>Python</h3>
          <code style={codeStyle}>{String.raw`pip install harbor-sdk

# Flask
from harbor_sdk import harbor
from flask import g

@app.route("/data")
@harbor(project_id="proj_harbor_xyz")
def data():
    return {"plan": g.harbor.plan}

# FastAPI
from harbor_sdk import HarborMiddleware

app.add_middleware(HarborMiddleware, project_id="proj_harbor_xyz")`}</code>

          {/* Go */}
          <h3 style={h3Style}>Go</h3>
          <code style={codeStyle}>{String.raw`go get github.com/nicolugo0503-glitch/harbor-go

import harbor "github.com/nicolugo0503-glitch/harbor-go"

mux.Handle("/data", harbor.Middleware(harbor.Config{
    ProjectID: "proj_harbor_xyz",
})(http.HandlerFunc(handler)))

func handler(w http.ResponseWriter, r *http.Request) {
    info := harbor.FromContext(r.Context())
    fmt.Fprintf(w, "Plan: %s", info.Plan)
}`}</code>

          {/* Rust */}
          <h3 style={h3Style}>Rust</h3>
          <code style={codeStyle}>{String.raw`# Cargo.toml
harbor-sdk = "0.1"

// Standalone validation
use harbor_sdk::validate;

match validate("hbr_live_your_key").await {
    Ok(info) => println!("Plan: {}", info.plan),
    Err(e) => println!("Error: {}", e),
}

// Axum middleware
use harbor_sdk::{HarborLayer, KeyInfo};
use axum::Extension;

let app = Router::new()
    .route("/data", get(handler))
    .layer(HarborLayer::new("proj_harbor_xyz"));`}</code>
        </div>

        {/* Local Dev */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Local Development</h2>
          <p style={pStyle}>Use <code style={{ background: "#1a1a1a", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>harbor-mock</code> to test locally without hitting production.</p>
          <code style={codeStyle}>{String.raw`npx harbor-mock
# → Running at http://localhost:4747

# Built-in test keys:
#   hbr_test_free_key  → plan: free
#   hbr_test_pro_key   → plan: pro
#   hbr_test_scale_key → plan: scale

# Point your SDK at the mock:
const { harbor } = require('harbor-sdk');
app.use(harbor({
  projectId: 'proj_...',
  validateUrl: 'http://localhost:4747/api/validate'
}));`}</code>
        </div>

        {/* Validate endpoint */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Validate Endpoint</h2>
          <p style={pStyle}>Call <code style={{ background: "#1a1a1a", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>GET /api/validate?key=YOUR_KEY</code> directly from any language.</p>
          <code style={codeStyle}>{String.raw`curl https://harbor-black.vercel.app/api/validate?key=hbr_live_xxx

{
  "valid": true,
  "keyId": "key_...",
  "projectId": "proj_...",
  "plan": "pro",
  "callsThisMonth": 1042,
  "name": "Production Key",
  "country": "US"
}`}</code>
          <p style={{ ...pStyle, marginTop: 16 }}>Rate limited to <strong style={{ color: "#fff" }}>120 requests/min per IP</strong>. Returns <code style={{ background: "#1a1a1a", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>429</code> with <code style={{ background: "#1a1a1a", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>Retry-After: 60</code> when exceeded.</p>
        </div>

        {/* Customer Portal */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Customer Portal</h2>
          <p style={pStyle}>Every project gets a shareable page where your customers can view their API keys.</p>
          <code style={codeStyle}>{String.raw`https://harbor-black.vercel.app/portal/YOUR_PROJECT_ID`}</code>
          <p style={{ ...pStyle, marginTop: 16 }}>Share this URL with your API users. They'll see their keys, usage counts, and a quick-start code snippet.</p>
        </div>

        {/* Analytics */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Analytics</h2>
          <p style={pStyle}>Every API call is automatically tracked. Open your <a href="/dashboard" style={{ color: "#fff" }}>dashboard</a> and click the <strong style={{ color: "#fff" }}>Analytics</strong> tab to see:</p>
          <ul style={{ color: "#666", lineHeight: 2, paddingLeft: 20 }}>
            <li>Call volume over the last 7 days</li>
            <li>Success vs. invalid key rate</li>
            <li>Today's call count</li>
            <li>Real-time call log with IP, latency, and key ID</li>
          </ul>
        </div>

        {/* Plan gating */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Plan-Based Access</h2>
          <p style={pStyle}>Gate features by plan using the key info attached to every request.</p>
          <code style={codeStyle}>{String.raw`// Node.js
app.get('/premium', (req, res) => {
  if (req.harbor.plan === 'free') {
    return res.status(403).json({ error: 'Upgrade to Pro to access this.' });
  }
  res.json({ data: 'premium content' });
});

# Python (Flask)
@app.route("/premium")
@harbor(project_id="proj_xyz")
def premium():
    if g.harbor.plan == "free":
        return {"error": "Upgrade required"}, 403
    return {"data": "premium content"}`}</code>
        </div>
      </div>
    </div>
  );
}
