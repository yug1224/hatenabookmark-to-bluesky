import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';
import { FeedEntry } from 'https://deno.land/x/rss@0.6.0/src/types/mod.ts';
import defaultsGraphemer from 'npm:graphemer';

const Graphemer = defaultsGraphemer.default;
const splitter = new Graphemer();

import AtprotoAPI, { BskyAgent } from 'npm:@atproto/api';
const { RichText } = AtprotoAPI;

export default async (agent: BskyAgent, item: FeedEntry) => {
  const title = (item.title?.value || '').trim();
  const description = (() => {
    if (!item.description?.value) return '';
    const doc = new DOMParser().parseFromString(
      item.description?.value,
      'text/html',
    );
    return (doc?.documentElement?.textContent || '').trim();
  })();
  const link = item.links[0].href || '';

  // Bluesky用のテキストを作成
  const bskyText = await (async () => {
    const { host, pathname } = new URL(link);
    const key = splitter.splitGraphemes(`${host}${pathname}`).slice(0, 19).join('') + '...\n---';
    const text = `${description}\n\n${key}`;
    // const max = 300;
    // const text = splitter.countGraphemes(`${description}\n\n${title}\n${key}`) <= max
    //   ? `${description}\n\n${title}\n${key}`
    //   : `${description}\n\n${key}`;

    const rt = new RichText({ text });
    await rt.detectFacets(agent);
    rt.facets = [
      {
        index: {
          byteStart: rt.unicodeText.length - splitter.countGraphemes(key),
          byteEnd: rt.unicodeText.length - splitter.countGraphemes('\n---'),
        },
        features: [
          {
            $type: 'app.bsky.richtext.facet#link',
            uri: link,
          },
        ],
      },
      ...(rt.facets || []),
    ];
    return rt;
  })();

  // X用のテキストを作成
  const xText = (() => {
    // const max = 118;
    // return splitter.countGraphemes(`${title}\n\n${description}`) <= max
    //   ? `${title}\n${link}\n\n${description}`
    //   : `${link}\n\n${description}`;

    return `${description}\n\n${title}\n${link}\n---`;
  })();

  return {
    bskyText,
    xText,
    title,
    link,
  };
};
