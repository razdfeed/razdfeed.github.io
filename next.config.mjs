import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const repo = process.env.GITHUB_REPOSITORY ?? 'razdfeed/razdfeed.github.io';
const [, repoName] = repo.split('/');
const basePath = repoName === 'razdfeed.github.io' ? '' : `/${repoName}`;

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: basePath || undefined,
  serverExternalPackages: ['@takumi-rs/core'],
  reactStrictMode: true,
};

export default withMDX(config);
