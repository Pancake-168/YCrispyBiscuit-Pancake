import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import enUS from "@/language/resources/en-US";
import zhCN from "@/language/resources/zh-CN";
import { createLogger } from "@/utils/logger";

const languageLogger = createLogger("language/index.ts", "i18n");

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
  })
  .then(() => {
    languageLogger.info("国际化初始化完成", {
      language: i18n.resolvedLanguage,
      fallbackLng: "zh-CN",
    });
  })
  .catch((error) => {
    languageLogger.error("国际化初始化失败", error);
  });

export default i18n;
