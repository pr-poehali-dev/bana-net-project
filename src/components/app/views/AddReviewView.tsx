import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Icon from '@/components/ui/icon';

export interface AddReviewFormData {
  marketplace: string;
  product_article: string;
  product_link: string;
  seller: string;
  rating: number;
  review_text: string;
}

interface AddReviewViewProps {
  uploadedFiles: File[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onSubmit: (data: AddReviewFormData) => void;
  submitting: boolean;
}

export function AddReviewView({ uploadedFiles, onFileUpload, onRemoveFile, onSubmit, submitting }: AddReviewViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [marketplace, setMarketplace] = useState('');
  const [productArticle, setProductArticle] = useState('');
  const [productLink, setProductLink] = useState('');
  const [seller, setSeller] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const handleSubmit = () => {
    onSubmit({
      marketplace,
      product_article: productArticle,
      product_link: productLink,
      seller,
      rating,
      review_text: reviewText,
    });
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-6 md:mb-8">
            <h1 className="text-2xl md:text-4xl font-bold gradient-text">Добавить отзыв</h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1">
                  <Icon name="Info" className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground hover:text-primary transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-sm p-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold flex items-center gap-1 mb-1">
                      <Icon name="CheckCircle" className="w-4 h-4 text-green-500" />
                      Что можно публиковать
                    </p>
                    <ul className="ml-5 space-y-0.5 text-muted-foreground">
                      <li>• Честные отзывы о товарах и продавцах</li>
                      <li>• Отзывы, заблокированные маркетплейсами</li>
                      <li>• Описание реальных проблем с покупками</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-1 mb-1">
                      <Icon name="XCircle" className="w-4 h-4 text-destructive" />
                      Запрещено
                    </p>
                    <ul className="ml-5 space-y-0.5 text-muted-foreground">
                      <li>• Оскорбления и нецензурная лексика</li>
                      <li>• Ложная информация и спам</li>
                      <li>• Накрутка рейтингов</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-1 mb-1">
                      <Icon name="Clock" className="w-4 h-4 text-primary" />
                      Модерация
                    </p>
                    <p className="ml-5 text-muted-foreground">Все отзывы проверяются в течение 24-48 часов. Необходимы скриншоты.</p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          <Card className="mb-4 border-amber-200 bg-amber-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex gap-3">
                <Icon name="AlertTriangle" className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Обязательные изображения (минимум 2):</p>
                  <ol className="list-decimal ml-4 space-y-0.5">
                    <li>Скриншот из личного кабинета платформы, который подтверждает:
- факт совершения покупки указанного товара (с видимыми данными о заказе и наименование товара);
- факт отклонения отзыва продавцом (с отображением текста отзыва и отметки об отклонении);
- факт отклонения запроса на возврат товара (с отображением причины отклонения).</li>
                    <li>Фотография купленного товара</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-xl">Новый отзыв</CardTitle>
              <CardDescription className="text-sm">Расскажите о своем опыте покупки</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Маркетплейс *</label>
                <Select value={marketplace} onValueChange={setMarketplace}>
                  <SelectTrigger className="h-11 md:h-10">
                    <SelectValue placeholder="Выберите маркетплейс" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wildberries">Wildberries</SelectItem>
                    <SelectItem value="OZON">OZON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Артикул товара *</label>
                <Input value={productArticle} onChange={e => setProductArticle(e.target.value)} placeholder="12345678" className="h-11 md:h-10" />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ссылка на товар *</label>
                <Input value={productLink} onChange={e => setProductLink(e.target.value)} placeholder="https://wildberries.ru/catalog/..." className="h-11 md:h-10" />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Продавец (необязательно)</label>
                <Input value={seller} onChange={e => setSeller(e.target.value)} placeholder="ООО 'Название компании'" className="h-11 md:h-10" />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Оценка недовольства *</label>
                <CardDescription className="text-xs mb-3">От 1 (немного недоволен) до 5 (крайне недоволен)</CardDescription>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <Button
                      key={r}
                      variant={rating === r ? 'default' : 'outline'}
                      size="sm"
                      className={`h-10 flex-1 min-w-[60px] md:flex-none ${rating === r ? 'bg-destructive border-destructive text-white' : 'hover:bg-destructive hover:text-white hover:border-destructive'}`}
                      onClick={() => setRating(r)}
                    >
                      <Icon name="ThumbsDown" className="w-4 h-4 mr-1" />
                      {r}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ваш отзыв *</label>
                <Textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Опишите свою ситуацию, проблему с товаром или продавцом..."
                  className="min-h-[120px] md:min-h-[150px] text-base"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                  Изображения *
                  <span className="text-destructive">(минимум 2)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onFileUpload}
                />
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon name="Upload" className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs md:text-sm text-muted-foreground">1. Скриншот отклонённого отзыва из личного кабинета</p>
                  <p className="text-xs md:text-sm text-muted-foreground">2. Фотография купленного товара</p>
                  <p className="text-xs text-muted-foreground mt-2">Нажмите для выбора файлов</p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <Icon name="Image" className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onRemoveFile(index)}>
                          <Icon name="X" className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Загружено: {uploadedFiles.length} из минимум 2
                    </p>
                  </div>
                )}
              </div>

              <Button
                className="w-full gradient-bg h-12 md:h-11 text-base md:text-sm"
                size="lg"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <Icon name="Loader" className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Icon name="Send" className="w-4 h-4 mr-2" />
                )}
                {submitting ? 'Отправка...' : 'Отправить на модерацию'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
