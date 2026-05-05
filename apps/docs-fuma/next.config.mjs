import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const config = {
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms-mdx/:path*',
      },
    ];
  },
};

const withMDX = createMDX();

export default withMDX(config);
