"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// âââ Types âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
interface Project {
  id: string;
  name: string;
  plan: "free" | "pro" | "scale";
  createdAt: string;
  callsThisMonth?: number;
}
interface ApiKey {
  key: string;
  createdAt: string;
  label?: string;
  active: boolean;
}
interface AnalyticsPoint {
  date: string;
  calls: number;
  errors: number;
  latency: number;
}

// âââ Constants âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const PLAN_COLORS: Record<string, string> = {
  free: "#6b7280",
  pro: "#6366f1",
  scale: "#f59e0b",
};
const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  scale: "Scale",
};

// âââ Hooks âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function useCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(ease * target));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

// âââ CSS âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #020818;
    color: #e2e8f0;
    font-family: 'Inter', -apple-system, sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
  ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); border-radius: 3px; }

  /* Background */
  .bg-scene {
    position: fixed; inset: 0; z-index: 0; overflow: hidden;
    background: radial-gradient(ellipse at 20% 10%, rgba(99,102,241,0.12) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.08) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.04) 0%, transparent 70%),
                #020818;
  }
  .bg-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
    background-size: 64px 64px;
  }
  .orb {
    position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none;
  }
  .orb-1 {
    width: 600px; height: 600px; top: -200px; left: -100px;
    background: radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%);
    animation: orbFloat1 20s ease-in-out infinite;
  }
  .orb-2 {
    width: 500px; height: 500px; bottom: -100px; right: -100px;
    background: radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%);
    animation: orbFloat2 25s ease-in-out infinite;
  }
  .orb-3 {
    width: 300px; height: 300px; top: 50%; left: 50%;
    background: radial-gradient(circle, rgba(6,182,212,0.06), transparent 70%);
    animation: orbFloat3 18s ease-in-out infinite;
  }

  /* Nav */
  .nav {
    position: sticky; top: 0; z-index: 100;
    backdrop-filter: blur(20px) saturate(180%);
    background: rgba(2,8,24,0.8);
    border-bottom: 1px solid rgba(99,102,241,0.12);
    padding: 0 24px;
    height: 64px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .nav-logo {
    display: flex; align-items: center; gap: 10px;
    text-decoration: none;
    animation: fadeInDown 0.6s ease both;
  }
  .nav-logo-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    box-shadow: 0 0 20px rgba(99,102,241,0.4);
    animation: float 3s ease-in-out infinite;
  }
  .nav-logo-text {
    font-size: 18px; font-weight: 700;
    background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    letter-spacing: -0.3px;
  }
  .nav-right {
    display: flex; align-items: center; gap: 12px;
    animation: fadeInDown 0.6s ease 0.1s both;
  }
  .plan-badge {
    padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .plan-badge-free { background: rgba(107,114,128,0.2); color: #9ca3af; border: 1px solid rgba(107,114,128,0.3); }
  .plan-badge-pro  { background: rgba(99,102,241,0.2); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.4); }
  .plan-badge-scale { background: rgba(245,158,11,0.2); color: #fcd34d; border: 1px solid rgba(245,158,11,0.4); }
  .nav-btn {
    padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500;
    cursor: pointer; border: none; transition: all 0.2s;
  }
  .nav-btn-ghost {
    background: transparent; color: #94a3b8;
  }
  .nav-btn-ghost:hover { color: #e2e8f0; background: rgba(255,255,255,0.06); }
  .nav-btn-primary {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    box-shadow: 0 0 20px rgba(99,102,241,0.3);
  }
  .nav-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 0 30px rgba(99,102,241,0.5); }

  /* Layout */
  .main { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 40px 24px; }

  /* Hero */
  .hero { margin-bottom: 40px; animation: fadeInUp 0.6s ease both; }
  .hero-greeting { font-size: 13px; font-weight: 500; color: #6366f1; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
  .hero-title { font-size: 32px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2;
    background: linear-gradient(135deg, #fff 0%, #c7d2fe 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .hero-sub { font-size: 15px; color: #64748b; margin-top: 6px; }

  /* Stat Cards */
  .stats-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px;
  }
  @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 500px) { .stats-grid { grid-template-columns: 1fr; } }

  .stat-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px; padding: 24px;
    backdrop-filter: blur(12px);
    position: relative; overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
    animation: fadeInUp 0.6s ease both;
  }
  .stat-card::before {
    content: ''; position: absolute; inset: 0; border-radius: 16px;
    background: linear-gradient(135deg, rgba(255,255,255,0.04), transparent);
    pointer-events: none;
  }
  .stat-card:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.3); border-color: rgba(99,102,241,0.25); }
  .stat-card:nth-child(1) { animation-delay: 0.1s; }
  .stat-card:nth-child(2) { animation-delay: 0.15s; }
  .stat-card:nth-child(3) { animation-delay: 0.2s; }
  .stat-card:nth-child(4) { animation-delay: 0.25s; }

  .stat-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .stat-card-icon {
    width: 40px; height: 40px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; font-size: 18px;
  }
  .stat-card-trend { font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 6px; }
  .trend-up { background: rgba(16,185,129,0.15); color: #34d399; }
  .trend-down { background: rgba(239,68,68,0.15); color: #f87171; }
  .trend-neutral { background: rgba(107,114,128,0.15); color: #9ca3af; }

  .stat-value { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #f1f5f9; }
  .stat-label { font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 500; }
  .stat-bar { height: 3px; border-radius: 2px; margin-top: 16px; overflow: hidden; background: rgba(255,255,255,0.06); }
  .stat-bar-fill { height: 100%; border-radius: 2px; transition: width 1.2s cubic-bezier(0.16,1,0.3,1); }

  /* Panel */
  .panel {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px; overflow: hidden;
    backdrop-filter: blur(12px);
    animation: fadeInUp 0.6s ease 0.3s both;
  }
  .tabs {
    display: flex; border-bottom: 1px solid rgba(255,255,255,0.07);
    padding: 0 8px;
  }
  .tab-btn {
    padding: 16px 20px; background: none; border: none; cursor: pointer;
    font-size: 14px; font-weight: 500; color: #64748b;
    position: relative; transition: color 0.2s;
    display: flex; align-items: center; gap: 8px;
  }
  .tab-btn:hover { color: #94a3b8; }
  .tab-btn.active { color: #a5b4fc; }
  .tab-btn.active::after {
    content: ''; position: absolute; bottom: 0; left: 16px; right: 16px;
    height: 2px; background: linear-gradient(90deg, #6366f1, #8b5cf6);
    border-radius: 2px 2px 0 0;
  }
  .tab-dot {
    width: 18px; height: 18px; border-radius: 50%; font-size: 10px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    background: rgba(99,102,241,0.2); color: #a5b4fc;
  }

  .tab-content { padding: 32px; }

  /* Overview */
  .overview-top { display: grid; grid-template-columns: 1fr 280px; gap: 24px; margin-bottom: 24px; }
  @media (max-width: 700px) { .overview-top { grid-template-columns: 1fr; } }

  .chart-container { position: relative; height: 220px; }
  .chart-title { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 16px; }
  .bars-wrapper { display: flex; align-items: flex-end; gap: 8px; height: 180px; }
  .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .bar-fill {
    width: 100%; border-radius: 6px 6px 0 0;
    background: linear-gradient(180deg, #6366f1, #4f46e5);
    transition: height 0.8s cubic-bezier(0.16,1,0.3,1);
    min-height: 4px;
    position: relative; overflow: hidden;
  }
  .bar-fill::after {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 40%;
    background: linear-gradient(180deg, rgba(165,180,252,0.3), transparent);
  }
  .bar-label { font-size: 11px; color: #475569; font-weight: 500; }
  .bar-val { font-size: 10px; color: #6366f1; font-weight: 600; }

  /* Quick Stats Sidebar */
  .quick-stats { display: flex; flex-direction: column; gap: 12px; }
  .quick-stat {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; padding: 16px;
  }
  .quick-stat-label { font-size: 11px; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .quick-stat-value { font-size: 22px; font-weight: 800; color: #f1f5f9; }
  .quick-stat-sub { font-size: 12px; color: #64748b; margin-top: 2px; }

  /* Live dot */
  .live-indicator { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #34d399; font-weight: 500; }
  .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #34d399; animation: pulse 2s infinite; }

  /* Keys Table */
  .keys-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .keys-title { font-size: 18px; font-weight: 700; color: #f1f5f9; }
  .btn-create {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 18px; border-radius: 10px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white; font-size: 13px; font-weight: 600;
    border: none; cursor: pointer;
    box-shadow: 0 0 20px rgba(99,102,241,0.3);
    transition: all 0.2s;
  }
  .btn-create:hover { transform: translateY(-1px); box-shadow: 0 0 30px rgba(99,102,241,0.5); }

  .keys-table { width: 100%; border-collapse: collapse; }
  .keys-table th {
    text-align: left; padding: 10px 16px;
    font-size: 11px; font-weight: 700; color: #475569;
    text-transform: uppercase; letter-spacing: 0.8px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .keys-table td { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
  .keys-table tr:last-child td { border-bottom: none; }
  .keys-table tr:hover td { background: rgba(255,255,255,0.02); }

  .key-mono {
    font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #a5b4fc;
    background: rgba(99,102,241,0.1); padding: 4px 10px; border-radius: 6px;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .key-status { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .key-status-active { background: #34d399; box-shadow: 0 0 6px #34d399; animation: pulse 2s infinite; }
  .key-status-inactive { background: #475569; }

  .icon-btn {
    width: 32px; height: 32px; border-radius: 8px; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 14px;
    transition: all 0.2s;
  }
  .icon-btn-copy { background: rgba(99,102,241,0.1); color: #a5b4fc; }
  .icon-btn-copy:hover { background: rgba(99,102,241,0.2); }
  .icon-btn-revoke { background: rgba(239,68,68,0.1); color: #f87171; }
  .icon-btn-revoke:hover { background: rgba(239,68,68,0.2); }

  .empty-state {
    text-align: center; padding: 60px 20px;
  }
  .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
  .empty-title { font-size: 18px; font-weight: 600; color: #64748b; margin-bottom: 8px; }
  .empty-sub { font-size: 14px; color: #475569; }

  /* Analytics */
  .analytics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
  @media (max-width: 700px) { .analytics-grid { grid-template-columns: 1fr; } }
  .analytics-card {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 20px;
  }
  .analytics-label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .analytics-value { font-size: 24px; font-weight: 800; color: #f1f5f9; }
  .analytics-sub { font-size: 12px; color: #475569; margin-top: 4px; }

  .retention-bar { height: 8px; border-radius: 4px; background: rgba(255,255,255,0.06); margin-top: 16px; overflow: hidden; }
  .retention-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #6366f1, #8b5cf6); transition: width 1.2s cubic-bezier(0.16,1,0.3,1); }

  /* Upgrade Banner */
  .upgrade-banner {
    margin-top: 32px;
    background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1));
    border: 1px solid rgba(99,102,241,0.25);
    border-radius: 16px; padding: 24px 32px;
    display: flex; align-items: center; justify-content: space-between; gap: 24px;
    animation: fadeInUp 0.6s ease 0.5s both;
  }
  @media (max-width: 600px) { .upgrade-banner { flex-direction: column; text-align: center; } }
  .upgrade-text { flex: 1; }
  .upgrade-label { font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .upgrade-title { font-size: 18px; font-weight: 700; color: #f1f5f9; margin-bottom: 4px; }
  .upgrade-sub { font-size: 14px; color: #64748b; }
  .btn-upgrade {
    white-space: nowrap; padding: 12px 24px; border-radius: 12px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white; font-size: 14px; font-weight: 600;
    border: none; cursor: pointer;
    box-shadow: 0 0 30px rgba(99,102,241,0.4);
    transition: all 0.2s;
  }
  .btn-upgrade:hover { transform: translateY(-2px); box-shadow: 0 0 40px rgba(99,102,241,0.6); }

  /* Modal */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center; padding: 24px;
    animation: fadeIn 0.2s ease;
  }
  .modal {
    background: #0d1424; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px;
    padding: 40px; max-width: 700px; width: 100%;
    box-shadow: 0 40px 100px rgba(0,0,0,0.6);
    animation: scaleIn 0.3s cubic-bezier(0.16,1,0.3,1);
    max-height: 90vh; overflow-y: auto;
  }
  .modal-title { font-size: 24px; font-weight: 800; color: #f1f5f9; text-align: center; margin-bottom: 8px; }
  .modal-sub { font-size: 15px; color: #64748b; text-align: center; margin-bottom: 32px; }
  .modal-close {
    position: absolute; top: 16px; right: 16px; width: 32px; height: 32px;
    background: rgba(255,255,255,0.06); border: none; border-radius: 8px;
    color: #94a3b8; cursor: pointer; font-size: 18px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .modal-close:hover { background: rgba(255,255,255,0.1); color: #f1f5f9; }

  .plans-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 560px) { .plans-grid { grid-template-columns: 1fr; } }

  .plan-card {
    border-radius: 16px; padding: 28px; position: relative; overflow: hidden;
    transition: transform 0.2s; cursor: pointer;
  }
  .plan-card:hover { transform: translateY(-4px); }
  .plan-card-pro {
    background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05));
    border: 1px solid rgba(99,102,241,0.35);
  }
  .plan-card-scale {
    background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05));
    border: 1px solid rgba(245,158,11,0.35);
  }
  .plan-name { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .plan-name-pro { color: #a5b4fc; }
  .plan-name-scale { color: #fcd34d; }
  .plan-price { font-size: 36px; font-weight: 800; color: #f1f5f9; line-height: 1; margin: 12px 0; }
  .plan-price span { font-size: 16px; font-weight: 500; color: #64748b; }
  .plan-features { list-style: none; margin-top: 20px; display: flex; flex-direction: column; gap: 10px; }
  .plan-feature { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #94a3b8; }
  .plan-feature-icon { font-size: 16px; flex-shrink: 0; }
  .plan-cta {
    width: 100%; margin-top: 24px; padding: 12px; border-radius: 12px;
    font-size: 14px; font-weight: 700; cursor: pointer; border: none;
    transition: all 0.2s;
  }
  .plan-cta-pro {
    background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;
    box-shadow: 0 0 20px rgba(99,102,241,0.3);
  }
  .plan-cta-pro:hover { box-shadow: 0 0 30px rgba(99,102,241,0.5); }
  .plan-cta-scale {
    background: linear-gradient(135deg, #f59e0b, #d97706); color: white;
    box-shadow: 0 0 20px rgba(245,158,11,0.3);
  }
  .plan-cta-scale:hover { box-shadow: 0 0 30px rgba(245,158,11,0.5); }

  /* Login */
  .login-container {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 24px; position: relative; z-index: 1;
  }
  .login-card {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px; padding: 48px; max-width: 420px; width: 100%;
    backdrop-filter: blur(20px);
    box-shadow: 0 40px 80px rgba(0,0,0,0.4);
    animation: scaleIn 0.4s cubic-bezier(0.16,1,0.3,1);
  }
  .login-logo {
    display: flex; align-items: center; justify-content: center; gap: 12px;
    margin-bottom: 32px;
  }
  .login-logo-icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center; font-size: 24px;
    box-shadow: 0 0 30px rgba(99,102,241,0.5);
    animation: float 3s ease-in-out infinite;
  }
  .login-title { font-size: 28px; font-weight: 800; color: #f1f5f9; text-align: center; margin-bottom: 8px; }
  .login-sub { font-size: 15px; color: #64748b; text-align: center; margin-bottom: 32px; }
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 13px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; }
  .form-input {
    width: 100%; padding: 12px 16px; border-radius: 12px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    color: #f1f5f9; font-size: 15px; font-family: inherit;
    outline: none; transition: all 0.2s;
  }
  .form-input::placeholder { color: #475569; }
  .form-input:focus { border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.05); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
  .btn-login {
    width: 100%; padding: 14px; border-radius: 12px; border: none; cursor: pointer;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white; font-size: 15px; font-weight: 700; font-family: inherit;
    box-shadow: 0 0 30px rgba(99,102,241,0.4);
    transition: all 0.2s; margin-top: 8px;
  }
  .btn-login:hover { transform: translateY(-2px); box-shadow: 0 0 40px rgba(99,102,241,0.6); }
  .btn-login:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  /* Toast */
  .toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 2000;
    background: #1e293b; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px; padding: 14px 20px;
    font-size: 14px; font-weight: 500; color: #f1f5f9;
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    display: flex; align-items: center; gap: 10px;
    animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
  }

  /* Loading */
  .spinner {
    width: 20px; height: 20px; border-radius: 50%;
    border: 2px solid rgba(99,102,241,0.2);
    border-top-color: #6366f1;
    animation: spin 0.8s linear infinite; display: inline-block;
  }
  .loading-center { display: flex; align-items: center; justify-content: center; padding: 80px; gap: 16px; color: #64748b; font-size: 15px; }

  /* Keyframes */
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeInDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
  @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(0.9); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideInRight { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
  @keyframes orbFloat1 {
    0%,100% { transform: translate(0,0) scale(1); }
    33% { transform: translate(80px,-60px) scale(1.1); }
    66% { transform: translate(-40px,40px) scale(0.95); }
  }
  @keyframes orbFloat2 {
    0%,100% { transform: translate(0,0) scale(1); }
    33% { transform: translate(-60px,80px) scale(1.05); }
    66% { transform: translate(40px,-30px) scale(1.1); }
  }
  @keyframes orbFloat3 {
    0%,100% { transform: translate(-50%,-50%) scale(1); }
    50% { transform: translate(-50%,-50%) scale(1.3); }
  }
`;

// âââ Bar Chart ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function BarChart({ data }: { data: AnalyticsPoint[] }) {
  const max = Math.max(...data.map(d => d.calls), 1);
  return (
    <div>
      <p className="chart-title">API Calls â Last 7 Days</p>
      <div className="bars-wrapper">
        {data.map((d, i) => (
          <div key={i} className="bar-col">
            <span className="bar-val">{d.calls > 999 ? (d.calls/1000).toFixed(1)+'k' : d.calls}</span>
            <div className="bar-fill" style={{ height: `${Math.max((d.calls / max) * 140, 4)}px`, animationDelay: `${i * 0.05}s` }} />
            <span className="bar-label">{d.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// âââ Main App ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
export default function App() {
  const [email, setEmail] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [tab, setTab] = useState<"overview" | "keys" | "analytics">("overview");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; icon: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsPoint[]>([]);
  const [totalCalls, setTotalCalls] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [avgLatency, setAvgLatency] = useState(0);

  const callsCounter = useCounter(totalCalls);
  const errorsCounter = useCounter(totalErrors);
  const latencyCounter = useCounter(avgLatency);
  const keysCounter = useCounter(keys.length);

  // ââ Toast helper ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const showToast = useCallback((msg: string, icon = "â") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, icon });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // ââ Login âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setLoggedIn(true);
        showToast("Welcome back!", "ð");
      } else {
        const d = await res.json();
        showToast(d.error || "Something went wrong", "â ");
      }
    } catch {
      showToast("Network error â check connection", "â ");
    } finally {
      setLoading(false);
    }
  };

  // ââ Load dashboard data ââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  useEffect(() => {
    if (!loggedIn) return;
    const load = async () => {
      setDataLoading(true);
      try {
        // Projects
        const pRes = await fetch("/api/projects");
        if (pRes.ok) {
          const projects: Project[] = await pRes.json();
          if (projects.length) setProject(projects[0]);
        }
        // Keys
        const kRes = await fetch("/api/keys");
        if (kRes.ok) {
          const ks: ApiKey[] = await kRes.json();
          setKeys(ks);
        }
        // Analytics
        const aRes = await fetch("/api/analytics?days=7");
        if (aRes.ok) {
          const pts: AnalyticsPoint[] = await aRes.json();
          setAnalytics(pts);
          const tc = pts.reduce((s, p) => s + p.calls, 0);
          const te = pts.reduce((s, p) => s + p.errors, 0);
          const al = pts.length ? Math.round(pts.reduce((s, p) => s + p.latency, 0) / pts.length) : 0;
          setTotalCalls(tc);
          setTotalErrors(te);
          setAvgLatency(al);
        }
      } catch {}
      finally { setDataLoading(false); }
    };
    load();
  }, [loggedIn]);

  // ââ Copy key âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const copyKey = useCallback((key: string) => {
    navigator.clipboard.writeText(key).then(() => showToast("API key copied!", "ð"));
  }, [showToast]);

  // ââ Revoke key âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const revokeKey = useCallback(async (key: string) => {
    try {
      await fetch("/api/keys", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
      setKeys(prev => prev.filter(k => k.key !== key));
      showToast("Key revoked", "ð");
    } catch { showToast("Failed to revoke key", "â "); }
  }, [showToast]);

  // ââ Create key ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const createKey = useCallback(async () => {
    try {
      const res = await fetch("/api/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: "New key" }) });
      if (res.ok) {
        const newKey: ApiKey = await res.json();
        setKeys(prev => [newKey, ...prev]);
        showToast("New API key created!", "ð");
      } else {
        const d = await res.json();
        showToast(d.error || "Failed to create key", "â ");
      }
    } catch { showToast("Network error", "â "); }
  }, [showToast]);

  // ââ Stripe Checkout ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const checkout = useCallback(async (plan: "pro" | "scale") => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        showToast("Checkout error â try again", "â ");
      }
    } catch { showToast("Network error", "â "); }
  }, [showToast]);

  const plan = project?.plan ?? "free";
  const planColor = PLAN_COLORS[plan];
  const callLimit = plan === "scale" ? Infinity : plan === "pro" ? 2_000_000 : 1_000;
  const callPct = callLimit === Infinity ? 30 : Math.min((totalCalls / callLimit) * 100, 100);

  // ââ Render Login âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  if (!loggedIn) return (
    <>
      <style>{CSS}</style>
      <div className="bg-scene">
        <div className="bg-grid" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-icon">â</div>
          </div>
          <h1 className="login-title">Welcome to Harbor</h1>
          <p className="login-sub">Enter your email to access your dashboard</p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <button className="btn-login" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" style={{ borderWidth: 2, width: 16, height: 16 }} /> Signing inâ¦</> : "Continue â"}
            </button>
          </form>
        </div>
      </div>
      {toast && <div className="toast">{toast.icon} {toast.msg}</div>}
    </>
  );

  // ââ Render Dashboard ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  return (
    <>
      <style>{CSS}</style>
      <div className="bg-scene">
        <div className="bg-grid" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Nav */}
      <nav className="nav">
        <a className="nav-logo" href="#">
          <div className="nav-logo-icon">â</div>
           const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setLoggedIn(true);
        showToast("Welcome back!", "ð");
      } else {
        const d = await res.json();
        showToast(d.error || "Something went wrong", "â ");
      }
    } catch {
      showToast("Network error â check connection", "â ");
    } finally {
      setLoading(false);
    }
  };

  // ââ Load dashboard data ââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  useEffect(() => {
    if (!loggedIn) return;
    const load = async () => {
      setDataLoading(true);
      try {
        // Projects
        const pRes = await fetch("/api/projects");
        if (pRes.ok) {
          const projects: Project[] = await pRes.json();
          if (projects.length) setProject(projects[0]);
        }
        // Keys
        const kRes = await fetch("/api/keys");
        if (kRes.ok) {
          const ks: ApiKey[] = await kRes.json();
          setKeys(ks);
        }
        // Analytics
        const aRes = await fetch("/api/analytics?days=7");
        if (aRes.ok) {
          const pts: AnalyticsPoint[] = await aRes.json();
          setAnalytics(pts);
          const tc = pts.reduce((s, p) => s + p.calls, 0);
          const te = pts.reduce((s, p) => s + p.errors, 0);
          const al = pts.length ? Math.round(pts.reduce((s, p) => s + p.latency, 0) / pts.length) : 0;
          setTotalCalls(tc);
          setTotalErrors(te);
          setAvgLatency(al);
        }
      } catch {}
      finally { setDataLoading(false); }
    };
    load();
  }, [loggedIn]);

  // ââ Copy key âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const copyKey = useCallback((key: string) => {
    navigator.clipboard.writeText(key).then(() => showToast("API key copied!", "ð"));
  }, [showToast]);

  // ââ Revoke key âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const revokeKey = useCallback(async (key: string) => {
    try {
      await fetch("/api/keys", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
      setKeys(prev => prev.filter(k => k.key !== key));
      showToast("Key revoked", "ð");
    } catch { showToast("Failed to revoke key", "â "); }
  }, [showToast]);

  // ââ Create key ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const createKey = useCallback(async () => {
    try {
      const res = await fetch("/api/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: "New key" }) });
      if (res.ok) {
        const newKey: ApiKey = await res.json();
        setKeys(prev => [newKey, ...prev]);
        showToast("New API key created!", "ð");
      } else {
        const d = await res.json();
        showToast(d.error || "Failed to create key", "â ");
      }
    } catch { showToast("Network error", "â "); }
  }, [showToast]);

  // ââ Stripe Checkout ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const checkout = useCallback(async (plan: "pro" | "scale") => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        showToast("Checkout error â try again", "â ");
      }
    } catch { showToast("Network error", "â "); }
  }, [showToast]);

  const plan = project?.plan ?? "free";
  const planColor = PLAN_COLORS[plan];
  const callLimit = plan === "scale" ? Infinity : plan === "pro" ? 2_000_000 : 1_000;
  const callPct = callLimit === Infinity ? 30 : Math.min((totalCalls / callLimit) * 100, 100);

  // ââ Render Login âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  if (!loggedIn) return (
    <>
      <style>{CSS}</style>
      <div className="bg-scene">
        <div className="bg-grid" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-icon">â</div>
          </div>
          <h1 className="login-title">Welcome to Harbor</h1>
          <p className="login-sub">Enter your email to access your dashboard</p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <button className="btn-login" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" style={{ borderWidth: 2, width: 16, height: 16 }} /> Signing inâ¦</> : "Continue â"}
            </button>
          </form>
        </div>
      </div>
      {toast && <div className="toast">{toast.icon} {toast.msg}</div>}
    </>
  );

  // ââ Render Dashboard ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  return (
    <>
      <style>{CSS}</style>
      <div className="bg-scene">
        <div className="bg-grid" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Nav */}
      <nav className="nav">
        <a className="nav-logo" href="#">
          <div className="nav-logo-icon">â</div>
                <div className="empty-state">
                    <div className="empty-icon">ð</div>
                    <div className="empty-title">No API keys yet</div>
                    <div className="empty-sub">Create your first key to start making authenticated requests.</div>
                  </div>
                ) : (
                  <table className="keys-table">
                    <thead>
                      <tr>
                        <th>Key</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keys.map((k) => (
                        <tr key={k.key}>
                          <td>
                            <div className="key-mono">
                              <span className={`key-status ${k.active ? "key-status-active" : "key-status-inactive"}`} />
                              {k.key.slice(0, 8)}â¦{k.key.slice(-6)}
                            </div>
                          </td>
                          <td><span style={{ fontSize: 13, color: k.active ? "#34d399" : "#6b7280" }}>{k.active ? "Active" : "Inactive"}</span></td>
                          <td><span style={{ fontSize: 13, color: "#64748b" }}>{new Date(k.createdAt).toLocaleDateString()}</span></td>
                          <td>
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                              <button className="icon-btn icon-btn-copy" title="Copy key" onClick={() => copyKey(k.key)}>ð</button>
                              <button className="icon-btn icon-btn-revoke" title="Revoke key" onClick={() => revokeKey(k.key)}>ð</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {tab === "analytics" && (
              <div>
                <div className="analytics-grid">
                  <div className="analytics-card">
                    <div className="analytics-label">Total Calls</div>
                    <div className="analytics-value">{totalCalls.toLocaleString()}</div>
                    <div className="analytics-sub">This month</div>
                  </div>
                  <div className="analytics-card">
                    <div className="analytics-label">Success Rate</div>
                    <div className="analytics-value" style={{ color: "#34d399" }}>
                      {totalCalls ? ((1 - totalErrors / totalCalls) * 100).toFixed(1) : "100.0"}%
                    </div>
                    <div className="analytics-sub">{totalErrors} errors</div>
                  </div>
                  <div className="analytics-card">
                    <div className="analytics-label">Avg Latency</div>
                    <div className="analytics-value" style={{ color: "#f59e0b" }}>{avgLatency}ms</div>
                    <div className="analytics-sub">Last 7 days</div>
                  </div>
                </div>
                <div className="analytics-card" style={{ marginTop: 0 }}>
                  <div className="analytics-label" style={{ marginBottom: 12 }}>Usage vs Limit</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: "#94a3b8" }}>{totalCalls.toLocaleString()} calls used</span>
                    <span style={{ fontSize: 14, color: "#64748b" }}>
                      {callLimit === Infinity ? "Unlimited" : `${callLimit.toLocaleString()} limit`}
                    </span>
                  </div>
                  <div className="retention-bar" style={{ height: 12 }}>
                    <div className="retention-fill" style={{ width: `${callPct}%` }} />
                  </div>
                  <div style={{ marginTop: 16, fontSize: 13, color: "#475569" }}>
                    Analytics retained for {plan === "scale" ? "365" : plan === "pro" ? "90" : "30"} days on your {PLAN_LABELS[plan]} plan.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upgrade Banner */}
        {plan === "free" && (
          <div className="upgrade-banner">
            <div className="upgrade-text">
              <div className="upgrade-label">ð Level up</div>
              <div className="upgrade-title">Unlock the full power of Harbor</div>
              <div className="upgrade-sub">Pro gives you 2M API calls/mo, 10 projects, 90-day analytics, and priority support.</div>
            </div>
            <button className="btn-upgrade" onClick={() => setShowUpgradeModal(true)}>
              View Plans â
            </button>
          </div>
        )}
      </main>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowUpgradeModal(false); }}>
          <div className="modal" style={{ position: "relative" }}>
            <button className="modal-close" onClick={() => setShowUpgradeModal(false)}>â</button>
            <h2 className="modal-title">Choose your plan</h2>
            <p className="modal-sub">Scale your APIs without limits. Cancel anytime.</p>
            <div className="plans-grid">
              {/* Pro */}
              <div className="plan-card plan-card-pro">
                <div className="plan-name plan-name-pro">Pro</div>
                <div className="plan-price">$49<span>/mo</span></div>
                <ul className="plan-features">
                  {["2M API calls / month","10 projects","90-day analytics","Priority support","Custom rate limits"].map(f => (
                    <li key={f} className="plan-feature"><span className="plan-feature-icon">â¦</span>{f}</li>
                  ))}
                </ul>
                <button className="plan-cta plan-cta-pro" onClick={() => checkout("pro")}>Get Pro â</button>
              </div>
              {/* Scale */}
              <div className="plan-card plan-card-scale">
                <div className="plan-name plan-name-scale">Scale</div>
                <div className="plan-price">$299<span>/mo</span></div>
                <ul className="plan-features">
                  {["Unlimited API calls","Unlimited projects","365-day analytics","Dedicated support","SLA guarantee","Advanced monitoring"].map(f => (
                    <li key={f} className="plan-feature"><span className="plan-feature-icon">â</span>{f}</li>
                  ))}
                </ul>
                <button className="plan-cta plan-cta-scale" onClick={() => checkout("scale")}>Get Scale â</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast.icon} {toast.msg}</div>}
    </>
  );
}
