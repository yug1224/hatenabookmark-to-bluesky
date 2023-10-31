import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';
import { FeedEntry } from 'https://deno.land/x/rss@0.6.0/src/types/mod.ts';

export default async (item: FeedEntry) => {
  const description = (() => {
    if (!item.description?.value) return '';
    const doc = new DOMParser().parseFromString(
      item.description?.value,
      'text/html',
    );
    return (doc?.documentElement?.textContent || '').trim();
  })();
  const link = item.links[0].href || '';

  // X用のテキストを作成
  const xText = (() => {
    return `${link}\n${description}`;
  })();

  console.log('success createXProps');
  return { xText };
};
