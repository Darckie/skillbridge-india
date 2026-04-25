import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n";
import { useEmployer, upsertEmployerProfile } from "@/lib/employer-store";
import { motion } from "framer-motion";

export const Route = createFileRoute("/employer/profile")({
  component: EmployerProfilePage,
});

function EmployerProfilePage() {
  const t = useT();
  const navigate = useNavigate();
  const { loading, isLoggedIn, user, employer, refresh } = useEmployer();

  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isLoggedIn) navigate({ to: "/employer/login" });
  }, [loading, isLoggedIn, navigate]);

  useEffect(() => {
    if (employer) {
      setCompanyName(employer.company_name);
      setCity(employer.city);
      setContactName(employer.contact_name);
      setPhone(employer.phone);
    } else if (user?.email) {
      const guess = user.email.split("@")[0];
      if (/^\d{10}$/.test(guess)) setPhone(guess);
    }
  }, [employer, user]);

  const isValid = companyName.trim() && city.trim() && contactName.trim() && phone.trim();

  const handleSave = async () => {
    if (!isValid || !user) return;
    setSaving(true);
    setError("");
    try {
      await upsertEmployerProfile({
        auth_user_id: user.id,
        company_name: companyName.trim(),
        city: city.trim(),
        contact_name: contactName.trim(),
        phone: phone.trim(),
      });
      await refresh();
      navigate({ to: "/employer/home" });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("error_generic"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="kp-screen">
      {/* Navy header with logo */}
      <header style={{ background: "var(--gradient-navy)" }}>
        <div className="kp-container flex h-16 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-white">
            <p className="text-[11px] font-medium uppercase tracking-widest text-white/70">
              {t("employer_setup_label")}
            </p>
            <p className="text-base font-extrabold leading-tight">{t("app_name")}</p>
          </div>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="kp-container py-6"
      >
        <div className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
            {t("employer_setup_label")}
          </p>
          <h1 className="mt-1 text-[22px] font-extrabold tracking-tight text-foreground">
            {t("employer_company_details")}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("employer_company_intro")}
          </p>
        </div>

        <div className="kp-card space-y-5">
          <Field
            label={t("employer_field_company")}
            value={companyName}
            onChange={setCompanyName}
            placeholder={t("employer_field_company_ph")}
          />
          <Field
            label={t("employer_field_city")}
            value={city}
            onChange={setCity}
            placeholder={t("employer_field_city_ph")}
          />
          <Field
            label={t("employer_field_contact")}
            value={contactName}
            onChange={setContactName}
            placeholder={t("employer_field_contact_ph")}
          />
          <Field
            label={t("employer_field_phone")}
            value={phone}
            onChange={(v) => setPhone(v.replace(/\D/g, ""))}
            placeholder={t("employer_field_phone_ph")}
            maxLength={10}
            prefix="+91"
            inputMode="numeric"
          />
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className="kp-btn mt-6 disabled:opacity-40"
          style={{ background: "var(--gradient-navy)", color: "white" }}
        >
          {saving ? (
            <>
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              {t("loading")}
            </>
          ) : (
            t("save_continue")
          )}
        </button>
      </motion.div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, maxLength, prefix, inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  prefix?: string;
  inputMode?: "text" | "numeric";
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="flex items-stretch gap-0 overflow-hidden rounded-[var(--radius-lg)] border-2 border-border focus-within:border-primary">
        {prefix && (
          <span className="flex items-center bg-muted px-3 text-sm font-bold text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          className="block h-12 w-full bg-card px-4 text-base text-foreground outline-none placeholder:text-muted-foreground"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
        />
      </div>
    </div>
  );
}
