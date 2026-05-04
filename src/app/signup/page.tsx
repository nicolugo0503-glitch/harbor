import Link from "next/link";
import { redirect } from "next/navigation";
import { kv } from "@vercel/kv";
import { hashPassword, createSession } from "@/lib/auth";
import { ArrowRight, Shield, Zap, BarChart3, Anchor } from "lucide-react";

async function signup(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  if (!name || !email || !password) redirect("/signup?error=missing");
  if (password.length < 8) redirect("/signup?error=weak");
  const existing = await kv.get("hbr:user:" + email);
  if (existing) redirect("/signup?error=exists");
  const passwordHash = await hashPassword(password);
  await kv.set("hbr:user:" + email, {
    email,
    name,
    passwordHash,
    plan: "free",
    createdAt: new Date().toISOString(),
  });
  await createSession(email);
  redirect("/dashboard");
}

const ERRORS: Record<string, string> = {
  missing: "Please fill in all fields.",
  weak: "Password must be at least 8 characters.",
  exists: "An account with this email already exists. Sign in instead.",
};

export default async function SignupPage({
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Create your account</h1>
          <p className="mt-2 text-slate-400">
            Start monetizing your API in minutes. No credit card required.
          </p>

          {error && (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {ERRORS[error] ?? "Something went wrong. Please try again."}
            </div>
          )}

          <form action={signup} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full name</label>
              <input
                type="text"
                name="name"
                required
                placeholder="Jane Smith"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 focus:border-[#0ea5e9]/50 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Work email</label>
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
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                type="password"
                name="password"
                required
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 focus:border-[#0ea5e9]/50 transition"
              />
            </div>
            <button
              type="submit"
              className="group w-full flex items-center justify-center gap-2 py-3 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-semibold rounded-xl transition-all duration-200"
            >
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-600">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-slate-400 transition-colors">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-slate-400 transition-colors">
              Privacy Policy
            </Link>.
          </p>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#0ea5e9] hover:text-[#38bdf8] font-medium transition-colors"
            >
              Sign in &rarr;
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
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#0ea5e9]/30 bg-[#0ea5e9]/10 px-3 py-1 text-xs font-medium text-[#0ea5e9]">
              &#10022; Join 500+ developers
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            From zero to paid API<br />in under 10 minutes
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Install the SDK, add one middleware, and start earning. Harbor handles auth, billing, and analytics so you can ship faster.
          </p>
          <div className="mt-10 space-y-3">
            {([
              ["One SDK, one line of code", Zap],
              ["Revenue lands in your Stripe account", BarChart3],
              ["Enterprise-grade security built in", Shield],
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
