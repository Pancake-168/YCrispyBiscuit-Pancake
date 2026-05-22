import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { useAppStore } from "@/stores/app.store";
import { createLogger } from "@/utils/logger";

const appLogger = createLogger("App.tsx", "App");

function App() {
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    appLogger.info("应用主题已应用", theme);
  }, [theme]);

  return <RouterProvider router={router} />;
}

export default App;
