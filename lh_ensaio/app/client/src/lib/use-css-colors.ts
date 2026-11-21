import { useEffect, useState } from 'react';

/**
 * Resolve tokens CSS (ex.: "--chart-cat-1") para cores concretas.
 * Os gráficos ECharts desenham em canvas e não entendem var(--token),
 * então lemos o valor do tema atual em vez de fixar cores no código.
 */
export function useCssColors(tokens: readonly string[]): string[] {
  const read = () => {
    if (typeof window === 'undefined') return tokens.map(() => 'currentColor');
    const style = getComputedStyle(document.documentElement);
    return tokens.map((token) => style.getPropertyValue(token).trim() || 'currentColor');
  };

  const [colors, setColors] = useState<string[]>(read);
  const key = tokens.join('|');

  useEffect(() => {
    setColors(read());
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setColors(read());
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return colors;
}
