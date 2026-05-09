import { useState, useEffect, useCallback } from 'react';
import func2url from '../../backend/func2url.json';
import { getPlatform } from './usePlatform';
import bridge from '@vkontakte/vk-bridge';

export interface AuthUser {
  id: number;
  name: string;
  avatar_url: string | null;
  telegram_id: string | null;
  vk_id: string | null;
  google_id: string | null;
  auth_provider: 'telegram' | 'vk' | 'google';
  is_admin: number;
}

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'auth_user';
const IS_DEV = import.meta.env.DEV;

const TG_AUTH_URL: string = func2url['tg-mini-auth'];
const VK_MINI_AUTH_URL: string = (func2url as Record<string, string>)['vk-mini-auth'] ?? '';
const VK_OAUTH_URL: string = (func2url as Record<string, string>)['vk-oauth-web'] ?? '';
const GOOGLE_OAUTH_URL: string = (func2url as Record<string, string>)['google-oauth'] ?? '';

const DEV_USER: AuthUser = {
  id: 13,
  name: 'Dev Poehali',
  avatar_url: null,
  telegram_id: 'dev_poehali',
  vk_id: null,
  google_id: null,
  auth_provider: 'telegram',
  is_admin: 1,
};

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
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      localStorage.removeItem(USER_KEY);
      return null;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed.is_admin === 'undefined') {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return parsed as AuthUser;
  } catch {
    return null;
  }
}

async function authViaTelegram(): Promise<{ token: string; user: AuthUser }> {
  interface TgWindow {
    Telegram?: { WebApp?: { initData?: string; ready?: () => void; expand?: () => void } };
  }
  const tg = (window as unknown as TgWindow).Telegram?.WebApp;
  tg?.ready?.();
  tg?.expand?.();

  let initData = tg?.initData ?? null;

  if (!initData) {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const raw = params.get('tgWebAppData');
    if (raw) initData = decodeURIComponent(raw);
  }

  if (!initData) throw new Error('no_initdata');

  const res = await fetch(TG_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as { token: string; user: AuthUser };
}

async function authViaVKMini(): Promise<{ token: string; user: AuthUser }> {
  const launchParams = window.location.search;
  const res = await fetch(VK_MINI_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ launch_params: launchParams }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as { token: string; user: AuthUser };
}

export type WebAuthProvider = 'vk' | 'google';

function buildVKOAuthUrl(): string {
  const clientId = import.meta.env.VITE_VK_APP_ID ?? '54584737';
  const redirectUri = `${window.location.origin}/auth/vk/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    display: 'page',
    scope: 'email',
    response_type: 'code',
    v: '5.131',
  });
  return `https://oauth.vk.com/authorize?${params.toString()}`;
}

function buildGoogleOAuthUrl(): string {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
  const redirectUri = `${window.location.origin}/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function startWebAuth(provider: WebAuthProvider) {
  const url = provider === 'vk' ? buildVKOAuthUrl() : buildGoogleOAuthUrl();
  window.location.href = url;
}

async function handleOAuthCallback(): Promise<{ token: string; user: AuthUser } | null> {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const path = window.location.pathname;

  if (!code) return null;

  let authUrl = '';
  let provider: 'vk' | 'google' | null = null;

  if (path.includes('/auth/vk/callback')) {
    authUrl = VK_OAUTH_URL;
    provider = 'vk';
  } else if (path.includes('/auth/google/callback')) {
    authUrl = GOOGLE_OAUTH_URL;
    provider = 'google';
  }

  if (!authUrl || !provider) return null;

  const redirectUri = `${window.location.origin}/auth/${provider}/callback`;
  const res = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  });

  window.history.replaceState({}, document.title, '/');

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as { token: string; user: AuthUser };
}

export function useAuth() {
  const cached = getCachedUser();
  const platform = getPlatform();

  const [user, setUser] = useState<AuthUser | null>(IS_DEV ? DEV_USER : cached);
  const [loading, setLoading] = useState(IS_DEV ? false : !cached);
  const [error, setError] = useState<string | null>(null);
  const [needsWebAuth, setNeedsWebAuth] = useState(false);

  const logout = useCallback(() => {
    clearSession();
    setUser(IS_DEV ? DEV_USER : null);
    setError(null);
    setNeedsWebAuth(platform === 'web' || platform === 'pwa');
  }, [platform]);

  useEffect(() => {
    if (IS_DEV) return;
    if (cached) {
      setLoading(false);
      return;
    }

    async function run() {
      try {
        const oauthResult = await handleOAuthCallback();
        if (oauthResult) {
          saveSession(oauthResult.token, oauthResult.user);
          setUser(oauthResult.user);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('[auth/oauth-callback]', e);
      }

      if (platform === 'telegram') {
        try {
          const result = await authViaTelegram();
          saveSession(result.token, result.user);
          setUser(result.user);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg !== 'no_initdata') {
            console.error('[auth/telegram]', msg);
          }
          setNeedsWebAuth(false);
          setError('Откройте приложение через Telegram.');
        }
      } else if (platform === 'vk') {
        try {
          const result = await authViaVKMini();
          saveSession(result.token, result.user);
          setUser(result.user);
        } catch (e) {
          console.error('[auth/vk-mini]', e);
          setError('Ошибка авторизации VK. Попробуйте перезапустить приложение.');
        }
      } else {
        setNeedsWebAuth(true);
      }

      setLoading(false);
    }

    if (document.readyState === 'complete') {
      run();
    } else {
      window.addEventListener('load', run, { once: true });
    }
  }, []);

  return { user, loading, error, logout, needsWebAuth, platform };
}

export { bridge };
