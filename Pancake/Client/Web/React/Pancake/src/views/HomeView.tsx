import { useTranslation } from "react-i18next";

function HomeView() {
  const { t } = useTranslation();

  return (
    <section className="panel-grid">
      <article className="panel-card panel-card--feature">
        <p className="app-eyebrow">{t("home.eyebrow")}</p>
        <h2>{t("home.title")}</h2>
        <p className="app-copy">{t("home.description")}</p>
      </article>

      <article className="panel-card">
        <p className="app-eyebrow">Structure</p>
        <h2>{t("home.featureTitle")}</h2>
        <p className="app-copy">{t("home.featureDescription")}</p>
        <ul className="feature-list">
          <li>{t("home.featureItemRouter")}</li>
          <li>{t("home.featureItemStore")}</li>
          <li>{t("home.featureItemTheme")}</li>
          <li>{t("home.featureItemI18n")}</li>
        </ul>
      </article>
    </section>
  );
}

export default HomeView;
