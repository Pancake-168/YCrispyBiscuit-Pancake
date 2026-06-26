import { Routes, Route } from 'react-router-dom';
import HomePage from '@/views/Pages/HomePage';
import ContentPage from '@/views/Pages/ContentPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/content" element={<ContentPage />} />
    </Routes>
  );
}
