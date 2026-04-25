import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useT } from "@/lib/i18n";
import { useEmployer, logEmployerAction } from "@/lib/employer-store";
import { supabase } from "@/integrations/supabase/client";
import type { Trade } from "@/lib/worker-store";
import { motion, AnimatePresence } from "framer-motion";

type SearchParams = { trade?: Trade | "" };

export const Route = createFileRoute("/employer/search")({
  component: EmployerSearchPage,
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    trade: (s.trade as Trade | "" | undefined) ?? "",
  }),
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

const TRADES: { value: "" | Trade; labelKey: string }[] = [
  { value: "", labelKey: "employer_all_trades" },
  { value: "electrician", labelKey: "trade_electrician" },
  { value: "plumber", labelKey: "trade_plumber" },
  { value: "welder", labelKey: "trade_welder" },
  { value: "carpenter", labelKey: "trade_carpenter" },
  { value: "ac_tech", labelKey: "trade_ac_tech" },
  { value: "painter", labelKey: "trade_painter" },
  { value: "mason", labelKey: "trade_mason" },
  { value: "driver", labelKey: "trade_driver" },
  { value: "security_guard", labelKey: "trade_security_guard" },
];

const LEVEL_COLORS: Record<number, { bg: string; fg: string; label: string }> = {
  1: { bg: "oklch(0.95 0.08 80)", fg: "oklch(0.45 0.15 60)", label: "L1" },
  2: { bg: "var(--color-navy-badge)", fg: "var(--color-navy)", label: "L2" },
  3: { bg: "var(--color-verified-light)", fg: "var(--color-verified-mid)", label: "L3" },
};

function EmployerSearchPage() {
  const t = useT();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { loading, isLoggedIn, employer } = useEmployer();
  const [trade, setTrade] = useState<"" | Trade>(search.trade ?? "");
  const [city, setCity] = useState("");
  const [minLevel, setMinLevel] = useState<number>(0);
  const [maxWage, setMaxWage] = useState<string>("");
  const [results, setResults] = useState<WorkerHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isLoggedIn) navigate({ to: "/employer/login" });
  }, [loading, isLoggedIn, navigate]);

  const runSearch = async () => {
    setBusy(true);
    try {
      let q = supabase
        .from("assessments")
        .select(
          "worker_id, level, trade, workers!inner(id, phone, passport_slug), worker_profiles!inner(name, city, trade, experience_years, daily_wage)",
        )
        .eq("status", "verified");

      if (trade) q = q.eq("trade", trade);
      if (minLevel > 0) q = q.gte("level", minLevel);

      const { data, error } = await q.limit(50);
      if (error) throw error;

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

      let hits: WorkerHit[] = (data as unknown as Row[])
        .filter((r) => r.workers?.passport_slug)
        .map((r) => ({
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

  useEffect(() => {
    if (employer) void runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employer, trade, minLevel]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (trade) n++;
    if (city.trim()) n++;
    if (minLevel > 0) n++;
    if (maxWage) n++;
    return n;
  }, [trade, city, minLevel, maxWage]);

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
            <h1 className="text-base font-bold">{t("employer_search_title")}</h1>
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              filtersOpen
                ? "bg-[var(--color-navy)] text-white"
                : "bg-muted text-foreground hover:bg-[var(--color-navy-light)]"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M6 12h12M10 18h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            {t("employer_filters")}
            {activeFilterCount > 0 && (
              <span className={`ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-extrabold ${
                filtersOpen ? "bg-white text-[var(--color-navy)]" : "bg-[var(--color-navy)] text-white"
              }`}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border bg-muted/30"
            >
              <div className="kp-container space-y-3 py-4">
                {/* Trade pills (horizontal scroll) */}
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t("employer_filter_trade")}
                  </p>
                  <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                    {TRADES.map((tr) => {
                      const active = trade === tr.value;
                      return (
                        <button
                          key={tr.value}
                          onClick={() => setTrade(tr.value)}
                          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                            active
                              ? "bg-[var(--color-navy)] text-white"
                              : "bg-card border border-border text-foreground hover:bg-[var(--color-navy-light)]"
                          }`}
                        >
                          {t(tr.labelKey)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t("employer_filter_city")}
                    </p>
                    <input
                      className="kp-input"
                      placeholder={t("employer_filter_any")}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      onBlur={runSearch}
                      onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t("employer_filter_max_wage")}
                    </p>
                    <input
                      className="kp-input"
                      type="number"
                      placeholder={t("employer_filter_any")}
                      value={maxWage}
                      onChange={(e) => setMaxWage(e.target.value)}
                      onBlur={runSearch}
                      onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t("employer_filter_min_level")}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 0, label: t("employer_filter_level_any") },
                      { val: 2, label: t("employer_filter_level_2") },
                      { val: 3, label: t("employer_filter_level_3") },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => setMinLevel(opt.val)}
                        className={`rounded-lg border-2 py-2 text-xs font-bold transition-colors ${
                          minLevel === opt.val
                            ? "border-[var(--color-navy)] bg-[var(--color-navy-light)] text-[var(--color-navy)]"
                            : "border-border bg-card text-muted-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="kp-container py-5"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
          {results.length} {results.length === 1 ? t("employer_results_count_one") : t("employer_results_count")}
        </p>

        <div className="mt-3 space-y-3">
          {results.length === 0 && !busy && (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-navy-light)] text-[var(--color-navy)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-bold text-foreground">{t("employer_empty_results_title")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("employer_empty_results_desc")}</p>
            </div>
          )}

          {results.map((w) => {
            const lvl = w.level ?? 1;
            const lc = LEVEL_COLORS[lvl] ?? LEVEL_COLORS[1];
            return (
              <div key={w.worker_id} className="relative rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                {/* Level badge top-right */}
                <span
                  className="absolute right-3 top-3 rounded-md px-2 py-0.5 text-[11px] font-extrabold"
                  style={{ background: lc.bg, color: lc.fg }}
                >
                  {t("skill_level")} {lc.label}
                </span>

                <div className="flex items-start gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-extrabold text-white"
                    style={{ background: avatarColor(w.name) }}
                  >
                    {w.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 pr-16">
                    <p className="truncate text-[15px] font-extrabold text-foreground">{w.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t(`trade_${w.trade}`)} · {w.city}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground">
                        {w.experience_years} {t("employer_years_short")}
                      </span>
                      <span className="text-[12px] font-bold text-foreground">
                        ₹{w.daily_wage}{t("employer_per_day")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleAction(w.worker_id, "call", `tel:+91${w.phone}`)}
                    className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold text-white"
                    style={{ background: "var(--color-verified)" }}
                  >
                    <PhoneIcon />
                    {t("employer_action_call")}
                  </button>
                  <button
                    onClick={() =>
                      handleAction(
                        w.worker_id,
                        "whatsapp",
                        `https://wa.me/91${w.phone}?text=${encodeURIComponent(t("employer_wa_message").replace("{name}", w.name))}`,
                      )
                    }
                    className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold text-white"
                    style={{ background: "#25D366" }}
                  >
                    <WhatsAppIcon />
                    WhatsApp
                  </button>
                  {w.passport_slug ? (
                    <Link
                      to="/passport/$slug"
                      params={{ slug: w.passport_slug }}
                      onClick={() => handleAction(w.worker_id, "view")}
                      className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold text-white"
                      style={{ background: "var(--gradient-navy)" }}
                    >
                      <EyeIcon />
                      {t("employer_action_passport")}
                    </Link>
                  ) : (
                    <span className="rounded-lg bg-muted py-2.5 text-center text-xs font-bold text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function avatarColor(name: string) {
  const palette = [
    "linear-gradient(135deg,#2563EB,#1B3F6E)",
    "linear-gradient(135deg,#16A34A,#15803D)",
    "linear-gradient(135deg,#E8761A,#9d4f10)",
    "linear-gradient(135deg,#9d2660,#d34a8c)",
    "linear-gradient(135deg,#7f77dd,#534ab7)",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.72 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0122 16.92z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.6.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.5-.9-2.1-.2-.5-.5-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1 0 1.3.9 2.5 1 2.6.1.2 1.8 2.7 4.3 3.8.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.5-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.1-1.3c1.5.8 3.1 1.3 4.9 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
