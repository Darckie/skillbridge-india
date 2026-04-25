import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Trade =
  | "electrician"
  | "plumber"
  | "welder"
  | "carpenter"
  | "ac_tech"
  | "painter"
  | "mason"
  | "driver"
  | "security_guard";
export type AssessmentStatus = "pending_review" | "verified" | "needs_rerecord";

export interface WorkerRow {
  id: string;
  auth_user_id: string;
  phone: string;
  language: "hi" | "en";
  passport_slug: string | null;
}

export interface WorkerProfileRow {
  id: string;
  worker_id: string;
  name: string;
  city: string;
  trade: Trade;
  experience_years: number;
  daily_wage: number;
}

export interface AssessmentRow {
  id: string;
  worker_id: string;
  trade: Trade;
  video_url: string | null;
  video_path: string | null;
  status: AssessmentStatus;
  level: number | null;
  capabilities_json: string[];
  reviewer_mode: "human_only" | "ai_only" | "human_and_ai";
  reviewer_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface WorkerState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  worker: WorkerRow | null;
  profile: WorkerProfileRow | null;
  latestAssessment: AssessmentRow | null;
  refresh: () => Promise<void>;
  isLoggedIn: boolean;
  isProfileComplete: boolean;
}

const WorkerContext = createContext<WorkerState | null>(null);

export function WorkerProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [worker, setWorker] = useState<WorkerRow | null>(null);
  const [profile, setProfile] = useState<WorkerProfileRow | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<AssessmentRow | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async (uid: string) => {
    const { data: w } = await supabase
      .from("workers")
      .select("*")
      .eq("auth_user_id", uid)
      .maybeSingle();

    if (!w) {
      setWorker(null);
      setProfile(null);
      setLatestAssessment(null);
      return;
    }
    setWorker(w as WorkerRow);

    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from("worker_profiles").select("*").eq("worker_id", w.id).maybeSingle(),
      supabase
        .from("assessments")
        .select("*")
        .eq("worker_id", w.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    setProfile((p as WorkerProfileRow) ?? null);
    setLatestAssessment(
      a
        ? ({
            ...a,
            capabilities_json: Array.isArray(a.capabilities_json)
              ? (a.capabilities_json as string[])
              : [],
          } as AssessmentRow)
        : null,
    );
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    await loadAll(user.id);
  }, [user, loadAll]);

  useEffect(() => {
    // Set up listener BEFORE getSession (per Supabase best practice)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Defer DB calls outside the auth callback
        setTimeout(() => {
          loadAll(sess.user.id).finally(() => setLoading(false));
        }, 0);
      } else {
        setWorker(null);
        setProfile(null);
        setLatestAssessment(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        loadAll(sess.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [loadAll]);

  const value: WorkerState = {
    loading,
    session,
    user,
    worker,
    profile,
    latestAssessment,
    refresh,
    isLoggedIn: !!session,
    isProfileComplete: !!profile,
  };

  return <WorkerContext.Provider value={value}>{children}</WorkerContext.Provider>;
}

export function useWorker() {
  const ctx = useContext(WorkerContext);
  if (!ctx) throw new Error("useWorker must be used within WorkerProvider");
  return ctx;
}

// ---------- Mutation helpers ----------

export async function upsertWorkerProfile(input: {
  worker_id: string;
  name: string;
  city: string;
  trade: Trade;
  experience_years: number;
  daily_wage: number;
}) {
  const { data, error } = await supabase
    .from("worker_profiles")
    .upsert(input, { onConflict: "worker_id" })
    .select()
    .single();
  if (error) throw error;
  return data as WorkerProfileRow;
}

export async function createAssessment(input: {
  worker_id: string;
  trade: Trade;
  video_url: string | null;
  video_path: string | null;
}) {
  const { data, error } = await supabase
    .from("assessments")
    .insert({
      worker_id: input.worker_id,
      trade: input.trade,
      video_url: input.video_url,
      video_path: input.video_path,
      status: "pending_review",
      reviewer_mode: "human_and_ai",
      capabilities_json: [],
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateWorkerLanguage(workerId: string, language: "hi" | "en") {
  await supabase.from("workers").update({ language }).eq("id", workerId);
}

export function buildPassportSlug(workerName: string): string {
  const namePart = (workerName || "worker")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 14) || "worker";
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `kp-${namePart}-${digits}`;
}

export async function setPassportSlugIfMissing(
  workerId: string,
  workerName: string,
): Promise<string> {
  // Get current slug
  const { data: existing } = await supabase
    .from("workers")
    .select("passport_slug")
    .eq("id", workerId)
    .single();
  if (existing?.passport_slug) return existing.passport_slug;

  const slug = buildPassportSlug(workerName);
  await supabase.from("workers").update({ passport_slug: slug }).eq("id", workerId);
  return slug;
}
