import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { LEVELS, AVATARS, shuffle, resolveAvatarId } from '../data/levels'
import {
  loadProfile, saveProfile, clearProfile,
  loadProgress, saveProgress, recordLevelResult, syncProgress,
  pullProgress, onOnline,
} from '../lib/storage'
import { profileApi, rewardsApi } from '../lib/api'

export function useGame() {
  // Read from localStorage synchronously on first render so initial state is correct.
  // This is the ONLY place that hydrates from storage on mount.
  const initialProfile  = loadProfile()
  const initialProgress = loadProgress()

  const [phase, setPhase]           = useState('avatar')   // avatar | map | playing | reveal | done | wallet
  const [username, setUsername]     = useState(initialProfile?.username || null)
  const [avatar, setAvatar]         = useState(
    initialProfile?.avatarId
      ? (AVATARS.find(a => a.id === resolveAvatarId(initialProfile.avatarId)) || null)
      : null
  )
  const [profile, setProfile]       = useState(initialProfile)
  const [progress, setProgress]     = useState(initialProgress)
  const [levelIdx, setLevelIdx]     = useState(initialProgress?.unlockedUpTo || 0)
  const [sats, setSats]             = useState(initialProgress?.sats || 0)
  const [unlockedUpTo, setUnlocked] = useState(initialProgress?.unlockedUpTo || 0)

  // Track whether the player earned the sats for the current level (used by Reveal)
  const [lastEarned, setLastEarned] = useState(0)

  // Timer for tracking how long a level takes (for performance/leaderboards)
  const levelStartRef = useRef(null)

  // Hydration flag: only allow persist effects after we've finished initial hydration.
  // (Profile-creation/resume flow flips this to true; on first load it stays false
  // until the user signs in or continues, preventing zero-overwrite races.)
  const hydratedRef = useRef(false)

  // ---- Match game state ----
  const [matched, setMatched]       = useState({})
  const [selImg, setSelImg]         = useState(null)
  const [selWord, setSelWord]       = useState(null)
  const [wrongFlash, setWrongFlash] = useState(null)

  const level = LEVELS[levelIdx]

  /* =========================================================================
     MATCH GAME (type === 'match')
     ========================================================================= */
  const shuffledImgs = useMemo(
    () => level.pairs
      ? shuffle(level.pairs.map(p => ({ id: p.id, emoji: p.imgEmoji, label: p.imgLabel })))
      : [],
    [levelIdx] // eslint-disable-line
  )
  const shuffledWords = useMemo(
    () => level.pairs
      ? shuffle(level.pairs.map(p => ({ id: p.id, emoji: p.wordEmoji, label: p.wordLabel })))
      : [],
    [levelIdx] // eslint-disable-line
  )

  const matchedCount = Object.keys(matched).length
  const totalPairs   = level.pairs ? level.pairs.length : 0

  const pickImg = useCallback((id) => {
    if (matched[id]) return
    setSelImg(prev => prev === id ? null : id)
  }, [matched])

  const pickWord = useCallback((id) => {
    if (matched[id]) return
    setSelWord(prev => prev === id ? null : id)
  }, [matched])

  // Generic "level done" — pass earnedSats (defaults to full level.sats for matches)
  const finishLevel = useCallback((earnedSats = level.sats) => {
    setTimeout(() => {
      setSats(s => s + earnedSats)
      setLastEarned(earnedSats)
      // Unlock the next level immediately so progress is persisted even if
      // the player navigates away before dismissing the Celebrate screen.
      setUnlocked(u => Math.max(u, levelIdx + 1))
      setPhase('reveal')
    }, 450)
  }, [level.sats, levelIdx])

  const tryMatch = useCallback((imgId, wordId) => {
    if (imgId === wordId) {
      const matchNumber = Object.keys(matched).length + 1
      const next = { ...matched, [imgId]: matchNumber }
      setMatched(next)
      setSelImg(null)
      setSelWord(null)
      if (Object.keys(next).length === totalPairs) {
        finishLevel()
      }
    } else {
      setWrongFlash(imgId + '|' + wordId)
      setTimeout(() => {
        setWrongFlash(null)
        setSelImg(null)
        setSelWord(null)
      }, 500)
    }
  }, [matched, totalPairs, finishLevel])

  /* =========================================================================
     WORD HUNT GAME (type === 'wordhunt')
     level.real:  array of real Bitcoin words to find
     level.decoy: array of decoy words
     level.timeLimit: seconds
     ========================================================================= */
  const [huntPicked, setHuntPicked]   = useState({}) // { word: 'right' | 'wrong' }
  const [huntTimeLeft, setHuntTime]   = useState(0)
  const [huntRunning, setHuntRunning] = useState(false)
  const [huntResult, setHuntResult]   = useState(null) // 'win' | 'lose' | null
  const huntTimerRef = useRef(null)

  const huntWords = useMemo(() => {
    if (level.type !== 'wordhunt') return []
    return shuffle([...(level.real || []), ...(level.decoy || [])])
  }, [levelIdx]) // eslint-disable-line

  const huntRealSet = useMemo(() => new Set(level.real || []), [levelIdx]) // eslint-disable-line
  const huntRealFound = Object.keys(huntPicked).filter(w => huntPicked[w] === 'right').length
  const huntRealTotal = (level.real || []).length

  // Start the timer when entering a wordhunt level
  useEffect(() => {
    if (level.type !== 'wordhunt' || phase !== 'playing') {
      if (huntTimerRef.current) clearInterval(huntTimerRef.current)
      return
    }
    setHuntTime(level.timeLimit || 30)
    setHuntRunning(true)
    setHuntResult(null)
    huntTimerRef.current = setInterval(() => {
      setHuntTime(t => {
        if (t <= 1) {
          clearInterval(huntTimerRef.current)
          setHuntRunning(false)
          setHuntResult('lose')
          finishLevel(0) // out of time = 0 sats
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(huntTimerRef.current)
  }, [levelIdx, phase]) // eslint-disable-line

  const pickHuntWord = useCallback((word) => {
    if (!huntRunning) return
    if (huntPicked[word]) return // already picked
    const isReal = huntRealSet.has(word)
    const next = { ...huntPicked, [word]: isReal ? 'right' : 'wrong' }
    setHuntPicked(next)

    // Did we just find them all?
    const foundCount = Object.values(next).filter(v => v === 'right').length
    if (foundCount >= huntRealTotal) {
      clearInterval(huntTimerRef.current)
      setHuntRunning(false)
      setHuntResult('win')
      finishLevel(level.sats) // full sats
    }
  }, [huntRunning, huntPicked, huntRealSet, huntRealTotal, level.sats, finishLevel])

  /* =========================================================================
     Navigation
     ========================================================================= */
  const resetLevelState = () => {
    setMatched({})
    setSelImg(null)
    setSelWord(null)
    setWrongFlash(null)
    setHuntPicked({})
    setHuntTime(0)
    setHuntRunning(false)
    setHuntResult(null)
    if (huntTimerRef.current) clearInterval(huntTimerRef.current)
  }

  const goNext = useCallback(() => {
    if (levelIdx < LEVELS.length - 1) {
      const next = levelIdx + 1
      setLevelIdx(next)
      setUnlocked(u => Math.max(u, next))
      resetLevelState()
      setPhase('playing')
    } else {
      setPhase('done')
    }
  }, [levelIdx])

  /* ---------- Celebration bridge ----------
     After the Reveal screen, instead of jumping straight into the next level
     we show a playful "wow you smashed it" overlay, then drop the player on
     the map so THEY pick the next node themselves. The last-level case skips
     the celebration and goes to the final "done" screen. */
  const goToCelebrate = useCallback(() => {
    if (levelIdx >= LEVELS.length - 1) {
      setPhase('done')
    } else {
      setPhase('celebrate')
    }
  }, [levelIdx])

  const closeCelebrate = useCallback(() => {
    // Unlock the next node so it's tappable on the map, but DON'T auto-jump
    // into it — the player taps it themselves.
    if (levelIdx < LEVELS.length - 1) {
      setUnlocked(u => Math.max(u, levelIdx + 1))
    }
    resetLevelState()
    setPhase('map')
  }, [levelIdx])

  const jumpTo = useCallback((idx) => {
    if (idx > unlockedUpTo) return
    setLevelIdx(idx)
    resetLevelState()
    setPhase('playing')
  }, [unlockedUpTo])

  /* =========================================================================
     Profile / sign-in
     ========================================================================= */

  // Called from AvatarPick when a brand-new player picks avatar + username.
  // Also registers the profile with the backend so a Breez wallet is minted.
  const chooseAvatar = useCallback(({ username: uname, avatar: av }) => {
    const newProfile = {
      username: uname,
      avatarId: av.id,
      createdAt: Date.now(),
    }
    saveProfile(newProfile)
    setProfile(newProfile)
    setUsername(uname)
    setAvatar(av)
    setSats(0)
    setUnlocked(0)
    setLevelIdx(0)
    setProgress({ sats: 0, unlockedUpTo: 0, levels: {} })
    hydratedRef.current = true
    setPhase('intro')

    // Fire-and-forget: backend creates the profile + mints a Lightning wallet.
    // 409 = username already taken on the server (handled silently).
    // Anything else (400/500/network) is logged loudly so it isn't missed.
    profileApi.create({ username: uname, avatarId: av.id })
      .then(() => {
        if (import.meta.env.DEV) console.log('✅ profile saved to backend:', uname)
      })
      .catch((err) => {
        if (err?.status === 409) return
        console.error('❌ profileApi.create failed:', err.status, err.message, err.body)
      })
  }, [])

  // Called when an existing player clicks "Continue"
  const resumeProfile = useCallback((existing) => {
    const av = AVATARS.find(a => a.id === resolveAvatarId(existing.avatarId)) || AVATARS[0]
    const g  = loadProgress()
    setUsername(existing.username)
    setAvatar(av)
    setProgress(g)
    setSats(g.sats || 0)
    setUnlocked(g.unlockedUpTo || 0)
    setLevelIdx(g.unlockedUpTo || 0)
    hydratedRef.current = true
    setPhase('map')

    // Idempotent backend sync: if the profile already exists, the server
    // returns 409 — which we treat as success. If it doesn't (new device,
    // wiped DB), this re-creates it and mints a fresh Lightning wallet.
    profileApi.create({ username: existing.username, avatarId: existing.avatarId })
      .then(() => {
        if (import.meta.env.DEV) console.log('✅ profile re-synced on resume')
      })
      .catch((err) => {
        if (err?.status === 409) return
        console.error('❌ profile resume sync failed:', err.status, err.message, err.body)
      })
  }, [])

  // Restore an account on this device from a recovery phrase.
  // The server returned profile is the source of truth — overwrite local state.
  const restoreFromProfile = useCallback(async (restoredProfile) => {
    if (!restoredProfile?.username) return
    const av =
      AVATARS.find(a => a.id === resolveAvatarId(restoredProfile.avatarId)) || AVATARS[0]

    // Pull latest server progress so the player picks up where they left off.
    const remote = await pullProgress(restoredProfile)
    const merged = {
      sats: remote?.sats || 0,
      unlockedUpTo: remote?.unlockedUpTo || 0,
      levels: Array.isArray(remote?.levels)
        // backend returns LevelResultEntity[] — convert to map keyed by levelId
        ? Object.fromEntries(
            remote.levels.map((l) => [
              String(l.levelId),
              {
                sats: l.sats,
                bestTimeMs: l.bestTimeMs,
                attempts: l.attempts,
                completedAt: l.completedAt,
              },
            ]),
          )
        : (remote?.levels || {}),
    }

    saveProfile({
      username: restoredProfile.username,
      avatarId: restoredProfile.avatarId,
      createdAt: Date.now(),
    })
    saveProgress(merged)

    setProfile({
      username: restoredProfile.username,
      avatarId: restoredProfile.avatarId,
      createdAt: Date.now(),
    })
    setUsername(restoredProfile.username)
    setAvatar(av)
    setProgress(merged)
    setSats(merged.sats)
    setUnlocked(merged.unlockedUpTo)
    setLevelIdx(merged.unlockedUpTo)
    hydratedRef.current = true
    setPhase('map')
  }, [])

  // Wipe everything and start over
  const resetEverything = useCallback(() => {
    clearProfile()
    hydratedRef.current = false
    setProfile(null)
    setProgress(null)
    setUsername(null)
    setAvatar(null)
    setSats(0)
    setUnlocked(0)
    setLevelIdx(0)
    setPhase('avatar')
  }, [])

  // Update avatar without losing progress. Username is immutable on the
  // backend (it's tied to the player's Lightning wallet).
  const updateProfile = useCallback(({ avatarId: newAvatarId }) => {
    if (!newAvatarId) return
    const updated = {
      ...(profile || {}),
      avatarId: newAvatarId,
    }
    saveProfile(updated)
    setProfile(updated)
    const av = AVATARS.find(a => a.id === newAvatarId)
    if (av) setAvatar(av)

    // Best-effort backend sync.
    if (profile?.username) {
      profileApi.update(profile.username, { avatarId: newAvatarId }).catch((err) => {
        if (import.meta.env.DEV) console.warn('profileApi.update failed', err)
      })
    }
  }, [profile])

  const goToMap         = useCallback(() => setPhase('map'), [])
  const goToWallet      = useCallback(() => setPhase('wallet'), [])
  const goToHome        = useCallback(() => setPhase('home'), [])
  const goToLeaderboard = useCallback(() => setPhase('leaderboard'), [])
  const goToProfile     = useCallback(() => setPhase('profile'), [])

  // Award 2 sats for sharing a level on social media.
  // Idempotent: only earns once per level (tracked in localStorage by ShareEarn).
  // Also persists and syncs to backend so the leaderboard and wallet see the bonus.
  const earnShareSats = useCallback(() => {
    setSats(s => s + 2)
    if (profile && hydratedRef.current) {
      const current = loadProgress()
      const updated = { ...current, sats: (current.sats || 0) + 2 }
      saveProgress(updated)
      syncProgress(updated, profile).catch(() => {})
      // Create a pending reward row so the +2 sats are included in Lightning claim
      rewardsApi.addShare(profile.username).catch(() => {})
    }
  }, [profile])

  /* =========================================================================
     Persist progress whenever sats/unlocked change
     (Only after hydration is complete, to avoid overwriting saved data with zeros)
     ========================================================================= */
  useEffect(() => {
    if (!profile || !hydratedRef.current) return
    setProgress(prev => {
      const base = prev || { sats: 0, unlockedUpTo: 0, levels: {} }
      const next = { ...base, sats, unlockedUpTo }
      saveProgress(next)
      return next
    })
  }, [sats, unlockedUpTo, profile])

  // Start the level timer when entering a 'playing' phase
  useEffect(() => {
    if (phase === 'playing') {
      levelStartRef.current = Date.now()
    }
  }, [phase, levelIdx])

  // Whenever a level finishes (phase becomes 'reveal'), record the performance.
  // We merge with the latest sats/unlocked so we don't race the other persist effect.
  // Also push the result to the backend so it can queue a pending reward.
  useEffect(() => {
    if (phase !== 'reveal' || !profile || levelStartRef.current == null) return
    if (!hydratedRef.current) return
    const timeMs = Date.now() - levelStartRef.current
    setProgress(prev => {
      const base = prev || { sats: 0, unlockedUpTo: 0, levels: {} }
      const merged = { ...base, sats, unlockedUpTo }
      const next = recordLevelResult(merged, levelIdx, {
        sats: lastEarned,
        timeMs,
      })
      saveProgress(next)
      // Fire-and-forget upstream sync; backend will record a pending reward
      // for any newly-completed level.
      syncProgress(next, profile).catch(() => {})
      return next
    })
  }, [phase, lastEarned]) // eslint-disable-line

  // Best-effort cloud sync when we come back online (currently a no-op stub)
  useEffect(() => {
    if (!profile) return
    const unsub = onOnline(() => {
      const g = loadProgress()
      syncProgress(g, profile).catch(() => {})
    })
    return unsub
  }, [profile])

  return {
    // common
    phase, avatar, username, profile, progress,
    level, levelIdx,
    sats, unlockedUpTo, lastEarned,
    goNext, jumpTo, chooseAvatar, resumeProfile, restoreFromProfile, resetEverything, updateProfile,
    goToMap, goToWallet, goToHome, goToLeaderboard, goToProfile,
    goToCelebrate, closeCelebrate, earnShareSats,

    // match game
    matched, selImg, selWord, wrongFlash,
    matchedCount, totalPairs,
    shuffledImgs, shuffledWords,
    pickImg, pickWord, tryMatch,

    // word hunt game
    huntWords, huntPicked, huntTimeLeft, huntRunning, huntResult,
    huntRealFound, huntRealTotal,
    pickHuntWord,
  }
}
