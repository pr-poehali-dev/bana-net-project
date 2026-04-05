import { getToken } from '@/hooks/useAuth';
import func2url from '../../backend/func2url.json';

export const REVIEWS_URL: string = func2url['reviews'];
export const TG_MINI_AUTH_URL: string = func2url['tg-mini-auth'];
export const PRESIGNED_URL: string = func2url['presigned-url'];

export interface Review {
  id: number;
  marketplace: string;
  product_article: string | null;
  product_link: string | null;
  seller: string | null;
  rating: number;
  review_text: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  author_name: string;
  author_avatar: string | null;
  telegram_id: string;
  user_id: number;
  images: string[];
  admin_comment?: string | null;
}

export interface ApiUser {
  id: number;
  name: string;
  telegram_id: string;
  avatar_url: string | null;
  is_admin: number;
  is_blocked: boolean;
  created_at: string;
  reviews_count: number;
}

export type View = 'home' | 'reviews' | 'add' | 'profile' | 'admin' | 'support' | 'review-detail';

export const LOGO_URL = 'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/98f97b9b-13cb-4716-b813-29f161b52964.png';
export const BANNER_URL = 'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/3ba56ce3-90a9-41a6-991b-2d5c1e085477.png';
export const adminEmail = 'support@bananet.ru';
export const adminTelegram = 'https://t.me/bananet_support';

const DEV_MOCK_REVIEWS = {
  reviews: [
    { id: 1, marketplace: 'Wildberries', product_article: '12345678', product_link: 'https://wildberries.ru/catalog/12345678', seller: 'ООО "Качественные товары"', rating: 4, review_text: 'Товар не соответствует описанию. Качество ужасное, вернуть не получилось. Мой честный отзыв заблокировали на площадке.', status: 'approved', created_at: '2024-01-15T10:00:00', author_name: 'Мария К.', author_avatar: null, telegram_id: '111', user_id: 2, images: [] },
    { id: 2, marketplace: 'OZON', product_article: '87654321', product_link: 'https://ozon.ru/product/87654321', seller: 'ИП Иванов', rating: 3, review_text: 'Продавец не отправил товар вовремя. Поддержка игнорирует. Отзыв удалили после жалобы продавца.', status: 'pending', created_at: '2024-01-20T12:00:00', author_name: 'Алексей П.', author_avatar: null, telegram_id: '222', user_id: 3, images: [] },
  ],
};
const DEV_MOCK_USERS = {
  users: [
    { id: 1, name: 'Admin (dev)', telegram_id: '477993854', avatar_url: null, is_admin: 1, is_blocked: false, created_at: '2024-01-01T00:00:00', reviews_count: 0 },
    { id: 2, name: 'Мария К.', telegram_id: '111', avatar_url: null, is_admin: 0, is_blocked: false, created_at: '2024-01-10T00:00:00', reviews_count: 1 },
  ],
};

function authHeaders(): HeadersInit {
  const token = getToken();
  if (!token) return {};
  return { 'X-Authorization': `Bearer ${token}` };
}

export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  if (import.meta.env.DEV && getToken() === 'dev-token') {
    const method = init?.method?.toUpperCase() || 'GET';
    const urlObj = new URL(url, window.location.href);
    const action = urlObj.searchParams.get('action');
    if (method === 'GET') {
      const mock = action === 'users' ? DEV_MOCK_USERS : DEV_MOCK_REVIEWS;
      return new Response(JSON.stringify(mock), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ id: 99, status: 'pending', images: [] }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  }
  return fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  });
}

export function fileToBase64(file: File, maxSize = 900, quality = 0.65): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) { height = Math.round(height * maxSize / width); width = maxSize; }
        else { width = Math.round(width * maxSize / height); height = maxSize; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function uploadImage(file: File, onProgress?: (msg: string) => void): Promise<string> {
  // Сжимаем изображение
  onProgress?.('сжатие...');
  const blob = await new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas error')), 'image/jpeg', 0.75);
    };
    img.onerror = reject;
    img.src = url;
  });

  onProgress?.(`сжато до ${Math.round(blob.size / 1024)}кб, получаю URL...`);

  // Получаем presigned URL от бэкенда
  const res1 = await apiFetch(PRESIGNED_URL, {
    method: 'POST',
    body: JSON.stringify({ ext: 'jpg' }),
  });
  if (!res1.ok) {
    const d = await res1.json().catch(() => ({}));
    throw new Error(d.error || `Ошибка получения URL: HTTP ${res1.status}`);
  }
  const { upload_url, cdn_url, content_type } = await res1.json();

  onProgress?.(`загружаю в хранилище...`);

  // Загружаем файл напрямую в S3 — без токенов, без лимитов платформы
  const res2 = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': content_type },
    body: blob,
  });
  if (!res2.ok) {
    throw new Error(`Ошибка загрузки в хранилище: HTTP ${res2.status}`);
  }

  onProgress?.(`готово`);
  return cdn_url as string;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}