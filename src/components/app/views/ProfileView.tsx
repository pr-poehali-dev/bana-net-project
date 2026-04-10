import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { type Review } from '@/components/app/ReviewCard';
import { ReviewDetail } from '@/components/app/ReviewCard';
import { formatDate } from '@/types/app';

type Filter = 'all' | 'approved' | 'pending' | 'rejected';

interface ProfileViewProps {
  user: { id: number; name: string; avatar_url: string | null; telegram_id: string } | null;
  reviews: Review[];
  onResubmit?: (review: Review) => void;
}

export function ProfileView({ user, reviews, onResubmit }: ProfileViewProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [openReview, setOpenReview] = useState<Review | null>(null);

  const publishedCount = reviews.filter(r => r.status === 'approved').length;
  const pendingCount = reviews.filter(r => r.status === 'pending').length;
  const rejectedCount = reviews.filter(r => r.status === 'rejected').length;

  const filtered = filter === 'all'
    ? [...reviews].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : reviews.filter(r => r.status === filter);

  const statusLabel = (s: string) => s === 'approved' ? 'Опубликован' : s === 'rejected' ? 'Отклонён' : 'На модерации';
  const statusVariant = (s: string): 'default' | 'destructive' | 'secondary' =>
    s === 'approved' ? 'default' : s === 'rejected' ? 'destructive' : 'secondary';

  const filterTitle: Record<Filter, string> = {
    all: 'Мои отзывы',
    approved: 'Опубликованные отзывы',
    pending: 'На модерации',
    rejected: 'Отклонённые отзывы',
  };

  if (openReview) {
    return (
      <ReviewDetail
        review={openReview}
        onBack={() => setOpenReview(null)}
        extraFooter={
          openReview.status === 'rejected' && onResubmit ? (
            <div className="mt-4 pt-4 border-t">
              <Button
                size="sm"
                className="w-full gradient-bg text-white"
                onClick={() => { onResubmit(openReview); setOpenReview(null); }}
              >
                <Icon name="RefreshCw" className="w-4 h-4 mr-2" />
                Исправить и отправить повторно
              </Button>
            </div>
          ) : null
        }
      />
    );
  }

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

            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${filter === 'approved' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setFilter(f => f === 'approved' ? 'all' : 'approved')}
            >
              <CardHeader className="text-center">
                <CardTitle className="text-3xl gradient-text">{publishedCount}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-1">
                  Опубликовано
                  {filter === 'approved' && <Icon name="Filter" className="w-3 h-3 text-primary" />}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${filter === 'pending' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setFilter(f => f === 'pending' ? 'all' : 'pending')}
            >
              <CardHeader className="text-center">
                <CardTitle className="text-3xl gradient-text">{pendingCount}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-1">
                  На модерации
                  {filter === 'pending' && <Icon name="Filter" className="w-3 h-3 text-primary" />}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${filter === 'rejected' ? 'ring-2 ring-destructive' : rejectedCount > 0 ? 'border-destructive/50' : ''}`}
              onClick={() => setFilter(f => f === 'rejected' ? 'all' : 'rejected')}
            >
              <CardHeader className="text-center">
                <CardTitle className={`text-3xl ${rejectedCount > 0 ? 'text-destructive' : 'gradient-text'}`}>{rejectedCount}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-1">
                  Отклонено
                  {filter === 'rejected' && <Icon name="Filter" className="w-3 h-3 text-destructive" />}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {rejectedCount > 0 && filter !== 'rejected' && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <Icon name="AlertCircle" className="w-4 h-4 flex-shrink-0" />
              У вас {rejectedCount === 1 ? 'есть отклонённый отзыв' : `есть отклонённых отзывов: ${rejectedCount}`}. Исправьте и отправьте повторно.
            </div>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle>{filterTitle[filter]}</CardTitle>
                  <CardDescription className="mt-1">
                    {filter === 'all' && 'Все отзывы в порядке создания. Нажмите на отзыв, чтобы открыть.'}
                    {filter === 'approved' && 'Опубликованные и доступные всем пользователям.'}
                    {filter === 'pending' && 'Ожидают проверки модератором.'}
                    {filter === 'rejected' && 'Отклонённые отзывы можно исправить и отправить повторно.'}
                  </CardDescription>
                </div>
                {filter !== 'all' && (
                  <Button variant="ghost" size="sm" onClick={() => setFilter('all')}>
                    <Icon name="X" className="w-4 h-4 mr-1" />
                    Сбросить
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {filter === 'all' ? 'У вас пока нет отзывов' : 'Нет отзывов в этой категории'}
                </p>
              ) : (
                <div className="space-y-3">
                  {filtered.map((review) => (
                    <div
                      key={review.id}
                      className={`p-4 border rounded-lg cursor-pointer hover:shadow-sm transition-shadow ${
                        review.status === 'rejected' ? 'border-destructive/40 bg-destructive/5 hover:bg-destructive/10' : 'hover:bg-muted/30'
                      }`}
                      onClick={() => setOpenReview(review)}
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
                          {review.images && review.images.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Icon name="Image" className="w-3 h-3" />
                              {review.images.length} фото
                            </p>
                          )}
                          {review.status === 'rejected' && review.admin_comment && (
                            <div className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
                              <Icon name="MessageSquare" className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                              <span><b>Причина:</b> {review.admin_comment}</span>
                            </div>
                          )}
                        </div>
                        <Icon name="ChevronRight" className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                      </div>
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
