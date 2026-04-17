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

  return (
    <WorkerLayout showBack={false} title="KaamProof">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="kp-container py-6"
      >
        <h1 className="text-2xl font-bold">{t("home_title")}{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("home_subtitle")}</p>

        {/* Step indicator */}
        <div className="mt-6 flex items-center gap-2">
          {[t("step_profile"), t("step_test"), t("step_result")].map((label, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      done
                        ? "bg-success text-success-foreground"
                        : active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <span className={`text-[10px] ${active || done ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </div>
                {i < 2 && <div className={`h-0.5 flex-1 ${i < currentStep ? "bg-success" : "bg-border"}`} />}
              </div>
            );
          })}
        </div>

        {/* Cards */}
        <div className="mt-8 space-y-3">
          <StepCard
            title={t("card_profile_title")}
            desc={profileDone ? t("card_profile_done") : t("card_profile_desc")}
            cta={profileDone ? t("view") : t("complete")}
            tone={profileDone ? "done" : "active"}
            to="/profile"
          />

          <StepCard
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
            cta={testStatus === "pending" ? t("view") : testStatus === "verified" ? t("view") : t("go")}
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

function StepCard({
  title,
  desc,
  cta,
  tone,
  to,
  disabled,
}: {
  title: string;
  desc: string;
  cta: string;
  tone: "active" | "done" | "pending" | "locked";
  to: string;
  disabled?: boolean;
}) {
  const toneStyles = {
    active: "border-primary/30 bg-card",
    done: "border-success/40 bg-success/5",
    pending: "border-primary/30 bg-primary/5",
    locked: "border-border bg-muted/40 opacity-60",
  }[tone];

  const Wrapper: React.ElementType = disabled ? "div" : Link;
  const wrapperProps = disabled ? {} : { to };

  return (
    <Wrapper
      {...wrapperProps}
      className={`block rounded-2xl border-2 p-4 transition-colors ${toneStyles} ${disabled ? "" : "hover:border-primary"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
        </div>
        {!disabled && (
          <span className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
            {cta} →
          </span>
        )}
      </div>
    </Wrapper>
  );
}
