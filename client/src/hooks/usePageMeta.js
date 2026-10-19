import { useEffect } from 'react';

/**
 * Sets the document <title> and meta description for a given page.
 * Falls back gracefully if meta tag doesn't exist.
 *
 * @param {string} title       - Page-specific title (shown in tab / search results)
 * @param {string} description - Page-specific meta description
 * @param {boolean} noIndex    - If true, adds noindex for private/auth pages
 */
export function usePageMeta(title, description, noIndex = false) {
  useEffect(() => {
    const siteName = 'SaaSify';
    const fullTitle = title ? `${title} – ${siteName}` : siteName;

    document.title = fullTitle;

    // Meta description
    let descTag = document.querySelector('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement('meta');
      descTag.name = 'description';
      document.head.appendChild(descTag);
    }
    if (description) descTag.content = description;

    // Robots
    let robotsTag = document.querySelector('meta[name="robots"]');
    if (!robotsTag) {
      robotsTag = document.createElement('meta');
      robotsTag.name = 'robots';
      document.head.appendChild(robotsTag);
    }
    robotsTag.content = noIndex ? 'noindex, nofollow' : 'index, follow';

    // OG title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = fullTitle;

    // OG description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && description) ogDesc.content = description;

    // Twitter title
    let twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.content = fullTitle;

    // Twitter description
    let twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc && description) twDesc.content = description;

    // Cleanup: restore defaults on unmount (for SPA navigation)
    return () => {
      document.title = `${siteName} – Project & Task Management for Modern Teams`;
    };
  }, [title, description, noIndex]);
}
