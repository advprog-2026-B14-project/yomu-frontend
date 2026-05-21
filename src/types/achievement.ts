/**
 * TypeScript interfaces mirroring the backend DTOs in
 * yomu-achievements/src/main/java/id/ac/ui/cs/advprog/yomuachievement/dto/
 *
 * These MUST stay in sync with the Java contracts.
 */

/** Mirrors PinnedAchievementDto.java */
export interface PinnedAchievementDto {
  id: string; // UUID serialised as string by Jackson
  nama: string;
  deskripsi: string;
  milestoneTarget: number;
  poinReward: number;
  pinOrder: number;
}

/** Mirrors UserProfileResponse.java */
export interface UserProfileResponse {
  userId: string;
  level: number;
  totalPoints: number;
  pinnedAchievements: PinnedAchievementDto[];
}

/** Mirrors PinAchievementRequest.java */
export interface PinAchievementRequest {
  userId: string;
  achievementId: string; // UUID as string
  pinOrder: number;
}

/** Master achievement DTO for dropdown selection and admin */
export interface AchievementMasterDto {
  id?: string;
  nama: string;
  deskripsi: string;
  milestoneTarget: number;
  poinReward: number;
  milestoneType: string;
  badgeUrl: string;
}

/** Master daily mission DTO for admin */
export interface DailyMissionMasterDto {
  id?: string;
  namaMisi: string;
  milestoneTarget: number;
  poinReward: number;
}

/** In-progress achievement DTO */
export interface UserAchievementProgressDto {
  achievementId: string;
  nama: string;
  deskripsi: string;
  milestoneTarget: number;
  currentProgress: number;
  badgeUrl: string;
}

/** User daily mission DTO */
export interface UserDailyMissionDto {
  missionId: string;
  namaMisi: string;
  milestoneTarget: number;
  progress: number;
  isCompleted: boolean;
  poinReward: number;
}
