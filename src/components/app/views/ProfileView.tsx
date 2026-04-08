import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { type Review } from '@/components/app/ReviewCard';
import { formatDate } from '@/types/app';

interface ProfileViewProps {
  user: { id: number; name: string; avatar_url: string | null; telegram_id: string } | null;
  reviews: Review[];
  onResubmit?: (review: Review) => void;
}

export function ProfileView({ user, reviews, onResubmit }: ProfileViewProps) {
  const publishedCount = reviews.filter(r => r.status === 'approved').length;
  const pendingCount = reviews.filter(r => r.status === 'pending').length;
  const rejectedCount = reviews.filter(r => r.status === 'rejected').length;

  const statusLabel = (s: string) => s === 'approved' ? 'Опубликован' : s === 'rejected' ? 'Отклонён' : 'На модерации';
  const statusVariant = (s: string): 'default' | 'destructive' | 'secondary' =>
    s === 'approved' ? 'default' : s === 'rejected' ? 'destructive' : 'secondary';

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 gradient-text">Профиль</h1>

          <div className="grid gap-4 md:gap-6 md:grid-cols-4 mb-6 md:mb-8">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="w-16 h-16 mx-auto mb-3">
                  <AvatarImage src={user?.avatar_url ?? ''} alt="Аватар" />
                  <AvatarFallback className="gradient-bg text-white text-2xl">
                    {user?.name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-base">{user?.name || 'Пользователь'}</CardTitle>
                <CardDescription>@{user?.telegram_id || 'Telegram'}</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl gradient-text">{publishedCount}</CardTitle>
                <CardDescription>Опубликовано</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl gradient-text">{pendingCount}</CardTitle>
                <CardDescription>На модерации</CardDescription>
              </CardHeader>
            </Card>

            <Card className={rejectedCount > 0 ? 'border-destructive/50' : ''}>
              <CardHeader className="text-center">
                <CardTitle className={`text-3xl ${rejectedCount > 0 ? 'text-destructive' : 'gradient-text'}`}>{rejectedCount}</CardTitle>
                <CardDescription>Отклонено</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {rejectedCount > 0 && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <Icon name="AlertCircle" className="w-4 h-4 flex-shrink-0" />
              У вас {rejectedCount === 1 ? 'есть отклонённый отзыв' : `есть отклонённых отзывов: ${rejectedCount}`}. Исправьте и отправьте повторно.
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Мои отзывы</CardTitle>
              <CardDescription>Отклонённые отзывы можно исправить и отправить на повторную модерацию</CardDescription>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">У вас пока нет отзывов</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className={`p-4 border rounded-lg ${review.status === 'rejected' ? 'border-destructive/40 bg-destructive/5' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant={statusVariant(review.status)} className="text-xs">
                              {statusLabel(review.status)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{review.marketplace}</Badge>
                            <span className="text-xs text-muted-foreground ml-auto">{formatDate(review.created_at)}</span>
                          </div>
                          <p className="text-sm line-clamp-2">{review.review_text}</p>
                          {review.status === 'rejected' && review.admin_comment && (
                            <div className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
                              <Icon name="MessageSquare" className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                              <span><b>Причина отклонения:</b> {review.admin_comment}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {review.status === 'rejected' && onResubmit && (
                        <div className="mt-3 pt-3 border-t border-destructive/20">
                          <Button
                            size="sm"
                            className="w-full gradient-bg text-white"
                            onClick={() => onResubmit(review)}
                          >
                            <Icon name="RefreshCw" className="w-4 h-4 mr-2" />
                            Исправить и отправить повторно
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
