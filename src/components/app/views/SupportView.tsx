import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface SupportViewProps {
  adminEmail: string;
  adminTelegram: string;
  emailCopied: boolean;
  onCopyEmail: () => void;
  onTelegramClick: () => void;
}

export function SupportView({ adminEmail, adminTelegram, emailCopied, onCopyEmail, onTelegramClick }: SupportViewProps) {
  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 gradient-text">Поддержка и контакты</h1>

          <div className="grid gap-4 md:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Mail" className="w-5 h-5 text-primary" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <button
                  onClick={onCopyEmail}
                  className="flex items-center gap-2 text-primary hover:underline transition-colors"
                >
                  <span>{adminEmail}</span>
                  <Icon name={emailCopied ? "Check" : "Copy"} className="w-4 h-4" />
                </button>
                {emailCopied && <p className="text-xs text-green-600 mt-1">Скопировано!</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="MessageCircle" className="w-5 h-5 text-blue-500" />
                  Telegram
                </CardTitle>
              </CardHeader>
              <CardContent>
                <button
                  onClick={onTelegramClick}
                  className="text-primary hover:underline"
                >
                  {adminTelegram.replace('https://t.me/', '@')}
                </button>
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
