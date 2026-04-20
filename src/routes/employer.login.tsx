import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { sendEmployerMockOtp } from "@/lib/employer-auth";
import { motion } from "framer-motion";

export const Route = createFileRoute("/employer/login")({
  component: EmployerLoginPage,
});

function EmployerLoginPage() {
  const t = useT();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const clean = phone.replace(/\D/g, "");
  const isValid = clean.length === 10;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await sendEmployerMockOtp(clean);
      navigate({ to: "/employer/otp", search: { phone: clean } });
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
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-[var(--color-navy-light)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-navy)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-navy-mid)]" />
            {t("employer_login_badge")}
          </div>
          <h1 className="text-lg font-semibold text-foreground">{t("employer_login_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("employer_login_subtitle")}
          </p>

          <div className="mt-5">
            <label className="kp-label">{t("phone_label")}</label>
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
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="kp-btn mt-5 w-full disabled:opacity-40"
            style={{ background: "var(--gradient-navy)", color: "white" }}
          >
            {loading ? t("sending") : t("send_otp")}
          </button>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            {t("employer_login_worker_q")}{" "}
            <Link to="/login" className="font-semibold text-[var(--color-navy-mid)]">
              {t("employer_login_worker_link")}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
