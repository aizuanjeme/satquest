import s from './Community.module.css'

const ORGS = [
  {
    name: 'BTrust',
    initials: 'BT',
    url: 'https://btrust.tech',
    tag: 'Grants · Africa',
    desc: 'Funding African Bitcoin developers through grants, education, and mentorship. Building the next generation of builders on the continent.',
    col: '#f7c948',
  },
  {
    name: 'Dada Bitcoin',
    initials: 'DB',
    url: 'https://dadabitcoin.com',
    tag: 'Women · Africa',
    desc: "A community championing women's participation in Bitcoin across Africa — education, meetups, and financial sovereignty for every woman.",
    col: '#2ad8ff',
  },
  {
    name: 'Bitcoin Design',
    initials: 'BD',
    url: 'https://bitcoin.design',
    tag: 'Open Design',
    desc: 'An open-source community of designers making Bitcoin products more intuitive and accessible for everyone on the planet.',
    col: '#9945ff',
  },
  {
    name: 'Summer of Bitcoin',
    initials: 'SB',
    url: 'https://www.summerofbitcoin.org',
    tag: 'Students · Global',
    desc: 'A global summer internship programme placing university students into Bitcoin open-source projects to kickstart their careers.',
    col: '#2bd47a',
  },
  {
    name: 'OpenSats',
    initials: 'OS',
    url: 'https://opensats.org',
    tag: 'Grants · Global',
    desc: 'A non-profit funding Bitcoin and free open-source software maintainers through community donations and grants.',
    col: '#b07bff',
  },
  {
    name: 'Africa Bitcoin Conf',
    initials: 'AB',
    url: 'https://africabitcoinconference.org',
    tag: 'Events · Africa',
    desc: 'The premier Bitcoin-only conference in Africa, bringing together builders, educators, and advocates from across the continent every year.',
    col: '#2ad8ff',
  },
]

export default function Community() {
  return (
    <section id="community" className={`section ${s.section}`}>
      <div className={s.head}>
        <p className="section-kicker">Ecosystem</p>
        <h2 className="section-title">
          Built With the{' '}
          <span className="grad-purple">Bitcoin Community</span>
        </h2>
        <p className="section-sub" style={{ margin: '0 auto 56px' }}>
          SatQuest is part of a growing ecosystem of African and global Bitcoin education initiatives.
        </p>
      </div>

      <div className={s.grid}>
        {ORGS.map((org, i) => (
          <a key={i} href={org.url} target="_blank" rel="noopener" className={s.card}
             style={{ '--col': org.col }}>
            <div className={s.cardGlow} />
            <div className={s.cardTop}>
              <div className={s.badge} style={{ color: org.col, borderColor: `${org.col}44`, background: `${org.col}11` }}>
                {org.initials}
              </div>
              <span className={s.tag} style={{ color: org.col }}>{org.tag}</span>
            </div>
            <h3 className={s.name}>{org.name}</h3>
            <p className={s.desc}>{org.desc}</p>
            <span className={s.arrow} style={{ color: org.col }}>→</span>
          </a>
        ))}
      </div>
    </section>
  )
}
