import type { MDXComponents } from 'mdx/types';

import getMDXComponents from 'fumadocs-ui/mdx';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...getMDXComponents,
    ...components,
  };
}
