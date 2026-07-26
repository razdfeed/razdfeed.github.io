import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { LogoTitle } from '@/components/logo-title';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <LogoTitle />,
    },
  };
}