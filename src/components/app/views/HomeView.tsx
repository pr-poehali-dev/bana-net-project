import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { ReviewCard, type Review } from '@/components/app/ReviewCard';

const LOGO_URL = 'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/98f97b9b-13cb-4716-b813-29f161b52964.png';
const BANNER_URL = 'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/3ba56ce3-90a9-41a6-991b-2d5c1e085477.png';

type View = 'home' | 'reviews' | 'search' | 'add' | 'profile' | 'admin' | 'support' | 'review-detail';

interface Stats {
  totalReviews: number;
  totalUsers: number;
  publishedToday: number;
}

interface HomeViewProps {
  reviews: Review[];
  loading: boolean;
  stats: Stats;
  onNavigate: (view: View) => void;
  onOpenReview: (review: Review) => void;
}

export function HomeView({ reviews, loading, stats, onNavigate, onOpenReview }: HomeViewProps) {
  return (
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
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 text-white/90 animate-slide-up px-4" style={{ animationDelay: '0.1s' }}>Публикуй отзывы, которые заблокировали маркетплейсы, а так же информацию о некачественных товарах и недобросовестных продавцах. Помоги другим избежать плохих покупок.</p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center animate-slide-up px-4" style={{ animationDelay: '0.2s' }}>
              <Button onClick={() => onNavigate('add')} size="lg" className="bg-white text-primary hover:bg-white/90 text-base md:text-lg px-6 md:px-8 py-5 md:py-6 w-full sm:w-auto">
                <Icon name="MessageSquarePlus" className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Написать отзыв
              </Button>
              <Button onClick={() => onNavigate('reviews')} size="lg" variant="outline" className="border-2 border-white bg-white/10 text-white hover:bg-white hover:text-primary transition-all text-base md:text-lg px-6 md:px-8 py-5 md:py-6 w-full sm:w-auto font-semibold">
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
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Icon name="Loader" className="w-8 h-8 mx-auto mb-3 animate-spin opacity-50" />
                  <p>Загрузка отзывов...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Icon name="MessageSquare" className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Отзывов пока нет</p>
                  <p className="text-sm">Станьте первым!</p>
                </div>
              ) : (
                reviews.slice(0, 3).map((review, index) => (
                  <ReviewCard key={review.id} review={review} index={index} onClick={onOpenReview} />
                ))
              )}
            </div>
            <div className="text-center mt-6 md:mt-8">
              <Button onClick={() => onNavigate('reviews')} size="lg" variant="outline" className="w-full sm:w-auto">
                Показать все отзывы
                <Icon name="ArrowRight" className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}