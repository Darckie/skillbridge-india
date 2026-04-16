import { createContext, useContext, useState, type ReactNode } from "react";

export type Trade = "electrician" | "plumber" | "welder" | "carpenter" | "ac_tech";

export type AssessmentStatus = "none" | "pending_review" | "approved" | "needs_rerecord";

export interface WorkerProfile {
  phone: string;
  name: string;
  city: string;
  trade: Trade | "";
  experienceYears: number;
  dailyWage: number;
  lang: "hi" | "en";
}

export interface Assessment {
  id: string;
  trade: Trade;
  status: AssessmentStatus;
  videoUrl: string | null;
  level: 1 | 2 | 3 | null;
  capabilities: string[];
  submittedAt: string | null;
  reviewedAt: string | null;
}

interface WorkerState {
  isLoggedIn: boolean;
  profile: WorkerProfile;
  assessment: Assessment;
  setLoggedIn: (v: boolean) => void;
  updateProfile: (p: Partial<WorkerProfile>) => void;
  updateAssessment: (a: Partial<Assessment>) => void;
  passportSlug: string;
}

const WorkerContext = createContext<WorkerState | null>(null);

const defaultProfile: WorkerProfile = {
  phone: "",
  name: "",
  city: "",
  trade: "",
  experienceYears: 0,
  dailyWage: 0,
  lang: "hi",
};

const defaultAssessment: Assessment = {
  id: "demo-" + Math.random().toString(36).slice(2, 8),
  trade: "electrician",
  status: "none",
  videoUrl: null,
  level: null,
  capabilities: [],
  submittedAt: null,
  reviewedAt: null,
};

export function WorkerProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [profile, setProfile] = useState<WorkerProfile>(defaultProfile);
  const [assessment, setAssessment] = useState<Assessment>(defaultAssessment);

  const updateProfile = (p: Partial<WorkerProfile>) =>
    setProfile((prev) => ({ ...prev, ...p }));

  const updateAssessment = (a: Partial<Assessment>) =>
    setAssessment((prev) => ({ ...prev, ...a }));

  const passportSlug = profile.phone
    ? `kp-${profile.phone.slice(-4)}-${assessment.id.slice(-4)}`
    : "demo";

  return (
    <WorkerContext.Provider
      value={{
        isLoggedIn,
        profile,
        assessment,
        setLoggedIn,
        updateProfile,
        updateAssessment,
        passportSlug,
      }}
    >
      {children}
    </WorkerContext.Provider>
  );
}

export function useWorker() {
  const ctx = useContext(WorkerContext);
  if (!ctx) throw new Error("useWorker must be used within WorkerProvider");
  return ctx;
}
