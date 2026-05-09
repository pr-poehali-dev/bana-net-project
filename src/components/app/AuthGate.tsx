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

function TelegramError({ botUrl }: { botUrl: string }) {
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

function WebAuthScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 py-8">
      <div className="max-w-sm w-full text-center">
        <img src={LOGO_URL} alt="BANaNET" className="w-20 h-20 mx-auto mb-6 rounded-2xl" />
        <h1 className="text-2xl font-bold gradient-text mb-2">BANaNET</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Платформа для честных отзывов о маркетплейсах
        </p>

        <p className="text-sm font-medium text-gray-700 mb-4">Войдите, чтобы продолжить</p>

        <div className="flex flex-col gap-3">
          <Button
            className="w-full h-12 text-base bg-[#0077FF] hover:bg-[#0065DB] text-white"
            onClick={() => startWebAuth('vk')}
          >
            <span className="mr-2 font-bold text-lg leading-none">VK</span>
            Войти через ВКонтакте
          </Button>

          <Button
            className="w-full h-12 text-base bg-[#FC3F1D] hover:bg-[#e0350f] text-white"
            onClick={() => startWebAuth('yandex')}
          >
            <span className="mr-2 font-bold text-lg leading-none">Я</span>
            Войти через Яндекс
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
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
    return <TelegramError botUrl={botUrl} />;
  }

  return <WebAuthScreen />;
}