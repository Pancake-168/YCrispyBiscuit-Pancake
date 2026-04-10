import { createBrowserRouter } from "react-router-dom";
import MainPage from "@/views/MainPage";
import { createLogger } from "../../logger";

const routerLogger = createLogger("router/index.tsx", "createRouter");

routerLogger.info("路由表初始化完成", "/");

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainPage />,
  },
]);
