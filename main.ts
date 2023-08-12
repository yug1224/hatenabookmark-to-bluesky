import 'https://deno.land/std@0.193.0/dotenv/load.ts';

import createProperties from './src/createProperties.ts';
import getItemList from './src/getItemList.ts';
import getOgp from './src/getOgp.ts';
import postBluesky from './src/postBluesky.ts';
import postWebhook from './src/postWebhook.ts';
import resizeImage from './src/resizeImage.ts';

// rss feedから記事リストを取得
const itemList = await getItemList();
console.log(JSON.stringify(itemList, null, 2));

// 対象がなかったら終了
if (!itemList.length) {
  console.log('not found feed item');
  Deno.exit(0);
}

// 取得した記事リストをループ処理
for await (const item of itemList) {
  // 最終実行時間を更新
  const timestamp = item.published
    ? new Date(item.published).toISOString()
    : new Date().toISOString();
  await Deno.writeTextFile('.timestamp', timestamp);

  // URLからOGPの取得
  const og = await getOgp(item.links[0].href || '');

  // 投稿記事のプロパティを作成
  const { bskyText, xText, title, link } = await createProperties({
    ...item,
    title: {
      type: item.title?.type,
      value: og.ogTitle || item.title?.value || '',
    },
  });

  // 画像のリサイズ
  const { mimeType, resizedImage } = await (async () => {
    const ogImage = og.ogImage?.at(0);
    if (!ogImage) {
      console.log('ogp image not found');
      return {};
    }
    return await resizeImage(new URL(ogImage.url, link).href);
  })();

  // Blueskyに投稿
  await postBluesky({
    rt: bskyText,
    title,
    link,
    description: og.ogDescription || '',
    mimeType,
    image: resizedImage,
  });

  // IFTTTを使ってXに投稿
  await postWebhook(xText);
}
