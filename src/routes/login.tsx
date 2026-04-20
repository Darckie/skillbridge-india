import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { sendMockOtp } from "@/lib/auth";
import { motion } from "framer-motion";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const t = useT();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const clean = phone.replace(/\D/g, "");
  const isValid = clean.length === 10;
  const progress = (clean.length / 10) * 100;

  const handleSubmit = async () => {
    if (!isValid) return;

    setLoading(true);
    try {
      await sendMockOtp(clean);
      navigate({ to: "/otp", search: { phone: clean } });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("error_generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kp-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="kp-container"
      >
        <div className="kp-card">

          {/* Header */}
          <h1 className="text-lg font-semibold text-foreground">
            {t("login_title")}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {t("login_subtitle")}
          </p>

          {/* Input */}
          <div className="mt-5">
            <label className="kp-label">
              {t("phone_label")}
            </label>

            <div className="mt-2 flex items-center gap-2">
              <span className="flex h-12 items-center rounded-lg border border-border bg-muted px-3 text-sm font-medium text-muted-foreground">
                +91
              </span>

              <input
                type="tel"
                maxLength={10}
                placeholder={t("phone_placeholder")}
                className="kp-input flex-1"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
              />
            </div>

            {/* Progress */}
            <div className="mt-2 h-[3px] bg-border rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${isValid ? "bg-green-500" : "bg-blue-500"
                  }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Status */}
            <div className="mt-1 flex justify-between text-xs">
              <p className={isValid ? "text-green-600" : "text-muted-foreground"}>
                {isValid
                  ? t("ready_to_send")
                  : `${10 - clean.length} ${t("digits_needed")}`}
              </p>
              <p className="text-muted-foreground">
                {clean.length} / 10
              </p>
            </div>

            {/* Error */}
            {error && (
              <p className="mt-1 text-xs text-destructive">{error}</p>
            )}
          </div>

          {/* Button */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="kp-btn kp-btn-primary mt-5 w-full disabled:opacity-40"
          >
            {loading ? t("sending") : t("send_otp")}
          </button>

          {/* Footer */}
          <div className="mt-4 text-center text-xs text-muted-foreground space-y-1">
            <p>{t("secure")}</p>
            <p>{t("no_password")}</p>
            <p>{t("otp_verification")}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}