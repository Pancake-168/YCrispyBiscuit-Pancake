import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import enUS from "@/language/resources/en-US";
import zhCN from "@/language/resources/zh-CN";

export const supportedLanguages = ["zh-CN", "en-US"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

const resources = {
  "zh-CN": zhCN,
  "en-US": enUS,
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "zh-CN",
    supportedLngs: supportedLanguages,
    load: "currentOnly",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "pancake-language",
    },
  });

export default i18n;
