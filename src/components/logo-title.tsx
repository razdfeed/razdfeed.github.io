'use client';

import { usePathname } from 'next/navigation';

export function LogoTitle() {
  const pathname = usePathname() ?? '/';
  const isActive = pathname === '/';

  return (
    <img
      src="/logo.png"
      alt="razdfeed"
      width={45}
      height={45}
      onClick={() => {
        if (pathname === '/') {
          window.location.reload();
        }
      }}
      className={
        `rounded cursor-pointer transition-all active:scale-95 ` +
        (isActive
          ? ''
          : 'hover:opacity-80')
      }
    />
  );
}
