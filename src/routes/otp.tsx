import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { useT, useI18n } from "@/lib/i18n";
import { verifyMockOtp } from "@/lib/auth";
import { motion } from "framer-motion";

const searchSchema = z.object({
  phone: z.string().min(10).max(10),
});

export const Route = createFileRoute("/otp")({
  component: OtpPage,
  validateSearch: searchSchema,
});

function OtpPage() {
  const t = useT();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const { phone } = Route.useSearch();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      await verifyMockOtp(phone, code, lang);
      navigate({ to: "/worker/home" });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("otp_invalid"));
    } finally {
      setLoading(false);
    }
  };

  const code = otp.join("");

  return (
    <div className="kp-screen items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="kp-container">
        <div className="kp-card">
          <h1 className="text-xl font-bold">{t("otp_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("otp_sent_to")} <span className="font-semibold text-foreground">+91 {phone}</span>
          </p>

          <div className="mt-6 flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="h-14 w-11 rounded-xl border-2 border-border bg-card text-center text-xl font-bold text-foreground outline-none transition-colors focus:border-primary"
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
              />
            ))}
          </div>

          {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t("mock_otp_hint")}
          </p>

          <button
            onClick={handleVerify}
            disabled={code.length !== 6 || loading}
            className="kp-btn kp-btn-primary mt-6 disabled:opacity-40"
          >
            {loading ? t("loading") : t("verify")}
          </button>

          <button className="kp-btn kp-btn-outline mt-2 text-sm">{t("resend_otp")}</button>
        </div>
      </motion.div>
    </div>
  );
}
