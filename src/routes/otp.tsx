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
  const [countdown, setCountdown] = useState(45);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

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

  const filledCount = otp.filter(Boolean).length;

  return (
    <div className="kp-screen items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="kp-container"
      >
        <div className="kp-card">
          {/* Header */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-blue-50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">{t("otp_title")}</h1>
              <p className="text-xs text-muted-foreground">Verify your phone number</p>
            </div>
          </div>

          {/* Phone chip */}
          <div className="mb-5 flex items-center gap-2 rounded-[10px] bg-muted/50 px-3 py-2.5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0 text-muted-foreground">
              <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span className="text-sm text-muted-foreground">{t("otp_sent_to")}</span>
            <span className="text-sm font-semibold text-foreground">+91 {phone}</span>
          </div>

          {/* OTP inputs */}
          <div className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`h-[52px] w-11 rounded-[10px] border-2 bg-card text-center text-xl font-bold text-foreground outline-none transition-all
                  ${digit ? "border-blue-500 bg-blue-50/40" : "border-border focus:border-blue-500"}`}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
              />
            ))}
          </div>

          {/* Progress dots */}
          <div className="mt-3 flex justify-center gap-1.5">
            {otp.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${i < filledCount ? "bg-blue-500" : "bg-border"}`}
              />
            ))}
          </div>

          {error && (
            <p className="mt-3 text-center text-sm text-destructive">{error}</p>
          )}

          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            {t("mock_otp_hint")}
          </p>

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={filledCount !== 6 || loading}
            className="kp-btn kp-btn-primary mt-5 disabled:opacity-40"
          >
            {loading ? t("loading") : "Verify OTP · सत्यापित करें"}
          </button>

          {/* Resend row */}
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <span className="text-sm text-muted-foreground">Didn't receive?</span>
            <button
              disabled={countdown > 0}
              className="text-sm font-semibold text-blue-600 disabled:opacity-40"
            >
              {t("resend_otp")}
            </button>
            {countdown > 0 && (
              <span className="text-xs text-muted-foreground">
                (0:{String(countdown).padStart(2, "0")})
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
