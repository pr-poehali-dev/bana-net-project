import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleAuth } from '@/components/extensions/google-auth/useGoogleAuth';
import Icon from '@/components/ui/icon';

const GOOGLE_AUTH_URL = 'https://functions.poehali.dev/952eae04-f208-4f40-9276-f30d16a5eec0';
const GOOGLE_API_URLS = {
  authUrl: `${GOOGLE_AUTH_URL}?action=auth-url`,
  callback: `${GOOGLE_AUTH_URL}?action=callback`,
  refresh: `${GOOGLE_AUTH_URL}?action=refresh`,
  logout: `${GOOGLE_AUTH_URL}?action=logout`,
};

export default function GoogleCallback() {
  const navigate = useNavigate();
  const auth = useGoogleAuth({ apiUrls: GOOGLE_API_URLS });
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    auth.handleCallback(params).then((success) => {
      if (success && auth.user) {
        const authUser = {
          id: auth.user.id,
          name: auth.user.name || auth.user.email || 'Google User',
          avatar_url: auth.user.avatar_url,
          google_id: auth.user.google_id,
          email: auth.user.email,
          is_admin: 0,
          auth_provider: 'google',
        };
        localStorage.setItem('auth_user', JSON.stringify(authUser));
        localStorage.setItem('google_auth_access_token', localStorage.getItem('google_auth_access_token') || '');
      }
      navigate('/', { replace: true });
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Icon name="Loader" className="w-10 h-10 animate-spin opacity-40 mb-4" />
      <p className="text-sm text-muted-foreground">Выполняется вход через Google...</p>
    </div>
  );
}