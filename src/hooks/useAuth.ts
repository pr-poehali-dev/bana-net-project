import { useState, useEffect, useRef } from 'react';

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

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);
  const [loading, setLoading] = useState(!loadStoredUser()); // false если уже есть юзер
  const [error, setError] = useState<string | null>(null);
  const didInit = useRef(false);

  const login = async () => {
    // DEV-режим: нет Telegram — логинимся как admin
    if (import.meta.env.DEV) {
      const devUser: AuthUser = {
        id: 1,
        name: 'Admin (dev)',
        avatar_url: null,
        telegram_id: '477993854',
        role: 'admin',
      };
      localStorage.setItem(USER_KEY, JSON.stringify(devUser));
      localStorage.setItem(TOKEN_KEY, 'dev-token');
      setUser(devUser);
      setLoading(false);
      return;
    }

    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData;

    if (!initData) {
      setLoading(false);
      setError('Приложение должно быть открыто через Telegram');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(import.meta.env.VITE_TG_MINI_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка авторизации');
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
    } catch (e: unknown) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setError(e instanceof Error ? e.message : 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setLoading(false);
  };

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    // Уже залогинен — ничего не делаем
    if (loadStoredUser()) {
      setLoading(false);
      return;
    }

    // Ждём SDK если ещё не загрузился
    if (tg?.initData) {
      login();
    } else {
      const timer = setTimeout(() => { login(); }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  return { user, loading, error, login, logout };
}
