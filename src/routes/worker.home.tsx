import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useT } from "@/lib/i18n";
import { useWorker } from "@/lib/worker-store";
import { WorkerLayout } from "@/components/WorkerLayout";
import { motion } from "framer-motion";

export const Route = createFileRoute("/worker/home")({
  component: WorkerHomePage,
});

function WorkerHomePage() {
  const t = useT();
  const navigate = useNavigate();
  const { loading, isLoggedIn, profile, latestAssessment, worker } = useWorker();

  useEffect(() => {
    if (!loading && !isLoggedIn) navigate({ to: "/" });
  }, [loading, isLoggedIn, navigate]);

  if (loading || !worker) {
    return (
      <div className="kp-screen items-center justify-center">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  const profileDone = !!profile;
  const assessment = latestAssessment;
  const testStatus: "locked" | "todo" | "pending" | "verified" | "rerecord" =
    !profileDone
      ? "locked"
      : !assessment
        ? "todo"
        : assessment.status === "pending_review"
          ? "pending"
          : assessment.status === "verified"
            ? "verified"
            : "rerecord";

  const passportAvailable = testStatus === "verified" && !!worker.passport_slug;
  const currentStep = !profileDone ? 0 : testStatus === "verified" ? 2 : 1;
  const firstName = profile?.name ? profile.name.split(" ")[0] : null;

  return (
    <WorkerLayout showBack={false} title="KaamProof">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="kp-container py-6"
      >
        {/* Greeting */}
        <h1 className="text-[26px] font-extrabold tracking-tight text-foreground">
          {t("home_title")}{firstName ? `, ${firstName} 👋` : " 👋"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("home_subtitle")}</p>

        {/* Progress card */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Your Progress
          </p>
          <div className="mt-3 flex items-start">
            {[t("step_profile"), t("step_test"), t("step_result")].map((label, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={label} className="flex flex-1 items-start">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                        done
                          ? "bg-[var(--color-navy)] text-white"
                          : active
                            ? "bg-primary text-primary-foreground ring-4 ring-[oklch(0.68_0.16_55_/_0.15)]"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    <span
                      className={`whitespace-nowrap text-[11px] ${
                        active || done ? "font-semibold text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div
                      className={`mt-4 h-0.5 flex-1 mx-1 rounded ${
                        i < currentStep ? "bg-[var(--color-navy)]" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cards */}
        <div className="mt-6 space-y-3">
          <StepCard
            icon={<PersonIcon />}
            title={t("card_profile_title")}
            desc={
              profileDone && profile
                ? `${profile.name} · ${profile.city} · ${profile.experience_years} yr`
                : t("card_profile_desc")
            }
            cta={profileDone ? t("view") : t("complete")}
            tone={profileDone ? "done" : "active"}
            to="/profile"
          />

          <StepCard
            icon={<VideoIcon />}
            title={t("card_test_title")}
            desc={
              testStatus === "locked"
                ? t("card_test_locked")
                : testStatus === "pending"
                  ? t("card_test_pending")
                  : testStatus === "verified"
                    ? t("card_test_done")
                    : t("card_test_desc")
            }
            cta={testStatus === "pending" || testStatus === "verified" ? t("view") : t("go")}
            tone={
              testStatus === "locked"
                ? "locked"
                : testStatus === "verified"
                  ? "done"
                  : testStatus === "pending"
                    ? "pending"
                    : "active"
            }
            to={testStatus === "todo" || testStatus === "rerecord" ? "/assessment" : "/status"}
            disabled={testStatus === "locked"}
          />

          <StepCard
            icon={<PassportIcon />}
            title={t("card_passport_title")}
            desc={passportAvailable ? t("card_passport_desc") : t("card_passport_locked")}
            cta={t("view")}
            tone={passportAvailable ? "done" : "locked"}
            to={passportAvailable ? `/passport/${worker.passport_slug}` : "#"}
            disabled={!passportAvailable}
          />
        </div>
      </motion.div>
    </WorkerLayout>
  );
}

type Tone = "active" | "done" | "pending" | "locked";

const TONE_CARD: Record<Tone, string> = {
  active: "border-[oklch(0.68_0.16_55_/_0.35)] bg-[linear-gradient(135deg,#FFFAF5_0%,#FEF2E8_100%)]",
  done: "border-[oklch(0.55_0.18_260_/_0.25)] bg-[linear-gradient(135deg,#F5F8FF_0%,#EBF1FA_100%)]",
  pending: "border-[oklch(0.7_0.12_75_/_0.35)] bg-[#FFF8E6]",
  locked: "border-border bg-muted/40",
};

const TONE_ICON_BG: Record<Tone, string> = {
  active: "bg-primary/15 text-primary",
  done: "bg-[var(--color-navy-badge)] text-[var(--color-navy)]",
  pending: "bg-[#FFE9A0] text-[#8A5C00]",
  locked: "bg-muted text-muted-foreground",
};

const TONE_CTA: Record<Tone, string> = {
  active: "bg-primary text-primary-foreground",
  done: "bg-[var(--color-navy-badge)] text-[var(--color-navy)]",
  pending: "bg-[#FFE9A0] text-[#8A5C00]",
  locked: "hidden",
};

function StepCard({
  icon,
  title,
  desc,
  cta,
  tone,
  to,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  tone: Tone;
  to: string;
  disabled?: boolean;
}) {
  const Wrapper: React.ElementType = disabled ? "div" : Link;
  const wrapperProps = disabled ? {} : { to };

  return (
    <Wrapper
      {...wrapperProps}
      className={`block rounded-2xl border-2 p-4 transition-all ${TONE_CARD[tone]} ${
        disabled ? "opacity-60" : "hover:scale-[1.01] hover:shadow-[var(--shadow-card)]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${TONE_ICON_BG[tone]}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-foreground">{title}</h3>
          <p className="mt-0.5 line-clamp-2 text-[13px] text-muted-foreground">{desc}</p>
        </div>
        {!disabled && (
          <span className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${TONE_CTA[tone]}`}>
            {cta} →
          </span>
        )}
      </div>
    </Wrapper>
  );
}

function PersonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PassportIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4zm7 6a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm-3 6c0-1.66 1.34-3 3-3s3 1.34 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
