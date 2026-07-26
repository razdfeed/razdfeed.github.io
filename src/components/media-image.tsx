'use client';

import { useState, useEffect } from 'react';

export function MediaImage({ src, alt = '' }: { src: string; alt?: string }) {
  const [zoomed, setZoomed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);

  useEffect(() => {
    if (zoomed) {
      requestAnimationFrame(() => setOverlayVisible(true));
    } else {
      setOverlayVisible(false);
    }
  }, [zoomed]);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed]);

  return (
    <>
      <span className="relative block w-full overflow-hidden rounded-lg" style={{ maxHeight: '490px' }}>
        {!loaded && (
          <span className="skeleton-shimmer absolute inset-0 w-full" style={{ minHeight: '200px' }} />
        )}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`relative w-full rounded-lg cursor-zoom-in transition-opacity duration-500 ease-in-out ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ maxHeight: '490px', objectFit: 'contain' }}
          onLoad={() => setLoaded(true)}
          onClick={() => setZoomed(true)}
        />
      </span>
      {zoomed && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-8 cursor-zoom-out transition-all duration-300 ${overlayVisible ? 'bg-black/80 opacity-100' : 'bg-black/0 opacity-0'}`}
          onClick={() => setZoomed(false)}
        >
          <img
            src={src}
            alt={alt}
            className={`max-h-full max-w-full rounded-lg object-contain transition-all duration-300 ${overlayVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            loading="lazy"
          />
        </div>
      )}
    </>
  );
}