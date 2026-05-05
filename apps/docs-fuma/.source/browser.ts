// @ts-nocheck
import type * as Config from '../source.config';

import { browser } from 'fumadocs-mdx/runtime/browser';

const create = browser<
  typeof Config,
  import('fumadocs-mdx/runtime/types').InternalTypeConfig & {
    DocData: {};
  }
>();
const browserCollections = {
  docs: create.doc('docs', {
    'advanced-usage.mdx': () => import('../content/docs/advanced-usage.mdx?collection=docs'),
    'api.mdx': () => import('../content/docs/api.mdx?collection=docs'),
    'index.mdx': () => import('../content/docs/index.mdx?collection=docs'),
    'introduction.mdx': () => import('../content/docs/introduction.mdx?collection=docs'),
    'quick-start.mdx': () => import('../content/docs/quick-start.mdx?collection=docs'),
    'react/mesh-gradient.mdx': () => import('../content/docs/react/mesh-gradient.mdx?collection=docs'),
    'react/quick-start.mdx': () => import('../content/docs/react/quick-start.mdx?collection=docs'),
    'react/use-mesh-gradient.mdx': () => import('../content/docs/react/use-mesh-gradient.mdx?collection=docs'),
    'vue/mesh-gradient.mdx': () => import('../content/docs/vue/mesh-gradient.mdx?collection=docs'),
    'vue/quick-start.mdx': () => import('../content/docs/vue/quick-start.mdx?collection=docs'),
    'vue/use-mesh-gradient.mdx': () => import('../content/docs/vue/use-mesh-gradient.mdx?collection=docs'),
  }),
};

export default browserCollections;
