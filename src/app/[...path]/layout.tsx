import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';
import { HomeDocsLayout } from '@/components/home-docs-layout';

export default function Layout({ children }: LayoutProps<'/[...path]'>) {
  return (
    <HomeDocsLayout tree={source.getPageTree()} baseOptions={baseOptions()}>
      {children}
    </HomeDocsLayout>
  );
}