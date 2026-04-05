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

  const [adminEmail, setAdminEmail] = useState('support@bananet.ru');
  const [adminTelegram, setAdminTelegram] = useState('https://t.me/bananet_support');
  const [editingContacts, setEditingContacts] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [tempTelegram, setTempTelegram] = useState('');

  const userId = user?.id ?? null;
  const isAdmin = user?.is_admin === 1;

  const { reviews, loading: reviewsLoading, reload: reloadReviews } = useReviews({ userId });
  const { reviews: myReviews } = useReviews({ my: true, userId });
  const { reviews: pendingReviews } = useReviews({ status: 'pending', userId: isAdmin ? userId : null });

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
      // Шаг 1: создаём отзыв без фото (~1кб)
      log('📋 Шаг 1: создаю отзыв...');
      const r1 = await apiFetch(REVIEWS_URL, { method: 'POST', body: JSON.stringify(formData) });
      log(`📥 HTTP ${r1.status}`);
      if (!r1.ok) {
        const d = await r1.json().catch(() => ({}));
        log(`❌ ${d.error || 'ошибка'}`);
        throw new Error(d.error || `HTTP ${r1.status}`);
      }
      const { id: reviewId } = await r1.json();
      log(`✅ Отзыв создан id=${reviewId}`);

      // Шаг 2: загружаем фото по одному напрямую в S3
      log('🖼️ Шаг 2: загружаю фото...');
      for (let i = 0; i < uploadedFiles.length; i++) {
        const f = uploadedFiles[i];
        const isLast = i === uploadedFiles.length - 1;
        log(`⬆️ Фото ${i + 1}/${uploadedFiles.length}: ${f.name} (${Math.round(f.size / 1024)}кб)`);
        const cdnUrl = await uploadImage(f, (msg) => log(`   ${msg}`));
        log(`✅ Загружено, прикрепляю...`);

        // Шаг 3: прикрепляем URL к отзыву
        const r2 = await apiFetch(`${REVIEWS_URL}?action=attach`, {
          method: 'POST',
          body: JSON.stringify({ review_id: reviewId, image_url: cdnUrl, is_last: isLast }),
        });
        if (!r2.ok) {
          const d = await r2.json().catch(() => ({}));
          log(`❌ Ошибка прикрепления: ${d.error || r2.status}`);
          throw new Error(d.error || 'Ошибка прикрепления фото');
        }
        log(`✅ Фото ${i + 1} прикреплено${isLast ? ' — отзыв отправлен!' : ''}`);
      }

      toast({ title: "Отзыв отправлен", description: "Ваш отзыв отправлен на модерацию. Ожидайте 24-48 часов." });
      setUploadedFiles([]);
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

  const handleSaveContacts = () => {
    setAdminEmail(tempEmail);
    setAdminTelegram(tempTelegram);
    setEditingContacts(false);
    toast({ title: "Контакты обновлены" });
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
        />
      )}
      {currentView === 'add' && (
        <AddReviewView
          uploadedFiles={uploadedFiles}
          onFileUpload={handleFileUpload}
          onRemoveFile={removeFile}
          onSubmit={handleSubmitReview}
          submitting={submitting}
          debugLogs={debugLogs}
          userId={userId}
        />
      )}
      {currentView === 'profile' && (
        <ProfileView
          user={user}
          reviews={myReviews}
        />
      )}
      {currentView === 'admin' && isAdmin && (
        <AdminView
          reviews={pendingReviews}
          adminEmail={adminEmail}
          adminTelegram={adminTelegram}
          editingContacts={editingContacts}
          setEditingContacts={setEditingContacts}
          tempEmail={tempEmail}
          setTempEmail={setTempEmail}
          tempTelegram={tempTelegram}
          setTempTelegram={setTempTelegram}
          onSaveContacts={handleSaveContacts}
          onModerate={reloadReviews}
        />
      )}
      {currentView === 'support' && (
        <SupportView
          adminEmail={adminEmail}
          adminTelegram={adminTelegram}
          emailCopied={emailCopied}
          onCopyEmail={copyEmail}
          onTelegramClick={handleTelegramClick}
        />
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