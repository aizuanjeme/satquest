import { useState, useEffect } from 'react';

const MEDIUM_URL = 'https://medium.com/@bitcoinloverhq';

// Static posts from the RSS feed — shown immediately, no loading state.
// The useEffect below tries to refresh them live via a CORS proxy.
const STATIC_POSTS = [
  {
    guid: 'ec615a754b32',
    title: 'Mastering Bitcoin (3rd Edition) — Part 3: Bitcoin Core — The Reference Implementation',
    link: 'https://medium.com/@bitcoinloverhq/mastering-bitcoin-3rd-edition-part-3-bitcoin-core-the-reference-implementation-ec615a754b32',
    pubDate: '2026-01-29T11:33:09.000Z',
    thumbnail: 'https://cdn-images-1.medium.com/max/1024/0*JhZWFZg2GszxDcz6',
    categories: ['bitcoin', 'software-development'],
  },
  {
    guid: '66e79f88ade5',
    title: 'Mastering Bitcoin (3rd Edition) — Part 2: How Bitcoin Works (Deep Summary & Explanations)',
    link: 'https://medium.com/@bitcoinloverhq/mastering-bitcoin-3rd-edition-part-2-how-bitcoin-works-deep-summary-explanations-66e79f88ade5',
    pubDate: '2026-01-29T09:54:13.000Z',
    thumbnail: 'https://cdn-images-1.medium.com/max/1024/0*7LO4GiOTL0ICMawe',
    categories: ['bitcoin', 'blockchain'],
  },
  {
    guid: '85ac7fe60fe8',
    title: "Mastering Bitcoin (3rd Edition) — Part 1: What Is Bitcoin? (Notes & Explanations)",
    link: 'https://medium.com/@bitcoinloverhq/mastering-bitcoin-3rd-edition-part-1-what-is-bitcoin-notes-explanations-85ac7fe60fe8',
    pubDate: '2026-01-28T06:57:26.000Z',
    thumbnail: 'https://cdn-images-1.medium.com/max/1024/0*XrUKBBo-00tYZ5xA',
    categories: ['bitcoin', 'open-source'],
  },
  {
    guid: 'b66a325c4196',
    title: "Coin Selection Algorithm — Beginner's Guide",
    link: 'https://medium.com/@bitcoinloverhq/coin-selection-algorithm-beginners-guide-b66a325c4196',
    pubDate: '2026-01-28T06:52:49.000Z',
    thumbnail: 'https://cdn-images-1.medium.com/max/1024/0*VvDf_nw4EMJV9tse',
    categories: ['bitcoin', 'algorithms'],
  },
];

function parseRSS(xmlStr) {
  const xml = new DOMParser().parseFromString(xmlStr, 'text/xml');
  return [...xml.querySelectorAll('item')].map((item) => {
    const content = item.getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded')[0]?.textContent ?? '';
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
    return {
      guid: item.querySelector('guid')?.textContent ?? Math.random().toString(36),
      title: item.querySelector('title')?.textContent ?? '',
      link: (item.querySelector('link')?.nextSibling?.textContent?.trim() || item.querySelector('link')?.textContent) ?? '',
      pubDate: item.querySelector('pubDate')?.textContent ?? '',
      thumbnail: imgMatch?.[1] ?? null,
      categories: [...item.querySelectorAll('category')].map((c) => c.textContent),
    };
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function PostCard({ post, index }) {
  const tag = post.categories?.[0] ?? 'bitcoin';

  return (
    <a
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-[rgba(184,69,255,0.07)] border border-white/10 rounded-[22px] overflow-hidden no-underline transition-all duration-300 hover:-translate-y-1.5 hover:border-[rgba(184,69,255,0.35)] hover:shadow-[0_16px_48px_rgba(184,69,255,0.15)]"
      style={{ animation: `fadein 0.45s ease both`, animationDelay: `${0.3 + index * 0.08}s` }}
    >
      {/* Thumbnail */}
      <div className="relative h-[160px] overflow-hidden bg-[rgba(184,69,255,0.12)] flex-shrink-0">
        {post.thumbnail ? (
          <img
            src={post.thumbnail}
            alt={post.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[3rem] opacity-20">⚡</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(11,0,48,0.6)] to-transparent" />
        <span className="absolute bottom-3 left-4 bg-[rgba(184,69,255,0.55)] border border-[rgba(184,69,255,0.4)] text-[#FFF7FF] text-[0.65rem] font-extrabold uppercase tracking-[1px] px-2.5 py-0.5 rounded-full">
          {tag}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-5 flex-1">
        <p className="text-[#7A5DC9] text-[0.72rem] font-semibold m-0">{formatDate(post.pubDate)}</p>
        <h3 className="text-[#FFF7FF] font-extrabold text-[0.95rem] leading-[1.35] m-0 line-clamp-3 group-hover:text-[#FF9500] transition-colors duration-200">
          {post.title}
        </h3>
        <span className="mt-auto text-[0.75rem] font-bold text-[#7A5DC9] group-hover:text-[#B845FF] transition-colors">
          Read on Medium →
        </span>
      </div>
    </a>
  );
}

export default function Blog() {
  const [posts, setPosts] = useState(STATIC_POSTS);

  // Try to refresh with live data in the background — static posts stay visible
  // if the fetch fails (CORS proxy down, network issues, etc.)
  useEffect(() => {
    const url = `https://api.allorigins.win/get?url=${encodeURIComponent('https://medium.com/feed/@bitcoinloverhq')}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const live = parseRSS(data.contents);
        if (live.length > 0) setPosts(live);
      })
      .catch(() => {/* keep static posts */});
  }, []);

  return (
    <section
      id="blog"
      className="py-24 px-[5%] relative overflow-hidden flex flex-col justify-center"
    >
      {/* Blobs */}
      <div className="pointer-events-none absolute -top-[80px] -left-[60px] w-[400px] h-[400px] rounded-full blur-[90px] opacity-20 bg-[radial-gradient(circle,rgba(184,69,255,0.3),transparent_70%)]" />
      <div className="pointer-events-none absolute -bottom-[60px] -right-[60px] w-[380px] h-[380px] rounded-full blur-[80px] opacity-20 bg-[radial-gradient(circle,rgba(255,149,0,0.25),transparent_70%)]" />

      {/* Heading */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <span className="block text-[0.8rem] font-extrabold tracking-[2px] uppercase text-[#FF9500] mb-3" style={{ animation: 'fadein 0.45s ease both', animationDelay: '0.1s' }}>
            From the Author
          </span>
          <h2
            className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black leading-[1.15] tracking-[-0.5px] m-0"
            style={{ animation: 'fadein 0.45s ease both', animationDelay: '0.2s' }}
          >
            Bitcoin <span className="grad-text">Blog</span>
          </h2>
        </div>
        <a
          href={MEDIUM_URL}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 no-underline bg-transparent border-[1.5px] border-white/10 text-[#B095E8] px-6 py-2.5 rounded-full text-[0.9rem] font-bold transition-all duration-200 hover:border-[#B845FF] hover:text-[#B845FF] flex-shrink-0"
          style={{ animation: 'fadein 0.45s ease both', animationDelay: '0.3s' }}
        >
          All posts ↗
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.slice(0, 6).map((post, i) => (
          <PostCard key={post.guid} post={post} index={i} />
        ))}
      </div>
    </section>
  );
}

