import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { LEVELS, AVATARS, shuffle, resolveAvatarId } from '../data/levels'
import { topReviewConcepts } from '../data/concepts'
import { pickSeedWords } from '../data/seedWords'
import {
  loadProfile, saveProfile, clearProfile,
  loadProgress, saveProgress, recordLevelResult, syncProgress,
  pullProgress, onOnline, mergeMissedConcepts, getDeviceId,
} from '../lib/storage'
import { profileApi, rewardsApi } from '../lib/api'
import { SHARE_REWARD_FALLBACK } from '../screens/ShareEarn'

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
  const [levelIdx, setLevelIdx]     = useState(Math.min(initialProgress?.unlockedUpTo || 0, Math.max(0, LEVELS.length - 1)))
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

  // Spaced repetition: concepts the player got wrong during the CURRENT level.
  // Flushed into progress.missedConcepts when the level is recorded (reveal).
  const missesRef = useRef({})
  const bumpMisses = useCallback((concepts) => {
    const list = Array.isArray(concepts) ? concepts : (concepts ? [concepts] : [])
    list.forEach((c) => { if (c) missesRef.current[c] = (missesRef.current[c] || 0) + 1 })
  }, [])

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

  // Generic "level done" — pass earnedSats (defaults to the level's full point reward)
  const finishLevel = useCallback((earnedSats = (level.points ?? level.sats)) => {
    setTimeout(() => {
      // On a replay, only award the difference above the previous best so
      // the running total never inflates from re-playing completed levels.
      const prevBest = progress?.levels?.[levelIdx]?.sats ?? null
      const satsToAdd = prevBest === null
        ? earnedSats                           // first clear — add full amount
        : Math.max(0, earnedSats - prevBest)   // replay — only the improvement
      setSats(s => {
        const next = s + satsToAdd
        return isNaN(next) ? s : next          // guard against NaN
      })
      setLastEarned(earnedSats)
      // Unlock the next level immediately so progress is persisted even if
      // the player navigates away before dismissing the Celebrate screen.
      setUnlocked(u => Math.max(u, levelIdx + 1))
      setPhase('reveal')
    }, 450)
  }, [level.points, level.sats, levelIdx, progress])

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
      bumpMisses(level.concepts)
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
     CROSSOVER QUIZ (type === 'crossover')
     level.questions: array of { q, options, answer (0-based index) }
     level.timeLimit: seconds for the whole quiz
     level.passMark:  0–1 fraction required to pass (e.g. 0.7)
     ========================================================================= */
  const [quizCurrent,  setQuizCurrent]  = useState(0)   // index of current question
  const [quizAnswers,  setQuizAnswers]  = useState([])   // chosen option index per question
  const [quizPicked,   setQuizPicked]   = useState(null) // last chosen option (for sound)
  const [quizTimeLeft, setQuizTimeLeft] = useState(0)
  const [quizRunning,  setQuizRunning]  = useState(false)
  const [quizResult,   setQuizResult]   = useState(null) // 'pass' | 'fail' | null
  const [quizCorrect,  setQuizCorrect]  = useState(0)
  const quizTimerRef = useRef(null)

  const quizTotal    = (level.questions || []).length
  const quizPassMark = level.passMark || 0.7

  // Start timer when entering a crossover level
  useEffect(() => {
    if (level.type !== 'crossover' || phase !== 'playing') {
      if (quizTimerRef.current) clearInterval(quizTimerRef.current)
      return
    }
    setQuizTimeLeft(level.timeLimit || 90)
    setQuizRunning(true)
    setQuizResult(null)
    quizTimerRef.current = setInterval(() => {
      setQuizTimeLeft(t => {
        if (t <= 1) {
          clearInterval(quizTimerRef.current)
          setQuizRunning(false)
          // Score whatever has been answered so far
          setQuizResult(prev => {
            // only resolve if not already resolved
            if (prev) return prev
            return 'timeout-resolve'
          })
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(quizTimerRef.current)
  }, [levelIdx, phase]) // eslint-disable-line

  // When quizResult is 'timeout-resolve', compute pass/fail from answers so far
  useEffect(() => {
    if (quizResult !== 'timeout-resolve') return
    const questions = level.questions || []
    let correct = 0
    quizAnswers.forEach((ans, idx) => {
      if (ans === questions[idx]?.answer) correct++
    })
    const passing = Math.ceil(questions.length * quizPassMark)
    const result  = correct >= passing ? 'pass' : 'fail'
    setQuizCorrect(correct)
    setQuizResult(result)
    finishLevel(result === 'pass' ? level.sats : 0)
  }, [quizResult]) // eslint-disable-line

  const pickQuizAnswer = useCallback((optionIdx) => {
    if (!quizRunning) return
    const questions = level.questions || []
    if (quizCurrent >= questions.length) return

    const chosen  = optionIdx
    const correct = questions[quizCurrent].answer
    const isRight = chosen === correct

    if (!isRight) bumpMisses(questions[quizCurrent].concept || level.concepts)

    setQuizPicked(chosen)
    const nextAnswers = [...quizAnswers, chosen]
    setQuizAnswers(nextAnswers)
    const nextCorrect = quizCorrect + (isRight ? 1 : 0)
    setQuizCorrect(nextCorrect)
    const nextIdx = quizCurrent + 1
    setQuizCurrent(nextIdx)

    // All questions answered — resolve
    if (nextIdx >= questions.length) {
      clearInterval(quizTimerRef.current)
      setQuizRunning(false)
      const passing = Math.ceil(questions.length * quizPassMark)
      const result  = nextCorrect >= passing ? 'pass' : 'fail'
      setQuizResult(result)
      finishLevel(result === 'pass' ? level.sats : 0)
    }
  }, [quizRunning, quizCurrent, quizAnswers, quizCorrect, quizPassMark, level, finishLevel])

  const retryQuiz = useCallback(() => {
    setQuizCurrent(0)
    setQuizAnswers([])
    setQuizPicked(null)
    setQuizCorrect(0)
    setQuizResult(null)
    setQuizTimeLeft(level.timeLimit || 90)
    setQuizRunning(true)
    clearInterval(quizTimerRef.current)
    quizTimerRef.current = setInterval(() => {
      setQuizTimeLeft(t => {
        if (t <= 1) {
          clearInterval(quizTimerRef.current)
          setQuizRunning(false)
          setQuizResult('timeout-resolve')
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [level])

  /* =========================================================================
     SCAM SPOTTER (type === 'scamspot')
     level.scenarios: [{ id, prompt, emoji, answer: 'scam'|'safe', why }]
     The player decides whether each situation is a SCAM or SAFE, then sees why.
     ========================================================================= */
  const [scamCurrent, setScamCurrent] = useState(0)
  const [scamPicked,  setScamPicked]  = useState(null) // 'scam' | 'safe' | null (current scenario)
  const [scamCorrect, setScamCorrect] = useState(0)
  const [scamResult,  setScamResult]  = useState(null) // 'pass' | 'fail' | null
  const scamTotal = (level.scenarios || []).length

  const pickScamAnswer = useCallback((choice) => {
    if (scamPicked) return
    const sc = (level.scenarios || [])[scamCurrent]
    if (!sc) return
    setScamPicked(choice)
    if (choice === sc.answer) setScamCorrect(c => c + 1)
    else bumpMisses(level.concepts)
  }, [scamPicked, scamCurrent, level, bumpMisses])

  const advanceScam = useCallback(() => {
    const scenarios = level.scenarios || []
    const nextIdx = scamCurrent + 1
    setScamPicked(null)
    if (nextIdx >= scenarios.length) {
      const passing = Math.ceil(scenarios.length * (level.passMark || 0.7))
      const result = scamCorrect >= passing ? 'pass' : 'fail'
      setScamResult(result)
      finishLevel(result === 'pass' ? level.sats : 0)
    } else {
      setScamCurrent(nextIdx)
    }
  }, [scamCurrent, scamCorrect, level, finishLevel])

  const retryScam = useCallback(() => {
    setScamCurrent(0)
    setScamPicked(null)
    setScamCorrect(0)
    setScamResult(null)
  }, [])

  /* =========================================================================
     SEED ORDER (type === 'seedorder')
     The player first READS a phrase (study phase), then taps the shuffled
     words back into the same order. The target phrase is generated at random
     from a word pool each play (unless level.seed pins a fixed phrase and
     level.random is not set), so it stays fresh and teaches "order matters".
     ========================================================================= */
  const [seedStudying, setSeedStudying] = useState(true)  // read phase first
  const [seedPlaced, setSeedPlaced] = useState([]) // words placed so far, in order
  const [seedWrong,  setSeedWrong]  = useState(null) // word currently flashing wrong
  const [seedResult, setSeedResult] = useState(null) // 'win' | null

  // The correct ordered phrase for this attempt.
  const seedTarget = useMemo(() => {
    if (level.type !== 'seedorder') return []
    const count = level.count || (level.seed ? level.seed.length : 12)
    if (level.seed && !level.random) return level.seed
    return pickSeedWords(count)
  }, [levelIdx]) // eslint-disable-line

  const seedShuffled = useMemo(() => {
    if (level.type !== 'seedorder') return []
    return shuffle([...seedTarget])
  }, [seedTarget])

  const seedTotal = seedTarget.length

  // Leave the read phase and begin arranging.
  const startSeedArrange = useCallback(() => setSeedStudying(false), [])

  const pickSeedWord = useCallback((word) => {
    if (seedResult || seedStudying) return
    const seq = seedTarget
    if (seedPlaced.includes(word)) return
    const expected = seq[seedPlaced.length]
    if (word === expected) {
      const next = [...seedPlaced, word]
      setSeedPlaced(next)
      if (next.length >= seq.length) {
        setSeedResult('win')
        finishLevel(level.sats)
      }
    } else {
      bumpMisses(level.concepts)
      setSeedWrong(word)
      setTimeout(() => setSeedWrong(null), 450)
    }
  }, [seedPlaced, seedResult, seedStudying, seedTarget, level, finishLevel, bumpMisses])

  const undoSeedWord = useCallback(() => {
    if (seedResult) return
    setSeedPlaced(prev => prev.slice(0, -1))
  }, [seedResult])

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
    setQuizCurrent(0)
    setQuizAnswers([])
    setQuizPicked(null)
    setQuizCorrect(0)
    setQuizResult(null)
    setQuizTimeLeft(0)
    setQuizRunning(false)
    if (quizTimerRef.current) clearInterval(quizTimerRef.current)
    setScamCurrent(0)
    setScamPicked(null)
    setScamCorrect(0)
    setScamResult(null)
    setSeedPlaced([])
    setSeedWrong(null)
    setSeedResult(null)
    setSeedStudying(true)
    missesRef.current = {}
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
    profileApi.create({ username: uname, avatarId: av.id, deviceId: getDeviceId() })
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
    setLevelIdx(Math.min(g.unlockedUpTo || 0, LEVELS.length - 1))
    hydratedRef.current = true
    setPhase('map')

    // Idempotent backend sync: if the profile already exists, the server
    // returns 409 — which we treat as success. If it doesn't (new device,
    // wiped DB), this re-creates it and mints a fresh Lightning wallet.
    profileApi.create({ username: existing.username, avatarId: existing.avatarId, deviceId: getDeviceId() })
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
    setLevelIdx(Math.min(merged.unlockedUpTo, LEVELS.length - 1))
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
  const goToLarp        = useCallback(() => setPhase('larp'), [])

  // Award sats for sharing a level on social media.
  // Idempotent: only earns once per level (tracked in localStorage by ShareEarn).
  // The amount is sourced from the backend app_config (passed in by ShareEarn);
  // the server credits the authoritative bonus, this is the optimistic local add.
  const earnShareSats = useCallback((pts = SHARE_REWARD_FALLBACK) => {
    const amount = Number(pts) || SHARE_REWARD_FALLBACK
    setSats(s => s + amount)
    if (profile && hydratedRef.current) {
      const current = loadProgress()
      const updated = { ...current, sats: (current.sats || 0) + amount }
      saveProgress(updated)
      syncProgress(updated, profile).catch(() => {})
      // Create a pending reward row so the share bonus is included in Lightning claim
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
      // Spaced repetition: fold this level's misses + mastery decay in.
      next.missedConcepts = mergeMissedConcepts(
        base.missedConcepts,
        missesRef.current,
        level?.concepts,
      )
      missesRef.current = {}
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
    goToMap, goToWallet, goToHome, goToLeaderboard, goToProfile, goToLarp,
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

    // crossover quiz
    quizCurrent, quizAnswers, quizPicked, quizTimeLeft, quizRunning, quizResult,
    quizCorrect, quizTotal, quizPassMark,
    pickQuizAnswer, retryQuiz,

    // scam spotter
    scamCurrent, scamPicked, scamCorrect, scamResult, scamTotal,
    pickScamAnswer, advanceScam, retryScam,

    // seed order
    seedShuffled, seedPlaced, seedWrong, seedResult, seedTotal,
    seedStudying, seedTarget, startSeedArrange,
    pickSeedWord, undoSeedWord,

    // spaced repetition
    reviewConcepts: topReviewConcepts(progress?.missedConcepts, 3),
  }
}
