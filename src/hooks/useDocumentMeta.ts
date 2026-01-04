import { useEffect } from 'react';

interface DocumentMeta {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
}

/**
 * Hook to dynamically set document meta tags for SEO
 */
export const useDocumentMeta = (meta: DocumentMeta) => {
  useEffect(() => {
    // Store original values
    const originalTitle = document.title;
    const originalDescription = document.querySelector('meta[name="description"]')?.getAttribute('content');
    const originalOgTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    const originalOgDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
    const originalOgImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
    const originalTwitterTitle = document.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
    const originalTwitterDescription = document.querySelector('meta[name="twitter:description"]')?.getAttribute('content');
    const originalTwitterImage = document.querySelector('meta[name="twitter:image"]')?.getAttribute('content');

    // Set new values
    if (meta.title) {
      document.title = meta.title;
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', meta.title);
      document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', meta.title);
    }

    if (meta.description) {
      const desc = meta.description.slice(0, 160);
      document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', desc);
      document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', desc);
    }

    if (meta.image) {
      document.querySelector('meta[property="og:image"]')?.setAttribute('content', meta.image);
      document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', meta.image);
    }

    // Cleanup: restore original values
    return () => {
      document.title = originalTitle;
      if (originalDescription) {
        document.querySelector('meta[name="description"]')?.setAttribute('content', originalDescription);
      }
      if (originalOgTitle) {
        document.querySelector('meta[property="og:title"]')?.setAttribute('content', originalOgTitle);
      }
      if (originalOgDescription) {
        document.querySelector('meta[property="og:description"]')?.setAttribute('content', originalOgDescription);
      }
      if (originalOgImage) {
        document.querySelector('meta[property="og:image"]')?.setAttribute('content', originalOgImage);
      }
      if (originalTwitterTitle) {
        document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', originalTwitterTitle);
      }
      if (originalTwitterDescription) {
        document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', originalTwitterDescription);
      }
      if (originalTwitterImage) {
        document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', originalTwitterImage);
      }
    };
  }, [meta.title, meta.description, meta.image]);
};
