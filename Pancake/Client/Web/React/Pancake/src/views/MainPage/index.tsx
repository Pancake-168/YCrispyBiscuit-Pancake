import { useTranslation } from "react-i18next";


function MainPage() {
  const { t } = useTranslation();
  return (
    <>
      <div>
        <h1>{t("mainPage.title")}</h1>
      </div>
    </>

  );
}

export default MainPage;