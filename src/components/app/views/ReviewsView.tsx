import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { ReviewCard, type Review } from '@/components/app/ReviewCard';

// ─── ReviewsView ─────────────────────────────────────────────────────────────

interface ReviewsViewProps {
  reviews: Review[];
  loading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  reviewSearchLink: string;
  setReviewSearchLink: (val: string) => void;
  onOpenReview: (review: Review) => void;
}

export function ReviewsView({ reviews, loading, activeTab, setActiveTab, reviewSearchLink, setReviewSearchLink, onOpenReview }: ReviewsViewProps) {
  const filtered = reviews
    .filter(review =>
      activeTab === 'all' ||
      review.marketplace.toLowerCase() === activeTab
    )
    .filter(review => {
      if (!reviewSearchLink) return true;
      const q = reviewSearchLink.toLowerCase();
      return (
        (review.product_link ?? '').toLowerCase().includes(q) ||
        (review.product_article ?? '').toLowerCase().includes(q) ||
        (review.seller ?? '').toLowerCase().includes(q)
      );
    });

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 gradient-text">Все отзывы</h1>

          <div className="mb-6 md:mb-8">
            <label className="text-sm font-medium mb-2 block">Поиск по артикулу, продавцу или ссылке на товар</label>
            <div className="relative">
              <Icon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Артикул, название продавца или ссылка на товар..."
                className="pl-10 h-12 md:h-11"
                value={reviewSearchLink}
                onChange={(e) => setReviewSearchLink(e.target.value)}
              />
              {reviewSearchLink && (
                <button
                  onClick={() => setReviewSearchLink('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Icon name="X" className="w-4 h-4" />
                </button>
              )}
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
            {loading ? (
              <div className="text-center py-16 text-muted-foreground">
                <Icon name="Loader" className="w-8 h-8 mx-auto mb-3 animate-spin opacity-50" />
                <p>Загрузка отзывов...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Icon name="Search" className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Отзывы не найдены</p>
                <p className="text-sm">Попробуйте изменить параметры поиска</p>
              </div>
            ) : (
              filtered.map((review, index) => (
                <ReviewCard key={review.id} review={review} index={index} onClick={onOpenReview} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SearchView ──────────────────────────────────────────────────────────────

interface SearchViewProps {
  searchParam: 'article' | 'link' | 'seller';
  setSearchParam: (p: 'article' | 'link' | 'seller') => void;
}

export function SearchView({ searchParam, setSearchParam }: SearchViewProps) {
  return (
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
}
