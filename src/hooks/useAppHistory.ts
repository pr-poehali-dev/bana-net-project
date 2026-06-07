import { useEffect, useRef, useCallback } from 'react';

type View = 'home' | 'reviews' | 'search' | 'add' | 'profile' | 'admin' | 'support' | 'review-detail';

/**
 * Синхронизирует внутреннюю навигацию приложения с History API браузера.
 * Кнопка «Назад» на телефоне возвращает на предыдущий экран внутри SPA.
 */
export function useAppHistory(
  currentView: View,
  onNavigate: (view: View) => void,
) {
  const isPopping = useRef(false);
  const prevView = useRef<View | null>(null);

  useEffect(() => {
    // При первом монтировании инициализируем базовое состояние
    if (window.history.state === null) {
      window.history.replaceState({ view: 'home' }, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    // Если переход произошёл от popstate — не пушим снова
    if (isPopping.current) {
      isPopping.current = false;
      prevView.current = currentView;
      return;
    }

    // Не пушим если view не изменился
    if (prevView.current === currentView) return;

    // home — replaceState чтобы не накапливать лишних записей
    if (currentView === 'home') {
      window.history.replaceState({ view: 'home' }, '', window.location.pathname);
    } else {
      window.history.pushState({ view: currentView }, '', window.location.pathname);
    }

    prevView.current = currentView;
  }, [currentView]);

  const handlePopState = useCallback((e: PopStateEvent) => {
    const view: View = e.state?.view ?? 'home';
    isPopping.current = true;
    onNavigate(view);
  }, [onNavigate]);

  useEffect(() => {
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handlePopState]);
}
