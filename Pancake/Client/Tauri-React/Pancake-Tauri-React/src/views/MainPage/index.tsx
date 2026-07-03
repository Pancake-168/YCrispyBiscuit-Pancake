import RouterBar from '@/components/RouterBar';
import AppRouter from '@/router';
import { useIsHome } from '@/utils/isHomePage';

export default function MainPage() {
  const isHome = useIsHome();
  return (
    <div className="main-page">
      {!isHome && <RouterBar />}
      <div className="app-content">
        <AppRouter />
      </div>
    </div>
  );
}
