import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useReviews } from '@/hooks/useReviews';
import { apiFetch, uploadImage, REVIEWS_URL, type Review } from '@/types/app';
import AppNavigation from '@/components/app/AppNavigation';
import { ReviewDetail } from '@/components/app/ReviewCard';
import { HomeView, ReviewsView, SearchView, AddReviewView, ProfileView, AdminView, SupportView } from '@/components/app/AppViews';
import TelegramGate from '@/components/app/TelegramGate';

const LOGO_URL = 'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/98f97b9b-13cb-4716-b813-29f161b52964.png';

type View = 'home' | 'reviews' | 'search' | 'add' | 'profile' | 'admin' | 'support' | 'review-detail';

const Index = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [currentView, setCurrentView] = useState<View>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [searchParam, setSearchParam] = useState<'article' | 'link' | 'seller'>('article');
  const [reviewSearchLink, setReviewSearchLink] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);


  const [resubmitData, setResubmitData] = useState<Review | null>(null);

  const userId = user?.id ?? null;
  const isAdmin = user?.is_admin === 1;

  const { reviews, loading: reviewsLoading, reload: reloadReviews } = useReviews({ userId });
  const { reviews: myReviews } = useReviews({ my: true, userId });

  const stats = {
    totalReviews: reviews.length,
    totalUsers: 0,
    publishedToday: 0,
  };

  const handleNavigation = (view: View) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const openReviewDetail = (review: Review) => {
    setSelectedReview(review);
    setCurrentView('review-detail');
  };

  const handleResubmit = (review: Review) => {
    setResubmitData(review);
    setUploadedFiles([]);
    setDebugLogs([]);
    setCurrentView('add');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (formData: {
    marketplace: string;
    product_article: string;
    product_link: string;
    seller: string;
    rating: number;
    review_text: string;
  }) => {
    const logs: string[] = [];
    const log = (msg: string) => { logs.push(msg); setDebugLogs([...logs]); };

    log(`🔄 Отправка...`);
    const token = localStorage.getItem('jwt_token');
    log(`🔑 токен: ${token ? token.slice(0, 20) + '...' : 'ОТСУТСТВУЕТ'}`);
    log(`📋 ${formData.marketplace}, рейтинг ${formData.rating}`);

    if (uploadedFiles.length < 2) {
      log('❌ Нужно минимум 2 файла');
      toast({ title: "Необходимы изображения", description: "Прикрепите минимум 2 изображения.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let reviewId: number;

      if (resubmitData) {
        // Повторная отправка отклонённого отзыва
        log(`🔄 Повторная отправка отзыва #${resubmitData.id}...`);
        const r1 = await apiFetch(`${REVIEWS_URL}?action=resubmit`, {
          method: 'PUT',
          body: JSON.stringify({ review_id: resubmitData.id, ...formData }),
        });
        log(`📥 HTTP ${r1.status}`);
        if (!r1.ok) {
          const d = await r1.json().catch(() => ({}));
          log(`❌ ${d.error || 'ошибка'}`);
          throw new Error(d.error || `HTTP ${r1.status}`);
        }
        const data = await r1.json();
        reviewId = data.id;
        log(`✅ Отзыв обновлён id=${reviewId}`);
      } else {
        // Шаг 1: создаём новый отзыв без фото
        log('📋 Шаг 1: создаю отзыв...');
        const r1 = await apiFetch(REVIEWS_URL, { method: 'POST', body: JSON.stringify(formData) });
        log(`📥 HTTP ${r1.status}`);
        if (!r1.ok) {
          const d = await r1.json().catch(() => ({}));
          log(`❌ ${d.error || 'ошибка'}`);
          throw new Error(d.error || `HTTP ${r1.status}`);
        }
        const data = await r1.json();
        reviewId = data.id;
        log(`✅ Отзыв создан id=${reviewId}`);
      }

      // Загружаем фото по одному
      log('🖼️ Загружаю фото...');
      for (let i = 0; i < uploadedFiles.length; i++) {
        const f = uploadedFiles[i];
        const isLast = i === uploadedFiles.length - 1;
        log(`⬆️ Фото ${i + 1}/${uploadedFiles.length}: ${f.name} (${Math.round(f.size / 1024)}кб)`);
        await uploadImage(f, reviewId, isLast, (msg) => log(`   ${msg}`));
        log(`✅ Фото ${i + 1} загружено${isLast ? ' — отзыв отправлен!' : ''}`);
      }

      toast({ title: "Отзыв отправлен", description: "Ваш отзыв отправлен на модерацию. Ожидайте 24-48 часов." });
      setUploadedFiles([]);
      setResubmitData(null);
      reloadReviews();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      log(`❌ ${msg}`);
      toast({ title: "Ошибка", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(adminEmail);
      setEmailCopied(true);
      toast({ title: "Email скопирован", description: adminEmail });
      setTimeout(() => setEmailCopied(false), 2000);
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
    }
  };

  const handleTelegramClick = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(adminTelegram);
    } else {
      window.open(adminTelegram, '_blank');
    }
  };



  if (authLoading) {
    return <TelegramGate loading={true} />;
  }

  if (!user) {
    return <TelegramGate loading={false} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <AppNavigation
        currentView={currentView}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onNavigate={handleNavigation}
        isAdmin={isAdmin}
      />

      {currentView === 'home' && (
        <HomeView
          reviews={reviews}
          loading={reviewsLoading}
          stats={stats}
          onNavigate={handleNavigation}
          onOpenReview={openReviewDetail}
        />
      )}
      {currentView === 'reviews' && (
        <ReviewsView
          reviews={reviews}
          loading={reviewsLoading}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          reviewSearchLink={reviewSearchLink}
          setReviewSearchLink={setReviewSearchLink}
          onOpenReview={openReviewDetail}
        />
      )}
      {currentView === 'search' && (
        <SearchView
          searchParam={searchParam}
          setSearchParam={setSearchParam}
          onOpenReview={openReviewDetail}
        />
      )}
      {currentView === 'add' && (
        <AddReviewView
          uploadedFiles={uploadedFiles}
          onFileUpload={handleFileUpload}
          onRemoveFile={removeFile}
          onSubmit={handleSubmitReview}
          submitting={submitting}
          initialData={resubmitData ? {
            marketplace: resubmitData.marketplace,
            product_article: resubmitData.product_article ?? '',
            product_link: resubmitData.product_link ?? '',
            seller: resubmitData.seller ?? '',
            rating: resubmitData.rating,
            review_text: resubmitData.review_text,
          } : undefined}
        />
      )}
      {currentView === 'profile' && (
        <ProfileView
          user={user}
          reviews={myReviews}
          onResubmit={handleResubmit}
        />
      )}
      {currentView === 'admin' && isAdmin && (
        <AdminView />
      )}
      {currentView === 'support' && (
        <SupportView />
      )}
      {currentView === 'review-detail' && selectedReview && (
        <ReviewDetail
          review={selectedReview}
          onBack={() => setCurrentView('reviews')}
        />
      )}

      <footer className="bg-gray-50 border-t border-gray-200 py-6 md:py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src={LOGO_URL} alt="BANaNET" className="w-8 h-8 object-contain" />
            <span className="font-bold gradient-text text-lg">BANaNET</span>
          </div>
          <p className="text-sm">© 2024 Платформа честных отзывов</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;