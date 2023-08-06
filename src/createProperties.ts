import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';
import { FeedEntry } from 'https://deno.land/x/rss@0.6.0/src/types/mod.ts';

export default (item: FeedEntry) => {
  const title = item.title?.value || '';
  const description = (() => {
    if (!item.description?.value) return '';
    const doc = new DOMParser().parseFromString(
      item.description?.value,
      'text/html'
    );
    return doc?.documentElement?.textContent || '';
  })();
  const link = item.links[0].href || '';
  const text = `${description}\n\n${link}`;

  return { title, link, text };
};
