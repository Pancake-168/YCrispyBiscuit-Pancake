import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/views/AppLayout";
import HomeView from "@/views/HomeView";
import SettingsView from "@/views/SettingsView";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomeView />,
      },
      {
        path: "settings",
        element: <SettingsView />,
      },
    ],
  },
  

]);
