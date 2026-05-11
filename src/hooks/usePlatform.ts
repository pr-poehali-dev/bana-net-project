import { useMemo } from 'react';

export type Platform = 'telegram' | 'vk' | 'pwa' | 'web';

export interface PlatformInfo {
  platform: Platform;
  isTelegram: boolean;
  isVK: boolean;
  isPWA: boolean;
  isWeb: boolean;
}

interface TelegramWindow {
  Telegram?: {
    WebApp?: {
      initData?: string;
    };
  };
  navigator: Navigator & { standalone?: boolean };
}

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'web';

  const win = window as unknown as TelegramWindow;
  const tg = win.Telegram?.WebApp;
  if (tg?.initData) return 'telegram';

  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const hasVkParams =
    urlParams.has('vk_app_id') ||
    urlParams.has('sign') ||
    hashParams.has('vk_app_id');

  if (hasVkParams) {
    return 'vk';
  }

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    win.navigator.standalone === true;

  if (isStandalone) return 'pwa';

  return 'web';
}

let _cachedPlatform: Platform | null = null;

export function getPlatform(): Platform {
  if (!_cachedPlatform) {
    _cachedPlatform = detectPlatform();
  }
  return _cachedPlatform;
}

export function usePlatform(): PlatformInfo {
  return useMemo(() => {
    const platform = getPlatform();
    return {
      platform,
      isTelegram: platform === 'telegram',
      isVK: platform === 'vk',
      isPWA: platform === 'pwa',
      isWeb: platform === 'web',
    };
  }, []);
}