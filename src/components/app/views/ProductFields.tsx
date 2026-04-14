import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Icon from '@/components/ui/icon';
import { PRODUCT_LOOKUP_URL } from '@/types/app';
import { articleError, linkError } from './addReviewHelpers';

interface ProductFieldsProps {
  marketplace: string;
  setMarketplace: (v: string) => void;
  productArticle: string;
  setProductArticle: (v: string) => void;
  productLink: string;
  setProductLink: (v: string) => void;
  autofilled: Record<string, boolean>;
  setAutofilled: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  lookupLoading: boolean;
  setLookupLoading: (v: boolean) => void;
  lookupError: string | null;
  setLookupError: (v: string | null) => void;
  touched: Record<string, boolean>;
  touch: (field: string) => void;
}

function FieldError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
      <Icon name="AlertCircle" className="w-3 h-3 flex-shrink-0" />
      {msg}
    </p>
  );
}

export function ProductFields({
  marketplace, setMarketplace,
  productArticle, setProductArticle,
  productLink, setProductLink,
  autofilled, setAutofilled,
  lookupLoading, setLookupLoading,
  lookupError, setLookupError,
  touched, touch,
}: ProductFieldsProps) {
  const aErr = articleError(productArticle);
  const lErr = linkError(productLink);

  const applyLookupResult = useCallback((data: { ok: boolean; marketplace?: string; article?: string; url?: string; error?: string }) => {
    if (!data.ok) {
      setLookupError(data.error ?? 'Не удалось определить товар');
      return;
    }
    setLookupError(null);
    if (data.marketplace) { setMarketplace(data.marketplace); setAutofilled(a => ({ ...a, marketplace: true })); }
    if (data.article) { setProductArticle(data.article); setAutofilled(a => ({ ...a, article: true })); }
    if (data.url) { setProductLink(data.url); setAutofilled(a => ({ ...a, link: true })); }
  }, [setLookupError, setMarketplace, setProductArticle, setProductLink, setAutofilled]);

  async function lookupByArticle(art: string, mp: string) {
    if (!art || !!articleError(art)) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await fetch(PRODUCT_LOOKUP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article: art, marketplace: mp }),
      });
      const data = await res.json();
      applyLookupResult(data);
    } catch {
      setLookupError('Ошибка соединения с сервером');
    } finally {
      setLookupLoading(false);
    }
  }

  async function lookupByUrl(url: string) {
    if (!url) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await fetch(PRODUCT_LOOKUP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      applyLookupResult(data);
    } catch {
      setLookupError('Ошибка соединения с сервером');
    } finally {
      setLookupLoading(false);
    }
  }

  function handleArticleBlur() {
    touch('article');
    if (productArticle && !articleError(productArticle)) {
      lookupByArticle(productArticle, marketplace);
    }
  }

  function handleLinkBlur() {
    touch('link');
    if (productLink) {
      lookupByUrl(productLink);
    }
  }

  function handleArticleChange(value: string) {
    setProductArticle(value);
    setAutofilled(a => ({ ...a, article: false }));
    setLookupError(null);
  }

  function handleLinkChange(value: string) {
    setProductLink(value);
    setAutofilled(a => ({ ...a, link: false }));
    setLookupError(null);
  }

  return (
    <>
      {/* Маркетплейс */}
      <div>
        <label className="text-sm font-medium mb-2 flex items-center gap-1.5">
          Маркетплейс *
          {autofilled.marketplace && (
            <span className="text-xs text-green-600 font-normal flex items-center gap-0.5">
              <Icon name="Sparkles" className="w-3 h-3" /> Определён автоматически
            </span>
          )}
        </label>
        <Select value={marketplace} onValueChange={v => { setMarketplace(v); setAutofilled(a => ({ ...a, marketplace: false })); }}>
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
        <label className="text-sm font-medium mb-2 flex items-center gap-1.5">
          Артикул товара *
          {lookupLoading && <Icon name="Loader2" className="w-3 h-3 animate-spin text-muted-foreground" />}
          {!lookupLoading && autofilled.article && (
            <span className="text-xs text-green-600 font-normal flex items-center gap-0.5">
              <Icon name="Sparkles" className="w-3 h-3" /> Заполнен автоматически
            </span>
          )}
        </label>
        <Input
          value={productArticle}
          onChange={e => handleArticleChange(e.target.value)}
          onBlur={handleArticleBlur}
          placeholder="12345678"
          className={`h-11 md:h-10 ${touched.article && aErr ? 'border-destructive focus-visible:ring-destructive' : autofilled.article ? 'border-green-400' : ''}`}
          inputMode="numeric"
          disabled={lookupLoading}
        />
        {touched.article && <FieldError msg={aErr} />}
      </div>

      {/* Ссылка */}
      <div>
        <label className="text-sm font-medium mb-2 flex items-center gap-1.5">
          Ссылка на товар *
          {lookupLoading && <Icon name="Loader2" className="w-3 h-3 animate-spin text-muted-foreground" />}
          {!lookupLoading && autofilled.link && (
            <span className="text-xs text-green-600 font-normal flex items-center gap-0.5">
              <Icon name="Sparkles" className="w-3 h-3" /> Заполнена автоматически
            </span>
          )}
        </label>
        <Input
          value={productLink}
          onChange={e => handleLinkChange(e.target.value)}
          onBlur={handleLinkBlur}
          placeholder="https://wildberries.ru/catalog/... или https://ozon.ru/product/..."
          className={`h-11 md:h-10 ${touched.link && lErr ? 'border-destructive focus-visible:ring-destructive' : autofilled.link ? 'border-green-400' : ''}`}
          disabled={lookupLoading}
        />
        {touched.link && <FieldError msg={lErr} />}
      </div>

      {/* Ошибка lookup */}
      {lookupError && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          <Icon name="AlertTriangle" className="w-3.5 h-3.5 flex-shrink-0" />
          {lookupError}
        </div>
      )}
    </>
  );
}
