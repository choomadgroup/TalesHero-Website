declare module '*.mdx' {
    import { ComponentType } from 'react';

    export const frontmatter: {
        title?: string;
        date?: string;
        excerpt?: string;
        cover?: string;
        [key: string]: string | undefined;
    };

    const MDXComponent: ComponentType;
    export default MDXComponent;
}
