import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import type { AuthUser } from '@/hooks/useAuth';
import type { Platform } from '@/hooks/usePlatform';
import { GoogleLoginButton } from '@/components/extensions/google-auth/GoogleLoginButton';
import { useGoogleAuth } from '@/components/extensions/google-auth/useGoogleAuth';
import { YandexLoginButton } from '@/components/extensions/yandex-auth/YandexLoginButton';
import { useYandexAuth } from '@/components/extensions/yandex-auth/useYandexAuth';
import { LandingContent } from '@/components/app/LandingContent';

const GOOGLE_AUTH_URL = 'https://functions.poehali.dev/952eae04-f208-4f40-9276-f30d16a5eec0';
const GOOGLE_API_URLS = {
  authUrl: `${GOOGLE_AUTH_URL}?action=auth-url`,
  callback: `${GOOGLE_AUTH_URL}?action=callback`,
  refresh: `${GOOGLE_AUTH_URL}?action=refresh`,
  logout: `${GOOGLE_AUTH_URL}?action=logout`,
};

const YANDEX_AUTH_URL = 'https://functions.poehali.dev/c517e076-c443-4b37-a995-026ec12c67ba';
const YANDEX_API_URLS = {
  authUrl: `${YANDEX_AUTH_URL}?action=auth-url`,
  callback: `${YANDEX_AUTH_URL}?action=callback`,
  refresh: `${YANDEX_AUTH_URL}?action=refresh`,
  logout: `${YANDEX_AUTH_URL}?action=logout`,
};

const LOGO_URL = 'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/98f97b9b-13cb-4716-b813-29f161b52964.png';
const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;

interface AuthGateProps {
  loading: boolean;
  error?: string | null;
  platform: Platform;
  onGoogleLogin?: (accessToken: string, user: AuthUser) => void;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-8">
      <div className="text-center text-muted-foreground">
        <Icon name="Loader" className="w-10 h-10 mx-auto mb-4 animate-spin opacity-40" />
        <p className="text-sm">Авторизация...</p>
      </div>
    </div>
  );
}

function usePWAInstall() {
  const [prompt, setPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) { setIsInstalled(true); return; }
    const handler = (e: Event) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    (prompt as BeforeInstallPromptEvent).prompt();
    const result = await (prompt as BeforeInstallPromptEvent).userChoice;
    if (result.outcome === 'accepted') setIsInstalled(true);
    setPrompt(null);
  };

  return { canInstall: Boolean(prompt), isInstalled, install };
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function AuthForm({ onGoogleLogin, formRef }: {
  onGoogleLogin?: AuthGateProps['onGoogleLogin'];
  formRef?: React.RefObject<HTMLDivElement>;
}) {
  const botUrl = BOT_USERNAME ? `https://t.me/${BOT_USERNAME}` : 'https://t.me';
  const { canInstall, isInstalled, install } = usePWAInstall();

  const googleAuth = useGoogleAuth({
    apiUrls: GOOGLE_API_URLS,
    onAuthChange: (googleUser) => {
      if (googleUser && onGoogleLogin) {
        const accessToken = localStorage.getItem('google_auth_access_token') || '';
        onGoogleLogin(accessToken, {
          id: googleUser.id,
          name: googleUser.name || googleUser.email || 'Google User',
          avatar_url: googleUser.avatar_url,
          google_id: googleUser.google_id,
          email: googleUser.email,
          is_admin: 0,
          auth_provider: 'google',
        });
      }
    },
  });

  const yandexAuth = useYandexAuth({
    apiUrls: YANDEX_API_URLS,
    onAuthChange: (yandexUser) => {
      if (yandexUser && onGoogleLogin) {
        const accessToken = localStorage.getItem('yandex_auth_access_token') || '';
        onGoogleLogin(accessToken, {
          id: yandexUser.id,
          name: yandexUser.name || yandexUser.email || 'Яндекс Пользователь',
          avatar_url: yandexUser.avatar_url,
          yandex_id: yandexUser.yandex_id,
          email: yandexUser.email,
          is_admin: 0,
          auth_provider: 'yandex',
        });
      }
    },
  });

  return (
    <div ref={formRef} className="w-full text-center">
      <img src={LOGO_URL} alt="BANa.NET" className="w-16 h-16 mx-auto mb-4 rounded-2xl shadow-md" />
      <h2 className="text-xl font-bold gradient-text mb-1">BANa.NET</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Платформа для честных отзывов о маркетплейсах
      </p>

      <p className="text-sm font-medium text-gray-700 mb-4">Войдите, чтобы продолжить</p>

      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          className="w-full h-12 text-base border-[#229ED9] text-[#229ED9] hover:bg-[#229ED9]/10"
          onClick={() => window.open(botUrl, '_blank')}
        >
          <Icon name="Send" className="w-5 h-5 mr-2" />
          Войти через Telegram
        </Button>
        <GoogleLoginButton
          onClick={googleAuth.login}
          isLoading={googleAuth.isLoading}
          className="w-full h-12 text-base"
        />
        <YandexLoginButton
          onClick={yandexAuth.login}
          isLoading={yandexAuth.isLoading}
          className="w-full h-12 text-base"
        />
      </div>

      {!isInstalled && (
        <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4 text-left">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Icon name="Smartphone" className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-indigo-900">Установите приложение</p>
              <p className="text-xs text-indigo-700 mt-0.5">
                Работает офлайн, открывается как обычное приложение без браузера
              </p>
              {canInstall ? (
                <Button size="sm" className="mt-2 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={install}>
                  <Icon name="Download" className="w-3.5 h-3.5 mr-1.5" />
                  Установить
                </Button>
              ) : (
                <p className="text-xs text-indigo-500 mt-1.5 italic">
                  На iOS: кнопка «Поделиться» → «На экран домой»
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-5">
        Нет аккаунта? Он создастся автоматически при первом входе.
      </p>
    </div>
  );
}

function WebAuthScreen({ onGoogleLogin }: { onGoogleLogin?: AuthGateProps['onGoogleLogin'] }) {
  const formRef = useRef<HTMLDivElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [highlight, setHighlight] = useState(false);

  const handleLoginClick = () => {
    // Мобайл — открываем bottom sheet
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      setSheetOpen(true);
    } else {
      // Десктоп — подсвечиваем форму справа
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlight(true);
      setTimeout(() => setHighlight(false), 1200);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── ДЕСКТОП: два столбца ── */}
      <div className="hidden lg:flex min-h-screen">
        {/* Левый — лендинг, скроллится */}
        <div className="flex-1 overflow-y-auto border-r border-gray-100 bg-gray-50/40">
          <div className="max-w-2xl mx-auto px-8 xl:px-12">
            <LandingContent onLoginClick={handleLoginClick} />
          </div>
        </div>

        {/* Правый — форма, фиксированная */}
        <div className="w-[420px] flex-shrink-0 flex items-center justify-center px-10 sticky top-0 h-screen overflow-y-auto">
          <div
            ref={formRef}
            className={`w-full max-w-sm rounded-2xl transition-all duration-300 p-1 ${highlight ? 'ring-4 ring-primary/40 shadow-2xl scale-[1.02]' : ''}`}
          >
            <AuthForm onGoogleLogin={onGoogleLogin} />
          </div>
        </div>
      </div>

      {/* ── МОБАЙЛ: лендинг, форма всплывает снизу ── */}
      <div className="lg:hidden">
        {/* Лендинг */}
        <div className="px-5 bg-white">
          <LandingContent onLoginClick={handleLoginClick} />
        </div>

        {/* Floating CTA — всегда видна внизу экрана */}
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="pb-4 pt-3 bg-white/95 backdrop-blur-sm border-t border-gray-100">
            <button
              onClick={handleLoginClick}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl gradient-bg text-white font-bold text-base shadow-xl hover:opacity-90 transition-opacity"
            >
              <Icon name="LogIn" className="w-5 h-5" />
              Войти и опубликовать отзыв
            </button>
          </div>
        </div>

        {/* Bottom Sheet — форма входа */}
        {sheetOpen && (
          <>
            {/* Оверлей */}
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setSheetOpen(false)}
            />
            {/* Sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl px-6 pt-4 pb-8 animate-in slide-in-from-bottom duration-300">
              {/* Ручка */}
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
              <AuthForm onGoogleLogin={onGoogleLogin} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthGate({ loading, error, platform, onGoogleLogin }: AuthGateProps) {
  if (loading) return <LoadingScreen />;

  if (platform === 'telegram' && error) {
    const botUrl = BOT_USERNAME ? `https://t.me/${BOT_USERNAME}` : 'https://t.me';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 py-8">
        <div className="max-w-sm w-full text-center">
          <img src={LOGO_URL} alt="BANa.NET" className="w-20 h-20 mx-auto mb-6 rounded-2xl" />
          <h1 className="text-2xl font-bold gradient-text mb-2">BANa.NET</h1>
          <p className="text-muted-foreground text-sm mb-8">Платформа для честных отзывов о маркетплейсах</p>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
            <Icon name="MessageCircle" className="w-10 h-10 text-blue-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-blue-900 mb-2">Требуется авторизация в Telegram</p>
            <p className="text-xs text-blue-700">
              Пожалуйста, авторизуйтесь в Telegram прежде чем использовать это приложение.
            </p>
          </div>
          <Button
            className="w-full h-12 text-base bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => window.open(botUrl, '_blank')}
          >
            <Icon name="Send" className="w-5 h-5 mr-2" />
            Авторизоваться в Telegram
          </Button>
        </div>
      </div>
    );
  }

  return <WebAuthScreen onGoogleLogin={onGoogleLogin} />;
}