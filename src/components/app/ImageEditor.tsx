import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

type Tool = 'crop' | 'blur';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type BlurZone = Rect;

interface ImageEditorProps {
  file: File;
  onSave: (editedFile: File) => void;
  onClose: () => void;
}

function rectFromPoints(x1: number, y1: number, x2: number, y2: number): Rect {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.abs(x2 - x1),
    h: Math.abs(y2 - y1),
  };
}

export function ImageEditor({ file, onSave, onClose }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [tool, setTool] = useState<Tool>('blur');
  const [blurZones, setBlurZones] = useState<BlurZone[]>([]);
  const [cropRect, setCropRect] = useState<Rect | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [startPt, setStartPt] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<Rect | null>(null);
  const [scale, setScale] = useState(1);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Загружаем изображение
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [file]);

  // Вычисляем масштаб и рисуем
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем изображение
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Рисуем зоны замазки (пикселизация)
    blurZones.forEach(zone => {
      applyPixelate(ctx, canvas, zone);
      // Рамка
      ctx.strokeStyle = 'rgba(239,68,68,0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
    });

    // Рисуем текущий прямоугольник
    if (currentRect && currentRect.w > 2 && currentRect.h > 2) {
      if (tool === 'blur') {
        ctx.strokeStyle = 'rgba(239,68,68,0.9)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(239,68,68,0.15)';
        ctx.fillRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
      } else {
        // Crop — затемняем всё кроме выделения
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.clearRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
        ctx.drawImage(img, currentRect.x, currentRect.y, currentRect.w, currentRect.h,
          currentRect.x, currentRect.y, currentRect.w, currentRect.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
        ctx.setLineDash([]);
      }
    }

    // Финальный crop overlay (если задан)
    if (cropRect && !currentRect) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
      ctx.drawImage(img, cropRect.x, cropRect.y, cropRect.w, cropRect.h,
        cropRect.x, cropRect.y, cropRect.w, cropRect.h);
      // Перерисовываем blur-зоны внутри crop
      blurZones.forEach(zone => {
        applyPixelate(ctx, canvas, zone);
        ctx.strokeStyle = 'rgba(239,68,68,0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
      });
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    }
  }, [blurZones, cropRect, currentRect, tool]);

  // Инициализация canvas при загрузке изображения
  useEffect(() => {
    if (!imgLoaded || !imgRef.current || !canvasRef.current || !containerRef.current) return;
    const img = imgRef.current;
    const container = containerRef.current;
    const maxW = container.clientWidth;
    const maxH = window.innerHeight * 0.6;
    const s = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
    setScale(s);
    canvasRef.current.width = Math.round(img.naturalWidth * s);
    canvasRef.current.height = Math.round(img.naturalHeight * s);
    draw();
  }, [imgLoaded, draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  function applyPixelate(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, zone: Rect) {
    if (zone.w < 2 || zone.h < 2) return;
    const px = Math.max(8, Math.round(Math.min(zone.w, zone.h) / 8));
    const imgData = ctx.getImageData(zone.x, zone.y, zone.w, zone.h);
    const d = imgData.data;
    for (let y = 0; y < zone.h; y += px) {
      for (let x = 0; x < zone.w; x += px) {
        const idx = (y * zone.w + x) * 4;
        const r = d[idx], g = d[idx + 1], b = d[idx + 2];
        for (let dy = 0; dy < px && y + dy < zone.h; dy++) {
          for (let dx = 0; dx < px && x + dx < zone.w; dx++) {
            const i = ((y + dy) * zone.w + (x + dx)) * 4;
            d[i] = r; d[i + 1] = g; d[i + 2] = b;
          }
        }
      }
    }
    ctx.putImageData(imgData, zone.x, zone.y);
  }

  function getCanvasPoint(e: React.MouseEvent | React.TouchEvent): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? (e as React.TouchEvent).changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? (e as React.TouchEvent).changedTouches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  }

  function onPointerDown(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const pt = getCanvasPoint(e);
    setStartPt(pt);
    setDrawing(true);
    setCurrentRect(null);
  }

  function onPointerMove(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return;
    e.preventDefault();
    const pt = getCanvasPoint(e);
    setCurrentRect(rectFromPoints(startPt.x, startPt.y, pt.x, pt.y));
  }

  function onPointerUp(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return;
    e.preventDefault();
    const pt = getCanvasPoint(e);
    const r = rectFromPoints(startPt.x, startPt.y, pt.x, pt.y);
    setDrawing(false);
    setCurrentRect(null);
    if (r.w < 5 || r.h < 5) return;
    if (tool === 'blur') {
      setBlurZones(prev => [...prev, r]);
    } else {
      setCropRect(r);
    }
  }

  const handleUndo = () => {
    if (tool === 'blur') {
      setBlurZones(prev => prev.slice(0, -1));
    } else {
      setCropRect(null);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const out = document.createElement('canvas');
    const ctx = out.getContext('2d')!;

    // Определяем финальную область
    const srcRect = cropRect
      ? {
          x: Math.round(cropRect.x / scale),
          y: Math.round(cropRect.y / scale),
          w: Math.round(cropRect.w / scale),
          h: Math.round(cropRect.h / scale),
        }
      : { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };

    out.width = srcRect.w;
    out.height = srcRect.h;

    // Рисуем оригинал в финальном разрешении
    ctx.drawImage(img, srcRect.x, srcRect.y, srcRect.w, srcRect.h, 0, 0, srcRect.w, srcRect.h);

    // Применяем пикселизацию в натуральном разрешении
    blurZones.forEach(zone => {
      const nZone = {
        x: Math.round(zone.x / scale) - srcRect.x,
        y: Math.round(zone.y / scale) - srcRect.y,
        w: Math.round(zone.w / scale),
        h: Math.round(zone.h / scale),
      };
      if (nZone.x < 0 || nZone.y < 0 || nZone.w < 2 || nZone.h < 2) return;
      applyPixelate(ctx, out, nZone);
    });

    out.toBlob(blob => {
      if (!blob) return;
      const editedFile = new File([blob], file.name.replace(/\.[^.]+$/, '') + '_edited.jpg', { type: 'image/jpeg' });
      onSave(editedFile);
    }, 'image/jpeg', 0.92);
  };

  const canUndo = tool === 'blur' ? blurZones.length > 0 : cropRect !== null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10">
        <button onClick={onClose} className="text-white/70 hover:text-white">
          <Icon name="X" size={24} />
        </button>
        <span className="text-white font-medium text-sm">Редактор фото</span>
        <Button
          size="sm"
          className="gradient-bg text-white h-8 px-4"
          onClick={handleSave}
        >
          <Icon name="Check" className="w-4 h-4 mr-1.5" />
          Сохранить
        </Button>
      </div>

      {/* Инструменты */}
      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-black/60">
        <button
          onClick={() => setTool('blur')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tool === 'blur' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
          }`}
        >
          <Icon name="EyeOff" className="w-4 h-4" />
          Замазать
        </button>
        <button
          onClick={() => setTool('crop')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tool === 'crop' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
          }`}
        >
          <Icon name="Crop" className="w-4 h-4" />
          Кадрировать
        </button>
        {canUndo && (
          <button
            onClick={handleUndo}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-white transition-colors"
          >
            <Icon name="Undo2" className="w-4 h-4" />
            Отмена
          </button>
        )}
      </div>

      {/* Подсказка */}
      <div className="text-center py-1">
        <p className="text-white/40 text-xs">
          {tool === 'blur'
            ? 'Нарисуйте прямоугольник поверх конфиденциальных данных'
            : 'Нарисуйте область для обрезки фото'}
        </p>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden p-4"
        style={{ touchAction: 'none' }}
      >
        {!imgLoaded ? (
          <Icon name="Loader" className="w-8 h-8 text-white/40 animate-spin" />
        ) : (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full rounded cursor-crosshair select-none"
            style={{ touchAction: 'none' }}
            onMouseDown={onPointerDown}
            onMouseMove={onPointerMove}
            onMouseUp={onPointerUp}
            onTouchStart={onPointerDown}
            onTouchMove={onPointerMove}
            onTouchEnd={onPointerUp}
          />
        )}
      </div>
    </div>
  );
}