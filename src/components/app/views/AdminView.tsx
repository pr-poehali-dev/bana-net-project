import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { type Review } from '@/components/app/ReviewCard';
import { formatDate, apiFetch, ADMIN_URL, TICKETS_ADMIN_URL } from '@/types/app';

interface AdminStats { pending: number; approved: number; rejected: number; draft: number; total: number; }
interface AdminReview extends Review { author_name: string; author_avatar: string | null; }

interface TicketMsg { id: number; body: string; is_admin: boolean; created_at: string; author_name: string; }
interface AdminTicket { id: number; subject: string; status: string; created_at: string; updated_at: string; user_name?: string; user_telegram_id?: string; user_avatar?: string | null; message_count?: number; messages?: TicketMsg[]; }
interface TicketCounts { open: number; answered: number; closed: number; }

export function AdminView() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [moderating, setModerating] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, string>>({});

  // Тикеты поддержки
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [ticketCounts, setTicketCounts] = useState<TicketCounts>({ open: 0, answered: 0, closed: 0 });
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'open' | 'answered' | 'closed' | ''>('open');
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null);
  const [ticketDetailLoading, setTicketDetailLoading] = useState(false);
  const [adminReply, setAdminReply] = useState('');
  const [replySending, setReplySending] = useState(false);

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

  const loadTickets = useCallback(async (status: string) => {
    setTicketsLoading(true);
    const q = status ? `?status=${status}` : '';
    const res = await apiFetch(`${TICKETS_ADMIN_URL}${q}`);
    if (res.ok) {
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setTicketCounts(data.counts ?? { open: 0, answered: 0, closed: 0 });
    }
    setTicketsLoading(false);
  }, []);

  const loadTicketDetail = useCallback(async (id: number) => {
    setTicketDetailLoading(true);
    const res = await apiFetch(`${TICKETS_ADMIN_URL}?id=${id}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedTicket(data);
    }
    setTicketDetailLoading(false);
  }, []);

  const handleAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReply.trim() || !selectedTicket) return;
    setReplySending(true);
    const res = await apiFetch(`${TICKETS_ADMIN_URL}?action=reply`, {
      method: 'POST',
      body: JSON.stringify({ ticket_id: selectedTicket.id, message: adminReply.trim() }),
    });
    if (res.ok) {
      setAdminReply('');
      await loadTicketDetail(selectedTicket.id);
      await loadTickets(ticketStatusFilter);
    }
    setReplySending(false);
  };

  const handleAdminCloseTicket = async () => {
    if (!selectedTicket) return;
    setReplySending(true);
    const res = await apiFetch(`${TICKETS_ADMIN_URL}?action=close`, {
      method: 'PUT',
      body: JSON.stringify({ ticket_id: selectedTicket.id }),
    });
    if (res.ok) {
      await loadTicketDetail(selectedTicket.id);
      await loadTickets(ticketStatusFilter);
    }
    setReplySending(false);
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

          <Tabs defaultValue="reviews" className="space-y-6" onValueChange={(v) => { if (v === 'tickets') { setSelectedTicket(null); loadTickets(ticketStatusFilter); } }}>
            <TabsList>
              <TabsTrigger value="reviews">Модерация</TabsTrigger>
              <TabsTrigger value="tickets" className="relative">
                Обращения
                {ticketCounts.open > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0">{ticketCounts.open}</Badge>
                )}
              </TabsTrigger>

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

            {/* Вкладка Обращения */}
            <TabsContent value="tickets" className="space-y-4">
              {selectedTicket ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)}>
                      <Icon name="ArrowLeft" className="w-5 h-5" />
                    </Button>
                    <div>
                      <p className="font-semibold">{selectedTicket.subject}</p>
                      <p className="text-xs text-muted-foreground">{selectedTicket.user_name} · #{selectedTicket.id}</p>
                    </div>
                    <Badge className="ml-auto" variant={selectedTicket.status === 'open' ? 'default' : selectedTicket.status === 'answered' ? 'secondary' : 'outline'}>
                      {selectedTicket.status === 'open' ? 'Открыто' : selectedTicket.status === 'answered' ? 'Отвечено' : 'Закрыто'}
                    </Badge>
                  </div>

                  {ticketDetailLoading ? (
                    <div className="flex justify-center py-8"><Icon name="Loader2" className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                  ) : (
                    <div className="space-y-3">
                      {(selectedTicket.messages || []).map(m => (
                        <div key={m.id} className={`flex ${m.is_admin ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${m.is_admin ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <p className={`text-xs font-medium mb-1 ${m.is_admin ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {m.is_admin ? 'Поддержка (вы)' : m.author_name}
                            </p>
                            <p className="whitespace-pre-wrap">{m.body}</p>
                            <p className={`text-xs mt-1.5 ${m.is_admin ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{formatDate(m.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedTicket.status !== 'closed' ? (
                    <Card>
                      <CardContent className="pt-4">
                        <form onSubmit={handleAdminReply} className="space-y-3">
                          <Textarea
                            placeholder="Введите ответ пользователю..."
                            value={adminReply}
                            onChange={e => setAdminReply(e.target.value)}
                            disabled={replySending}
                            rows={4}
                            required
                          />
                          <div className="flex gap-3">
                            <Button type="submit" disabled={replySending || !adminReply.trim()}>
                              {replySending && <Icon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />}
                              Ответить
                            </Button>
                            <Button type="button" variant="outline" onClick={handleAdminCloseTicket} disabled={replySending}>
                              Закрыть обращение
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  ) : (
                    <p className="text-center py-4 text-muted-foreground text-sm">Обращение закрыто</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex gap-2 flex-wrap">
                    {(['open', 'answered', 'closed'] as const).map(s => (
                      <Button
                        key={s}
                        size="sm"
                        variant={ticketStatusFilter === s ? 'default' : 'outline'}
                        onClick={() => { setTicketStatusFilter(s); loadTickets(s); }}
                      >
                        {s === 'open' ? 'Открытые' : s === 'answered' ? 'Отвеченные' : 'Закрытые'}
                        <Badge variant="secondary" className="ml-2 text-xs">{ticketCounts[s]}</Badge>
                      </Button>
                    ))}
                  </div>

                  <Card>
                    <CardContent className="pt-4">
                      {ticketsLoading ? (
                        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
                      ) : tickets.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-8 text-center">Обращений нет</p>
                      ) : (
                        <div className="space-y-2">
                          {tickets.map(t => (
                            <div key={t.id} className="flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { loadTicketDetail(t.id); }}>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{t.subject}</p>
                                <p className="text-xs text-muted-foreground">{t.user_name} · {t.message_count} сообщ. · {formatDate(t.updated_at)}</p>
                              </div>
                              <Icon name="ChevronRight" className="w-4 h-4 text-muted-foreground ml-3 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>


          </Tabs>
        </div>
      </div>
    </div>
  );
}