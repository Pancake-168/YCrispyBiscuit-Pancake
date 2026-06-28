import RouterBar from '@/components/RouterBar';
import AppRouter from '@/router';
import { useIsHome } from '@/utils/isHomePage';

export default function MainPage() {
  return (
    <div className="main-page">
      {!useIsHome && <RouterBar />}
      <div className="app-content">
        <AppRouter />
      </div>
    </div>
  );
}
