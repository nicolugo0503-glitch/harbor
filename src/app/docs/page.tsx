"use client";

import { useState } from "react";
import { Copy, Check, Zap } from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="absolute top-3 right-3 p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
      title="Copy"
    >
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  );
}

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  return (
    <div className="relative bg-slate-900 rounded-xl border border-slate-700/50 p-4 font-mono text-sm text-slate-300 leading-relaxed mt-3 mb-6">
      <pre className="whitespace-pre-wrap overflow-x-auto">{code}</pre>
      <CopyButton text={code} />
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-14 scroll-mt-24">
      <h2 className="text-xl font-bold text-white mb-4 pb-3 border-b border-slate-800">{title}</h2>
      {children}
    </section>
  );
}

export default function Docs() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-300">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#020617]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-white">Harbor</span>
            <span className="text-slate-500 text-sm ml-1">/ docs</span>
          </a>
          <a href="/dashboard" className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
            Dashboard â
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12 flex gap-12">
        {/* Sidebar */}
        <nav className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-24 space-y-1">
            {[
              { href: "#quickstart", label: "Quick Start" },
              { href: "#install", label: "Installation" },
              { href: "#middleware", label: "Middleware" },
              { href: "#validate", label: "Validate Function" },
              { href: "#req-harbor", label: "req.harbor" },
              { href: "#api-reference", label: "API Reference" },
              { href: "#examples", label: "Examples" },
              { href: "#faq", label: "FAQ" },
            ].map(({ href, label }) => (
              <a key={href} href={href} className="block text-sm text-slate-400 hover:text-white py-1 px-3 rounded-lg hover:bg-slate-800 transition-colors">
                {label}
              </a>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 min-w-0 max-w-3xl">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-3">Documentation</h1>
            <p className="text-slate-400 text-lg">Add API key auth and billing to your Node.js API in under 10 minutes.</p>
          </div>

          {/* Quick Start */}
          <Section id="quickstart" title="Quick Start">
            <p className="mb-2">Three steps. That's it.</p>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">1</div>
                <div className="flex-1">
                  <p className="font-medium text-white mb-1">Install the SDK</p>
                  <CodeBlock code="npm install @harbor/sdk" />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">2</div>
                <div className="flex-1">
                  <p className="font-medium text-white mb-1">Add one line to your API</p>
                  <CodeBlock lang="js" code={`const { harbor } = require('@harbor/sdk');

app.use(harbor({ projectId: 'proj_harbor_xyz' }));`} />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">3</div>
                <div className="flex-1">
                  <p className="font-medium text-white mb-1">Your users send their key in the header</p>
                  <CodeBlock code={`curl -H "X-Harbor-Key: hbr_live_your_key_here" \\
  https://your-api.com/endpoint`} />
                </div>
              </div>
            </div>
          </Section>

          {/* Installation */}
          <Section id="install" title="Installation">
            <CodeBlock code="npm install @harbor/sdk" />
            <p className="text-slate-400 text-sm">Requires Node.js 16+. Works with Express, Fastify, Hono, or any Node.js HTTP framework.</p>
          </Section>

          {/* Middleware */}
          <Section id="middleware" title="Middleware">
            <p className="mb-2">The <code className="text-sky-400 text-sm bg-slate-800 px-1.5 py-0.5 rounded">harbor()</code> function returns Express-compatible middleware that:</p>
            <ul className="list-disc list-inside text-slate-400 space-y-1 mb-4 ml-2">
              <li>Reads the API key from the <code className="text-slate-300 text-sm">X-Harbor-Key</code> header</li>
              <li>Validates it against your Harbor project</li>
              <li>Returns <code className="text-slate-300 text-sm">401</code> if invalid, calls <code className="text-slate-300 text-sm">next()</code> if valid</li>
              <li>Attaches key info to <code className="text-slate-300 text-sm">req.harbor</code></li>
            </ul>

            <CodeBlock lang="js" code={`const express = require('express');
const { harbor } = require('@harbor/sdk');

const app = express();

// Protect all routes
app.use(harbor({ projectId: 'proj_harbor_xyz' }));

// Or protect specific routes
app.get('/premium', harbor({ projectId: 'proj_harbor_xyz' }), (req, res) => {
  res.json({ data: 'premium endpoint' });
});

app.listen(3000);`} />

            <h3 className="font-semibold text-white mt-6 mb-2">Configuration options</h3>
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Option</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Type</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {[
                    { opt: "projectId", type: "string", desc: "Required. Your Harbor project ID from the dashboard." },
                    { opt: "keyHeader", type: "string", desc: "Header to read the key from. Default: 'x-harbor-key'" },
                    { opt: "optional", type: "boolean", desc: "If true, requests without a key proceed (req.harbor = null)" },
                    { opt: "failOpen", type: "boolean", desc: "If Harbor is unreachable, allow requests through instead of blocking" },
                    { opt: "onError", type: "function", desc: "Custom error handler: (res, status, message) => void" },
                  ].map(({ opt, type, desc }) => (
                    <tr key={opt}>
                      <td className="px-4 py-3"><code className="text-sky-400">{opt}</code></td>
                      <td className="px-4 py-3 text-slate-500">{type}</td>
                      <td className="px-4 py-3 text-slate-400">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Validate function */}
          <Section id="validate" title="Validate Function">
            <p className="mb-2">Use <code className="text-sky-400 text-sm bg-slate-800 px-1.5 py-0.5 rounded">validate()</code> when you need key validation without middleware â useful for serverless functions, GraphQL resolvers, or custom auth logic.</p>
            <CodeBlock lang="js" code={`const { validate } = require('@harbor/sdk');

// In any async handler
const info = await validate(req.headers['x-harbor-key']);

if (!info) {
  return res.status(401).json({ error: 'Invalid API key' });
}

console.log(info.plan);           // 'pro'
console.log(info.callsThisMonth); // 1042`} />
          </Section>

          {/* req.harbor */}
          <Section id="req-harbor" title="req.harbor">
            <p className="mb-3">After a successful validation, <code className="text-sky-400 text-sm bg-slate-800 px-1.5 py-0.5 rounded">req.harbor</code> is populated with:</p>
            <CodeBlock lang="js" code={`req.harbor = {
  keyId:          "key_abc123",       // Unique key ID
  projectId:      "proj_harbor_xyz",  // Your project ID
  plan:           "pro",              // Subscriber's plan
  callsThisMonth: 1042,               // API calls this month
  keyName:        "Production",       // Name of the key
}`} />
            <p className="text-slate-400 text-sm">Use <code className="text-slate-300 text-sm">req.harbor.plan</code> to enforce plan-based access control in your routes.</p>
          </Section>

          {/* API Reference */}
          <Section id="api-reference" title="API Reference">
            <h3 className="font-semibold text-white mb-2">Validate endpoint</h3>
            <p className="text-slate-400 mb-3">Harbor exposes a public validation endpoint you can call directly if you prefer not to use the SDK.</p>
            <CodeBlock code={`GET https://harbor-black.vercel.app/api/validate?key=hbr_live_xxx

# Response (valid key)
{
  "valid": true,
  "keyId": "key_abc123",
  "projectId": "proj_harbor_xyz",
  "plan": "pro",
  "callsThisMonth": 1042,
  "name": "Production"
}

# Response (invalid key)
{
  "valid": false,
  "error": "Invalid or revoked API key"
}`} />
            <p className="text-slate-400 text-sm">CORS is enabled. You can also use <code className="text-slate-300 text-sm">POST</code> with a JSON body: <code className="text-slate-300 text-sm">{"{ \"key\": \"hbr_live_xxx\" }"}</code></p>
          </Section>

          {/* Examples */}
          <Section id="examples" title="Examples">
            <h3 className="font-semibold text-white mb-2">Plan-based access control</h3>
            <CodeBlock lang="js" code={`app.get('/premium-data', harbor({ projectId: 'proj_xyz' }), (req, res) => {
  if (req.harbor.plan === 'free') {
    return res.status(403).json({
      error: 'Upgrade to Pro to access this endpoint',
      upgradeUrl: 'https://harbor-black.vercel.app/#pricing',
    });
  }
  res.json({ premiumData: '...' });
});`} />

            <h3 className="font-semibold text-white mb-2">Serverless (Vercel / AWS Lambda)</h3>
            <CodeBlock lang="js" code={`const { validate } = require('@harbor/sdk');

export default async function handler(req, res) {
  const info = await validate(req.headers['x-harbor-key']);
  if (!info) return res.status(401).json({ error: 'Unauthorized' });

  // Your logic here
  res.json({ data: 'protected', plan: info.plan });
}`} />

            <h3 className="font-semibold text-white mb-2">TypeScript</h3>
            <CodeBlock lang="ts" code={`import { harbor } from '@harbor/sdk';
import express, { Request, Response } from 'express';

const app = express();
app.use(harbor({ projectId: process.env.HARBOR_PROJECT_ID! }));

app.get('/data', (req: Request, res: Response) => {
  const plan = req.harbor?.plan; // 'free' | 'pro' | 'scale'
  res.json({ plan });
});`} />
          </Section>

          {/* FAQ */}
          <Section id="faq" title="FAQ">
            <div className="space-y-6">
              {[
                {
                  q: "Where do I get my Project ID?",
                  a: "Sign in to your Harbor dashboard and create a project. The Project ID is shown on your project page."
                },
                {
                  q: "How do my users get API keys?",
                  a: "When a user subscribes to your API through Harbor's checkout flow, they automatically receive an API key via email. They can also manage their keys from the Harbor dashboard."
                },
                {
                  q: "Does Harbor add latency to my API?",
                  a: "Each validation request adds ~20-50ms. Harbor runs globally on Vercel Edge, so latency is minimal. You can also use failOpen: true to ensure availability if Harbor is momentarily unreachable."
                },
                {
                  q: "What frameworks does Harbor support?",
                  a: "The SDK works with any Node.js HTTP framework â Express, Fastify, Hono, Koa, and more. The validate() function works anywhere JavaScript runs."
                },
              ].map(({ q, a }) => (
                <div key={q}>
                  <h4 className="font-medium text-white mb-1">{q}</h4>
                  <p className="text-slate-400 text-sm">{a}</p>
                </div>
              ))}
            </div>
          </Section>

          <div className="bg-sky-950/40 border border-sky-800/40 rounded-xl p-6 mt-8">
            <p className="font-semibold text-white mb-1">Need help?</p>
            <p className="text-slate-400 text-sm">Email <a href="mailto:nicolugo0503@gmail.com" className="text-sky-400 hover:text-sky-300">nicolugo0503@gmail.com</a> and you'll get a response within 24 hours.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
