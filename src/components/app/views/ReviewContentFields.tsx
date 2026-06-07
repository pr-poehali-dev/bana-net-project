import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Icon from '@/components/ui/icon';
import { sellerError, textError, mentionsSellerInText } from './addReviewHelpers';
import { ImageEditor } from '@/components/app/ImageEditor';

interface ReviewContentFieldsProps {
  seller: string;
  setSeller: (v: string) => void;
  rating: number;
  setRating: (v: number) => void;
  reviewText: string;
  setReviewText: (v: string) => void;
  uploadedFiles: File[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onReplaceFile: (index: number, file: File) => void;
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

function FilePreview({ file, index, onRemove, onEdit }: {
  file: File;
  index: number;
  onRemove: () => void;
  onEdit: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="relative group rounded-lg overflow-hidden border border-border bg-muted aspect-square">
      {preview ? (
        <img src={preview} alt={file.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Icon name="Image" className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        <button
          type="button"
          onClick={onEdit}
          className="p-2 bg-white/90 rounded-full text-gray-800 hover:bg-white transition-colors"
          title="Редактировать"
        >
          <Icon name="Pencil" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-2 bg-white/90 rounded-full text-destructive hover:bg-white transition-colors"
          title="Удалить"
        >
          <Icon name="Trash2" className="w-4 h-4" />
        </button>
      </div>
      {/* Номер файла */}
      <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
        {index + 1}
      </div>
    </div>
  );
}

export function ReviewContentFields({
  seller, setSeller,
  rating, setRating,
  reviewText, setReviewText,
  uploadedFiles, onFileUpload, onRemoveFile, onReplaceFile,
  touched, touch,
}: ReviewContentFieldsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sellerRequired = mentionsSellerInText(reviewText);
  const sErr = sellerError(seller, sellerRequired);
  const tErr = textError(reviewText);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  return (
    <>
      {/* Редактор фото */}
      {editingIndex !== null && uploadedFiles[editingIndex] && (
        <ImageEditor
          file={uploadedFiles[editingIndex]}
          onSave={edited => {
            onReplaceFile(editingIndex, edited);
            setEditingIndex(null);
          }}
          onClose={() => setEditingIndex(null)}
        />
      )}

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

        {/* Превью загруженных фото */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {uploadedFiles.map((file, index) => (
                <FilePreview
                  key={`${file.name}-${index}`}
                  file={file}
                  index={index}
                  onRemove={() => onRemoveFile(index)}
                  onEdit={() => setEditingIndex(index)}
                />
              ))}
              {/* Кнопка добавить ещё */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Icon name="Plus" className="w-6 h-6" />
                <span className="text-xs">Добавить</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {uploadedFiles.length} фото · Нажмите на фото чтобы обрезать или замазать данные
            </p>
          </div>
        )}

        {/* Зона загрузки (если файлов нет) */}
        {uploadedFiles.length === 0 && (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon name="Upload" className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs md:text-sm text-muted-foreground">1. Скриншот отклонённого отзыва из личного кабинета</p>
            <p className="text-xs md:text-sm text-muted-foreground">2. Фотография купленного товара</p>
            <p className="text-xs text-muted-foreground mt-2">Нажмите для выбора файлов</p>
          </div>
        )}
      </div>
    </>
  );
}
