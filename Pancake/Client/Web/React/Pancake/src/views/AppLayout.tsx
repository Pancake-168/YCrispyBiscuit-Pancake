import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router-dom'
import { useAppStore } from '@/stores/app.store'

function AppLayout() {
  const { t } = useTranslation()
  const theme = useAppStore((state) => state.theme)
  const language = useAppStore((state) => state.language)

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="app-brand__badge">P</span>
        
        </div>

        { (
          <div className="app-sidebar__meta">
            <div className="app-meta-card">
              <span className="app-meta-card__label">{t('layout.themeLabel')}</span>
              <strong className="app-meta-card__value">
                {theme === 'soft-pink' ? t('layout.themeValuePink') : t('layout.themeValueBlue')}
              </strong>
            </div>
            <div className="app-meta-card">
              <span className="app-meta-card__label">{t('layout.languageLabel')}</span>
              <strong className="app-meta-card__value">
                {language === 'zh-CN' ? t('layout.languageValueZhCN') : t('layout.languageValueEnUS')}
              </strong>
            </div>
          </div>
        ) }

        <nav className="app-nav" aria-label="Primary">
          <NavLink to="/" end className="app-nav__link">
            {t('nav.home')}
          </NavLink>
          <NavLink to="/settings" className="app-nav__link">
            {t('nav.settings')}
          </NavLink>
        </nav>

       
      </aside>

      <div className="app-main">
        <header className="app-header">
          <div>
            <p className="app-eyebrow">{t('layout.eyebrow')}</p>
            <h1 className="app-title">{t('layout.title')}</h1>
          </div>
          <div className="app-header__controls">
            <NavLink to="/settings" className="app-button app-button--ghost">
              {t('nav.settings')}
            </NavLink>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout