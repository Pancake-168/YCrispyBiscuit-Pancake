import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createLogger } from "../../../logger";

const mainPageLogger = createLogger("views/MainPage/index.tsx", "MainPage");

function MainPage() {
  const { t, i18n } = useTranslation();
  const title = t("mainPage.title");

  useEffect(() => {
    mainPageLogger.info("页面已挂载", { language: i18n.language });

    return () => {
      mainPageLogger.info("页面已卸载", { language: i18n.language });
    };
  }, []);

  useEffect(() => {
    mainPageLogger.info("页面语言已切换", { language: i18n.language });
  }, [i18n.language]);

  useEffect(() => {
    mainPageLogger.debug("页面标题已解析", {
      language: i18n.language,
      title,
    });
  }, [i18n.language, title]);

  return (
    <>
      <div>
        <h1>{title}</h1>
      </div>
    </>
  );
}

export default MainPage;
