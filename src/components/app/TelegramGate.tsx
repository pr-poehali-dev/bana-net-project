import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

const LOGO_URL = 'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/98f97b9b-13cb-4716-b813-29f161b52964.png';
const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;

interface TelegramGateProps {
  loading: boolean;
  debugLogs?: string[];
}

export default function TelegramGate({ loading, debugLogs = [] }: TelegramGateProps) {
  const botUrl = BOT_USERNAME ? `https://t.me/${BOT_USERNAME}` : 'https://t.me';
  const [internalLogs, setInternalLogs] = useState<string[]>([]);

  useEffect(() => {
    const logs: string[] = [];
    const tg = window.Telegram?.WebApp;

    logs.push(`⏱ ${new Date().toLocaleTimeString()}`);
    logs.push(`📦 Telegram WebApp: ${tg ? 'есть' : 'НЕТ'}`);
    if (tg) {
      logs.push(`🔑 initData: ${tg.initData ? `есть (${tg.initData.length} симв.)` : 'ПУСТОЙ'}`);
      logs.push(`🌍 platform: ${tg.platform || 'unknown'}`);
      logs.push(`📱 version: ${tg.version || 'unknown'}`);
      logs.push(`👤 initDataUnsafe.user: ${tg.initDataUnsafe?.user ? JSON.stringify(tg.initDataUnsafe.user).slice(0, 60) : 'нет'}`);
    }
    logs.push(`🔗 URL: ${window.location.href.slice(0, 60)}`);
    logs.push(`🖥 userAgent: ${navigator.userAgent.slice(0, 50)}`);
    logs.push(`💾 localStorage auth_user: ${localStorage.getItem('auth_user') ? 'есть' : 'нет'}`);
    logs.push(`🔒 localStorage jwt_token: ${localStorage.getItem('jwt_token') ? 'есть' : 'нет'}`);

    setInternalLogs(logs);
  }, []);

  const allLogs = [...internalLogs, ...debugLogs];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <div className="text-center text-muted-foreground mb-8">
          <Icon name="Loader" className="w-10 h-10 mx-auto mb-4 animate-spin opacity-40" />
          <p className="text-sm">Авторизация...</p>
        </div>

        <div className="w-full max-w-sm bg-gray-900 rounded-xl p-3 text-left">
          <p className="text-yellow-400 text-xs font-mono mb-2">🛠 Debug Log</p>
          <div className="space-y-1">
            {allLogs.map((log, i) => (
              <p key={i} className="text-green-400 text-xs font-mono break-all">{log}</p>
            ))}
            {allLogs.length === 0 && (
              <p className="text-gray-500 text-xs font-mono">Собираю данные...</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="max-w-sm w-full text-center mb-6">
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
          className="w-full gradient-bg h-12 text-base"
          onClick={() => window.open(botUrl, '_blank')}
        >
          <Icon name="Send" className="w-5 h-5 mr-2" />
          Открыть в Telegram
        </Button>
      </div>

      <div className="w-full max-w-sm bg-gray-900 rounded-xl p-3 text-left">
        <p className="text-yellow-400 text-xs font-mono mb-2">🛠 Debug Log</p>
        <div className="space-y-1">
          {allLogs.map((log, i) => (
            <p key={i} className="text-green-400 text-xs font-mono break-all">{log}</p>
          ))}
          {allLogs.length === 0 && (
            <p className="text-gray-500 text-xs font-mono">Нет данных</p>
          )}
        </div>
      </div>
    </div>
  );
}
