import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { useWorker } from "@/lib/worker-store";
import { motion } from "framer-motion";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const t = useT();
  const navigate = useNavigate();
  const { updateProfile } = useWorker();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const clean = phone.replace(/\D/g, "");
    if (clean.length !== 10) {
      setError(t("phone_placeholder"));
      return;
    }
    updateProfile({ phone: clean });
    navigate({ to: "/otp" });
  };

  return (
    <div className="kp-screen items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="kp-container"
      >
        <div className="kp-card">
          <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
              <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h1 className="mt-4 text-xl font-bold">{t("phone_title")}</h1>

          <div className="mt-6">
            <label className="kp-label">{t("phone_title")}</label>
            <div className="flex items-center gap-2">
              <span className="flex h-12 items-center rounded-lg border-2 border-border bg-muted px-3 text-sm font-semibold text-muted-foreground">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className="kp-input flex-1"
                placeholder={t("phone_placeholder")}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </div>

          <button
            onClick={handleSubmit}
            disabled={phone.replace(/\D/g, "").length !== 10}
            className="kp-btn kp-btn-primary mt-6 disabled:opacity-40"
          >
            {t("send_otp")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
