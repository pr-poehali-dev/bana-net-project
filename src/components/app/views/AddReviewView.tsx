import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  userId: number | null;
  initialData?: Partial<AddReviewFormData>;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function isValidUrl(v: string) {
  try { new URL(v); return true; } catch { return false; }
}

function articleError(v: string) {
  if (!v) return null;
  return /^\d+$/.test(v) ? null : 'Только цифры';
}

function linkError(v: string) {
  if (!v) return null;
  return isValidUrl(v) ? null : 'Введите корректную ссылку (начиная с https://)';
}

const SELLER_KEYWORDS = [
  'продавец', 'продавца', 'продавцу', 'продавцом', 'продавце',
  'магазин', 'магазина', 'магазину', 'магазином', 'магазине',
  'поставщик', 'поставщика', 'поставщику',
  'seller', 'shop', 'store',
  'ооо', 'ип ', 'оао', 'зао', 'пао',
];

function mentionsSellerInText(text: string): boolean {
  const lower = text.toLowerCase();
  return SELLER_KEYWORDS.some(kw => lower.includes(kw));
}

function sellerError(v: string, required: boolean) {
  if (required && !v.trim()) return 'В тексте отзыва упомянут продавец — укажите название';
  if (!v) return null;
  return /^[\p{L}0-9\s.,''«»"()/-]+$/u.test(v) ? null : 'Только буквы, цифры и базовые символы';
}

function textError(v: string) {
  if (!v) return null;
  return v.length >= 50 ? null : `Минимум 50 символов (сейчас ${v.length})`;
}

// ─── FieldError ──────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
      <Icon name="AlertCircle" className="w-3 h-3 flex-shrink-0" />
      {msg}
    </p>
  );
}

// ─── InfoPopover ──────────────────────────────────────────────────────────────

function InfoPopover({ children, side = 'top' }: { children: React.ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="p-0.5 align-middle">
          <Icon name="Info" className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent side={side} className="max-w-sm p-3 z-50 text-sm">
        {children}
      </PopoverContent>
    </Popover>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AddReviewView({ uploadedFiles, onFileUpload, onRemoveFile, onSubmit, submitting, userId, initialData }: AddReviewViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [marketplace, setMarketplace] = useState(initialData?.marketplace ?? '');
  const [productArticle, setProductArticle] = useState(initialData?.product_article ?? '');
  const [productLink, setProductLink] = useState(initialData?.product_link ?? '');
  const [seller, setSeller] = useState(initialData?.seller ?? '');
  const [rating, setRating] = useState(initialData?.rating ?? 0);
  const [reviewText, setReviewText] = useState(initialData?.review_text ?? '');

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) => setTouched(t => ({ ...t, [field]: true }));

  const sellerRequired = mentionsSellerInText(reviewText);

  const handleSubmit = () => {
    setTouched({ article: true, link: true, seller: true, text: true });
    const hasErrors =
      !marketplace ||
      !productArticle || !!articleError(productArticle) ||
      !productLink || !!linkError(productLink) ||
      !!sellerError(seller, sellerRequired) ||
      !rating ||
      !!textError(reviewText) || reviewText.length < 50 ||
      uploadedFiles.length < 2;
    if (hasErrors) return;
    onSubmit({ marketplace, product_article: productArticle, product_link: productLink, seller, rating, review_text: reviewText });
  };

  const aErr = articleError(productArticle);
  const lErr = linkError(productLink);
  const sErr = sellerError(seller, sellerRequired);
  const tErr = textError(reviewText);

  const isFormValid =
    !!marketplace &&
    !!productArticle && !aErr &&
    !!productLink && !lErr &&
    !sErr &&
    !!rating &&
    reviewText.length >= 50 && !tErr &&
    uploadedFiles.length >= 2;

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">

          {/* Title + main popover */}
          <div className="flex items-center gap-2 mb-6 md:mb-8">
            <h1 className="text-2xl md:text-4xl font-bold gradient-text">Добавить отзыв</h1>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="p-1">
                  <Icon name="Info" className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground hover:text-primary transition-colors" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="bottom" className="max-w-sm p-4">
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
                    <p className="ml-5 text-muted-foreground">Все отзывы проверяются в течение 24–48 часов. Необходимы скриншоты.</p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Form card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-xl">Новый отзыв</CardTitle>
              <CardDescription className="text-sm">Расскажите о своём опыте покупки</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Маркетплейс */}
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

              {/* Артикул */}
              <div>
                <label className="text-sm font-medium mb-2 block">Артикул товара *</label>
                <Input
                  value={productArticle}
                  onChange={e => setProductArticle(e.target.value)}
                  onBlur={() => touch('article')}
                  placeholder="12345678"
                  className={`h-11 md:h-10 ${touched.article && aErr ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  inputMode="numeric"
                />
                {touched.article && <FieldError msg={aErr} />}
              </div>

              {/* Ссылка */}
              <div>
                <label className="text-sm font-medium mb-2 block">Ссылка на товар *</label>
                <Input
                  value={productLink}
                  onChange={e => setProductLink(e.target.value)}
                  onBlur={() => touch('link')}
                  placeholder="https://wildberries.ru/catalog/..."
                  className={`h-11 md:h-10 ${touched.link && lErr ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                {touched.link && <FieldError msg={lErr} />}
              </div>

              {/* Продавец */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  Продавец
                  {sellerRequired
                    ? <span className="text-destructive font-normal text-xs">(обязательно — упомянут в отзыве)</span>
                    : <span className="text-muted-foreground font-normal">(необязательно)</span>
                  }
                </label>
                {sellerRequired && !seller && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5 mb-2">
                    <Icon name="AlertTriangle" className="w-3.5 h-3.5 flex-shrink-0" />
                    Вы упоминаете продавца в тексте — пожалуйста, укажите его название
                  </div>
                )}
                <Input
                  value={seller}
                  onChange={e => setSeller(e.target.value)}
                  onBlur={() => touch('seller')}
                  placeholder="ООО «Название компании»"
                  className={`h-11 md:h-10 ${touched.seller && sErr ? 'border-destructive focus-visible:ring-destructive' : sellerRequired && !seller ? 'border-amber-400' : ''}`}
                />
                {touched.seller && <FieldError msg={sErr} />}
              </div>

              {/* Оценка */}
              <div>
                <label className="text-sm font-medium mb-2 block">Оценка недовольства *</label>
                <CardDescription className="text-xs mb-3">От 1 (немного недоволен) до 5 (крайне недоволен)</CardDescription>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <Button
                      key={r}
                      type="button"
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

              {/* Текст отзыва */}
              <div>
                <label className="text-sm font-medium mb-2 block">Ваш отзыв *</label>
                <Textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  onBlur={() => touch('text')}
                  placeholder="Опишите свою ситуацию, проблему с товаром или продавцом..."
                  className={`min-h-[120px] md:min-h-[150px] text-base ${touched.text && tErr ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                <div className="flex items-center justify-between mt-1">
                  {touched.text && tErr
                    ? <FieldError msg={tErr} />
                    : <span />
                  }
                  <span className={`text-xs ml-auto ${reviewText.length >= 50 ? 'text-muted-foreground' : 'text-destructive'}`}>
                    {reviewText.length} / 50
                  </span>
                </div>
              </div>

              {/* Изображения */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  Изображения *
                  <span className="text-destructive font-normal">(минимум 2)</span>
                  <InfoPopover>
                    <div className="space-y-2">
                      <p className="font-semibold flex items-center gap-1">
                        <Icon name="AlertTriangle" className="w-4 h-4 text-amber-500" />
                        Обязательные изображения
                      </p>
                      <ol className="list-decimal ml-4 space-y-1 text-muted-foreground">
                        <li>
                          Скриншот из личного кабинета платформы, подтверждающий:
                          <ul className="list-disc ml-4 mt-0.5 space-y-0.5">
                            <li>факт совершения покупки (данные заказа и наименование товара);</li>
                            <li>отклонение отзыва продавцом (текст отзыва + отметка об отклонении);</li>
                            <li>отклонение запроса на возврат (с причиной отклонения).</li>
                          </ul>
                        </li>
                        <li>Фотография купленного товара</li>
                      </ol>
                    </div>
                  </InfoPopover>
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
                disabled={submitting || !isFormValid}
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