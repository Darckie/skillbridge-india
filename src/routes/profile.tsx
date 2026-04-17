import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n";
import { useWorker, upsertWorkerProfile, type Trade } from "@/lib/worker-store";
import { WorkerLayout } from "@/components/WorkerLayout";
import { motion } from "framer-motion";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

const TRADES: { value: Trade; labelKey: string }[] = [
  { value: "electrician", labelKey: "trade_electrician" },
  { value: "plumber", labelKey: "trade_plumber" },
  { value: "welder", labelKey: "trade_welder" },
  { value: "carpenter", labelKey: "trade_carpenter" },
  { value: "ac_tech", labelKey: "trade_ac_tech" },
];

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
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkerLayout title={t("profile_title")}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="kp-container py-6">
        <h1 className="text-2xl font-bold">{t("profile_title")}</h1>
        {worker && <p className="mt-1 text-sm text-muted-foreground">+91 {worker.phone}</p>}

        <div className="mt-6 space-y-5">
          <div>
            <label className="kp-label">{t("name")}</label>
            <input className="kp-input" placeholder={t("name_placeholder")} value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="kp-label">{t("city")}</label>
            <input className="kp-input" placeholder={t("city_placeholder")} value={city} onChange={(e) => setCity(e.target.value)} />
          </div>

          <div>
            <label className="kp-label">{t("trade")}</label>
            <div className="grid grid-cols-2 gap-2">
              {TRADES.map((tr) => (
                <button
                  key={tr.value}
                  onClick={() => setTrade(tr.value)}
                  className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${
                    trade === tr.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {t(tr.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="kp-label">{t("experience")}</label>
              <input type="number" inputMode="numeric" className="kp-input" placeholder={t("experience_placeholder")} value={experience} onChange={(e) => setExperience(e.target.value)} />
            </div>
            <div>
              <label className="kp-label">{t("daily_wage")}</label>
              <input type="number" inputMode="numeric" className="kp-input" placeholder={t("wage_placeholder")} value={wage} onChange={(e) => setWage(e.target.value)} />
            </div>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <button onClick={handleSave} disabled={!isValid || saving} className="kp-btn kp-btn-primary mt-8 disabled:opacity-40">
          {saving ? t("loading") : t("save_profile")}
        </button>
      </motion.div>
    </WorkerLayout>
  );
}
