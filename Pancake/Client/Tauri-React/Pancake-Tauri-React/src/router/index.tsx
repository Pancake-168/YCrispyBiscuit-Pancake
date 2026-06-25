import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/Pages/HomePage';
import ContentPage from '@/pages/Pages/ContentPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/content" element={<ContentPage />} />
    </Routes>
  );
}
