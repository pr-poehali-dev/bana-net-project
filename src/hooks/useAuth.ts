import { useState, useEffect } from 'react';

export interface AuthUser {
  id: number;
  name: string;
  avatar_url: string | null;
  telegram_id: string;
  role: 'user' | 'admin';
}

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'auth_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function getCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const cached = getCachedUser();

  // Если есть кэш — сразу показываем приложение, loading=false
  // Если нет кэша — показываем спиннер, loading=true
  const [user, setUser] = useState<AuthUser | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData;

    console.log('[Auth] tg:', !!tg, 'initData length:', initData?.length ?? 0);

    if (!initData) {
      console.log('[Auth] No initData');
      setLoading(false);
      setError('Приложение должно быть открыто через Telegram');
      return;
    }

    setError(null);
    try {
      console.log('[Auth] Calling API...');
      const res = await fetch(import.meta.env.VITE_TG_MINI_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      });
      const data = await res.json();
      console.log('[Auth] Response:', res.status, data);
      if (!res.ok) throw new Error(data.error || 'Ошибка авторизации');
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      console.log('[Auth] User saved:', data.user);
    } catch (e: unknown) {
      console.log('[Auth] ERROR:', e);
      // Если есть кэш — не показываем ошибку, просто работаем с кэшем
      if (!getCachedUser()) {
        setError(e instanceof Error ? e.message : 'Ошибка авторизации');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }
    // Всегда вызываем login — обновляем данные с сервера
    // Если кэш есть — приложение уже показано, обновление идёт в фоне
    login();
  }, []);

  return { user, loading, error, login, logout };
}
