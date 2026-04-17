import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useWorker } from "@/lib/worker-store";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  component: LanguageSelect,
});

function LanguageSelect() {
  const { setLang } = useI18n();
  const navigate = useNavigate();
  const { loading, isLoggedIn } = useWorker();

  useEffect(() => {
    if (!loading && isLoggedIn) navigate({ to: "/worker/home" });
  }, [loading, isLoggedIn, navigate]);

  const pick = (lang: "hi" | "en") => {
    setLang(lang);
    navigate({ to: "/login" });
  };

  return (
    <div className="kp-screen items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="kp-container text-center"
      >
        {/* Logo */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-primary-foreground">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 className="text-2xl font-extrabold text-foreground">KaamProof</h1>

        <p className="mt-2 text-lg text-muted-foreground leading-snug">
          अपनी भाषा चुनें
        </p>
        <p className="text-sm text-muted-foreground">
          Choose your language
        </p>

        <div className="mt-10 space-y-3">
          <button
            onClick={() => pick("hi")}
            className="kp-btn kp-btn-primary text-lg"
          >
            हिन्दी (अनुशंसित)
          </button>
          <button
            onClick={() => pick("en")}
            className="kp-btn kp-btn-outline text-lg"
          >
            English
          </button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          आपकी स्किल, वेरिफाइड। · Your Skills, Verified.
        </p>
      </motion.div>
    </div>
  );
}
