import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import func2url from '../../../../backend/func2url.json';

export function SupportView() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setStatus('sending');
    try {
      const text = `📬 <b>Обращение в поддержку</b>\n\n<b>Тема:</b> ${subject.trim()}\n\n<b>Сообщение:</b>\n${message.trim()}`;
      const res = await fetch(`${func2url['telegram-bot-telegram-bot']}?action=send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, parse_mode: 'HTML' }),
      });
      if (!res.ok) throw new Error('send failed');
      setStatus('success');
      setSubject('');
      setMessage('');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 gradient-text">Контакты</h1>

          <div className="grid gap-4 md:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="MessageSquare" className="w-5 h-5 text-primary" />
                  Форма обращения
                </CardTitle>
              </CardHeader>
              <CardContent>
                {status === 'success' ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <Icon name="CheckCircle" className="w-12 h-12 text-green-500" />
                    <p className="font-semibold text-lg">Сообщение отправлено!</p>
                    <p className="text-muted-foreground text-sm">Мы получили ваше обращение и ответим в ближайшее время.</p>
                    <Button variant="outline" onClick={() => setStatus('idle')}>
                      Отправить ещё
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="subject">Тема</Label>
                      <Input
                        id="subject"
                        placeholder="Кратко опишите тему обращения"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        disabled={status === 'sending'}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="message">Сообщение</Label>
                      <Textarea
                        id="message"
                        placeholder="Подробно опишите ваш вопрос или проблему..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        disabled={status === 'sending'}
                        rows={5}
                        required
                      />
                    </div>
                    {status === 'error' && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <Icon name="AlertCircle" className="w-4 h-4" />
                        Не удалось отправить. Попробуйте позже.
                      </p>
                    )}
                    <Button type="submit" disabled={status === 'sending' || !subject.trim() || !message.trim()}>
                      {status === 'sending' ? (
                        <>
                          <Icon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                          Отправка...
                        </>
                      ) : (
                        'Отправить'
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Часто задаваемые вопросы</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Как добавить отзыв?</h4>
                  <p className="text-muted-foreground text-sm">
                    Перейдите в раздел «Добавить отзыв», заполните все обязательные поля и прикрепите минимум 2 изображения.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Сколько времени занимает модерация?</h4>
                  <p className="text-muted-foreground text-sm">
                    Обычно 24-48 часов. В редких случаях может занять до 3-х рабочих дней.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Можно ли удалить свой отзыв?</h4>
                  <p className="text-muted-foreground text-sm">
                    Нет, удаление отзывов недоступно. Вы можете отредактировать отзыв в личном кабинете — после изменения он снова отправится на модерацию.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
