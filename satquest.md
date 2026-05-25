# SatQuest

This file documents the SatQuest project built during **Hack4Freedom Lagos 2026**.

---

## Overview

SatQuest is an open-source, mobile-first PWA (Progressive Web App) that teaches Bitcoin and Lightning through gameplay, built with a Nigerian lens. You pick an avatar, choose a username, and work through 26 levels mixing Match-the-Pair puzzles with timed Word Hunt challenges. Every level you complete earns you real satoshis. It works offline, installs on any phone, and does not need a bank account to get started.

---

## Problem

Most Bitcoin products out there were built for people who are already in the Bitcoin space. They assume you know the terminology, you have used a wallet before, and you already believe in what Bitcoin is. That is a small circle. If you look at global adoption numbers, only a tiny percentage of the world actually uses Bitcoin, and most of that percentage already came in through tech or finance. The knowledge has not spread far enough.

The bigger issue is the second mentality. Walk up to a regular person on the street in Lagos and say "come and do Bitcoin" and the first thing you get is suspicion. Not because Bitcoin is bad, but because they have never been taught what it actually is. Nobody caught them young. Nobody made it simple and fun before the noise and complexity arrived.

On top of that, Nigerians and people across the Global South are dealing with 25%+ annual inflation, frozen accounts, PayPal restrictions, SWIFT delays, and currencies that lose half their value within a year. Bitcoin is literally a solution to these problems, but people cannot benefit from something they do not understand and do not trust.

Bitcoin's price is volatile and falls too, but unlike a currency being inflated away, it has a fixed supply and no central authority that can print more of it.

Beyond the financial case, Bitcoin was built on the principles of privacy, decentralization, and individual control over money — values documented in the Bitcoin whitepaper that most new users never get to understand because they bounce off the complexity before they get there.

---

## Solution

SatQuest is built around one idea: catch them young. If we can get this into schools, into secondary school classrooms, into the hands of children who are still forming their understanding of money, then by the time they grow up Bitcoin will not feel foreign or suspicious. It will just be something they already know.

The game makes Bitcoin education something people actually want to do. You do not need to already believe in Bitcoin to play. You do not need any prior knowledge at all. Zero. If you have never heard the word Bitcoin before in your life, you can pick up SatQuest and start learning from level one. You just need a phone. There are two game modes that rotate through the 26 levels:

- **Match**: tap a picture, tap its meaning. Vocabulary teaching through illustrated cards.
- **Word Hunt**: a timed puzzle every 4th level where you find real Bitcoin words hidden among legacy finance terms like bank, IBAN, and SWIFT. Beat the clock to earn sats.

Every level is rooted in real Nigerian life: Mama Titi's market savings, Emeka sending money to Aba, Dayo's account being frozen during EndSARS. By level 26, a player understands Bitcoin and Lightning better than most people who have held it for years. And the goal is not just to finish the game. The goal is that when someone walks away they have the basics. If they want to go deeper, they can. But at least the foundation is there. At least we have more people in the system who understand what Bitcoin actually is and why it matters.

Finishing a level earns real satoshis. Each player gets their own non-custodial Lightning wallet the moment they sign up. No bank account, no middleman.

---

## Technology Stack

**Frontend**
- Vite + React (PWA, installable on any phone, works offline)
- CSS Modules
- localStorage for progress, syncs to the backend when online

**Backend**
- NestJS 10 (TypeScript)
- PostgreSQL with TypeORM for persistent storage
- Breez SDK (Spark) for non-custodial Lightning wallets, one per player
- BIP-39 mnemonic generation for wallet recovery
- Deferred reward system: sats are queued per level and paid out on claim
- Global leaderboard ranked by lifetime sats, with best total time as tiebreaker

**Infrastructure**
- Frontend: Netlify
- Backend: Docker Compose
- Monorepo: `frontend/` + `backend/`

---

## Team

| Name | GitHub | Role |
|---|---|---|
| Stephanie Ademuyiwa | [@aizuanjeme](https://github.com/aizuanjeme) | Creator and maintainer |

---

## Repository & Links

- **GitHub:** https://github.com/aizuanjeme/satquest
- **Live demo:** coming soon

---

## Status

The frontend and backend are fully integrated. Players can create profiles, sync progress across devices, earn deferred sats rewards on level completion, claim payouts via Lightning, and appear on a real global leaderboard ranked by sats. The app is ready for deployment.

---

## Next Steps

- Add music and sound effects to make the game feel alive
- Encrypt player mnemonics at rest so wallets are properly secured before going live
- Launch the community leaderboard with real sats rankings visible to all players
- Expand game content to go deeper on Lightning Network and financial sovereignty topics
- Translations into Yoruba, Igbo, Hausa, and Pidgin so more people can play in their own language
- Live tournaments and quiz competitions where players go head to head, fastest finger style, with real sats as the prize. Once people see that there is something to win, curiosity does the rest. They will go back, study the levels, practice, and come back ready. That is Bitcoin education happening without anyone forcing it.
- An in-app store where players can spend their earned sats on perks, items, or rewards inside the game. Earning Bitcoin through gameplay and then using it inside the same app closes the loop and makes the whole experience feel real.
