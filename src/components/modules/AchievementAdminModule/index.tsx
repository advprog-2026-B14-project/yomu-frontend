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

const shell = "w-full text-slate-900";
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

export const AchievementAdminModule = () => {
  const [activeTab, setActiveTab] = useState<Tab>("ACHIEVEMENTS");

  const [achievements, setAchievements] = useState<AchievementMasterDto[]>([]);
  const [missions, setMissions] = useState<DailyMissionMasterDto[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleSaveMission = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: DailyMissionMasterDto = {
      namaMisi: formData.get("namaMisi") as string,
      milestoneTarget: Number(formData.get("milestoneTarget")),
      poinReward: Number(formData.get("poinReward")),
      milestoneType: formData.get("milestoneType") as string,
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
    <div className={`${shell} p-6 md:p-10 max-w-7xl mx-auto`}>
        <header className={`${panel} mb-6 flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Yomu Admin</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Master Data Gamification
            </h1>
          </div>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              className={`px-4 py-2 text-sm font-bold rounded-lg transition ${activeTab === "ACHIEVEMENTS" ? "bg-white text-emerald-700 shadow" : "text-slate-500 hover:text-slate-700"}`}
              onClick={() => setActiveTab("ACHIEVEMENTS")}
            >
              Achievements
            </button>
            <button
              className={`px-4 py-2 text-sm font-bold rounded-lg transition ${activeTab === "MISSIONS" ? "bg-white text-emerald-700 shadow" : "text-slate-500 hover:text-slate-700"}`}
              onClick={() => setActiveTab("MISSIONS")}
            >
              Daily Missions
            </button>
          </div>
        </header>

        {activeTab === "ACHIEVEMENTS" ? (
          <div className={`${panel} overflow-hidden`}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Daftar Achievements</h2>
              <button
                className={primary}
                onClick={() => { setEditAch(null); setShowAchModal(true); }}
              >
                + Add Achievement
              </button>
            </div>
            {loading ? <p className="p-8 text-center text-slate-500">Loading...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Nama</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Target</th>
                      <th className="px-6 py-4">Poin</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {achievements.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                                Tidak ada data achievement
                            </td>
                        </tr>
                    ) : achievements.map((ach) => (
                      <tr key={ach.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-bold text-slate-900">{ach.nama}</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{ach.milestoneType}</td>
                        <td className="px-6 py-4 text-slate-600">{ach.milestoneTarget}</td>
                        <td className="px-6 py-4 text-emerald-600 font-bold">{ach.poinReward} XP</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
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
          <div className={`${panel} overflow-hidden`}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Daftar Daily Missions</h2>
              <button
                className={primary}
                onClick={() => { setEditMis(null); setShowMisModal(true); }}
              >
                + Add Mission
              </button>
            </div>
            {loading ? <p className="p-8 text-center text-slate-500">Loading...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Nama Misi</th>
                      <th className="px-6 py-4">Target</th>
                      <th className="px-6 py-4">Poin</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {missions.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                                Tidak ada data misi harian
                            </td>
                        </tr>
                    ) : missions.map((mis) => (
                      <tr key={mis.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-bold text-slate-900">{mis.namaMisi}</td>
                        <td className="px-6 py-4 text-slate-600">{mis.milestoneTarget}</td>
                        <td className="px-6 py-4 text-emerald-600 font-bold">{mis.poinReward} XP</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <div className={`${panel} w-full max-w-md p-6 max-h-[90vh] overflow-y-auto`}>
              <h3 className="text-xl font-black text-slate-950 mb-5">{editAch ? "Edit" : "Add"} Achievement</h3>
              <form onSubmit={handleSaveAchievement} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Nama</label>
                  <input name="nama" defaultValue={editAch?.nama} required className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Deskripsi</label>
                  <textarea name="deskripsi" defaultValue={editAch?.deskripsi} required className={inputClass} rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Milestone Target</label>
                    <input name="milestoneTarget" type="number" defaultValue={editAch?.milestoneTarget || 1} required className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Poin Reward</label>
                    <input name="poinReward" type="number" defaultValue={editAch?.poinReward || 100} required className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Milestone Type</label>
                  <select name="milestoneType" defaultValue={editAch?.milestoneType || "STREAK"} required className={inputClass}>
                    <option value="BACA">BACA</option>
                    <option value="FORUM">FORUM</option>
                    <option value="KUIS">KUIS</option>
                    <option value="STREAK">STREAK</option>
                    <option value="XP">XP</option>
                    <option value="LEVEL">LEVEL</option>
                    <option value="GENERAL">GENERAL</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Badge URL</label>
                  <input name="badgeUrl" defaultValue={editAch?.badgeUrl || ""} className={inputClass} />
                </div>
                <div className="flex justify-end gap-3 pt-5">
                  <button type="button" onClick={() => setShowAchModal(false)} className="px-4 py-2.5 text-sm font-bold border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition">Batal</button>
                  <button type="submit" className={primary}>Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mission Modal */}
        {showMisModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <div className={`${panel} w-full max-w-md p-6`}>
              <h3 className="text-xl font-black text-slate-950 mb-5">{editMis ? "Edit" : "Add"} Mission</h3>
              <form onSubmit={handleSaveMission} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Nama Misi</label>
                  <input name="namaMisi" defaultValue={editMis?.namaMisi} required className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Milestone Target</label>
                    <input name="milestoneTarget" type="number" defaultValue={editMis?.milestoneTarget || 1} required className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Poin Reward</label>
                    <input name="poinReward" type="number" defaultValue={editMis?.poinReward || 50} required className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Milestone Type</label>
                  <select name="milestoneType" defaultValue={editMis?.milestoneType || "STREAK"} required className={inputClass}>
                    <option value="BACA">BACA</option>
                    <option value="FORUM">FORUM</option>
                    <option value="KUIS">KUIS</option>
                    <option value="STREAK">STREAK</option>
                    <option value="XP">XP</option>
                    <option value="LEVEL">LEVEL</option>
                    <option value="GENERAL">GENERAL</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-5">
                  <button type="button" onClick={() => setShowMisModal(false)} className="px-4 py-2.5 text-sm font-bold border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition">Batal</button>
                  <button type="submit" className={primary}>Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-bold shadow-lg transition-all ${toast.type === "error" ? "bg-rose-50 border border-rose-200 text-rose-800" : "bg-emerald-50 border border-emerald-200 text-emerald-800"}`}>
            {toast.message}
          </div>
        )}
    </div>
  );
};
