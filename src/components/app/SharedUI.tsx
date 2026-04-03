import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { Review, formatDate } from '@/types/app';

export function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-1/4" />
          </div>
        </div>
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-5/6" />
        <div className="flex gap-2">
          <div className="w-16 h-16 bg-muted rounded-lg" />
          <div className="w-16 h-16 bg-muted rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export function MarketplaceBadge({ marketplace }: { marketplace: string }) {
  const isWB = marketplace === 'Wildberries';
  return (
    <Badge className={isWB ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-blue-100 text-blue-800 border-blue-200'}>
      {marketplace}
    </Badge>
  );
}

export function RatingDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon
          key={i}
          name="ThumbsDown"
          size={14}
          className={i < rating ? 'text-primary fill-primary' : 'text-muted-foreground'}
        />
      ))}
    </div>
  );
}

export function StatusBadge({ status }: { status: Review['status'] }) {
  if (status === 'approved') return <Badge className="bg-green-100 text-green-800 border-green-200">Опубликован</Badge>;
  if (status === 'rejected') return <Badge className="bg-red-100 text-red-800 border-red-200">Отклонён</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">На модерации</Badge>;
}

export function ReviewCard({ review, onClick }: { review: Review; onClick: () => void }) {
  const previewImages = review.images?.slice(0, 3) ?? [];
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="w-9 h-9 shrink-0">
              {review.author_avatar && <AvatarImage src={review.author_avatar} alt={review.author_name} />}
              <AvatarFallback className="text-xs gradient-bg text-white">
                {review.author_name?.charAt(0)?.toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{review.author_name}</p>
              <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
            </div>
          </div>
          <MarketplaceBadge marketplace={review.marketplace} />
        </div>

        <RatingDisplay rating={review.rating} />

        <p className="text-sm text-muted-foreground line-clamp-3">{review.review_text}</p>

        {previewImages.length > 0 && (
          <div className="flex gap-2">
            {previewImages.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Фото ${i + 1}`}
                className="w-16 h-16 rounded-lg object-cover border"
                loading="lazy"
              />
            ))}
            {(review.images?.length ?? 0) > 3 && (
              <div className="w-16 h-16 rounded-lg border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                +{review.images.length - 3}
              </div>
            )}
          </div>
        )}

        {(review.product_article || review.seller) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {review.product_article && <span>Арт: {review.product_article}</span>}
            {review.seller && <span>Продавец: {review.seller}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
