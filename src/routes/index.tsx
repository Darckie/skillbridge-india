import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useI18n, useT } from "@/lib/i18n";
import { useWorker } from "@/lib/worker-store";
import { useEmployer } from "@/lib/employer-store";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { setLang, lang } = useI18n();
  const t = useT();
  const navigate = useNavigate();
  const { loading: wLoading, isLoggedIn: wLoggedIn } = useWorker();
  const { loading: eLoading, isLoggedIn: eLoggedIn, employer } = useEmployer();

  // Auto-route already-signed-in users
  useEffect(() => {
    if (wLoading || eLoading) return;
    if (eLoggedIn && employer) navigate({ to: "/employer/home" });
    else if (wLoggedIn) navigate({ to: "/worker/home" });
  }, [wLoading, eLoading, wLoggedIn, eLoggedIn, employer, navigate]);

  const goWorker = () => navigate({ to: "/login" });
  const goEmployer = () => navigate({ to: "/employer/login" });

  return (
    <div className="kp-screen">
      {/* Top bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="kp-container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
              <ShieldIcon />
            </div>
            <span className="text-base font-extrabold tracking-tight">KaamProof</span>
          </div>
          <div className="flex gap-1 rounded-full bg-muted p-0.5 text-xs font-semibold">
            <button
              onClick={() => setLang("hi")}
              className={`rounded-full px-2.5 py-1 ${lang === "hi" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              हिं
            </button>
            <button
              onClick={() => setLang("en")}
              className={`rounded-full px-2.5 py-1 ${lang === "en" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="kp-container flex-1 py-8"
      >
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-verified-light)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-verified-mid)]">
            ✓ {t("landing_badge")}
          </span>
          <h1 className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-foreground">
            KaamProof
          </h1>
          <p className="mt-2 text-[18px] font-bold text-foreground">
            {t("landing_tagline_main")} <span className="text-primary">{t("landing_tagline_accent")}</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("landing_subtitle")}
          </p>
        </div>

        {/* Two CTAs */}
        <div className="mt-7 grid gap-3">
          <button
            onClick={goWorker}
            className="group rounded-2xl border-2 border-[oklch(0.68_0.16_55_/_0.4)] bg-[linear-gradient(135deg,#FFF8F0_0%,#FEEDD9_100%)] p-5 text-left transition-shadow hover:shadow-[var(--shadow-card)]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <PersonIcon />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-extrabold text-foreground">
                  {t("landing_worker_title")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("landing_worker_desc")}
                </p>
              </div>
              <span className="text-primary">→</span>
            </div>
          </button>

          <button
            onClick={goEmployer}
            className="group rounded-2xl border-2 border-[oklch(0.36_0.09_255_/_0.25)] p-5 text-left transition-shadow hover:shadow-[var(--shadow-card)]"
            style={{ background: "linear-gradient(135deg, #F5F8FF 0%, #EBF1FA 100%)" }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--color-navy-badge)] text-[var(--color-navy)]">
                <BriefcaseIcon />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-extrabold text-foreground">
                  {t("landing_employer_title")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("landing_employer_desc")}
                </p>
              </div>
              <span className="text-[var(--color-navy-mid)]">→</span>
            </div>
          </button>
        </div>

        {/* How it works */}
        <section className="mt-9">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
            {t("landing_how_it_works")}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Step n={1} label={t("landing_step_profile")} />
            <Step n={2} label={t("landing_step_video")} />
            <Step n={3} label={t("landing_step_passport")} />
          </div>
        </section>

        {/* Trust strip */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-4 text-center text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">
            {t("landing_trust_line1")}
          </p>
          <p className="mt-1">{t("landing_trust_line2")}</p>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          {t("tagline")}
        </p>
      </motion.main>
    </div>
  );
}

function Step({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-extrabold text-primary">
        {n}
      </div>
      <p className="mt-2 text-[12px] font-semibold text-foreground">{label}</p>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
      <path d="M12 2l8 3v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V5l8-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-9 0h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
