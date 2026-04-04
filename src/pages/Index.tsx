import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import AppNavigation from '@/components/app/AppNavigation';
import { ReviewDetail, type Review } from '@/components/app/ReviewCard';
import { HomeView, ReviewsView, SearchView, AddReviewView, ProfileView, AdminView, SupportView } from '@/components/app/AppViews';

const LOGO_URL = 'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/98f97b9b-13cb-4716-b813-29f161b52964.png';

const mockReviews: Review[] = [
  {
    id: 1,
    marketplace: 'Wildberries',
    productArticle: '12345678',
    productLink: 'https://wildberries.ru/catalog/12345678',
    seller: 'ООО "Качественные товары"',
    author: 'Мария К.',
    rating: 1,
    text: 'Товар не соответствует описанию. Качество ужасное, вернуть не получилось. Мой честный отзыв заблокировали на площадке.',
    fullText: 'Товар не соответствует описанию. Качество ужасное, вернуть не получилось. Мой честный отзыв заблокировали на площадке. Заказала куртку, пришла совершенно другого цвета и размера. Ткань тонкая, швы кривые. Написала честный отзыв с фото — его удалили через 2 часа. Поддержка маркетплейса не помогла.',
    date: '2024-01-15',
    status: 'published',
    images: [
      'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/3ba56ce3-90a9-41a6-991b-2d5c1e085477.png',
      'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/98f97b9b-13cb-4716-b813-29f161b52964.png'
    ]
  },
  {
    id: 2,
    marketplace: 'OZON',
    productArticle: '87654321',
    productLink: 'https://ozon.ru/product/87654321',
    seller: 'ИП Иванов',
    author: 'Алексей П.',
    rating: 2,
    text: 'Продавец не отправил товар вовремя. Поддержка игнорирует. Отзыв удалили после жалобы продавца.',
    fullText: 'Продавец не отправил товар вовремя. Поддержка игнорирует. Отзыв удалили после жалобы продавца. Ждал заказ 3 недели вместо обещанных 5 дней. Когда написал отзыв с описанием ситуации, продавец пожаловался и мой отзыв исчез. Деньги вернули только через месяц.',
    date: '2024-01-20',
    status: 'published',
    images: [
      'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/3ba56ce3-90a9-41a6-991b-2d5c1e085477.png',
      'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/98f97b9b-13cb-4716-b813-29f161b52964.png'
    ]
  },
  {
    id: 3,
    marketplace: 'Wildberries',
    productArticle: '11223344',
    productLink: 'https://wildberries.ru/catalog/11223344',
    seller: 'ООО "МегаТорг"',
    author: 'Елена С.',
    rating: 1,
    text: 'Пришел совершенно другой товар. Фото не соответствуют действительности. Мой негативный отзыв не прошел модерацию.',
    fullText: 'Пришел совершенно другой товар. Фото не соответствуют действительности. Мой негативный отзыв не прошел модерацию. На фото было красивое платье, а пришла тряпка с торчащими нитками. Размер на 2 больше указанного. Отзыв с фотографиями не прошёл модерацию маркетплейса — просто исчез без объяснений.',
    date: '2024-01-25',
    status: 'published',
    images: [
      'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/3ba56ce3-90a9-41a6-991b-2d5c1e085477.png',
      'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/98f97b9b-13cb-4716-b813-29f161b52964.png'
    ]
  }
];

type View = 'home' | 'reviews' | 'search' | 'add' | 'profile' | 'admin' | 'support' | 'review-detail';

const Index = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [currentView, setCurrentView] = useState<View>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [searchParam, setSearchParam] = useState<'article' | 'link' | 'seller'>('article');
  const [reviewSearchLink, setReviewSearchLink] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);

  const [adminEmail, setAdminEmail] = useState('support@bananet.ru');
  const [adminTelegram, setAdminTelegram] = useState('https://t.me/bananet_support');
  const [editingContacts, setEditingContacts] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [tempTelegram, setTempTelegram] = useState('');

  const stats = {
    totalReviews: 2847,
    totalUsers: 1523,
    publishedToday: 47
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

  const handleSubmitReview = () => {
    if (uploadedFiles.length < 2) {
      toast({
        title: "Необходимы изображения",
        description: "Прикрепите минимум 2 изображения: скриншот отклонённого отзыва из личного кабинета площадки и фотографию купленного товара.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Отзыв отправлен",
      description: "Ваш отзыв отправлен на модерацию. Ожидайте 24-48 часов.",
    });
    setUploadedFiles([]);
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
          reviews={mockReviews}
          stats={stats}
          onNavigate={handleNavigation}
          onOpenReview={openReviewDetail}
        />
      )}
      {currentView === 'reviews' && (
        <ReviewsView
          reviews={mockReviews}
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
        />
      )}
      {currentView === 'profile' && (
        <ProfileView reviews={mockReviews} />
      )}
      {currentView === 'admin' && (
        <AdminView
          reviews={mockReviews}
          adminEmail={adminEmail}
          adminTelegram={adminTelegram}
          setAdminEmail={setAdminEmail}
          setAdminTelegram={setAdminTelegram}
          editingContacts={editingContacts}
          setEditingContacts={setEditingContacts}
          tempEmail={tempEmail}
          setTempEmail={setTempEmail}
          tempTelegram={tempTelegram}
          setTempTelegram={setTempTelegram}
          onSaveContacts={handleSaveContacts}
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
