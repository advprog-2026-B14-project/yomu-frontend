"use client";

import { useEffect, useState } from "react";
import {
  getAdminAchievements,
  createAdminAchievement,
  updateAdminAchievement,
  deleteAdminAchievement,
  getAdminMissions,
  createAdminMission,
  updateAdminMission,
  deleteAdminMission,
} from "@/services/achievementService";
import type { AchievementMasterDto, DailyMissionMasterDto } from "@/types/achievement";

// ─── Design Tokens ────────────────────────────────────────────
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
const dangerBtn =
  "rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700";

type Tab = "ACHIEVEMENTS" | "MISSIONS";

export default function AdminGamificationPage() {
  const [activeTab, setActiveTab] = useState<Tab>("ACHIEVEMENTS");

  // Data States
  const [achievements, setAchievements] = useState<AchievementMasterDto[]>([]);
  const [missions, setMissions] = useState<DailyMissionMasterDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showAchModal, setShowAchModal] = useState(false);
  const [editAch, setEditAch] = useState<AchievementMasterDto | null>(null);

  const [showMisModal, setShowMisModal] = useState(false);
  const [editMis, setEditMis] = useState<DailyMissionMasterDto | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "ACHIEVEMENTS") {
        const data = await getAdminAchievements();
        setAchievements(data || []);
      } else {
        const data = await getAdminMissions();
        setMissions(data || []);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Handlers for Achievements
  const handleSaveAchievement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: AchievementMasterDto = {
      nama: formData.get("nama") as string,
      deskripsi: formData.get("deskripsi") as string,
      milestoneTarget: Number(formData.get("milestoneTarget")),
      poinReward: Number(formData.get("poinReward")),
      milestoneType: formData.get("milestoneType") as string,
      badgeUrl: formData.get("badgeUrl") as string,
    };

    try {
      if (editAch?.id) {
        await updateAdminAchievement(editAch.id, data);
        showToast("Achievement updated!");
      } else {
        await createAdminAchievement(data);
        showToast("Achievement created!");
      }
      setShowAchModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!confirm("Delete this achievement?")) return;
    try {
      await deleteAdminAchievement(id);
      showToast("Achievement deleted!");
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Handlers for Missions
  const handleSaveMission = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: DailyMissionMasterDto = {
      namaMisi: formData.get("namaMisi") as string,
      milestoneTarget: Number(formData.get("milestoneTarget")),
      poinReward: Number(formData.get("poinReward")),
    };

    try {
      if (editMis?.id) {
        await updateAdminMission(editMis.id, data);
        showToast("Mission updated!");
      } else {
        await createAdminMission(data);
        showToast("Mission created!");
      }
      setShowMisModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteMission = async (id: string) => {
    if (!confirm("Delete this mission?")) return;
    try {
      await deleteAdminMission(id);
      showToast("Mission deleted!");
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className={shell}>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className={`${panel} mb-6 flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between`}>
          <div>
            <p className="text-sm font-bold text-emerald-700">Admin Dashboard</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              Master Data Gamification
            </h1>
          </div>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              className={`px-4 py-2 text-sm font-bold rounded-lg transition ${activeTab === "ACHIEVEMENTS" ? "bg-white text-emerald-700 shadow" : "text-slate-500"}`}
              onClick={() => setActiveTab("ACHIEVEMENTS")}
            >
              Achievements
            </button>
            <button
              className={`px-4 py-2 text-sm font-bold rounded-lg transition ${activeTab === "MISSIONS" ? "bg-white text-emerald-700 shadow" : "text-slate-500"}`}
              onClick={() => setActiveTab("MISSIONS")}
            >
              Daily Missions
            </button>
          </div>
        </header>

        {activeTab === "ACHIEVEMENTS" ? (
          <div className={`${panel} p-6`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Master Achievements</h2>
              <button
                className={primary}
                onClick={() => { setEditAch(null); setShowAchModal(true); }}
              >
                + Add Achievement
              </button>
            </div>
            {loading ? <p>Loading...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-bold">Nama</th>
                      <th className="px-4 py-3 font-bold">Type</th>
                      <th className="px-4 py-3 font-bold">Target</th>
                      <th className="px-4 py-3 font-bold">Poin</th>
                      <th className="px-4 py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {achievements.map((ach) => (
                      <tr key={ach.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-bold">{ach.nama}</td>
                        <td className="px-4 py-3">{ach.milestoneType}</td>
                        <td className="px-4 py-3">{ach.milestoneTarget}</td>
                        <td className="px-4 py-3">{ach.poinReward} XP</td>
                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                          <button
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                            onClick={() => { setEditAch(ach); setShowAchModal(true); }}
                          >
                            Edit
                          </button>
                          <button
                            className={dangerBtn}
                            onClick={() => handleDeleteAchievement(ach.id!)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className={`${panel} p-6`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Master Daily Missions</h2>
              <button
                className={primary}
                onClick={() => { setEditMis(null); setShowMisModal(true); }}
              >
                + Add Mission
              </button>
            </div>
            {loading ? <p>Loading...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-bold">Nama Misi</th>
                      <th className="px-4 py-3 font-bold">Target</th>
                      <th className="px-4 py-3 font-bold">Poin</th>
                      <th className="px-4 py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {missions.map((mis) => (
                      <tr key={mis.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-bold">{mis.namaMisi}</td>
                        <td className="px-4 py-3">{mis.milestoneTarget}</td>
                        <td className="px-4 py-3">{mis.poinReward} XP</td>
                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                          <button
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                            onClick={() => { setEditMis(mis); setShowMisModal(true); }}
                          >
                            Edit
                          </button>
                          <button
                            className={dangerBtn}
                            onClick={() => handleDeleteMission(mis.id!)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Achievement Modal */}
        {showAchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className={`${panel} w-full max-w-md p-6 max-h-[90vh] overflow-y-auto`}>
              <h3 className="text-xl font-black mb-4">{editAch ? "Edit" : "Add"} Achievement</h3>
              <form onSubmit={handleSaveAchievement} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Nama</label>
                  <input name="nama" defaultValue={editAch?.nama} required className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Deskripsi</label>
                  <textarea name="deskripsi" defaultValue={editAch?.deskripsi} required className={inputClass} rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Milestone Target</label>
                    <input name="milestoneTarget" type="number" defaultValue={editAch?.milestoneTarget || 1} required className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Poin Reward</label>
                    <input name="poinReward" type="number" defaultValue={editAch?.poinReward || 100} required className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Milestone Type</label>
                  <input name="milestoneType" defaultValue={editAch?.milestoneType || "STREAK"} required className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Badge URL</label>
                  <input name="badgeUrl" defaultValue={editAch?.badgeUrl || ""} className={inputClass} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setShowAchModal(false)} className={secondary}>Cancel</button>
                  <button type="submit" className={primary}>Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mission Modal */}
        {showMisModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className={`${panel} w-full max-w-md p-6`}>
              <h3 className="text-xl font-black mb-4">{editMis ? "Edit" : "Add"} Mission</h3>
              <form onSubmit={handleSaveMission} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Nama Misi</label>
                  <input name="namaMisi" defaultValue={editMis?.namaMisi} required className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Milestone Target</label>
                    <input name="milestoneTarget" type="number" defaultValue={editMis?.milestoneTarget || 1} required className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Poin Reward</label>
                    <input name="poinReward" type="number" defaultValue={editMis?.poinReward || 50} required className={inputClass} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setShowMisModal(false)} className={secondary}>Cancel</button>
                  <button type="submit" className={primary}>Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-4 right-4 z-50 rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-2xl ${toast.type === "error" ? "bg-rose-700" : "bg-emerald-700"}`}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}
