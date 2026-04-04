import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

const LOGO_URL = 'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/98f97b9b-13cb-4716-b813-29f161b52964.png';
const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;

interface TelegramGateProps {
  loading: boolean;
  debugLogs?: string[];
}

export default function TelegramGate({ loading }: TelegramGateProps) {
  const botUrl = BOT_USERNAME ? `https://t.me/${BOT_USERNAME}` : 'https://t.me';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-8">
        <div className="text-center text-muted-foreground">
          <Icon name="Loader" className="w-10 h-10 mx-auto mb-4 animate-spin opacity-40" />
          <p className="text-sm">Авторизация...</p>
        </div>
      </div>
    );
  }

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
          <p className="text-sm font-medium text-blue-900 mb-1">Требуется Telegram</p>
          <p className="text-xs text-blue-700">
            Это приложение работает только внутри Telegram. Откройте его через бота, чтобы войти автоматически.
          </p>
        </div>

        <Button
          className="w-full gradient-bg h-12 text-base mb-2"
          onClick={() => window.open(botUrl, '_blank')}
        >
          <Icon name="Send" className="w-5 h-5 mr-2" />
          Открыть в Telegram
        </Button>
      </div>
    </div>
  );
}