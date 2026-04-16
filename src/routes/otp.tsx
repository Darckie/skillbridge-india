import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useT } from "@/lib/i18n";
import { useWorker } from "@/lib/worker-store";
import { motion } from "framer-motion";

export const Route = createFileRoute("/otp")({
  component: OtpPage,
});

function OtpPage() {
  const t = useT();
  const navigate = useNavigate();
  const { profile, setLoggedIn } = useWorker();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
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

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join("");
    if (code.length !== 6) return;
    // Mock OTP: any 6-digit code works
    setLoggedIn(true);
    navigate({ to: "/profile" });
  };

  const code = otp.join("");

  return (
    <div className="kp-screen items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="kp-container"
      >
        <div className="kp-card">
          <h1 className="text-xl font-bold">{t("otp_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("otp_sent_to")} <span className="font-semibold text-foreground">+91 {profile.phone}</span>
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
            disabled={code.length !== 6}
            className="kp-btn kp-btn-primary mt-6 disabled:opacity-40"
          >
            {t("verify")}
          </button>

          <button className="kp-btn kp-btn-outline mt-2 text-sm">
            {t("resend_otp")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
