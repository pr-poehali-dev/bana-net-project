import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Review, ApiUser, View, LOGO_URL, apiFetch, fileToBase64, adminEmail, adminTelegram, REVIEWS_URL } from '@/types/app';
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

  const BASE = REVIEWS_URL;

  // ── Navigation ───────────────────────────────────────────────────────────────

  const handleNavigation = useCallback((view: View) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  }, []);

  const openReviewDetail = useCallback((review: Review) => {
    setSelectedReview(review);
    setCurrentView('review-detail');
  }, []);

  // ── Data Fetchers ────────────────────────────────────────────────────────────

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

  // ── Effects ──────────────────────────────────────────────────────────────────

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

  // ── Actions ───────────────────────────────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async () => {
    if (!form.marketplace) { toast({ title: 'Укажите маркетплейс', variant: 'destructive' }); return; }
    if (!form.rating) { toast({ title: 'Укажите рейтинг', variant: 'destructive' }); return; }
    if (form.review_text.trim().length < 50) { toast({ title: 'Отзыв слишком короткий', description: 'Минимум 50 символов.', variant: 'destructive' }); return; }
    if (uploadedFiles.length < 2) {
      toast({ title: 'Необходимы изображения', description: 'Прикрепите минимум 2 фото: скриншот отклонённого отзыва и фото товара.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const rawImages = await Promise.all(uploadedFiles.map(fileToBase64));
      const images = rawImages.map(b64 => b64.includes(',') ? b64.split(',')[1] : b64);
      const res = await apiFetch(BASE, { method: 'POST', body: JSON.stringify({ ...form, images }) });
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

  // ── Loading / Error screens ───────────────────────────────────────────────────

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
        <Button onClick={() => auth.login()} className="gradient-bg text-white">Повторить</Button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation
        currentView={currentView}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        user={auth.user}
        onNavigate={handleNavigation}
      />

      <main className="container mx-auto px-4 pt-20 pb-10 max-w-2xl">
        {currentView === 'home' && (
          <HomeView
            homeReviews={homeReviews}
            homeLoading={homeLoading}
            statsTotal={statsTotal}
            onNavigate={handleNavigation}
            onOpenReview={openReviewDetail}
          />
        )}
        {currentView === 'reviews' && (
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
            onOpenReview={openReviewDetail}
          />
        )}
        {currentView === 'review-detail' && selectedReview && (
          <ReviewDetailView
            review={selectedReview}
            onBack={() => setCurrentView('reviews')}
          />
        )}
        {currentView === 'add' && (
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
        )}
        {currentView === 'profile' && auth.user && (
          <ProfileView
            user={auth.user}
            myReviews={myReviews}
            myLoading={myLoading}
            onNavigate={handleNavigation}
            onOpenReview={openReviewDetail}
          />
        )}
        {currentView === 'admin' && auth.user && (
          <AdminView
            user={auth.user}
            pendingReviews={pendingReviews}
            pendingLoading={pendingLoading}
            adminUsers={adminUsers}
            usersLoading={usersLoading}
            moderateComment={moderateComment}
            setModerateComment={setModerateComment}
            handleModerate={handleModerate}
            handleSetRole={handleSetRole}
          />
        )}
        {currentView === 'support' && (
          <SupportView
            emailCopied={emailCopied}
            copyEmail={copyEmail}
            handleTelegramClick={handleTelegramClick}
          />
        )}
      </main>
    </div>
  );
};

export default Index;