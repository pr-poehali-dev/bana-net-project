import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVkAuth } from '@/components/extensions/vk-auth/useVkAuth';
import Icon from '@/components/ui/icon';

const VK_AUTH_URL = 'https://functions.poehali.dev/895f5597-716b-4457-ace9-96a846ec50aa';
const VK_API_URLS = {
  authUrl: `${VK_AUTH_URL}?action=auth-url`,
  callback: `${VK_AUTH_URL}?action=callback`,
  refresh: `${VK_AUTH_URL}?action=refresh`,
  logout: `${VK_AUTH_URL}?action=logout`,
};

export default function VkCallback() {
  const navigate = useNavigate();
  const auth = useVkAuth({ apiUrls: VK_API_URLS });
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    auth.handleCallback().then((success) => {
      if (success && auth.user) {
        const authUser = {
          id: auth.user.id,
          name: auth.user.name || 'VK User',
          avatar_url: auth.user.avatar_url,
          vk_id: auth.user.vk_id,
          email: auth.user.email,
          is_admin: 0,
          auth_provider: 'vk',
        };
        localStorage.setItem('auth_user', JSON.stringify(authUser));
      }
      navigate('/', { replace: true });
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Icon name="Loader" className="w-10 h-10 animate-spin opacity-40 mb-4" />
      <p className="text-sm text-muted-foreground">Выполняется вход через ВКонтакте...</p>
    </div>
  );
}
