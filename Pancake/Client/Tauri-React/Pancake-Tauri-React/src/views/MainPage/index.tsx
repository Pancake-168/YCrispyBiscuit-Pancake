import RouterBar from '@/components/RouterBar';
import AppRouter from '@/router';
import { useLocation } from "react-router-dom";

export default function MainPage() {
  const { pathname } = useLocation();

  return (
    <div className="main-page">
      {pathname !== "/" && <RouterBar />}
      <div className="app-content">
        <AppRouter />
      </div>
    </div>
  );
}
