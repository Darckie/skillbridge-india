import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { useWorker } from "@/lib/worker-store";
import { supabase } from "@/integrations/supabase/client";
import { runAiAssessment, levelFromRubric, capabilitiesForTrade } from "@/lib/ai-eval";

interface AssessmentDetail {
  id: string;
  worker_id: string;
  trade: string;
  video_url: string | null;
  video_path: string | null;
  status: string;
  ai_score_json: Record<string, unknown> | null;
  human_score_json: Record<string, unknown> | null;
  worker_name: string;
  city: string;
  experience_years: number;
}

export const Route = createFileRoute("/admin/review/$id")({
  component: AdminReviewDetail,
});

function AdminReviewDetail() {
  const t = useT();
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useWorker();
  const [data, setData] = useState<AssessmentDetail | null>(null);
  const [busy, setBusy] = useState(true);
  const [denied, setDenied] = useState(false);

  // Rubric form state
  const [taskDone, setTaskDone] = useState(true);
  const [safety, setSafety] = useState(4);
  const [neatness, setNeatness] = useState(4);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [signedVideo, setSignedVideo] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/" });
      return;
    }
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const allowed = roles?.some((r) => r.role === "admin" || r.role === "reviewer") ?? false;
      if (!allowed) {
        setDenied(true);
        setBusy(false);
        return;
      }

      const { data: a } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!a) {
        setBusy(false);
        return;
      }
      const { data: p } = await supabase
        .from("worker_profiles")
        .select("name, city, experience_years")
        .eq("worker_id", a.worker_id)
        .maybeSingle();

      setData({
        id: a.id,
        worker_id: a.worker_id,
        trade: a.trade,
        video_url: a.video_url,
        video_path: a.video_path,
        status: a.status,
        ai_score_json: (a.ai_score_json as Record<string, unknown>) ?? null,
        human_score_json: (a.human_score_json as Record<string, unknown>) ?? null,
        worker_name: p?.name ?? "—",
        city: p?.city ?? "—",
        experience_years: p?.experience_years ?? 0,
      });

      // Generate fresh signed URL for video
      if (a.video_path) {
        const { data: signed } = await supabase.storage
          .from("assessment-videos")
          .createSignedUrl(a.video_path, 60 * 60);
        setSignedVideo(signed?.signedUrl ?? null);
      }
      setBusy(false);
    })();
  }, [id, user, authLoading, navigate]);

  const handleRunAi = async () => {
    if (!data) return;
    setAiBusy(true);
    try {
      await runAiAssessment(data.id);
      // refresh
      const { data: a } = await supabase.from("assessments").select("ai_score_json").eq("id", data.id).single();
      setData({ ...data, ai_score_json: (a?.ai_score_json as Record<string, unknown>) ?? null });
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "AI eval failed");
    } finally {
      setAiBusy(false);
    }
  };

  const handleSubmit = async (action: "verify" | "rerecord") => {
    if (!data) return;
    setSubmitting(true);
    try {
      const human = { task_done_correctly: taskDone, safety, neatness, comments };
      let update: Record<string, unknown> = {
        human_score_json: human,
        reviewer_notes: comments,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      };
      if (action === "rerecord") {
        update.status = "needs_rerecord";
      } else {
        const level = levelFromRubric(human);
        const caps = capabilitiesForTrade(data.trade, level);
        update = {
          ...update,
          status: "verified",
          level,
          capabilities_json: caps,
        };
        // Generate human-readable slug if missing
        const namePart = (data.worker_name || "worker")
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z-]/g, "")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 14) || "worker";
        const digits = Math.floor(1000 + Math.random() * 9000);
        const slug = `kp-${namePart}-${digits}`;
        await supabase
          .from("workers")
          .update({ passport_slug: slug })
          .eq("id", data.worker_id)
          .is("passport_slug", null);
      }
      const { error } = await supabase.from("assessments").update(update as never).eq("id", data.id);
      if (error) throw error;
      navigate({ to: "/admin/review" });
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (busy || authLoading) {
    return (
      <div className="kp-screen items-center justify-center">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }
  if (denied) {
    return (
      <div className="kp-screen items-center justify-center">
        <p className="text-muted-foreground">Access denied</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="kp-screen items-center justify-center">
        <p className="text-muted-foreground">Not found</p>
      </div>
    );
  }

  return (
    <div className="kp-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="kp-container flex h-14 items-center gap-3 py-0">
          <Link to="/admin/review" className="text-sm text-primary">← Back</Link>
          <h1 className="text-base font-bold">{data.worker_name}</h1>
        </div>
      </header>

      <div className="kp-container py-6 space-y-4">
        <div className="kp-card">
          <p className="text-sm text-muted-foreground">
            {t(`trade_${data.trade}`)} · {data.city} · {data.experience_years} yr
          </p>
        </div>

        {/* Video */}
        <div className="kp-card">
          <h2 className="text-sm font-bold mb-2">Video</h2>
          {signedVideo ? (
            <video controls className="w-full rounded-lg" src={signedVideo} />
          ) : (
            <p className="text-sm text-muted-foreground">No video available</p>
          )}
        </div>

        {/* AI score */}
        <div className="kp-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">{t("ai_score")}</h2>
            <button onClick={handleRunAi} disabled={aiBusy} className="text-xs text-primary disabled:opacity-50">
              {aiBusy ? t("loading") : t("run_ai")}
            </button>
          </div>
          {data.ai_score_json ? (
            <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs">
              {JSON.stringify(data.ai_score_json, null, 2)}
            </pre>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">Not run yet</p>
          )}
        </div>

        {/* Rubric */}
        <div className="kp-card">
          <h2 className="text-sm font-bold mb-3">{t("human_score")}</h2>

          <div className="space-y-4">
            <div>
              <label className="kp-label">{t("rubric_task_done")}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTaskDone(true)}
                  className={`flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium ${taskDone ? "border-success bg-success/10 text-success" : "border-border"}`}
                >
                  {t("yes")}
                </button>
                <button
                  onClick={() => setTaskDone(false)}
                  className={`flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium ${!taskDone ? "border-destructive bg-destructive/10 text-destructive" : "border-border"}`}
                >
                  {t("no")}
                </button>
              </div>
            </div>

            <RatingRow label={t("rubric_safety")} value={safety} onChange={setSafety} />
            <RatingRow label={t("rubric_neatness")} value={neatness} onChange={setNeatness} />

            <div>
              <label className="kp-label">{t("rubric_comments")}</label>
              <textarea
                className="kp-input min-h-[80px] py-2"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button onClick={() => handleSubmit("verify")} disabled={submitting} className="kp-btn kp-btn-success disabled:opacity-50">
          {t("approve_verified")}
        </button>
        <button onClick={() => handleSubmit("rerecord")} disabled={submitting} className="kp-btn kp-btn-outline disabled:opacity-50">
          {t("request_rerecord")}
        </button>
      </div>
    </div>
  );
}

function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <label className="kp-label">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 rounded-lg border-2 py-2 text-sm font-bold ${n === value ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground"}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
