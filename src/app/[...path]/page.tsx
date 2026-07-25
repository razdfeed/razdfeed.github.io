import { DynamicRoute } from '@/components/dynamic-route';

export function generateStaticParams() {
  return [{ path: ['_author'] }, { path: ['_author', '_post'] }];
}

export default async function Page() {
  return <DynamicRoute />;
}