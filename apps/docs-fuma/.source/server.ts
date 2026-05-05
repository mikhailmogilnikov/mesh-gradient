// @ts-nocheck
import type * as Config from '../source.config';

import { server } from 'fumadocs-mdx/runtime/server';

import * as __fd_glob_13 from '../content/docs/vue/use-mesh-gradient.mdx?collection=docs';
import * as __fd_glob_12 from '../content/docs/vue/quick-start.mdx?collection=docs';
import * as __fd_glob_11 from '../content/docs/vue/mesh-gradient.mdx?collection=docs';
import * as __fd_glob_10 from '../content/docs/react/use-mesh-gradient.mdx?collection=docs';
import * as __fd_glob_9 from '../content/docs/react/quick-start.mdx?collection=docs';
import * as __fd_glob_8 from '../content/docs/react/mesh-gradient.mdx?collection=docs';
import * as __fd_glob_7 from '../content/docs/quick-start.mdx?collection=docs';
import * as __fd_glob_6 from '../content/docs/introduction.mdx?collection=docs';
import * as __fd_glob_5 from '../content/docs/index.mdx?collection=docs';
import * as __fd_glob_4 from '../content/docs/api.mdx?collection=docs';
import * as __fd_glob_3 from '../content/docs/advanced-usage.mdx?collection=docs';
import { default as __fd_glob_2 } from '../content/docs/vue/meta.json?collection=docs';
import { default as __fd_glob_1 } from '../content/docs/react/meta.json?collection=docs';
import { default as __fd_glob_0 } from '../content/docs/meta.json?collection=docs';

const create = server<
  typeof Config,
  import('fumadocs-mdx/runtime/types').InternalTypeConfig & {
    DocData: {};
  }
>({ doc: { passthroughs: ['extractedReferences'] } });

export const docs = await create.docs(
  'docs',
  'content/docs',
  { 'meta.json': __fd_glob_0, 'react/meta.json': __fd_glob_1, 'vue/meta.json': __fd_glob_2 },
  {
    'advanced-usage.mdx': __fd_glob_3,
    'api.mdx': __fd_glob_4,
    'index.mdx': __fd_glob_5,
    'introduction.mdx': __fd_glob_6,
    'quick-start.mdx': __fd_glob_7,
    'react/mesh-gradient.mdx': __fd_glob_8,
    'react/quick-start.mdx': __fd_glob_9,
    'react/use-mesh-gradient.mdx': __fd_glob_10,
    'vue/mesh-gradient.mdx': __fd_glob_11,
    'vue/quick-start.mdx': __fd_glob_12,
    'vue/use-mesh-gradient.mdx': __fd_glob_13,
  },
);
