import { useState, useEffect, useCallback } from 'react';
import func2url from '../../backend/func2url.json';

export interface AuthUser {
  id: number;
  name: string;
  avatar_url: string | null;
  telegram_id?: string;
  google_id?: string;
  vk_id?: string;
  yandex_id?: string;
  email?: string | null;
  is_admin: number;
  auth_provider?: string;
}

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'auth_user';
const GOOGLE_REFRESH_KEY = 'google_auth_refresh_token';
const GOOGLE_ACCESS_KEY = 'google_auth_access_token';
const YANDEX_ACCESS_KEY = 'yandex_auth_access_token';
const YANDEX_REFRESH_KEY = 'yandex_auth_refresh_token';
const AUTH_URL: string = func2url['tg-mini-auth'];
const GOOGLE_AUTH_URL = 'https://functions.poehali.dev/952eae04-f208-4f40-9276-f30d16a5eec0';
const YANDEX_AUTH_URL = 'https://functions.poehali.dev/c517e076-c443-4b37-a995-026ec12c67ba';
const IS_DEV = import.meta.env.DEV;

const DEV_USER: AuthUser = {
  id: 13,
  name: 'Dev Poehali',
  avatar_url: null,
  telegram_id: 'dev_poehali',
  is_admin: 1,
};

export function getToken(): string | null {
  return localStorage.getItem(GOOGLE_ACCESS_KEY) || localStorage.getItem(YANDEX_ACCESS_KEY) || localStorage.getItem(TOKEN_KEY);
}

function saveSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function saveGoogleSession(accessToken: string, user: AuthUser) {
  localStorage.setItem(GOOGLE_ACCESS_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify({ ...user, auth_provider: 'google' }));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(GOOGLE_ACCESS_KEY);
  localStorage.removeItem(GOOGLE_REFRESH_KEY);
  localStorage.removeItem(YANDEX_ACCESS_KEY);
  localStorage.removeItem(YANDEX_REFRESH_KEY);
}

function getCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const tgToken = localStorage.getItem(TOKEN_KEY);
    const googleToken = localStorage.getItem(GOOGLE_ACCESS_KEY);
    const yandexToken = localStorage.getItem(YANDEX_ACCESS_KEY);
    if (!tgToken && !googleToken && !yandexToken) {
      localStorage.removeItem(USER_KEY);
      return null;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed.is_admin === 'undefined') {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function tryRestoreGoogleSession(): Promise<AuthUser | null> {
  const refreshToken = localStorage.getItem(GOOGLE_REFRESH_KEY);
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${GOOGLE_AUTH_URL}?action=refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      localStorage.removeItem(GOOGLE_REFRESH_KEY);
      localStorage.removeItem(GOOGLE_ACCESS_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
    const data = await res.json();
    const googleUser: AuthUser = {
      id: data.user.id,
      name: data.user.name || data.user.email || 'Google User',
      avatar_url: data.user.avatar_url || null,
      google_id: data.user.google_id,
      email: data.user.email,
      is_admin: 0,
      auth_provider: 'google',
    };
    saveGoogleSession(data.access_token, googleUser);
    return googleUser;
  } catch {
    return null;
  }
}

async function tryRestoreYandexSession(): Promise<AuthUser | null> {
  const refreshToken = localStorage.getItem(YANDEX_REFRESH_KEY);
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${YANDEX_AUTH_URL}?action=refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      localStorage.removeItem(YANDEX_REFRESH_KEY);
      localStorage.removeItem(YANDEX_ACCESS_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
    const data = await res.json();
    const yandexUser: AuthUser = {
      id: data.user.id,
      name: data.user.name || data.user.email || 'Яндекс Пользователь',
      avatar_url: data.user.avatar_url || null,
      yandex_id: data.user.yandex_id,
      email: data.user.email,
      is_admin: 0,
      auth_provider: 'yandex',
    };
    localStorage.setItem(YANDEX_ACCESS_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(yandexUser));
    return yandexUser;
  } catch {
    return null;
  }
}

export function useAuth() {
  const cached = getCachedUser();
  const [user, setUser] = useState<AuthUser | null>(IS_DEV ? DEV_USER : cached);
  const [loading, setLoading] = useState(IS_DEV ? false : true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(GOOGLE_REFRESH_KEY);
    if (refreshToken) {
      fetch(`${GOOGLE_AUTH_URL}?action=logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => {});
    }
    clearSession();
    setUser(IS_DEV ? DEV_USER : null);
    setError(null);
  }, []);

  const loginWithGoogle = useCallback((accessToken: string, googleUser: AuthUser) => {
    saveGoogleSession(accessToken, googleUser);
    setUser(googleUser);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (IS_DEV) return;

    function getInitDataFromUrl(): string | null {
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      const raw = params.get('tgWebAppData');
      return raw ? decodeURIComponent(raw) : null;
    }

    async function run() {
      const tg = window.Telegram?.WebApp;

      if (tg) {
        tg.ready();
        tg.expand();
      }

      const initData = tg?.initData || getInitDataFromUrl();

      if (!initData) {
        const googleUser = await tryRestoreGoogleSession();
        if (googleUser) {
          setUser(googleUser);
          setLoading(false);
          return;
        }
        const yandexUser = await tryRestoreYandexSession();
        if (yandexUser) {
          setUser(yandexUser);
          setLoading(false);
          return;
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
          if (cached) {
            setUser(cached);
          } else {
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

  return { user, loading, error, logout, loginWithGoogle };
}

export function startWebAuth(provider: 'vk' | 'yandex') {
  if (provider === 'vk') {
    window.location.href = `/auth/vk`;
  } else if (provider === 'yandex') {
    window.location.href = `/auth/yandex`;
  }
}