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
const AUTH_URL = import.meta.env.VITE_TG_MINI_AUTH_URL;

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function saveSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
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
  const [user, setUser] = useState<AuthUser | null>(cached);
  // Кэш есть — показываем приложение мгновенно (loading=false)
  // Кэша нет — показываем спиннер (loading=true)
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const logout = () => {
    clearSession();
    setUser(null);
    setError(null);
  };

  async function verifyToken(token: string): Promise<boolean> {
    try {
      const res = await fetch(AUTH_URL, {
        method: 'GET',
        headers: { 'X-Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Обновляем данные пользователя свежими данными из БД
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return true;
      }
      return false;
    } catch {
      // Нет сети — доверяем кэшу, не ломаем UX
      console.log('[Auth] Network error on verify — using cache');
      return true;
    }
  }

  async function loginWithInitData(initData: string) {
    setError(null);
    try {
      console.log('[Auth] POST login...');
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      });
      const data = await res.json();
      console.log('[Auth] Login response:', res.status, data);
      if (!res.ok) throw new Error(data.error || 'Ошибка авторизации');
      saveSession(data.token, data.user);
      setUser(data.user);
    } catch (e: unknown) {
      console.log('[Auth] Login error:', e);
      if (!getCachedUser()) {
        setError(e instanceof Error ? e.message : 'Ошибка авторизации');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    const token = getToken();
    const initData = tg?.initData;

    console.log('[Auth] token:', !!token, 'initData:', !!initData, 'cached:', !!getCachedUser());

    if (token) {
      // Есть токен — проверяем на сервере в фоне
      verifyToken(token).then((valid) => {
        if (!valid) {
          // Токен протух — чистим и перелогиниваемся
          console.log('[Auth] Token invalid — clearing and re-login');
          clearSession();
          setUser(null);
          if (initData) {
            loginWithInitData(initData);
          } else {
            setLoading(false);
            setError('Сессия истекла. Откройте приложение через Telegram заново.');
          }
        } else {
          setLoading(false);
        }
      });
    } else if (initData) {
      // Нет токена — логинимся через Telegram
      loginWithInitData(initData);
    } else {
      setLoading(false);
      setError('Откройте приложение через Telegram.');
    }
  }, []);

  return { user, loading, error, logout };
}
