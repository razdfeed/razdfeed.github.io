'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface MediaGalleryProps {
  images: string[];
  alt?: string;
}

export function MediaGallery({ images, alt = '' }: MediaGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState<number | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [loadedSet, setLoadedSet] = useState<Set<number>>(new Set());

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

  const scrollToIndex = useCallback((i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  }, []);

  const scrollPrev = useCallback(() => {
    const i = Math.max(0, activeIndex - 1);
    scrollToIndex(i);
  }, [activeIndex, scrollToIndex]);

  const scrollNext = useCallback(() => {
    const i = Math.min(images.length - 1, activeIndex + 1);
    scrollToIndex(i);
  }, [activeIndex, images.length, scrollToIndex]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(i);
  }, []);

  const setLoaded = (i: number) => {
    setLoadedSet((prev) => new Set(prev).add(i));
  };

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-lg">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {images.map((src, i) => (
            <div
              key={i}
              className="relative w-full shrink-0 snap-center"
            >
              {!loadedSet.has(i) && (
                <span className="skeleton-shimmer absolute inset-0 w-full" style={{ minHeight: '300px' }} />
              )}
              <img
                src={src}
                alt={`${alt} ${i + 1}`}
                loading="lazy"
                className={`relative w-full transition-opacity duration-500 ${loadedSet.has(i) ? 'opacity-100' : 'opacity-0'}`}
                style={{ maxHeight: '490px', objectFit: 'contain' }}
                onLoad={() => setLoaded(i)}
                onClick={() => setZoomed(i)}
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={scrollPrev}
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
              onClick={scrollNext}
              disabled={activeIndex === images.length - 1}
              aria-label="Следующее фото"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-all hover:bg-black/70 disabled:pointer-events-none disabled:opacity-0"
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToIndex(i)}
                  aria-label={`Фото ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === activeIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                />
              ))}
            </div>

            <div className="absolute top-2 right-2 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-medium text-white">
              {activeIndex + 1}/{images.length}
            </div>
          </>
        )}
      </div>

      {zoomed !== null && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 cursor-zoom-out transition-all duration-300 ${overlayVisible ? 'bg-black/80 opacity-100' : 'bg-black/0 opacity-0'}`}
          onClick={() => setZoomed(null)}
        >
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
          <img
            src={images[zoomed]}
            alt={`${alt} ${zoomed + 1}`}
            className={`max-h-full max-w-full rounded-lg object-contain transition-all duration-300 ${overlayVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            loading="lazy"
            onClick={(e) => e.stopPropagation()}
          />
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