import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useT, useI18n } from "@/lib/i18n";
import { useEmployer, createJobPost, setJobStatus } from "@/lib/employer-store";
import { signOut } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Trade } from "@/lib/worker-store";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/employer/home")({
  component: EmployerHomePage,
});

const TRADES: { value: Trade; labelKey: string }[] = [
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

function EmployerHomePage() {
  const t = useT();
  const { lang, setLang } = useI18n();
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
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 rounded-full bg-white/15 p-0.5 text-[11px] font-bold text-white">
              <button
                onClick={() => setLang("hi")}
                className={`rounded-full px-2 py-0.5 ${lang === "hi" ? "bg-white text-[var(--color-navy)]" : "text-white/80"}`}
              >
                हिं
              </button>
              <button
                onClick={() => setLang("en")}
                className={`rounded-full px-2 py-0.5 ${lang === "en" ? "bg-white text-[var(--color-navy)]" : "text-white/80"}`}
              >
                EN
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-white/80 hover:text-white"
            >
              {t("logout")}
            </button>
          </div>
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
          <Stat
            icon={<BriefcaseIcon />}
            label={t("employer_stat_open_jobs")}
            value={openJobs}
          />
          <Stat
            icon={<PersonIcon />}
            label={t("employer_stat_contacted")}
            value={contacted}
          />
          <Stat
            icon={<RupeeIcon />}
            label={t("employer_stat_avg_wage")}
            value={`₹${avgWage || 0}`}
          />
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
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
          >
            {t("employer_new_job")}
          </button>
        </div>

        <div className="mt-3 space-y-2.5">
          {jobs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
              <ClipboardIllustration />
              <p className="mt-3 text-sm font-bold text-foreground">{t("employer_empty_jobs_title")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("employer_empty_jobs_desc")}</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                {t("employer_new_job")}
              </button>
            </div>
          )}
          {jobs.map((j) => (
            <div
              key={j.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
              style={{
                borderLeftWidth: 4,
                borderLeftColor: j.status === "open" ? "var(--color-verified)" : "oklch(0.75 0.005 280)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-foreground">{j.title}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="kp-badge bg-[var(--color-navy-badge)] text-[var(--color-navy)]">
                      {t(`trade_${j.trade}`)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {j.city} · ₹{j.wage_offered}{t("employer_per_day")}
                    </span>
                  </div>
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
              <div className="mt-3 flex items-center gap-3">
                <Link
                  to="/employer/search"
                  search={{ trade: j.trade } as never}
                  className="text-xs font-bold text-[var(--color-navy-mid)]"
                >
                  {t("employer_view_applicants")} →
                </Link>
                <span className="text-muted-foreground/40">·</span>
                <button
                  onClick={async () => {
                    await setJobStatus(j.id, j.status === "open" ? "closed" : "open");
                    await refresh();
                  }}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  {j.status === "open" ? t("employer_mark_closed") : t("employer_reopen")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Create Job bottom sheet */}
      <AnimatePresence>
        {showCreate && (
          <CreateJobSheet
            employerId={employer.id}
            defaultCity={employer.city}
            onClose={() => setShowCreate(false)}
            onCreated={async () => {
              setShowCreate(false);
              await refresh();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div
      className="rounded-2xl p-4 text-center shadow-[var(--shadow-card)]"
      style={{
        background: "linear-gradient(160deg, #F5F8FF 0%, #DBEAFE 100%)",
        border: "1px solid oklch(0.36 0.09 255 / 0.12)",
      }}
    >
      <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/70 text-[var(--color-navy)]">
        {icon}
      </div>
      <p className="text-[20px] font-extrabold text-[var(--color-navy)] leading-tight">{value}</p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function CreateJobSheet({
  employerId, defaultCity, onClose, onCreated,
}: { employerId: string; defaultCity: string; onClose: () => void; onCreated: () => void }) {
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
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/50"
      />
      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-card shadow-[var(--shadow-elevated)]"
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border" />
        <div className="kp-container py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">{t("employer_create_job")}</h2>
            <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {t("employer_job_title_ph")}
              </label>
              <input className="kp-input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {t("employer_select_trade")}
              </label>
              <div className="-mx-1 flex flex-wrap gap-1.5 px-1">
                {TRADES.map((tr) => {
                  const active = trade === tr.value;
                  return (
                    <button
                      key={tr.value}
                      onClick={() => setTrade(tr.value)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                        active
                          ? "bg-[var(--color-navy)] text-white"
                          : "bg-muted text-foreground hover:bg-[var(--color-navy-light)]"
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
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {t("city")}
                </label>
                <input className="kp-input" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {t("employer_job_wage_ph")}
                </label>
                <input className="kp-input" type="number" value={wage} onChange={(e) => setWage(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {t("employer_job_desc_ph")}
              </label>
              <textarea
                className="kp-input min-h-[80px] py-2"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>

            {err && <p className="text-xs text-destructive">{err}</p>}

            <button
              onClick={submit}
              disabled={!valid || busy}
              className="kp-btn disabled:opacity-40"
              style={{ background: "var(--gradient-navy)", color: "white" }}
            >
              {busy ? t("loading") : t("employer_post_job")}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-9 0h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RupeeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 4h12M6 8h12M9 4c3 0 5 1.5 5 4s-2 4-5 4H6l8 8"
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

function ClipboardIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto opacity-70">
      <rect x="14" y="10" width="36" height="46" rx="4" stroke="var(--color-navy-mid)" strokeWidth="2.5" fill="var(--color-navy-light)" />
      <rect x="22" y="6" width="20" height="8" rx="2" stroke="var(--color-navy-mid)" strokeWidth="2.5" fill="white" />
      <path d="M22 26h20M22 34h20M22 42h12" stroke="var(--color-navy-mid)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
