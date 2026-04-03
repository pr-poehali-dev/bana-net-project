import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth, getToken } from '@/hooks/useAuth';

const LOGO_URL = 'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/98f97b9b-13cb-4716-b813-29f161b52964.png';
const BANNER_URL = 'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/3ba56ce3-90a9-41a6-991b-2d5c1e085477.png';

const adminEmail = 'support@bananet.ru';
const adminTelegram = 'https://t.me/bananet_support';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Review {
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

interface ApiUser {
  id: number;
  name: string;
  telegram_id: string;
  avatar_url: string | null;
  role: 'user' | 'admin';
  is_blocked: boolean;
  created_at: string;
  reviews_count: number;
}

type View = 'home' | 'reviews' | 'add' | 'profile' | 'admin' | 'support' | 'review-detail';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const DEV_MOCK_REVIEWS = {
  reviews: [
    { id: 1, marketplace: 'Wildberries', product_article: '12345678', product_link: 'https://wildberries.ru/catalog/12345678', seller: 'ООО "Качественные товары"', rating: 4, review_text: 'Товар не соответствует описанию. Качество ужасное, вернуть не получилось. Мой честный отзыв заблокировали на площадке.', status: 'approved', created_at: '2024-01-15T10:00:00', author_name: 'Мария К.', author_avatar: null, telegram_id: '111', user_id: 2, images: [] },
    { id: 2, marketplace: 'OZON', product_article: '87654321', product_link: 'https://ozon.ru/product/87654321', seller: 'ИП Иванов', rating: 3, review_text: 'Продавец не отправил товар вовремя. Поддержка игнорирует. Отзыв удалили после жалобы продавца.', status: 'pending', created_at: '2024-01-20T12:00:00', author_name: 'Алексей П.', author_avatar: null, telegram_id: '222', user_id: 3, images: [] },
  ]
};
const DEV_MOCK_USERS = {
  users: [
    { id: 1, name: 'Admin (dev)', telegram_id: '477993854', avatar_url: null, role: 'admin', is_blocked: false, created_at: '2024-01-01T00:00:00', reviews_count: 0 },
    { id: 2, name: 'Мария К.', telegram_id: '111', avatar_url: null, role: 'user', is_blocked: false, created_at: '2024-01-10T00:00:00', reviews_count: 1 },
  ]
};

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-1/4" />
          </div>
        </div>
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-5/6" />
        <div className="flex gap-2">
          <div className="w-16 h-16 bg-muted rounded-lg" />
          <div className="w-16 h-16 bg-muted rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function MarketplaceBadge({ marketplace }: { marketplace: string }) {
  const isWB = marketplace === 'Wildberries';
  return (
    <Badge className={isWB ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-blue-100 text-blue-800 border-blue-200'}>
      {marketplace}
    </Badge>
  );
}

function RatingDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon
          key={i}
          name="ThumbsDown"
          size={14}
          className={i < rating ? 'text-primary fill-primary' : 'text-muted-foreground'}
        />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: Review['status'] }) {
  if (status === 'approved') return <Badge className="bg-green-100 text-green-800 border-green-200">Опубликован</Badge>;
  if (status === 'rejected') return <Badge className="bg-red-100 text-red-800 border-red-200">Отклонён</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">На модерации</Badge>;
}

function ReviewCard({ review, onClick }: { review: Review; onClick: () => void }) {
  const previewImages = review.images?.slice(0, 3) ?? [];
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="w-9 h-9 shrink-0">
              {review.author_avatar && <AvatarImage src={review.author_avatar} alt={review.author_name} />}
              <AvatarFallback className="text-xs gradient-bg text-white">
                {review.author_name?.charAt(0)?.toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{review.author_name}</p>
              <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
            </div>
          </div>
          <MarketplaceBadge marketplace={review.marketplace} />
        </div>

        <RatingDisplay rating={review.rating} />

        <p className="text-sm text-muted-foreground line-clamp-3">{review.review_text}</p>

        {previewImages.length > 0 && (
          <div className="flex gap-2">
            {previewImages.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Фото ${i + 1}`}
                className="w-16 h-16 rounded-lg object-cover border"
                loading="lazy"
              />
            ))}
            {(review.images?.length ?? 0) > 3 && (
              <div className="w-16 h-16 rounded-lg border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                +{review.images.length - 3}
              </div>
            )}
          </div>
        )}

        {(review.product_article || review.seller) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {review.product_article && <span>Арт: {review.product_article}</span>}
            {review.seller && <span>Продавец: {review.seller}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Index = () => {
  const auth = useAuth();
  const { toast } = useToast();

  const [currentView, setCurrentView] = useState<View>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);

  // Reviews list state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsSearch, setReviewsSearch] = useState('');
  const [reviewsMarketplace, setReviewsMarketplace] = useState('all');
  const reviewsSearchRef = useRef('');
  const reviewsMarketplaceRef = useRef('all');

  // Home page state
  const [homeReviews, setHomeReviews] = useState<Review[]>([]);
  const [homeLoading, setHomeLoading] = useState(false);
  const [statsTotal, setStatsTotal] = useState<number | null>(null);

  // Profile state
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [myLoading, setMyLoading] = useState(false);

  // Admin state
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState<ApiUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [moderateComment, setModerateComment] = useState<Record<number, string>>({});

  // Add review form state
  const [form, setForm] = useState({
    marketplace: '',
    product_article: '',
    product_link: '',
    seller: '',
    rating: 0,
    review_text: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BASE = import.meta.env.VITE_REVIEWS_URL as string;

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleNavigation = useCallback((view: View) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  }, []);

  const openReviewDetail = useCallback((review: Review) => {
    setSelectedReview(review);
    setCurrentView('review-detail');
  }, []);

  // ── Data Fetchers ───────────────────────────────────────────────────────────

  const fetchHomeReviews = useCallback(async () => {
    if (!auth.user) return;
    setHomeLoading(true);
    try {
      const res = await apiFetch(BASE);
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data = await res.json();
      const list: Review[] = data.reviews ?? data ?? [];
      setStatsTotal(list.length);
      setHomeReviews(list.filter(r => r.status === 'approved').slice(0, 3));
    } catch {
      // silent on home page
    } finally {
      setHomeLoading(false);
    }
  }, [auth.user, BASE]);

  const fetchReviews = useCallback(async () => {
    if (!auth.user) return;
    setReviewsLoading(true);
    try {
      const params = new URLSearchParams();
      const search = reviewsSearchRef.current.trim();
      const marketplace = reviewsMarketplaceRef.current;
      if (search) params.set('search', search);
      if (marketplace !== 'all') params.set('marketplace', marketplace);
      const url = params.toString() ? `${BASE}?${params}` : BASE;
      const res = await apiFetch(url);
      if (!res.ok) throw new Error('Ошибка загрузки отзывов');
      const data = await res.json();
      const list: Review[] = data.reviews ?? data ?? [];
      setReviews(list.filter(r => r.status === 'approved'));
    } catch (e: unknown) {
      toast({ title: 'Ошибка', description: e instanceof Error ? e.message : 'Не удалось загрузить отзывы', variant: 'destructive' });
    } finally {
      setReviewsLoading(false);
    }
  }, [auth.user, BASE, toast]);

  const fetchMyReviews = useCallback(async () => {
    if (!auth.user) return;
    setMyLoading(true);
    try {
      const res = await apiFetch(`${BASE}?my=1`);
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data = await res.json();
      setMyReviews(data.reviews ?? data ?? []);
    } catch (e: unknown) {
      toast({ title: 'Ошибка', description: e instanceof Error ? e.message : 'Не удалось загрузить ваши отзывы', variant: 'destructive' });
    } finally {
      setMyLoading(false);
    }
  }, [auth.user, BASE, toast]);

  const fetchPendingReviews = useCallback(async () => {
    if (!auth.user) return;
    setPendingLoading(true);
    try {
      const res = await apiFetch(`${BASE}?status=pending`);
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data = await res.json();
      setPendingReviews(data.reviews ?? data ?? []);
    } catch (e: unknown) {
      toast({ title: 'Ошибка', description: e instanceof Error ? e.message : 'Не удалось загрузить очередь', variant: 'destructive' });
    } finally {
      setPendingLoading(false);
    }
  }, [auth.user, BASE, toast]);

  const fetchAdminUsers = useCallback(async () => {
    if (!auth.user) return;
    setUsersLoading(true);
    try {
      const res = await apiFetch(`${BASE}?action=users`);
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data = await res.json();
      setAdminUsers(data.users ?? data ?? []);
    } catch (e: unknown) {
      toast({ title: 'Ошибка', description: e instanceof Error ? e.message : 'Не удалось загрузить пользователей', variant: 'destructive' });
    } finally {
      setUsersLoading(false);
    }
  }, [auth.user, BASE, toast]);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (currentView === 'home' && auth.user) fetchHomeReviews();
  }, [currentView, auth.user]); // eslint-disable-line

  useEffect(() => {
    if (currentView === 'reviews' && auth.user) fetchReviews();
  }, [currentView, auth.user]); // eslint-disable-line

  useEffect(() => {
    if (currentView === 'profile' && auth.user) fetchMyReviews();
  }, [currentView, auth.user]); // eslint-disable-line

  useEffect(() => {
    if (currentView === 'admin' && auth.user) {
      fetchPendingReviews();
      fetchAdminUsers();
    }
  }, [currentView, auth.user]); // eslint-disable-line

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async () => {
    if (!form.marketplace) {
      toast({ title: 'Укажите маркетплейс', variant: 'destructive' });
      return;
    }
    if (!form.rating) {
      toast({ title: 'Укажите рейтинг', variant: 'destructive' });
      return;
    }
    if (form.review_text.trim().length < 50) {
      toast({ title: 'Отзыв слишком короткий', description: 'Минимум 50 символов.', variant: 'destructive' });
      return;
    }
    if (uploadedFiles.length < 2) {
      toast({
        title: 'Необходимы изображения',
        description: 'Прикрепите минимум 2 фото: скриншот отклонённого отзыва и фото товара.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const rawImages = await Promise.all(uploadedFiles.map(fileToBase64));
      // Убираем data URL префикс (data:image/jpeg;base64,XXX → XXX)
      const images = rawImages.map(b64 => b64.includes(',') ? b64.split(',')[1] : b64);
      const res = await apiFetch(BASE, {
        method: 'POST',
        body: JSON.stringify({ ...form, images }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? 'Ошибка отправки');
      }
      toast({ title: 'Отзыв отправлен', description: 'Ваш отзыв отправлен на модерацию. Ожидайте 24-48 часов.' });
      setForm({ marketplace: '', product_article: '', product_link: '', seller: '', rating: 0, review_text: '' });
      setUploadedFiles([]);
      handleNavigation('profile');
    } catch (e: unknown) {
      toast({ title: 'Ошибка', description: e instanceof Error ? e.message : 'Не удалось отправить отзыв', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleModerate = async (reviewId: number, status: 'approved' | 'rejected') => {
    try {
      const res = await apiFetch(`${BASE}?action=moderate`, {
        method: 'PUT',
        body: JSON.stringify({ review_id: reviewId, status, admin_comment: moderateComment[reviewId] ?? '' }),
      });
      if (!res.ok) throw new Error('Ошибка');
      toast({ title: status === 'approved' ? 'Отзыв одобрен' : 'Отзыв отклонён' });
      fetchPendingReviews();
    } catch {
      toast({ title: 'Ошибка модерации', variant: 'destructive' });
    }
  };

  const handleSetRole = async (userId: number, role: 'user' | 'admin') => {
    try {
      const res = await apiFetch(`${BASE}?action=set-role`, {
        method: 'PUT',
        body: JSON.stringify({ user_id: userId, role }),
      });
      if (!res.ok) throw new Error('Ошибка');
      toast({ title: 'Роль обновлена' });
      fetchAdminUsers();
    } catch {
      toast({ title: 'Ошибка обновления роли', variant: 'destructive' });
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(adminEmail);
      setEmailCopied(true);
      toast({ title: 'Email скопирован', description: adminEmail });
      setTimeout(() => setEmailCopied(false), 2000);
    } catch {
      toast({ title: 'Не удалось скопировать', variant: 'destructive' });
    }
  };

  const handleTelegramClick = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(adminTelegram);
    } else {
      window.open(adminTelegram, '_blank');
    }
  };

  // ── Loading / Error screens ──────────────────────────────────────────────────

  if (auth.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <img src={LOGO_URL} alt="BANaNET" className="w-20 h-20 rounded-2xl object-contain animate-pulse" />
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Авторизация...</p>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <img src={LOGO_URL} alt="BANaNET" className="w-16 h-16 rounded-2xl object-contain" />
        <h2 className="text-xl font-bold text-destructive">Ошибка авторизации</h2>
        <p className="text-muted-foreground text-sm">{auth.error}</p>
        <Button onClick={() => auth.login()} className="gradient-bg text-white">
          Повторить
        </Button>
      </div>
    );
  }

  // ── Navigation renderer ───────────────────────────────────────────────────────

  const navLinks: { label: string; view: View; icon: string }[] = [
    { label: 'Главная', view: 'home', icon: 'Home' },
    { label: 'Отзывы', view: 'reviews', icon: 'MessageSquare' },
    { label: 'Добавить', view: 'add', icon: 'PlusCircle' },
    { label: 'Профиль', view: 'profile', icon: 'User' },
    { label: 'Поддержка', view: 'support', icon: 'HelpCircle' },
    ...(auth.user?.role === 'admin' ? [{ label: 'Админ', view: 'admin' as View, icon: 'Shield' }] : []),
  ];

  const renderNavigation = () => (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavigation('home')}>
            <img src={LOGO_URL} alt="BANaNET" className="w-10 h-10 rounded-xl object-contain" />
            <h1 className="text-xl md:text-2xl font-bold gradient-text">BANaNET</h1>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <button
                key={link.view}
                onClick={() => handleNavigation(link.view)}
                className={`transition-colors font-medium text-sm ${
                  currentView === link.view ? 'text-primary' : 'text-foreground hover:text-primary'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* User avatar desktop */}
          <div className="hidden md:flex items-center gap-3">
            {auth.user && (
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavigation('profile')}>
                <Avatar className="w-8 h-8">
                  {auth.user.avatar_url && <AvatarImage src={auth.user.avatar_url} alt={auth.user.name} />}
                  <AvatarFallback className="gradient-bg text-white text-xs">
                    {auth.user.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate max-w-[120px]">{auth.user.name}</span>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Icon name="Menu" size={22} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="gradient-text">Меню</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 mt-6">
                {auth.user && (
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg mb-2 bg-muted cursor-pointer"
                    onClick={() => handleNavigation('profile')}
                  >
                    <Avatar className="w-10 h-10">
                      {auth.user.avatar_url && <AvatarImage src={auth.user.avatar_url} alt={auth.user.name} />}
                      <AvatarFallback className="gradient-bg text-white text-sm">
                        {auth.user.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{auth.user.name}</p>
                      <p className="text-xs text-muted-foreground">@{auth.user.telegram_id}</p>
                    </div>
                  </div>
                )}
                {navLinks.map(link => (
                  <button
                    key={link.view}
                    onClick={() => handleNavigation(link.view)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      currentView === link.view
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <Icon name={link.icon as Parameters<typeof Icon>[0]['name']} size={18} />
                    {link.label}
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );

  // ── Home page ─────────────────────────────────────────────────────────────────

  const renderHome = () => (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden">
        <img src={BANNER_URL} alt="BANaNET banner" className="w-full h-48 md:h-64 object-cover" />
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-center px-4">
          <img src={LOGO_URL} alt="BANaNET" className="w-14 h-14 rounded-2xl object-contain mb-3" />
          <h2 className="text-2xl md:text-4xl font-bold">BANaNET</h2>
          <p className="text-sm md:text-base mt-2 opacity-90">Платформа честных отзывов о маркетплейсах</p>
          <Button
            className="mt-4 gradient-bg text-white border-0"
            onClick={() => handleNavigation('add')}
          >
            <Icon name="PlusCircle" size={16} className="mr-2" />
            Добавить отзыв
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6 pb-4">
            <div className="text-3xl font-bold gradient-text">{statsTotal ?? '...'}</div>
            <div className="text-sm text-muted-foreground mt-1">Отзывов опубликовано</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6 pb-4">
            <div className="text-3xl font-bold gradient-text">2</div>
            <div className="text-sm text-muted-foreground mt-1">Маркетплейса</div>
          </CardContent>
        </Card>
        <Card className="text-center col-span-2 md:col-span-1">
          <CardContent className="pt-6 pb-4">
            <div className="text-3xl font-bold gradient-text">100%</div>
            <div className="text-sm text-muted-foreground mt-1">Честных отзывов</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent reviews */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Последние отзывы</h3>
          <Button variant="ghost" size="sm" onClick={() => handleNavigation('reviews')}>
            Все отзывы
            <Icon name="ArrowRight" size={16} className="ml-1" />
          </Button>
        </div>
        {homeLoading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : homeReviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">Нет опубликованных отзывов</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {homeReviews.map(review => (
              <ReviewCard key={review.id} review={review} onClick={() => openReviewDetail(review)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Reviews page ───────────────────────────────────────────────────────────────

  const renderReviews = () => (
    <div className="space-y-5 animate-fade-in">
      <h2 className="text-2xl font-bold">Отзывы</h2>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Поиск по артикулу, продавцу, ссылке..."
          value={reviewsSearch}
          onChange={e => { setReviewsSearch(e.target.value); reviewsSearchRef.current = e.target.value; }}
          onKeyDown={e => e.key === 'Enter' && fetchReviews()}
          className="flex-1"
        />
        <Button onClick={fetchReviews} variant="outline" size="icon">
          <Icon name="Search" size={18} />
        </Button>
      </div>

      {/* Marketplace tabs */}
      <Tabs
        value={reviewsMarketplace}
        onValueChange={val => { setReviewsMarketplace(val); reviewsMarketplaceRef.current = val; setTimeout(fetchReviews, 0); }}
      >
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">Все</TabsTrigger>
          <TabsTrigger value="Wildberries" className="flex-1">Wildberries</TabsTrigger>
          <TabsTrigger value="OZON" className="flex-1">OZON</TabsTrigger>
        </TabsList>

        <TabsContent value={reviewsMarketplace} className="mt-4">
          {reviewsLoading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : reviews.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Icon name="MessageSquareOff" size={36} className="mx-auto mb-3 opacity-40" />
                <p>Отзывов не найдено</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reviews.map(review => (
                <ReviewCard key={review.id} review={review} onClick={() => openReviewDetail(review)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  // ── Review detail ─────────────────────────────────────────────────────────────

  const renderReviewDetail = () => {
    if (!selectedReview) return null;
    const r = selectedReview;
    return (
      <div className="space-y-5 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => setCurrentView('reviews')} className="-ml-2">
          <Icon name="ArrowLeft" size={18} className="mr-1" />
          Назад
        </Button>

        <Card>
          <CardContent className="p-5 space-y-4">
            {/* Author row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Avatar className="w-11 h-11">
                  {r.author_avatar && <AvatarImage src={r.author_avatar} alt={r.author_name} />}
                  <AvatarFallback className="gradient-bg text-white">
                    {r.author_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{r.author_name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                </div>
              </div>
              <MarketplaceBadge marketplace={r.marketplace} />
            </div>

            <RatingDisplay rating={r.rating} />

            <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.review_text}</p>

            {r.images && r.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {r.images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Фото ${i + 1}`}
                    className="w-full rounded-xl object-cover border aspect-square"
                    loading="lazy"
                  />
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-sm">
              {r.product_article && (
                <div>
                  <span className="text-muted-foreground text-xs">Артикул</span>
                  <p className="font-medium">{r.product_article}</p>
                </div>
              )}
              {r.seller && (
                <div>
                  <span className="text-muted-foreground text-xs">Продавец</span>
                  <p className="font-medium">{r.seller}</p>
                </div>
              )}
              {r.product_link && (
                <div className="col-span-2">
                  <span className="text-muted-foreground text-xs">Ссылка на товар</span>
                  <a
                    href={r.product_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-primary truncate text-sm"
                  >
                    {r.product_link}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ── Add Review page ───────────────────────────────────────────────────────────

  const renderAdd = () => (
    <div className="space-y-5 animate-fade-in">
      <h2 className="text-2xl font-bold">Добавить отзыв</h2>

      {/* Warning card */}
      <Card className="border-yellow-300 bg-yellow-50">
        <CardContent className="p-4 flex gap-3">
          <Icon name="AlertTriangle" size={20} className="text-yellow-600 shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 space-y-1">
            <p className="font-semibold">Обязательные вложения:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Скриншот отклонённого/удалённого отзыва из личного кабинета площадки</li>
              <li>Фотография купленного товара</li>
            </ul>
            <p className="text-xs mt-1 opacity-80">Без этих фото отзыв не пройдёт модерацию.</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Marketplace */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Маркетплейс *</label>
          <Select value={form.marketplace} onValueChange={val => setForm(f => ({ ...f, marketplace: val }))}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите маркетплейс" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Wildberries">Wildberries</SelectItem>
              <SelectItem value="OZON">OZON</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Article */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Артикул товара</label>
          <Input
            placeholder="Например: 12345678"
            value={form.product_article}
            onChange={e => setForm(f => ({ ...f, product_article: e.target.value }))}
          />
        </div>

        {/* Link */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Ссылка на товар</label>
          <Input
            placeholder="https://..."
            value={form.product_link}
            onChange={e => setForm(f => ({ ...f, product_link: e.target.value }))}
          />
        </div>

        {/* Seller */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Продавец (необязательно)</label>
          <Input
            placeholder="Название продавца"
            value={form.seller}
            onChange={e => setForm(f => ({ ...f, seller: e.target.value }))}
          />
        </div>

        {/* Rating */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Рейтинг *</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setForm(f => ({ ...f, rating: star }))}
                className={`p-2 rounded-lg border-2 transition-colors ${
                  form.rating >= star
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <Icon name="ThumbsDown" size={18} />
              </button>
            ))}
            {form.rating > 0 && (
              <span className="text-sm text-muted-foreground ml-1">{form.rating} / 5</span>
            )}
          </div>
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Текст отзыва * <span className="text-muted-foreground text-xs">({form.review_text.length}/50+ символов)</span>
          </label>
          <Textarea
            placeholder="Опишите вашу ситуацию подробно..."
            value={form.review_text}
            onChange={e => setForm(f => ({ ...f, review_text: e.target.value }))}
            rows={5}
          />
          {form.review_text.length > 0 && form.review_text.length < 50 && (
            <p className="text-xs text-destructive">Минимум 50 символов. Ещё {50 - form.review_text.length}.</p>
          )}
        </div>

        {/* File upload */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Фотографии * <span className="text-muted-foreground text-xs">(минимум 2)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed h-20"
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon name="Upload" size={20} className="mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">Нажмите для загрузки фото</span>
          </Button>
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Загружено ${i + 1}`}
                    className="w-20 h-20 rounded-lg object-cover border"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {uploadedFiles.length > 0 && uploadedFiles.length < 2 && (
            <p className="text-xs text-destructive">Прикрепите ещё {2 - uploadedFiles.length} фото</p>
          )}
        </div>

        <Button
          className="w-full gradient-bg text-white border-0"
          onClick={handleSubmitReview}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Отправка...
            </>
          ) : (
            <>
              <Icon name="Send" size={16} className="mr-2" />
              Отправить на модерацию
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // ── Profile page ──────────────────────────────────────────────────────────────

  const renderProfile = () => {
    if (!auth.user) return null;
    const published = myReviews.filter(r => r.status === 'approved').length;
    const pending = myReviews.filter(r => r.status === 'pending').length;
    return (
      <div className="space-y-5 animate-fade-in">
        {/* User card */}
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <Avatar className="w-16 h-16 shrink-0">
              {auth.user.avatar_url && <AvatarImage src={auth.user.avatar_url} alt={auth.user.name} />}
              <AvatarFallback className="gradient-bg text-white text-2xl">
                {auth.user.name?.charAt(0)?.toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-bold">{auth.user.name}</h3>
              <p className="text-sm text-muted-foreground">@{auth.user.telegram_id}</p>
              {auth.user.role === 'admin' && (
                <Badge className="mt-1 bg-purple-100 text-purple-800">Администратор</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{published}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Опубликованных</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{pending}</div>
              <div className="text-xs text-muted-foreground mt-0.5">На модерации</div>
            </CardContent>
          </Card>
        </div>

        {/* My reviews */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold">Мои отзывы</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation('add')}
            >
              <Icon name="Plus" size={16} className="mr-1" />
              Добавить
            </Button>
          </div>
          {myLoading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : myReviews.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Icon name="FileText" size={36} className="mx-auto mb-3 opacity-40" />
                <p>Вы ещё не добавили ни одного отзыва</p>
                <Button className="mt-3 gradient-bg text-white border-0" size="sm" onClick={() => handleNavigation('add')}>
                  Добавить первый отзыв
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myReviews.map(review => (
                <Card key={review.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openReviewDetail(review)}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <MarketplaceBadge marketplace={review.marketplace} />
                      <StatusBadge status={review.status} />
                    </div>
                    <p className="text-sm line-clamp-2 text-muted-foreground">{review.review_text}</p>
                    {review.status === 'rejected' && review.admin_comment && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">
                        <span className="font-semibold">Причина: </span>{review.admin_comment}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Admin page ────────────────────────────────────────────────────────────────

  const renderAdmin = () => {
    if (auth.user?.role !== 'admin') {
      return (
        <div className="text-center py-20 text-muted-foreground">
          <Icon name="Lock" size={40} className="mx-auto mb-3 opacity-40" />
          <p>Доступ запрещён</p>
        </div>
      );
    }
    return (
      <div className="space-y-5 animate-fade-in">
        <h2 className="text-2xl font-bold">Панель администратора</h2>
        <Tabs defaultValue="moderation">
          <TabsList className="w-full">
            <TabsTrigger value="moderation" className="flex-1">
              Модерация
              {pendingReviews.length > 0 && (
                <Badge className="ml-2 bg-primary text-white text-xs">{pendingReviews.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1">Пользователи</TabsTrigger>
          </TabsList>

          {/* Moderation tab */}
          <TabsContent value="moderation" className="mt-4 space-y-3">
            {pendingLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : pendingReviews.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  <Icon name="CheckCircle" size={36} className="mx-auto mb-3 opacity-40" />
                  <p>Очередь модерации пуста</p>
                </CardContent>
              </Card>
            ) : (
              pendingReviews.map(review => (
                <Card key={review.id}>
                  <CardContent className="p-4 space-y-3">
                    {/* Author */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          {review.author_avatar && <AvatarImage src={review.author_avatar} alt={review.author_name} />}
                          <AvatarFallback className="gradient-bg text-white text-xs">
                            {review.author_name?.charAt(0)?.toUpperCase() ?? '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{review.author_name}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                        </div>
                      </div>
                      <MarketplaceBadge marketplace={review.marketplace} />
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3">{review.review_text}</p>

                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2">
                        {review.images.slice(0, 3).map((src, i) => (
                          <img key={i} src={src} alt="" className="w-14 h-14 rounded-lg object-cover border" loading="lazy" />
                        ))}
                      </div>
                    )}

                    {review.product_article && (
                      <p className="text-xs text-muted-foreground">Арт: {review.product_article}</p>
                    )}

                    {/* Comment input */}
                    <Input
                      placeholder="Комментарий (необязательно)"
                      value={moderateComment[review.id] ?? ''}
                      onChange={e => setModerateComment(prev => ({ ...prev, [review.id]: e.target.value }))}
                      className="text-sm"
                    />

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleModerate(review.id, 'approved')}
                      >
                        <Icon name="Check" size={14} className="mr-1" />
                        Одобрить
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleModerate(review.id, 'rejected')}
                      >
                        <Icon name="X" size={14} className="mr-1" />
                        Отклонить
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Users tab */}
          <TabsContent value="users" className="mt-4 space-y-3">
            {usersLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : adminUsers.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">Нет пользователей</CardContent>
              </Card>
            ) : (
              adminUsers.map(user => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="w-10 h-10 shrink-0">
                          {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
                          <AvatarFallback className="gradient-bg text-white text-sm">
                            {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground">@{user.telegram_id}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-800 text-xs' : 'bg-gray-100 text-gray-700 text-xs'}>
                              {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{user.reviews_count} отзывов</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 text-xs"
                        onClick={() => handleSetRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                        disabled={user.id === auth.user?.id}
                      >
                        {user.role === 'admin' ? 'Снять права' : 'Сделать админом'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // ── Support page ──────────────────────────────────────────────────────────────

  const renderSupport = () => (
    <div className="space-y-5 animate-fade-in">
      <h2 className="text-2xl font-bold">Поддержка</h2>
      <p className="text-muted-foreground text-sm">Если у вас есть вопросы или проблемы — свяжитесь с нами.</p>

      {/* Email */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Icon name="Mail" size={22} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Email</p>
              <p className="text-sm text-muted-foreground">{adminEmail}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={copyEmail}>
            <Icon name={emailCopied ? 'Check' : 'Copy'} size={14} className="mr-1" />
            {emailCopied ? 'Скопировано' : 'Копировать'}
          </Button>
        </CardContent>
      </Card>

      {/* Telegram */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Icon name="Send" size={22} className="text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">Telegram</p>
              <p className="text-sm text-muted-foreground">@bananet_support</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleTelegramClick}>
            <Icon name="ExternalLink" size={14} className="mr-1" />
            Открыть
          </Button>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Часто задаваемые вопросы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              q: 'Как добавить отзыв?',
              a: 'Перейдите в раздел "Добавить", заполните форму и прикрепите обязательные фотографии. Отзыв будет опубликован после проверки модератором.',
            },
            {
              q: 'Почему мой отзыв не опубликован?',
              a: 'Отзывы проходят модерацию в течение 24-48 часов. Убедитесь, что вы приложили скриншот удалённого отзыва с маркетплейса и фото товара.',
            },
            {
              q: 'Можно ли удалить свой отзыв?',
              a: 'Для удаления опубликованного отзыва обратитесь в поддержку через Telegram или Email.',
            },
            {
              q: 'Какие маркетплейсы поддерживаются?',
              a: 'В данный момент мы принимаем отзывы о Wildberries и OZON.',
            },
          ].map((faq, i) => (
            <div key={i} className="border-b last:border-0 pb-3 last:pb-0">
              <p className="font-semibold text-sm">{faq.q}</p>
              <p className="text-sm text-muted-foreground mt-1">{faq.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {renderNavigation()}

      <main className="container mx-auto px-4 pt-20 pb-10 max-w-2xl">
        {currentView === 'home' && renderHome()}
        {currentView === 'reviews' && renderReviews()}
        {currentView === 'review-detail' && renderReviewDetail()}
        {currentView === 'add' && renderAdd()}
        {currentView === 'profile' && renderProfile()}
        {currentView === 'admin' && renderAdmin()}
        {currentView === 'support' && renderSupport()}
      </main>
    </div>
  );
};

export default Index;