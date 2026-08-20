import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useAnalyzeThreat, useGetAnalysisHistory, useGetDashboardSummary, useHealthCheck } from '@workspace/api-client-react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileSearch,
  Fingerprint,
  Gauge,
  Globe2,
  Info,
  LayoutDashboard,
  LifeBuoy,
  LoaderCircle,
  Mail,
  Menu,
  MessageSquareText,
  Network,
  PanelLeft,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  TerminalSquare,
  TextCursorInput,
  X,
  Zap,
} from 'lucide-react';
import { Link, Route, Switch, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
type ScanType = 'text' | 'url' | 'email';
type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

const navItems = [
  { href: '/scanner', label: 'Scanner', icon: FileSearch },
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/history', label: 'History', icon: Clock3 },
];

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
};

const labelForType = (type?: string) => type === 'url' ? 'URL' : type === 'email' ? 'Email' : 'Text';
const levelForScore = (score: number): RiskLevel => score >= 86 ? 'critical' : score >= 66 ? 'high' : score >= 41 ? 'medium' : score >= 16 ? 'low' : 'safe';

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" data-testid="link-brand">
      <span className="relative grid size-9 place-items-center rounded-[10px] bg-slate-950 text-teal-300 shadow-lg shadow-slate-950/10">
        <Shield size={19} strokeWidth={2.3} />
        <span className="absolute bottom-[7px] h-[3px] w-[3px] rounded-full bg-amber-400" />
      </span>
      {!compact && <span className="text-[1.05rem] font-extrabold tracking-[-.04em] text-slate-950">shield<span className="text-teal-600">ai</span></span>}
    </Link>
  );
}

function RiskPill({ severity, label }: { severity?: string; label?: string }) {
  const level = (severity || 'safe').toLowerCase() as RiskLevel;
  return <span className={`status-${level} inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.1em]`} data-testid={`status-risk-${level}`}>
    <span className="size-1.5 rounded-full bg-current" />{label || level}
  </span>;
}

function ScoreRing({ score }: { score: number }) {
  const level = levelForScore(score);
  return (
    <div className="relative grid size-36 place-items-center rounded-full" style={{ background: `conic-gradient(var(--ring-color), ${score * 3.6}deg, hsl(210 26% 91%) ${score * 3.6}deg)` }} data-testid="display-risk-score">
      <div className="grid size-[118px] place-items-center rounded-full bg-white">
        <div className="text-center">
          <div className="mono text-4xl font-medium tracking-[-.1em] text-slate-950">{score}</div>
          <div className="eyebrow mt-1">risk score</div>
        </div>
      </div>
      <style>{`:root { --ring-color: ${level === 'critical' || level === 'high' ? 'hsl(8 76% 49%)' : level === 'medium' ? 'hsl(39 88% 49%)' : 'hsl(186 84% 36%)'}; }`}</style>
    </div>
  );
}

function MetricCard({ label, value, note, accent, icon: Icon }: { label: string; value: string | number; note: string; accent: string; icon: typeof Gauge }) {
  return <div className="panel animate-rise relative overflow-hidden rounded-2xl p-5">
    <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
    <div className="mb-6 flex items-start justify-between">
      <span className="eyebrow">{label}</span>
      <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-500"><Icon size={16} /></span>
    </div>
    <div className="mono text-3xl font-medium tracking-[-.08em] text-slate-900" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}>{value}</div>
    <p className="mt-2 text-xs text-slate-500">{note}</p>
  </div>;
}

function PublicNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="relative z-10 border-b border-slate-200/80 bg-[#f1f5f7]/85 backdrop-blur-md">
    <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-4 lg:px-8">
      <Logo />
      <nav className="hidden items-center gap-1 md:flex">
        {[['/features', 'Capabilities'], ['/about', 'Why ShieldAI'], ['/docs', 'Docs']].map(([href, label]) => <Link key={href} href={href} className="nav-link rounded-lg px-3 py-2 text-sm font-semibold text-slate-600" data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</Link>)}
      </nav>
      <div className="hidden items-center gap-4 md:flex">
        <Link href="/dashboard" className="text-sm font-bold text-slate-600 hover:text-teal-700" data-testid="link-nav-dashboard">View workspace</Link>
        <Link href="/scanner" className="btn-primary px-4 py-2.5 text-sm" data-testid="link-nav-scan">Analyze now <ArrowRight size={15} /></Link>
      </div>
      <button className="grid size-10 place-items-center rounded-lg bg-white text-slate-700 md:hidden" onClick={() => setMenuOpen((value) => !value)} data-testid="button-toggle-menu" aria-label="Toggle navigation">
        {menuOpen ? <X size={19} /> : <Menu size={19} />}
      </button>
    </div>
    {menuOpen && <div className="border-t border-slate-200 bg-[#f1f5f7] px-5 py-4 md:hidden">
      <div className="flex flex-col gap-1">
        <Link href="/features" className="nav-link rounded-lg px-3 py-3 text-sm font-semibold" data-testid="link-mobile-features">Capabilities</Link>
        <Link href="/about" className="nav-link rounded-lg px-3 py-3 text-sm font-semibold" data-testid="link-mobile-about">Why ShieldAI</Link>
        <Link href="/docs" className="nav-link rounded-lg px-3 py-3 text-sm font-semibold" data-testid="link-mobile-docs">Docs</Link>
        <Link href="/scanner" className="btn-primary mt-2 px-4 py-3 text-sm" data-testid="link-mobile-scan">Open scanner <ArrowRight size={15} /></Link>
      </div>
    </div>}
  </header>;
}

function WorkspaceShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck({ query: { queryKey: ['/api/healthz'], staleTime: 30000 } });
  const [railOpen, setRailOpen] = useState(false);
  const active = (href: string) => location === href;
  return <div className="app-shell noise bg-[#edf3f5]">
    <div className="flex min-h-[100dvh]">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-[244px] flex-col border-r border-slate-200 bg-[#f7fafb] px-4 py-5 transition-transform duration-300 md:sticky md:top-0 md:translate-x-0 ${railOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-9 flex items-center justify-between px-2"><Logo /><button className="text-slate-400 md:hidden" onClick={() => setRailOpen(false)} data-testid="button-close-rail"><X size={18} /></button></div>
        <div className="px-2"><div className="eyebrow mb-3">Workspace</div>
          <nav className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setRailOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${active(href) ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/10' : 'nav-link text-slate-600'}`} data-testid={`link-rail-${label.toLowerCase()}`}>
              <Icon size={17} strokeWidth={active(href) ? 2.2 : 1.8} /><span>{label}</span>{active(href) && <span className="ml-auto size-1.5 rounded-full bg-amber-400" />}
            </Link>)}
          </nav>
        </div>
        <div className="mt-auto space-y-4">
          <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-teal-800"><Sparkles size={15} /><span className="text-xs font-extrabold">Analyst tip</span></div>
            <p className="text-xs leading-5 text-teal-900/70">Start with the explanation, then verify the indicator that drove the score.</p>
            <Link href="/docs" className="mt-3 inline-flex items-center gap-1 text-[11px] font-extrabold text-teal-700" data-testid="link-rail-docs">Read methodology <ArrowRight size={12} /></Link>
          </div>
          <div className="flex items-center gap-2 px-2 text-[11px] text-slate-500"><span className={`size-2 rounded-full ${health ? 'bg-emerald-500' : 'bg-amber-400'}`} /> Analysis engine {health ? 'operational' : 'connecting'}</div>
        </div>
      </aside>
      {railOpen && <button className="fixed inset-0 z-20 bg-slate-950/20 md:hidden" onClick={() => setRailOpen(false)} data-testid="button-dismiss-rail" aria-label="Close navigation" />}
      <main className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-[#edf3f5]/90 px-5 py-4 backdrop-blur md:hidden">
          <button className="grid size-9 place-items-center rounded-lg bg-white text-slate-700" onClick={() => setRailOpen(true)} data-testid="button-open-rail" aria-label="Open navigation"><PanelLeft size={18} /></button>
          <Logo compact />
          <Link href="/scanner" className="grid size-9 place-items-center rounded-lg bg-slate-950 text-teal-300" data-testid="link-mobile-quick-scan"><Zap size={16} /></Link>
        </div>
        {children}
      </main>
    </div>
  </div>;
}

function Home() {
  return <div className="min-h-[100dvh] bg-[#edf3f5]">
    <PublicNav />
    <main>
      <section className="scan-grid relative overflow-hidden">
        <div className="mx-auto grid max-w-[1240px] gap-16 px-5 pb-20 pt-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-28 lg:pt-28">
          <div className="animate-rise self-center">
            <div className="eyebrow mb-6 flex items-center gap-2 text-teal-700"><span className="size-1.5 rounded-full bg-amber-400" /> Security analysis for the moment before you click</div>
            <h1 className="max-w-[720px] text-5xl font-extrabold leading-[.98] tracking-[-.075em] text-slate-950 sm:text-7xl">Make the call.<br /><span className="text-teal-700">Know why.</span></h1>
            <p className="mt-7 max-w-[560px] text-base leading-7 text-slate-600 sm:text-lg">ShieldAI turns suspicious messages, emails, and URLs into a clear risk decision with evidence you can act on.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/scanner" className="btn-primary px-5 py-3.5 text-sm" data-testid="link-home-start">Start an analysis <ArrowRight size={16} /></Link>
              <Link href="/docs" className="btn-secondary px-5 py-3.5 text-sm" data-testid="link-home-methodology">See how it works <BookOpen size={16} /></Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-xs font-bold text-slate-500"><span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-teal-600" /> Explainable signals</span><span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-teal-600" /> No security jargon</span><span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-teal-600" /> Built for fast triage</span></div>
          </div>
          <div className="animate-rise animate-rise-2 relative self-center">
            <div className="absolute -right-4 -top-8 size-28 rounded-full border border-amber-300/70 bg-amber-100/70 blur-[1px]" />
            <div className="panel relative overflow-hidden rounded-[26px] border-slate-300/80 bg-slate-950 p-2 shadow-2xl shadow-slate-950/15">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-400" /><span className="mono text-[10px] uppercase tracking-[.16em] text-slate-400">live analysis / 00482</span></div><span className="mono text-[10px] text-slate-500">shieldai.engine</span></div>
              <div className="grid gap-4 p-4 sm:grid-cols-[.84fr_1.16fr]">
                <div className="rounded-xl border border-white/10 bg-white/[.04] p-4"><div className="eyebrow text-slate-500">message sample</div><p className="mt-5 text-sm leading-6 text-slate-300">Your invoice is ready. Review the attached document and confirm payment details within 24 hours.</p><div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4"><Mail size={14} className="text-teal-300" /><span className="mono truncate text-[10px] text-slate-500">billing@vendor-portal.co</span></div></div>
                <div className="rounded-xl border border-amber-300/20 bg-amber-300/[.06] p-4"><div className="flex items-center justify-between"><span className="eyebrow text-amber-300/70">risk assessment</span><span className="mono text-xs text-amber-300">82 / 100</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[82%] rounded-full bg-amber-400" /></div><div className="mt-5 flex items-center gap-3"><AlertTriangle size={20} className="text-amber-300" /><div><div className="text-sm font-extrabold text-white">Likely phishing</div><div className="mt-1 text-xs text-slate-400">3 indicators need attention</div></div></div><div className="mt-5 space-y-2 text-xs text-slate-300"><div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-rose-400" /> Urgency language</div><div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-amber-400" /> Sender mismatch</div><div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-amber-400" /> Payment request</div></div></div>
              </div>
              <div className="flex items-center justify-between px-4 pb-4 pt-1"><span className="mono text-[10px] text-slate-500">decision confidence 94.1%</span><span className="flex items-center gap-1 text-[10px] font-bold text-teal-300"><Fingerprint size={13} /> evidence-linked</span></div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1240px] px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]"><div><div className="eyebrow text-teal-700">A calmer security posture</div><h2 className="mt-4 max-w-md text-3xl font-extrabold leading-tight tracking-[-.06em] text-slate-950 sm:text-4xl">Signal over spectacle.</h2></div><div className="grid gap-4 sm:grid-cols-3"><FeatureCard number="01" icon={Gauge} title="One score" text="A single risk score gives your first decision a place to start." /><FeatureCard number="02" icon={Fingerprint} title="The evidence" text="See the exact indicators behind the classification, not a black box." /><FeatureCard number="03" icon={ClipboardCheck} title="Next action" text="Recommendations turn a warning into a practical response." /></div></div>
      </section>
      <section className="border-y border-slate-200 bg-[#dce9ec]"><div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8"><div><div className="eyebrow text-teal-800">Start with what you have</div><h2 className="mt-3 text-3xl font-extrabold tracking-[-.05em] text-slate-950">A URL. A message. An email thread.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Paste the thing that made you pause. ShieldAI keeps the context intact while it maps the indicators that matter.</p></div><Link href="/scanner" className="btn-primary px-5 py-3.5 text-sm" data-testid="link-home-bottom-cta">Open the scanner <ArrowRight size={16} /></Link></div></section>
    </main>
    <Footer />
  </div>;
}

function FeatureCard({ number, icon: Icon, title, text }: { number: string; icon: typeof Gauge; title: string; text: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-transform duration-200 hover:-translate-y-1"><div className="flex items-center justify-between"><span className="mono text-xs text-teal-700">{number}</span><Icon size={18} className="text-slate-400" /></div><h3 className="mt-8 font-extrabold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>;
}

function Footer() {
  return <footer className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8"><Logo /><div className="flex gap-5"><Link href="/about" className="hover:text-teal-700" data-testid="link-footer-about">About</Link><Link href="/docs" className="hover:text-teal-700" data-testid="link-footer-docs">Docs</Link><Link href="/scanner" className="hover:text-teal-700" data-testid="link-footer-scanner">Scanner</Link></div><span className="mono">SHIELD / 2025</span></footer>;
}

function WorkspaceHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="eyebrow text-teal-700">{eyebrow}</div><h1 className="mt-2 text-3xl font-extrabold tracking-[-.06em] text-slate-950 sm:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}</div>{action}</div>;
}

function Scanner() {
  const queryClient = useQueryClient();
  const analyze = useAnalyzeThreat();
  const [type, setType] = useState<ScanType>('text');
  const [content, setContent] = useState('');
  const [result, setResult] = useState<Awaited<ReturnType<typeof analyzeThreatShape>> | null>(null);

  const submit = () => {
    if (!content.trim() || analyze.isPending) return;
    analyze.mutate({ data: { content: content.trim(), type } }, {
      onSuccess: (data) => {
        setResult(data);
        void queryClient.invalidateQueries({ queryKey: ['/api/history'] });
        void queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      },
    });
  };
  const example = type === 'url' ? 'https://account-verify.example.com/login?session=reset' : type === 'email' ? 'From: accounts@vendor-portal.co\nSubject: Action required: invoice payment failed\n\nYour payment could not be processed. Review the attached invoice and confirm your details within 24 hours.' : 'Your account has been selected for a security upgrade. Verify your identity now to avoid service interruption.';
  const typeOptions: { id: ScanType; label: string; icon: typeof TextCursorInput }[] = [{ id: 'text', label: 'Message', icon: MessageSquareText }, { id: 'url', label: 'URL', icon: Globe2 }, { id: 'email', label: 'Email', icon: Mail }];
  return <WorkspaceShell><div className="mx-auto max-w-[1280px] px-5 py-8 lg:px-9 lg:py-10">
    <WorkspaceHeader eyebrow="Triage / new analysis" title="What made you pause?" description="Paste suspicious content below. ShieldAI will score the risk and show the evidence behind the decision." action={<div className="flex items-center gap-2 text-xs text-slate-500"><span className="size-2 rounded-full bg-emerald-500" /> Private workspace</div>} />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,.95fr)_minmax(390px,1.05fr)]">
      <section className="panel animate-rise rounded-2xl p-5 sm:p-7">
        <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Analysis type">{typeOptions.map(({ id, label, icon: Icon }) => <button key={id} role="tab" aria-selected={type === id} onClick={() => { setType(id); setResult(null); }} className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-extrabold transition-colors ${type === id ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`} data-testid={`button-type-${id}`}><Icon size={14} />{label}</button>)}</div>
        <div className="mb-3 flex items-center justify-between"><label className="eyebrow text-slate-600" htmlFor="scan-content">{type === 'url' ? 'Suspicious URL' : type === 'email' ? 'Email content' : 'Message content'}</label><span className="mono text-[10px] text-slate-400">{content.length.toLocaleString()} / 20,000</span></div>
        <textarea id="scan-content" value={content} onChange={(event) => setContent(event.target.value)} placeholder={example} maxLength={20000} className="min-h-[270px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10" data-testid="input-scan-content" />
        {analyze.isError && <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700" data-testid="status-scan-error"><AlertTriangle size={15} className="mt-0.5 shrink-0" /><span>We couldn't analyze that content right now. Check the input and try again.</span></div>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><button onClick={() => { setContent(''); setResult(null); analyze.reset(); }} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900" data-testid="button-clear-scan"><X size={14} /> Clear</button><button onClick={submit} disabled={!content.trim() || analyze.isPending} className="btn-primary min-w-[156px] px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-submit-scan">{analyze.isPending ? <><LoaderCircle size={16} className="animate-spin" /> Reading signals</> : <><Search size={16} /> Analyze content</>}</button></div>
        <div className="mt-7 border-t border-slate-100 pt-5"><div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-slate-700"><Zap size={14} className="text-amber-500" /> Try a sample</div><div className="flex flex-wrap gap-2"><button onClick={() => setContent(example)} className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-left text-[11px] font-semibold text-slate-500 hover:border-teal-400 hover:text-teal-700" data-testid="button-use-sample">Load sample {labelForType(type).toLowerCase()}</button></div></div>
      </section>
      <ResultPanel result={result} isPending={analyze.isPending} />
    </div>
  </div></WorkspaceShell>;
}

type ResultShape = { id: string; riskScore: number; severity: string; classification: string; indicators: { label: string; detail: string; severity: string }[]; explanation: string; recommendations: string[]; type: string; createdAt: string };
const analyzeThreatShape = () => ({}) as ResultShape;

function ResultPanel({ result, isPending }: { result: ResultShape | null; isPending: boolean }) {
  if (isPending) return <div className="panel animate-rise rounded-2xl p-7"><div className="eyebrow">Assessment in progress</div><div className="mt-8 space-y-4"><div className="h-4 w-2/5 animate-pulse rounded bg-slate-200" /><div className="h-32 animate-pulse rounded-2xl bg-slate-100" /><div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" /><div className="h-4 w-3/5 animate-pulse rounded bg-slate-200" /></div><p className="mt-8 mono text-[10px] uppercase tracking-[.13em] text-teal-700 pulse-line">mapping observable indicators...</p></div>;
  if (!result) return <div className="panel scan-grid flex min-h-[440px] animate-rise animate-rise-1 flex-col items-center justify-center rounded-2xl p-8 text-center"><span className="mb-5 grid size-16 place-items-center rounded-2xl bg-slate-950 text-teal-300 shadow-xl shadow-slate-950/10"><Network size={26} /></span><div className="eyebrow text-teal-700">Awaiting input</div><h2 className="mt-3 text-xl font-extrabold tracking-[-.04em] text-slate-900">Your assessment will appear here</h2><p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">We’ll separate the signal from the noise and show exactly what influenced the score.</p><div className="mt-7 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-slate-400"><span className="size-1.5 rounded-full bg-amber-400" /> score <span className="text-slate-300">/</span> evidence <span className="text-slate-300">/</span> next steps</div></div>;
  const level = result.severity || levelForScore(result.riskScore);
  return <div className="space-y-5 animate-rise" data-testid="panel-analysis-result">
    <div className="panel overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div className="eyebrow text-teal-700">Assessment complete</div><span className="mono text-[10px] text-slate-400">{formatDate(result.createdAt)}</span></div>
      <div className="flex flex-col items-center gap-6 px-5 py-7 sm:flex-row sm:items-center sm:px-7"><ScoreRing score={result.riskScore} /><div className="text-center sm:text-left"><RiskPill severity={level} /><h2 className="mt-3 text-2xl font-extrabold tracking-[-.05em] text-slate-950" data-testid="text-result-classification">{result.classification}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{result.explanation}</p></div></div>
    </div>
    <div className="panel rounded-2xl p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><div><div className="eyebrow">Observed indicators</div><h3 className="mt-1 font-extrabold text-slate-900">Why we reached this call</h3></div><span className="mono text-xs text-slate-400">{result.indicators.length.toString().padStart(2, '0')} signals</span></div><div className="divide-y divide-slate-100">{result.indicators.map((indicator, index) => <div className="flex gap-3 py-4 first:pt-1 last:pb-0" key={`${indicator.label}-${index}`} data-testid={`indicator-${index}`}><span className={`mt-1 grid size-6 shrink-0 place-items-center rounded-md ${indicator.severity === 'critical' || indicator.severity === 'high' ? 'bg-rose-100 text-rose-600' : indicator.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'}`}><span className="size-1.5 rounded-full bg-current" /></span><div><div className="text-sm font-extrabold text-slate-800">{indicator.label}</div><p className="mt-1 text-xs leading-5 text-slate-500">{indicator.detail}</p></div></div>)}</div></div>
    <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5"><div className="flex items-center gap-2 text-teal-800"><ClipboardCheck size={16} /><span className="eyebrow font-bold text-teal-800">Recommended next steps</span></div><ul className="mt-4 space-y-3">{result.recommendations.map((recommendation, index) => <li className="flex gap-2 text-sm leading-5 text-teal-950/75" key={`${recommendation}-${index}`}><Check size={15} className="mt-0.5 shrink-0 text-teal-700" />{recommendation}</li>)}</ul></div>
  </div>;
}

function Dashboard() {
  const { data, isLoading, isError, refetch } = useGetDashboardSummary({ query: { queryKey: ['/api/dashboard'], staleTime: 30000 } });
  const distribution = data?.distribution || { safe: 0, low: 0, medium: 0, high: 0, critical: 0 };
  const total = data?.totalScans || Object.values(distribution).reduce((sum, value) => sum + value, 0);
  return <WorkspaceShell><div className="mx-auto max-w-[1280px] px-5 py-8 lg:px-9 lg:py-10">
    <WorkspaceHeader eyebrow="Workspace / overview" title="Stay ahead of the queue." description="A clear read on your analysis activity and the signals that need attention." action={<button onClick={() => void refetch()} className="btn-secondary px-3.5 py-2.5 text-xs" data-testid="button-refresh-dashboard"><RefreshCw size={14} /> Refresh</button>} />
    {isError ? <ErrorState onRetry={() => void refetch()} /> : isLoading ? <DashboardSkeleton /> : <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Total scans" value={data?.totalScans ?? 0} note="All-time analyses" accent="bg-teal-500" icon={BarChart3} /><MetricCard label="Threats detected" value={data?.threatsDetected ?? 0} note="Medium severity or above" accent="bg-amber-400" icon={ShieldAlert} /><MetricCard label="Safe scans" value={data?.safeScans ?? 0} note="Clear to proceed" accent="bg-emerald-500" icon={CheckCircle2} /><MetricCard label="High risk" value={data?.highRiskScans ?? 0} note="Needs an analyst decision" accent="bg-rose-500" icon={AlertTriangle} /></div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
        <section className="panel rounded-2xl p-6"><div className="flex items-start justify-between"><div><div className="eyebrow">Risk distribution</div><h2 className="mt-1 text-lg font-extrabold tracking-[-.03em] text-slate-900">Every signal, accounted for</h2></div><span className="mono text-xs text-slate-400">{total} total</span></div><div className="mt-8 space-y-4">{(['safe', 'low', 'medium', 'high', 'critical'] as RiskLevel[]).map((level) => <div key={level} data-testid={`distribution-${level}`}><div className="mb-2 flex items-center justify-between text-xs"><span className="font-bold capitalize text-slate-600">{level}</span><span className="mono text-slate-400">{distribution[level]}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${level === 'safe' ? 'bg-emerald-500' : level === 'low' ? 'bg-teal-500' : level === 'medium' ? 'bg-amber-400' : level === 'high' ? 'bg-orange-500' : 'bg-rose-600'}`} style={{ width: `${total ? Math.max(distribution[level] / total * 100, distribution[level] ? 3 : 0) : 0}%` }} /></div></div>)}</div><div className="mt-8 flex items-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-500"><Info size={14} className="text-teal-600" /> Scores are classified by observed threat signals.</div></section>
        <RecentList items={data?.recent || []} />
      </div></>}
  </div></WorkspaceShell>;
}

function RecentList({ items }: { items: Array<{ id: string; type: string; preview: string; riskScore: number; severity: string; classification: string; createdAt: string }> }) {
  return <section className="panel rounded-2xl p-6"><div className="flex items-start justify-between"><div><div className="eyebrow">Latest activity</div><h2 className="mt-1 text-lg font-extrabold tracking-[-.03em] text-slate-900">Recent analyses</h2></div><Link href="/history" className="inline-flex items-center gap-1 text-xs font-extrabold text-teal-700 hover:text-teal-900" data-testid="link-dashboard-history">View all <ArrowRight size={13} /></Link></div>{items.length === 0 ? <EmptyState icon={Clock3} title="No analyses yet" text="Your completed scans will land here." action={<Link href="/scanner" className="btn-primary px-4 py-2.5 text-xs" data-testid="link-dashboard-empty-scan">Run first scan</Link>} /> : <div className="mt-5 divide-y divide-slate-100">{items.slice(0, 5).map((item) => <HistoryRow item={item} key={item.id} />)}</div>}</section>;
}

function HistoryRow({ item }: { item: { id: string; type: string; preview: string; riskScore: number; severity: string; classification: string; createdAt: string } }) {
  const Icon = item.type === 'url' ? Globe2 : item.type === 'email' ? Mail : MessageSquareText;
  return <div className="flex items-center gap-3 py-4 first:pt-1" data-testid={`row-history-${item.id}`}><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><Icon size={16} /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate text-sm font-bold text-slate-800">{item.preview || `${labelForType(item.type)} analysis`}</span><RiskPill severity={item.severity} /></div><div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400"><span className="mono">{labelForType(item.type)}</span><span>·</span><span>{formatDate(item.createdAt)}</span></div></div><span className="mono hidden text-sm font-medium text-slate-700 sm:block">{item.riskScore}</span></div>;
}

function DashboardSkeleton() {
  return <div className="space-y-6" data-testid="loading-dashboard"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div className="h-36 animate-pulse rounded-2xl bg-white/70" key={item} />)}</div><div className="grid gap-6 xl:grid-cols-2"><div className="h-96 animate-pulse rounded-2xl bg-white/70" /><div className="h-96 animate-pulse rounded-2xl bg-white/70" /></div></div>;
}

function History() {
  const { data, isLoading, isError, refetch } = useGetAnalysisHistory({ query: { queryKey: ['/api/history'], staleTime: 30000 } });
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const items = useMemo(() => (data || []).filter((item) => (filter === 'all' || item.type === filter) && `${item.preview} ${item.classification}`.toLowerCase().includes(search.toLowerCase())), [data, filter, search]);
  return <WorkspaceShell><div className="mx-auto max-w-[1280px] px-5 py-8 lg:px-9 lg:py-10"><WorkspaceHeader eyebrow="Workspace / history" title="Your analysis trail." description="Review previous decisions, compare patterns, and find the signal you saw earlier." action={<button onClick={() => void refetch()} className="btn-secondary px-3.5 py-2.5 text-xs" data-testid="button-refresh-history"><RefreshCw size={14} /> Refresh</button>} />{isError ? <ErrorState onRetry={() => void refetch()} /> : isLoading ? <div className="space-y-3" data-testid="loading-history">{[1, 2, 3, 4, 5].map((item) => <div className="h-16 animate-pulse rounded-xl bg-white/70" key={item} />)}</div> : <section className="panel overflow-hidden rounded-2xl"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="relative max-w-sm flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search analyses" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-teal-500 focus:bg-white" data-testid="input-search-history" /></div><div className="flex gap-1 rounded-lg bg-slate-100 p-1">{['all', 'text', 'url', 'email'].map((value) => <button key={value} onClick={() => setFilter(value)} className={`rounded-md px-3 py-2 text-[11px] font-extrabold capitalize ${filter === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`} data-testid={`button-filter-${value}`}>{value}</button>)}</div></div>{items.length === 0 ? <EmptyState icon={Search} title={search || filter !== 'all' ? 'No matching analyses' : 'No history yet'} text={search || filter !== 'all' ? 'Try another search or clear the filter.' : 'Run an analysis to start building your trail.'} action={<Link href="/scanner" className="btn-primary px-4 py-2.5 text-xs" data-testid="link-history-empty-scan">Open scanner</Link>} /> : <div className="divide-y divide-slate-100">{items.map((item) => <HistoryRow item={item} key={item.id} />)}</div>}</section>}</div></WorkspaceShell>;
}

function EmptyState({ icon: Icon, title, text, action }: { icon: typeof Clock3; title: string; text: string; action?: ReactNode }) {
  return <div className="flex min-h-[220px] flex-col items-center justify-center px-5 py-10 text-center"><span className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400"><Icon size={20} /></span><h3 className="mt-4 text-sm font-extrabold text-slate-800">{title}</h3><p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">{text}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <div className="panel flex min-h-[280px] flex-col items-center justify-center rounded-2xl p-8 text-center" data-testid="status-query-error"><span className="grid size-12 place-items-center rounded-xl bg-rose-100 text-rose-600"><AlertTriangle size={21} /></span><h2 className="mt-4 text-lg font-extrabold text-slate-900">The workspace is momentarily unavailable</h2><p className="mt-2 max-w-sm text-sm text-slate-500">The analysis service didn't return a response. Retry when you're ready.</p><button onClick={onRetry} className="btn-secondary mt-5 px-4 py-2.5 text-xs" data-testid="button-retry-query"><RefreshCw size={14} /> Try again</button></div>;
}

function EducationPage({ kind }: { kind: 'features' | 'about' | 'docs' }) {
  const content = {
    features: { eyebrow: 'Product / capabilities', title: 'A faster read on suspicious content.', description: 'ShieldAI gives security-conscious teams a shared language for making careful decisions under time pressure.' },
    about: { eyebrow: 'Product / point of view', title: 'Security should explain itself.', description: 'We built ShieldAI around a simple belief: a score without evidence creates more uncertainty, not less.' },
    docs: { eyebrow: 'Reference / methodology', title: 'Understand the decision.', description: 'A practical guide to what ShieldAI looks for and how to use the result responsibly.' },
  }[kind];
  const blocks = kind === 'features' ? [{ icon: Gauge, title: 'Risk that fits in a glance', text: 'A 0–100 score and a plain-language classification give your triage queue an immediate shape.' }, { icon: Fingerprint, title: 'Evidence, not vibes', text: 'Indicators point to the behavioral clues that influenced the decision: urgency, identity mismatch, suspicious domains, and more.' }, { icon: ClipboardCheck, title: 'Recommendations that move', text: 'Each result ends with practical next steps so an analyst can contain, verify, or safely proceed.' }] : kind === 'about' ? [{ icon: Shield, title: 'Calm under pressure', text: 'The interface is deliberately quiet where decisions are hard and emphatic where a threat needs attention.' }, { icon: Network, title: 'Built for context', text: 'Messages, email content, and URLs have different shapes. ShieldAI preserves the input type so the explanation stays relevant.' }, { icon: LifeBuoy, title: 'A co-pilot, not an oracle', text: 'Use the assessment as a structured second read. Human judgment remains the final control.' }] : [{ icon: TerminalSquare, title: '1. Submit content', text: 'Choose Message, URL, or Email and provide the suspicious content. Keep enough surrounding context to make the signal meaningful.' }, { icon: BarChart3, title: '2. Read the score', text: 'Risk scores run from 0 to 100. Severity bands provide a quick triage language: safe, low, medium, high, and critical.' }, { icon: Search, title: '3. Inspect indicators', text: 'Review each observed indicator and its detail. The explanation summarizes why the classification was reached.' }]; 
  return <div className="min-h-[100dvh] bg-[#edf3f5]"><PublicNav /><main className="mx-auto max-w-[1040px] px-5 py-16 lg:px-8 lg:py-24"><div className="max-w-2xl animate-rise"><div className="eyebrow text-teal-700">{content.eyebrow}</div><h1 className="mt-4 text-5xl font-extrabold leading-[1.02] tracking-[-.075em] text-slate-950 sm:text-6xl">{content.title}</h1><p className="mt-6 text-lg leading-8 text-slate-600">{content.description}</p></div><div className="mt-16 grid gap-4 md:grid-cols-3">{blocks.map(({ icon: Icon, title, text }, index) => <div className="panel animate-rise rounded-2xl p-6" style={{ animationDelay: `${index * 70}ms` }} key={title}><span className="grid size-10 place-items-center rounded-xl bg-slate-950 text-teal-300"><Icon size={19} /></span><h2 className="mt-9 text-lg font-extrabold tracking-[-.03em] text-slate-900">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{text}</p></div>)}</div><div className="mt-16 grid gap-6 rounded-2xl border border-slate-300 bg-slate-950 p-7 text-white sm:p-10 md:grid-cols-[1fr_auto] md:items-center"><div><div className="eyebrow text-teal-300">Make the next call clearer</div><h2 className="mt-3 text-2xl font-extrabold tracking-[-.04em]">Bring ShieldAI into your next triage.</h2></div><Link href="/scanner" className="btn-primary px-5 py-3.5 text-sm" data-testid={`link-${kind}-cta`}>Open scanner <ArrowRight size={16} /></Link></div></main><Footer /></div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route path="/scanner" component={Scanner} /><Route path="/dashboard" component={Dashboard} /><Route path="/history" component={History} /><Route path="/features"><EducationPage kind="features" /></Route><Route path="/about"><EducationPage kind="about" /></Route><Route path="/docs"><EducationPage kind="docs" /></Route><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><Router /><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;