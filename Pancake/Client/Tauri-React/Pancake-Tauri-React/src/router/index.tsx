import { Routes, Route } from 'react-router-dom';
import HomePage from '@/views/Pages/HomePage';
import ContentPage from '@/views/Pages/ContentPage';
import DemoPage from '@/views/Demo';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<DemoPage />} />
      <Route path="/content" element={<ContentPage />} />
      <Route path='/demo' element={<DemoPage />} />
    </Routes>
  );
}
