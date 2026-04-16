import { createFileRoute } from "@tanstack/react-router";
import { useWorker } from "@/lib/worker-store";
import { useT } from "@/lib/i18n";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/passport/$slug")({
  component: PassportPage,
  head: () => ({
    meta: [
      { title: "Skill Passport — KaamProof" },
      { name: "description", content: "Verified Skill Passport issued by KaamProof." },
      { property: "og:title", content: "Skill Passport — KaamProof" },
      { property: "og:description", content: "Verified Skill Passport issued by KaamProof." },
    ],
  }),
});

function PassportPage() {
  const t = useT();
  const { profile, assessment } = useWorker();

  const passportUrl = typeof window !== "undefined" ? window.location.href : "";
  const levelLabel = assessment.level ? t(`level_${assessment.level}`) : "";
  const tradeLabel = profile.trade ? t(`trade_${profile.trade}`) : "";

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(
      `${profile.name} — ${tradeLabel} (${levelLabel})\n\n${t("verified_by")}\n${passportUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(passportUrl);
    } catch {
      // fallback
    }
  };

  return (
    <div className="kp-screen items-center justify-center py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="kp-container"
      >
        {/* Passport Card */}
        <div className="overflow-hidden rounded-3xl bg-card shadow-lg">
          {/* Header band */}
          <div className="bg-primary px-6 py-5 text-center">
            <div className="flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary-foreground">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-sm font-bold text-primary-foreground tracking-wide uppercase">
                {t("passport_title")}
              </span>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Name & Trade */}
            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-foreground">{profile.name || "Demo Worker"}</h1>
              <p className="mt-1 text-muted-foreground">{tradeLabel} · {profile.city || "Delhi"}</p>
            </div>

            {/* Level badge */}
            <div className="mt-5 flex justify-center">
              <div className="flex items-center gap-3 rounded-2xl bg-success/10 px-6 py-4">
                <div className="text-center">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("skill_level")}</p>
                  <p className="mt-1 text-2xl font-extrabold text-success">{levelLabel}</p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3].map((lvl) => (
                    <div
                      key={lvl}
                      className={`h-8 w-3 rounded-full ${
                        assessment.level && lvl <= assessment.level
                          ? "bg-success"
                          : "bg-border"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Capabilities */}
            {assessment.capabilities.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("capabilities")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {assessment.capabilities.map((cap) => (
                    <span key={cap} className="kp-badge kp-badge-primary">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Details row */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/50 px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground">{t("experience")}</p>
                <p className="text-lg font-bold">{profile.experienceYears || 0} yr</p>
              </div>
              <div className="rounded-xl bg-muted/50 px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground">{t("daily_wage")}</p>
                <p className="text-lg font-bold">₹{profile.dailyWage || 0}</p>
              </div>
            </div>

            {/* QR */}
            <div className="mt-6 flex flex-col items-center">
              <div className="rounded-2xl border-2 border-border bg-card p-4">
                <QRCodeSVG value={passportUrl || "https://kaamproof.app"} size={140} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t("verified_by")}</p>
            </div>
          </div>
        </div>

        {/* Share buttons */}
        <div className="mt-4 space-y-2">
          <button onClick={shareOnWhatsApp} className="kp-btn kp-btn-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            {t("share_whatsapp")}
          </button>
          <button onClick={copyLink} className="kp-btn kp-btn-outline">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            {t("copy_link")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
