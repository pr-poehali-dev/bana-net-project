import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { ReviewCard, type Review } from '@/components/app/ReviewCard';
import func2url from '../../../../backend/func2url.json';

const REVIEWS_PUBLIC_URL: string = func2url['reviews-public'];

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
  onOpenReview: (review: Review) => void;
}

export function SearchView({ searchParam, setSearchParam, onOpenReview }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Review[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setResults(null);
    try {
      const params = new URLSearchParams();
      if (searchParam === 'article') params.set('search', q);
      else if (searchParam === 'link') params.set('search', q);
      else if (searchParam === 'seller') params.set('seller', q);
      params.set('limit', '50');
      const res = await fetch(`${REVIEWS_PUBLIC_URL}?${params.toString()}`);
      const data = await res.json();
      setResults(data.reviews ?? []);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleParamChange = (p: 'article' | 'link' | 'seller') => {
    setSearchParam(p);
    setQuery('');
    setResults(null);
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 gradient-text">Поиск отзывов</h1>

          <Card className="mb-6">
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
                    onClick={() => handleParamChange('article')}
                    size="sm"
                  >
                    Артикул
                  </Button>
                  <Button
                    variant={searchParam === 'link' ? 'default' : 'outline'}
                    className={searchParam === 'link' ? 'gradient-bg' : ''}
                    onClick={() => handleParamChange('link')}
                    size="sm"
                  >
                    Ссылка
                  </Button>
                  <Button
                    variant={searchParam === 'seller' ? 'default' : 'outline'}
                    className={searchParam === 'seller' ? 'gradient-bg' : ''}
                    onClick={() => handleParamChange('seller')}
                    size="sm"
                  >
                    Продавец
                  </Button>
                </div>
              </div>

              {searchParam === 'article' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Артикул товара</label>
                  <Input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="Например: 12345678" className="h-11 md:h-10" />
                </div>
              )}
              {searchParam === 'link' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Ссылка на товар</label>
                  <Input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="https://wildberries.ru/catalog/..." className="h-11 md:h-10" />
                </div>
              )}
              {searchParam === 'seller' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Имя продавца</label>
                  <Input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="ООО 'Название компании'" className="h-11 md:h-10" />
                </div>
              )}

              <Button className="w-full gradient-bg h-12 md:h-10 text-base md:text-sm" onClick={handleSearch} disabled={loading || !query.trim()}>
                {loading ? <Icon name="Loader" className="w-4 h-4 mr-2 animate-spin" /> : <Icon name="Search" className="w-4 h-4 mr-2" />}
                {loading ? 'Ищу...' : 'Найти отзывы'}
              </Button>
            </CardContent>
          </Card>

          {results !== null && (
            results.length === 0 ? (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6 pb-6 text-center">
                  <Icon name="SearchX" className="w-10 h-10 mx-auto mb-3 text-amber-400" />
                  <p className="font-semibold text-amber-800 mb-1">Ничего не найдено</p>
                  <p className="text-sm text-amber-700">
                    По вашему запросу отзывов нет. Проверьте правильность{' '}
                    {searchParam === 'article' && 'артикула'}
                    {searchParam === 'link' && 'ссылки на товар'}
                    {searchParam === 'seller' && 'названия продавца'}
                    {' '}и попробуйте снова.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Найдено: {results.length} отзыв{results.length === 1 ? '' : results.length < 5 ? 'а' : 'ов'}</p>
                {results.map((review, i) => (
                  <ReviewCard key={review.id} review={review} index={i} onClick={onOpenReview} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}