import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const LOGO_URL = 'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/98f97b9b-13cb-4716-b813-29f161b52964.png';
const BANNER_URL = 'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/3ba56ce3-90a9-41a6-991b-2d5c1e085477.png';

const mockReviews = [
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

const Index = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [currentView, setCurrentView] = useState<'home' | 'reviews' | 'search' | 'add' | 'profile' | 'admin' | 'support' | 'review-detail'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<typeof mockReviews[0] | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [searchParam, setSearchParam] = useState<'article' | 'link' | 'seller'>('article');
  const [reviewSearchLink, setReviewSearchLink] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleNavigation = (view: typeof currentView) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const openReviewDetail = (review: typeof mockReviews[0]) => {
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

  const renderNavigation = () => (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavigation('home')}>
            <img src={LOGO_URL} alt="BANaNET" className="w-10 h-10 rounded-xl object-contain" />
            <h1 className="text-xl md:text-2xl font-bold gradient-text">BANaNET</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => handleNavigation('home')} className={`transition-colors font-medium ${currentView === 'home' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
              Главная
            </button>
            <button onClick={() => handleNavigation('reviews')} className={`transition-colors font-medium ${currentView === 'reviews' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
              Отзывы
            </button>
            <button onClick={() => handleNavigation('search')} className={`transition-colors font-medium ${currentView === 'search' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
              Поиск
            </button>
            <button onClick={() => handleNavigation('add')} className={`transition-colors font-medium ${currentView === 'add' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
              Добавить отзыв
            </button>
            <button onClick={() => handleNavigation('support')} className={`transition-colors font-medium ${currentView === 'support' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
              Поддержка
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button onClick={() => handleNavigation('profile')} variant="outline" size="sm">
              <Icon name="User" className="w-4 h-4 mr-2" />
              Профиль
            </Button>
            <Button onClick={() => handleNavigation('admin')} size="sm" className="gradient-bg">
              <Icon name="Shield" className="w-4 h-4 mr-2" />
              Админ
            </Button>
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Icon name="Menu" className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <img src={LOGO_URL} alt="BANaNET" className="w-10 h-10 rounded-xl object-contain" />
                  <span className="gradient-text">BANaNET</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                <Button onClick={() => handleNavigation('home')} variant="ghost" className="justify-start text-lg h-12">
                  <Icon name="Home" className="w-5 h-5 mr-3" />
                  Главная
                </Button>
                <Button onClick={() => handleNavigation('reviews')} variant="ghost" className="justify-start text-lg h-12">
                  <Icon name="MessageSquare" className="w-5 h-5 mr-3" />
                  Отзывы
                </Button>
                <Button onClick={() => handleNavigation('search')} variant="ghost" className="justify-start text-lg h-12">
                  <Icon name="Search" className="w-5 h-5 mr-3" />
                  Поиск
                </Button>
                <Button onClick={() => handleNavigation('add')} variant="ghost" className="justify-start text-lg h-12">
                  <Icon name="MessageSquarePlus" className="w-5 h-5 mr-3" />
                  Добавить отзыв
                </Button>
                <Button onClick={() => handleNavigation('support')} variant="ghost" className="justify-start text-lg h-12">
                  <Icon name="HelpCircle" className="w-5 h-5 mr-3" />
                  Поддержка
                </Button>
                <div className="border-t pt-4 mt-4">
                  <Button onClick={() => handleNavigation('profile')} variant="outline" className="w-full justify-start text-lg h-12 mb-3">
                    <Icon name="User" className="w-5 h-5 mr-3" />
                    Профиль
                  </Button>
                  <Button onClick={() => handleNavigation('admin')} className="w-full justify-start text-lg h-12 gradient-bg">
                    <Icon name="Shield" className="w-5 h-5 mr-3" />
                    Админ-панель
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );

  const renderReviewCard = (review: typeof mockReviews[0], index: number) => (
    <Card 
      key={review.id} 
      className="animate-fade-in hover:shadow-lg transition-shadow cursor-pointer" 
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={() => openReviewDetail(review)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <Avatar className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
              <AvatarFallback className="gradient-bg text-white text-sm">{review.author[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base md:text-lg truncate">{review.author}</CardTitle>
              <CardDescription className="flex items-center gap-1 md:gap-2 flex-wrap">
                <Badge variant={review.marketplace === 'Wildberries' ? 'default' : 'secondary'} className="text-xs">
                  {review.marketplace}
                </Badge>
                <span className="text-xs">{review.date}</span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Icon name="ThumbsDown" className="w-4 h-4 md:w-5 md:h-5 text-destructive fill-destructive" />
            <span className="text-sm md:text-base font-semibold text-destructive">{review.rating}/5</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm md:text-base text-foreground mb-3 md:mb-4 line-clamp-2">{review.text}</p>
        {review.images && review.images.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {review.images.slice(0, 3).map((img, i) => (
              <img key={i} src={img} alt="" className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover flex-shrink-0" />
            ))}
            {review.images.length > 3 && (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-sm text-muted-foreground">+{review.images.length - 3}</span>
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 text-xs md:text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Icon name="Package" className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="truncate">Артикул: {review.productArticle}</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon name="Store" className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="truncate">Продавец: {review.seller}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderReviewDetail = () => {
    if (!selectedReview) return null;
    return (
      <div className="min-h-screen pt-20 md:pt-24 pb-8 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Button variant="ghost" className="mb-4" onClick={() => setCurrentView('reviews')}>
              <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
              Назад к отзывам
            </Button>
            
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="gradient-bg text-white text-lg">{selectedReview.author[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">{selectedReview.author}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant={selectedReview.marketplace === 'Wildberries' ? 'default' : 'secondary'}>
                          {selectedReview.marketplace}
                        </Badge>
                        <span>{selectedReview.date}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="ThumbsDown" className="w-6 h-6 text-destructive fill-destructive" />
                    <span className="text-lg font-bold text-destructive">{selectedReview.rating}/5</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base md:text-lg leading-relaxed">{selectedReview.fullText || selectedReview.text}</p>
                
                {selectedReview.images && selectedReview.images.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Прикреплённые изображения</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedReview.images.map((img, i) => (
                        <img key={i} src={img} alt={`Фото ${i + 1}`} className="w-full aspect-square rounded-lg object-cover" />
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Icon name="Package" className="w-4 h-4" />
                    <span>Артикул: {selectedReview.productArticle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Link" className="w-4 h-4" />
                    <a href={selectedReview.productLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                      {selectedReview.productLink}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Store" className="w-4 h-4" />
                    <span>Продавец: {selectedReview.seller}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderHome = () => (
    <div className="min-h-screen pt-16">
      <section className="relative text-white py-12 md:py-20 animate-fade-in overflow-hidden">
        <div className="absolute inset-0">
          <img src={BANNER_URL} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-accent/80 to-secondary/85"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-4 md:mb-6 animate-scale-in">
              <img src={LOGO_URL} alt="BANaNET" className="w-20 h-20 md:w-28 md:h-28 mx-auto mb-4 drop-shadow-lg" />
            </div>
            <div className="inline-block mb-4 md:mb-6">
              <Badge className="bg-white/20 text-white border-white/30 text-sm md:text-lg px-4 md:px-6 py-1.5 md:py-2">Платформа для честных отзывов</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 animate-slide-up px-4">Твой отзыв важен!</h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 text-white/90 animate-slide-up px-4" style={{ animationDelay: '0.1s' }}>Публикуй отзывы, которые заблокировали маркетплейсы. Помоги другим избежать плохих покупок.</p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center animate-slide-up px-4" style={{ animationDelay: '0.2s' }}>
              <Button onClick={() => handleNavigation('add')} size="lg" className="bg-white text-primary hover:bg-white/90 text-base md:text-lg px-6 md:px-8 py-5 md:py-6 w-full sm:w-auto">
                <Icon name="MessageSquarePlus" className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Написать отзыв
              </Button>
              <Button onClick={() => handleNavigation('reviews')} size="lg" variant="outline" className="border-2 border-white bg-white/10 text-white hover:bg-white hover:text-primary transition-all text-base md:text-lg px-6 md:px-8 py-5 md:py-6 w-full sm:w-auto font-semibold">
                <Icon name="Search" className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Найти отзывы
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
            <Card className="text-center animate-fade-in hover:shadow-lg transition-shadow">
              <CardHeader className="py-4 md:py-6">
                <div className="w-12 h-12 md:w-16 md:h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Icon name="MessageSquare" className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <CardTitle className="text-2xl md:text-4xl font-bold gradient-text">{stats.totalReviews}</CardTitle>
                <CardDescription className="text-sm md:text-lg">Опубликовано отзывов</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center animate-fade-in hover:shadow-lg transition-shadow" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="py-4 md:py-6">
                <div className="w-12 h-12 md:w-16 md:h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Icon name="Users" className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <CardTitle className="text-2xl md:text-4xl font-bold gradient-text">{stats.totalUsers}</CardTitle>
                <CardDescription className="text-sm md:text-lg">Активных пользователей</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center animate-fade-in hover:shadow-lg transition-shadow" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="py-4 md:py-6">
                <div className="w-12 h-12 md:w-16 md:h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Icon name="TrendingUp" className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <CardTitle className="text-2xl md:text-4xl font-bold gradient-text">{stats.publishedToday}</CardTitle>
                <CardDescription className="text-sm md:text-lg">Новых за сегодня</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 gradient-text">Последние отзывы</h2>
            <div className="space-y-4 md:space-y-6">
              {mockReviews.map((review, index) => renderReviewCard(review, index))}
            </div>
            <div className="text-center mt-6 md:mt-8">
              <Button onClick={() => handleNavigation('reviews')} size="lg" variant="outline" className="w-full sm:w-auto">
                Показать все отзывы
                <Icon name="ArrowRight" className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderReviews = () => (
    <div className="min-h-screen pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 gradient-text">Все отзывы</h1>
          
          <div className="mb-6 md:mb-8">
            <label className="text-sm font-medium mb-2 block">Поиск по ссылке на товар</label>
            <div className="relative">
              <Icon name="Link" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Вставьте ссылку на товар (https://wildberries.ru/catalog/...)" 
                className="pl-10 h-12 md:h-11"
                value={reviewSearchLink}
                onChange={(e) => setReviewSearchLink(e.target.value)}
              />
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6 md:mb-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="wildberries">Wildberries</TabsTrigger>
              <TabsTrigger value="ozon">OZON</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4 md:space-y-6">
            {mockReviews
              .filter(review => 
                activeTab === 'all' || 
                review.marketplace.toLowerCase() === activeTab
              )
              .filter(review => 
                !reviewSearchLink || review.productLink.toLowerCase().includes(reviewSearchLink.toLowerCase())
              )
              .map((review, index) => renderReviewCard(review, index))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSearch = () => (
    <div className="min-h-screen pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 gradient-text">Поиск отзывов</h1>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Найти отзыв</CardTitle>
              <CardDescription className="text-sm">Выберите один из параметров для поиска</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Параметр поиска</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant={searchParam === 'article' ? 'default' : 'outline'} 
                    className={searchParam === 'article' ? 'gradient-bg' : ''}
                    onClick={() => setSearchParam('article')}
                    size="sm"
                  >
                    Артикул
                  </Button>
                  <Button 
                    variant={searchParam === 'link' ? 'default' : 'outline'}
                    className={searchParam === 'link' ? 'gradient-bg' : ''}
                    onClick={() => setSearchParam('link')}
                    size="sm"
                  >
                    Ссылка
                  </Button>
                  <Button 
                    variant={searchParam === 'seller' ? 'default' : 'outline'}
                    className={searchParam === 'seller' ? 'gradient-bg' : ''}
                    onClick={() => setSearchParam('seller')}
                    size="sm"
                  >
                    Продавец
                  </Button>
                </div>
              </div>

              {searchParam === 'article' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Артикул товара</label>
                  <Input placeholder="Например: 12345678" className="h-11 md:h-10" />
                </div>
              )}

              {searchParam === 'link' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Ссылка на товар</label>
                  <Input placeholder="https://wildberries.ru/catalog/..." className="h-11 md:h-10" />
                </div>
              )}

              {searchParam === 'seller' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Имя продавца</label>
                  <Input placeholder="ООО 'Название компании'" className="h-11 md:h-10" />
                </div>
              )}

              <Button className="w-full gradient-bg h-12 md:h-10 text-base md:text-sm">
                <Icon name="Search" className="w-4 h-4 mr-2" />
                Найти отзывы
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderAddReview = () => (
    <div className="min-h-screen pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-6 md:mb-8">
            <h1 className="text-2xl md:text-4xl font-bold gradient-text">Добавить отзыв</h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1">
                  <Icon name="Info" className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground hover:text-primary transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-sm p-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold flex items-center gap-1 mb-1">
                      <Icon name="CheckCircle" className="w-4 h-4 text-green-500" />
                      Что можно публиковать
                    </p>
                    <ul className="ml-5 space-y-0.5 text-muted-foreground">
                      <li>• Честные отзывы о товарах и продавцах</li>
                      <li>• Отзывы, заблокированные маркетплейсами</li>
                      <li>• Описание реальных проблем с покупками</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-1 mb-1">
                      <Icon name="XCircle" className="w-4 h-4 text-destructive" />
                      Запрещено
                    </p>
                    <ul className="ml-5 space-y-0.5 text-muted-foreground">
                      <li>• Оскорбления и нецензурная лексика</li>
                      <li>• Ложная информация и спам</li>
                      <li>• Накрутка рейтингов</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-1 mb-1">
                      <Icon name="Clock" className="w-4 h-4 text-primary" />
                      Модерация
                    </p>
                    <p className="ml-5 text-muted-foreground">Все отзывы проверяются в течение 24-48 часов. Необходимы скриншоты.</p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          <Card className="mb-4 border-amber-200 bg-amber-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex gap-3">
                <Icon name="AlertTriangle" className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Обязательные изображения (минимум 2):</p>
                  <ol className="list-decimal ml-4 space-y-0.5">
                    <li>Скриншот отклонённого отзыва из личного кабинета площадки</li>
                    <li>Фотография купленного товара</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-xl">Новый отзыв</CardTitle>
              <CardDescription className="text-sm">Расскажите о своем опыте покупки</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Маркетплейс *</label>
                <Select>
                  <SelectTrigger className="h-11 md:h-10">
                    <SelectValue placeholder="Выберите маркетплейс" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wildberries">Wildberries</SelectItem>
                    <SelectItem value="ozon">OZON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Артикул товара *</label>
                <Input placeholder="12345678" className="h-11 md:h-10" />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ссылка на товар *</label>
                <Input placeholder="https://wildberries.ru/catalog/..." className="h-11 md:h-10" />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Продавец (необязательно)</label>
                <Input placeholder="ООО 'Название компании'" className="h-11 md:h-10" />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Оценка недовольства *</label>
                <CardDescription className="text-xs mb-3">От 1 (немного недоволен) до 5 (крайне недоволен)</CardDescription>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button key={rating} variant="outline" size="sm" className="h-10 flex-1 min-w-[60px] md:flex-none hover:bg-destructive hover:text-white hover:border-destructive">
                      <Icon name="ThumbsDown" className="w-4 h-4 mr-1" />
                      {rating}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ваш отзыв *</label>
                <Textarea 
                  placeholder="Опишите свою ситуацию, проблему с товаром или продавцом..." 
                  className="min-h-[120px] md:min-h-[150px] text-base"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                  Изображения *
                  <span className="text-destructive">(минимум 2)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon name="Upload" className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs md:text-sm text-muted-foreground">1. Скриншот отклонённого отзыва из личного кабинета</p>
                  <p className="text-xs md:text-sm text-muted-foreground">2. Фотография купленного товара</p>
                  <p className="text-xs text-muted-foreground mt-2">Нажмите для выбора файлов</p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <Icon name="Image" className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeFile(index)}>
                          <Icon name="X" className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Загружено: {uploadedFiles.length} из минимум 2
                    </p>
                  </div>
                )}
              </div>

              <Button 
                className="w-full gradient-bg h-12 md:h-11 text-base md:text-sm" 
                size="lg"
                onClick={handleSubmitReview}
              >
                <Icon name="Send" className="w-4 h-4 mr-2" />
                Отправить на модерацию
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="min-h-screen pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 gradient-text">Профиль</h1>
          
          <div className="grid gap-4 md:gap-6 md:grid-cols-3 mb-6 md:mb-8">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarImage src="" alt="Аватар" />
                  <AvatarFallback className="gradient-bg text-white text-2xl">
                    {window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>
                  {window.Telegram?.WebApp?.initDataUnsafe?.user
                    ? `${window.Telegram.WebApp.initDataUnsafe.user.first_name} ${window.Telegram.WebApp.initDataUnsafe.user.last_name || ''}`
                    : 'Пользователь'}
                </CardTitle>
                <CardDescription>
                  {window.Telegram?.WebApp?.initDataUnsafe?.user?.username
                    ? `@${window.Telegram.WebApp.initDataUnsafe.user.username}`
                    : 'Telegram Mini App'}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl gradient-text">12</CardTitle>
                <CardDescription>Опубликовано отзывов</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl gradient-text">3</CardTitle>
                <CardDescription>На модерации</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Мои отзывы</CardTitle>
              <CardDescription>Вы можете редактировать свои отзывы (после редактирования отзыв повторно уходит на модерацию)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReviews.slice(0, 2).map((review) => (
                  <div key={review.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={review.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                          {review.status === 'published' ? 'Опубликован' : 'На модерации'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{review.marketplace}</Badge>
                      </div>
                      <p className="text-sm line-clamp-2 mb-1">{review.text}</p>
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                    <Button variant="outline" size="sm">
                      <Icon name="Pencil" className="w-4 h-4 mr-1" />
                      Изменить
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="min-h-screen pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
              <Icon name="Shield" className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold gradient-text">Админ-панель</h1>
          </div>

          <div className="grid gap-4 md:gap-6 md:grid-cols-3 mb-6 md:mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl gradient-text">8</CardTitle>
                <CardDescription>Ожидают модерации</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl gradient-text">2847</CardTitle>
                <CardDescription>Всего отзывов</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl gradient-text">1523</CardTitle>
                <CardDescription>Пользователей</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Tabs defaultValue="reviews" className="space-y-6">
            <TabsList>
              <TabsTrigger value="reviews">Модерация</TabsTrigger>
              <TabsTrigger value="users">Пользователи</TabsTrigger>
              <TabsTrigger value="contacts">Контакты поддержки</TabsTrigger>
            </TabsList>

            <TabsContent value="reviews" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Отзывы на модерации</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockReviews.map((review) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">{review.author}</span>
                              <Badge variant="outline" className="text-xs">{review.marketplace}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{review.text}</p>
                            {review.images && review.images.length > 0 && (
                              <div className="flex gap-2 mb-2">
                                {review.images.map((img, i) => (
                                  <img key={i} src={img} alt="" className="w-12 h-12 rounded object-cover" />
                                ))}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Артикул: {review.productArticle} · {review.date}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                            <Icon name="Check" className="w-4 h-4 mr-1" />
                            Одобрить
                          </Button>
                          <Button size="sm" variant="destructive">
                            <Icon name="X" className="w-4 h-4 mr-1" />
                            Отклонить
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Управление пользователями</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: 'Мария К.', reviews: 5, status: 'active' },
                      { name: 'Алексей П.', reviews: 3, status: 'active' },
                      { name: 'Елена С.', reviews: 8, status: 'active' },
                    ].map((user, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="gradient-bg text-white text-xs">{user.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">Отзывов: {user.reviews}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Icon name="Ban" className="w-4 h-4 mr-1" />
                            Заблокировать
                          </Button>
                          <Button variant="destructive" size="sm">
                            <Icon name="Trash2" className="w-4 h-4 mr-1" />
                            Удалить
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Контактные данные поддержки</CardTitle>
                  <CardDescription>Эти данные отображаются на вкладке «Поддержка»</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email поддержки</label>
                    {editingContacts ? (
                      <Input 
                        value={tempEmail} 
                        onChange={(e) => setTempEmail(e.target.value)} 
                        placeholder="support@bananet.ru" 
                      />
                    ) : (
                      <p className="text-sm p-2 border rounded">{adminEmail}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Ссылка на Telegram</label>
                    {editingContacts ? (
                      <Input 
                        value={tempTelegram} 
                        onChange={(e) => setTempTelegram(e.target.value)} 
                        placeholder="https://t.me/..." 
                      />
                    ) : (
                      <p className="text-sm p-2 border rounded">{adminTelegram}</p>
                    )}
                  </div>
                  {editingContacts ? (
                    <div className="flex gap-2">
                      <Button 
                        className="gradient-bg"
                        onClick={() => {
                          setAdminEmail(tempEmail);
                          setAdminTelegram(tempTelegram);
                          setEditingContacts(false);
                          toast({ title: "Контакты обновлены" });
                        }}
                      >
                        <Icon name="Check" className="w-4 h-4 mr-2" />
                        Сохранить
                      </Button>
                      <Button variant="outline" onClick={() => setEditingContacts(false)}>
                        Отмена
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setTempEmail(adminEmail);
                        setTempTelegram(adminTelegram);
                        setEditingContacts(true);
                      }}
                    >
                      <Icon name="Pencil" className="w-4 h-4 mr-2" />
                      Редактировать
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );

  const renderSupport = () => (
    <div className="min-h-screen pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 gradient-text">Поддержка и контакты</h1>
          
          <div className="grid gap-4 md:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Mail" className="w-5 h-5 text-primary" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <button 
                  onClick={copyEmail}
                  className="flex items-center gap-2 text-primary hover:underline transition-colors"
                >
                  <span>{adminEmail}</span>
                  <Icon name={emailCopied ? "Check" : "Copy"} className="w-4 h-4" />
                </button>
                {emailCopied && <p className="text-xs text-green-600 mt-1">Скопировано!</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="MessageCircle" className="w-5 h-5 text-blue-500" />
                  Telegram
                </CardTitle>
              </CardHeader>
              <CardContent>
                <button 
                  onClick={handleTelegramClick}
                  className="text-primary hover:underline"
                >
                  {adminTelegram.replace('https://t.me/', '@')}
                </button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Часто задаваемые вопросы</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Как добавить отзыв?</h4>
                  <p className="text-muted-foreground text-sm">
                    Перейдите в раздел «Добавить отзыв», заполните все обязательные поля и прикрепите минимум 2 изображения.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Сколько времени занимает модерация?</h4>
                  <p className="text-muted-foreground text-sm">
                    Обычно 24-48 часов. В редких случаях может занять до 3-х рабочих дней.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Можно ли удалить свой отзыв?</h4>
                  <p className="text-muted-foreground text-sm">
                    Нет, удаление отзывов недоступно. Вы можете отредактировать отзыв в личном кабинете — после изменения он снова отправится на модерацию.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {renderNavigation()}
      {currentView === 'home' && renderHome()}
      {currentView === 'reviews' && renderReviews()}
      {currentView === 'search' && renderSearch()}
      {currentView === 'add' && renderAddReview()}
      {currentView === 'profile' && renderProfile()}
      {currentView === 'admin' && renderAdmin()}
      {currentView === 'support' && renderSupport()}
      {currentView === 'review-detail' && renderReviewDetail()}
      
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
