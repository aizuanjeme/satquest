/*
  APIClient — single entry point for all backend access in frontend3.

  It re-exports the battle-tested request logic copied verbatim from the
  original frontend (src/lib/api.js) so API compatibility is guaranteed:
  same relative `/api/...` paths, same DTOs, same error shape.
*/
import {
  profileApi,
  progressApi,
  rewardsApi,
  configApi,
  lightningApi,
  leaderboardApi,
  feedbackApi,
  healthApi,
} from '../lib/api'

export const APIClient = {
  profile: profileApi,
  progress: progressApi,
  rewards: rewardsApi,
  config: configApi,
  lightning: lightningApi,
  leaderboard: leaderboardApi,
  feedback: feedbackApi,
  health: healthApi,
}

export {
  profileApi,
  progressApi,
  rewardsApi,
  configApi,
  lightningApi,
  leaderboardApi,
  feedbackApi,
  healthApi,
}
