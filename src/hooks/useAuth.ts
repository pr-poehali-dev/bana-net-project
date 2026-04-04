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
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  function addLog(msg: string) {
    const time = new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const line = `[${time}] ${msg}`;
    console.log(line);
    setDebugLogs(prev => [...prev, line]);
  }

  const logout = () => {
    clearSession();
    setUser(null);
    setError(null);
  };

  async function verifyToken(token: string): Promise<boolean> {
    addLog(`🔍 Проверяю токен на сервере...`);
    try {
      const res = await fetch(AUTH_URL, {
        method: 'GET',
        headers: { 'X-Authorization': `Bearer ${token}` },
      });
      addLog(`🔍 Ответ сервера: HTTP ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        addLog(`✅ Токен валидный, user_id=${data.user?.id}, role=${data.user?.role}`);
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return true;
      }
      const errData = await res.json().catch(() => ({}));
      addLog(`❌ Токен невалидный: ${errData.error || res.statusText}`);
      return false;
    } catch (e) {
      addLog(`⚠️ Сеть недоступна при проверке токена — используем кэш`);
      return true;
    }
  }

  async function loginWithInitData(initData: string) {
    addLog(`📤 Отправляю initData (${initData.length} симв.) на сервер...`);
    setError(null);
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      });
      addLog(`📥 Ответ сервера: HTTP ${res.status}`);
      const data = await res.json();
      addLog(`📥 Тело ответа: ${JSON.stringify(data).slice(0, 120)}`);
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      saveSession(data.token, data.user);
      setUser(data.user);
      addLog(`✅ Пользователь сохранён: id=${data.user?.id}, name=${data.user?.name}, role=${data.user?.role}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`❌ Ошибка логина: ${msg}`);
      if (!getCachedUser()) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    addLog(`📦 Telegram WebApp: ${tg ? 'есть' : 'НЕТ'}`);
    if (tg) {
      tg.ready();
      tg.expand();
      addLog(`📱 platform: ${tg.platform}, version: ${tg.version}`);
      addLog(`🔑 initData: ${tg.initData ? `есть (${tg.initData.length} симв.)` : 'ПУСТОЙ'}`);
      if (tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        addLog(`👤 tg user: id=${u.id}, name=${u.first_name} ${u.last_name || ''}`.trim());
      }
    }

    const token = getToken();
    const initData = tg?.initData;

    addLog(`💾 Кэш: user=${!!getCachedUser()}, token=${!!token}`);
    addLog(`🔗 URL: ${window.location.href.slice(0, 80)}`);

    if (token) {
      addLog(`🔄 Есть токен — проверяю на сервере...`);
      verifyToken(token).then((valid) => {
        if (!valid) {
          addLog(`🔄 Токен протух — чищу кэш и перелогиниваюсь`);
          clearSession();
          setUser(null);
          if (initData) {
            loginWithInitData(initData);
          } else {
            setLoading(false);
            setError('Сессия истекла. Откройте приложение через Telegram заново.');
            addLog(`❌ initData недоступен для повторного логина`);
          }
        } else {
          setLoading(false);
        }
      });
    } else if (initData) {
      addLog(`🚀 Токена нет — логинюсь через initData`);
      loginWithInitData(initData);
    } else {
      setLoading(false);
      setError('Откройте приложение через Telegram.');
      addLog(`❌ Нет ни токена, ни initData — авторизация невозможна`);
    }
  }, []);

  return { user, loading, error, logout, debugLogs };
}
