import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import en from "@/i18n/en.json";
import hi from "@/i18n/hi.json";

type Lang = "hi" | "en";
type Dict = Record<string, string>;

const dictionaries: Record<Lang, Dict> = { en, hi };

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Always start with "hi" so SSR and initial client render match (no hydration mismatch).
  // Then read localStorage in an effect after mount.
  const [lang, setLangState] = useState<Lang>("hi");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "hi" || saved === "en") {
        if (saved !== lang) setLangState(saved);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      return dictionaries[lang]?.[key] || dictionaries.en[key] || key;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}
