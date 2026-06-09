import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';

const MEDIUM_FEED = 'https://medium.com/feed/@bitcoinloverhq';

interface RssPost {
  guid: string;
  title: string;
  link: string;
  pubDate: string;
  thumbnail: string | null;
  categories: string[];
}

function parseRSS(xml: string): RssPost[] {
  const items: RssPost[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const guid = block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1]?.trim() ?? String(Math.random());
    const title = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1]?.trim()
      ?? block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? '';
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim()
      ?? block.match(/<link\s*\/>[\s\S]*?<([^>]+)>(https?:\/\/[^<]+)<\/\1>/)?.[2]?.trim() ?? '';
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? '';
    const content = block.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/)?.[1] ?? '';
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
    const thumbnail = imgMatch?.[1] ?? null;
    const categories: string[] = [];
    const catRegex = /<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>/g;
    let catMatch: RegExpExecArray | null;
    while ((catMatch = catRegex.exec(block)) !== null) {
      categories.push(catMatch[1].trim());
    }

    items.push({ guid, title, link, pubDate, thumbnail, categories });
  }

  return items;
}

@Controller('rss')
export class RssController {
  @Get('medium')
  async getMediumFeed(): Promise<RssPost[]> {
    try {
      const res = await fetch(MEDIUM_FEED, {
        headers: { 'User-Agent': 'satquest-landing/1.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      return parseRSS(xml);
    } catch {
      throw new HttpException('Failed to fetch RSS feed', HttpStatus.BAD_GATEWAY);
    }
  }
}
