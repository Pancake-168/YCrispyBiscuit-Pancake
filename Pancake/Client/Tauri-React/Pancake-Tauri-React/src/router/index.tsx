import { Routes, Route } from 'react-router-dom';
import HomePage from '@/views/Pages/HomePage';
import DemoPage from '@/views/DemoPage';
import AudioSwitchPage from '@/views/Pages/AudioSwitchPage/index';
import PictureSwitchPage from '@/views/Pages/PictureSwitchPage/index';
import PancakeWorkFlowPage from '@/views/Pages/PancakeWorkFlowPage';
import BilibiliLoginPage from '@/views/Pages/BilibiliLoginPage';
import WeatherPage from '@/views/Pages/WeatherPage';
import NotFound from '@/views/Pages/404NotFound';
import { isTauri } from '@/utils/isTauri';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/audio_switch" element={<AudioSwitchPage />} />
      <Route path="/picture_switch" element={<PictureSwitchPage />} />
      {isTauri() && <Route path="/pancake_workflow" element={<PancakeWorkFlowPage />} />}
      <Route path="/bilibili_login" element={<BilibiliLoginPage />} />
      <Route path="/weather" element={<WeatherPage />} />

      <Route path="*" element={<NotFound />} />
      <Route path="/demo" element={<DemoPage />} />
    </Routes>
  );
}
