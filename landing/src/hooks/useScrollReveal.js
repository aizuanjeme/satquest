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
      { threshold: 0.12 }
    );

    document
      .querySelectorAll('.reveal, .reveal-left, .reveal-right')
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  });
}
