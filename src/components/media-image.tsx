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
          className={`fixed inset-0 z-50 flex items-center justify-center cursor-zoom-out transition-all duration-300 p-0 sm:p-8 ${overlayVisible ? 'bg-black/90 opacity-100' : 'bg-black/0 opacity-0'}`}
          onClick={() => setZoomed(false)}
        >
          <img
            src={src}
            alt={alt}
            className={`max-h-full w-full object-contain transition-all duration-300 sm:w-auto sm:max-w-full sm:rounded-lg ${overlayVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            loading="lazy"
          />
        </div>
      )}
    </>
  );
}