import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { useWorker, type Trade } from "@/lib/worker-store";
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
  const { profile, updateProfile } = useWorker();

  const [name, setName] = useState(profile.name);
  const [city, setCity] = useState(profile.city);
  const [trade, setTrade] = useState<Trade | "">(profile.trade);
  const [experience, setExperience] = useState(profile.experienceYears ? String(profile.experienceYears) : "");
  const [wage, setWage] = useState(profile.dailyWage ? String(profile.dailyWage) : "");

  const isValid = name.trim() && city.trim() && trade && experience && wage;

  const handleSave = () => {
    if (!isValid || !trade) return;
    updateProfile({
      name: name.trim(),
      city: city.trim(),
      trade,
      experienceYears: parseInt(experience) || 0,
      dailyWage: parseInt(wage) || 0,
    });
    navigate({ to: "/assessment" });
  };

  return (
    <div className="kp-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="kp-container py-8"
      >
        <h1 className="text-2xl font-bold">{t("profile_title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">+91 {profile.phone}</p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="kp-label">{t("name")}</label>
            <input
              className="kp-input"
              placeholder={t("name_placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="kp-label">{t("city")}</label>
            <input
              className="kp-input"
              placeholder={t("city_placeholder")}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
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
              <input
                type="number"
                inputMode="numeric"
                className="kp-input"
                placeholder={t("experience_placeholder")}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>
            <div>
              <label className="kp-label">{t("daily_wage")}</label>
              <input
                type="number"
                inputMode="numeric"
                className="kp-input"
                placeholder={t("wage_placeholder")}
                value={wage}
                onChange={(e) => setWage(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!isValid}
          className="kp-btn kp-btn-primary mt-8 disabled:opacity-40"
        >
          {t("save_profile")}
        </button>
      </motion.div>
    </div>
  );
}
