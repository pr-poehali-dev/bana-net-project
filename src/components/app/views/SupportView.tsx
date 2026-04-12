import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { apiFetch, TICKETS_URL } from '@/types/app';

interface TicketMessage {
  id: number;
  body: string;
  is_admin: boolean;
  created_at: string;
  author_name: string;
}

interface Ticket {
  id: number;
  subject: string;
  status: 'open' | 'answered' | 'closed';
  created_at: string;
  updated_at: string;
  message_count?: number;
  messages?: TicketMessage[];
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Открыто',
  answered: 'Отвечено',
  closed: 'Закрыто',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'default',
  answered: 'secondary',
  closed: 'outline',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function SupportView() {
  const [view, setView] = useState<'list' | 'new' | 'detail'>('list');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(TICKETS_URL);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTicket = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const res = await apiFetch(`${TICKETS_URL}?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelected(data);
        setView('detail');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      const res = await apiFetch(TICKETS_URL, {
        method: 'POST',
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      if (res.ok) {
        setSubject('');
        setMessage('');
        await loadTickets();
        setView('list');
      }
    } finally {
      setSending(false);
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const res = await apiFetch(`${TICKETS_URL}?action=reply`, {
        method: 'POST',
        body: JSON.stringify({ ticket_id: selected.id, message: reply.trim() }),
      });
      if (res.ok) {
        setReply('');
        await loadTicket(selected.id);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleClose() {
    if (!selected) return;
    setSending(true);
    try {
      const res = await apiFetch(`${TICKETS_URL}?action=close`, {
        method: 'PUT',
        body: JSON.stringify({ ticket_id: selected.id }),
      });
      if (res.ok) {
        await loadTicket(selected.id);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">

          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              {(view === 'new' || view === 'detail') && (
                <Button variant="ghost" size="icon" onClick={() => { setView('list'); setSelected(null); }}>
                  <Icon name="ArrowLeft" className="w-5 h-5" />
                </Button>
              )}
              <h1 className="text-2xl md:text-4xl font-bold gradient-text">
                {view === 'new' ? 'Новое обращение' : view === 'detail' && selected ? selected.subject : 'Контакты'}
              </h1>
            </div>
            {view === 'list' && (
              <Button onClick={() => setView('new')}>
                <Icon name="Plus" className="w-4 h-4 mr-2" />
                Написать
              </Button>
            )}
          </div>

          {/* Список тикетов */}
          {view === 'list' && (
            <div className="space-y-3">
              {loading && (
                <div className="flex justify-center py-12">
                  <Icon name="Loader2" className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loading && tickets.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                    <Icon name="MessageSquare" className="w-12 h-12 text-muted-foreground" />
                    <p className="font-semibold">Обращений пока нет</p>
                    <p className="text-muted-foreground text-sm">Если у вас есть вопрос — напишите нам</p>
                    <Button onClick={() => setView('new')}>Написать обращение</Button>
                  </CardContent>
                </Card>
              )}
              {!loading && tickets.map(t => (
                <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => loadTicket(t.id)}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{t.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(t.updated_at)} · {t.message_count} сообщ.</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Badge variant={STATUS_VARIANT[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                      <Icon name="ChevronRight" className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Частые вопросы</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-1">Как добавить отзыв?</h4>
                    <p className="text-muted-foreground text-sm">Перейдите в раздел «Добавить отзыв», заполните все обязательные поля и прикрепите минимум 2 изображения.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Сколько времени занимает модерация?</h4>
                    <p className="text-muted-foreground text-sm">Обычно 24-48 часов. В редких случаях может занять до 3-х рабочих дней.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Можно ли удалить свой отзыв?</h4>
                    <p className="text-muted-foreground text-sm">Нет, удаление отзывов недоступно. Вы можете отредактировать отзыв в личном кабинете.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Форма нового обращения */}
          {view === 'new' && (
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="subject">Тема</Label>
                    <Input
                      id="subject"
                      placeholder="Кратко опишите тему"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      disabled={sending}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="message">Сообщение</Label>
                    <Textarea
                      id="message"
                      placeholder="Подробно опишите вопрос или проблему..."
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      disabled={sending}
                      rows={6}
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={sending || !subject.trim() || !message.trim()}>
                      {sending && <Icon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />}
                      Отправить
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setView('list')}>Отмена</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Детали тикета */}
          {view === 'detail' && selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[selected.status]}>{STATUS_LABEL[selected.status]}</Badge>
                <span className="text-sm text-muted-foreground">Обращение #{selected.id} · {formatDate(selected.created_at)}</span>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Icon name="Loader2" className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  {(selected.messages || []).map(m => (
                    <div key={m.id} className={`flex ${m.is_admin ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${m.is_admin ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                        <p className={`text-xs font-medium mb-1 ${m.is_admin ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                          {m.is_admin ? 'Поддержка' : m.author_name}
                        </p>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className={`text-xs mt-1.5 ${m.is_admin ? 'text-muted-foreground' : 'text-primary-foreground/60'}`}>{formatDate(m.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selected.status !== 'closed' ? (
                <Card>
                  <CardContent className="pt-4">
                    <form onSubmit={handleReply} className="space-y-3">
                      <Textarea
                        placeholder="Дополнительный вопрос или уточнение..."
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                        disabled={sending}
                        rows={3}
                        required
                      />
                      <div className="flex gap-3">
                        <Button type="submit" disabled={sending || !reply.trim()}>
                          {sending && <Icon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />}
                          Отправить
                        </Button>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={sending}>
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
          )}

        </div>
      </div>
    </div>
  );
}
