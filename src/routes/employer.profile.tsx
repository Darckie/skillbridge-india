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
      // Synthetic email = "<phone>@phone-employer.kaamproof.local"
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
      <header className="border-b border-border bg-card">
        <div className="kp-container flex h-14 items-center">
          <h1 className="text-base font-bold">{t("employer_company_details")}</h1>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="kp-container py-6"
      >
        <p className="text-sm text-muted-foreground">
          {t("employer_company_intro")}
        </p>

        <div className="mt-5 space-y-4">
          <Field label={t("employer_field_company")} value={companyName} onChange={setCompanyName} placeholder={t("employer_field_company_ph")} />
          <Field label={t("employer_field_city")} value={city} onChange={setCity} placeholder={t("employer_field_city_ph")} />
          <Field label={t("employer_field_contact")} value={contactName} onChange={setContactName} placeholder={t("employer_field_contact_ph")} />
          <Field label={t("employer_field_phone")} value={phone} onChange={(v) => setPhone(v.replace(/\D/g, ""))} placeholder={t("employer_field_phone_ph")} maxLength={10} />
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className="kp-btn mt-6 disabled:opacity-40"
          style={{ background: "var(--gradient-navy)", color: "white" }}
        >
          {saving ? t("loading") : t("save_continue")}
        </button>
      </motion.div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <input
        className="kp-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </div>
  );
}
