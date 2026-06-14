import { useEffect, useState } from 'react'
import s from './Blog.module.css'

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
    title: 'Mastering Bitcoin (3rd Edition) — Part 1: What Is Bitcoin? (Notes & Explanations)',
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
]

function fmt(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function PostCard({ post, index }) {
  const tag = post.categories?.[0] ?? 'bitcoin'
  return (
    <a
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      className={s.card}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className={s.thumb}>
        {post.thumbnail
          ? <img src={post.thumbnail} alt={post.title} loading="lazy" className={s.thumbImg} />
          : <div className={s.thumbFallback}>⚡</div>
        }
        <div className={s.thumbOverlay} />
        <span className={s.tag}>{tag}</span>
      </div>
      <div className={s.body}>
        <p className={s.date}>{fmt(post.pubDate)}</p>
        <h3 className={s.title}>{post.title}</h3>
        <span className={s.readMore}>Read on Medium →</span>
      </div>
    </a>
  )
}

export default function Blog() {
  const [posts, setPosts] = useState(STATIC_POSTS)

  useEffect(() => {
    const PROXY = 'https://api.rss2json.com/v1/api.json?rss_url='
    const FEED  = encodeURIComponent('https://medium.com/feed/@bitcoinloverhq')
    fetch(`${PROXY}${FEED}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.items?.length > 0) {
          setPosts(
            data.items.slice(0, 4).map((it) => ({
              guid: it.guid,
              title: it.title,
              link: it.link,
              pubDate: it.pubDate,
              thumbnail: it.thumbnail || it.enclosure?.link || null,
              categories: it.categories ?? [],
            })),
          )
        }
      })
      .catch(() => {/* keep static */})
  }, [])

  return (
    <section id="blog" className={`section ${s.section}`}>
      <div className={s.blob} />

      <div className={s.head}>
        <p className="section-kicker">Bitcoin Education</p>
        <h2 className="section-title">
          From the <span className="grad-purple">Blog</span>
        </h2>
        <p className="section-sub" style={{ margin: '0 auto 52px' }}>
          Deep dives into Bitcoin concepts — written to complement the game.
        </p>
      </div>

      <div className={s.grid}>
        {posts.map((p, i) => <PostCard key={p.guid} post={p} index={i} />)}
      </div>
    </section>
  )
}
