import { useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { createLogger } from '@/utils/logger';
import { ToastProvider } from '@/components/common';

import TitleBar from '@/components/TauriBar';
import MainPage from '@/views/MainPage';

const log = createLogger('App.tsx', 'App');

function App() {
  useEffect(() => {
    log.info('系统启动');
  }, []);

  return (
    <HashRouter>
      <ToastProvider>
        <div className="app-layout">
          <TitleBar />
          <MainPage />
        </div>
      </ToastProvider>
    </HashRouter>
  );
}

export default App;
