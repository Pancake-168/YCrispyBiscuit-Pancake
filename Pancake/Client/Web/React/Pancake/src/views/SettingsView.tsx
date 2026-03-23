import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/stores/app.store'

function SettingsView() {
  const { t } = useTranslation()
  const theme = useAppStore((state) => state.theme)
  const setTheme = useAppStore((state) => state.setTheme)
  const language = useAppStore((state) => state.language)
  const setLanguage = useAppStore((state) => state.setLanguage)

  const currentThemeLabel =
    theme === 'soft-pink' ? t('settings.themePinkName') : t('settings.themeBlueName')
  const currentLanguageLabel =
    language === 'zh-CN' ? t('settings.languageZhCN') : t('settings.languageEnUS')

  return (
    <section className="panel-grid">
      <article className="panel-card">
        <p className="app-eyebrow">{t('settings.eyebrow')}</p>
        <h2>{t('settings.title')}</h2>
        <p className="app-copy">{t('settings.description')}</p>
       
      </article>

      <article className="panel-card">
        <p className="app-eyebrow">Theme</p>
        <h2>{t('settings.themeSectionTitle')}</h2>
        <p className="app-copy">{t('settings.themeSectionDescription')}</p>
        <p className="state-text">{t('settings.currentTheme', { theme: currentThemeLabel })}</p>
        <div className="theme-grid">
          <div className={`theme-card${theme === 'soft-pink' ? ' is-active' : ''}`}>
            <div className="theme-preview theme-preview--light"></div>
            <h3>{t('settings.themePinkName')}</h3>
            <p>{t('settings.themePinkDesc')}</p>
            <button type="button" className="app-button" onClick={() => setTheme('soft-pink')}>
              {t('settings.themePinkName')}
            </button>
          </div>
          <div className={`theme-card${theme === 'soft-blue' ? ' is-active' : ''}`}>
            <div className="theme-preview theme-preview--dark"></div>
            <h3>{t('settings.themeBlueName')}</h3>
            <p>{t('settings.themeBlueDesc')}</p>
            <button type="button" className="app-button" onClick={() => setTheme('soft-blue')}>
              {t('settings.themeBlueName')}
            </button>
          </div>
        </div>
      </article>

      <article className="panel-card">
        <p className="app-eyebrow">Language</p>
        <h2>{t('settings.languageSectionTitle')}</h2>
        <p className="app-copy">{t('settings.languageSectionDescription')}</p>
        <p className="state-text">{t('settings.currentLanguage', { language: currentLanguageLabel })}</p>
        <div className="language-grid">
          <div className={`language-card${language === 'zh-CN' ? ' is-active' : ''}`}>
            <h3>{t('settings.languageZhCN')}</h3>
            <button type="button" className="app-button app-button--ghost" onClick={() => setLanguage('zh-CN')}>
              {t('settings.languageZhCN')}
            </button>
          </div>
          <div className={`language-card${language === 'en-US' ? ' is-active' : ''}`}>
            <h3>{t('settings.languageEnUS')}</h3>
            <button type="button" className="app-button app-button--ghost" onClick={() => setLanguage('en-US')}>
              {t('settings.languageEnUS')}
            </button>
          </div>
        </div>
      </article>
    </section>
  )
}

export default SettingsView