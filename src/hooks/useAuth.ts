import { useState, useEffect } from 'react';

export interface AuthUser {
  id: number;
  name: string;
  avatar_url: string | null;
  telegram_id: string;
  is_admin: number;
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
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.is_admin === 'undefined') {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('jwt_token');
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function useAuth() {
  const cached = getCachedUser();
  const [user, setUser] = useState<AuthUser | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const logout = () => {
    clearSession();
    setUser(null);
    setError(null);
  };

  useEffect(() => {
    function getInitDataFromUrl(): string | null {
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      const raw = params.get('tgWebAppData');
      return raw ? decodeURIComponent(raw) : null;
    }

    function run() {
      const tg = window.Telegram?.WebApp;

      if (tg) {
        tg.ready();
        tg.expand();
      }

      const initData = tg?.initData || getInitDataFromUrl();

      if (!initData) {
        if (!cached) {
          setError('Откройте приложение через Telegram.');
        }
        setLoading(false);
        return;
      }

      setError(null);

      fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
          saveSession(data.token, data.user);
          setUser(data.user);
        })
        .catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : String(e);
          console.error('[auth]', msg);
          if (!getCachedUser()) {
            setError(msg);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }

    if (document.readyState === 'complete') {
      run();
    } else {
      window.addEventListener('load', run, { once: true });
    }
  }, []);

  return { user, loading, error, logout };
}
