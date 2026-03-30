import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/views/AppLayout";
import HomeView from "@/views/HomeView";
import SettingsView from "@/views/SettingsView";
import MainPage from "@/views/MainPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainPage />,
  },
  {
    path: "/style",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomeView />,
      },
      {
        path: "settings",
        element: <SettingsView />,
      }
    ],
  },

]);
