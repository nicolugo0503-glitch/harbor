import Link from "next/link";
import { redirect } from "next/navigation";
import { kv } from "@vercel/kv";
import { hashPassword, createSession } from "@/lib/auth";
import { ArrowRight, Shield, Zap, BarChart3, Anchor } from "lucide-react";

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/login?error=missing");
  const user = await kv.get<{ passwordHash: string }>("hbr:user:" + email);
  if (!user) redirect("/login?error=invalid");
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) redirect("/login?error=invalid");
  await createSession(email);
  redirect("/dashboard");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-[#020617] flex">
      {/* ── Left panel ── */}
      <div className="flex flex-1 flex-col justify-between p-8 lg:max-w-[480px]">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <Anchor className="h-6 w-6 text-[#0ea5e9]" />
          <span className="text-white font-bold text-xl tracking-tight">harbor</span>
        </Link>

        <div className="w-full max-w-sm py-12">
          <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="mt-2 text-slate-400">Sign in to your Harbor dashboard.</p>

          {error && (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error === "invalid"
                ? "Invalid email or password. Please try again."
                : "Please fill in all fields."}
            </div>
          )}

          <form action={login} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 focus:border-[#0ea5e9]/50 transition"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-slate-500 hover:text-[#0ea5e9] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 focus:border-[#0ea5e9]/50 transition"
              />
            </div>
            <button
              type="submit"
              className="group w-full flex items-center justify-center gap-2 py-3 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-semibold rounded-xl transition-all duration-200"
            >
              Sign in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            No account?{" "}
            <Link
              href="/signup"
              className="text-[#0ea5e9] hover:text-[#38bdf8] font-medium transition-colors"
            >
              Create one free &rarr;
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            SOC 2 Type II
          </div>
          <div className="h-3 w-px bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center relative overflow-hidden border-l border-white/5">
        <div className="pointer-events-none absolute inset-0 bg-grid" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,rgba(14,165,233,0.12),transparent)]" />
        <div className="relative z-10 max-w-sm text-center px-8">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#0ea5e9]/30 bg-[#0ea5e9]/10 animate-pulse-ring">
            <Anchor className="h-9 w-9 text-[#0ea5e9]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Your API monetization<br />stack awaits
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Manage your projects, API keys, usage analytics, and billing &mdash; all in one place.
          </p>
          <div className="mt-10 space-y-3">
            {([
              ["Instant API key provisioning", Zap],
              ["Real-time usage analytics", BarChart3],
              ["Rate limiting & abuse prevention", Shield],
            ] as const).map(([text, Icon]) => (
              <div
                key={text}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-left"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0ea5e9]/10 shrink-0">
                  <Icon className="h-3.5 w-3.5 text-[#0ea5e9]" />
                </div>
                <span className="text-slate-400">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
