import { useEffect } from 'react';

interface PageMeta {
    title: string;
    description: string;
}

const BASE_IMAGE = '/Image/tales-hero-banner.png';

function setMeta(property: string, content: string) {
    let el = document.querySelector<HTMLMetaElement>(
        `meta[property="${property}"], meta[name="${property}"]`
    );
    if (!el) {
        el = document.createElement('meta');
        if (property.startsWith('og:') || property.startsWith('twitter:')) {
            el.setAttribute(property.startsWith('og:') ? 'property' : 'name', property);
        } else {
            el.setAttribute('name', property);
        }
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

export function usePageMeta({ title, description }: PageMeta) {
    useEffect(() => {
        document.title = title;
        setMeta('og:title',            title);
        setMeta('og:description',      description);
        setMeta('og:image',            BASE_IMAGE);
        setMeta('twitter:title',       title);
        setMeta('twitter:description', description);
        setMeta('twitter:image',       BASE_IMAGE);
        setMeta('description',         description);
        window.scrollTo({ top: 0 });
    }, [title, description]);
}
