import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Icon from '@/components/ui/icon';
import { type AddReviewFormData, articleError, linkError, sellerError, textError, mentionsSellerInText } from './addReviewHelpers';
import { ProductFields } from './ProductFields';
import { ReviewContentFields } from './ReviewContentFields';

export type { AddReviewFormData };

interface AddReviewViewProps {
  uploadedFiles: File[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onSubmit: (data: AddReviewFormData) => void;
  submitting: boolean;
  userId: number | null;
  initialData?: Partial<AddReviewFormData>;
}

export function AddReviewView({ uploadedFiles, onFileUpload, onRemoveFile, onSubmit, submitting, userId, initialData }: AddReviewViewProps) {
  const [marketplace, setMarketplace] = useState(initialData?.marketplace ?? '');
  const [productArticle, setProductArticle] = useState(initialData?.product_article ?? '');
  const [productLink, setProductLink] = useState(initialData?.product_link ?? '');
  const [seller, setSeller] = useState(initialData?.seller ?? '');
  const [rating, setRating] = useState(initialData?.rating ?? 0);
  const [reviewText, setReviewText] = useState(initialData?.review_text ?? '');

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) => setTouched(t => ({ ...t, [field]: true }));
  const [autofilled, setAutofilled] = useState<Record<string, boolean>>({});
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const sellerRequired = mentionsSellerInText(reviewText);

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

              <ProductFields
                marketplace={marketplace}
                setMarketplace={setMarketplace}
                productArticle={productArticle}
                setProductArticle={setProductArticle}
                productLink={productLink}
                setProductLink={setProductLink}
                autofilled={autofilled}
                setAutofilled={setAutofilled}
                lookupLoading={lookupLoading}
                setLookupLoading={setLookupLoading}
                lookupError={lookupError}
                setLookupError={setLookupError}
                touched={touched}
                touch={touch}
              />

              <ReviewContentFields
                seller={seller}
                setSeller={setSeller}
                rating={rating}
                setRating={setRating}
                reviewText={reviewText}
                setReviewText={setReviewText}
                uploadedFiles={uploadedFiles}
                onFileUpload={onFileUpload}
                onRemoveFile={onRemoveFile}
                touched={touched}
                touch={touch}
              />

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
