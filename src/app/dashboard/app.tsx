"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// âââ Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
interface Project { id: string; name: string; plan: "free"|"pro"|"scale"; createdAt: string; callsThisMonth?: number; }
interface ApiKey { key: string; createdAt: string; label?: string; active: boolean; }
interface AnalyticsPoint { date: string; calls: number; errors: number; latency: number; }
interface ActivityItem { id: number; method: string; path: string; status: number; latency: number; region: string; time: string; }
interface ChatMsg { role: "user"|"bot"; text: string; }

// âââ Hooks ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function useCounter(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setValue(Math.floor(ease * target));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

// âââ Helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
let _aid = 0;
function genActivity(): ActivityItem {
  const methods = ['GET','POST','GET','GET','PUT','GET','DELETE'];
  const paths = ['/v1/validate','/v1/keys','/v1/usage','/v1/projects','/v1/events','/v1/metrics','/v1/logs'];
  const regions = ['us-east-1','eu-west-1','ap-se-1','us-west-2','eu-central-1','ap-ne-1'];
  const statuses = [200,200,200,200,201,200,200,429,404];
  return {
    id: ++_aid,
    method: methods[Math.floor(Math.random()*methods.length)],
    path: paths[Math.floor(Math.random()*paths.length)],
    status: statuses[Math.floor(Math.random()*statuses.length)],
    latency: Math.floor(Math.random()*60+3),
    region: regions[Math.floor(Math.random()*regions.length)],
    time: new Date().toLocaleTimeString('en-US',{hour12:false}),
  };
}

// âââ Logo (consistent across all pages) ââââââââââââââââââââââââââââââââââââââ
function HarborLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1"/>
          <stop offset="1" stopColor="#8b5cf6"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#lg1)"/>
      {/* Anchor icon */}
      <circle cx="16" cy="10" r="2.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <line x1="16" y1="12.5" x2="16" y2="24" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="10" y1="16" x2="22" y2="16" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M10 22 C10 24.5 13 26 16 26 C19 26 22 24.5 22 22" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

// âââ Sparkline ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function Sparkline({ vals, color }: { vals: number[]; color: string }) {
  if (vals.length < 2) return null;
  const W=64, H=20;
  const max = Math.max(...vals, 1);
  const pts = vals.map((v,i) => `${(i/(vals.length-1))*W},${H-(v/max)*H}`).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
    </svg>
  );
}

// âââ SVG Line Chart âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function LineChart({ data }: { data: AnalyticsPoint[] }) {
  const W=500, H=150, PX=8, PY=8;
  const vals = data.map(d=>d.calls);
  const max = Math.max(...vals,1);
  const toX = (i:number) => PX+(i/Math.max(data.length-1,1))*(W-PX*2);
  const toY = (v:number) => H-PY-(v/max)*(H-PY*2);
  const pts = data.map((d,i):[number,number] => [toX(i),toY(d.calls)]);
  const path = pts.length < 2 ? '' : pts.reduce((acc,[x,y],i) => {
    if (i===0) return `M${x},${y}`;
    const [px,py]=pts[i-1];
    return `${acc} C${px+(x-px)/2.2},${py} ${x-(x-px)/2.2},${y} ${x},${y}`;
  }, '');
  const area = pts.length < 2 ? '' : `${path} L${pts[pts.length-1][0]},${H} L${pts[0][0]},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'100%'}} preserveAspectRatio="none">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {[0.3,0.6,0.9].map(t=>(
        <line key={t} x1={PX} x2={W-PX} y1={PY+t*(H-PY*2)} y2={PY+t*(H-PY*2)}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
      ))}
      {area && <path d={area} fill="url(#cg)"/>}
      {path && <path d={path} fill="none" stroke="#6366f1" strokeWidth="2.5" filter="url(#glow)" strokeLinecap="round"/>}
      {pts.map(([x,y],i)=>(
        <g key={i}>
          <circle cx={x} cy={y} r="4" fill="#030712" stroke="#6366f1" strokeWidth="2"/>
          <circle cx={x} cy={y} r="1.5" fill="#a5b4fc"/>
        </g>
      ))}
      {data.map((d,i)=>(
        <text key={i} x={toX(i)} y={H-1} textAnchor="middle" fontSize="9" fill="#374151">{d.date}</text>
      ))}
    </svg>
  );
}

// âââ Command Palette ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const CMD = [
  {icon:'ð', label:'Overview', action:'nav:overview', kbd:'G O'},
  {icon:'ð', label:'API Keys', action:'nav:keys', kbd:'G K'},
  {icon:'ð', label:'Analytics', action:'nav:analytics', kbd:'G A'},
  {icon:'â¦', label:'Create new API key', action:'create:key', kbd:''},
  {icon:'â¬', label:'Upgrade plan', action:'upgrade', kbd:''},
  {icon:'ð', label:'View Documentation', action:'docs', kbd:''},
  {icon:'ðª', label:'Sign out', action:'signout', kbd:''},
];

function CommandPalette({ onClose, onAction }: { onClose:()=>void; onAction:(a:string)=>void }) {
  const [q,setQ]=useState('');
  const ref=useRef<HTMLInputElement>(null);
  const items=CMD.filter(i=>!q||i.label.toLowerCase().includes(q.toLowerCase()));
  useEffect(()=>{ ref.current?.focus(); },[]);
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{ if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown',h);
    return ()=>window.removeEventListener('keydown',h);
  },[onClose]);
  return (
    <div className="cmd-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="cmd-box">
        <div className="cmd-row">
          <span style={{fontSize:16,color:'#4b5563'}}>â</span>
          <input ref={ref} className="cmd-input" placeholder="Search commandsâ¦" value={q} onChange={e=>setQ(e.target.value)}/>
          <span className="cmd-esc">ESC</span>
        </div>
        <div className="cmd-results">
          <div className="cmd-sec-label">Commands</div>
          {items.map(it=>(
            <div key={it.action} className="cmd-item" onClick={()=>{onClose();onAction(it.action);}}>
              <span style={{width:24,textAlign:'center',fontSize:14}}>{it.icon}</span>
              <span style={{flex:1}}>{it.label}</span>
              {it.kbd && <span className="cmd-kbd">{it.kbd}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// âââ Chat Bot âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const BOT_REPLIES: Record<string,string> = {
  default: "I'm Harbor's support bot! Ask me anything about API keys, billing, or usage limits.",
  hello: "Hey there! ð How can I help you with Harbor today?",
  pricing: "Harbor offers three plans:\nâ¢ **Free** â 1K calls/mo, 1 project\nâ¢ **Pro** â $49/mo, 2M calls, 10 projects\nâ¢ **Scale** â $299/mo, unlimited everything\n\nWant to upgrade?",
  key: "You can create API keys from the **Keys** tab in your dashboard. Each key can be revoked individually and carries your project's rate limits.",
  rate: "Rate limits depend on your plan:\nâ¢ Free: 1,000 calls/month\nâ¢ Pro: 2,000,000 calls/month\nâ¢ Scale: Unlimited\n\nAll plans include per-minute burst protection.",
  error: "If you're seeing errors, check:\n1. Your API key is active\n2. You haven't exceeded your rate limit\n3. The request format matches our docs at /docs",
  billing: "Billing is handled securely via Stripe. You can upgrade from your dashboard or email support@harbor.dev for billing questions.",
  latency: "Harbor's median p50 latency is under 15ms globally. We have edge nodes in US, EU, and APAC regions.",
  contact: "Reach us at support@harbor.dev or use this chat. We typically respond within 2 hours on business days.",
  docs: "Full documentation is available at harbor.dev/docs â covering REST API, SDKs for Node, Python, Go, and Rust.",
};

function getBotReply(msg: string): string {
  const l = msg.toLowerCase();
  if (/hello|hi|hey|sup/.test(l)) return BOT_REPLIES.hello;
  if (/price|pricing|cost|plan|pro|scale|upgrade|paid/.test(l)) return BOT_REPLIES.pricing;
  if (/key|api key|token/.test(l)) return BOT_REPLIES.key;
  if (/rate|limit|quota|exceeded/.test(l)) return BOT_REPLIES.rate;
  if (/error|fail|4\d\d|not work/.test(l)) return BOT_REPLIES.error;
  if (/bill|invoice|charge|pay|stripe/.test(l)) return BOT_REPLIES.billing;
  if (/latency|slow|speed|fast/.test(l)) return BOT_REPLIES.latency;
  if (/contact|email|support|human/.test(l)) return BOT_REPLIES.contact;
  if (/doc|docs|documentat/.test(l)) return BOT_REPLIES.docs;
  return BOT_REPLIES.default;
}

function ChatBot() {
  const [open,setOpen]=useState(false);
  const [msgs,setMsgs]=useState<ChatMsg[]>([
    {role:'bot', text:"ð Hi! I'm Harbor's support assistant. How can I help you today?"}
  ]);
  const [input,setInput]=useState('');
  const [typing,setTyping]=useState(false);
  const bottomRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[msgs,typing]);

  const send = useCallback(()=>{
    const txt=input.trim();
    if(!txt) return;
    setInput('');
    setMsgs(prev=>[...prev,{role:'user',text:txt}]);
    setTyping(true);
    setTimeout(()=>{
      setTyping(false);
      setMsgs(prev=>[...prev,{role:'bot',text:getBotReply(txt)}]);
    }, 900+Math.random()*600);
  },[input]);

  const onKey = (e:React.KeyboardEvent)=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} };

  return (
    <div className="chatbot-wrap">
      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div className="chatbot-avatar">â</div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:'#f1f5f9'}}>Harbor Support</div>
                <div style={{fontSize:11,color:'#34d399',display:'flex',alignItems:'center',gap:4}}>
                  <span style={{width:6,height:6,borderRadius:'50%',background:'#34d399',display:'inline-block'}}/>
                  Online Â· Replies in seconds
                </div>
              </div>
            </div>
            <button className="chatbot-close" onClick={()=>setOpen(false)}>â</button>
          </div>
          <div className="chatbot-msgs">
            {msgs.map((m,i)=>(
              <div key={i} className={`chatbot-msg chatbot-msg-${m.role}`}>
                <div className={`chatbot-bubble chatbot-bubble-${m.role}`}>
                  {m.text.split('\n').map((line,j)=>(
                    <span key={j}>{line.replace(/\*\*(.*?)\*\*/g,(_,t)=>t)}<br/></span>
                  ))}
                </div>
              </div>
            ))}
            {typing && (
              <div className="chatbot-msg chatbot-msg-bot">
                <div className="chatbot-bubble chatbot-bubble-bot chatbot-typing">
                  <span/><span/><span/>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
          <div className="chatbot-footer">
            <input
              className="chatbot-input"
              placeholder="Ask anythingâ¦"
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={onKey}
            />
            <button className="chatbot-send" onClick={send} disabled={!input.trim()}>â</button>
          </div>
        </div>
      )}
      <button className="chatbot-trigger" onClick={()=>setOpen(o=>!o)} title="Support chat">
        {open ? 'â' : 'ð¬'}
        {!open && <span className="chatbot-unread">1</span>}
      </button>
    </div>
  );
}

// âââ Reviews ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const REVIEWS = [
  {name:'Sarah Chen', role:'CTO @ Pulsar Labs', avatar:'SC', text:'Harbor replaced three internal systems. Setup was 10 minutes, API is clean, and the dashboard is genuinely beautiful. We scaled to 50M calls/month without a single ops incident.', stars:5},
  {name:'Marcus Webb', role:'Founder @ DevFlow', avatar:'MW', text:'The validate endpoint is stupid fast. Under 8ms p99 in production. We deprecated our entire auth middleware in favor of Harbor and never looked back.', stars:5},
  {name:'Priya Nair', role:'Staff Engineer @ Nexus', avatar:'PN', text:'I evaluated five API gateway solutions. Harbor was the only one that felt built by engineers who actually use APIs. The Go SDK is exceptional.', stars:5},
  {name:'James Okafor', role:'VP Eng @ Streamline', avatar:'JO', text:'We run 200+ microservices through Harbor. Analytics, rate limiting, key management â all in one place. The scale plan pays for itself every week.', stars:5},
];

function ReviewCarousel() {
  const [idx,setIdx]=useState(0);
  useEffect(()=>{
    const t=setInterval(()=>setIdx(i=>(i+1)%REVIEWS.length),4500);
    return ()=>clearInterval(t);
  },[]);
  const r=REVIEWS[idx];
  return (
    <div className="review-card">
      <div className="review-stars">{'â'.repeat(r.stars)}</div>
      <p className="review-text">"{r.text}"</p>
      <div className="review-author">
        <div className="review-avatar">{r.avatar}</div>
        <div>
          <div className="review-name">{r.name}</div>
          <div className="review-role">{r.role}</div>
        </div>
      </div>
      <div className="review-dots">
        {REVIEWS.map((_,i)=>(
          <button key={i} className={`review-dot ${i===idx?'review-dot-active':''}`} onClick={()=>setIdx(i)}/>
        ))}
      </div>
    </div>
  );
}

// âââ CSS ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%;background:#030712;color:#e2e8f0;font-family:'Inter',-apple-system,sans-serif;overflow:hidden}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.3);border-radius:2px}
  ::-webkit-scrollbar-thumb:hover{background:rgba(99,102,241,0.5)}

  /* Aurora */
  .aurora{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
  .aurora-l1{position:absolute;inset:-50%;width:200%;height:200%;
    background:conic-gradient(from 0deg at 25% 25%,
      transparent 0deg,rgba(99,102,241,0.09) 60deg,transparent 120deg,
      rgba(139,92,246,0.06) 200deg,transparent 260deg,rgba(6,182,212,0.04) 320deg,transparent 360deg);
    animation:auroraRot 28s linear infinite}
  .aurora-l2{position:absolute;inset:-50%;width:200%;height:200%;
    background:conic-gradient(from 180deg at 70% 65%,
      transparent 0deg,rgba(59,130,246,0.07) 80deg,transparent 160deg,rgba(99,102,241,0.08) 240deg,transparent 320deg);
    animation:auroraRot 40s linear infinite reverse}
  .aurora-g1{position:absolute;width:900px;height:900px;top:-20%;left:-15%;
    background:radial-gradient(circle,rgba(99,102,241,0.13) 0%,transparent 70%);
    filter:blur(80px);animation:gd1 20s ease-in-out infinite}
  .aurora-g2{position:absolute;width:700px;height:700px;bottom:-15%;right:-10%;
    background:radial-gradient(circle,rgba(139,92,246,0.10) 0%,transparent 70%);
    filter:blur(100px);animation:gd2 26s ease-in-out infinite}
  .aurora-g3{position:absolute;width:500px;height:500px;top:45%;left:45%;
    background:radial-gradient(circle,rgba(6,182,212,0.06) 0%,transparent 70%);
    filter:blur(60px);animation:gd3 17s ease-in-out infinite}
  .grid-bg{position:fixed;inset:0;z-index:0;pointer-events:none;
    background-image:linear-gradient(rgba(99,102,241,0.03) 1px,transparent 1px),
      linear-gradient(90deg,rgba(99,102,241,0.03) 1px,transparent 1px);
    background-size:48px 48px;
    mask-image:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0.7) 0%,transparent 80%)}

  /* App Shell */
  .app-shell{position:relative;z-index:1;display:grid;grid-template-columns:240px 1fr;height:100vh;overflow:hidden}

  /* Sidebar */
  .sidebar{display:flex;flex-direction:column;background:rgba(3,7,18,0.85);
    border-right:1px solid rgba(255,255,255,0.06);backdrop-filter:blur(20px)}
  .sb-logo{display:flex;align-items:center;gap:10px;padding:18px 16px 14px;
    border-bottom:1px solid rgba(255,255,255,0.05)}
  .sb-logo-text{font-size:17px;font-weight:800;letter-spacing:-0.3px;
    background:linear-gradient(135deg,#fff 0%,#c7d2fe 100%);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .sb-logo-badge{margin-left:auto;font-size:9px;font-weight:700;
    padding:2px 6px;border-radius:4px;text-transform:uppercase;letter-spacing:0.5px}
  .sb-section{padding:14px 10px 6px}
  .sb-section-label{font-size:10px;font-weight:700;color:#1f2937;
    text-transform:uppercase;letter-spacing:1px;padding:0 8px;margin-bottom:4px}
  .nav-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;
    font-size:13.5px;font-weight:500;color:#6b7280;cursor:pointer;border:none;
    background:none;width:100%;text-align:left;transition:all 0.15s;position:relative;margin-bottom:1px}
  .nav-item:hover{color:#d1d5db;background:rgba(255,255,255,0.04)}
  .nav-item.active{color:#a5b4fc;background:rgba(99,102,241,0.12)}
  .nav-item.active::before{content:'';position:absolute;left:0;top:22%;bottom:22%;
    width:2px;border-radius:1px;background:linear-gradient(180deg,#6366f1,#8b5cf6)}
  .nav-icon{font-size:15px;width:20px;text-align:center;flex-shrink:0}
  .nav-badge{margin-left:auto;min-width:18px;height:18px;background:rgba(99,102,241,0.2);
    color:#a5b4fc;border-radius:5px;font-size:10px;font-weight:700;
    display:flex;align-items:center;justify-content:center;padding:0 4px}
  .sb-bottom{margin-top:auto;border-top:1px solid rgba(255,255,255,0.05);padding:10px}
  .sb-user{display:flex;align-items:center;gap:9px;padding:9px 8px;border-radius:8px;cursor:pointer;transition:background 0.15s}
  .sb-user:hover{background:rgba(255,255,255,0.04)}
  .sb-avatar{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);
    display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;flex-shrink:0}
  .sb-user-info{flex:1;min-width:0}
  .sb-email{font-size:11px;color:#6b7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sb-plan{font-size:10px;color:#6366f1;font-weight:600;text-transform:uppercase;letter-spacing:0.3px}
  .sb-out{font-size:12px;color:#374151;cursor:pointer;padding:4px;border-radius:4px;border:none;background:none;transition:color 0.15s}
  .sb-out:hover{color:#6b7280}

  /* Status Bar */
  .status-bar{height:26px;background:rgba(16,185,129,0.07);border-bottom:1px solid rgba(16,185,129,0.14);
    display:flex;align-items:center;justify-content:center;gap:20px;font-size:11px;color:#34d399;font-weight:500;flex-shrink:0}
  .s-dot{width:6px;height:6px;border-radius:50%;background:#34d399;animation:sPulse 2s infinite;display:inline-block;margin-right:5px}
  .s-sep{color:rgba(52,211,153,0.25)}

  /* Content */
  .content-area{display:flex;flex-direction:column;overflow:hidden;background:rgba(3,7,18,0.4)}
  .topbar{height:50px;flex-shrink:0;display:flex;align-items:center;gap:10px;padding:0 22px;
    border-bottom:1px solid rgba(255,255,255,0.05);background:rgba(3,7,18,0.6);backdrop-filter:blur(16px)}
  .topbar-search{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:0 12px;height:30px;
    cursor:pointer;transition:all 0.2s;min-width:200px}
  .topbar-search:hover{background:rgba(255,255,255,0.07);border-color:rgba(99,102,241,0.3)}
  .topbar-search-text{font-size:12.5px;color:#374151;flex:1}
  .topbar-kbd{display:flex;gap:2px;font-size:10px;color:#1f2937;font-family:'JetBrains Mono',monospace}
  .t-kbd{background:rgba(255,255,255,0.06);border-radius:3px;padding:1px 4px}
  .topbar-right{margin-left:auto;display:flex;align-items:center;gap:8px}
  .topbar-icon-btn{width:30px;height:30px;border-radius:7px;border:none;cursor:pointer;
    background:rgba(255,255,255,0.04);color:#64748b;display:flex;align-items:center;
    justify-content:center;font-size:14px;transition:all 0.15s}
  .topbar-icon-btn:hover{background:rgba(255,255,255,0.08);color:#94a3b8}
  .plan-chip{padding:4px 10px;border-radius:5px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px}
  .chip-free{background:rgba(107,114,128,0.15);color:#6b7280;border:1px solid rgba(107,114,128,0.25)}
  .chip-pro{background:rgba(99,102,241,0.15);color:#a5b4fc;border:1px solid rgba(99,102,241,0.3)}
  .chip-scale{background:rgba(245,158,11,0.15);color:#fcd34d;border:1px solid rgba(245,158,11,0.3)}
  .upgrade-btn{padding:5px 14px;border-radius:7px;border:none;cursor:pointer;
    background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;font-size:12px;font-weight:600;
    box-shadow:0 0 14px rgba(99,102,241,0.35);transition:all 0.2s}
  .upgrade-btn:hover{box-shadow:0 0 22px rgba(99,102,241,0.55);transform:translateY(-1px)}

  /* Page */
  .page-scroll{flex:1;overflow-y:auto;padding:24px}
  .page-header{margin-bottom:22px;display:flex;align-items:flex-start;justify-content:space-between}
  .page-title-row{display:flex;align-items:center;gap:10px;margin-bottom:3px}
  .page-title{font-size:21px;font-weight:800;letter-spacing:-0.4px;color:#f1f5f9}
  .live-pill{display:flex;align-items:center;gap:5px;background:rgba(16,185,129,0.1);
    border:1px solid rgba(16,185,129,0.2);padding:3px 9px;border-radius:20px;font-size:10px;font-weight:600;color:#34d399}
  .live-dot{width:5px;height:5px;border-radius:50%;background:#34d399;animation:sPulse 2s infinite}
  .page-sub{font-size:13px;color:#374151}

  /* Metric Cards */
  .metrics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
  .m-card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);
    border-radius:14px;padding:18px;backdrop-filter:blur(12px);position:relative;overflow:hidden;
    transition:transform 0.25s,box-shadow 0.25s,border-color 0.25s}
  .m-card::after{content:'';position:absolute;inset:0;border-radius:14px;
    background:linear-gradient(135deg,rgba(255,255,255,0.03) 0%,transparent 60%);pointer-events:none}
  .m-card:hover{transform:translateY(-3px);box-shadow:0 16px 48px rgba(0,0,0,0.4);border-color:rgba(99,102,241,0.2)}
  .m-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
  .m-icon{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px}
  .m-trend{font-size:11px;font-weight:600;padding:2px 7px;border-radius:5px}
  .tr-green{background:rgba(16,185,129,0.12);color:#34d399}
  .tr-red{background:rgba(239,68,68,0.12);color:#f87171}
  .tr-blue{background:rgba(99,102,241,0.12);color:#a5b4fc}
  .tr-amber{background:rgba(245,158,11,0.12);color:#fcd34d}
  .m-value{font-size:25px;font-weight:800;letter-spacing:-0.5px;color:#f1f5f9;line-height:1;margin-bottom:2px}
  .m-label{font-size:11.5px;color:#374151;font-weight:500}
  .m-spark{margin-top:10px}

  /* Grid layout */
  .two-col{display:grid;grid-template-columns:1fr 270px;gap:12px;margin-bottom:12px}
  .three-col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px}

  /* Panel */
  .panel{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);
    border-radius:14px;overflow:hidden;backdrop-filter:blur(12px)}
  .panel-header{display:flex;align-items:center;justify-content:space-between;
    padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.05)}
  .panel-title{font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.7px}
  .panel-action{font-size:12px;color:#6366f1;font-weight:600;cursor:pointer;background:none;border:none;transition:color 0.15s}
  .panel-action:hover{color:#a5b4fc}
  .panel-body{padding:18px}
  .chart-wrap{height:155px}

  /* Info rows */
  .info-row{display:flex;align-items:center;justify-content:space-between;
    padding:10px 18px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:13px}
  .info-row:last-child{border-bottom:none}
  .i-label{color:#374151;font-weight:500}
  .i-val{color:#e2e8f0;font-weight:600}
  .i-val-accent{color:#a5b4fc}
  .i-val-green{color:#34d399}

  /* Usage bar */
  .usage-track{height:5px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;margin-top:6px}
  .usage-fill{height:100%;border-radius:3px;transition:width 1.2s cubic-bezier(0.16,1,0.3,1)}

  /* Activity feed */
  .feed-wrap{max-height:220px;overflow-y:auto}
  .feed-row{display:grid;grid-template-columns:52px 1fr 40px 55px 70px;gap:8px;align-items:center;
    padding:8px 18px;border-bottom:1px solid rgba(255,255,255,0.03);transition:background 0.15s;animation:feedIn 0.3s ease}
  .feed-row:hover{background:rgba(255,255,255,0.02)}
  .method-badge{font-family:'JetBrains Mono',monospace;font-size:9.5px;font-weight:700;
    padding:2px 6px;border-radius:4px;text-align:center;letter-spacing:0.3px}
  .m-GET{background:rgba(16,185,129,0.15);color:#34d399}
  .m-POST{background:rgba(99,102,241,0.15);color:#a5b4fc}
  .m-PUT{background:rgba(245,158,11,0.15);color:#fcd34d}
  .m-DELETE{background:rgba(239,68,68,0.15);color:#f87171}
  .feed-path{color:#6b7280;font-family:'JetBrains Mono',monospace;font-size:11px;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .feed-status-ok{color:#34d399;font-size:11px;font-weight:600;font-family:'JetBrains Mono',monospace}
  .feed-status-err{color:#f87171;font-size:11px;font-weight:600;font-family:'JetBrains Mono',monospace}
  .feed-lat{color:#374151;font-size:11px}
  .feed-region{color:#1f2937;font-size:10px;font-family:'JetBrains Mono',monospace}

  /* Keys */
  .keys-toolbar{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.05)}
  .new-key-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;
    background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);
    color:#a5b4fc;font-size:12.5px;font-weight:600;cursor:pointer;transition:all 0.2s}
  .new-key-btn:hover{background:rgba(99,102,241,0.25);border-color:rgba(99,102,241,0.5);box-shadow:0 0 14px rgba(99,102,241,0.2)}
  .key-row{display:grid;grid-template-columns:1fr auto auto auto;gap:14px;align-items:center;
    padding:12px 18px;border-bottom:1px solid rgba(255,255,255,0.04);transition:background 0.15s}
  .key-row:hover{background:rgba(255,255,255,0.02)}
  .key-row:last-child{border-bottom:none}
  .key-mono{font-family:'JetBrains Mono',monospace;font-size:12px;color:#a5b4fc;
    background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.15);
    padding:3px 9px;border-radius:6px;display:inline-flex;align-items:center;gap:6px}
  .key-led{width:5px;height:5px;border-radius:50%;background:#34d399;animation:sPulse 2s infinite}
  .key-date{font-size:11.5px;color:#374151}
  .a-btn{width:26px;height:26px;border-radius:6px;border:none;cursor:pointer;
    display:flex;align-items:center;justify-content:center;font-size:13px;transition:all 0.15s}
  .a-copy{background:rgba(99,102,241,0.1);color:#a5b4fc}
  .a-copy:hover{background:rgba(99,102,241,0.2)}
  .a-rev{background:rgba(239,68,68,0.1);color:#f87171}
  .a-rev:hover{background:rgba(239,68,68,0.2)}
  .empty-keys{text-align:center;padding:44px 24px}
  .empty-icon{font-size:34px;margin-bottom:10px;opacity:0.3}
  .empty-title{font-size:14px;font-weight:600;color:#374151;margin-bottom:5px}
  .empty-sub{font-size:12px;color:#1f2937}

  /* Analytics page */
  .a-cards-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px}
  .a-card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px}
  .a-card-label{font-size:11px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.7px;margin-bottom:5px}
  .a-card-value{font-size:22px;font-weight:800;color:#f1f5f9}
  .a-card-sub{font-size:11px;color:#374151;margin-top:3px}

  /* Upgrade modal */
  .modal-backdrop{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.75);backdrop-filter:blur(10px);
    display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn 0.2s ease}
  .modal-box{background:#0d1424;border:1px solid rgba(255,255,255,0.1);border-radius:20px;
    padding:36px;max-width:700px;width:100%;box-shadow:0 40px 100px rgba(0,0,0,0.7);
    animation:scaleIn 0.25s cubic-bezier(0.16,1,0.3,1);position:relative;max-height:92vh;overflow-y:auto}
  .modal-x{position:absolute;top:14px;right:14px;width:28px;height:28px;background:rgba(255,255,255,0.06);
    border:none;border-radius:6px;color:#64748b;cursor:pointer;font-size:14px;
    display:flex;align-items:center;justify-content:center;transition:all 0.15s}
  .modal-x:hover{background:rgba(255,255,255,0.1);color:#f1f5f9}
  .modal-h{font-size:21px;font-weight:800;color:#f1f5f9;text-align:center;margin-bottom:5px}
  .modal-sub{font-size:13px;color:#4b5563;text-align:center;margin-bottom:6px}
  .modal-reviews{margin-bottom:22px}
  .plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
  .plan-box{border-radius:14px;padding:24px;cursor:pointer;transition:transform 0.2s}
  .plan-box:hover{transform:translateY(-3px)}
  .plan-box-pro{background:linear-gradient(135deg,rgba(99,102,241,0.12),rgba(99,102,241,0.04));border:1px solid rgba(99,102,241,0.3)}
  .plan-box-scale{background:linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.04));border:1px solid rgba(245,158,11,0.3)}
  .plan-name{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
  .plan-name-pro{color:#a5b4fc}
  .plan-name-scale{color:#fcd34d}
  .plan-price{font-size:32px;font-weight:900;color:#f1f5f9;line-height:1;margin:10px 0}
  .plan-period{font-size:13px;color:#4b5563;font-weight:400}
  .plan-feats{list-style:none;margin:14px 0;display:flex;flex-direction:column;gap:7px}
  .plan-feat{display:flex;align-items:center;gap:7px;font-size:13px;color:#94a3b8}
  .feat-check{color:#34d399;font-size:11px}
  .plan-cta{width:100%;margin-top:14px;padding:10px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:all 0.2s}
  .plan-cta-pro{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;box-shadow:0 0 18px rgba(99,102,241,0.3)}
  .plan-cta-pro:hover{box-shadow:0 0 28px rgba(99,102,241,0.5)}
  .plan-cta-scale{background:linear-gradient(135deg,#f59e0b,#d97706);color:white;box-shadow:0 0 18px rgba(245,158,11,0.3)}
  .plan-cta-scale:hover{box-shadow:0 0 28px rgba(245,158,11,0.5)}

  /* Reviews */
  .review-card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);
    border-radius:14px;padding:20px;transition:all 0.3s}
  .review-stars{color:#f59e0b;font-size:13px;letter-spacing:2px;margin-bottom:10px}
  .review-text{font-size:13px;color:#94a3b8;line-height:1.65;font-style:italic;margin-bottom:14px}
  .review-author{display:flex;align-items:center;gap:10px}
  .review-avatar{width:32px;height:32px;border-radius:50%;
    background:linear-gradient(135deg,#6366f1,#8b5cf6);
    display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;flex-shrink:0}
  .review-name{font-size:13px;font-weight:700;color:#f1f5f9}
  .review-role{font-size:11px;color:#4b5563}
  .review-dots{display:flex;gap:5px;margin-top:14px}
  .review-dot{width:6px;height:6px;border-radius:50%;border:none;cursor:pointer;
    background:rgba(255,255,255,0.12);transition:all 0.2s;padding:0}
  .review-dot-active{background:#6366f1;width:18px;border-radius:3px}

  /* Upgrade CTA strip */
  .upgrade-strip{background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.06));
    border:1px solid rgba(99,102,241,0.18);border-radius:14px;padding:18px 22px;
    display:flex;align-items:center;gap:14px;margin-top:12px}
  .upgrade-strip-text{flex:1}
  .upgrade-strip-label{font-size:10px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
  .upgrade-strip-title{font-size:14px;font-weight:700;color:#f1f5f9;margin-bottom:2px}
  .upgrade-strip-sub{font-size:12px;color:#374151}
  .upgrade-strip-btn{white-space:nowrap;padding:9px 18px;border-radius:9px;
    background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;font-size:13px;font-weight:700;
    border:none;cursor:pointer;box-shadow:0 0 20px rgba(99,102,241,0.35);transition:all 0.2s}
  .upgrade-strip-btn:hover{transform:translateY(-2px);box-shadow:0 0 32px rgba(99,102,241,0.55)}

  /* Command Palette */
  .cmd-backdrop{position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);
    display:flex;align-items:flex-start;justify-content:center;padding-top:80px;animation:fadeIn 0.15s ease}
  .cmd-box{background:#111827;border:1px solid rgba(255,255,255,0.12);border-radius:14px;
    width:100%;max-width:500px;box-shadow:0 30px 80px rgba(0,0,0,0.6);overflow:hidden;
    animation:slideDown 0.2s cubic-bezier(0.16,1,0.3,1)}
  .cmd-row{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.07)}
  .cmd-input{flex:1;background:none;border:none;outline:none;font-size:15px;color:#f1f5f9;font-family:inherit}
  .cmd-input::placeholder{color:#1f2937}
  .cmd-esc{font-size:10px;font-family:'JetBrains Mono',monospace;color:#1f2937;
    background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:4px}
  .cmd-results{max-height:300px;overflow-y:auto;padding:8px}
  .cmd-sec-label{font-size:10px;font-weight:700;color:#1f2937;text-transform:uppercase;letter-spacing:0.8px;padding:6px 10px 4px}
  .cmd-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;
    cursor:pointer;font-size:13.5px;color:#94a3b8;transition:all 0.1s}
  .cmd-item:hover{background:rgba(99,102,241,0.15);color:#e2e8f0}
  .cmd-kbd{font-family:'JetBrains Mono',monospace;font-size:10px;color:#1f2937}

  /* ChatBot */
  .chatbot-wrap{position:fixed;bottom:24px;right:24px;z-index:1500;display:flex;flex-direction:column;align-items:flex-end;gap:12px}
  .chatbot-trigger{width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;
    background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;font-size:22px;
    box-shadow:0 8px 30px rgba(99,102,241,0.5);transition:all 0.2s;position:relative;
    display:flex;align-items:center;justify-content:center}
  .chatbot-trigger:hover{transform:scale(1.08);box-shadow:0 12px 40px rgba(99,102,241,0.65)}
  .chatbot-unread{position:absolute;top:-2px;right:-2px;width:16px;height:16px;border-radius:50%;
    background:#ef4444;color:white;font-size:9px;font-weight:700;
    display:flex;align-items:center;justify-content:center;border:2px solid #030712}
  .chatbot-window{width:340px;background:#0d1424;border:1px solid rgba(255,255,255,0.1);
    border-radius:16px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.6);
    animation:scaleIn 0.25s cubic-bezier(0.16,1,0.3,1)}
  .chatbot-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;
    background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1));
    border-bottom:1px solid rgba(255,255,255,0.08)}
  .chatbot-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);
    display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
  .chatbot-close{background:none;border:none;color:#64748b;cursor:pointer;font-size:16px;
    width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:all 0.15s}
  .chatbot-close:hover{background:rgba(255,255,255,0.08);color:#f1f5f9}
  .chatbot-msgs{padding:12px;height:260px;overflow-y:auto;display:flex;flex-direction:column;gap:8px}
  .chatbot-msg{display:flex}
  .chatbot-msg-user{justify-content:flex-end}
  .chatbot-msg-bot{justify-content:flex-start}
  .chatbot-bubble{padding:9px 13px;border-radius:12px;font-size:13px;line-height:1.55;max-width:82%}
  .chatbot-bubble-bot{background:rgba(255,255,255,0.06);color:#d1d5db;border-radius:4px 12px 12px 12px}
  .chatbot-bubble-user{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border-radius:12px 12px 4px 12px}
  .chatbot-typing{display:flex;align-items:center;gap:4px;padding:12px}
  .chatbot-typing span{width:7px;height:7px;border-radius:50%;background:#64748b;animation:typingDot 1.4s infinite}
  .chatbot-typing span:nth-child(2){animation-delay:0.2s}
  .chatbot-typing span:nth-child(3){animation-delay:0.4s}
  .chatbot-footer{display:flex;align-items:center;gap:8px;padding:10px 12px;border-top:1px solid rgba(255,255,255,0.07)}
  .chatbot-input{flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
    border-radius:10px;padding:9px 12px;color:#f1f5f9;font-size:13px;font-family:inherit;outline:none;transition:all 0.2s}
  .chatbot-input:focus{border-color:rgba(99,102,241,0.4);background:rgba(99,102,241,0.05)}
  .chatbot-input::placeholder{color:#374151}
  .chatbot-send{width:34px;height:34px;border-radius:8px;border:none;cursor:pointer;
    background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;font-size:16px;
    display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s}
  .chatbot-send:hover:not(:disabled){box-shadow:0 0 14px rgba(99,102,241,0.5)}
  .chatbot-send:disabled{opacity:0.4;cursor:not-allowed}

  /* Toast */
  .toast-wrap{position:fixed;bottom:90px;right:24px;z-index:3000;display:flex;flex-direction:column;gap:8px}
  .toast{background:#1e293b;border:1px solid rgba(255,255,255,0.1);border-radius:10px;
    padding:11px 16px;font-size:13px;font-weight:500;color:#f1f5f9;
    box-shadow:0 16px 40px rgba(0,0,0,0.4);display:flex;align-items:center;gap:9px;
    animation:slideInRight 0.3s ease,fadeOut 0.3s ease 2.7s forwards}

  /* Spinner */
  .spin{display:inline-block;width:16px;height:16px;border-radius:50%;
    border:2px solid rgba(255,255,255,0.2);border-top-color:white;animation:rotate 0.7s linear infinite}
  .load-center{display:flex;align-items:center;justify-content:center;padding:60px;gap:12px;color:#374151;font-size:14px}

  /* Login */
  .login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;
    padding:24px;position:relative;z-index:1}
  .login-card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.08);
    border-radius:20px;padding:44px;max-width:400px;width:100%;
    backdrop-filter:blur(20px);box-shadow:0 40px 80px rgba(0,0,0,0.5);
    animation:scaleIn 0.35s cubic-bezier(0.16,1,0.3,1)}
  .login-logo{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:6px}
  .login-logo-text{font-size:22px;font-weight:800;background:linear-gradient(135deg,#fff,#c7d2fe);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .login-headline{font-size:24px;font-weight:800;color:#f1f5f9;text-align:center;margin-bottom:6px;margin-top:20px}
  .login-sub{font-size:14px;color:#4b5563;text-align:center;margin-bottom:28px}
  .f-group{margin-bottom:14px}
  .f-label{display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.4px}
  .f-input{width:100%;padding:11px 14px;border-radius:10px;background:rgba(255,255,255,0.05);
    border:1px solid rgba(255,255,255,0.09);color:#f1f5f9;font-size:14.5px;font-family:inherit;outline:none;transition:all 0.2s}
  .f-input::placeholder{color:#374151}
  .f-input:focus{border-color:rgba(99,102,241,0.5);background:rgba(99,102,241,0.04);box-shadow:0 0 0 3px rgba(99,102,241,0.1)}
  .btn-login{width:100%;padding:13px;border-radius:10px;border:none;cursor:pointer;
    background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;font-size:14.5px;font-weight:700;
    font-family:inherit;box-shadow:0 0 28px rgba(99,102,241,0.4);transition:all 0.2s;margin-top:6px}
  .btn-login:hover{transform:translateY(-2px);box-shadow:0 0 40px rgba(99,102,241,0.6)}
  .btn-login:disabled{opacity:0.5;cursor:not-allowed;transform:none}
  .login-review{margin-top:28px}

  /* Keyframes */
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}
  @keyframes slideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideInRight{from{transform:translateX(120px);opacity:0}to{transform:translateX(0);opacity:1}}
  @keyframes fadeOut{from{opacity:1}to{opacity:0}}
  @keyframes rotate{to{transform:rotate(360deg)}}
  @keyframes sPulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(52,211,153,0.4)}50%{opacity:0.8;box-shadow:0 0 0 4px transparent}}
  @keyframes feedIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
  @keyframes typingDot{0%,80%,100%{transform:translateY(0);opacity:0.4}40%{transform:translateY(-4px);opacity:1}}
  @keyframes auroraRot{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes gd1{0%,100%{transform:translate(0,0)}33%{transform:translate(70px,-50px)}66%{transform:translate(-40px,60px)}}
  @keyframes gd2{0%,100%{transform:translate(0,0)}33%{transform:translate(-55px,70px)}66%{transform:translate(45px,-35px)}}
  @keyframes gd3{0%,100%{transform:translate(0,0)}50%{transform:translate(-20px,-20px)}}
`;

// âââ Main App âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
export default function App({ email: initialEmail = "" }: { email?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [loggedIn, setLoggedIn] = useState(!!initialEmail);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [nav, setNav] = useState<"overview"|"keys"|"analytics">("overview");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showCmd, setShowCmd] = useState(false);
  const [toast, setToast] = useState<{msg:string;icon:string}|null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  const [project, setProject] = useState<Project|null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsPoint[]>([]);
  const [totalCalls, setTotalCalls] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [avgLatency, setAvgLatency] = useState(0);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  const callsCounter = useCounter(totalCalls);
  const errorsCounter = useCounter(totalErrors);
  const latencyCounter = useCounter(avgLatency);
  const keysCounter = useCounter(keys.length);

  const showToast = useCallback((msg:string,icon="â")=>{
    if(toastTimer.current) clearTimeout(toastTimer.current);
    setToast({msg,icon});
    toastTimer.current = setTimeout(()=>setToast(null),3000);
  },[]);

  // âK shortcut
  useEffect(()=>{
    if(!loggedIn) return;
    const h=(e:KeyboardEvent)=>{
      if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();setShowCmd(p=>!p);}
    };
    window.addEventListener('keydown',h);
    return ()=>window.removeEventListener('keydown',h);
  },[loggedIn]);

  // Live activity feed (simulated)
  useEffect(()=>{
    if(!loggedIn) return;
    setActivity(Array.from({length:10},()=>genActivity()));
    const iv = setInterval(()=>{
      setActivity(p=>[genActivity(),...p].slice(0,25));
    }, 2200+Math.random()*1800);
    return ()=>clearInterval(iv);
  },[loggedIn]);

  // Load real data
  useEffect(()=>{
    if(!loggedIn) return;
    const load = async ()=>{
      setDataLoading(true);
      try {
        const pRes = await fetch("/api/projects");
        if(pRes.ok){ const ps:Project[]=await pRes.json(); if(ps.length) setProject(ps[0]); }
        const kRes = await fetch("/api/keys");
        if(kRes.ok){ const ks:ApiKey[]=await kRes.json(); setKeys(ks); }
        const aRes = await fetch("/api/analytics?days=7");
        if(aRes.ok){
          const pts:AnalyticsPoint[]=await aRes.json();
          setAnalytics(pts);
          const tc=pts.reduce((s,p)=>s+p.calls,0);
          const te=pts.reduce((s,p)=>s+p.errors,0);
          const al=pts.length?Math.round(pts.reduce((s,p)=>s+p.latency,0)/pts.length):0;
          setTotalCalls(tc); setTotalErrors(te); setAvgLatency(al);
        }
      } catch{}
      finally{ setDataLoading(false); }
    };
    load();
  },[loggedIn]);

  const handleLogin = async (e:React.FormEvent)=>{
    e.preventDefault();
    if(!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/projects",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim()})});
      if(res.ok){ setLoggedIn(true); showToast("Welcome to Harbor!","ð"); }
      else{ const d=await res.json(); showToast(d.error||"Something went wrong","â "); }
    } catch{ showToast("Network error","â "); }
    finally{ setLoading(false); }
  };

  const copyKey = useCallback((key:string)=>{
    navigator.clipboard.writeText(key).then(()=>showToast("API key copied!","ð"));
  },[showToast]);

  const revokeKey = useCallback(async (key:string)=>{
    try {
      await fetch("/api/keys",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key})});
      setKeys(p=>p.filter(k=>k.key!==key));
      showToast("Key revoked","ð");
    } catch{ showToast("Failed to revoke","â "); }
  },[showToast]);

  const createKey = useCallback(async ()=>{
    try {
      const res=await fetch("/api/keys",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({label:"New key"})});
      if(res.ok){ const k:ApiKey=await res.json(); setKeys(p=>[k,...p]); showToast("New API key created!","ð"); }
      else{ const d=await res.json(); showToast(d.error||"Failed to create key","â "); }
    } catch{ showToast("Network error","â "); }
  },[showToast]);

  const checkout = useCallback(async (plan:"pro"|"scale")=>{
    try {
      const res=await fetch("/api/stripe/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plan})});
      if(res.ok){ const{url}=await res.json(); window.location.href=url; }
      else showToast("Checkout error â try again","â ");
    } catch{ showToast("Network error","â "); }
  },[showToast]);

  const handleCmdAction = useCallback((action:string)=>{
    if(action.startsWith('nav:')) setNav(action.slice(4) as "overview"|"keys"|"analytics");
    else if(action==='create:key'){ setNav('keys'); createKey(); }
    else if(action==='upgrade') setShowUpgrade(true);
    else if(action==='docs') window.open('/docs','_blank');
    else if(action==='signout') setLoggedIn(false);
  },[createKey]);

  const plan = project?.plan ?? "free";
  const callLimit = plan==='scale'?Infinity:plan==='pro'?2_000_000:1_000;
  const callPct = callLimit===Infinity?8:Math.min((totalCalls/callLimit)*100,100);
  const sparkVals = analytics.length ? analytics.map(d=>d.calls) : [0,0,0,0,0,0,0];
  const errVals = analytics.length ? analytics.map(d=>d.errors) : [0,0,0,0,0,0,0];
  const latVals = analytics.length ? analytics.map(d=>d.latency) : [0,0,0,0,0,0,0];
  const successRate = totalCalls ? ((1-totalErrors/totalCalls)*100).toFixed(2) : "100.00";
  const emailInitial = email.charAt(0).toUpperCase();

  // ââ LOGIN âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  if(!loggedIn) return (
    <>
      <style>{CSS}</style>
      <div className="aurora">
        <div className="aurora-l1"/><div className="aurora-l2"/>
        <div className="aurora-g1"/><div className="aurora-g2"/><div className="aurora-g3"/>
      </div>
      <div className="grid-bg"/>
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-logo">
            <HarborLogo size={40}/>
            <span className="login-logo-text">Harbor</span>
          </div>
          <h1 className="login-headline">Welcome back</h1>
          <p className="login-sub">Sign in to your API gateway dashboard</p>
          <form onSubmit={handleLogin}>
            <div className="f-group">
              <label className="f-label">Email address</label>
              <input className="f-input" type="email" placeholder="you@company.com"
                value={email} onChange={e=>setEmail(e.target.value)} required/>
            </div>
            <button className="btn-login" type="submit" disabled={loading}>
              {loading ? <><span className="spin"/> Signing inâ¦</> : "Continue â"}
            </button>
          </form>
          <div className="login-review">
            <ReviewCarousel/>
          </div>
        </div>
      </div>
      {toast && <div className="toast-wrap"><div className="toast">{toast.icon} {toast.msg}</div></div>}
    </>
  );

  // ââ DASHBOARD ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  return (
    <>
      <style>{CSS}</style>
      <div className="aurora">
        <div className="aurora-l1"/><div className="aurora-l2"/>
        <div className="aurora-g1"/><div className="aurora-g2"/><div className="aurora-g3"/>
      </div>
      <div className="grid-bg"/>

      <div className="app-shell">
        {/* ââ Sidebar ââ */}
        <aside className="sidebar">
          <div className="sb-logo">
            <HarborLogo size={30}/>
            <span className="sb-logo-text">Harbor</span>
            <span className={`sb-logo-badge ${plan==='free'?'chip-free':plan==='pro'?'chip-pro':'chip-scale'}`}>
              {plan}
            </span>
          </div>

          <div className="sb-section">
            <div className="sb-section-label">Main</div>
            {([
              {id:'overview',icon:'â¬¡',label:'Overview'},
              {id:'keys',icon:ã²¬¡',label:'API Keys',count:keys.length},
              {id:'analytics',icon:ã²¬¡',label:'Analytics'},
            ] as {id:string;icon:string;label:string;count?:number}[]).map(item=>(
              <button key={item.id} className={`nav-item${nav===item.id?' active':''}`}
                onClick={()=>setNav(item.id as "overview"|"keys"|"analytics")}>
                <span className="nav-icon">
                  {item.id==='overview'?'ð':item.id==='keys'?'ð':'ð'}
                </span>
                {item.label}
                {item.count!==undefined && item.count>0 && (
                  <span className="nav-badge">{item.count}</span>
                )}
              </button>
            ))}
          </div>

          <div className="sb-section">
            <div className="sb-sectiction-label">Resources</div>
            <a className="nav-item" href="/docs" target="_blank" style={{textDecoration:'none'}}>
              <span className="nav-icon">ð</span>
              Documentation
            </a>
            <button className="nav-item" onClick={()=>setShowUpgrade(true)}>
              <span className="nav-icon">â¬</span>
              Upgrade Plan
            </button>
          </div>

          {/* Sidebar bottom */}
          <div className="sb-bottom">
            {/* Usage bar */}
            <div style={{padding:'10px 8px 12px',borderBottom:'1px solid rgba(255,255,255,0.05)',marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:11,color:'#374151',fontWeight:600}}>API Usage</span>
                <span style={{fontSize:11,color:'#6366f1',fontWeight:600}}>
                  {callLimit===Infinity?'â':`${Math.round(callPct)}%`}
                </span>
              </div>
              <div className="usage-track">
                <div className="usage-fill" style={{width:`${callPct}%`,background:'linear-gradient(90deg,#6366f1,#8b5cf6)'}}/>
              </div>
              <div style={{marginTop:4,fontSize:10,color:'#1f2937'}}>
                {totalCalls.toLocaleString()} / {callLimit===Infinity?'â':callLimit.toLocaleString()}
              </div>
            </div>
            <div className="sb-user" onClick={()=>setLoggedIn(false)} title="Sign out">
              <div className="sb-avatar">{emailInitial}</div>
              <div className="sb-user-info">
                <div className="sb-email">{email}</div>
                <div className="sb-plan">{plan} plan</div>
              </div>
              <button className="sb-out">â</button>
            </div>
          </div>
        </aside>

        {/* ââ Content ââ */}
        <div className="content-area">
          {/* Status bar */}
          <div className="status-bar">
            <span><span className="s-dot"/>All systems operational</span>
            <span className="s-sep">Â·</span>
            <span>99.98% uptime</span>
            <span className="s-sep">Â·</span>
            <span>API p50 &lt;12ms</span>
            <span className="s-sep">Â·</span>
            <span>3 regions active</span>
          </div>

          {/* Top bar */}
          <div className="topbar">
            <div className="topbar-search" onClick={()=>setShowCmd(true)}>
              <span style={{fontSize:14,color:'#374151'}}>â</span>
              <span className="topbar-search-text">Search or run a commandâ¦</span>
              <span className="topbar-kbd">
                <span className="t-kbd">â</span><span className="t-kbd">K</span>
              </span>
            </div>
            <div className="topbar-right">
              <button className="topbar-icon-btn" title="Notifications">ð</button>
              <button className="topbar-icon-btn" title="Settings">â</button>
              {plan==='free' && (
                <button className="upgrade-btn" onClick={()=>setShowUpgrade(true)}>
                  Upgrade â¦
                </button>
              )}
              <span className={`plan-chip ${plan==='free'?'chip-free':plan==='pro'?'chip-pro':'chip-scale'}`}>
                {plan}
              </span>
            </div>
          </div>

          {/* Page content */}
          <div className="page-scroll">
            {/* OVERVIEW */}
            {nav==='overview' && (
              <>
                <div className="page-header">
                  <div>
                    <div className="page-title-row">
                      <h1 className="page-title">{project?.name ?? "Your API Gateway"}</h1>
                      <div className="live-pill"><span className="live-dot"/>Live</div>
                    </div>
                    <p className="page-sub">{email} Â· Dashboard</p>
                  </div>
                </div>

                {/* Metric cards */}
                {dataLoading ? (
                  <div className="load-center"><span className="spin"/> Loading analyticsâ¦</div>
                ) : (
                  <div className="metrics-grid">
                    <div className="m-card">
                      <div className="m-top">
                        <div className="m-icon" style={{background:'rgba(99,102,241,0.15)'}}>ð¡</div>
                        <span className="m-trend tr-blue">7d</span>
                      </div>
                      <div className="m-value">{callsCounter.toLocaleString()}</div>
                      <div className="m-label">API Calls This Month</div>
                      <div className="m-spark"><Sparkline vals={sparkVals} color="#6366f1"/></div>
                    </div>
                    <div className="m-card">
                      <div className="m-top">
                        <div className="m-icon" style={{background:'rgba(16,185,129,0.12)'}}>â</div>
                        <span className="m-trend tr-green">â Good</span>
                      </div>
                      <div className="m-value" style={{color:'#34d399'}}>{successRate}%</div>
                      <div className="m-label">Success Rate</div>
                      <div className="m-spark"><Sparkline vals={errVals.map(v=>100-(v||0))} color="#34d399"/></div>
                    </div>
                    <div className="m-card">
                      <div className="m-top">
                        <div className="m-icon" style={{background:'rgba(245,158,11,0.12)'}}>â¡</div>
                        <span className="m-trend tr-amber">Fast</span>
                      </div>
                      <div className="m-value">
                        {latencyCounter}<span style={{fontSize:14,color:'#374151',fontWeight:400}}>ms</span>
                      </div>
                      <div className="m-label">Avg Latency</div>
                      <div className="m-spark"><Sparkline vals={latVals} color="#f59e0b"/></div>
                    </div>
                    <div className="m-card">
                      <div className="m-top">
                        <div className="m-icon" style={{background:'rgba(99,102,241,0.12)'}}>ð</div>
                        <span className="m-trend tr-blue">Active</span>
                      </div>
                      <div className="m-value">{keysCounter}</div>
                      <div className="m-label">API Keys</div>
                      <div className="m-spark"><Sparkline vals={[0,0,keys.length,keys.length,keys.length,keys.length,keys.length]} color="#6366f1"/></div>
                    </div>
                  </div>
                )}

                {/* Chart + Info */}
                <div className="two-col">
                  <div className="panel">
                    <div className="panel-header">
                      <span className="panel-title">API Traffic â Last 7 Days</span>
                      <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#4b5563'}}>
                        <span style={{width:8,height:8,borderRadius:2,background:'#6366f1',display:'inline-block'}}/>
                        Calls
                      </div>
                    </div>
                    <div className="panel-body">
                      <div className="chart-wrap">
                        <LineChart data={analytics.length ? analytics : Array.from({length:7},(_,i)=>({
                          date:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
                          calls:0, errors:0, latency:0
                        }))}/>
                      </div>
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-header">
                      <span className="panel-title">Gateway Info</span>
                    </div>
                    <div className="info-row">
                      <span className="i-label">Plan</span>
                      <span className={`i-val ${plan==='free'?'':'i-val-accent'}`} style={plan==='scale'?{color:'#fcd34d'}:{}}>
                        {plan==='free'?'Free':plan==='pro'?'Pro â¦':'Scale â'}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="i-label">Call limit</span>
                      <span className="i-val">
                        {plan==='scale'?'Unlimited':plan==='pro'?'2M / mo':'1K / mo'}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="i-label">Projects</span>
                      <span className="i-val">{plan==='scale'?'â':plan==='pro'?'10':'1'}</span>
                    </div>
                    <div className="info-row">
                      <span className="i-label">Analytics</span>
                      <span className="i-val">{plan==='scale'?'365d':plan==='pro'?'90d':'30d'}</span>
                    </div>
                    <div className="info-row">
                      <span className="i-label">Uptime</span>
                      <span className="i-val i-val-green">99.98%</span>
                    </div>
                    <div className="info-row">
                      <span className="i-label">Region</span>
                      <span className="i-val" style={{fontFamily:'JetBrains Mono, monospace',fontSize:11}}>us-east-1</span>
                    </div>
                  </div>
                </div>

                {/* Live activity feed */}
                <div className="panel" style={{marginBottom:12}}>
                  <div className="panel-header">
                    <span className="panel-title">Live API Activity</span>
                    <div className="live-pill" style={{fontSize:10}}>
                      <span className="live-dot"/>Streaming
                    </div>
                  </div>
                  <div className="feed-wrap">
                    {activity.map(a=>(
                      <div key={a.id} className="feed-row">
                        <span className={`method-badge m-${a.method}`}>{a.method}</span>
                        <span className="feed-path">{a.path}</span>
                        <span className={a.status<400?'feed-status-ok':'feed-status-err'}>{a.status}</span>
                        <span className="feed-lat">{a.latency}ms</span>
                        <span className="feed-region">{a.region}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews */}
                <div className="two-col" style={{marginBottom:12}}>
                  <ReviewCarousel/>
                  {/* Upgrade strip */}
                  {plan==='free' && (
                    <div className="upgrade-strip" style={{flexDirection:'column',alignItems:'flex-start'}}>
                      <div className="upgrade-strip-label">ð Level up</div>
                      <div className="upgrade-strip-title">Unlock Harbor Pro</div>
                      <div className="upgrade-strip-sub" style={{marginBottom:14}}>2M calls/mo, 10 projects, 90-day analytics, priority support.</div>
                      <button className="upgrade-strip-btn" onClick={()=>setShowUpgrade(true)}>
                        View Plans â
                      </button>
                    </div>
                  )}
                </>
            )}

            {/* KEYS */}
            {nav==='keys' && (
              <>
                <div className="page-header">
                  <div>
                    <div className="page-title-row">
                      <h1 className="page-title">API Keys</h1>
                    </div>
                    <p className="page-sub">Manage authentication keys for your projects</p>
                  </div>
                </div>
                <div className="panel">
                  <div className="keys-toolbar">
                    <span style={{fontSize:13,color:'#374151'}}>
                      {keys.length} {keys.length===1?'key':'keys'} total
                    </span>
                    <button className="new-key-btn" onClick={createKey}>
                      <span>+</span> New Key
                    </button>
                  </div>
                  {keys.length===0 ? (
                    <div className="empty-keys">
                      <div className="empty-icon">ð</div>
                      <div className="empty-title">No API keys yet</div>
                      <div className="empty-sub">Create your first key to start making authenticated requests.</div>
                    </div>
                  ) : (
                    <div>
                      {/* Header row */}
                      <div style={{display:'grid',gridTemplateColumns:'1fr auto auto auto',gap:14,padding:'8px 18px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                        {['Key','Created','Status','Actions'].map((h,i)=>(
                          <span key={h} style={{fontSize:11,fontWeight:700,color:'#1f2937',textTransform:'uppercase',letterSpacing:'0.7px',textAlign:i>1?'right' as const:'left' as const}}>{h}</span>
                        ))}
                      </div>
                      {keys.map(k=>(
                        <div key={k.key} className="key-row">
                          <div className="key-mono">
                            <span className="key-led"/>
                            {k.key.slice(0,8)}â¦{k.key.slice(-6)}
                          </div>
                          <span className="key-date">{new Date(k.createdAt).toLocaleDateString()}</span>
                          <span style={{fontSize:12,color:k.active?'#34d399':'#4b5563',fontWeight:600,textAlign:'right' as const}}>
                            {k.active?'Active':'Inactive'}
                          </span>
                          <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                            <button className="a-btn a-copy" title="Copy" onClick={()=>copyKey(k.key)}>ð</button>
                            <button className="a-btn a-rev" title="Revoke" onClick={()=>revokeKey(k.key)}>ð</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
            )}

            {/* ANALYTICS */}
            {nav==='analytics' && (
              <>
                <div className="page-header">
                  <div>
                    <div className="page-title-row">
                      <h1 className="page-title">Analytics</h1>
                      <div className="live-pill"><span className="live-dot"/>Live</div>
                    </div>
                    <p className=" </div>
                    <p className="page-sub">Last 7 days performance Â· {plan} plan</p>
                  </div>
                </div>
                <div className="a-cards-grid">
                  <div className="a-card">
                    <div className="a-card-label">Total Calls</div>
                    <div className="a-card-value">{totalCalls.toLocaleString()}</div>
                    <div className="a-card-sub">This month</div>
                  </div>
                  <div className="a-card">
                    <div className="a-card-label">Success Rate</div>
                    <div className="a-card-value" style={{color:'#34d399'}}>{successRate}%</div>
                    <div className="a-card-sub">{totalErrors} errors</div>
                  </div>
                  <div className="a-card">
                    <div className="a-card-label">Avg Latency</div>
                    <div className="a-card-value" style={{color:'#f59e0b'}}>{avgLatency}ms</div>
                    <div className="a-card-sub">p50 across all regions</div>
                  </div>
                </div>
                <div className="panel" style={{marginBottom:14}}>
                  <div className="panel-header">
                    <span className="panel-title">API Calls â Last 7 Days</span>
                  </div>
                  <div className="panel-body">
                    <div style={{height:200}}>
                      <LineChart data={analytics.length?analytics:Array.from({length:7},(_,i)=>({
                        date:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],calls:0,errors:0,latency:0
                      }))}/>
                    </div>
                  </div>
                </div>
                <div className="panel">
                  <div className="panel-huader">
                    <span className="panel-title">Usage vs Limit</span>
                  </div>
                  <div className="panel-body">
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                      <span style={{fontSize:14,color:'#94a3b8'}}>{totalCalls.toLocaleString()} used</span>
                      <span style={{fontSize:14,color:'#374151'}}>{callLimit===Infinity?'Unlimited':`${callLimit.toLocaleString()} limit`}</span>
                    </div>
                    <div className="usage-track" style={{height:10,borderRadius:5}}>
                      <div className="usage-fill" style={{width:`${callPct}%`,background:'linear-gradient(90deg,#6366f1,#8b5cf6)'}}/>
                    </div>
                    <div style={{marginTop:12,fontSize:12,color:'#374151'}}>
                      Analytics retained for {plan==='scale'?'365':plan==='pro'?'90':'30'} days on the {plan} plan.
                      {plan==='free' && (
                        <button style={{marginLeft:8,fontSize:12,color:'#6366f1',background:'none',border:'none',cursor:'pointer',fontWeight:600}}
                          onClick={()=>setShowUpgrade(true)}>Upgrade!Ü[ÜH8¡¤Ø]Û
_BÙ]Ù]Ù]Ï
_BÙ]Ù]Ù]ËÊ\ÜYH[Ù[
ßBÜÚÝÕ\ÜYH	
]Û\ÜÓ[YOH[Ù[XXÚÙÜÛÛXÚÏ^ÙOOÚYK\Ù]OOYKÝ\[\Ù]
\Ù]ÚÝÕ\ÜYJ[ÙJNß_O]Û\ÜÓ[YOH[Ù[XÞ]ÛÛ\ÜÓ[YOH[Ù[^ÛÛXÚÏ^Ê
OOÙ]ÚÝÕ\ÜYJ[ÙJ_O¸§%OØ]ÛÛ\ÜÓ[YOH[Ù[ZØØ[HÚ]Ý][Z]ÏÚÛ\ÜÓ[YOH[Ù[\ÝXÚ[
È[Ú[Y\[ÈX[\ÈÚ\[ÈT\ÈÛ\ÜÜËÊ]Y]ÜÈ[[Ù[
ßB]Û\ÜÓ[YOH[Ù[\]Y]ÜÈ]Y]ÐØ\Ýusel/>
            </div>

            <div className="plan-grid">
              <div className="plan-box plan-box-pro">
                <div className="plan-name plan-name-pro">Pro</div>
                <div className="plan-price">$49<span className="plan-period">/mo</span></div>
                <ul className="plan-feats">
                  {["2M API calls / month","10 projects","90-day analytics","Priority support","Custom rate limits"].map(f=>(
                    <li key={f} className="plan-feat"><span className="feat-check">â</span>{f}</li>
                  ))}
                </ul>
                <button className="plan-cta plan-cta-pro" onClick={()=>checkout("pro")}>Get Pro â</button>
              </div>
              <div className="plan-box plan-box-scale">
                <div style={{position:'absolute',top:12,right:12,fontSize:10,fontWeight:700,
                  color:'#d97706',background:'rgba(245,158,11,0.15)',padding:'2px 8px',borderRadius:4,textTransform:'uppercase',letterSpacing:'0.5px'}}>
                  Most Popular
                </div>
                <div className="plan-name plan-name-scale">Scale</div>
                <div className="plan-price">$299<span className="plan-period">/mo</span></div>
                <ul className="plan-feats">
                  {["Unlimited API calls","Unlimited projects","365-day analytics","Dedicated support","SLA guarantee","Advanced monitoring","White-label options"].map(f=>(
                    <li key={f} className="plan-feat"><span className="feat-check">â</span>{f}</li>
                  ))}
                </ul>
                <button className="plan-cta plan-cta-scale" onClick={()=>checkout("scale")}>Get Scale â</button>
              </div>
            </div>
            <p style={{textAlign:'center',fontSize:12,color:'#374151'}}>
              Cancel anytime Â· Instant activation Â· Stripe-secured payments
            </p>
          </div>
        </div>
      )}

      {/* Command Palette */}
      {showCmd && (
        <CommandPalette onClose={()=>setShowCmd(false)} onAction={handleCmdAction}/>
      )}

      {/* Toast */}
      {toast && <div className="toast-wrap"><div className="toast">{toast.icon} {toast.msg}</div></div>}

      {/* Chat bot */}
      <ChatBot/>
    </>
  );
}
