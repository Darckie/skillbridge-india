import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
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

function getSavedLang(): Lang | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem("lang");
  if (saved === "hi" || saved === "en") return saved;
  return null;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => getSavedLang() || "hi");

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", l);
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
