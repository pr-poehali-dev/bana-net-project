export interface AddReviewFormData {
  marketplace: string;
  product_article: string;
  product_link: string;
  seller: string;
  rating: number;
  review_text: string;
}

export function isValidUrl(v: string) {
  try { new URL(v); return true; } catch { return false; }
}

export function articleError(v: string): string | null {
  if (!v) return null;
  return /^\d+$/.test(v) ? null : 'Только цифры';
}

export function linkError(v: string): string | null {
  if (!v) return null;
  return isValidUrl(v) ? null : 'Введите корректную ссылку (начиная с https://)';
}

export const SELLER_KEYWORDS = [
  'продавец', 'продавца', 'продавцу', 'продавцом', 'продавце',
  'магазин', 'магазина', 'магазину', 'магазином', 'магазине',
  'поставщик', 'поставщика', 'поставщику',
  'seller', 'shop', 'store',
  'ооо', 'ип ', 'оао', 'зао', 'пао',
];

export function mentionsSellerInText(text: string): boolean {
  const lower = text.toLowerCase();
  return SELLER_KEYWORDS.some(kw => lower.includes(kw));
}

export function sellerError(v: string, required: boolean): string | null {
  if (required && !v.trim()) return 'В тексте отзыва упомянут продавец — укажите название';
  if (!v) return null;
  return /^[\p{L}0-9\s.,''«»"()/-]+$/u.test(v) ? null : 'Только буквы, цифры и базовые символы';
}

export function textError(v: string): string | null {
  if (!v) return null;
  return v.length >= 50 ? null : `Минимум 50 символов (сейчас ${v.length})`;
}
