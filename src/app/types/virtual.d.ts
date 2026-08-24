declare module 'virtual:tokens' {
  export const tokens: { name: string; value: string }[];
  export const light: Map<string, string>;
  export const dark: Map<string, string>;
}

declare module '*.mdx' {
  import type { ComponentType } from 'react';

  export const meta: Record<string, unknown>;
  export const headings: { id: string; text: string; depth: 2 | 3 }[];

  const MDXComponent: ComponentType<{ components?: Record<string, unknown> }>;
  export default MDXComponent;
}

declare module 'virtual:content' {
  export const entries: {
    locale: string;
    collection: string;
    slug: string;
    title: string;
    description: string;
    group: string;
    order: number;
  }[];
}
