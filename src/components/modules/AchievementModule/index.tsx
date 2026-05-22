"use client";

import { useEffect, useState } from "react";
import {
  getUserProfile,
  pinAchievement,
  getUnlockedAchievements,
  getUserDailyMissions,
  getAllAchievementsWithProgress,
} from "@/services/achievementService";
import type {
  PinnedAchievementDto,
  UserProfileResponse,
  AchievementMasterDto,
  UserAchievementProgressDto,
  UserDailyMissionDto,
} from "@/types/achievement";

// ─── Design‑system tokens (identical to BacaanKuisModule) ───

const shell =
  "min-h-screen bg-[radial-gradient(circle_at_top_left,#ccfbf1_0,#ffffff_30%,#f8fafc_72%)] text-slate-900";

const panel =
  "rounded-2xl border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur";

const subtlePanel =
  "rounded-2xl border border-slate-200 bg-white shadow-sm";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

const primary =
  "rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300";

const secondary =
  "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 disabled:translate-y-0 disabled:cursor-not-allowed disabled:text-slate-400";

// ─── Achievement badge icons ────────────────────────────────

const ACHIEVEMENT_ICONS = ["🏆", "⭐", "🎯", "🔥", "💎", "🚀"] as const;

// ─── Main Module ────────────────────────────────────────────

export const AchievementModule = () => {
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinForm, setPinForm] = useState({ achievementId: "", pinOrder: "1" });
  const [pinLoading, setPinLoading] = useState(false);
  const [availableAchievements, setAvailableAchievements] = useState<
    AchievementMasterDto[]
  >([]);
  const [missions, setMissions] = useState<UserDailyMissionDto[]>([]);
  const [masterAchievements, setMasterAchievements] = useState<(AchievementMasterDto & { isUnlocked?: boolean; currentProgress?: number })[]>([]);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 2500);
  };

  const fetchProfile = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserProfile(id);
      setProfile(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Gagal memuat profil.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnlockedAchievements = async (id: string) => {
    try {
      const data = await getUnlockedAchievements(id);
      setAvailableAchievements(data || []);
    } catch (err) {
      console.error("Gagal memuat daftar achievement:", err);
    }
  };

  const fetchProgressData = async (id: string) => {
    try {
      const [miss, achs] = await Promise.all([
        getUserDailyMissions(id),
        getAllAchievementsWithProgress(id),
      ]);
      setMissions(miss || []);
      setMasterAchievements(achs || []);
    } catch (err) {
      console.error("Gagal memuat progress data:", err);
    }
  };

  useEffect(() => {
    const authId = typeof window !== "undefined" ? localStorage.getItem("userId") || "UID_FROM_AUTH_SESSION" : "UID_FROM_AUTH_SESSION";
    setUserId(authId);
    const timer = window.setTimeout(() => {
      fetchProfile(authId);
      fetchUnlockedAchievements(authId);
      fetchProgressData(authId);
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pinnedCount = profile?.pinnedAchievements?.length ?? 0;
  const levelPercent = profile
    ? Math.min(100, ((profile.totalPoints % 1000) / 1000) * 100)
    : 0;
  const xpToNext = profile ? 1000 - (profile.totalPoints % 1000) : 0;

  // ── Render ──

  return (
		<div className={shell}>
			<div className="mx-auto flex min-h-screen w-full max-w-7xl gap-4 px-4 py-4 lg:px-6">
				{/* ─── Sidebar ─── */}
				<aside
					className={`${panel} sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 p-4 lg:block`}
				>
					{/* Logo */}
					<div className="mb-8 flex items-center gap-3">
						<div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-700 text-lg font-black text-white">
							Y
						</div>
						<div>
							<p className="text-lg font-black tracking-tight">Yomu</p>
							<p className="text-xs font-semibold text-slate-500">
								Learning OS
							</p>
						</div>
					</div>



					{/* Level Progress Card (sidebar) */}
					<div className="mt-8 rounded-2xl bg-slate-950 p-4 text-white">
						<p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
							Level Progress
						</p>
						{loading ? (
							<div className="mt-3 space-y-2">
								<div className="h-7 w-24 animate-pulse rounded-lg bg-white/10" />
								<div className="h-2 animate-pulse rounded-full bg-white/10" />
								<div className="h-3 w-36 animate-pulse rounded bg-white/10" />
							</div>
						) : profile ? (
							<>
								<p className="mt-2 text-2xl font-black">
									Level {profile.level}
								</p>
								<div className="mt-3 h-2 rounded-full bg-white/15">
									<div
										className="h-2 rounded-full bg-amber-300 transition-all duration-700"
										style={{ width: `${levelPercent}%` }}
									/>
								</div>
								<p className="mt-2 text-xs text-slate-300">
									{xpToNext} XP menuju level berikutnya
								</p>
							</>
						) : (
							<>
								<p className="mt-2 text-2xl font-black">Level —</p>
								<div className="mt-3 h-2 rounded-full bg-white/15" />
								<p className="mt-2 text-xs text-slate-300">
									Masukkan User ID untuk memuat data
								</p>
							</>
						)}
					</div>
				</aside>

				{/* ─── Main Content ─── */}
				<main className="min-w-0 flex-1">
					{/* Header */}
					<header
						className={`${panel} mb-4 flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between`}
					>
						<div>
							<p className="text-sm font-bold text-emerald-700">
								Selamat belajar, {userId.trim() || "Learner"}
							</p>
							<h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
								Achievement &amp; Gamification
							</h1>
						</div>
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
							<input
								id="userId-input"
								value={userId}
								onChange={(e) => setUserId(e.target.value)}
								placeholder="User ID"
								className={`${inputClass} sm:w-48`}
							/>
              <button
                id="sync-btn"
                type="button"
                className={secondary}
                disabled={loading || !userId.trim()}
                onClick={() => {
                  fetchProfile(userId.trim());
                  fetchUnlockedAchievements(userId.trim());
                  fetchProgressData(userId.trim());
                }}
              >
                {loading ? "Memuat…" : "Sync Data"}
              </button>
						</div>
					</header>

					{/* Error Banner */}
					{error && (
						<div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
							{error}
						</div>
					)}

					{/* Stats Row */}
					<section className="mb-4 grid gap-3 md:grid-cols-4">
						{loading ? (
							<>
								<SkeletonStatCard />
								<SkeletonStatCard />
								<SkeletonStatCard />
								<SkeletonStatCard />
							</>
						) : (
							<>
								<StatCard
									label="Level"
									value={profile?.level ?? "—"}
									tone="emerald"
								/>
								<StatCard
									label="Total XP"
									value={
										profile ? profile.totalPoints.toLocaleString("id-ID") : "—"
									}
									tone="amber"
								/>
								<StatCard label="Pinned" value={pinnedCount} tone="teal" />
								<StatCard
									label="Status"
									value={
										profile
											? pinnedCount >= 3
												? "Lengkap"
												: "Belum Penuh"
											: "—"
									}
									tone="purple"
								/>
							</>
						)}
					</section>

					{/* Mobile tab (for consistency with BacaanKuis) */}
					<div className="mb-4 grid grid-cols-4 gap-2 rounded-2xl bg-slate-100 p-1.5 md:hidden">
						{[
							["/bacaan-kuis", "Bacaan"],
							["/achievement", "Achievement"],
							["/diskusi-forum", "Forum"],
							["/interaksi-sosial-liga", "Liga"],
						].map(([href, label]) => {
							const isActive = href === "/achievement";
							return (
								<a
									key={href}
									href={href}
									className={`rounded-xl px-3 py-2 text-center text-sm font-bold ${
										isActive
											? "bg-white text-emerald-700 shadow-sm"
											: "text-slate-600"
									}`}
								>
									{label}
								</a>
							);
						})}
					</div>

					{/* ─── Gamification Header Section ─── */}
					<section className="mb-4 grid gap-4 xl:grid-cols-[1fr_320px] xl:items-start">
						{/* Left — Pinned Achievements */}
						<div className={`${panel} p-5`}>
							<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
								<div>
									<p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
										Showcase
									</p>
									<h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
										Pinned Achievements
									</h2>
									<p className="mt-1.5 text-sm leading-6 text-slate-500">
										Tampilkan hingga 3 achievement terbaik di profil kamu.
									</p>
								</div>
								<button
									id="open-pin-modal-btn"
									type="button"
									className={primary}
									onClick={() => setShowPinModal(true)}
								>
									Ubah Pin Profil
								</button>
							</div>

							{loading ? (
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
									<SkeletonAchievementCard />
									<SkeletonAchievementCard />
									<SkeletonAchievementCard />
								</div>
							) : profile &&
							  profile.pinnedAchievements &&
							  profile.pinnedAchievements.length > 0 ? (
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
									{profile.pinnedAchievements.slice(0, 3).map((ach, idx) => (
										<AchievementCard
											key={ach.id}
											achievement={ach}
											index={idx}
										/>
									))}
								</div>
							) : (
								<EmptyState
									title="Belum ada achievement di-pin"
									description='Klik "Ubah Pin Profil" untuk menampilkan achievement favorit kamu.'
								/>
							)}
						</div>

						{/* Right — XP Summary Sidebar */}
						<aside className="space-y-4">
							{/* XP Overview */}
							<div className={`${panel} p-5`}>
								<p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
									XP Overview
								</p>
								{loading ? (
									<div className="mt-4 space-y-3">
										<div className="h-20 animate-pulse rounded-3xl bg-slate-100" />
										<div className="h-3 animate-pulse rounded-full bg-slate-100" />
									</div>
								) : (
									<>
										<div className="mt-4 grid place-items-center rounded-3xl bg-slate-950 p-6 text-white">
											<div className="text-center">
												<p className="text-5xl font-black">
													{profile
														? profile.totalPoints.toLocaleString("id-ID")
														: "—"}
												</p>
												<p className="mt-1 text-sm text-slate-300">Total XP</p>
											</div>
										</div>
										{profile && (
											<>
												<div className="mt-4 h-3 rounded-full bg-slate-100">
													<div
														className="h-3 rounded-full bg-emerald-600 transition-all duration-700"
														style={{ width: `${levelPercent}%` }}
													/>
												</div>
												<p className="mt-2 text-xs text-slate-500">
													{xpToNext} XP lagi menuju Level {profile.level + 1}
												</p>
											</>
										)}
									</>
								)}
							</div>

							{/* Pinned Summary */}
							<div className={`${panel} p-5`}>
								<p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
									Pinned Summary
								</p>
								<div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
									<p className="font-black text-amber-950">
										{pinnedCount}/3 Slot Terisi
									</p>
									<p className="mt-1 text-sm text-amber-800">
										{pinnedCount >= 3
											? "Semua slot pin achievement sudah terisi!"
											: `Kamu masih bisa menambahkan ${3 - pinnedCount} achievement lagi.`}
									</p>
								</div>
								{profile &&
									profile.pinnedAchievements &&
									profile.pinnedAchievements.length > 0 && (
										<div className="mt-4 space-y-2">
											{profile.pinnedAchievements
												.slice(0, 3)
												.map((ach, idx) => (
													<div
														key={ach.id}
														className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2"
													>
														<span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-sm">
															{
																ACHIEVEMENT_ICONS[
																	idx % ACHIEVEMENT_ICONS.length
																]
															}
														</span>
														<div className="min-w-0">
															<p className="truncate text-xs font-black text-slate-900">
																{ach.nama}
															</p>
															<p className="text-[10px] text-slate-500">
																+{ach.poinReward} XP
															</p>
														</div>
													</div>
												))}
										</div>
									)}
							</div>
						</aside>
					</section>

          {/* ─── Phase 2: Daily Missions & In Progress Achievements ─── */}
          <section className="mb-4 grid gap-4 xl:grid-cols-2">
            {/* Left — Daily Missions */}
            <div className={`${panel} p-5`}>
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Daily</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Misi Harian</h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  Kerjakan misi harian untuk mendapatkan bonus XP. Reset setiap hari.
                </p>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <SkeletonMissionCard />
                  <SkeletonMissionCard />
                </div>
              ) : missions.length > 0 ? (
                <div className="space-y-3">
                  {missions.map((mission) => {
                    const percent = Math.min(100, Math.round((mission.progress / mission.milestoneTarget) * 100));
                    return (
                      <div key={mission.missionId} className={`${subtlePanel} p-4 flex flex-col gap-3 transition hover:shadow-md`}>
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <h3 className="text-sm font-black text-slate-900">{mission.namaMisi}</h3>
                            <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">+{mission.poinReward} XP</p>
                          </div>
                          {mission.isCompleted ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700 border border-emerald-200">
                              Selesai
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500 border border-slate-200">
                              {mission.progress}/{mission.milestoneTarget}
                            </span>
                          )}
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-700 ${mission.isCompleted ? 'bg-emerald-500' : 'bg-amber-400'}`} 
                            style={{ width: `${percent}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="Belum ada misi" description="Misi harianmu belum tersedia." />
              )}
            </div>

            {/* Right — Master List */}
            <div className={`${panel} p-5`}>
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Catalog</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Master Achievements</h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  Daftar seluruh achievement yang bisa kamu capai.
                </p>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <SkeletonMissionCard />
                  <SkeletonMissionCard />
                </div>
              ) : masterAchievements.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {masterAchievements.map((ach) => {
                    const percent = Math.min(100, Math.round(((ach.currentProgress ?? 0) / ach.milestoneTarget) * 100));
                    const isLockedAndUnstarted = !ach.isUnlocked && (ach.currentProgress === 0 || ach.currentProgress === undefined);
                    return (
                      <div key={ach.id} className={`${subtlePanel} p-4 flex flex-col gap-3 transition hover:shadow-md ${isLockedAndUnstarted ? "opacity-50 grayscale" : ""}`}>
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <h3 className="text-sm font-black text-slate-900">{ach.nama}</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{ach.deskripsi}</p>
                          </div>
                          {ach.isUnlocked ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700 border border-emerald-200 shrink-0">
                              Unlocked
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500 border border-slate-200 shrink-0">
                              {ach.currentProgress ?? 0}/{ach.milestoneTarget}
                            </span>
                          )}
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full transition-all duration-700 ${ach.isUnlocked ? 'bg-emerald-500' : 'bg-emerald-400'}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="Tidak ada target" description="Katalog achievement kosong." />
              )}
            </div>
          </section>

				</main>
			</div>

			{/* ─── Pin Achievement Modal ─── */}
			{showPinModal && (
				<div
					id="pin-modal-overlay"
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
					onClick={(e) => {
						if (e.target === e.currentTarget) setShowPinModal(false);
					}}
				>
					<div
						className={`${panel} w-full max-w-lg p-6 mx-4 animate-[fade-in-up_280ms_ease_both]`}
					>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
									Manage Pins
								</p>
								<h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
									Ubah Pin Profil
								</h2>
							</div>
							<button
								id="close-pin-modal-btn"
								type="button"
								onClick={() => setShowPinModal(false)}
								className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
								aria-label="Tutup modal"
							>
								✕
							</button>
						</div>

						{/* Current pin slots */}
						<div className="mt-6 grid grid-cols-3 gap-3">
							{[1, 2, 3].map((slot) => {
								const pinned =
									profile?.pinnedAchievements?.find(
										(a) => a.pinOrder === slot,
									) ?? null;
								return (
									<div
										key={slot}
										className={`rounded-2xl border-2 border-dashed p-4 transition ${
											pinned
												? "border-emerald-300 bg-emerald-50"
												: "border-slate-300 bg-white"
										}`}
									>
										<p className="text-2xl">
											{pinned
												? ACHIEVEMENT_ICONS[
														(slot - 1) % ACHIEVEMENT_ICONS.length
													]
												: "➕"}
										</p>
										<p className="mt-2 text-xs font-bold text-slate-600">
											{pinned ? pinned.nama : `Slot ${slot}`}
										</p>
									</div>
								);
							})}
						</div>

						{/* Pin form */}
						<form
							className="mt-6 space-y-4"
							onSubmit={async (e) => {
								e.preventDefault();
								if (!pinForm.achievementId.trim()) {
									showToast("Achievement ID wajib diisi", "error");
									return;
								}
								setPinLoading(true);
								try {
									await pinAchievement({
										userId: userId.trim(),
										achievementId: pinForm.achievementId.trim(),
										pinOrder: Number(pinForm.pinOrder),
									});
									showToast("Achievement berhasil di-pin!");
									setPinForm({ achievementId: "", pinOrder: "1" });
									setShowPinModal(false);
									await fetchProfile(userId.trim());
								} catch (err) {
									const msg =
										err instanceof Error ? err.message : "Gagal menyimpan pin.";
									showToast(msg, "error");
								} finally {
									setPinLoading(false);
								}
							}}
						>
							<div>
								<label
									htmlFor="pin-achievement-id"
									className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500"
								>
									Pilih Achievement
								</label>
								<select
									id="pin-achievement-id"
									value={pinForm.achievementId}
									onChange={(e) =>
										setPinForm((prev) => ({
											...prev,
											achievementId: e.target.value,
										}))
									}
									className={inputClass}
								>
									<option value="" disabled>
										Pilih achievement untuk di-pin
									</option>
									{availableAchievements.map((ach) => (
										<option key={ach.id} value={ach.id}>
											{ach.nama}
										</option>
									))}
								</select>
							</div>
							<div>
								<label
									htmlFor="pin-order"
									className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500"
								>
									Pin Order (Slot)
								</label>
								<select
									id="pin-order"
									value={pinForm.pinOrder}
									onChange={(e) =>
										setPinForm((prev) => ({
											...prev,
											pinOrder: e.target.value,
										}))
									}
									className={inputClass}
								>
									<option value="1">Slot 1</option>
									<option value="2">Slot 2</option>
									<option value="3">Slot 3</option>
								</select>
							</div>
							<div className="flex justify-end gap-2 pt-2">
								<button
									type="button"
									className={secondary}
									onClick={() => setShowPinModal(false)}
								>
									Tutup
								</button>
								<button
									type="submit"
									className={primary}
									disabled={pinLoading || !pinForm.achievementId.trim()}
								>
									{pinLoading ? "Menyimpan…" : "Simpan Perubahan"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* ─── Toast ─── */}
			{toast && (
				<div
					className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-2xl ${
						toast.type === "error" ? "bg-rose-700" : "bg-emerald-700"
					}`}
				>
					{toast.message}
				</div>
			)}
		</div>
	);
};

// ─── Sub-Components ─────────────────────────────────────────

/** Stat card matching the BacaanKuisModule design exactly. */
const StatCard = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "emerald" | "amber" | "teal" | "purple";
}) => {
  const toneClass = {
    emerald: "from-emerald-500 to-teal-400",
    amber: "from-amber-400 to-orange-400",
    teal: "from-teal-500 to-cyan-400",
    purple: "from-purple-500 to-fuchsia-400",
  }[tone];

  return (
    <div
      className={`${subtlePanel} group overflow-hidden p-4 transition hover:-translate-y-1 hover:shadow-lg`}
    >
      <div
        className={`mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r ${toneClass}`}
      />
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
};

/** Individual pinned achievement card. */
const AchievementCard = ({
  achievement,
  index,
}: {
  achievement: PinnedAchievementDto;
  index: number;
}) => {
  const icon = ACHIEVEMENT_ICONS[index % ACHIEVEMENT_ICONS.length];

  return (
    <div
      className={`${subtlePanel} group relative overflow-hidden p-5 transition hover:-translate-y-1 hover:shadow-lg`}
    >
      {/* Decorative gradient corner */}
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/20 transition-transform group-hover:scale-150" />

      <div className="relative">
        {/* Icon + Pin order badge */}
        <div className="mb-4 flex items-center justify-between">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-2xl shadow-sm">
            {icon}
          </span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">
            Pin #{achievement.pinOrder}
          </span>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-lg font-black leading-6 text-slate-900">
          {achievement.nama}
        </h3>

        {/* Description */}
        <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">
          {achievement.deskripsi}
        </p>

        {/* Chips */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
            🎯 Target: {achievement.milestoneTarget}
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
            ⚡ +{achievement.poinReward} XP
          </span>
        </div>
      </div>
    </div>
  );
};

/** Loading skeleton for stat cards. */
const SkeletonStatCard = () => (
  <div
    className={`${subtlePanel} overflow-hidden p-4`}
  >
    <div className="mb-4 h-1.5 w-16 animate-pulse rounded-full bg-slate-200" />
    <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
    <div className="mt-3 h-8 w-14 animate-pulse rounded-lg bg-slate-200" />
  </div>
);

/** Loading skeleton for achievement cards. */
const SkeletonAchievementCard = () => (
  <div className={`${subtlePanel} overflow-hidden p-5`}>
    <div className="mb-4 flex items-center justify-between">
      <div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-5 w-14 animate-pulse rounded-full bg-slate-200" />
    </div>
    <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
    <div className="mt-2 h-4 w-full animate-pulse rounded bg-slate-100" />
    <div className="mt-1 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
    <div className="mt-4 flex gap-1.5">
      <div className="h-5 w-24 animate-pulse rounded-full bg-slate-100" />
      <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
    </div>
  </div>
);

/** Empty state matching BacaanKuisModule pattern. */
const EmptyState = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
    <p className="text-lg font-black text-slate-800">{title}</p>
    <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
  </div>
);

/** Loading skeleton for missions and progress cards. */
const SkeletonMissionCard = () => (
  <div className={`${subtlePanel} p-4`}>
    <div className="flex justify-between items-start mb-3">
      <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-12 animate-pulse rounded-full bg-slate-200" />
    </div>
    <div className="h-1.5 w-full animate-pulse rounded-full bg-slate-100" />
  </div>
);
