import { useEffect } from 'react';

/**
 * Observes all .reveal / .reveal-left / .reveal-right elements
 * and adds .visible when they enter the viewport.
 * Runs after every render so dynamically added elements (e.g. from API calls)
 * are automatically picked up.
 */
export function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.04,
        // Trigger 8% before the element reaches the bottom edge of the viewport
        // so content is already visible when it snaps into view on mobile.
        rootMargin: '0px 0px -8% 0px',
      }
    );

    document
      .querySelectorAll('.reveal, .reveal-left, .reveal-right')
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  });
}
