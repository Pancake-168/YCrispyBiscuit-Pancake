import { createBrowserRouter } from "react-router-dom";
import MainPage from "@/views/MainPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainPage />,
  },
]);
