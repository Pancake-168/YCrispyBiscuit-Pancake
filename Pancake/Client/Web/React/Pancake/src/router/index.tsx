import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/views/AppLayout";
import HomeView from "@/views/HomeView";
import SettingsView from "@/views/SettingsView";
import MusicPlayerLayout from "@/components/player/MusicPlayerLayout";
import MusicHomeView from "@/views/music/MusicHomeView";
import SongsView from "@/views/music/SongsView";

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
  {
    path: "/music",
    element: <MusicPlayerLayout />,
    children: [
      {
        index: true,
        path: "home",
        element: <MusicHomeView />,
      },
      {
        path: "songs",
        element: <SongsView />,
      },
      // 更多音乐相关的路由可以在这里添加
      // {
      //   path: 'albums',
      //   element: <AlbumsView />,
      // },
      // {
      //   path: 'artists',
      //   element: <ArtistsView />,
      // },
      // {
      //   path: 'playlists',
      //   element: <PlaylistsView />,
      // },
    ],
  },
]);
