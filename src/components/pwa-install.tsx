'use client';

import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    if (isIos()) {
      setIos(true);
      setVisible(true);
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!visible) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setVisible(false);
      }
      setDeferredPrompt(null);
    } else if (ios) {
      setShowIosHint((v) => !v);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {showIosHint && ios && (
        <div className="max-w-xs rounded-xl border border-neutral-700 bg-neutral-900 p-4 text-sm text-neutral-200 shadow-xl">
          <p className="mb-2 font-semibold text-white">
            Установить RazdFeed на iOS:
          </p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>
              Нажмите кнопку{' '}
              <Share className="inline h-4 w-4 align-text-bottom" /> «Поделиться»
              в Safari
            </li>
            <li>Выберите «На экран „Домой“»</li>
            <li>Нажмите «Добавить»</li>
          </ol>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleInstall}
          className="flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition-colors hover:bg-neutral-800"
        >
          <Download className="h-4 w-4" />
          Установить приложение
        </button>
        <button
          type="button"
          aria-label="Закрыть"
          onClick={() => {
            setVisible(false);
            setShowIosHint(false);
          }}
          className="rounded-full border border-neutral-700 bg-neutral-900 p-2 text-neutral-400 shadow-lg transition-colors hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
