import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useYandexAuth } from '@/components/extensions/yandex-auth/useYandexAuth';
import Icon from '@/components/ui/icon';

const YANDEX_AUTH_URL = 'https://functions.poehali.dev/c517e076-c443-4b37-a995-026ec12c67ba';
const YANDEX_API_URLS = {
  authUrl: `${YANDEX_AUTH_URL}?action=auth-url`,
  callback: `${YANDEX_AUTH_URL}?action=callback`,
  refresh: `${YANDEX_AUTH_URL}?action=refresh`,
  logout: `${YANDEX_AUTH_URL}?action=logout`,
};

export default function YandexCallback() {
  const navigate = useNavigate();
  const auth = useYandexAuth({ apiUrls: YANDEX_API_URLS });
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    auth.handleCallback(params).then((result) => {
      if (result && auth.user) {
        const authUser = {
          id: auth.user.id,
          name: auth.user.name || auth.user.email || 'Яндекс Пользователь',
          avatar_url: auth.user.avatar_url,
          yandex_id: auth.user.yandex_id,
          email: auth.user.email,
          is_admin: 0,
          auth_provider: 'yandex',
        };
        localStorage.setItem('auth_user', JSON.stringify(authUser));
        if (typeof result === 'string') {
          localStorage.setItem('yandex_auth_access_token', result);
        }
      }
      navigate('/', { replace: true });
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Icon name="Loader" className="w-10 h-10 animate-spin opacity-40 mb-4" />
      <p className="text-sm text-muted-foreground">Выполняется вход через Яндекс...</p>
    </div>
  );
}