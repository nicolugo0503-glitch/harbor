"use client";

import { useState } from "react";
import {
  Zap, Shield, BarChart3, Code2, Globe, ChevronRight,
  Check, ArrowRight, Star, Terminal, Package, Layers,
  DollarSign, Lock, Activity, Cpu, Menu, X
} from "lucide-react";

// ─── NAV ─────────────────────────────────────────────────────────────────────
function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-harbor-500 flex items-center justify-center glow-blue">
            <Layers className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          <span className="text-lg font-bold tracking-tight">harbor</span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          {["Docs", "Pricing", "Blog", "Changelog"].map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} className="hover:text-white transition-colors">
              {l}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Sign in</a>
          <a
            href="#waitlist"
            className="text-sm px-4 py-2 rounded-lg bg-harbor-500 hover:bg-harbor-400 text-white font-medium transition-all hover:shadow-lg hover:shadow-harbor-500/25"
          >
            Get early access
          </a>
        </div>

        {/* Mobile */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-white/60">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/5 bg-[#020617] px-6 py-4 space-y-3">
          {["Docs", "Pricing", "Blog", "Changelog"].map((l) => (
            <a key={l} href="#" className="block text-sm text-white/60 hover:text-white py-1">
              {l}
            </a>
          ))}
          <a href="#waitlist" className="block text-sm text-center py-2 rounded-lg bg-harbor-500 text-white font-medium mt-4">
            Get early access
          </a>
        </div>
      )}
    </nav>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-20 px-6 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-100 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-harbor-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-harbor-500/30 bg-harbor-500/10 text-harbor-400 text-xs font-medium mb-8 animate-fade-in">
          <div className="w-1.5 h-1.5 rounded-full bg-harbor-400 animate-pulse-ring" />
          Now in private beta · 200+ APIs already monetizing
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6">
          <span className="text-white">Stripe for</span>
          <br />
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 40%, #06b6d4 100%)",
            }}
          >
            your API.
          </span>
        </h1>

        {/* Sub */}
        <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Stop rebuilding auth, rate limiting, and billing for every API.
          Harbor gives you the full monetization stack in{" "}
          <span className="text-white/80">one SDK, one line of code</span>.
        </p>

        {/* Email CTA */}
        <div id="waitlist" className="max-w-md mx-auto mb-12">
          {submitted ? (
            <div className="flex items-center justify-center gap-2 py-4 text-harbor-400">
              <Check size={18} />
              <span className="font-medium">You're on the list. We'll be in touch.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-harbor-500/60 focus:ring-1 focus:ring-harbor-500/30 transition"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-harbor-500 hover:bg-harbor-400 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-harbor-500/30 disabled:opacity-70 flex items-center gap-2 justify-center whitespace-nowrap"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Get early access <ArrowRight size={15} /></>
                )}
              </button>
            </form>
          )}
          <p className="text-xs text-white/25 mt-3">Free during beta · No credit card required</p>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-3 mb-16">
          <div className="flex -space-x-2">
            {["A", "B", "C", "D", "E"].map((l, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-[#020617] flex items-center justify-center text-xs font-bold"
                style={{
                  background: ["#0369a1","#0284c7","#0ea5e9","#38bdf8","#7dd3fc"][i],
                  zIndex: 5-i
                }}
              >
                {l}
              </div>
            ))}
          </div>
          <div className="text-sm text-white/40">
            <span className="text-white font-semibold">847</span> developers joined this week
          </div>
          <div className="flex items-center gap-1 text-yellow-400 text-xs">
            {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
          </div>
        </div>

        {/* Code preview */}
        <div className="max-w-2xl mx-auto">
          <CodePreview />
        </div>
      </div>
    </section>
  );
}

// ─── CODE PREVIEW ─────────────────────────────────────────────────────────────
function CodePreview() {
  const [tab, setTab] = useState<"before" | "after">("after");

  const before = `// The old way — build it all yourself 😩
import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import Stripe from 'stripe';
import { db } from './db';

// 400+ lines of boilerplate just to charge for your API...
// Auth middleware, key validation, usage tracking,
// billing webhooks, plan limits, analytics, SDKs...
// Takes months. Breaks constantly.`;

  const after = `// The Harbor way — one SDK, done ✨
import { harbor } from '@harbor/sdk';

const app = express();

// That's it. Auth, billing, rate limits, analytics.
// All handled. Ship in minutes.
app.use(harbor({
  projectId: 'proj_harbor_xyz',
  plans: {
    free:  { calls: 1_000, price: 0 },
    pro:   { calls: 100_000, price: 49 },
    scale: { calls: 'unlimited', price: 299 },
  },
}));

app.get('/data', async (req, res) => {
  // req.harbor.user — who's calling
  // req.harbor.plan — their plan
  // Usage tracked. Billing automated.
  res.json({ data: await fetchData() });
});`;

  return (
    <div className="code-block overflow-hidden text-left shadow-2xl shadow-black/60">
      {/* Tabs */}
      <div className="flex border-b border-white/8">
        <div className="flex items-center gap-1.5 px-4 py-3">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <div className="flex ml-2">
          {(["after", "before"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-xs font-medium border-b-2 transition-all ${
                tab === t
                  ? "border-harbor-500 text-harbor-400"
                  : "border-transparent text-white/30 hover:text-white/60"
              }`}
            >
              {t === "after" ? "✨ With Harbor" : "😩 Without Harbor"}
            </button>
          ))}
        </div>
      </div>

      {/* Code */}
      <div className="p-6 overflow-x-auto">
        <pre className="text-xs md:text-sm leading-relaxed font-mono">
          <CodeHighlight code={tab === "after" ? after : before} />
        </pre>
      </div>
    </div>
  );
}

function CodeHighlight({ code }: { code: string }) {
  const lines = code.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        let className = "text-white/50";
        if (line.trim().startsWith("//")) className = "text-white/30 italic";
        else if (line.includes("import") || line.includes("from")) className = "text-purple-400";
        else if (line.includes("harbor(") || line.includes("plans:") || line.includes("app.")) className = "text-harbor-400";
        else if (line.includes("'") || line.includes('"') || line.includes("`")) className = "text-green-400";
        else if (/\d/.test(line) && !line.includes("//")) className = "text-orange-400";
        else if (line.includes("req.harbor") || line.includes("res.json")) className = "text-white/80";

        return (
          <div key={i} className={className}>
            {line || " "}
          </div>
        );
      })}
    </>
  );
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: <Package size={20} />,
      title: "Install the SDK",
      desc: "One npm install. Works with Express, Fastify, Hono, or any Node.js framework.",
      code: "npm install @harbor/sdk",
    },
    {
      num: "02",
      icon: <Code2 size={20} />,
      title: "Wrap your API",
      desc: "Add one middleware. Harbor intercepts every request and handles auth, plans, and usage.",
      code: "app.use(harbor({ projectId: 'proj_...' }))",
    },
    {
      num: "03",
      icon: <DollarSign size={20} />,
      title: "Start earning",
      desc: "Your users get API keys, a dashboard, and billing. Money lands in your Stripe account.",
      code: "// harbor.dev/dashboard → $47,230 this month",
    },
  ];

  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-harbor-400 text-sm font-semibold uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            From zero to paid API
            <br />
            <span className="text-white/40">in under 10 minutes</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div
              key={i}
              className="relative p-6 rounded-2xl gradient-border bg-white/[0.02] group hover:bg-white/[0.04] transition-all"
            >
              <div className="text-6xl font-black text-white/5 absolute top-4 right-6 select-none">
                {s.num}
              </div>
              <div className="w-10 h-10 rounded-xl bg-harbor-500/15 border border-harbor-500/20 flex items-center justify-center text-harbor-400 mb-4">
                {s.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-white/50 mb-4 leading-relaxed">{s.desc}</p>
              <div className="code-block px-3 py-2 text-xs text-harbor-300 font-mono">
                {s.code}
              </div>
              {i < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-3 text-white/20 z-10">
                  <ChevronRight size={20} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FEATURES ─────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon: <Lock size={22} />,
      title: "API Key Management",
      desc: "Scoped keys, key rotation, expiry dates, per-key rate limits. Everything your customers need to safely use your API.",
      color: "from-purple-500/20 to-purple-600/5",
      border: "border-purple-500/20",
      iconColor: "text-purple-400",
    },
    {
      icon: <Zap size={22} />,
      title: "Rate Limiting & Quotas",
      desc: "Per-minute, per-hour, per-month limits. Plan-based quotas. Soft limits with graceful degradation. Zero config.",
      color: "from-yellow-500/20 to-yellow-600/5",
      border: "border-yellow-500/20",
      iconColor: "text-yellow-400",
    },
    {
      icon: <DollarSign size={22} />,
      title: "Usage-Based Billing",
      desc: "Charge per API call, per token, per compute unit — or flat subscription. Stripe integration built in. You set the price.",
      color: "from-green-500/20 to-green-600/5",
      border: "border-green-500/20",
      iconColor: "text-green-400",
    },
    {
      icon: <BarChart3 size={22} />,
      title: "Real-Time Analytics",
      desc: "See who's calling your API, what endpoints they hit, latency distributions, error rates, and revenue per customer.",
      color: "from-blue-500/20 to-blue-600/5",
      border: "border-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      icon: <Globe size={22} />,
      title: "Customer Portal",
      desc: "A branded self-serve portal for your users. They can manage keys, upgrade plans, view usage, and access billing.",
      color: "from-cyan-500/20 to-cyan-600/5",
      border: "border-cyan-500/20",
      iconColor: "text-cyan-400",
    },
    {
      icon: <Shield size={22} />,
      title: "Abuse Prevention",
      desc: "Detect and block suspicious traffic automatically. IP allowlists, geo-blocking, anomaly detection — no config needed.",
      color: "from-red-500/20 to-red-600/5",
      border: "border-red-500/20",
      iconColor: "text-red-400",
    },
    {
      icon: <Activity size={22} />,
      title: "Webhook Events",
      desc: "Real-time events for usage milestones, payment failures, plan upgrades, and limit breaches. Pipe them anywhere.",
      color: "from-orange-500/20 to-orange-600/5",
      border: "border-orange-500/20",
      iconColor: "text-orange-400",
    },
    {
      icon: <Cpu size={22} />,
      title: "Multi-Framework SDKs",
      desc: "Node, Python, Go, Rust, and more. Every SDK has the same API. Switch frameworks without changing your Harbor code.",
      color: "from-indigo-500/20 to-indigo-600/5",
      border: "border-indigo-500/20",
      iconColor: "text-indigo-400",
    },
    {
      icon: <Terminal size={22} />,
      title: "Local Dev & Testing",
      desc: "Full-featured local emulator. Test billing flows, simulate quota hits, and debug webhooks — without touching production.",
      color: "from-pink-500/20 to-pink-600/5",
      border: "border-pink-500/20",
      iconColor: "text-pink-400",
    },
  ];

  return (
    <section id="docs" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-harbor-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Everything included
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Everything Stripe gives you
            <br />
            <span className="text-white/40">but for APIs</span>
          </h2>
          <p className="text-white/40 mt-4 max-w-xl mx-auto">
            We spent 2 years building the boring infrastructure so you don&apos;t have to.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className={`relative p-6 rounded-2xl border ${f.border} bg-gradient-to-br ${f.color} hover:scale-[1.02] transition-transform cursor-default`}
            >
              <div className={`${f.iconColor} mb-4`}>{f.icon}</div>
              <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PRICING ─────────────────────────────────────────────────────────────────
function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: 0,
      sub: "Free forever",
      features: [
        "Up to 50K API calls/mo",
        "1 API project",
        "Basic analytics (7-day)",
        "Harbor-branded portal",
        "Community support",
        "0.5% transaction fee",
      ],
      cta: "Start free",
      highlight: false,
    },
    {
      name: "Pro",
      price: 49,
      sub: "per month",
      features: [
        "Up to 2M API calls/mo",
        "10 API projects",
        "Full analytics (90-day)",
        "Custom-branded portal",
        "Webhook events",
        "0.3% transaction fee",
        "Email support",
        "Usage-based billing",
      ],
      cta: "Start Pro trial",
      highlight: true,
    },
    {
      name: "Scale",
      price: 299,
      sub: "per month",
      features: [
        "Unlimited API calls",
        "Unlimited projects",
        "Full analytics (1-year)",
        "Custom domain portal",
        "Advanced abuse prevention",
        "0.1% transaction fee",
        "Priority support + SLA",
        "Custom contracts",
        "SSO & team management",
      ],
      cta: "Contact sales",
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-harbor-950/20 to-transparent pointer-events-none" />
      <div className="max-w-5xl mx-auto relative">
        <div className="text-center mb-16">
          <p className="text-harbor-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Simple, transparent pricing
          </h2>
          <p className="text-white/40 mt-4">
            We succeed when you succeed. That&apos;s why we take a small cut of your revenue, not your users.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p, i) => (
            <div
              key={i}
              className={`relative p-7 rounded-2xl transition-all ${
                p.highlight
                  ? "bg-harbor-500/10 border-2 border-harbor-500/40 shadow-lg shadow-harbor-500/10 scale-105"
                  : "gradient-border bg-white/[0.02]"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-harbor-500 text-white text-xs font-semibold">
                  Most popular
                </div>
              )}
              <div className="mb-6">
                <p className="text-sm font-semibold text-white/60 mb-1">{p.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">${p.price}</span>
                  {p.price > 0 && <span className="text-white/40 text-sm">/{p.sub.split(" ")[1]}</span>}
                </div>
                <p className="text-xs text-white/30 mt-1">{p.sub}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm">
                    <Check size={14} className="text-harbor-400 mt-0.5 flex-shrink-0" />
                    <span className="text-white/60">{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#waitlist"
                className={`block w-full py-3 rounded-xl text-sm font-semibold text-center transition-all ${
                  p.highlight
                    ? "bg-harbor-500 hover:bg-harbor-400 text-white hover:shadow-lg hover:shadow-harbor-500/30"
                    : "bg-white/8 hover:bg-white/12 text-white"
                }`}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
function Testimonials() {
  const quotes = [
    {
      text: "We were 3 months into building our own billing layer when we found Harbor. Switched in a day. Saved us 2 engineers and shipped 6 weeks early.",
      name: "Maya Chen",
      role: "CTO @ DataWeave",
      avatar: "MC",
    },
    {
      text: "Harbor is what Stripe was to e-commerce. I can't believe this didn't exist before. Every API company needs this.",
      name: "James Okafor",
      role: "Founder @ Inference Labs",
      avatar: "JO",
    },
    {
      text: "Set up Harbor on a Friday afternoon. By Monday morning we had 12 paying customers using our API. The portal is beautiful.",
      name: "Sarah K.",
      role: "Solo dev turned founder",
      avatar: "SK",
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-harbor-400 text-sm font-semibold uppercase tracking-widest mb-12">
          Loved by API builders
        </p>
        <div className="grid md:grid-cols-3 gap-5">
          {quotes.map((q, i) => (
            <div key={i} className="p-6 rounded-2xl gradient-border bg-white/[0.02]">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={12} className="text-yellow-400" fill="currentColor" />
                ))}
              </div>
              <p className="text-sm text-white/70 leading-relaxed mb-5 italic">&quot;{q.text}&quot;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-harbor-600 flex items-center justify-center text-xs font-bold">
                  {q.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{q.name}</p>
                  <p className="text-xs text-white/40">{q.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-white/5 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-harbor-500 flex items-center justify-center">
                <Layers size={15} className="text-white" />
              </div>
              <span className="font-bold">harbor</span>
            </div>
            <p className="text-xs text-white/30 leading-relaxed">
              The API monetization infrastructure for modern developers.
            </p>
          </div>

          {[
            {
              title: "Product",
              links: ["Features", "Pricing", "Changelog", "Roadmap", "Status"],
            },
            {
              title: "Developers",
              links: ["Documentation", "SDK Reference", "API Reference", "Examples", "CLI"],
            },
            {
              title: "Company",
              links: ["About", "Blog", "Careers", "Privacy", "Terms"],
            },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
                {col.title}
              </p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-white/30 hover:text-white/70 transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between gap-3 text-xs text-white/25">
          <p>© 2025 Harbor Technologies, Inc.</p>
          <p>Built with ♥ by developers, for developers</p>
        </div>
      </div>
    </footer>
  );
}

// ─── FINAL CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="relative p-12 rounded-3xl overflow-hidden gradient-border bg-white/[0.02]">
          <div className="absolute inset-0 bg-harbor-gradient opacity-10 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-harbor-500/20 blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Your API deserves
              <br />
              to make money.
            </h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto">
              Stop spending months on billing infrastructure. Start earning from your API today.
            </p>
            <a
              href="#waitlist"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-harbor-500 hover:bg-harbor-400 text-white font-bold text-base transition-all hover:shadow-xl hover:shadow-harbor-500/30"
            >
              Get early access — it&apos;s free <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <HowItWorks />
      <Features />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
