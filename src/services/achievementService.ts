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
  process.env.NEXT_PUBLIC_ACHIEVEMENTS_API_URL ?? "/api/backend";

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

	// Coba parse sebagai JSON. Kalau gagal karena plain text, kembalikan teks aslinya.
	try {
		return JSON.parse(bodyText) as T;
	} catch {
		return bodyText as unknown as T;
	}
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

/** GET /api/achievements/progress/{userId} */
export async function getInProgressAchievements(userId: string): Promise<import("@/types/achievement").UserAchievementProgressDto[]> {
  return api<import("@/types/achievement").UserAchievementProgressDto[]>(`/api/achievements/progress/${encodeURIComponent(userId)}`);
}

/** GET /api/achievements/missions/{userId} */
export async function getUserDailyMissions(userId: string): Promise<import("@/types/achievement").UserDailyMissionDto[]> {
  return api<import("@/types/achievement").UserDailyMissionDto[]>(`/api/achievements/missions/${encodeURIComponent(userId)}`);
}

// ─── Admin Master Data API ──────────────────────────────────

/** GET /api/admin/master/achievements */
export async function getAdminAchievements(): Promise<AchievementMasterDto[]> {
  return api<AchievementMasterDto[]>("/api/admin/master/achievements");
}

/** POST /api/admin/master/achievements */
export async function createAdminAchievement(data: AchievementMasterDto): Promise<AchievementMasterDto> {
  return api<AchievementMasterDto>("/api/admin/master/achievements", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PUT /api/admin/master/achievements/{id} */
export async function updateAdminAchievement(id: string, data: AchievementMasterDto): Promise<AchievementMasterDto> {
  return api<AchievementMasterDto>(`/api/admin/master/achievements/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/** DELETE /api/admin/master/achievements/{id} */
export async function deleteAdminAchievement(id: string): Promise<void> {
  return api<void>(`/api/admin/master/achievements/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/** GET /api/admin/master/missions */
export async function getAdminMissions(): Promise<import("@/types/achievement").DailyMissionMasterDto[]> {
  return api<import("@/types/achievement").DailyMissionMasterDto[]>("/api/admin/master/missions");
}

/** POST /api/admin/master/missions */
export async function createAdminMission(data: import("@/types/achievement").DailyMissionMasterDto): Promise<import("@/types/achievement").DailyMissionMasterDto> {
  return api<import("@/types/achievement").DailyMissionMasterDto>("/api/admin/master/missions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PUT /api/admin/master/missions/{id} */
export async function updateAdminMission(id: string, data: import("@/types/achievement").DailyMissionMasterDto): Promise<import("@/types/achievement").DailyMissionMasterDto> {
  return api<import("@/types/achievement").DailyMissionMasterDto>(`/api/admin/master/missions/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/** DELETE /api/admin/master/missions/{id} */
export async function deleteAdminMission(id: string): Promise<void> {
  return api<void>(`/api/admin/master/missions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
