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
import type { Trade } from "@/lib/worker-store";

export interface EmployerProfile {
  id: string;
  auth_user_id: string;
  company_name: string;
  city: string;
  contact_name: string;
  phone: string;
}

export interface JobPost {
  id: string;
  employer_id: string;
  trade: Trade;
  city: string;
  title: string;
  wage_offered: number;
  description: string | null;
  status: "open" | "closed";
  created_at: string;
}

interface EmployerState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  employer: EmployerProfile | null;
  jobs: JobPost[];
  isLoggedIn: boolean;
  isProfileComplete: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<EmployerState | null>(null);

export function EmployerProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [employer, setEmployer] = useState<EmployerProfile | null>(null);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async (uid: string) => {
    const { data: e } = await supabase
      .from("employer_profiles")
      .select("*")
      .eq("auth_user_id", uid)
      .maybeSingle();

    if (!e) {
      setEmployer(null);
      setJobs([]);
      return;
    }
    setEmployer(e as EmployerProfile);

    const { data: j } = await supabase
      .from("job_posts")
      .select("*")
      .eq("employer_id", e.id)
      .order("created_at", { ascending: false });

    setJobs((j as JobPost[]) ?? []);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    await loadAll(user.id);
  }, [user, loadAll]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => {
          loadAll(sess.user.id).finally(() => setLoading(false));
        }, 0);
      } else {
        setEmployer(null);
        setJobs([]);
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

    return () => sub.subscription.unsubscribe();
  }, [loadAll]);

  return (
    <Ctx.Provider
      value={{
        loading,
        session,
        user,
        employer,
        jobs,
        isLoggedIn: !!session,
        isProfileComplete: !!employer,
        refresh,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useEmployer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEmployer must be used within EmployerProvider");
  return ctx;
}

// ── Mutations ──

export async function upsertEmployerProfile(input: {
  auth_user_id: string;
  company_name: string;
  city: string;
  contact_name: string;
  phone: string;
}) {
  const { data, error } = await supabase
    .from("employer_profiles")
    .upsert(input, { onConflict: "auth_user_id" })
    .select()
    .single();
  if (error) throw error;
  return data as EmployerProfile;
}

export async function createJobPost(input: {
  employer_id: string;
  trade: Trade;
  city: string;
  title: string;
  wage_offered: number;
  description?: string;
}) {
  const { data, error } = await supabase
    .from("job_posts")
    .insert({ ...input, status: "open" })
    .select()
    .single();
  if (error) throw error;
  return data as JobPost;
}

export async function setJobStatus(id: string, status: "open" | "closed") {
  const { error } = await supabase.from("job_posts").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function logEmployerAction(
  employer_id: string,
  worker_id: string,
  action: "view" | "call" | "whatsapp" | "hire",
) {
  await supabase.from("employer_actions").insert({ employer_id, worker_id, action });
}
