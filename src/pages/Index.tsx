import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useReviews } from '@/hooks/useReviews';
import { apiFetch, fileToBase64, REVIEWS_URL, type Review } from '@/types/app';
import AppNavigation from '@/components/app/AppNavigation';
import { ReviewDetail } from '@/components/app/ReviewCard';
import { HomeView, ReviewsView, SearchView, AddReviewView, ProfileView, AdminView, SupportView } from '@/components/app/AppViews';
import TelegramGate from '@/components/app/TelegramGate';

const LOGO_URL = 'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/98f97b9b-13cb-4716-b813-29f161b52964.png';

type View = 'home' | 'reviews' | 'search' | 'add' | 'profile' | 'admin' | 'support' | 'review-detail';

const Index = () => {
  const { toast } = useToast();
  const { user, loading: authLoading, error: authError } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [currentView, setCurrentView] = useState<View>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [searchParam, setSearchParam] = useState<'article' | 'link' | 'seller'>('article');
  const [reviewSearchLink, setReviewSearchLink] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [adminEmail, setAdminEmail] = useState('support@bananet.ru');
  const [adminTelegram, setAdminTelegram] = useState('https://t.me/bananet_support');
  const [editingContacts, setEditingContacts] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [tempTelegram, setTempTelegram] = useState('');

  const { reviews, loading: reviewsLoading, reload: reloadReviews } = useReviews();
  const { reviews: myReviews } = useReviews({ my: true, autoLoad: !!user });
  const { reviews: pendingReviews } = useReviews({ status: 'pending', autoLoad: user?.role === 'admin' });

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
    if (uploadedFiles.length < 2) {
      toast({
        title: "Необходимы изображения",
        description: "Прикрепите минимум 2 изображения: скриншот отклонённого отзыва из личного кабинета площадки и фотографию купленного товара.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const images = await Promise.all(uploadedFiles.map(fileToBase64));
      const res = await apiFetch(REVIEWS_URL, {
        method: 'POST',
        body: JSON.stringify({ ...formData, images }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка отправки');
      }

      toast({ title: "Отзыв отправлен", description: "Ваш отзыв отправлен на модерацию. Ожидайте 24-48 часов." });
      setUploadedFiles([]);
      reloadReviews();
    } catch (e: unknown) {
      toast({ title: "Ошибка", description: e instanceof Error ? e.message : 'Не удалось отправить отзыв', variant: "destructive" });
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

  const isTelegram = !!window.Telegram?.WebApp?.initData;
  if (!isTelegram && (authLoading || authError || !user)) {
    return <TelegramGate loading={authLoading} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <AppNavigation
        currentView={currentView}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onNavigate={handleNavigation}
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
        />
      )}
      {currentView === 'profile' && (
        <ProfileView
          user={user}
          reviews={myReviews}
        />
      )}
      {currentView === 'admin' && (
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