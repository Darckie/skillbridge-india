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
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="kp-container text-center"
      >
        {/* Logo */}
        <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-[20px]  kp-btn-primary shadow-[0_4px_16px_rgba(37,99,235,0.3)]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-white">
            <path
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Eyebrow */}
        <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Verified Skills Platform
        </p>

        <h1 className="text-[28px] font-bold tracking-tight text-foreground">KaamProof</h1>

        {/* Divider accent */}
        <div className="mx-auto my-3 h-[2px] w-10 rounded-full bg-blue-500/50" />

        <p className="text-lg font-semibold text-foreground">अपनी भाषा चुनें</p>
        <p className="mt-0.5 text-sm text-muted-foreground">Choose your language to continue</p>

        {/* Language Buttons */}
        <div className="mt-8 space-y-3">
          <button
            onClick={() => pick("hi")}
            className="kp-btn bg-blue-600 text-white flex items-center justify-center gap-2 text-[16px]"
          >
            {/* <span className="text-lg">🇮🇳</span> */}
            हिन्दी
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium">
              Recommended
            </span>
          </button>

          <button
            onClick={() => pick("en")}
            className="kp-btn kp-btn-outline flex items-center justify-center gap-2 text-[16px]"
          >
            {/* <span className="text-lg">🇬🇧</span> */}
            English
          </button>
        </div>

        <p className="mt-8 text-[11px] text-muted-foreground">
          आपकी स्किल, वेरिफाइड · Your Skills, Verified
        </p>
      </motion.div>
    </div>
  );
}
