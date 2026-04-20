import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { useEmployer, createJobPost, setJobStatus } from "@/lib/employer-store";
import { signOut } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Trade } from "@/lib/worker-store";
import { motion } from "framer-motion";

export const Route = createFileRoute("/employer/home")({
  component: EmployerHomePage,
});

const TRADES: { value: Trade; labelKey: string }[] = [
  { value: "electrician", labelKey: "trade_electrician" },
  { value: "plumber", labelKey: "trade_plumber" },
  { value: "welder", labelKey: "trade_welder" },
  { value: "carpenter", labelKey: "trade_carpenter" },
  { value: "ac_tech", labelKey: "trade_ac_tech" },
];

function EmployerHomePage() {
  const t = useT();
  const navigate = useNavigate();
  const { loading, isLoggedIn, employer, jobs, refresh } = useEmployer();
  const [contacted, setContacted] = useState<number>(0);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!loading && !isLoggedIn) navigate({ to: "/employer/login" });
    if (!loading && isLoggedIn && !employer) navigate({ to: "/employer/profile" });
  }, [loading, isLoggedIn, employer, navigate]);

  useEffect(() => {
    if (!employer) return;
    supabase
      .from("employer_actions")
      .select("worker_id", { count: "exact", head: false })
      .eq("employer_id", employer.id)
      .then(({ data }) => {
        const unique = new Set((data ?? []).map((r) => r.worker_id));
        setContacted(unique.size);
      });
  }, [employer, jobs]);

  if (loading || !employer) {
    return (
      <div className="kp-screen items-center justify-center">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  const openJobs = jobs.filter((j) => j.status === "open").length;
  const avgWage = jobs.length
    ? Math.round(jobs.reduce((s, j) => s + j.wage_offered, 0) / jobs.length)
    : 0;

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="kp-screen pb-10">
      {/* Top bar */}
      <header className="border-b border-border" style={{ background: "var(--gradient-navy)" }}>
        <div className="kp-container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <BriefcaseIcon />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">Employer</p>
              <p className="text-sm font-bold leading-tight">{employer.company_name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-medium text-white/80 hover:text-white"
          >
            {t("logout")}
          </button>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="kp-container py-6"
      >
        <h1 className="text-[24px] font-extrabold tracking-tight">
          {t("employer_home_title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("employer_home_subtitle")}
        </p>

        {/* Stat cards */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat label={t("employer_stat_open_jobs")} value={openJobs} />
          <Stat label={t("employer_stat_contacted")} value={contacted} />
          <Stat label={t("employer_stat_avg_wage")} value={`₹${avgWage || 0}`} />
        </div>

        {/* Search CTA */}
        <Link
          to="/employer/search"
          className="mt-5 flex items-center justify-between rounded-2xl border-2 border-[oklch(0.36_0.09_255_/_0.2)] p-4 transition-shadow hover:shadow-[var(--shadow-card)]"
          style={{ background: "linear-gradient(135deg, #F5F8FF 0%, #EBF1FA 100%)" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-navy-badge)] text-[var(--color-navy)]">
              <SearchIcon />
            </div>
            <div>
              <p className="text-[15px] font-extrabold text-foreground">{t("employer_find_workers")}</p>
              <p className="text-xs text-muted-foreground">{t("employer_find_workers_desc")}</p>
            </div>
          </div>
          <span className="text-[var(--color-navy-mid)]">→</span>
        </Link>

        {/* Jobs section */}
        <div className="mt-7 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
            {t("employer_your_jobs")}
          </p>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
          >
            {showCreate ? t("employer_cancel") : t("employer_new_job")}
          </button>
        </div>

        {showCreate && (
          <CreateJobForm
            employerId={employer.id}
            defaultCity={employer.city}
            onCreated={async () => {
              setShowCreate(false);
              await refresh();
            }}
          />
        )}

        <div className="mt-3 space-y-2.5">
          {jobs.length === 0 && !showCreate && (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              {t("employer_no_jobs")}
            </div>
          )}
          {jobs.map((j) => (
            <div key={j.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-foreground">{j.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t(`trade_${j.trade}`)} · {j.city} · ₹{j.wage_offered}{t("employer_per_day")}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                    j.status === "open"
                      ? "bg-[var(--color-verified-light)] text-[var(--color-verified-mid)]"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {j.status === "open" ? t("employer_job_open") : t("employer_job_closed")}
                </span>
              </div>
              {j.description && (
                <p className="mt-2 text-xs text-muted-foreground">{j.description}</p>
              )}
              <button
                onClick={async () => {
                  await setJobStatus(j.id, j.status === "open" ? "closed" : "open");
                  await refresh();
                }}
                className="mt-3 text-xs font-semibold text-[var(--color-navy-mid)]"
              >
                {j.status === "open" ? t("employer_mark_closed") : t("employer_reopen")}
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center shadow-[var(--shadow-card)]">
      <p className="text-[18px] font-extrabold text-[var(--color-navy)]">{value}</p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function CreateJobForm({
  employerId, defaultCity, onCreated,
}: { employerId: string; defaultCity: string; onCreated: () => void }) {
  const t = useT();
  const [title, setTitle] = useState("");
  const [trade, setTrade] = useState<Trade>("electrician");
  const [city, setCity] = useState(defaultCity);
  const [wage, setWage] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const valid = title.trim() && city.trim() && wage;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    setErr("");
    try {
      await createJobPost({
        employer_id: employerId,
        trade,
        city: city.trim(),
        title: title.trim(),
        wage_offered: parseInt(wage) || 0,
        description: desc.trim() || undefined,
      });
      onCreated();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 space-y-3 rounded-2xl border border-border bg-card p-4">
      <input className="kp-input" placeholder={t("employer_job_title_ph")} value={title} onChange={(e) => setTitle(e.target.value)} />
      <select className="kp-input" value={trade} onChange={(e) => setTrade(e.target.value as Trade)}>
        {TRADES.map((tr) => (
          <option key={tr.value} value={tr.value}>{t(tr.labelKey)}</option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input className="kp-input" placeholder={t("city")} value={city} onChange={(e) => setCity(e.target.value)} />
        <input className="kp-input" type="number" placeholder={t("employer_job_wage_ph")} value={wage} onChange={(e) => setWage(e.target.value)} />
      </div>
      <textarea className="kp-input min-h-[72px] py-2" placeholder={t("employer_job_desc_ph")} value={desc} onChange={(e) => setDesc(e.target.value)} />
      {err && <p className="text-xs text-destructive">{err}</p>}
      <button onClick={submit} disabled={!valid || busy} className="kp-btn kp-btn-primary disabled:opacity-40">
        {busy ? t("loading") : t("employer_post_job")}
      </button>
    </div>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
      <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-9 0h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
