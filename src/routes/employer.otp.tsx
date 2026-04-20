import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { useT } from "@/lib/i18n";
import { verifyEmployerMockOtp } from "@/lib/employer-auth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const searchSchema = z.object({ phone: z.string().min(10).max(10) });

export const Route = createFileRoute("/employer/otp")({
  component: EmployerOtpPage,
  validateSearch: searchSchema,
});

function EmployerOtpPage() {
  const t = useT();
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
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
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
      await verifyEmployerMockOtp(phone, code);
      // Check if employer profile exists
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: ep } = await supabase
          .from("employer_profiles")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();
        navigate({ to: ep ? "/employer/home" : "/employer/profile" });
      } else {
        navigate({ to: "/employer/profile" });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("otp_invalid"));
    } finally {
      setLoading(false);
    }
  };

  const filled = otp.filter(Boolean).length;

  return (
    <div className="kp-screen items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="kp-container"
      >
        <div className="kp-card">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-[var(--color-navy-light)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-navy)]">
            {t("employer_otp_badge")}
          </div>
          <h1 className="text-base font-semibold text-foreground">{t("otp_title")}</h1>

          <div className="my-4 flex items-center gap-2 rounded-[10px] bg-muted/50 px-3 py-2.5">
            <span className="text-sm text-muted-foreground">{t("otp_sent_to")}</span>
            <span className="text-sm font-semibold text-foreground">+91 {phone}</span>
          </div>

          <div className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`h-[52px] w-11 rounded-[10px] border-2 bg-card text-center text-xl font-bold text-foreground outline-none transition-all ${
                  digit ? "border-[var(--color-navy-mid)]" : "border-border focus:border-[var(--color-navy-mid)]"
                }`}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
              />
            ))}
          </div>

          {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}

          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            {t("mock_otp_hint")}
          </p>

          <button
            onClick={handleVerify}
            disabled={filled !== 6 || loading}
            className="kp-btn mt-5 disabled:opacity-40"
            style={{ background: "var(--gradient-navy)", color: "white" }}
          >
            {loading ? t("loading") : t("verify_otp")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
