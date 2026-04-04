import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

export interface Review {
  id: number;
  marketplace: string;
  productArticle: string;
  productLink: string;
  seller: string;
  author: string;
  rating: number;
  text: string;
  fullText: string;
  date: string;
  status: string;
  images: string[];
}

interface ReviewCardProps {
  review: Review;
  index: number;
  onClick: (review: Review) => void;
}

export function ReviewCard({ review, index, onClick }: ReviewCardProps) {
  return (
    <Card
      key={review.id}
      className="animate-fade-in hover:shadow-lg transition-shadow cursor-pointer"
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={() => onClick(review)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <Avatar className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
              <AvatarFallback className="gradient-bg text-white text-sm">{review.author[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base md:text-lg truncate">{review.author}</CardTitle>
              <CardDescription className="flex items-center gap-1 md:gap-2 flex-wrap">
                <Badge variant={review.marketplace === 'Wildberries' ? 'default' : 'secondary'} className="text-xs">
                  {review.marketplace}
                </Badge>
                <span className="text-xs">{review.date}</span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Icon name="ThumbsDown" className="w-4 h-4 md:w-5 md:h-5 text-destructive fill-destructive" />
            <span className="text-sm md:text-base font-semibold text-destructive">{review.rating}/5</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm md:text-base text-foreground mb-3 md:mb-4 line-clamp-2">{review.text}</p>
        {review.images && review.images.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {review.images.slice(0, 3).map((img, i) => (
              <img key={i} src={img} alt="" className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover flex-shrink-0" />
            ))}
            {review.images.length > 3 && (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-sm text-muted-foreground">+{review.images.length - 3}</span>
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 text-xs md:text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Icon name="Package" className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="truncate">Артикул: {review.productArticle}</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon name="Store" className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="truncate">Продавец: {review.seller}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ReviewDetailProps {
  review: Review;
  onBack: () => void;
}

export function ReviewDetail({ review, onBack }: ReviewDetailProps) {
  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-8 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" className="mb-4" onClick={onBack}>
            <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
            Назад к отзывам
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="gradient-bg text-white text-lg">{review.author[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{review.author}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant={review.marketplace === 'Wildberries' ? 'default' : 'secondary'}>
                        {review.marketplace}
                      </Badge>
                      <span>{review.date}</span>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Icon name="ThumbsDown" className="w-6 h-6 text-destructive fill-destructive" />
                  <span className="text-lg font-bold text-destructive">{review.rating}/5</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base md:text-lg leading-relaxed">{review.fullText || review.text}</p>

              {review.images && review.images.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Прикреплённые изображения</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {review.images.map((img, i) => (
                      <img key={i} src={img} alt={`Фото ${i + 1}`} className="w-full aspect-square rounded-lg object-cover" />
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Icon name="Package" className="w-4 h-4" />
                  <span>Артикул: {review.productArticle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Link" className="w-4 h-4" />
                  <a href={review.productLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                    {review.productLink}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Store" className="w-4 h-4" />
                  <span>Продавец: {review.seller}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
