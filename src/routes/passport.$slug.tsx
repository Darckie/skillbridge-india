import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import type { Trade } from "@/lib/worker-store";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";

interface PublicPassport {
  name: string;
  city: string;
  trade: Trade;
  experience_years: number;
  daily_wage: number;
  level: number | null;
  capabilities: string[];
}

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
  const { slug } = Route.useParams();
  const [data, setData] = useState<PublicPassport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [passportUrl, setPassportUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setPassportUrl(window.location.href);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: w } = await supabase
        .from("workers")
        .select("id")
        .eq("passport_slug", slug)
        .maybeSingle();
      if (!w) {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }
      const [{ data: p }, { data: a }] = await Promise.all([
        supabase.from("worker_profiles").select("*").eq("worker_id", w.id).maybeSingle(),
        supabase
          .from("assessments")
          .select("*")
          .eq("worker_id", w.id)
          .eq("status", "verified")
          .order("reviewed_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      if (!p) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setData({
        name: p.name,
        city: p.city,
        trade: p.trade as Trade,
        experience_years: p.experience_years,
        daily_wage: p.daily_wage,
        level: a?.level ?? null,
        capabilities: Array.isArray(a?.capabilities_json) ? (a.capabilities_json as string[]) : [],
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const tradeLabel = data ? t(`trade_${data.trade}`) : "";
  const levelLabel = data?.level ? t(`level_${data.level}`) : "";

  const shareOnWhatsApp = () => {
    if (!data) return;
    const text = encodeURIComponent(
      `${data.name} — ${tradeLabel} (${levelLabel})\n\n${t("verified_by")}\n${passportUrl}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(passportUrl);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className="kp-screen items-center justify-center">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }
  if (notFound || !data) {
    return (
      <div className="kp-screen items-center justify-center">
        <div className="kp-container text-center">
          <h1 className="text-2xl font-bold">404</h1>
          <p className="mt-2 text-muted-foreground">Passport not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kp-screen items-center justify-center py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="kp-container"
      >
        <div className="overflow-hidden rounded-3xl bg-card shadow-lg">
          <div className="bg-primary px-6 py-5 text-center">
            <div className="flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary-foreground">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span suppressHydrationWarning className="text-sm font-bold text-primary-foreground tracking-wide uppercase">
                {t("passport_title")}
              </span>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-foreground">{data.name}</h1>
              <p suppressHydrationWarning className="mt-1 text-muted-foreground">{tradeLabel} · {data.city}</p>
            </div>

            <div className="mt-5 flex justify-center">
              <div className="flex items-center gap-3 rounded-2xl bg-success/10 px-6 py-4">
                <div className="text-center">
                  <p suppressHydrationWarning className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("skill_level")}</p>
                  <p suppressHydrationWarning className="mt-1 text-2xl font-extrabold text-success">{levelLabel || "—"}</p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3].map((lvl) => (
                    <div key={lvl} className={`h-8 w-3 rounded-full ${data.level && lvl <= data.level ? "bg-success" : "bg-border"}`} />
                  ))}
                </div>
              </div>
            </div>

            {data.capabilities.length > 0 && (
              <div className="mt-5">
                <p suppressHydrationWarning className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("capabilities")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.capabilities.map((cap: string) => (
                    <span key={cap} className="kp-badge kp-badge-primary">{cap}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/50 px-4 py-3 text-center">
                <p suppressHydrationWarning className="text-xs text-muted-foreground">{t("experience")}</p>
                <p className="text-lg font-bold">{data.experience_years} yr</p>
              </div>
              <div className="rounded-xl bg-muted/50 px-4 py-3 text-center">
                <p suppressHydrationWarning className="text-xs text-muted-foreground">{t("daily_wage")}</p>
                <p className="text-lg font-bold">₹{data.daily_wage}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center">
              <div className="rounded-2xl border-2 border-border bg-card p-4">
                <QRCodeSVG value={passportUrl || "https://kaamproof.app"} size={140} />
              </div>
              <p suppressHydrationWarning className="mt-2 text-xs text-muted-foreground">{t("verified_by")}</p>
            </div>
          </div>
        </div>

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
