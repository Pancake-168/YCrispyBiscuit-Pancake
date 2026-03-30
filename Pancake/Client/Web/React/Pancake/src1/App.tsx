import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import i18n from "@/language";
import { router } from "@/router";
import { useAppStore } from "@/stores/app.store";

function App() {
  const theme = useAppStore((state) => state.theme);
  const language = useAppStore((state) => state.language);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    void i18n.changeLanguage(language);
  }, [language]);

  return <RouterProvider router={router} />;
}

export default App;
