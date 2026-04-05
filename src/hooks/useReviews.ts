import { useState, useEffect, useCallback } from 'react';
import { REVIEWS_URL, apiFetch, type Review } from '@/types/app';

interface UseReviewsOptions {
  status?: string;
  my?: boolean;
  marketplace?: string;
  search?: string;
  userId?: number | null;
}

export function useReviews(options: UseReviewsOptions = {}) {
  const { status, my, marketplace, search, userId = null } = options;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (my) params.set('my', '1');
      if (marketplace) params.set('marketplace', marketplace);
      if (search) params.set('search', search);

      const url = `${REVIEWS_URL}?${params.toString()}`;
      const res = await apiFetch(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка загрузки отзывов');
      }
      const data = await res.json();
      setReviews(data.reviews ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [status, my, marketplace, search, userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { reviews, loading, error, reload: load };
}
