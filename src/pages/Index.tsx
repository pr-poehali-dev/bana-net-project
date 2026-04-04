import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Review, ApiUser, View, REVIEWS_URL, apiFetch, fileToBase64 } from '@/types/app';
import {
  AppNavigation,
  HomeView,
  ReviewsView,
  ReviewDetailView,
  AddReviewView,
  ProfileView,
  AdminView,
  SupportView,
} from '@/components/app/AppViews';

const EMPTY_FORM = {
  marketplace: '',
  product_article: '',
  product_link: '',
  seller: '',
  rating: 1,
  review_text: '',
};

const Index = () => {
  const { toast } = useToast();
  const { user, loading: authLoading, error: authError } = useAuth();

  const [currentView, setCurrentView] = useState<View>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [prevView, setPrevView] = useState<View>('reviews');

  // Home
  const [homeReviews, setHomeReviews] = useState<Review[]>([]);
  const [homeLoading, setHomeLoading] = useState(false);
  const [statsTotal, setStatsTotal] = useState<number | null>(null);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsSearch, setReviewsSearch] = useState('');
  const [reviewsMarketplace, setReviewsMarketplace] = useState('all');
  const reviewsSearchRef = useRef('');
  const reviewsMarketplaceRef = useRef('all');

  // Profile
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [myLoading, setMyLoading] = useState(false);

  // Admin
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState<ApiUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [moderateComment, setModerateComment] = useState<Record<number, string>>({});

  // Add review
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Support
  const [emailCopied, setEmailCopied] = useState(false);

  // ─── Fetchers ────────────────────────────────────────────────────────────────

  const fetchHomeData = useCallback(async () => {
    if (!user) return;
    setHomeLoading(true);
    try {
      const [revRes, statsRes] = await Promise.all([
        apiFetch(`${REVIEWS_URL}?status=approved`),
        apiFetch(`${REVIEWS_URL}?action=stats`),
      ]);
      if (revRes.ok) {
        const data = await revRes.json();
        setHomeReviews((data.reviews ?? []).slice(0, 3));
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStatsTotal(data.total ?? null);
      }
    } finally {
      setHomeLoading(false);
    }
  }, [user]);

  const fetchReviews = useCallback(async () => {
    if (!user) return;
    setReviewsLoading(true);
    const marketplace = reviewsMarketplaceRef.current;
    const search = reviewsSearchRef.current;
    const mp = marketplace !== 'all' ? `&marketplace=${encodeURIComponent(marketplace)}` : '';
    const sq = search ? `&search=${encodeURIComponent(search)}` : '';
    try {
      const res = await apiFetch(`${REVIEWS_URL}?status=approved${mp}${sq}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews ?? []);
      }
    } finally {
      setReviewsLoading(false);
    }
  }, [user]);

  const fetchMyReviews = useCallback(async () => {
    if (!user) return;
    setMyLoading(true);
    try {
      const res = await apiFetch(`${REVIEWS_URL}?my=1`);
      if (res.ok) {
        const data = await res.json();
        setMyReviews(data.reviews ?? []);
      }
    } finally {
      setMyLoading(false);
    }
  }, [user]);

  const fetchPending = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    setPendingLoading(true);
    try {
      const res = await apiFetch(`${REVIEWS_URL}?status=pending`);
      if (res.ok) {
        const data = await res.json();
        setPendingReviews(data.reviews ?? []);
      }
    } finally {
      setPendingLoading(false);
    }
  }, [user]);

  const fetchUsers = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    setUsersLoading(true);
    try {
      const res = await apiFetch(`${REVIEWS_URL}?action=users`);
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data.users ?? []);
      }
    } finally {
      setUsersLoading(false);
    }
  }, [user]);

  // ─── Navigation ──────────────────────────────────────────────────────────────

  const onNavigate = (view: View) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    if (view === 'home') fetchHomeData();
    if (view === 'reviews') fetchReviews();
    if (view === 'profile') fetchMyReviews();
    if (view === 'admin') { fetchPending(); fetchUsers(); }
  };

  useEffect(() => {
    if (user) fetchHomeData();
  }, [user, fetchHomeData]);

  // ─── Review actions ───────────────────────────────────────────────────────────

  const openReview = (review: Review) => {
    setPrevView(currentView);
    setSelectedReview(review);
    setCurrentView('review-detail');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (i: number) => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmitReview = async () => {
    if (!form.marketplace || !form.review_text || !form.rating) {
      toast({ title: 'Заполните обязательные поля', variant: 'destructive' });
      return;
    }
    if (uploadedFiles.length < 2) {
      toast({ title: 'Прикрепите минимум 2 фото', description: 'Скриншот отклонённого отзыва и фото товара', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const images = await Promise.all(uploadedFiles.map(fileToBase64));
      const res = await apiFetch(REVIEWS_URL, {
        method: 'POST',
        body: JSON.stringify({ ...form, images }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      toast({ title: 'Отзыв отправлен на модерацию', description: 'Ожидайте 24–48 часов' });
      setForm(EMPTY_FORM);
      setUploadedFiles([]);
      onNavigate('profile');
    } catch (e: unknown) {
      toast({ title: 'Ошибка отправки', description: e instanceof Error ? e.message : 'Попробуйте ещё раз', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Admin actions ────────────────────────────────────────────────────────────

  const handleModerate = async (id: number, status: 'approved' | 'rejected') => {
    const res = await apiFetch(`${REVIEWS_URL}?action=moderate`, {
      method: 'PUT',
      body: JSON.stringify({ review_id: id, status, admin_comment: moderateComment[id] ?? '' }),
    });
    if (res.ok) {
      toast({ title: status === 'approved' ? 'Отзыв одобрен' : 'Отзыв отклонён' });
      setPendingReviews(prev => prev.filter(r => r.id !== id));
      setModerateComment(prev => { const c = { ...prev }; delete c[id]; return c; });
    } else {
      toast({ title: 'Ошибка', variant: 'destructive' });
    }
  };

  const handleSetRole = async (id: number, role: 'user' | 'admin') => {
    const res = await apiFetch(`${REVIEWS_URL}?action=set-role`, {
      method: 'PUT',
      body: JSON.stringify({ user_id: id, role }),
    });
    if (res.ok) {
      toast({ title: role === 'admin' ? 'Права администратора выданы' : 'Права сняты' });
      setAdminUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    } else {
      toast({ title: 'Ошибка', variant: 'destructive' });
    }
  };

  const handleBlockUser = async (id: number, block: boolean) => {
    const res = await apiFetch(`${REVIEWS_URL}?action=block-user`, {
      method: 'PUT',
      body: JSON.stringify({ user_id: id, is_blocked: block }),
    });
    if (res.ok) {
      toast({ title: block ? 'Пользователь заблокирован' : 'Пользователь разблокирован' });
      setAdminUsers(prev => prev.map(u => u.id === id ? { ...u, is_blocked: block } : u));
    } else {
      toast({ title: 'Ошибка', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Удалить пользователя и все его отзывы? Это действие необратимо.')) return;
    const res = await apiFetch(`${REVIEWS_URL}?action=delete-user&user_id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast({ title: 'Пользователь удалён' });
      setAdminUsers(prev => prev.filter(u => u.id !== id));
    } else {
      toast({ title: 'Ошибка', variant: 'destructive' });
    }
  };

  // ─── Support ──────────────────────────────────────────────────────────────────

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('support@bananet.ru');
      setEmailCopied(true);
      toast({ title: 'Email скопирован' });
      setTimeout(() => setEmailCopied(false), 2000);
    } catch {
      toast({ title: 'Не удалось скопировать', variant: 'destructive' });
    }
  };

  const handleTelegramClick = () => {
    const url = 'https://t.me/bananet_support';
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  // ─── Auth states ──────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Авторизация...</p>
        </div>
      </div>
    );
  }

  if (authError || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center space-y-3 max-w-xs">
          <p className="text-lg font-semibold">Необходима авторизация</p>
          <p className="text-sm text-muted-foreground">{authError || 'Откройте приложение через Telegram'}</p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomeView
            homeReviews={homeReviews}
            homeLoading={homeLoading}
            statsTotal={statsTotal}
            onNavigate={onNavigate}
            onOpenReview={openReview}
          />
        );
      case 'reviews':
        return (
          <ReviewsView
            reviews={reviews}
            reviewsLoading={reviewsLoading}
            reviewsSearch={reviewsSearch}
            reviewsMarketplace={reviewsMarketplace}
            reviewsSearchRef={reviewsSearchRef}
            reviewsMarketplaceRef={reviewsMarketplaceRef}
            setReviewsSearch={setReviewsSearch}
            setReviewsMarketplace={setReviewsMarketplace}
            fetchReviews={fetchReviews}
            onOpenReview={openReview}
          />
        );
      case 'review-detail':
        return selectedReview ? (
          <ReviewDetailView review={selectedReview} onBack={() => onNavigate(prevView)} />
        ) : null;
      case 'add':
        if (user.role === 'admin') { onNavigate('admin'); return null; }
        return (
          <AddReviewView
            form={form}
            setForm={setForm}
            uploadedFiles={uploadedFiles}
            submitting={submitting}
            fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload}
            removeFile={removeFile}
            handleSubmitReview={handleSubmitReview}
          />
        );
      case 'profile':
        if (user.role === 'admin') { onNavigate('admin'); return null; }
        return (
          <ProfileView
            user={user}
            myReviews={myReviews}
            myLoading={myLoading}
            onNavigate={onNavigate}
            onOpenReview={openReview}
          />
        );
      case 'admin':
        return (
          <AdminView
            user={user}
            pendingReviews={pendingReviews}
            pendingLoading={pendingLoading}
            adminUsers={adminUsers}
            usersLoading={usersLoading}
            moderateComment={moderateComment}
            setModerateComment={setModerateComment}
            handleModerate={handleModerate}
            handleSetRole={handleSetRole}
            handleBlockUser={handleBlockUser}
            handleDeleteUser={handleDeleteUser}
          />
        );
      case 'support':
        return (
          <SupportView
            emailCopied={emailCopied}
            copyEmail={copyEmail}
            handleTelegramClick={handleTelegramClick}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation
        currentView={currentView}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        user={user}
        onNavigate={onNavigate}
      />
      <main className="container mx-auto px-4 pt-20 pb-10 max-w-2xl">
        {renderView()}
      </main>
    </div>
  );
};

export default Index;
