import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Icon from '@/components/ui/icon';

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
    date: '2024-01-15',
    status: 'published'
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
    date: '2024-01-20',
    status: 'published'
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
    date: '2024-01-25',
    status: 'published'
  }
];

const Index = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [currentView, setCurrentView] = useState<'home' | 'reviews' | 'search' | 'add' | 'profile' | 'admin' | 'rules' | 'support'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const stats = {
    totalReviews: 2847,
    totalUsers: 1523,
    publishedToday: 47
  };

  const handleNavigation = (view: 'home' | 'reviews' | 'search' | 'add' | 'profile' | 'admin' | 'rules' | 'support') => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const renderNavigation = () => (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavigation('home')}>
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">🚫</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold gradient-text">БАНа.Нет</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => handleNavigation('home')} className="text-foreground hover:text-primary transition-colors font-medium">
              Главная
            </button>
            <button onClick={() => handleNavigation('reviews')} className="text-foreground hover:text-primary transition-colors font-medium">
              Отзывы
            </button>
            <button onClick={() => handleNavigation('search')} className="text-foreground hover:text-primary transition-colors font-medium">
              Поиск
            </button>
            <button onClick={() => handleNavigation('add')} className="text-foreground hover:text-primary transition-colors font-medium">
              Добавить отзыв
            </button>
            <button onClick={() => handleNavigation('rules')} className="text-foreground hover:text-primary transition-colors font-medium">
              Правила
            </button>
            <button onClick={() => handleNavigation('support')} className="text-foreground hover:text-primary transition-colors font-medium">
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
                  <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">🚫</span>
                  </div>
                  <span className="gradient-text">БАНа.Нет</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                <Button 
                  onClick={() => handleNavigation('home')} 
                  variant="ghost" 
                  className="justify-start text-lg h-12"
                >
                  <Icon name="Home" className="w-5 h-5 mr-3" />
                  Главная
                </Button>
                <Button 
                  onClick={() => handleNavigation('reviews')} 
                  variant="ghost" 
                  className="justify-start text-lg h-12"
                >
                  <Icon name="MessageSquare" className="w-5 h-5 mr-3" />
                  Отзывы
                </Button>
                <Button 
                  onClick={() => handleNavigation('search')} 
                  variant="ghost" 
                  className="justify-start text-lg h-12"
                >
                  <Icon name="Search" className="w-5 h-5 mr-3" />
                  Поиск
                </Button>
                <Button 
                  onClick={() => handleNavigation('add')} 
                  variant="ghost" 
                  className="justify-start text-lg h-12"
                >
                  <Icon name="MessageSquarePlus" className="w-5 h-5 mr-3" />
                  Добавить отзыв
                </Button>
                <Button 
                  onClick={() => handleNavigation('rules')} 
                  variant="ghost" 
                  className="justify-start text-lg h-12"
                >
                  <Icon name="BookOpen" className="w-5 h-5 mr-3" />
                  Правила
                </Button>
                <Button 
                  onClick={() => handleNavigation('support')} 
                  variant="ghost" 
                  className="justify-start text-lg h-12"
                >
                  <Icon name="HelpCircle" className="w-5 h-5 mr-3" />
                  Поддержка
                </Button>
                <div className="border-t pt-4 mt-4">
                  <Button 
                    onClick={() => handleNavigation('profile')} 
                    variant="outline" 
                    className="w-full justify-start text-lg h-12 mb-3"
                  >
                    <Icon name="User" className="w-5 h-5 mr-3" />
                    Профиль
                  </Button>
                  <Button 
                    onClick={() => handleNavigation('admin')} 
                    className="w-full justify-start text-lg h-12 gradient-bg"
                  >
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

  const renderHome = () => (
    <div className="min-h-screen pt-16">
      <section className="gradient-bg text-white py-12 md:py-20 animate-fade-in overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-4 md:mb-6 animate-scale-in">
              <Badge className="bg-white/20 text-white border-white/30 text-sm md:text-lg px-4 md:px-6 py-1.5 md:py-2">Платформа для честных отзывов</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 animate-slide-up px-4">Твой отзыв важен!</h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 text-white/90 animate-slide-up px-4" style={{ animationDelay: '0.1s' }}>
              Публикуй отзывы, которые заблокировали маркетплейсы.
              <br className="hidden sm:block" />
              <span className="hidden sm:inline"> </span>
              Помогай другим избежать плохих покупок.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center animate-slide-up px-4" style={{ animationDelay: '0.2s' }}>
              <Button onClick={() => handleNavigation('add')} size="lg" className="bg-white text-primary hover:bg-white/90 text-base md:text-lg px-6 md:px-8 py-5 md:py-6 w-full sm:w-auto">
                <Icon name="MessageSquarePlus" className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Написать отзыв
              </Button>
              <Button onClick={() => handleNavigation('reviews')} size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary transition-all text-base md:text-lg px-6 md:px-8 py-5 md:py-6 w-full sm:w-auto font-semibold">
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
              {mockReviews.map((review, index) => (
                <Card key={review.id} className="animate-fade-in hover:shadow-lg transition-shadow" style={{ animationDelay: `${index * 0.1}s` }}>
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
                    <p className="text-sm md:text-base text-foreground mb-3 md:mb-4">{review.text}</p>
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
              ))}
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
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 gradient-text">Все отзывы</h1>
          
          <div className="mb-6 md:mb-8">
            <div className="relative">
              <Icon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Поиск по артикулу, продавцу или тексту отзыва..." 
                className="pl-10 h-12 md:h-11"
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

          <div className="space-y-6">
            {mockReviews
              .filter(review => 
                activeTab === 'all' || 
                review.marketplace.toLowerCase() === activeTab
              )
              .map((review) => (
                <Card key={review.id} className="hover:shadow-lg transition-shadow">
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
                    <p className="text-sm md:text-base text-foreground mb-3 md:mb-4">{review.text}</p>
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
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSearch = () => (
    <div className="min-h-screen pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 gradient-text">Поиск отзывов</h1>
          
          <Card className="mb-6 md:mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-xl">Найти отзыв</CardTitle>
              <CardDescription className="text-sm">Поиск по артикулу, ссылке на товар или имени продавца</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Артикул товара</label>
                <Input placeholder="Например: 12345678" className="h-11 md:h-10" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Ссылка на товар</label>
                <Input placeholder="https://wildberries.ru/catalog/..." className="h-11 md:h-10" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Имя продавца</label>
                <Input placeholder="ООО 'Название компании'" className="h-11 md:h-10" />
              </div>
              <Button className="w-full gradient-bg h-12 md:h-10 text-base md:text-sm">
                <Icon name="Search" className="w-4 h-4 mr-2" />
                Найти отзывы
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-sm md:text-base text-muted-foreground">Введите данные для поиска отзывов</p>
        </div>
      </div>
    </div>
  );

  const renderAddReview = () => (
    <div className="min-h-screen pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 gradient-text">Добавить отзыв</h1>
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-xl">Новый отзыв</CardTitle>
              <CardDescription className="text-sm">Расскажите о своем опыте покупки</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-4">
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
                <label className="text-sm font-medium mb-2 block">Скриншоты (для модерации)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 text-center cursor-pointer hover:border-primary transition-colors">
                  <Icon name="Upload" className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs md:text-sm text-muted-foreground">Загрузите скрины заблокированного отзыва</p>
                  <p className="text-xs text-muted-foreground mt-1">Нажмите для выбора файлов</p>
                </div>
              </div>

              <Button className="w-full gradient-bg h-12 md:h-11 text-base md:text-sm" size="lg">
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
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 gradient-text">Профиль</h1>
          
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarFallback className="gradient-bg text-white text-2xl">ИП</AvatarFallback>
                </Avatar>
                <CardTitle>Иван Петров</CardTitle>
                <CardDescription>@ivan_petrov</CardDescription>
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
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">У вас пока нет опубликованных отзывов</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
              <Icon name="Shield" className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text">Админ-панель</h1>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
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
              <TabsTrigger value="reviews">Модерация отзывов</TabsTrigger>
              <TabsTrigger value="users">Пользователи</TabsTrigger>
            </TabsList>

            <TabsContent value="reviews" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Отзывы на модерации</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">Нет отзывов на модерации</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Управление пользователями</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">Список пользователей</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );

  const renderRules = () => (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 gradient-text">Правила публикации</h1>
          
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Icon name="CheckCircle" className="w-5 h-5 text-primary" />
                  Что можно публиковать
                </h3>
                <ul className="space-y-2 text-muted-foreground ml-7">
                  <li>✓ Честные отзывы о товарах и продавцах</li>
                  <li>✓ Отзывы, заблокированные на маркетплейсах</li>
                  <li>✓ Описание реальных проблем с покупками</li>
                  <li>✓ Конструктивную критику</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Icon name="XCircle" className="w-5 h-5 text-destructive" />
                  Что запрещено
                </h3>
                <ul className="space-y-2 text-muted-foreground ml-7">
                  <li>✗ Оскорбления и нецензурная лексика</li>
                  <li>✗ Ложная информация</li>
                  <li>✗ Спам и реклама</li>
                  <li>✗ Накрутка рейтингов</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Icon name="Info" className="w-5 h-5 text-secondary" />
                  Процесс модерации
                </h3>
                <p className="text-muted-foreground ml-7">
                  Все отзывы проходят проверку модераторами в течение 24-48 часов. 
                  Для подтверждения необходимы скриншоты заблокированного отзыва с маркетплейса.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderSupport = () => (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 gradient-text">Поддержка и контакты</h1>
          
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Mail" className="w-5 h-5 text-primary" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a href="mailto:support@bana.net" className="text-primary hover:underline">
                  support@bana.net
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="MessageCircle" className="w-5 h-5 text-secondary" />
                  Telegram
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a href="https://t.me/bana_support" className="text-primary hover:underline">
                  @bana_support
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Часто задаваемые вопросы</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Как добавить отзыв?</h4>
                  <p className="text-muted-foreground">
                    Перейдите в раздел "Добавить отзыв", заполните все обязательные поля и прикрепите скриншоты.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Сколько времени занимает модерация?</h4>
                  <p className="text-muted-foreground">
                    Обычно 24-48 часов. В редких случаях может занять до 3-х рабочих дней.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Можно ли удалить свой отзыв?</h4>
                  <p className="text-muted-foreground">
                    Да, в личном кабинете есть возможность удалить или отредактировать свои отзывы.
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
      {currentView === 'rules' && renderRules()}
      {currentView === 'support' && renderSupport()}
      
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🚫</span>
            <span className="font-bold gradient-text">БАНа.Нет</span>
          </p>
          <p className="text-sm">© 2024 Платформа честных отзывов</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;