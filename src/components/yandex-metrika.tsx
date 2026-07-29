'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const METRIKA_ID = 111124225;
const METRIKA_SRC = `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`;

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
  }
}

function metrikaHit(url: string) {
  if (typeof window !== 'undefined' && window.ym) {
    window.ym(METRIKA_ID, 'hit', url, {
      referer: document.referrer,
      title: document.title,
    });
  }
}

export function YandexMetrika() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      metrikaHit(pathname);
    }
  }, [pathname]);

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`
          (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window, document,'script','${METRIKA_SRC}', 'ym');

          ym(${METRIKA_ID}, 'init', {
            defer: true,
            webvisor: true,
            clickmap: true,
            ecommerce: "dataLayer",
            accurateTrackBounce: true,
            trackLinks: true
          });
        `}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${METRIKA_ID}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}