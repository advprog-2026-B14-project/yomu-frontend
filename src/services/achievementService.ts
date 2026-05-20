/**
 * API service layer for the Achievements & Gamification module.
 *
 * Endpoints consumed (see AchievementController.java):
 *   GET  /api/achievements/profile/{userId}
 *   POST /api/achievements/pin
 */

import type {
  AchievementMasterDto,
  PinAchievementRequest,
  UserProfileResponse,
} from "@/types/achievement";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend";

/** Resolves a path against the configured API base URL. */
const toUrl = (path: string): string =>
  `${API_BASE_URL.replace(/\/$/, "")}${path}`;

/**
 * Generic fetch wrapper matching the pattern used in BacaanKuisModule.
 * Adds Content-Type when a body is present, throws on non-2xx responses,
 * and returns parsed JSON (or null for 204 / empty bodies).
 */
async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(toUrl(path), { ...options, headers });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      // Read as text first to avoid "body stream already read" error
      const bodyText = await response.text();
      if (bodyText) {
        try {
          const payload = JSON.parse(bodyText);
          if (payload.message) {
            message = payload.message;
          }
        } catch {
          message = bodyText;
        }
      }
    } catch {
      // If even .text() fails, keep the default HTTP status message
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  const bodyText = await response.text();
  if (!bodyText) {
    return null as T;
  }

  return JSON.parse(bodyText) as T;
}

// ─── Public API ──────────────────────────────────────────────

/** GET /api/achievements/profile/{userId} */
export async function getUserProfile(
  userId: string,
): Promise<UserProfileResponse> {
  return api<UserProfileResponse>(
    `/api/achievements/profile/${encodeURIComponent(userId)}`,
  );
}

/** POST /api/achievements/pin */
export async function pinAchievement(
  request: PinAchievementRequest,
): Promise<string> {
  return api<string>("/api/achievements/pin", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/** GET /api/achievements/master */
export async function getAllAchievements(): Promise<AchievementMasterDto[]> {
  return api<AchievementMasterDto[]>("/api/achievements/master");
}

/** GET /api/achievements/unlocked/{userId} */
export async function getUnlockedAchievements(userId: string): Promise<AchievementMasterDto[]> {
  return api<AchievementMasterDto[]>(`/api/achievements/unlocked/${encodeURIComponent(userId)}`);
}
