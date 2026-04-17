import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n";
import { useWorker, createAssessment } from "@/lib/worker-store";
import { WorkerLayout } from "@/components/WorkerLayout";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

export const Route = createFileRoute("/assessment")({
  component: AssessmentPage,
});

function AssessmentPage() {
  const t = useT();
  const navigate = useNavigate();
  const { loading, isLoggedIn, worker, profile, refresh, user } = useWorker();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isLoggedIn) navigate({ to: "/" });
    if (!loading && isLoggedIn && !profile) navigate({ to: "/profile" });
  }, [loading, isLoggedIn, profile, navigate]);

  if (!profile || !worker || !user) {
    return (
      <div className="kp-screen items-center justify-center">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  const tradeKey = `task_instruction_${profile.trade}`;
  const tradeLabel = t(`trade_${profile.trade}`);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 100 * 1024 * 1024) {
        setError("Video too large (max 100MB)");
        return;
      }
      setFile(f);
      setError("");
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("assessment-videos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      // Get a signed URL (24h) so reviewers can play it
      const { data: signed } = await supabase.storage
        .from("assessment-videos")
        .createSignedUrl(path, 60 * 60 * 24);

      await createAssessment({
        worker_id: worker.id,
        trade: profile.trade,
        video_url: signed?.signedUrl ?? null,
        video_path: path,
      });

      await refresh();
      navigate({ to: "/status" });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <WorkerLayout title={t("assessment_title")}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="kp-container py-6">
        <h1 className="text-2xl font-bold">{t("assessment_title")}</h1>
        <span className="kp-badge kp-badge-primary mt-2">{tradeLabel}</span>

        <div className="kp-card mt-6">
          <h2 className="text-base font-bold">{t("task_instructions")}</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(tradeKey)}</p>
        </div>

        <div className="kp-card mt-4 bg-muted/50">
          <p className="whitespace-pre-line text-sm text-muted-foreground">{t("video_guidelines")}</p>
        </div>

        <div className="mt-6">
          {!file ? (
            <label className="flex flex-col items-center rounded-2xl border-2 border-dashed border-border bg-card p-10 cursor-pointer hover:border-primary">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-primary">
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="mt-4 text-sm font-semibold text-primary">{t("upload_video")}</span>
              <input type="file" accept="video/*" capture="environment" className="hidden" onChange={handleFile} />
            </label>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border-2 border-success/30 bg-success/5 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-success">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="mt-2 text-sm font-semibold text-success break-all px-2 text-center">{file.name}</p>
              <button onClick={() => setFile(null)} className="mt-2 text-xs text-muted-foreground underline">
                Choose another
              </button>
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <button onClick={handleSubmit} disabled={!file || uploading} className="kp-btn kp-btn-primary mt-6 disabled:opacity-40">
          {uploading ? t("uploading") : t("submit_assessment")}
        </button>
      </motion.div>
    </WorkerLayout>
  );
}
