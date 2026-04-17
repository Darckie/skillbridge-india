import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { useWorker } from "@/lib/worker-store";
import { signOut } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

interface QueueItem {
  id: string;
  trade: string;
  created_at: string;
  worker_name: string;
  city: string;
}

export const Route = createFileRoute("/admin/review")({
  component: AdminReview,
});

function AdminReview() {
  const t = useT();
  const navigate = useNavigate();
  const { loading, isLoggedIn, user } = useWorker();
  const [isReviewer, setIsReviewer] = useState<boolean | null>(null);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn || !user) {
      navigate({ to: "/" });
      return;
    }
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const allowed = roles?.some((r) => r.role === "admin" || r.role === "reviewer") ?? false;
      setIsReviewer(allowed);
      if (!allowed) {
        setBusy(false);
        return;
      }
      const { data: queue } = await supabase
        .from("assessments")
        .select("id, trade, created_at, worker_id")
        .eq("status", "pending_review")
        .order("created_at", { ascending: true });
      if (queue && queue.length) {
        const workerIds = queue.map((q) => q.worker_id);
        const { data: profs } = await supabase
          .from("worker_profiles")
          .select("worker_id, name, city")
          .in("worker_id", workerIds);
        const profMap = new Map(profs?.map((p) => [p.worker_id, p]) ?? []);
        setItems(
          queue.map((q) => ({
            id: q.id,
            trade: q.trade,
            created_at: q.created_at,
            worker_name: profMap.get(q.worker_id)?.name ?? "—",
            city: profMap.get(q.worker_id)?.city ?? "—",
          })),
        );
      }
      setBusy(false);
    })();
  }, [loading, isLoggedIn, user, navigate]);

  if (loading || busy) {
    return (
      <div className="kp-screen items-center justify-center">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (!isReviewer) {
    return (
      <div className="kp-screen items-center justify-center">
        <div className="kp-container text-center">
          <h1 className="text-xl font-bold">Access denied</h1>
          <p className="mt-2 text-muted-foreground">You need a reviewer or admin role to access this page.</p>
          <p className="mt-4 text-xs text-muted-foreground">
            Run the following SQL in Lovable Cloud to grant yourself reviewer access:
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-left text-xs">
            INSERT INTO public.user_roles (user_id, role){"\n"}VALUES ('{user?.id}', 'admin');
          </pre>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
            className="kp-btn kp-btn-outline mt-6"
          >
            {t("logout")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="kp-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="kp-container flex h-14 items-center justify-between py-0">
          <h1 className="text-base font-bold">{t("admin_review_title")}</h1>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t("logout")}
          </button>
        </div>
      </header>

      <div className="kp-container py-6">
        {items.length === 0 ? (
          <div className="kp-card text-center text-muted-foreground">{t("admin_no_pending")}</div>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <Link
                key={it.id}
                to="/admin/review/$id"
                params={{ id: it.id }}
                className="block rounded-2xl border-2 border-border bg-card p-4 hover:border-primary"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">{it.worker_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(`trade_${it.trade}`)} · {it.city}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(it.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
