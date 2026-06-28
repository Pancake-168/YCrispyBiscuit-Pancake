import { useLocation } from 'react-router-dom';

export function useIsHome() {
  const { pathname } = useLocation();
  return pathname === '/';
}