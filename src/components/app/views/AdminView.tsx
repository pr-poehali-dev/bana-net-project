import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { type Review } from '@/components/app/ReviewCard';
import { formatDate, apiFetch, ADMIN_URL } from '@/types/app';

interface AdminStats { pending: number; approved: number; rejected: number; draft: number; total: number; }
interface AdminReview extends Review { author_name: string; author_avatar: string | null; }

interface AdminViewProps {
  adminEmail: string;
  adminTelegram: string;
  editingContacts: boolean;
  setEditingContacts: (v: boolean) => void;
  tempEmail: string;
  setTempEmail: (v: string) => void;
  tempTelegram: string;
  setTempTelegram: (v: string) => void;
  onSaveContacts: () => void;
}

export function AdminView({
  adminEmail,
  adminTelegram,
  editingContacts,
  setEditingContacts,
  tempEmail,
  setTempEmail,
  tempTelegram,
  setTempTelegram,
  onSaveContacts,
}: AdminViewProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [moderating, setModerating] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, string>>({});

  const loadStats = useCallback(async () => {
    const res = await apiFetch(`${ADMIN_URL}?action=stats`);
    if (res.status === 401) { setAuthError(true); return; }
    if (res.ok) setStats(await res.json());
  }, []);

  const loadReviews = useCallback(async (status: string) => {
    setLoading(true);
    const res = await apiFetch(`${ADMIN_URL}?status=${status}&limit=50`);
    if (res.status === 401) { setAuthError(true); setLoading(false); return; }
    if (res.ok) {
      const data = await res.json();
      setReviews(data.reviews ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadReviews(statusFilter);
  }, [statusFilter, loadReviews]);

  const moderate = async (reviewId: number, action: 'approve' | 'reject') => {
    setModerating(reviewId);
    await apiFetch(ADMIN_URL, {
      method: 'PUT',
      body: JSON.stringify({ review_id: reviewId, action, admin_comment: comments[reviewId] || '' }),
    });
    setModerating(null);
    await Promise.all([loadStats(), loadReviews(statusFilter)]);
  };

  const starRating = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  if (authError) {
    return (
      <div className="min-h-screen pt-20 md:pt-24 pb-8 flex items-center justify-center">
        <Card className="max-w-sm w-full mx-4">
          <CardHeader className="text-center">
            <Icon name="ShieldAlert" className="w-12 h-12 mx-auto mb-3 text-destructive" />
            <CardTitle>Сессия истекла</CardTitle>
            <CardDescription>Перезайдите в приложение через Telegram, чтобы обновить токен</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full gradient-bg" onClick={() => { localStorage.clear(); window.location.reload(); }}>
              Выйти и войти снова
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
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
                <CardTitle className="text-2xl gradient-text">
                  {stats ? stats.pending : <Skeleton className="h-8 w-12" />}
                </CardTitle>
                <CardDescription>Ожидают модерации</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl gradient-text">
                  {stats ? stats.total : <Skeleton className="h-8 w-16" />}
                </CardTitle>
                <CardDescription>Всего отзывов</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl gradient-text">
                  {stats ? stats.approved : <Skeleton className="h-8 w-12" />}
                </CardTitle>
                <CardDescription>Опубликовано</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Tabs defaultValue="reviews" className="space-y-6">
            <TabsList>
              <TabsTrigger value="reviews">Модерация</TabsTrigger>
              <TabsTrigger value="contacts">Контакты поддержки</TabsTrigger>
            </TabsList>

            <TabsContent value="reviews" className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {(['pending', 'approved', 'rejected'] as const).map(s => (
                  <Button
                    key={s}
                    size="sm"
                    variant={statusFilter === s ? 'default' : 'outline'}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === 'pending' ? 'На модерации' : s === 'approved' ? 'Одобрены' : 'Отклонены'}
                    {stats && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {s === 'pending' ? stats.pending : s === 'approved' ? stats.approved : stats.rejected}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {statusFilter === 'pending' ? 'Отзывы на модерации' : statusFilter === 'approved' ? 'Одобренные отзывы' : 'Отклонённые отзывы'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
                    </div>
                  ) : reviews.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-8 text-center">Нет отзывов</p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="w-9 h-9 flex-shrink-0">
                              <AvatarImage src={review.author_avatar ?? ''} />
                              <AvatarFallback className="gradient-bg text-white text-sm">
                                {(review.author_name || 'U')[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-semibold text-sm">{review.author_name || 'Пользователь'}</span>
                                <Badge variant="outline" className="text-xs">{review.marketplace}</Badge>
                                <span className="text-yellow-500 text-sm">{starRating(review.rating || 0)}</span>
                                <span className="text-xs text-muted-foreground ml-auto">{formatDate(review.created_at)}</span>
                              </div>
                              {(review.product_article || review.seller) && (
                                <p className="text-xs text-muted-foreground mb-1">
                                  {review.product_article && <>Артикул: {review.product_article}</>}
                                  {review.product_article && review.seller && ' · '}
                                  {review.seller && <>Продавец: {review.seller}</>}
                                </p>
                              )}
                              <p className="text-sm mb-2">{review.review_text}</p>
                              {review.images && review.images.length > 0 && (
                                <div className="flex gap-2 flex-wrap mb-2">
                                  {review.images.map((img, i) => (
                                    <a key={i} href={img} target="_blank" rel="noreferrer">
                                      <img src={img} alt="" className="w-16 h-16 rounded object-cover border hover:opacity-80 transition-opacity" />
                                    </a>
                                  ))}
                                </div>
                              )}
                              {review.admin_comment && (
                                <p className="text-xs text-muted-foreground italic border-l-2 pl-2 mb-2">
                                  Комментарий: {review.admin_comment}
                                </p>
                              )}
                            </div>
                          </div>

                          {statusFilter === 'pending' && (
                            <div className="space-y-2 mt-2">
                              <Textarea
                                placeholder="Комментарий для пользователя (необязательно)"
                                className="text-sm resize-none h-16"
                                value={comments[review.id] || ''}
                                onChange={e => setComments(prev => ({ ...prev, [review.id]: e.target.value }))}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  disabled={moderating === review.id}
                                  onClick={() => moderate(review.id, 'approve')}
                                >
                                  <Icon name="Check" className="w-4 h-4 mr-1" />
                                  {moderating === review.id ? 'Сохраняю...' : 'Одобрить'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={moderating === review.id}
                                  onClick={() => moderate(review.id, 'reject')}
                                >
                                  <Icon name="X" className="w-4 h-4 mr-1" />
                                  Отклонить
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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
                      <Input value={tempEmail} onChange={(e) => setTempEmail(e.target.value)} placeholder="support@bananet.ru" />
                    ) : (
                      <p className="text-sm p-2 border rounded">{adminEmail}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Ссылка на Telegram</label>
                    {editingContacts ? (
                      <Input value={tempTelegram} onChange={(e) => setTempTelegram(e.target.value)} placeholder="https://t.me/..." />
                    ) : (
                      <p className="text-sm p-2 border rounded">{adminTelegram}</p>
                    )}
                  </div>
                  {editingContacts ? (
                    <div className="flex gap-2">
                      <Button className="gradient-bg" onClick={onSaveContacts}>
                        <Icon name="Check" className="w-4 h-4 mr-2" />
                        Сохранить
                      </Button>
                      <Button variant="outline" onClick={() => setEditingContacts(false)}>Отмена</Button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => { setTempEmail(adminEmail); setTempTelegram(adminTelegram); setEditingContacts(true); }}>
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
}
