'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface MediaGalleryProps {
  images: string[];
  alt?: string;
}

const GAP_PX = 8;

export function MediaGallery({ images, alt = '' }: MediaGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomed, setZoomed] = useState<number | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [loadedSet, setLoadedSet] = useState<Set<number>>(new Set());
  const [ratios, setRatios] = useState<Record<number, number>>({});

  const lightboxDragRef = useRef<{ startX: number; moved: boolean; pointerId: number } | null>(null);

  const dragRef = useRef<{ startX: number; startOffset: number; moved: boolean; pointerId: number } | null>(null);
  const offsetRef = useRef(0);
  const indexRef = useRef(0);
  const animatingRef = useRef(false);

  useEffect(() => { offsetRef.current = offset; }, [offset]);
  useEffect(() => { indexRef.current = activeIndex; }, [activeIndex]);

  const getStep = useCallback(() => {
    const slide = trackRef.current?.firstElementChild as HTMLElement | null;
    if (!slide) return 0;
    return slide.clientWidth + GAP_PX;
  }, []);

  const maxOffset = useCallback(() => {
    const c = containerRef.current;
    if (!c) return 0;
    const step = getStep();
    const total = images.length * step - GAP_PX;
    return Math.max(0, total - c.clientWidth);
  }, [getStep, images.length]);

  const goTo = useCallback((i: number, animate: boolean) => {
    const clamped = Math.max(0, Math.min(images.length - 1, i));
    const step = getStep();
    const targetOffset = -Math.min(clamped * step, maxOffset());
    animatingRef.current = animate;
    if (trackRef.current) {
      trackRef.current.style.transition = animate ? 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)' : 'none';
      trackRef.current.style.transform = `translateX(${targetOffset}px)`;
    }
    setOffset(targetOffset);
    setActiveIndex(clamped);
    if (animate) {
      setTimeout(() => { animatingRef.current = false; }, 360);
    }
  }, [getStep, maxOffset, images.length]);

  useEffect(() => {
    if (zoomed !== null) {
      requestAnimationFrame(() => setOverlayVisible(true));
    } else {
      setOverlayVisible(false);
    }
  }, [zoomed]);

  useEffect(() => {
    if (zoomed === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(null);
      if (e.key === 'ArrowLeft' && zoomed > 0) setZoomed((z) => (z ?? 0) - 1);
      if (e.key === 'ArrowRight' && zoomed < images.length - 1) setZoomed((z) => (z ?? 0) + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed, images.length]);

  useEffect(() => {
    const handleResize = () => goTo(indexRef.current, false);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [goTo]);

  // Pointer events for drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (images.length <= 1) return;
    dragRef.current = { startX: e.clientX, startOffset: offsetRef.current, moved: false, pointerId: e.pointerId };
    setIsDragging(true);
    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [images.length]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const st = dragRef.current;
    if (!st) return;
    const dx = e.clientX - st.startX;
    if (Math.abs(dx) > 4) st.moved = true;
    let next = st.startOffset + dx;
    const max = maxOffset();
    if (next > 0) next = next * 0.35;
    if (next < -max) next = -max + (next + max) * 0.35;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${next}px)`;
    }
    setOffset(next);
    offsetRef.current = next;
  }, [maxOffset]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const st = dragRef.current;
    dragRef.current = null;
    setIsDragging(false);
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    if (!st) return;
    const dx = offsetRef.current - st.startOffset;
    const step = getStep();
    if (step === 0) return;
    if (!st.moved) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left - offsetRef.current;
      const targetIndex = Math.max(0, Math.min(images.length - 1, Math.floor(x / step)));
      setZoomed(targetIndex);
      return;
    }
    const shifted = Math.round(-dx / step);
    let target = indexRef.current + shifted;
    target = Math.max(0, Math.min(images.length - 1, target));
    goTo(target, true);
  }, [getStep, goTo, images.length]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (images.length <= 1) return;
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (delta > 0) {
      goTo(indexRef.current + 1, true);
    } else {
      goTo(indexRef.current - 1, true);
    }
  }, [goTo, images.length]);

  const handleSlideClick = useCallback((i: number) => {
    if (dragRef.current?.moved) return;
    setZoomed(i);
  }, []);

  const handleImageLoad = (i: number, e: React.SyntheticEvent<HTMLImageElement>) =>
    {
      const img = e.currentTarget;
      const ratio = img.naturalWidth / img.naturalHeight;
      setRatios((prev) => ({ ...prev, [i]: ratio }));
      setLoadedSet((prev) => new Set(prev).add(i));
    };

  return (
    <>
      <div className="w-full">
        <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl bg-fd-muted/30">
          <div
            ref={trackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            className={`flex h-[256px] sm:h-[288px] touch-pan-y ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ columnGap: `${GAP_PX}px`, transform: 'translateX(0px)', willChange: 'transform' }}
          >
            {images.map((src, i) => {
              const ratio = ratios[i] ?? 1;
              return (
                <div
                  key={i}
                  className="relative shrink-0 select-none overflow-hidden rounded-xl bg-fd-muted/50 flex items-center justify-center"
                  style={{
                    height: '100%',
                    aspectRatio: loadedSet.has(i) ? ratio : '16 / 9',
                  }}
                  onClick={() => handleSlideClick(i)}
                  onPointerUp={(e) => {
                    if (dragRef.current && !dragRef.current.moved) {
                      e.stopPropagation();
                      setZoomed(i);
                    }
                  }}
                >
                  {!loadedSet.has(i) && (
                    <span className="skeleton-shimmer absolute inset-0 w-full" />
                  )}
                  <img
                    src={src}
                    alt={`${alt} ${i + 1}`}
                    loading="lazy"
                    draggable={false}
                    className={`transition-opacity duration-500 select-none pointer-events-none h-full w-full object-contain ${loadedSet.has(i) ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={(e) => handleImageLoad(i, e)}
                  />
                </div>
              );
            })}
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(activeIndex - 1, true)}
                disabled={activeIndex === 0}
                aria-label="Предыдущее фото"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-all hover:bg-black/70 disabled:pointer-events-none disabled:opacity-0"
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => goTo(activeIndex + 1, true)}
                disabled={activeIndex === images.length - 1}
                aria-label="Следующее фото"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-all hover:bg-black/70 disabled:pointer-events-none disabled:opacity-0"
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>

              <div className="absolute top-2 right-2 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-medium text-white">
                {activeIndex + 1}/{images.length}
              </div>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-2 flex items-center justify-between gap-3 px-1">
            <div className="flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i, true)}
                  aria-label={`Фото ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === activeIndex ? 'w-5 bg-fd-primary' : 'w-1.5 bg-fd-muted-foreground/50'}`}
                />
              ))}
            </div>
            <span className="text-xs text-fd-muted-foreground">
              {activeIndex + 1}/{images.length}
            </span>
          </div>
        )}
      </div>

      {zoomed !== null && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center cursor-zoom-out transition-all duration-300 p-0 sm:p-4 ${overlayVisible ? 'bg-black/90 opacity-100' : 'bg-black/0 opacity-0'}`}
          onClick={() => setZoomed(null)}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setZoomed(null); }}
            aria-label="Закрыть"
            className="absolute top-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setZoomed((z) => (z !== null && z > 0 ? z - 1 : z)); }}
                disabled={zoomed === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
              >
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setZoomed((z) => (z !== null && z < images.length - 1 ? z + 1 : z)); }}
                disabled={zoomed === images.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
              >
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </>
          )}
          <div
            className="relative flex h-full w-full items-center justify-center"
            onTouchStart={(e) => {
              if (images.length <= 1) return;
              const t = e.touches[0];
              lightboxDragRef.current = { startX: t.clientX, moved: false, pointerId: 0 };
            }}
            onTouchMove={(e) => {
              const st = lightboxDragRef.current;
              if (!st) return;
              const t = e.touches[0];
              if (Math.abs(t.clientX - st.startX) > 4) st.moved = true;
            }}
            onTouchEnd={(e) => {
              const st = lightboxDragRef.current;
              lightboxDragRef.current = null;
              if (!st || st.moved) return;
              const t = e.changedTouches[0];
              const dx = t.clientX - st.startX;
              if (dx < -40 && zoomed < images.length - 1) setZoomed(zoomed + 1);
              else if (dx > 40 && zoomed > 0) setZoomed(zoomed - 1);
            }}
          >
            <img
              src={images[zoomed]}
              alt={`${alt} ${zoomed + 1}`}
              className={`max-h-full w-full object-contain transition-all duration-300 sm:w-auto sm:max-w-full sm:rounded-lg ${overlayVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
              loading="lazy"
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setZoomed(i); }}
                  className={`h-1.5 rounded-full transition-all ${i === zoomed ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}