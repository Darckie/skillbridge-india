import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { useWorker } from "@/lib/worker-store";
import { motion } from "framer-motion";

export const Route = createFileRoute("/assessment")({
  component: AssessmentPage,
});

function AssessmentPage() {
  const t = useT();
  const navigate = useNavigate();
  const { profile, updateAssessment } = useWorker();
  const [hasVideo, setHasVideo] = useState(false);
  const [uploading, setUploading] = useState(false);

  const tradeKey = profile.trade ? `task_instruction_${profile.trade}` : "";
  const tradeLabel = profile.trade ? t(`trade_${profile.trade}`) : "";

  const handleUpload = () => {
    // Mock upload
    setUploading(true);
    setTimeout(() => {
      setHasVideo(true);
      setUploading(false);
    }, 1500);
  };

  const handleSubmit = () => {
    updateAssessment({
      trade: profile.trade as any,
      status: "pending_review",
      videoUrl: "mock://video.mp4",
      submittedAt: new Date().toISOString(),
    });
    navigate({ to: "/status" });
  };

  return (
    <div className="kp-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="kp-container py-8"
      >
        <h1 className="text-2xl font-bold">{t("assessment_title")}</h1>
        <span className="kp-badge kp-badge-primary mt-2">{tradeLabel}</span>

        {/* Task instructions card */}
        <div className="kp-card mt-6">
          <h2 className="text-base font-bold">{t("task_instructions")}</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {tradeKey ? t(tradeKey) : "Select a trade first"}
          </p>
        </div>

        {/* Video guidelines */}
        <div className="kp-card mt-4 bg-muted/50">
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {t("video_guidelines")}
          </p>
        </div>

        {/* Video upload area */}
        <div className="mt-6">
          {!hasVideo ? (
            <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-border bg-card p-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-primary">
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="kp-btn kp-btn-primary w-auto text-sm"
                >
                  {uploading ? t("uploading") : t("upload_video")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border-2 border-success/30 bg-success/5 p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-success">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="mt-3 text-sm font-semibold text-success">Video uploaded!</p>
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!hasVideo}
          className="kp-btn kp-btn-primary mt-6 disabled:opacity-40"
        >
          {t("submit_assessment")}
        </button>
      </motion.div>
    </div>
  );
}
