import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useT } from "@/lib/i18n";
import { useWorker } from "@/lib/worker-store";
import { motion } from "framer-motion";
import { signOut } from "@/lib/auth";

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
  const testStatus: "locked" | "todo" | "pending" | "verified" | "rerecord" = !profileDone
    ? "locked"
    : !assessment
      ? "todo"
      : assessment.status === "pending_review"
        ? "pending"
        : assessment.status === "verified"
          ? "verified"
          : "rerecord";

  const verified = testStatus === "verified";
  const passportAvailable = verified && !!worker.passport_slug;
  const currentStep = !profileDone ? 0 : verified ? 2 : 1;
  const firstName = profile?.name ? profile.name.split(" ")[0] : null;
  const tradeLabel = profile ? t(`trade_${profile.trade}`) : "";

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="kp-screen pb-24">
      {/* Top bar — logo + Verified pill */}
      <header className="border-b border-border bg-card">
        <div className="kp-container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
              <ShieldIcon className="text-white" />
            </div>
            <span className="text-[19px] font-extrabold tracking-tight text-foreground">
              KaamProof
            </span>
          </div>
          {verified ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-verified-light)] px-2.5 py-1.5 text-xs font-bold text-[var(--color-verified-mid)]">
              ✓ Verified
            </span>
          ) : (
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {t("logout")}
            </button>
          )}
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="kp-container py-6"
      >
        {/* Greeting */}
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-foreground">
          {t("home_title")}
          {firstName ? (
            <>
              , <span className="text-primary">{firstName}</span>{" "}
              <span className="inline-block">👋</span>
            </>
          ) : (
            " 👋"
          )}
        </h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">{t("home_subtitle")}</p>

        {/* Progress card */}
        <div className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/80">
            Your Progress
          </p>
          <div className="mt-4 flex items-start">
            {[
              { label: t("step_profile"), short: "Profile" },
              { label: t("step_test"), short: "Skill Test" },
              { label: t("card_passport_title").includes("Passport") ? "Passport" : t("step_result"), short: "Passport" },
            ].map((s, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={s.short} className="flex flex-1 items-start">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold transition-all ${
                        done
                          ? "bg-[var(--color-verified)] text-white"
                          : active
                            ? "bg-primary text-primary-foreground ring-4 ring-[oklch(0.68_0.16_55_/_0.18)]"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    <span
                      className={`whitespace-nowrap text-[12px] ${
                        done
                          ? "font-semibold text-[var(--color-verified-mid)]"
                          : active
                            ? "font-semibold text-primary"
                            : "text-muted-foreground"
                      }`}
                    >
                      {s.short}
                    </span>
                  </div>
                  {i < 2 && (
                    <div
                      className={`mt-[22px] h-[3px] flex-1 mx-1 rounded-full ${
                        i < currentStep ? "bg-[var(--color-verified)]" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* STEPS section */}
        <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
          Steps
        </p>

        <div className="mt-3 space-y-3">
          <StepCard
            icon={<PersonIcon />}
            title={profileDone ? "Profile Complete" : t("card_profile_title")}
            desc={
              profileDone && profile
                ? `${tradeLabel} · ${profile.city} · ${profile.experience_years} yrs`
                : t("card_profile_desc")
            }
            cta={profileDone ? "" : t("complete")}
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
            cta={
              testStatus === "verified"
                ? ""
                : testStatus === "pending"
                  ? "View"
                  : testStatus === "locked"
                    ? ""
                    : "Start"
            }
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
            title="Skill Passport"
            desc={passportAvailable ? t("card_passport_desc") : t("card_passport_locked")}
            cta={passportAvailable ? t("view") : ""}
            tone={passportAvailable ? "done" : "locked"}
            to={passportAvailable ? `/passport/${worker.passport_slug}` : "#"}
            disabled={!passportAvailable}
          />
        </div>
      </motion.div>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur">
        <div className="kp-container flex h-16 items-center justify-around py-0">
          <TabItem icon={<HomeIcon />} label="Home" active to="/worker/home" />
          <TabItem icon={<PersonIcon />} label="Profile" to="/profile" />
          <TabItem
            icon={<PassportIcon />}
            label="Passport"
            to={passportAvailable ? `/passport/${worker.passport_slug}` : "#"}
            disabled={!passportAvailable}
          />
        </div>
      </nav>
    </div>
  );
}

type Tone = "active" | "done" | "pending" | "locked";

const TONE_CARD: Record<Tone, string> = {
  active:
    "border-[oklch(0.68_0.16_55_/_0.4)] bg-[linear-gradient(135deg,#FFF8F0_0%,#FEEDD9_100%)]",
  done: "border-[oklch(0.58_0.17_145_/_0.35)] bg-[linear-gradient(135deg,#F2FBF4_0%,#DCFCE7_100%)]",
  pending: "border-[oklch(0.7_0.12_75_/_0.35)] bg-[#FFF8E6]",
  locked: "border-border bg-muted/50",
};

const TONE_ICON_BG: Record<Tone, string> = {
  active: "bg-primary/15 text-primary",
  done: "bg-[var(--color-verified-light)] text-[var(--color-verified-mid)]",
  pending: "bg-[#FFE9A0] text-[#8A5C00]",
  locked: "bg-muted text-muted-foreground/70",
};

const TONE_CTA: Record<Tone, string> = {
  active: "bg-primary text-primary-foreground",
  done: "bg-[var(--color-verified-light)] text-[var(--color-verified-mid)]",
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
        disabled ? "opacity-60" : "hover:shadow-[var(--shadow-card)]"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${TONE_ICON_BG[tone]}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={`text-[16px] font-extrabold ${
              tone === "locked" ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            {title}
          </h3>
          <p
            className={`mt-0.5 line-clamp-2 text-[13.5px] ${
              tone === "locked" ? "text-muted-foreground/70" : "text-muted-foreground"
            }`}
          >
            {desc}
          </p>
        </div>
        {!disabled && cta && (
          <span
            className={`shrink-0 rounded-lg px-3 py-2 text-[12px] font-bold ${TONE_CTA[tone]}`}
          >
            {cta} →
          </span>
        )}
      </div>
    </Wrapper>
  );
}

function TabItem({
  icon,
  label,
  active,
  to,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  to: string;
  disabled?: boolean;
}) {
  const cls = `flex flex-col items-center gap-0.5 px-4 py-1 ${
    disabled
      ? "text-muted-foreground/40"
      : active
        ? "text-primary"
        : "text-muted-foreground"
  }`;
  if (disabled) {
    return (
      <div className={cls}>
        {icon}
        <span className="text-[11px] font-semibold">{label}</span>
      </div>
    );
  }
  return (
    <Link to={to} className={cls}>
      {icon}
      <span className="text-[11px] font-semibold">{label}</span>
    </Link>
  );
}

// ── Icons ────────────────────────────────────────────────────

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2l8 3v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V5l8-3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PassportIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 8h6M9 12h6M9 16h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 11l9-8 9 8M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
