/*
  The Library — a plain-language walk through Satoshi Nakamoto’s 2008 paper
  "Bitcoin: A Peer-to-Peer Electronic Cash System", section by section.

  These are original summaries written for SatQuest players (not the paper’s
  text). Each section carries a one-line key idea and, where one exists, the
  LARP chapter that lets you act it out (`play`).
*/

export const PAPER = {
  title: 'Bitcoin: A Peer-to-Peer Electronic Cash System',
  author: 'Satoshi Nakamoto',
  year: 2008,
  link: 'https://bitcoin.org/bitcoin.pdf',
}

export const SECTIONS = [
  {
    id: 'intro',
    n: 1,
    title: 'Introduction',
    idea: 'Online money today runs on trust in middlemen. Bitcoin replaces that trust with proof.',
    body: [
      'When you pay online, a bank or payment company sits in the middle. They can reverse payments, freeze accounts, charge fees, and ask for more and more of your personal details. Small payments become too expensive to bother with.',
      'Cash doesn’t have this problem when you’re face to face — but there was no cash for the internet. Satoshi proposes an electronic payment system where two people can pay each other directly, and where the security comes from computation (math anyone can check) instead of from trusting a company.',
    ],
  },
  {
    id: 'transactions',
    n: 2,
    title: 'Transactions',
    idea: 'A coin is a chain of signatures. Each owner signs it over to the next.',
    play: 'coins',
    body: [
      'To pay someone, the current owner signs a message that says “this coin now belongs to this new key”. Anyone can check the signature, so anyone can follow the coin’s history from owner to owner.',
      'The hard part is the double-spend: what stops the owner signing the same coin to two different people? Without a bank keeping the master record, everyone needs to agree on which payment came first. The rest of the paper solves exactly that.',
    ],
  },
  {
    id: 'timestamp',
    n: 3,
    title: 'Timestamp Server',
    idea: 'Stamp batches of transactions in order, each stamp including the one before it.',
    body: [
      'Group transactions into a block, take a fingerprint (hash) of it, and publish that fingerprint widely. That proves the transactions existed at that moment.',
      'Each new block’s fingerprint includes the previous block’s fingerprint. That links them into a chain — change anything in an old block and every fingerprint after it breaks.',
    ],
  },
  {
    id: 'pow',
    n: 4,
    title: 'Proof-of-Work',
    idea: 'Make adding a block expensive, so rewriting history is even more expensive.',
    play: 'miner',
    body: [
      'Miners keep changing a small number in the block (the nonce) and re-hashing until the fingerprint starts with enough zeros. There’s no shortcut — it takes lots of guesses — but checking the answer takes one try.',
      'The longest chain is the one with the most work behind it. To change an old block, an attacker would have to redo that block AND every block after it, faster than all the honest miners combined. The difficulty adjusts so blocks keep arriving at a steady pace (about every 10 minutes).',
    ],
  },
  {
    id: 'network',
    n: 5,
    title: 'Network',
    idea: 'Everyone shares new transactions and blocks, and only accepts ones that follow the rules.',
    play: 'node',
    body: [
      'New transactions are broadcast to all nodes. Miners gather them into a block and race to find the proof-of-work. When one succeeds, it broadcasts the block.',
      'Other nodes accept the block only if every transaction in it is valid and not already spent — then they start building on top of it. If two blocks appear at once, nodes work on whichever they saw first and switch if the other branch grows longer.',
    ],
  },
  {
    id: 'incentive',
    n: 6,
    title: 'Incentive',
    idea: 'Miners are paid in new coins and fees, which makes playing honest the profitable choice.',
    play: 'mempool',
    body: [
      'The first transaction in each block creates new coins for the miner who found it. That’s how coins enter circulation — like gold miners adding gold — and it rewards people for securing the network.',
      'Over time the new-coin reward shrinks and transaction fees take over. An attacker with huge computing power would earn more by mining honestly than by trying to steal, because cheating would destroy the value of the coins they hold.',
    ],
  },
  {
    id: 'disk',
    n: 7,
    title: 'Reclaiming Disk Space',
    idea: 'Old spent transactions can be trimmed without breaking the chain.',
    body: [
      'Transactions inside a block are hashed into a tree (a Merkle tree), and only the tree’s root goes in the block header. Once a coin is spent deep in the past, its branch of the tree can be thrown away, and the block’s fingerprint still checks out.',
      'Block headers alone are tiny — a few megabytes per year — so keeping the whole chain of headers is cheap.',
    ],
  },
  {
    id: 'spv',
    n: 8,
    title: 'Simplified Payment Verification',
    idea: 'A light wallet can check a payment with just block headers and a small proof.',
    body: [
      'You don’t need to run a full node to check that a payment got into a block. Keep the chain of headers, ask the network for the branch of the Merkle tree that links your transaction to a block, and see how many blocks have been built on top.',
      'It’s safe as long as honest nodes control the network. Businesses receiving lots of payments should still run their own full node.',
    ],
  },
  {
    id: 'value',
    n: 9,
    title: 'Combining and Splitting Value',
    idea: 'Transactions take several coins in and send several coins out — usually one is your change.',
    play: 'coins',
    body: [
      'Handling every satoshi separately would be clumsy, so a transaction can have many inputs and outputs. Usually: one or more inputs adding up to enough, one output to the person you’re paying, and one output returning the change to you.',
      'Coins don’t need their full history checked forever — each transaction only needs to show its inputs are valid and unspent.',
    ],
  },
  {
    id: 'privacy',
    n: 10,
    title: 'Privacy',
    idea: 'Everyone sees the transactions, but not who owns the keys.',
    body: [
      'Banks keep privacy by hiding records. Bitcoin makes every transaction public, but the keys are anonymous — like a stock exchange showing trades without naming the traders.',
      'Use a new key for every payment you receive, so your transactions can’t easily be linked. Spending several of your coins together does reveal they belong to the same owner.',
    ],
  },
  {
    id: 'calculations',
    n: 11,
    title: 'Calculations',
    idea: 'Every extra confirmation makes reversing a payment exponentially less likely.',
    play: 'doublespend',
    body: [
      'An attacker can’t create coins from nothing or take coins that were never theirs. The only trick available is to try to take back a payment they made — the double-spend.',
      'Satoshi models it as a race. If honest miners have most of the hashpower, the attacker’s chance of catching up drops exponentially with each block. That’s why a merchant waits for some confirmations before handing over something valuable.',
    ],
  },
  {
    id: 'conclusion',
    n: 12,
    title: 'Conclusion',
    idea: 'Digital cash without trust: signatures for ownership, proof-of-work for the order of events.',
    body: [
      'Signatures prove who owns coins, but on their own can’t stop double-spending. A peer-to-peer network using proof-of-work records a public history that becomes practically impossible to change once enough work is built on top.',
      'Nodes need little coordination. They can leave and rejoin, accept the longest valid chain, and vote with their computing power. Anyone can join, and the rules enforce themselves.',
    ],
  },
]

export const findSection = (id) => SECTIONS.find((s) => s.id === id)
