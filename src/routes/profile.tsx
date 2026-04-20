import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n";
import { useWorker, upsertWorkerProfile, type Trade } from "@/lib/worker-store";
import { WorkerLayout } from "@/components/WorkerLayout";
import { motion } from "framer-motion";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

// ─── Trade config ────────────────────────────────────────────────────────────
const TRADES: {
  value: Trade;
  labelKey: string;
  labelEnKey: string;
  icon: React.ReactNode;
  iconBg: string;
  iconStroke: string;
  activeBorder: string;
  activeBg: string;
  span?: boolean;
}[] = [
  {
    value: "electrician",
    labelKey: "trade_electrician",
    labelEnKey: "Electrician",
    iconBg: "#faeeda",
    iconStroke: "#854f0b",
    activeBorder: "#ba7517",
    activeBg: "#faeeda",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M13 10V3L4 14h7v7l9-11h-7z"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: "plumber",
    labelKey: "trade_plumber",
    labelEnKey: "Plumber",
    iconBg: "#e1f5ee",
    iconStroke: "#0f6e56",
    activeBorder: "#1d9e75",
    activeBg: "#e1f5ee",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: "welder",
    labelKey: "trade_welder",
    labelEnKey: "Welder",
    iconBg: "#faece7",
    iconStroke: "#993c1d",
    activeBorder: "#d85a30",
    activeBg: "#faece7",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A8 8 0 0117.657 18.657z"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: "carpenter",
    labelKey: "trade_carpenter",
    labelEnKey: "Carpenter",
    iconBg: "#eeedfe",
    iconStroke: "#534ab7",
    activeBorder: "#7f77dd",
    activeBg: "#eeedfe",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M15 7v11m-6-8v8M3 21h18M3 10l9-7 9 7"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: "ac_tech",
    labelKey: "trade_ac_tech",
    labelEnKey: "AC Technician",
    iconBg: "#e6f1fb",
    iconStroke: "#185fa5",
    activeBorder: "#378add",
    activeBg: "#e6f1fb",
    span: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

// ─── Input field wrapper component ───────────────────────────────────────────
function FieldWrap({
  icon,
  active,
  children,
}: {
  icon: React.ReactNode;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-[10px] border-[1.5px] px-3 py-[11px] transition-colors duration-150 ${
        active ? "border-blue-500" : "border-border"
      }`}
    >
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      {children}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
function ProfilePage() {
  const t = useT();
  const navigate = useNavigate();
  const { loading, isLoggedIn, worker, profile, refresh } = useWorker();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [trade, setTrade] = useState<Trade | "">("");
  const [experience, setExperience] = useState("");
  const [wage, setWage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isLoggedIn) navigate({ to: "/" });
  }, [loading, isLoggedIn, navigate]);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setCity(profile.city);
      setTrade(profile.trade);
      setExperience(String(profile.experience_years || ""));
      setWage(String(profile.daily_wage || ""));
    }
  }, [profile]);

  const isValid = name.trim() && city.trim() && trade && experience && wage;

  const handleSave = async () => {
    if (!isValid || !trade || !worker) return;
    setSaving(true);
    setError("");
    try {
      await upsertWorkerProfile({
        worker_id: worker.id,
        name: name.trim(),
        city: city.trim(),
        trade,
        experience_years: parseInt(experience) || 0,
        daily_wage: parseInt(wage) || 0,
      });
      await refresh();
      navigate({ to: "/worker/home" });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("error_generic"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkerLayout title={t("profile_title")}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="kp-container py-6"
      >
        {/* ── Header ── */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] kp-btn-primary"
          
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">{t("profile_title")}</h1>
            {worker && (
              <p className="text-xs text-muted-foreground">+91 {worker.phone}</p>
            )}
          </div>
        </div>

        <div className="mb-5 h-px bg-border" />

        <div className="space-y-5">

          {/* ── Name ── */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {t("name")} · पूरा नाम
            </label>
            <FieldWrap
              active={!!name}
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            >
              <input
                className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none"
                placeholder={t("name_placeholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FieldWrap>
          </div>

          {/* ── City ── */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {t("city")} · शहर
            </label>
            <FieldWrap
              active={!!city}
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" />
                </svg>
              }
            >
              <input
                className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none"
                placeholder={t("city_placeholder")}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </FieldWrap>
          </div>

          {/* ── Trade selector ── */}
          <div>
            <label className="mb-2.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {t("trade")} · ट्रेड / स्किल
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TRADES.map((tr) => {
                const selected = trade === tr.value;
                return (
                  <button
                    key={tr.value}
                    onClick={() => setTrade(tr.value)}
                    className={`relative flex flex-col items-center gap-2 rounded-[12px] border-[1.5px] px-2 py-3.5 text-center transition-all duration-150 ${
                      tr.span ? "col-span-2" : ""
                    } ${
                      selected
                        ? "border-[2px]"
                        : "border-border bg-card hover:bg-muted/50"
                    }`}
                    style={
                      selected
                        ? { borderColor: tr.activeBorder, backgroundColor: tr.activeBg }
                        : {}
                    }
                  >
                    {/* Selected checkmark */}
                    {selected && (
                      <span
                        className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full"
                        style={{ backgroundColor: tr.activeBorder }}
                      >
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                          <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3"
                            strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}

                    {/* Icon bubble */}
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                      style={{
                        backgroundColor: tr.iconBg,
                        color: tr.iconStroke,
                      }}
                    >
                      {tr.icon}
                    </div>

                    {/* Labels */}
                    <div>
                      <p className="text-[11px] font-semibold leading-tight text-foreground">
                        {t(tr.labelKey)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {tr.labelEnKey}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Experience + Wage ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {t("experience")}
              </label>
              <FieldWrap
                active={!!experience}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
              >
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={50}
                  className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none"
                  placeholder={t("experience_placeholder")}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
              </FieldWrap>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {t("daily_wage")}
              </label>
              <FieldWrap
                active={!!wage}
                icon={
                  <span className="text-[13px] font-bold text-muted-foreground">₹</span>
                }
              >
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none"
                  placeholder={t("wage_placeholder")}
                  value={wage}
                  onChange={(e) => setWage(e.target.value)}
                />
              </FieldWrap>
            </div>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        {/* ── Save button ── */}
        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className="kp-btn kp-btn-primary mt-8 flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {saving ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {t("loading")}
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t("save_profile")}
            </>
          )}
        </button>
      </motion.div>
    </WorkerLayout>
  );
}