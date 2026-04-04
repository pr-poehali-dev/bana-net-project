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

  useEffect(() => {
    addLog(`🌐 URL: ${window.location.href.slice(0, 100)}`);
    addLog(`📄 readyState: ${document.readyState}`);
    addLog(`💾 Кэш: user=${!!cached}, token=${!!getToken()}`);

    function run() {
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

      const initData = tg?.initData;

      if (!initData) {
        addLog(`⚠️ initData недоступен`);
        if (cached) {
          addLog(`✅ Используем кэш: ${cached.name} (id=${cached.id})`);
        } else {
          addLog(`❌ Нет ни initData, ни кэша`);
          setError('Откройте приложение через Telegram.');
        }
        setLoading(false);
        return;
      }

      addLog(`🚀 Отправляю initData на сервер (${initData.length} симв.)...`);
      setError(null);

      fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      })
        .then(async (res) => {
          addLog(`📥 HTTP ${res.status} от сервера`);
          const data = await res.json();
          addLog(`📥 Ответ: ${JSON.stringify(data).slice(0, 150)}`);
          if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
          saveSession(data.token, data.user);
          setUser(data.user);
          addLog(`✅ Успех! id=${data.user?.id}, name=${data.user?.name}, role=${data.user?.role}`);
        })
        .catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : String(e);
          addLog(`❌ Ошибка: ${msg}`);
          if (!getCachedUser()) {
            setError(msg);
          } else {
            addLog(`⚠️ Ошибка сети — работаем с кэшем`);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }

    // Если Telegram ещё не загружен — ждём 300ms и пробуем снова
    if (window.Telegram?.WebApp) {
      run();
    } else {
      addLog(`⏳ Жду загрузки Telegram скрипта...`);
      setTimeout(run, 300);
    }
  }, []);

  return { user, loading, error, logout, debugLogs };
}
