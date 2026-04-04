import { useRef } from 'react';
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
import { AuthUser } from '@/hooks/useAuth';
import { Review, ApiUser, View, LOGO_URL, BANNER_URL, adminEmail, adminTelegram, formatDate } from '@/types/app';
import { SkeletonCard, MarketplaceBadge, RatingDisplay, StatusBadge, ReviewCard } from '@/components/app/SharedUI';

// ─── Navigation ───────────────────────────────────────────────────────────────

interface NavProps {
  currentView: View;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  user: AuthUser | null;
  onNavigate: (v: View) => void;
}

export function AppNavigation({ currentView, mobileMenuOpen, setMobileMenuOpen, user, onNavigate }: NavProps) {
  const isAdmin = user?.role === 'admin';
  const navLinks: { label: string; view: View; icon: string }[] = [
    { label: 'Главная', view: 'home', icon: 'Home' },
    { label: 'Отзывы', view: 'reviews', icon: 'MessageSquare' },
    ...(isAdmin ? [] : [{ label: 'Добавить', view: 'add' as View, icon: 'PlusCircle' }]),
    ...(isAdmin
      ? [{ label: 'Админ-панель', view: 'admin' as View, icon: 'Shield' }]
      : [{ label: 'Профиль', view: 'profile' as View, icon: 'User' }]
    ),
    { label: 'Поддержка', view: 'support', icon: 'HelpCircle' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
            <img src={LOGO_URL} alt="BANaNET" className="w-10 h-10 rounded-xl object-contain" />
            <h1 className="text-xl md:text-2xl font-bold gradient-text">BANaNET</h1>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <button
                key={link.view}
                onClick={() => onNavigate(link.view)}
                className={`transition-colors font-medium text-sm ${
                  currentView === link.view ? 'text-primary' : 'text-foreground hover:text-primary'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(isAdmin ? 'admin' : 'profile')}>
                <Avatar className="w-8 h-8">
                  {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
                  <AvatarFallback className="gradient-bg text-white text-xs">
                    {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate max-w-[120px]">{user.name}</span>
              </div>
            )}
          </div>

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
                {user && (
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg mb-2 bg-muted cursor-pointer"
                    onClick={() => onNavigate(isAdmin ? 'admin' : 'profile')}
                  >
                    <Avatar className="w-10 h-10">
                      {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
                      <AvatarFallback className="gradient-bg text-white text-sm">
                        {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">@{user.telegram_id}</p>
                    </div>
                  </div>
                )}
                {navLinks.map(link => (
                  <button
                    key={link.view}
                    onClick={() => onNavigate(link.view)}
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
}

// ─── Home ─────────────────────────────────────────────────────────────────────

interface HomeProps {
  homeReviews: Review[];
  homeLoading: boolean;
  statsTotal: number | null;
  onNavigate: (v: View) => void;
  onOpenReview: (r: Review) => void;
}

export function HomeView({ homeReviews, homeLoading, statsTotal, onNavigate, onOpenReview }: HomeProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative rounded-2xl overflow-hidden">
        <img src={BANNER_URL} alt="BANaNET banner" className="w-full h-48 md:h-64 object-cover" />
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-center px-4">
          <img src={LOGO_URL} alt="BANaNET" className="w-14 h-14 rounded-2xl object-contain mb-3" />
          <h2 className="text-2xl md:text-4xl font-bold">BANaNET</h2>
          <p className="text-sm md:text-base mt-2 opacity-90">Платформа честных отзывов о маркетплейсах</p>
          <Button className="mt-4 gradient-bg text-white border-0" onClick={() => onNavigate('add')}>
            <Icon name="PlusCircle" size={16} className="mr-2" />
            Добавить отзыв
          </Button>
        </div>
      </div>

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

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Последние отзывы</h3>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('reviews')}>
            Все отзывы
            <Icon name="ArrowRight" size={16} className="ml-1" />
          </Button>
        </div>
        {homeLoading ? (
          <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
        ) : homeReviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">Нет опубликованных отзывов</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {homeReviews.map(review => (
              <ReviewCard key={review.id} review={review} onClick={() => onOpenReview(review)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

interface ReviewsProps {
  reviews: Review[];
  reviewsLoading: boolean;
  reviewsSearch: string;
  reviewsMarketplace: string;
  reviewsSearchRef: React.MutableRefObject<string>;
  reviewsMarketplaceRef: React.MutableRefObject<string>;
  setReviewsSearch: (v: string) => void;
  setReviewsMarketplace: (v: string) => void;
  fetchReviews: () => void;
  onOpenReview: (r: Review) => void;
}

export function ReviewsView({
  reviews, reviewsLoading, reviewsSearch, reviewsMarketplace,
  reviewsSearchRef, reviewsMarketplaceRef,
  setReviewsSearch, setReviewsMarketplace, fetchReviews, onOpenReview,
}: ReviewsProps) {
  return (
    <div className="space-y-5 animate-fade-in">
      <h2 className="text-2xl font-bold">Отзывы</h2>
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
            <div className="space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
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
                <ReviewCard key={review.id} review={review} onClick={() => onOpenReview(review)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Review Detail ────────────────────────────────────────────────────────────

interface ReviewDetailProps {
  review: Review;
  onBack: () => void;
}

export function ReviewDetailView({ review: r, onBack }: ReviewDetailProps) {
  return (
    <div className="space-y-5 animate-fade-in">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
        <Icon name="ArrowLeft" size={18} className="mr-1" />
        Назад
      </Button>
      <Card>
        <CardContent className="p-5 space-y-4">
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
                <img key={i} src={src} alt={`Фото ${i + 1}`} className="w-full rounded-xl object-cover border aspect-square" loading="lazy" />
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
                <a href={r.product_link} target="_blank" rel="noopener noreferrer" className="block text-primary truncate text-sm">
                  {r.product_link}
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Add Review ───────────────────────────────────────────────────────────────

interface AddReviewForm {
  marketplace: string;
  product_article: string;
  product_link: string;
  seller: string;
  rating: number;
  review_text: string;
}

interface AddReviewProps {
  form: AddReviewForm;
  setForm: React.Dispatch<React.SetStateAction<AddReviewForm>>;
  uploadedFiles: File[];
  submitting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (i: number) => void;
  handleSubmitReview: () => void;
}

export function AddReviewView({
  form, setForm, uploadedFiles, submitting,
  fileInputRef, handleFileUpload, removeFile, handleSubmitReview,
}: AddReviewProps) {
  return (
    <div className="space-y-5 animate-fade-in">
      <h2 className="text-2xl font-bold">Добавить отзыв</h2>
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
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Маркетплейс *</label>
          <Select value={form.marketplace} onValueChange={val => setForm(f => ({ ...f, marketplace: val }))}>
            <SelectTrigger><SelectValue placeholder="Выберите маркетплейс" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Wildberries">Wildberries</SelectItem>
              <SelectItem value="OZON">OZON</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Артикул товара</label>
          <Input placeholder="Например: 12345678" value={form.product_article} onChange={e => setForm(f => ({ ...f, product_article: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Ссылка на товар</label>
          <Input placeholder="https://..." value={form.product_link} onChange={e => setForm(f => ({ ...f, product_link: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Продавец (необязательно)</label>
          <Input placeholder="Название продавца" value={form.seller} onChange={e => setForm(f => ({ ...f, seller: e.target.value }))} />
        </div>
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
            {form.rating > 0 && <span className="text-sm text-muted-foreground ml-1">{form.rating} / 5</span>}
          </div>
        </div>
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
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Фотографии * <span className="text-muted-foreground text-xs">(минимум 2)</span>
          </label>
          <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <Button type="button" variant="outline" className="w-full border-dashed h-20" onClick={() => fileInputRef.current?.click()}>
            <Icon name="Upload" size={20} className="mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">Нажмите для загрузки фото</span>
          </Button>
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="relative group">
                  <img src={URL.createObjectURL(file)} alt={`Загружено ${i + 1}`} className="w-20 h-20 rounded-lg object-cover border" />
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
        <Button className="w-full gradient-bg text-white border-0" onClick={handleSubmitReview} disabled={submitting}>
          {submitting ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Отправка...</>
          ) : (
            <><Icon name="Send" size={16} className="mr-2" />Отправить на модерацию</>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

interface ProfileProps {
  user: AuthUser;
  myReviews: Review[];
  myLoading: boolean;
  onNavigate: (v: View) => void;
  onOpenReview: (r: Review) => void;
}

export function ProfileView({ user, myReviews, myLoading, onNavigate, onOpenReview }: ProfileProps) {
  const published = myReviews.filter(r => r.status === 'approved').length;
  const pending = myReviews.filter(r => r.status === 'pending').length;
  return (
    <div className="space-y-5 animate-fade-in">
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <Avatar className="w-16 h-16 shrink-0">
            {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
            <AvatarFallback className="gradient-bg text-white text-2xl">
              {user.name?.charAt(0)?.toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-bold">{user.name}</h3>
            <p className="text-sm text-muted-foreground">@{user.telegram_id}</p>
            {user.role === 'admin' && <Badge className="mt-1 bg-purple-100 text-purple-800">Администратор</Badge>}
          </div>
        </CardContent>
      </Card>
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
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Мои отзывы</h3>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('add')}>
            <Icon name="Plus" size={16} className="mr-1" />
            Добавить
          </Button>
        </div>
        {myLoading ? (
          <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
        ) : myReviews.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <Icon name="FileText" size={36} className="mx-auto mb-3 opacity-40" />
              <p>Вы ещё не добавили ни одного отзыва</p>
              <Button className="mt-3 gradient-bg text-white border-0" size="sm" onClick={() => onNavigate('add')}>
                Добавить первый отзыв
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myReviews.map(review => (
              <Card key={review.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onOpenReview(review)}>
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
}

// ─── Admin ────────────────────────────────────────────────────────────────────

interface AdminProps {
  user: AuthUser;
  pendingReviews: Review[];
  pendingLoading: boolean;
  adminUsers: ApiUser[];
  usersLoading: boolean;
  moderateComment: Record<number, string>;
  setModerateComment: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  handleModerate: (id: number, status: 'approved' | 'rejected') => void;
  handleSetRole: (id: number, role: 'user' | 'admin') => void;
  handleBlockUser: (id: number, block: boolean) => void;
  handleDeleteUser: (id: number) => void;
}

export function AdminView({
  user, pendingReviews, pendingLoading, adminUsers, usersLoading,
  moderateComment, setModerateComment, handleModerate, handleSetRole,
  handleBlockUser, handleDeleteUser,
}: AdminProps) {
  if (user.role !== 'admin') {
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

        <TabsContent value="moderation" className="mt-4 space-y-3">
          {pendingLoading ? (
            <><SkeletonCard /><SkeletonCard /></>
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
                  <Input
                    placeholder="Комментарий (необязательно)"
                    value={moderateComment[review.id] ?? ''}
                    onChange={e => setModerateComment(prev => ({ ...prev, [review.id]: e.target.value }))}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleModerate(review.id, 'approved')}>
                      <Icon name="Check" size={14} className="mr-1" />Одобрить
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleModerate(review.id, 'rejected')}>
                      <Icon name="X" size={14} className="mr-1" />Отклонить
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-4 space-y-3">
          {usersLoading ? (
            <><SkeletonCard /><SkeletonCard /></>
          ) : adminUsers.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">Нет пользователей</CardContent>
            </Card>
          ) : (
            adminUsers.map(u => (
              <Card key={u.id} className={u.is_blocked ? 'opacity-60 border-red-200' : ''}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-10 h-10 shrink-0">
                      {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.name} />}
                      <AvatarFallback className="gradient-bg text-white text-sm">
                        {u.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground">@{u.telegram_id}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={u.role === 'admin' ? 'bg-purple-100 text-purple-800 text-xs' : 'bg-gray-100 text-gray-700 text-xs'}>
                          {u.role === 'admin' ? 'Администратор' : 'Пользователь'}
                        </Badge>
                        {u.is_blocked && <Badge className="bg-red-100 text-red-700 text-xs">Заблокирован</Badge>}
                        <span className="text-xs text-muted-foreground">{u.reviews_count} отзывов</span>
                      </div>
                    </div>
                  </div>
                  {u.id !== user.id && (
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleSetRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                      >
                        <Icon name={u.role === 'admin' ? 'UserMinus' : 'UserCheck'} size={13} className="mr-1" />
                        {u.role === 'admin' ? 'Снять права' : 'Сделать админом'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`text-xs ${u.is_blocked ? 'border-green-300 text-green-700' : 'border-orange-300 text-orange-700'}`}
                        onClick={() => handleBlockUser(u.id, !u.is_blocked)}
                      >
                        <Icon name={u.is_blocked ? 'Unlock' : 'Lock'} size={13} className="mr-1" />
                        {u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-red-300 text-red-700"
                        onClick={() => handleDeleteUser(u.id)}
                      >
                        <Icon name="Trash2" size={13} className="mr-1" />
                        Удалить
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Support ──────────────────────────────────────────────────────────────────

interface SupportProps {
  emailCopied: boolean;
  copyEmail: () => void;
  handleTelegramClick: () => void;
}

export function SupportView({ emailCopied, copyEmail, handleTelegramClick }: SupportProps) {
  return (
    <div className="space-y-5 animate-fade-in">
      <h2 className="text-2xl font-bold">Поддержка</h2>
      <p className="text-muted-foreground text-sm">Если у вас есть вопросы или проблемы — свяжитесь с нами.</p>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Часто задаваемые вопросы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { q: 'Как добавить отзыв?', a: 'Перейдите в раздел "Добавить", заполните форму и прикрепите обязательные фотографии. Отзыв будет опубликован после проверки модератором.' },
            { q: 'Почему мой отзыв не опубликован?', a: 'Отзывы проходят модерацию в течение 24-48 часов. Убедитесь, что вы приложили скриншот удалённого отзыва с маркетплейса и фото товара.' },
            { q: 'Могу ли я удалить свой отзыв?', a: 'Для удаления отзыва свяжитесь с поддержкой через email или Telegram.' },
            { q: 'Почему мне отказали в публикации?', a: 'Отзыв мог быть отклонён из-за нарушения правил: отсутствие доказательств, оскорбительный контент или недостаточно подробное описание.' },
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
}