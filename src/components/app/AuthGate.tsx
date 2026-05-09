import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { startWebAuth } from '@/hooks/useAuth';
import type { Platform } from '@/hooks/usePlatform';

const LOGO_URL = 'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/98f97b9b-13cb-4716-b813-29f161b52964.png';
const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;

interface AuthGateProps {
  loading: boolean;
  error?: string | null;
  platform: Platform;
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
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
    };
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

function WebAuthScreen() {
  const botUrl = BOT_USERNAME ? `https://t.me/${BOT_USERNAME}` : 'https://t.me';
  const { canInstall, isInstalled, install } = usePWAInstall();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 py-8">
      <div className="max-w-sm w-full text-center">
        <img src={LOGO_URL} alt="BANaNET" className="w-20 h-20 mx-auto mb-6 rounded-2xl shadow-md" />
        <h1 className="text-2xl font-bold gradient-text mb-2">BANaNET</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Платформа для честных отзывов о маркетплейсах
        </p>

        <p className="text-sm font-medium text-gray-700 mb-4">Войдите, чтобы продолжить</p>

        <div className="flex flex-col gap-3">
          {/* ВКонтакте */}
          <Button
            className="w-full h-12 text-base bg-[#0077FF] hover:bg-[#0065DB] text-white"
            onClick={() => startWebAuth('vk')}
          >
            <span className="mr-2 font-bold text-lg leading-none">VK</span>
            Войти через ВКонтакте
          </Button>

          {/* Яндекс */}
          <Button
            className="w-full h-12 text-base bg-[#FC3F1D] hover:bg-[#e0350f] text-white"
            onClick={() => startWebAuth('yandex')}
          >
            <span className="mr-2 font-bold text-lg leading-none">Я</span>
            Войти через Яндекс
          </Button>

          {/* Telegram Bot */}
          <Button
            variant="outline"
            className="w-full h-12 text-base border-[#229ED9] text-[#229ED9] hover:bg-[#229ED9]/10"
            onClick={() => window.open(botUrl, '_blank')}
          >
            <Icon name="Send" className="w-5 h-5 mr-2" />
            Войти через Telegram
          </Button>
        </div>

        {/* PWA баннер */}
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
                  <Button
                    size="sm"
                    className="mt-2 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={install}
                  >
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
    </div>
  );
}

export default function AuthGate({ loading, error, platform }: AuthGateProps) {
  if (loading) return <LoadingScreen />;

  if (platform === 'telegram' && error) {
    const botUrl = BOT_USERNAME ? `https://t.me/${BOT_USERNAME}` : 'https://t.me';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 py-8">
        <div className="max-w-sm w-full text-center">
          <img src={LOGO_URL} alt="BANaNET" className="w-20 h-20 mx-auto mb-6 rounded-2xl" />
          <h1 className="text-2xl font-bold gradient-text mb-2">BANaNET</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Платформа для честных отзывов о маркетплейсах
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
            <Icon name="MessageCircle" className="w-10 h-10 text-blue-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-blue-900 mb-1">Открыть через Telegram</p>
            <p className="text-xs text-blue-700">
              Запустите приложение через Telegram-бота — войдёте автоматически.
            </p>
          </div>
          <Button
            className="w-full gradient-bg h-12 text-base"
            onClick={() => window.open(botUrl, '_blank')}
          >
            <Icon name="Send" className="w-5 h-5 mr-2" />
            Открыть в Telegram
          </Button>
        </div>
      </div>
    );
  }

  return <WebAuthScreen />;
}
