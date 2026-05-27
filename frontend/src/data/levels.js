export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/*
  GAME TYPES
  ----------
  Each level has a `type` field:
   - 'match'    : tap a picture, tap its meaning (default — used by L1..L20 below)
   - 'wordhunt' : timed puzzle. Tap all the real Bitcoin words mixed with decoys.

  Word Hunt levels are inserted after every 3 match levels as a "review" stage.
  Find all the real Bitcoin words within the time limit to earn sats.
  Run out of time? No sats, but you still move on.
*/

/*
  AVATARS — image-based.
  Image files live in /src/avatars/ and are imported via Vite using new URL()
  so they are bundled and hashed correctly in production.

  We have 19 female + 19 male round avatars (38 total). They are interleaved
  female/male so the picker grid feels balanced. The id scheme is stable
  (`avF1`, `avM1`, `avF2`, …) so existing saved profiles keep their avatar
  even when the order changes.
*/
const avatarUrl = (gender, n) =>
  new URL(
    `../avatars/Size_XXL__2048px______Avatar_${gender}_${n}_____Round_no.webp`,
    import.meta.url,
  ).href

const AVATAR_COUNT = 19 // per gender

const buildAvatars = () => {
  const list = []
  for (let n = 1; n <= AVATAR_COUNT; n++) {
    list.push({
      id: `avF${n}`,
      img: avatarUrl('female', n),
      emoji: '👩🏾',
      name: 'Character',
    })
    list.push({
      id: `avM${n}`,
      img: avatarUrl('male', n),
      emoji: '🧑🏿',
      name: 'Character',
    })
  }
  return list
}

export const AVATARS = buildAvatars()

/*
  Back-compat: the old build shipped 7 avatars with ids `av1`..`av7`.
  Map those legacy ids onto the first 7 new avatars so anyone with a saved
  profile still resolves to a real character on next launch.
*/
const LEGACY_AVATAR_MAP = {
  av1: 'avF1',
  av2: 'avM1',
  av3: 'avF2',
  av4: 'avM2',
  av5: 'avF3',
  av6: 'avM3',
  av7: 'avF4',
}

export const resolveAvatarId = (id) => LEGACY_AVATAR_MAP[id] || id

/*
  Stage-by-stage difficulty curve:
   - L1-3   : Baby steps. 4 pairs. 1-3 word labels. No jargon.
   - L4-6   : Easy. 5 pairs. Simple sentences.
   - L7-10  : Real words now. 6 pairs. Layman meanings.
   - L11-14 : Deeper. 7 pairs.
   - L15-18 : Pro. 8 pairs.
   - L19-20 : Boss rounds.
*/

export const LEVELS = [

  // ============ L1 — Baby steps ============
  {
    id: 1, badge: '1', chapter: 'Step 1',
    title: 'What is Bitcoin?',
    story: 'Bitcoin is money. But not the kind you keep in a bank. Let us start small.',
    hint: 'Match the picture to the meaning',
    hintColor: '#F7931A', sats: 1,
    pairs: [
      { id: 'money',  imgEmoji: '💰', imgLabel: 'Money',     wordEmoji: '🪙', wordLabel: 'Bitcoin is money' },
      { id: 'phone',  imgEmoji: '📱', imgLabel: 'Phone',     wordEmoji: '💸', wordLabel: 'You keep it on your phone' },
      { id: 'world',  imgEmoji: '🌍', imgLabel: 'The world', wordEmoji: '✈️', wordLabel: 'Works everywhere' },
      { id: 'me',     imgEmoji: '🙋', imgLabel: 'You',       wordEmoji: '👑', wordLabel: 'Nobody controls it but you' },
    ],
    reveals: [
      { naija: '💰', btc: '🪙', match: 'Bitcoin is money',         def: 'Just like naira and dollar, Bitcoin is money you can spend, save and send.', funny: '😂 "Money is money. Bitcoin is the digital kind!"' },
      { naija: '📱', btc: '💸', match: 'Lives on your phone',      def: 'You do not need a bank. A small app on your phone is enough.',               funny: '😂 "Your phone is now a bank. Sweet!"' },
      { naija: '🌍', btc: '✈️', match: 'Works everywhere',         def: 'Send Bitcoin from Lagos to London in seconds. Same network for the whole world.', funny: '😂 "No visa needed for Bitcoin!"' },
      { naija: '🙋', btc: '👑', match: 'You are in charge',        def: 'No bank manager. No CBN. Just you and your phone.',                            funny: '😂 "You be the boss!"' },
    ],
  },

  // ============ L2 — Bitcoin vs Naira ============
  {
    id: 2, badge: '2', chapter: 'Step 2',
    title: 'Bitcoin vs Naira',
    story: 'Naira is money you can touch. Bitcoin is money you cannot touch. But both can buy things.',
    hint: 'Match the kind of money',
    hintColor: '#FF4444', sats: 1,
    pairs: [
      { id: 'naira',   imgEmoji: '💵', imgLabel: 'Paper',     wordEmoji: '🇳🇬', wordLabel: 'Naira, money you touch' },
      { id: 'bitcoin', imgEmoji: '📲', imgLabel: 'Digital',   wordEmoji: '🟠', wordLabel: 'Bitcoin, money on a screen' },
      { id: 'bank',    imgEmoji: '🏦', imgLabel: 'Bank',      wordEmoji: '🔒', wordLabel: 'Naira lives in the bank' },
      { id: 'wallet',  imgEmoji: '👜', imgLabel: 'Bag',       wordEmoji: '📱', wordLabel: 'Bitcoin lives in your app' },
    ],
    reveals: [
      { naija: '💵', btc: '🇳🇬', match: 'Naira = paper money',     def: 'You can hold it, fold it, lose it. The government makes it.', funny: '😂 "Paper money. Easy to lose, easy to burn!"' },
      { naija: '📲', btc: '🟠', match: 'Bitcoin = digital money',   def: 'You cannot touch it. It is just numbers on the internet. But it works.', funny: '😂 "Numbers on the internet but they buy real jollof!"' },
      { naija: '🏦', btc: '🔒', match: 'Naira sits in the bank',    def: 'Most of your naira is in a bank. The bank holds it for you.', funny: '😂 "Bank holds your money. And sometimes blocks it. Wahala!"' },
      { naija: '👜', btc: '📱', match: 'Bitcoin sits on your phone', def: 'A small app called a wallet keeps your Bitcoin. Only you can open it.', funny: '😂 "Wallet on your phone. Bank in your pocket!"' },
    ],
  },

  // ============ L3 — Smallest piece ============
  {
    id: 3, badge: '3', chapter: 'Step 3',
    title: 'Small small money',
    story: '1 naira is made of 100 kobo. In the same way, 1 Bitcoin is made of millions of tiny pieces called sats. You do not have to buy a full Bitcoin, you can just buy sats.',
    hint: 'Match the small things',
    hintColor: '#00E5A0', sats: 1,
    pairs: [
      { id: 'kobo', imgEmoji: '🪙', imgLabel: 'Kobo',      wordEmoji: '💴', wordLabel: '100 kobo make 1 naira' },
      { id: 'sat',  imgEmoji: '🔬', imgLabel: 'Sats',      wordEmoji: '🟠', wordLabel: 'Sats are the kobo of Bitcoin' },
      { id: 'buy',  imgEmoji: '🛒', imgLabel: '500 naira', wordEmoji: '✅', wordLabel: 'Even 500 naira can buy sats' },
      { id: 'add',  imgEmoji: '💧', imgLabel: 'Drop',      wordEmoji: '🌊', wordLabel: 'Small sats add up to plenty' },
    ],
    reveals: [
      { naija: '🪙', btc: '💴', match: '100 kobo = 1 naira',          def: 'Kobo is the small piece of naira. 100 kobo together make 1 naira. Simple.', funny: '😂 "Remember kobo? Sats is the same idea for Bitcoin!"' },
      { naija: '🔬', btc: '🟠', match: 'Sats = the kobo of Bitcoin',  def: '1 Bitcoin is made of 100,000,000 sats. So instead of buying a whole Bitcoin, you can just buy sats.', funny: '😂 "Cannot afford 1 Bitcoin? No wahala. Buy sats!"' },
      { naija: '🛒', btc: '✅', match: '500 naira can buy sats',      def: 'You do not need millions to start. Even 500 naira buys real Bitcoin in the form of sats.', funny: '😂 "Start with 500 naira. Welcome to Bitcoin!"' },
      { naija: '💧', btc: '🌊', match: 'Small sats add up',           def: 'Buy a few sats every week. After a year you will be surprised how much you have stacked.', funny: '😂 "Drop by drop, the bucket goes full!"' },
    ],
  },

  // ============ L4 — Why Bitcoin? ============
  {
    id: 4, badge: '4', chapter: 'Step 4',
    title: 'Why Bitcoin matters',
    story: 'Mama Titi saved 100,000 naira last year. This year it buys less. Nobody stole. The money just got weaker. Bitcoin is different.',
    hint: 'Match the problem to the picture',
    hintColor: '#FF4444', sats: 1,
    pairs: [
      { id: 'weak',   imgEmoji: '📉', imgLabel: 'Going down',    wordEmoji: '💸', wordLabel: 'Naira gets weaker every year' },
      { id: 'print',  imgEmoji: '🖨️', imgLabel: 'Printer',       wordEmoji: '😤', wordLabel: 'Government prints more naira' },
      { id: 'cap',    imgEmoji: '🧱', imgLabel: 'Wall',          wordEmoji: '🔒', wordLabel: 'Bitcoin has a fixed amount' },
      { id: 'rare',   imgEmoji: '💎', imgLabel: 'Diamond',       wordEmoji: '⬆️', wordLabel: 'Rare things become more valuable' },
      { id: 'safe',   imgEmoji: '🛡️', imgLabel: 'Shield',        wordEmoji: '🟠', wordLabel: 'Bitcoin protects your money' },
    ],
    reveals: [
      { naija: '📉', btc: '💸', match: 'Naira loses value',          def: 'Every year your naira buys less bread, rice and fuel. This is called inflation.', funny: '😂 "Last year 1k filled your tank. This year? Hmm!"' },
      { naija: '🖨️', btc: '😤', match: 'Too much money printing',   def: 'When CBN prints more naira, each note becomes worth less. Simple maths.', funny: '😂 "Print more, worth less. School of Naira economics!"' },
      { naija: '🧱', btc: '🔒', match: 'Only 21 million Bitcoin',     def: 'There will never be more than 21 million Bitcoin. The number is locked in code forever.', funny: '😂 "Nobody can print more Bitcoin. The wall no fit move!"' },
      { naija: '💎', btc: '⬆️', match: 'Rare = valuable',             def: 'Diamonds, land in Lagos, gold. Things in short supply get more valuable. Bitcoin is the same.', funny: '😂 "Few things, many people wanting. Price go up!"' },
      { naija: '🛡️', btc: '🟠', match: 'Bitcoin is your shield',     def: 'If you save in Bitcoin instead of naira, inflation cannot eat your savings.', funny: '😂 "Bitcoin shield. Inflation cannot reach you!"' },
    ],
  },

  // ============ L5 — Your wallet ============
  {
    id: 5, badge: '5', chapter: 'Step 5',
    title: 'Your Bitcoin wallet',
    story: 'A wallet is an app on your phone. It is where your Bitcoin lives. It is free and takes 2 minutes to set up.',
    hint: 'Match wallet basics',
    hintColor: '#9945FF', sats: 1,
    pairs: [
      { id: 'app',     imgEmoji: '📱', imgLabel: 'App',       wordEmoji: '👜', wordLabel: 'Your wallet is just an app' },
      { id: 'free',    imgEmoji: '🆓', imgLabel: 'Free',      wordEmoji: '✅', wordLabel: 'It costs nothing to download' },
      { id: 'address', imgEmoji: '🏠', imgLabel: 'Home',      wordEmoji: '📬', wordLabel: 'Your address is where people send Bitcoin' },
      { id: 'send',    imgEmoji: '➡️', imgLabel: 'Arrow',     wordEmoji: '⚡', wordLabel: 'Send Bitcoin in seconds' },
      { id: 'receive', imgEmoji: '⬇️', imgLabel: 'Down',      wordEmoji: '💰', wordLabel: 'Receive Bitcoin from anyone' },
    ],
    reveals: [
      { naija: '📱', btc: '👜', match: 'Wallet = an app',            def: 'Like WhatsApp but for money. Download it, open it, and your wallet is ready.', funny: '😂 "If you can use WhatsApp you can use a Bitcoin wallet!"' },
      { naija: '🆓', btc: '✅', match: 'Free to download',           def: 'Wallets like Phoenix and Blue Wallet cost nothing. No subscription. No fees to open.', funny: '😂 "Free money app. No catch!"' },
      { naija: '🏠', btc: '📬', match: 'Address = your house number', def: 'A Bitcoin address is a code you share. People use it to send you Bitcoin.', funny: '😂 "Share your address, money flies in!"' },
      { naija: '➡️', btc: '⚡', match: 'Sending is fast',             def: 'Bitcoin can move in seconds. No bank approval. No waiting for working hours.', funny: '😂 "Send money at 3am. Bitcoin no sleep!"' },
      { naija: '⬇️', btc: '💰', match: 'Anyone can send you Bitcoin', def: 'Friends, family, customers. Anyone with internet can send Bitcoin to your address.', funny: '😂 "Open for business 24/7!"' },
    ],
  },

  // ============ L6 — Who owns it ============
  {
    id: 6, badge: '6', chapter: 'Step 6',
    title: 'Who owns your money?',
    story: 'When your naira is in the bank, the bank owns it. They can freeze your account anytime. With Bitcoin in your wallet, only you control it.',
    hint: 'Who is in charge of what?',
    hintColor: '#FF4444', sats: 1,
    pairs: [
      { id: 'bankown',  imgEmoji: '🏦', imgLabel: 'Bank',       wordEmoji: '🔐', wordLabel: 'Bank holds your naira' },
      { id: 'youown',   imgEmoji: '🙋', imgLabel: 'You',         wordEmoji: '🔑', wordLabel: 'You hold your Bitcoin' },
      { id: 'freeze',   imgEmoji: '🧊', imgLabel: 'Freeze',      wordEmoji: '🚫', wordLabel: 'Bank can freeze your account' },
      { id: 'free',     imgEmoji: '🦅', imgLabel: 'Free bird',   wordEmoji: '✊', wordLabel: 'Nobody can freeze your Bitcoin' },
      { id: 'permit',   imgEmoji: '📋', imgLabel: 'Form',        wordEmoji: '😤', wordLabel: 'Bank needs permission for big transfers' },
    ],
    reveals: [
      { naija: '🏦', btc: '🔐', match: 'Bank owns your naira',         def: 'When you "save" in the bank, you are lending them your money. They use it. You ask permission to take it back.', funny: '😂 "Your money. Their rules. Bitcoin different!"' },
      { naija: '🙋', btc: '🔑', match: 'You own your Bitcoin',         def: 'Your wallet has a secret key. Whoever has the key owns the Bitcoin. Keep it safe.', funny: '😂 "Your key, your coin. Lose key, lose coin!"' },
      { naija: '🧊', btc: '🚫', match: 'Banks can freeze accounts',    def: 'CBN or the bank itself can lock your account. It has happened to many Nigerians.', funny: '😂 "One day you wake up, account block. Nigeria things!"' },
      { naija: '🦅', btc: '✊', match: 'Bitcoin cannot be frozen',     def: 'No company, no government can stop you from spending your own Bitcoin. It is yours.', funny: '😂 "EFCC come knock Bitcoin door. Bitcoin no get door!"' },
      { naija: '📋', btc: '😤', match: 'Big bank transfers need approval', def: 'Send 5 million naira? Submit forms, wait for clearance, explain why. With Bitcoin you just press send.', funny: '😂 "Bitcoin: press send. Done!"' },
    ],
  },

  // ============ L7 — Real words ============
  {
    id: 7, badge: '7', chapter: 'Step 7',
    title: 'Big words made small',
    story: 'Bitcoin people use big words. Do not panic. Each one has a tiny everyday meaning. Learn them once and you will sound like a pro.',
    hint: 'Match the big word to its simple meaning',
    hintColor: '#00E5A0', sats: 2,
    pairs: [
      { id: 'wallet',     imgEmoji: '👜', imgLabel: 'Bag',           wordEmoji: '📱', wordLabel: 'Wallet = the app' },
      { id: 'address',    imgEmoji: '🏠', imgLabel: 'House',         wordEmoji: '📬', wordLabel: 'Address = where to send' },
      { id: 'key',        imgEmoji: '🔑', imgLabel: 'Key',           wordEmoji: '🤫', wordLabel: 'Private key = your secret code' },
      { id: 'sats',       imgEmoji: '🔬', imgLabel: 'Tiny',          wordEmoji: '🪙', wordLabel: 'Sats = small Bitcoin' },
      { id: 'seed',       imgEmoji: '🌱', imgLabel: 'Seeds',         wordEmoji: '📝', wordLabel: 'Seed phrase = 12 backup words' },
      { id: 'block',      imgEmoji: '🧱', imgLabel: 'Brick',         wordEmoji: '📒', wordLabel: 'Block = page in a record book' },
    ],
    reveals: [
      { naija: '👜', btc: '📱', match: 'Wallet is just an app',        def: 'A wallet holds the secret key that proves the Bitcoin is yours.', funny: '😂 "Wallet. Sounds like leather. Just an app!"' },
      { naija: '🏠', btc: '📬', match: 'Address tells people where to send', def: 'Like a phone number for money. Share it without fear.', funny: '😂 "Your address is safe to share. Your key is NOT!"' },
      { naija: '🔑', btc: '🤫', match: 'Private key = the real secret', def: 'The private key is the master code. Never share it. Never type it on any website.', funny: '😂 "Private key like your ATM pin times 1000!"' },
      { naija: '🔬', btc: '🪙', match: 'Sats are tiny Bitcoin pieces', def: '100 million sats = 1 Bitcoin. You will own sats, not whole Bitcoin. That is normal.', funny: '😂 "Stack sats. Big things from small things!"' },
      { naija: '🌱', btc: '📝', match: 'Seed phrase saves your wallet', def: '12 random words. Write them on paper. With these you can restore your wallet on any phone.', funny: '😂 "12 words = the most important page in your life!"' },
      { naija: '🧱', btc: '📒', match: 'A block is a page of records', def: 'Bitcoin keeps a giant record book. Every page is called a block. A new page is added every 10 minutes.', funny: '😂 "Bitcoin keeps perfect records. No correction fluid!"' },
    ],
  },

  // ============ L8 — Seed phrase ============
  {
    id: 8, badge: '8', chapter: 'Step 8',
    title: '12 magic words',
    story: 'Your wallet gives you 12 words when you first open it. These words are the most important thing in Bitcoin. Lose them and you lose everything.',
    hint: 'Match seed phrase rules',
    hintColor: '#FF4444', sats: 2,
    pairs: [
      { id: 'paper',  imgEmoji: '📝', imgLabel: 'Paper',         wordEmoji: '✏️', wordLabel: 'Write the 12 words on paper' },
      { id: 'hide',   imgEmoji: '🤫', imgLabel: 'Shh',           wordEmoji: '🚫', wordLabel: 'Never share them with anyone' },
      { id: 'photo',  imgEmoji: '📸', imgLabel: 'Photo',         wordEmoji: '❌', wordLabel: 'Do not take a picture of them' },
      { id: 'whatsapp', imgEmoji: '💬', imgLabel: 'Chat',        wordEmoji: '❌', wordLabel: 'Do not send them on WhatsApp' },
      { id: 'restore', imgEmoji: '🔄', imgLabel: 'Reset',        wordEmoji: '✅', wordLabel: 'They bring your wallet back if phone is lost' },
      { id: 'safe',    imgEmoji: '🗝️', imgLabel: 'Safe place',  wordEmoji: '🏠', wordLabel: 'Hide the paper in a safe place at home' },
    ],
    reveals: [
      { naija: '📝', btc: '✏️', match: 'Write them on paper',         def: 'Plain pen and paper. Old school but it works. No battery to die.', funny: '😂 "Pen and paper. Older than your grandfather. Still the best!"' },
      { naija: '🤫', btc: '🚫', match: 'Never tell anyone',           def: 'Not friends. Not family. Not customer support. Nobody legitimate will ever ask.', funny: '😂 "Anyone asking for your 12 words is a thief. Full stop!"' },
      { naija: '📸', btc: '❌', match: 'No photos!',                  def: 'Photos go to the cloud. The cloud can be hacked. Your sats vanish.', funny: '😂 "Phone backup = thief backup!"' },
      { naija: '💬', btc: '❌', match: 'No WhatsApp!',                 def: 'WhatsApp messages leave traces. Never type those 12 words in any chat.', funny: '😂 "Send your 12 words on WhatsApp = good night Bitcoin!"' },
      { naija: '🔄', btc: '✅', match: 'Words restore your wallet',   def: 'Phone broken? Lost? No problem. Type the 12 words into any wallet app and your Bitcoin is back.', funny: '😂 "12 words = your spare key for life!"' },
      { naija: '🗝️', btc: '🏠', match: 'Hide the paper somewhere safe', def: 'A locked drawer. A safe. Even better, two copies in two different places.', funny: '😂 "Treat it like your passport. Better!"' },
    ],
  },

  // ============ L9 — Sending money ============
  {
    id: 9, badge: '9', chapter: 'Step 9',
    title: 'Sending money the smart way',
    story: 'Emeka wants to send 5000 naira to his sister in Aba. Bank takes hours. Bitcoin takes seconds. Same destination. Big difference.',
    hint: 'Match each method to how it feels',
    hintColor: '#9945FF', sats: 2,
    pairs: [
      { id: 'bank',     imgEmoji: '🐢', imgLabel: 'Slow',         wordEmoji: '🏦', wordLabel: 'Bank transfer can take hours' },
      { id: 'fee',      imgEmoji: '💸', imgLabel: 'Fees',         wordEmoji: '😤', wordLabel: 'Banks charge plenty for transfers' },
      { id: 'lightning', imgEmoji: '⚡', imgLabel: 'Fast',         wordEmoji: '🏃', wordLabel: 'Lightning sends Bitcoin in seconds' },
      { id: 'cheap',    imgEmoji: '🪙', imgLabel: 'Cheap',        wordEmoji: '✅', wordLabel: 'Lightning fees are almost zero' },
      { id: 'global',   imgEmoji: '🌍', imgLabel: 'Anywhere',     wordEmoji: '✈️', wordLabel: 'Bitcoin works in any country' },
      { id: 'always',   imgEmoji: '🕐', imgLabel: 'Anytime',      wordEmoji: '🌙', wordLabel: 'Send at 3am, weekend, holiday' },
    ],
    reveals: [
      { naija: '🐢', btc: '🏦', match: 'Banks are slow',              def: 'Especially at month-end. Especially internationally. Hours or days.', funny: '😂 "Bank transfer: are you there? Pending. Still pending!"' },
      { naija: '💸', btc: '😤', match: 'Banks charge fees',           def: 'Transfer fees. SMS fees. Maintenance fees. They add up to thousands.', funny: '😂 "Bank fees: small small but the total dey shock you!"' },
      { naija: '⚡', btc: '🏃', match: 'Lightning is instant',        def: 'Lightning is a faster way to send Bitcoin. Money arrives before your tea cools.', funny: '😂 "Lightning fast. Like the name says!"' },
      { naija: '🪙', btc: '✅', match: 'Lightning is almost free',    def: 'Most Lightning payments cost less than 1 naira in fees. Even huge transfers.', funny: '😂 "1 naira to send millions. Banks dey vex!"' },
      { naija: '🌍', btc: '✈️', match: 'Works in every country',      def: 'Same Bitcoin. Lagos to Tokyo to London. No conversion, no broker.', funny: '😂 "One money for the whole world. No visa needed!"' },
      { naija: '🕐', btc: '🌙', match: 'Open 24/7',                   def: 'Bitcoin never closes. No bank holidays. No working hours. Always on.', funny: '😂 "Bitcoin no dey rest. We dey gbedu!"' },
    ],
  },

  // ============ L10 — Where Bitcoin comes from ============
  {
    id: 10, badge: '10', chapter: 'Step 10',
    title: 'Where Bitcoin comes from',
    story: 'Nobody prints Bitcoin. New Bitcoin is made by computers solving puzzles. The winners get paid in fresh Bitcoin. This is called mining.',
    hint: 'Match how mining works',
    hintColor: '#F7931A', sats: 2,
    pairs: [
      { id: 'mine',     imgEmoji: '⛏️', imgLabel: 'Pickaxe',       wordEmoji: '🖥️', wordLabel: 'Mining = computers doing work' },
      { id: 'puzzle',   imgEmoji: '🧩', imgLabel: 'Puzzle',        wordEmoji: '❓', wordLabel: 'They race to solve a hard puzzle' },
      { id: 'reward',   imgEmoji: '🏆', imgLabel: 'Trophy',        wordEmoji: '🪙', wordLabel: 'Winner gets new Bitcoin' },
      { id: 'power',    imgEmoji: '⚡', imgLabel: 'Light',         wordEmoji: '🔋', wordLabel: 'Mining uses a lot of electricity' },
      { id: 'time',     imgEmoji: '⏰', imgLabel: '10 mins',       wordEmoji: '🧱', wordLabel: 'A new block is found every 10 minutes' },
      { id: 'cap',      imgEmoji: '🛑', imgLabel: 'Stop',          wordEmoji: '🔢', wordLabel: 'Mining stops when 21 million is reached' },
    ],
    reveals: [
      { naija: '⛏️', btc: '🖥️', match: 'Mining is computer work',  def: 'Special computers run 24/7 trying to win a maths game. That is mining.', funny: '😂 "No pickaxe. Just computers doing maths!"' },
      { naija: '🧩', btc: '❓', match: 'They solve hard puzzles',     def: 'The puzzles are so hard only powerful machines can play. This protects Bitcoin.', funny: '😂 "If puzzle was easy, anyone could cheat. So it is HARD!"' },
      { naija: '🏆', btc: '🪙', match: 'Winner takes new Bitcoin',    def: 'Every 10 minutes one miner wins and gets brand new Bitcoin as a prize.', funny: '😂 "Miner win, plenty Bitcoin enter their wallet!"' },
      { naija: '⚡', btc: '🔋', match: 'It uses a lot of power',       def: 'Mining needs serious electricity. That is why miners look for cheap power like hydro or solar.', funny: '😂 "Generator full ground. PHCN dey shake!"' },
      { naija: '⏰', btc: '🧱', match: 'A new page every 10 minutes',  def: 'Bitcoin produces one new block of records every 10 minutes. Like clockwork.', funny: '😂 "Tick tock. 10 minutes. New block!"' },
      { naija: '🛑', btc: '🔢', match: 'Stops at 21 million',          def: 'Mining will stop one day, around the year 2140. After that, no more new Bitcoin ever.', funny: '😂 "21 million Bitcoin. Then game over for printing!"' },
    ],
  },

  // ============ L11 — Network ============
  {
    id: 11, badge: '11', chapter: 'Step 11',
    title: 'How Bitcoin stays alive',
    story: 'Amina asked: if no company runs Bitcoin, why does it not die? Because thousands of computers all over the world run it together. No single point of failure.',
    hint: 'Match the parts of the network',
    hintColor: '#00E5A0', sats: 2,
    pairs: [
      { id: 'node',     imgEmoji: '💻', imgLabel: 'Computer',       wordEmoji: '🌐', wordLabel: 'A node is a computer that runs Bitcoin' },
      { id: 'many',     imgEmoji: '🧑‍🤝‍🧑', imgLabel: 'Many people', wordEmoji: '🌍', wordLabel: 'Thousands of nodes worldwide' },
      { id: 'agree',    imgEmoji: '🤝', imgLabel: 'Agree',          wordEmoji: '✅', wordLabel: 'They all agree on the same rules' },
      { id: 'p2p',      imgEmoji: '🙋‍♂️🙋‍♀️', imgLabel: 'You & me', wordEmoji: '🔄', wordLabel: 'Send straight from person to person' },
      { id: 'open',     imgEmoji: '📖', imgLabel: 'Open book',      wordEmoji: '🔓', wordLabel: 'Bitcoin code is free for all to read' },
      { id: 'unstoppable', imgEmoji: '🛡️', imgLabel: 'Shield',     wordEmoji: '♾️', wordLabel: 'No one country can shut it down' },
      { id: 'forever', imgEmoji: '🪨', imgLabel: 'Rock',            wordEmoji: '⛓️', wordLabel: 'Once recorded, transactions cannot be changed' },
    ],
    reveals: [
      { naija: '💻', btc: '🌐', match: 'Node = a Bitcoin computer',   def: 'Anyone can run a node. It keeps a copy of every Bitcoin transaction ever made.', funny: '😂 "Your old laptop can become part of Bitcoin!"' },
      { naija: '🧑‍🤝‍🧑', btc: '🌍', match: 'Thousands of nodes',      def: 'Bitcoin runs on more than 15,000 nodes across every continent. Always online.', funny: '😂 "Plenty machines. Always awake. Always watching!"' },
      { naija: '🤝', btc: '✅', match: 'Nodes agree on rules',        def: 'Every node checks every transaction against the same rules. Cheaters get rejected instantly.', funny: '😂 "Try to cheat. 15,000 computers say NO!"' },
      { naija: '🙋‍♂️🙋‍♀️', btc: '🔄', match: 'Person to person',     def: 'You send Bitcoin straight to another person. No bank standing in the middle.', funny: '😂 "You and them. That is all!"' },
      { naija: '📖', btc: '🔓', match: 'Open source code',            def: 'Anyone can read the Bitcoin code on the internet. Experts have checked it for 15+ years.', funny: '😂 "Bank code: secret. Bitcoin code: open for all!"' },
      { naija: '🛡️', btc: '♾️', match: 'Cannot be shut down',          def: 'Some countries have tried to ban Bitcoin. It keeps working. Just download the app from a different place.', funny: '😂 "Ban Bitcoin. Bitcoin laugh!"' },
      { naija: '🪨', btc: '⛓️', match: 'Records last forever',         def: 'Once a transaction is in the record book, it stays there. Nobody can erase it. Not banks, not governments.', funny: '😂 "Bitcoin never forget. Memory of an elephant!"' },
    ],
  },

  // ============ L12 — Safety ============
  {
    id: 12, badge: '12', chapter: 'Step 12',
    title: 'How not to lose your Bitcoin',
    story: 'Bitcoin gives you full power over your money. That power comes with a price. You are now your own bank. So you are also your own security guard.',
    hint: 'Match the danger to its warning',
    hintColor: '#FF4444', sats: 2,
    pairs: [
      { id: 'fake',     imgEmoji: '🎭', imgLabel: 'Mask',          wordEmoji: '🌐', wordLabel: 'Fake websites that look real' },
      { id: 'check',    imgEmoji: '🔍', imgLabel: 'Search',        wordEmoji: '🔗', wordLabel: 'Always check the website link' },
      { id: 'free',     imgEmoji: '🎁', imgLabel: 'Gift',          wordEmoji: '🚩', wordLabel: 'Free Bitcoin offers are scams' },
      { id: 'elon',     imgEmoji: '🤡', imgLabel: 'Clown',         wordEmoji: '❌', wordLabel: 'Celebrity giveaway? Always fake' },
      { id: 'urgency',  imgEmoji: '⏰', imgLabel: 'Quick!',         wordEmoji: '🛑', wordLabel: 'Send now, scarce, urgent = scam' },
      { id: 'backup',   imgEmoji: '📝', imgLabel: 'Notes',         wordEmoji: '☂️', wordLabel: 'Backup your 12 words before anything' },
      { id: 'small',    imgEmoji: '👶', imgLabel: 'Small',         wordEmoji: '💼', wordLabel: 'Start with small amounts to practise' },
    ],
    reveals: [
      { naija: '🎭', btc: '🌐', match: 'Fake websites trap people',    def: 'Scammers copy real wallet sites letter by letter. You type your secret. They take everything.', funny: '😂 "Binance.com vs Bln-ance.com. One letter. Your money gone!"' },
      { naija: '🔍', btc: '🔗', match: 'Check links before clicking',  def: 'Bookmark official sites. Type addresses yourself. Never click random links in DM.', funny: '😂 "Trust nothing. Check everything!"' },
      { naija: '🎁', btc: '🚩', match: 'Free Bitcoin = SCAM',          def: 'Nobody is giving away free Bitcoin. If someone says "send 1, get 2", it is a robbery dressed up nicely.', funny: '😂 "Free Bitcoin? Free wahala!"' },
      { naija: '🤡', btc: '❌', match: 'Celebrity giveaways are fake', def: 'Elon, Davido, Wizkid are not sending you Bitcoin. The real ones do not know you exist.', funny: '😂 "Wizkid no get your number. Move on!"' },
      { naija: '⏰', btc: '🛑', match: 'Pressure to act fast = scam',  def: '"Limited spots, hurry up!" That is how scammers stop you from thinking. Real Bitcoin is patient.', funny: '😂 "Hurry hurry no get blessing. Same with Bitcoin!"' },
      { naija: '📝', btc: '☂️', match: 'Backup before anything',       def: 'Before you put real money in any wallet, write down your 12 words. No backup = no Bitcoin.', funny: '😂 "Umbrella before the rain. Always!"' },
      { naija: '👶', btc: '💼', match: 'Practise with small amounts',  def: 'Send 100 naira worth of sats first. Make mistakes cheaply. Then go bigger when you are confident.', funny: '😂 "Practice with kobo. Then play with the big money!"' },
    ],
  },

  // ============ L13 — Buying Bitcoin in Nigeria ============
  {
    id: 13, badge: '13', chapter: 'Step 13',
    title: 'How to buy Bitcoin in Nigeria',
    story: 'You cannot buy Bitcoin at a regular bank in Nigeria. But there are easy ways. Most Nigerians use P2P apps and exchanges.',
    hint: 'Match the buying method',
    hintColor: '#9945FF', sats: 2,
    pairs: [
      { id: 'p2p',      imgEmoji: '🤝', imgLabel: 'Handshake',     wordEmoji: '📲', wordLabel: 'P2P, buy from another person directly' },
      { id: 'exchange', imgEmoji: '🏢', imgLabel: 'Office',        wordEmoji: '💱', wordLabel: 'Exchange, online shop for Bitcoin' },
      { id: 'opay',     imgEmoji: '🟢', imgLabel: 'OPay',          wordEmoji: '💸', wordLabel: 'Pay with naira via OPay or bank' },
      { id: 'kyc',      imgEmoji: '📋', imgLabel: 'ID card',       wordEmoji: '🪪', wordLabel: 'Big exchanges ask for your ID' },
      { id: 'transfer', imgEmoji: '➡️', imgLabel: 'Move',          wordEmoji: '👜', wordLabel: 'Move Bitcoin from exchange to your wallet' },
      { id: 'risk',     imgEmoji: '⚠️', imgLabel: 'Warning',       wordEmoji: '🔓', wordLabel: 'Bitcoin on exchange = not really yours' },
      { id: 'dca',      imgEmoji: '📆', imgLabel: 'Calendar',      wordEmoji: '📈', wordLabel: 'Buy small amounts every week' },
    ],
    reveals: [
      { naija: '🤝', btc: '📲', match: 'P2P = person to person',       def: 'Apps like Binance P2P match you with a seller. You pay them naira, they send you Bitcoin. Simple.', funny: '😂 "Find a seller. Send naira. Get Bitcoin. Done!"' },
      { naija: '🏢', btc: '💱', match: 'Exchange = an online shop',     def: 'Exchanges like Quidax let you buy Bitcoin directly with naira. Like Jumia but for crypto.', funny: '😂 "Jumia but the only product is money!"' },
      { naija: '🟢', btc: '💸', match: 'Pay with OPay or bank',         def: 'Most P2P sellers accept OPay, PalmPay, Moniepoint, or bank transfer. The naira goes to them, the Bitcoin comes to you.', funny: '😂 "OPay in, Bitcoin out. Easy!"' },
      { naija: '📋', btc: '🪪', match: 'Big platforms ask for ID',      def: 'Binance, Quidax and friends usually want your ID. This is called KYC.', funny: '😂 "Selfie + NIN. They know your face by heart!"' },
      { naija: '➡️', btc: '👜', match: 'Move it to your own wallet',    def: 'After buying, do not leave your Bitcoin on the exchange. Send it to your personal wallet where only you have the key.', funny: '😂 "Bitcoin in exchange? Not your money yet!"' },
      { naija: '⚠️', btc: '🔓', match: 'Exchange Bitcoin can vanish',   def: 'Exchanges have been hacked. Some have collapsed (FTX). If your sats sit there, you can lose them.', funny: '😂 "Not your keys, not your coins. Golden rule!"' },
      { naija: '📆', btc: '📈', match: 'Buy small, often',              def: 'Do not put your whole salary in at once. Buy a small amount every week. Over time you average the price.', funny: '😂 "Steady wins. Like ajo for Bitcoin!"' },
    ],
  },

  // ============ L14 — Cold storage ============
  {
    id: 14, badge: '14', chapter: 'Step 14',
    title: 'Keeping big amounts safe',
    story: 'Your phone wallet is great for daily use. But if you have a lot of Bitcoin, you need a stronger safe. This is called cold storage.',
    hint: 'Match the safety idea',
    hintColor: '#00E5A0', sats: 3,
    pairs: [
      { id: 'hot',      imgEmoji: '🔥', imgLabel: 'Hot',           wordEmoji: '📱', wordLabel: 'Hot wallet = phone, easy but online' },
      { id: 'cold',     imgEmoji: '🧊', imgLabel: 'Cold',          wordEmoji: '🔌', wordLabel: 'Cold wallet = stays offline always' },
      { id: 'hardware', imgEmoji: '🔐', imgLabel: 'Vault',         wordEmoji: '💾', wordLabel: 'Hardware wallet, a small physical device' },
      { id: 'pocket',   imgEmoji: '🪙', imgLabel: 'Small',         wordEmoji: '📱', wordLabel: 'Hot wallet for pocket money sats' },
      { id: 'savings',  imgEmoji: '💼', imgLabel: 'Big',           wordEmoji: '🔐', wordLabel: 'Cold wallet for savings' },
      { id: 'twokeys',  imgEmoji: '✊', imgLabel: 'Two hands',      wordEmoji: '✍️', wordLabel: 'Multisig: needs 2+ keys to send' },
      { id: 'spread',   imgEmoji: '🗺️', imgLabel: 'Spread',        wordEmoji: '🏠', wordLabel: 'Keep backups in different places' },
      { id: 'test',     imgEmoji: '🧪', imgLabel: 'Test',          wordEmoji: '✅', wordLabel: 'Test restoring before storing big amounts' },
    ],
    reveals: [
      { naija: '🔥', btc: '📱', match: 'Hot wallet is on the internet', def: 'Easy to use but online. A hacker on your phone could reach it.', funny: '😂 "Hot wallet hot like pepper. Use with care!"' },
      { naija: '🧊', btc: '🔌', match: 'Cold wallet stays offline',    def: 'A cold wallet is not connected to the internet. Hackers cannot reach what they cannot touch.', funny: '😂 "If thief no fit reach am, thief no fit chop am!"' },
      { naija: '🔐', btc: '💾', match: 'Hardware wallet = small device', def: 'A tiny gadget that holds your keys offline. Costs around 60-100 USD. Worth it for big bags.', funny: '😂 "Buy small device. Save big money. Smart!"' },
      { naija: '🪙', btc: '📱', match: 'Phone for spending money',     def: 'Put only what you would carry as cash on your phone wallet. The rest goes cold.', funny: '😂 "Pocket money for daily suya!"' },
      { naija: '💼', btc: '🔐', match: 'Cold storage for savings',     def: 'Your long-term Bitcoin should live offline. Like keeping land deeds in a safe.', funny: '😂 "Big money in vault. Pocket change in pocket. Simple!"' },
      { naija: '✊', btc: '✍️', match: 'Multisig needs many approvals', def: 'Like a joint account that needs 2 signatures. Even if a thief gets one key, they still cannot spend.', funny: '😂 "Two locks, two keys. Double safe!"' },
      { naija: '🗺️', btc: '🏠', match: 'Spread backups around',         def: 'One copy of your 12 words at home, one at family member, one in a safe deposit. Fire here? Backup there!', funny: '😂 "Eggs in different baskets. Always!"' },
      { naija: '🧪', btc: '✅', match: 'Test restore first',             def: 'Practice restoring your wallet with a small amount before putting big money in. Make sure your backup actually works.', funny: '😂 "Test the parachute before jumping!"' },
    ],
  },

  // ============ L15 — Lightning deeper ============
  {
    id: 15, badge: '15', chapter: 'Step 15',
    title: 'Lightning: Bitcoin for small money',
    story: 'Regular Bitcoin is good for big amounts. Lightning is built on top of Bitcoin for tiny everyday payments like suya, transport, tips.',
    hint: 'Match Lightning ideas',
    hintColor: '#F7931A', sats: 3,
    pairs: [
      { id: 'tiny',     imgEmoji: '🍢', imgLabel: 'Suya',          wordEmoji: '⚡', wordLabel: 'Lightning is for tiny payments' },
      { id: 'invoice',  imgEmoji: '🧾', imgLabel: 'Receipt',       wordEmoji: '📲', wordLabel: 'Invoice = QR code you scan to pay' },
      { id: 'channel',  imgEmoji: '🛣️', imgLabel: 'Private road',  wordEmoji: '🔗', wordLabel: 'Channel = direct connection between wallets' },
      { id: 'instant',  imgEmoji: '🏃', imgLabel: 'Fast',          wordEmoji: '⚡', wordLabel: 'Money moves in less than 1 second' },
      { id: 'cheap',    imgEmoji: '🪙', imgLabel: 'Cheap',         wordEmoji: '💯', wordLabel: 'Fees almost zero, even for big payments' },
      { id: 'address',  imgEmoji: '📧', imgLabel: 'Email',         wordEmoji: '🔗', wordLabel: 'Lightning address looks like your email' },
      { id: 'tip',      imgEmoji: '💫', imgLabel: 'Zap',           wordEmoji: '🎁', wordLabel: 'Tip creators with sats instantly' },
      { id: 'phoenix',  imgEmoji: '🦅', imgLabel: 'Phoenix',       wordEmoji: '📱', wordLabel: 'Phoenix is a popular Lightning app' },
    ],
    reveals: [
      { naija: '🍢', btc: '⚡', match: 'Lightning for small payments', def: 'Lightning lets you pay 50 naira, 100 naira, even 5 naira amounts cheaply. Try doing that with a bank transfer.', funny: '😂 "Buy suya with Bitcoin? Yes. Welcome to Lightning!"' },
      { naija: '🧾', btc: '📲', match: 'Invoice = scannable code',    def: 'The seller shows a QR code. You open your wallet, scan, confirm. Done in 3 seconds.', funny: '😂 "Scan, click, eat. Future is here!"' },
      { naija: '🛣️', btc: '🔗', match: 'Channel = direct line',       def: 'Two wallets can open a channel and shoot payments back and forth instantly without touching the main chain.', funny: '😂 "Your own private road. No traffic!"' },
      { naija: '🏃', btc: '⚡', match: 'Less than 1 second',           def: 'Real Lightning payments arrive faster than you can blink. Truly real-time money.', funny: '😂 "Faster than gossip in your area!"' },
      { naija: '🪙', btc: '💯', match: 'Almost zero fees',             def: 'Send 1 million naira worth, pay 5 naira fee. Lightning is the cheapest way to move money on earth right now.', funny: '😂 "5 naira to move 1 million? Banks are sweating!"' },
      { naija: '📧', btc: '🔗', match: 'Looks like an email',          def: 'A Lightning address is like name@wallet.com. Easy to share. Easy to receive at.', funny: '😂 "If you can give your email, you can give your Lightning address!"' },
      { naija: '💫', btc: '🎁', match: 'Zap = tip with sats',          def: 'On apps like Nostr, you can tip creators a few sats with one click. Real money flowing for real value.', funny: '😂 "Like button gives nothing. Zap gives money!"' },
      { naija: '🦅', btc: '📱', match: 'Phoenix is a great wallet',    def: 'Phoenix Wallet is beginner-friendly Lightning. Open the app and you can already send and receive. No tech setup.', funny: '😂 "Phoenix easy. Even your mama can use it!"' },
    ],
  },

  // ============ L16 — Mining deeper ============
  {
    id: 16, badge: '16', chapter: 'Step 16',
    title: 'Mining and the halving',
    story: 'Every 4 years, the Bitcoin reward for mining cuts in half. This is called the halving. It is built into Bitcoin and nobody can stop it.',
    hint: 'Match the mining ideas',
    hintColor: '#F7931A', sats: 3,
    pairs: [
      { id: 'halving',    imgEmoji: '✂️', imgLabel: 'Cut in half',  wordEmoji: '📅', wordLabel: 'Halving happens every 4 years' },
      { id: 'reward',     imgEmoji: '🎁', imgLabel: 'Reward',       wordEmoji: '📉', wordLabel: 'New Bitcoin reward keeps shrinking' },
      { id: 'asic',       imgEmoji: '🖥️', imgLabel: 'Machine',     wordEmoji: '⚙️', wordLabel: 'ASIC = special mining machine' },
      { id: 'pool',       imgEmoji: '👨‍👩‍👧‍👦', imgLabel: 'Team',  wordEmoji: '🤝', wordLabel: 'Mining pool = miners working together' },
      { id: 'difficulty', imgEmoji: '🏋️', imgLabel: 'Harder',      wordEmoji: '⚖️', wordLabel: 'Difficulty adjusts to keep blocks at 10 mins' },
      { id: 'energy',     imgEmoji: '💧', imgLabel: 'Hydro',        wordEmoji: '☀️', wordLabel: 'Miners chase cheap energy worldwide' },
      { id: 'fee',        imgEmoji: '💰', imgLabel: 'Fee',          wordEmoji: '🪙', wordLabel: 'Miners also earn transaction fees' },
      { id: 'security',   imgEmoji: '🛡️', imgLabel: 'Guard',       wordEmoji: '🔐', wordLabel: 'Mining is what protects Bitcoin' },
    ],
    reveals: [
      { naija: '✂️', btc: '📅', match: 'Reward halves every 4 years', def: 'After every 210,000 blocks (~4 years), the Bitcoin miners get is cut in half. Built into the rules forever.', funny: '😂 "Halving day. Miner: ouch. Holder: cheers!"' },
      { naija: '🎁', btc: '📉', match: 'New supply shrinks over time', def: 'Started at 50 BTC per block. Now 3.125. Eventually 0. This makes Bitcoin more and more scarce.', funny: '😂 "Less new Bitcoin = more value for what exists!"' },
      { naija: '🖥️', btc: '⚙️', match: 'ASIC = mining-only computer', def: 'A regular laptop cannot mine Bitcoin profitably. ASICs are chips built only for mining, nothing else.', funny: '😂 "ASIC: born for one job. Mines forever!"' },
      { naija: '👨‍👩‍👧‍👦', btc: '🤝', match: 'Pools share rewards',     def: 'Solo mining is like waiting for the lottery. Pools combine power and share winnings so income is steady.', funny: '😂 "Solo = maybe never. Pool = small steady win!"' },
      { naija: '🏋️', btc: '⚖️', match: 'Difficulty self-adjusts',     def: 'Every 2 weeks Bitcoin checks how fast blocks are coming and makes the puzzle easier or harder.', funny: '😂 "Bitcoin balances itself. No CBN needed!"' },
      { naija: '💧', btc: '☀️', match: 'Miners hunt cheap energy',    def: 'Mining works anywhere with cheap electricity. That is why miners use hydro in Iceland, solar in Texas, gas in Nigeria.', funny: '😂 "Wherever current cheap, miner go there!"' },
      { naija: '💰', btc: '🪙', match: 'Fees are part of the reward', def: 'Miners earn new Bitcoin AND the fees you pay to send Bitcoin. As new Bitcoin shrinks, fees become more important.', funny: '😂 "Two streams of income. Miner business!"' },
      { naija: '🛡️', btc: '🔐', match: 'Mining secures Bitcoin',      def: 'All that computing power makes attacking Bitcoin almost impossible. To cheat, you would need more power than every miner combined.', funny: '😂 "Attack Bitcoin? Bring all the generators in the world. Still not enough!"' },
    ],
  },

  // ============ L17 — Privacy & freedom ============
  {
    id: 17, badge: '17', chapter: 'Step 17',
    title: 'Money and freedom',
    story: 'Money is freedom. When someone else can stop your money, they can stop your life. Bitcoin returns that power to ordinary people.',
    hint: 'Match each freedom idea',
    hintColor: '#9945FF', sats: 3,
    pairs: [
      { id: 'censor',   imgEmoji: '🚫', imgLabel: 'No',            wordEmoji: '✅', wordLabel: 'Bitcoin payments cannot be blocked' },
      { id: 'border',   imgEmoji: '🛂', imgLabel: 'Customs',       wordEmoji: '🌍', wordLabel: 'No borders for Bitcoin' },
      { id: 'private',  imgEmoji: '🕵️', imgLabel: 'Spy',           wordEmoji: '🔐', wordLabel: 'Your wallet does not have your name on it' },
      { id: 'pseudo',   imgEmoji: '🎭', imgLabel: 'Mask',          wordEmoji: '👤', wordLabel: 'Addresses are random, not personal info' },
      { id: 'inflation', imgEmoji: '📉', imgLabel: 'Falling',      wordEmoji: '🛡️', wordLabel: 'Protect savings from inflation' },
      { id: 'exit',     imgEmoji: '🚪', imgLabel: 'Exit',          wordEmoji: '🪙', wordLabel: 'Way out when local money fails' },
      { id: 'permission', imgEmoji: '🪪', imgLabel: 'ID',          wordEmoji: '❌', wordLabel: 'No permission needed to use Bitcoin' },
      { id: 'speech',   imgEmoji: '📣', imgLabel: 'Voice',         wordEmoji: '💪', wordLabel: 'Free money = free speech' },
    ],
    reveals: [
      { naija: '🚫', btc: '✅', match: 'No one can censor Bitcoin',    def: 'Banks can block donations they disagree with. Bitcoin cannot. The network does not know what is "good" or "bad" payment.', funny: '😂 "Bitcoin no get bias. Money is money!"' },
      { naija: '🛂', btc: '🌍', match: 'No borders',                   def: 'Send Bitcoin from Lagos to anywhere on earth. No customs, no exchange rate at the border.', funny: '😂 "Customs men dey confused. Bitcoin pass them!"' },
      { naija: '🕵️', btc: '🔐', match: 'Your wallet has no name',     def: 'A Bitcoin wallet is not linked to your ID by default. The blockchain sees an address, not a person.', funny: '😂 "Your bank knows your shoe size. Bitcoin no know your name!"' },
      { naija: '🎭', btc: '👤', match: 'Pseudonymous addresses',       def: 'Pseudonymous = like a nickname. Anyone can see the transaction but not who you are, unless you tell them.', funny: '😂 "Wear a mask online with your money. Stylish!"' },
      { naija: '📉', btc: '🛡️', match: 'Bitcoin beats inflation',      def: 'Naira loses 25% a year. Bitcoin grows over the long run. Saving in Bitcoin protects against losing purchasing power.', funny: '😂 "Inflation eat naira. Bitcoin eat inflation!"' },
      { naija: '🚪', btc: '🪙', match: 'Bitcoin is an exit door',      def: 'When Venezuelan and Lebanese banks collapsed, Bitcoin holders kept their savings. It is the emergency exit.', funny: '😂 "Bank crash? Bitcoiners just dey gist!"' },
      { naija: '🪪', btc: '❌', match: 'No permission needed',          def: 'You do not need to ask anyone to send or receive Bitcoin. No application form. No approval letter.', funny: '😂 "Press send. The end!"' },
      { naija: '📣', btc: '💪', match: 'Free money = free speech',      def: 'When you control your own money, no government can silence you by freezing your accounts. Real independence.', funny: '😂 "Voice loud because money safe!"' },
    ],
  },

  // ============ L18 — Bitcoin in Nigeria ============
  {
    id: 18, badge: '18', chapter: 'Step 18',
    title: 'Bitcoin and Nigeria',
    story: 'Nigeria is one of the top countries in the world for Bitcoin use. Not because we like risk. Because we know what broken money feels like.',
    hint: 'Match each Nigerian situation to its Bitcoin answer',
    hintColor: '#00E5A0', sats: 3,
    pairs: [
      { id: 'remit',    imgEmoji: '✈️', imgLabel: 'Auntie',        wordEmoji: '⚡', wordLabel: 'Family abroad sends money via Lightning' },
      { id: 'dollar',   imgEmoji: '💵', imgLabel: 'Dollar',        wordEmoji: '🟠', wordLabel: 'Hold Bitcoin instead of chasing dollars' },
      { id: 'freelance', imgEmoji: '💻', imgLabel: 'Laptop',       wordEmoji: '🌍', wordLabel: 'Freelancers get paid globally' },
      { id: 'paypal',   imgEmoji: '🚫', imgLabel: 'Blocked',       wordEmoji: '✅', wordLabel: 'Bitcoin works where PayPal does not' },
      { id: 'unbanked', imgEmoji: '🙅', imgLabel: 'No bank',       wordEmoji: '📱', wordLabel: 'Anyone with a phone can have a wallet' },
      { id: 'youth',    imgEmoji: '🎓', imgLabel: 'Youth',         wordEmoji: '🚀', wordLabel: 'Young Nigerians lead Bitcoin adoption' },
      { id: 'merchant', imgEmoji: '🛒', imgLabel: 'Shop',          wordEmoji: '🤝', wordLabel: 'Shops can accept Bitcoin for global sales' },
      { id: 'dca',      imgEmoji: '📆', imgLabel: 'Weekly',        wordEmoji: '📈', wordLabel: 'Stack a little every week for years' },
    ],
    reveals: [
      { naija: '✈️', btc: '⚡', match: 'Family sends via Lightning',  def: 'Nigeria receives over $20 billion in remittances yearly. Western Union takes a big cut. Lightning takes almost nothing.', funny: '😂 "Auntie send 100 pounds. With Western Union you get 91. With Lightning you get 99.99!"' },
      { naija: '💵', btc: '🟠', match: 'Bitcoin > chasing dollars',   def: 'Many Nigerians want dollars to escape naira. Bitcoin offers similar protection without needing dom account or visa.', funny: '😂 "Why chase dollars when you can hold the apex money?"' },
      { naija: '💻', btc: '🌍', match: 'Get paid by anyone, anywhere', def: 'A Nigerian freelancer can get paid by a US client in Bitcoin. No bank, no Stripe blocking, no waiting weeks.', funny: '😂 "Client in California pay you direct. Bitcoin, no border!"' },
      { naija: '🚫', btc: '✅', match: 'Bitcoin works when PayPal does not', def: 'PayPal and many platforms restrict Nigerian accounts. Bitcoin has no country office. You cannot be locked out.', funny: '😂 "PayPal: sorry your country. Bitcoin: I no get country!"' },
      { naija: '🙅', btc: '📱', match: 'No bank? No problem',         def: '40% of Nigerian adults are unbanked. A Bitcoin wallet needs just a phone. No paperwork, no minimum balance.', funny: '😂 "Phone is your new bank branch!"' },
      { naija: '🎓', btc: '🚀', match: 'Youth lead the way',          def: 'Young Nigerians are among the highest adopters globally. They understand the future of money better than most banks.', funny: '😂 "Gen Z teaching Gen X about money. Plot twist!"' },
      { naija: '🛒', btc: '🤝', match: 'Shops can sell to the world', def: 'A Lagos shop accepting Bitcoin can receive payments from Berlin, Tokyo, NYC. Without opening a foreign bank account.', funny: '😂 "Your jollof recipe could go global!"' },
      { naija: '📆', btc: '📈', match: 'DCA: stack sats every week',   def: 'Dollar cost averaging means buying a small amount regularly no matter the price. Over years, this beats trying to time the market.', funny: '😂 "Steady steady. Tortoise win Bitcoin race!"' },
    ],
  },

  // ============ L19 — Wisdom round ============
  {
    id: 19, badge: '19', chapter: 'Step 19',
    title: 'The deep wisdom',
    story: 'You have come far. Now for the deeper truths. The things Bitcoiners learn after years of holding. Wisdom you carry for life.',
    hint: 'Match the deep ideas',
    hintColor: '#A855F7', sats: 4,
    pairs: [
      { id: 'sound',    imgEmoji: '🎵', imgLabel: 'Music',         wordEmoji: '💪', wordLabel: 'Sound money keeps its value over decades' },
      { id: 'time',     imgEmoji: '🌳', imgLabel: 'Tree',          wordEmoji: '⏳', wordLabel: 'Plant for the long term, sit in shade later' },
      { id: 'verify',   imgEmoji: '🔍', imgLabel: 'Check',         wordEmoji: '🚫', wordLabel: '"Don\'t trust, verify" is the Bitcoin motto' },
      { id: 'hodl',     imgEmoji: '🦍', imgLabel: 'Hold',          wordEmoji: '💎', wordLabel: 'HODL = hold through ups and downs' },
      { id: 'cycle',    imgEmoji: '🔄', imgLabel: 'Cycles',        wordEmoji: '📊', wordLabel: 'Bitcoin moves in 4-year cycles' },
      { id: 'fud',      imgEmoji: '😱', imgLabel: 'Fear',          wordEmoji: '📰', wordLabel: 'Bitcoin "dies" in headlines, lives in reality' },
      { id: 'apex',     imgEmoji: '🦁', imgLabel: 'Lion',          wordEmoji: '🥇', wordLabel: 'Bitcoin is the apex of all money' },
      { id: 'patience', imgEmoji: '🐢', imgLabel: 'Slow',          wordEmoji: '🏆', wordLabel: 'Patience beats trading every time' },
    ],
    reveals: [
      { naija: '🎵', btc: '💪', match: 'Sound money holds value',     def: 'Gold was the original sound money. Bitcoin is digital, easier to carry, harder to fake. The most sound money ever made.', funny: '😂 "Naira out of tune. Bitcoin still on beat since 2009!"' },
      { naija: '🌳', btc: '⏳', match: 'Long-term thinking wins',      def: 'Plant a tree today, sit in the shade in 20 years. Same with Bitcoin. The patient ones inherit wealth.', funny: '😂 "Bitcoin in 2013 = small tree. Today = forest!"' },
      { naija: '🔍', btc: '🚫', match: 'Don\'t trust, verify',         def: 'Run your own node, check your own balance, read the code. Bitcoin lets you verify everything. So you do not have to trust anyone.', funny: '😂 "Trust no one. Check yourself. Sleep well!"' },
      { naija: '🦍', btc: '💎', match: 'HODL means hold tight',        def: 'Famous typo from 2013. Now a way of life. Buy Bitcoin and hold through crashes, panics and pumps. Time rewards holders.', funny: '😂 "Diamond hands no shake. Paper hands sell at the bottom!"' },
      { naija: '🔄', btc: '📊', match: 'Bitcoin has 4-year cycles',    def: 'Halving every 4 years. Big price moves about 12-18 months after. This pattern has held for 16 years.', funny: '😂 "Bitcoin cycle reliable like Lagos rain!"' },
      { naija: '😱', btc: '📰', match: 'Headlines kill Bitcoin daily', def: 'Bitcoin has been declared dead 400+ times in newspapers. It is still here. Stronger every year. Ignore the noise.', funny: '😂 "If Bitcoin had 9 lives, it would still have 400 left!"' },
      { naija: '🦁', btc: '🥇', match: 'Apex monetary asset',          def: 'Of all coins, all assets, all stores of value, Bitcoin is at the top. The hardest, most secure, most decentralised.', funny: '😂 "Lion no dey beg. Bitcoin no dey beg!"' },
      { naija: '🐢', btc: '🏆', match: 'Patience beats trading',       def: 'Most traders lose money. Most patient holders win. The market punishes the smart and rewards the slow.', funny: '😂 "Trader busy. Hodler busy doing nothing. Hodler richer!"' },
    ],
  },

  // ============ L20 — Boss round ============
  {
    id: 20, badge: '20', chapter: 'Final step',
    title: 'You are ready',
    story: 'You have walked the whole journey. From "what is Bitcoin" to deep wisdom. Final round. Everything mixed. Show what you know.',
    hint: 'Final boss round',
    hintColor: '#F7931A', sats: 5,
    pairs: [
      { id: 'halving',  imgEmoji: '✂️', imgLabel: 'Halving',       wordEmoji: '📅', wordLabel: 'Every 4 years rewards cut in half' },
      { id: 'seed',     imgEmoji: '🌱', imgLabel: '12 words',      wordEmoji: '🔑', wordLabel: 'Guard them with your life' },
      { id: 'lightning', imgEmoji: '⚡', imgLabel: 'Lightning',     wordEmoji: '🍢', wordLabel: 'Suya-sized payments instantly' },
      { id: 'mining',   imgEmoji: '⛏️', imgLabel: 'Mining',        wordEmoji: '💪', wordLabel: 'Computers securing the network' },
      { id: 'node',     imgEmoji: '💻', imgLabel: 'Node',          wordEmoji: '🔍', wordLabel: 'Run one to verify yourself' },
      { id: 'cap',      imgEmoji: '🛑', imgLabel: '21 million',    wordEmoji: '♾️', wordLabel: 'Maximum supply forever' },
      { id: 'keys',     imgEmoji: '👑', imgLabel: 'Golden rule',   wordEmoji: '🔐', wordLabel: 'Not your keys, not your coins' },
      { id: 'cold',     imgEmoji: '🧊', imgLabel: 'Cold',          wordEmoji: '💾', wordLabel: 'Big savings stay offline' },
      { id: 'sats',     imgEmoji: '🔬', imgLabel: 'Stack',         wordEmoji: '📈', wordLabel: 'Small sats every week add up' },
    ],
    reveals: [
      { naija: '✂️', btc: '📅', match: 'Halving = 4 year cycle',      def: 'Reward cut in half every 4 years. Hardcoded. Predictable. Beautiful.', funny: '😂 "Cut, cut, cut. Then zero. The end of new Bitcoin in 2140!"' },
      { naija: '🌱', btc: '🔑', match: 'Seed phrase is your life',     def: '12 words are everything. Lose them, lose your Bitcoin. Forever. No customer support.', funny: '😂 "Bitcoin customer support: we do not exist. Backup yourself!"' },
      { naija: '⚡', btc: '🍢', match: 'Lightning for suya money',     def: 'Tiny instant payments. Almost zero fee. Built on top of Bitcoin.', funny: '😂 "Bitcoin for big things, Lightning for the suya!"' },
      { naija: '⛏️', btc: '💪', match: 'Mining = security',            def: 'Miners use real energy to protect Bitcoin. The more they mine, the harder Bitcoin is to attack.', funny: '😂 "Mining is the muscle. Bitcoin is the empire!"' },
      { naija: '💻', btc: '🔍', match: 'Run a node, verify yourself',  def: 'A node is the only way to truly check the Bitcoin network without trusting anyone. Highest form of Bitcoiner.', funny: '😂 "Trust nothing. Run node. Sleep peacefully!"' },
      { naija: '🛑', btc: '♾️', match: '21 million max, forever',      def: 'Never more. Never less. This is what makes Bitcoin different from naira, dollar, and every other money.', funny: '😂 "CBN no fit print Bitcoin. Door close 4ever!"' },
      { naija: '👑', btc: '🔐', match: 'Not your keys, not your coins', def: 'Bitcoin on exchange = IOU from a company that can fail. Bitcoin in your own wallet = truly yours.', funny: '😂 "FTX teach us this lesson. Never again!"' },
      { naija: '🧊', btc: '💾', match: 'Cold storage for savings',     def: 'Big amounts go offline. Hardware wallet. Cold wallet. Safe from hackers and your own clumsy fingers.', funny: '😂 "Big money in vault. Small money in pocket. Old wisdom!"' },
      { naija: '🔬', btc: '📈', match: 'Stack sats consistently',      def: 'Buy a little. Every week. For years. This simple strategy beats almost every trader.', funny: '😂 "Boring strategy. Brilliant results!"' },
    ],
  },

]

/* ============================================================================
   WORD HUNT puzzle levels (inserted after every 3 match levels)
   Each puzzle has:
    - timeLimit (seconds)
    - words: full pool shown on screen, mixed
    - real:  the subset that are real Bitcoin words from the previous 3 levels
   ============================================================================ */

const WORD_HUNTS = [
  // After L1-L3 — basics
  {
    title: 'Word Hunt: The basics',
    story: 'Find the real Bitcoin words. Skip the regular money words. You have 30 seconds.',
    hint: 'Tap Bitcoin words only',
    hintColor: '#F7931A',
    sats: 2,
    timeLimit: 30,
    real:  ['Bitcoin', 'Sats', 'Satoshi'],
    decoy: ['Naira', 'Dollar', 'Pounds', 'Bank', 'Loan', 'Cheque'],
  },

  // After L4-L6 — savings + ownership
  {
    title: 'Word Hunt: Your money',
    story: 'Some words are Bitcoin words. Others are regular bank words. Pick only the Bitcoin ones.',
    hint: 'Tap Bitcoin words only',
    hintColor: '#9945FF',
    sats: 2,
    timeLimit: 30,
    real:  ['Wallet', 'Bitcoin', 'Sats', 'Address'],
    decoy: ['ATM', 'Debit Card', 'PIN', 'Branch', 'Teller', 'Savings Account', 'Overdraft'],
  },

  // After L7-L9 — vocabulary + seed phrase + sending
  {
    title: 'Word Hunt: Big words',
    story: 'Plenty Bitcoin words now mixed with bank and crypto words. Pick only the real Bitcoin ones.',
    hint: 'Tap Bitcoin words only',
    hintColor: '#00E5A0',
    sats: 3,
    timeLimit: 35,
    real:  ['Seed Phrase', 'Private Key', 'Block', 'Lightning', 'Address', 'Wallet'],
    decoy: ['Password', 'Username', 'IBAN', 'SWIFT', 'eNaira', 'Crypto', 'PayPal'],
  },

  // After L10-L12 — mining, network, safety
  {
    title: 'Word Hunt: How it works',
    story: 'Mining, nodes, hash. Spot the Bitcoin words hiding among finance jargon. Time is ticking.',
    hint: 'Tap Bitcoin words only',
    hintColor: '#FF4444',
    sats: 3,
    timeLimit: 40,
    real:  ['Mining', 'Node', 'Halving', 'Block', 'Hash', 'Blockchain'],
    decoy: ['Interest Rate', 'Mortgage', 'Stock', 'Bond', 'Insurance', 'Dividend', 'Inflation', 'Tax'],
  },

  // After L13-L15 — buying NG, cold storage, Lightning
  {
    title: 'Word Hunt: Going pro',
    story: 'Deeper Bitcoin words mixed with crypto and bank words. Stay sharp.',
    hint: 'Tap Bitcoin words only',
    hintColor: '#A855F7',
    sats: 4,
    timeLimit: 40,
    real:  ['Hardware Wallet', 'Cold Storage', 'Lightning', 'Multisig', 'Channel', 'Hot Wallet'],
    decoy: ['Ethereum', 'Dogecoin', 'NFT', 'Forex', 'Western Union', 'Visa', 'Mastercard', 'Wire Transfer'],
  },

  // After L16-L18 — halving, freedom, NG ecosystem
  {
    title: 'Word Hunt: Master class',
    story: 'Final hunt before the boss round. Real Bitcoin words only. Ignore the finance noise.',
    hint: 'Tap Bitcoin words only',
    hintColor: '#F7931A',
    sats: 4,
    timeLimit: 45,
    real:  ['Halving', 'ASIC', 'HODL', 'Proof of Work', 'Satoshi', 'Genesis Block', 'Whitepaper', 'UTXO'],
    decoy: ['IPO', 'Hedge Fund', 'Pension', 'Mutual Fund', 'CBDC', 'Stablecoin', 'Altcoin'],
  },
]

// Inject Word Hunt levels after every 3 match levels
function buildLevels(matchLevels, hunts) {
  const out = []
  let huntIdx = 0
  matchLevels.forEach((lv, i) => {
    out.push({ ...lv, type: 'match' })
    // After every 3 match levels, insert a hunt (if we still have one)
    if ((i + 1) % 3 === 0 && huntIdx < hunts.length) {
      const h = hunts[huntIdx++]
      out.push({
        type: 'wordhunt',
        chapter: 'Word Hunt',
        ...h,
      })
    }
  })
  // Re-number and add badge based on final position
  return out.map((lv, idx) => ({
    ...lv,
    id: idx + 1,
    badge: String(idx + 1),
  }))
}

const _RAW_LEVELS = LEVELS.slice()
export const FINAL_LEVELS = buildLevels(_RAW_LEVELS, WORD_HUNTS)

// Re-export LEVELS as the combined list
LEVELS.length = 0
FINAL_LEVELS.forEach(l => LEVELS.push(l))

export const TOTAL_SATS = LEVELS.reduce((sum, l) => sum + l.sats, 0)
