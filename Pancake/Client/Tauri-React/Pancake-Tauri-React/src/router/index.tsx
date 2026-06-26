import { Routes, Route } from 'react-router-dom';
import HomePage from '@/views/Pages/HomePage';
import DemoPage from '@/views/DemoPage';
import AudioSwitchPage from '@/views/Pages/AudioSwitchPage/index';
import PictureSwitchPage from '@/views/Pages/PictureSwitchPage';
import PancakeWorkFlowPage from '@/views/Pages/PancakeWorkFlowPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/audioswitch" element={<AudioSwitchPage />} />
      <Route path="/pictureswitch" element={<PictureSwitchPage />} />
      <Route path="/pancakeworkflow" element={<PancakeWorkFlowPage />} />
    </Routes>
  );
}
