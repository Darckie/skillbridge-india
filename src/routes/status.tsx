import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { useWorker } from "@/lib/worker-store";
import { motion } from "framer-motion";

export const Route = createFileRoute("/status")({
  component: StatusPage,
});

function StatusPage() {
  const t = useT();
  const navigate = useNavigate();
  const { assessment, passportSlug, updateAssessment } = useWorker();

  // For demo: let users simulate approval
  const simulateApproval = () => {
    updateAssessment({
      status: "approved",
      level: 2,
      capabilities: ["Wiring", "Safety protocols", "3-phase systems"],
      reviewedAt: new Date().toISOString(),
    });
  };

  const isPending = assessment.status === "pending_review";
  const isApproved = assessment.status === "approved";
  const needsRerecord = assessment.status === "needs_rerecord";

  return (
    <div className="kp-screen items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="kp-container text-center"
      >
        <div className="kp-card">
          {isPending && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <motion.svg
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-primary"
                >
                  <path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-5.07l-2.83 2.83M9.76 14.24l-2.83 2.83m11.14 0l-2.83-2.83M9.76 9.76L6.93 6.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </motion.svg>
              </div>
              <h1 className="mt-5 text-xl font-bold">{t("status_pending")}</h1>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {t("status_pending_desc")}
              </p>

              {/* Demo button */}
              <button
                onClick={simulateApproval}
                className="kp-btn kp-btn-outline mt-6 text-sm"
              >
                🎯 Demo: Simulate Approval
              </button>
            </>
          )}

          {isApproved && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-success">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1 className="mt-5 text-xl font-bold text-success">{t("status_approved")}</h1>
              <div className="mt-3">
                <span className="kp-badge kp-badge-success text-base">
                  Level {assessment.level} — {t(`level_${assessment.level}`)}
                </span>
              </div>

              <button
                onClick={() => navigate({ to: "/passport/$slug", params: { slug: passportSlug } })}
                className="kp-btn kp-btn-primary mt-6"
              >
                {t("view_passport")}
              </button>
            </>
          )}

          {needsRerecord && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-destructive">
                  <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1 className="mt-5 text-xl font-bold text-destructive">{t("status_needs_rerecord")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("status_needs_rerecord_desc")}</p>

              <button
                onClick={() => navigate({ to: "/assessment" })}
                className="kp-btn kp-btn-primary mt-6"
              >
                {t("rerecord")}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
