import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useT } from "@/lib/i18n";
import { useEmployer, logEmployerAction } from "@/lib/employer-store";
import { supabase } from "@/integrations/supabase/client";
import type { Trade } from "@/lib/worker-store";
import { motion } from "framer-motion";

export const Route = createFileRoute("/employer/search")({
  component: EmployerSearchPage,
});

interface WorkerHit {
  worker_id: string;
  passport_slug: string | null;
  phone: string;
  name: string;
  city: string;
  trade: Trade;
  experience_years: number;
  daily_wage: number;
  level: number | null;
}

const TRADES: { value: "" | Trade; label: string }[] = [
  { value: "", label: "All trades" },
  { value: "electrician", label: "Electrician" },
  { value: "plumber", label: "Plumber" },
  { value: "welder", label: "Welder" },
  { value: "carpenter", label: "Carpenter" },
  { value: "ac_tech", label: "AC Tech" },
];

function EmployerSearchPage() {
  const t = useT();
  const navigate = useNavigate();
  const { loading, isLoggedIn, employer } = useEmployer();
  const [trade, setTrade] = useState<"" | Trade>("");
  const [city, setCity] = useState("");
  const [minLevel, setMinLevel] = useState<number>(0);
  const [maxWage, setMaxWage] = useState<string>("");
  const [results, setResults] = useState<WorkerHit[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !isLoggedIn) navigate({ to: "/employer/login" });
  }, [loading, isLoggedIn, navigate]);

  const search = async () => {
    setBusy(true);
    try {
      // Verified assessments → join worker + profile
      let q = supabase
        .from("assessments")
        .select(
          "worker_id, level, trade, workers!inner(id, phone, passport_slug), worker_profiles!inner(name, city, trade, experience_years, daily_wage)",
          { count: "exact" },
        )
        .eq("status", "verified")
        .not("workers.passport_slug", "is", null);

      if (trade) q = q.eq("trade", trade);
      if (minLevel > 0) q = q.gte("level", minLevel);

      const { data, error } = await q.limit(50);
      if (error) throw error;

      // Supabase nested-join shape
      type Row = {
        worker_id: string;
        level: number | null;
        trade: Trade;
        workers: { id: string; phone: string; passport_slug: string | null };
        worker_profiles: {
          name: string; city: string; trade: Trade;
          experience_years: number; daily_wage: number;
        };
      };

      let hits: WorkerHit[] = (data as unknown as Row[]).map((r) => ({
        worker_id: r.worker_id,
        passport_slug: r.workers.passport_slug,
        phone: r.workers.phone,
        name: r.worker_profiles.name,
        city: r.worker_profiles.city,
        trade: r.worker_profiles.trade,
        experience_years: r.worker_profiles.experience_years,
        daily_wage: r.worker_profiles.daily_wage,
        level: r.level,
      }));

      if (city.trim()) {
        const c = city.trim().toLowerCase();
        hits = hits.filter((h) => h.city.toLowerCase().includes(c));
      }
      if (maxWage) {
        const mw = parseInt(maxWage);
        if (!Number.isNaN(mw)) hits = hits.filter((h) => h.daily_wage <= mw);
      }

      setResults(hits);
    } finally {
      setBusy(false);
    }
  };

  // initial search
  useEffect(() => {
    if (employer) void search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employer]);

  const tradeFilter = useMemo(
    () => TRADES.find((tr) => tr.value === trade)?.label ?? "All trades",
    [trade],
  );

  const handleAction = async (
    workerId: string, action: "view" | "call" | "whatsapp" | "hire", url?: string,
  ) => {
    if (employer) await logEmployerAction(employer.id, workerId, action);
    if (url) window.open(url, "_blank");
  };

  return (
    <div className="kp-screen pb-10">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="kp-container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/employer/home" className="-ml-2 flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <h1 className="text-base font-bold">Find Workers</h1>
          </div>
          <span className="text-xs font-medium text-muted-foreground">{tradeFilter}</span>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="kp-container py-5"
      >
        {/* Filters */}
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Trade</label>
            <select className="kp-input mt-1" value={trade} onChange={(e) => setTrade(e.target.value as "" | Trade)}>
              {TRADES.map((tr) => <option key={tr.value} value={tr.value}>{tr.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">City</label>
            <input className="kp-input mt-1" placeholder="Any" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Max ₹/day</label>
            <input className="kp-input mt-1" type="number" placeholder="Any" value={maxWage} onChange={(e) => setMaxWage(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Min Level</label>
            <div className="mt-1 flex gap-2">
              {[0, 1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setMinLevel(n)}
                  className={`flex-1 rounded-lg border-2 py-2 text-sm font-bold transition-colors ${
                    minLevel === n
                      ? "border-[var(--color-navy-mid)] bg-[var(--color-navy-light)] text-[var(--color-navy)]"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {n === 0 ? "Any" : `L${n}+`}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={search}
            disabled={busy}
            className="kp-btn col-span-2 disabled:opacity-50"
            style={{ background: "var(--gradient-navy)", color: "white" }}
          >
            {busy ? t("loading") : "Search"}
          </button>
        </div>

        {/* Results */}
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
          {results.length} verified worker{results.length === 1 ? "" : "s"}
        </p>

        <div className="mt-3 space-y-3">
          {results.length === 0 && !busy && (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No workers match these filters yet.
            </div>
          )}
          {results.map((w) => (
            <div key={w.worker_id} className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-navy-badge)] text-base font-extrabold text-[var(--color-navy)]">
                  {w.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-extrabold text-foreground">{w.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t(`trade_${w.trade}`)} · {w.city} · {w.experience_years} yr
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-md bg-[var(--color-verified-light)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-verified-mid)]">
                      ✓ Level {w.level ?? "—"}
                    </span>
                    <span className="text-[11px] font-semibold text-foreground">₹{w.daily_wage}/day</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {w.passport_slug && (
                  <Link
                    to="/passport/$slug"
                    params={{ slug: w.passport_slug }}
                    onClick={() => handleAction(w.worker_id, "view")}
                    className="rounded-lg border border-border py-2 text-center text-xs font-bold text-foreground hover:bg-muted"
                  >
                    Passport
                  </Link>
                )}
                <button
                  onClick={() => handleAction(w.worker_id, "call", `tel:+91${w.phone}`)}
                  className="rounded-lg border border-border py-2 text-xs font-bold text-foreground hover:bg-muted"
                >
                  Call
                </button>
                <button
                  onClick={() =>
                    handleAction(
                      w.worker_id,
                      "whatsapp",
                      `https://wa.me/91${w.phone}?text=${encodeURIComponent(`Hi ${w.name}, I saw your KaamProof Skill Passport.`)}`,
                    )
                  }
                  className="rounded-lg py-2 text-xs font-bold text-white"
                  style={{ background: "#25D366" }}
                >
                  WhatsApp
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
