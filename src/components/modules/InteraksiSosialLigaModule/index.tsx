"use client";

import { useState } from "react";

const shell = "min-h-screen bg-[radial-gradient(circle_at_top_left,#ccfbf1_0,#ffffff_30%,#f8fafc_72%)] text-slate-900";
const panel = "rounded-2xl border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur";
const subtlePanel = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const input =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const primary =
    "rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300";
const secondary =
    "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 disabled:translate-y-0 disabled:cursor-not-allowed disabled:text-slate-400";

export const InteraksiSosialLigaModule = () => {
    const [activeView, setActiveView] = useState<"leaderboard" | "clan">("leaderboard");
    const [studentId, setStudentId] = useState("");

    return (
        <div className={shell}>
            <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-4 px-4 py-4 lg:px-6">

                {/* SIDEBAR */}
                <aside className={`${panel} sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 p-4 lg:block`}>
                    <div className="mb-8 flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-700 text-lg font-black text-white">Y</div>
                        <div>
                            <p className="text-lg font-black tracking-tight">Yomu</p>
                            <p className="text-xs font-semibold text-slate-500">Liga & Sosial</p>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {[
                            ["leaderboard", "Klasemen Liga", "Rank"],
                            ["clan", "Klan Saya", "Clan"],
                        ].map(([view, label, badge]) => (
                            <button
                                key={view}
                                type="button"
                                onClick={() => setActiveView(view as "leaderboard" | "clan")}
                                className={`group flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-bold transition ${
                                    activeView === view ? "bg-emerald-700 text-white shadow-lg shadow-emerald-900/10" : "text-slate-600 hover:bg-slate-100"
                                }`}
                            >
                                <span>{label}</span>
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                                        activeView === view ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-white"
                                    }`}
                                >
                  {badge}
                </span>
                            </button>
                        ))}
                    </nav>

                    {/* CLAN STATUS CARD DI SIDEBAR */}
                    <div className="mt-8 rounded-2xl bg-slate-950 p-4 text-white">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Status Klan</p>
                        <p className="mt-2 text-2xl font-black">Naga Bonar</p>
                        <div className="mt-3 flex gap-2">
                            <span className="rounded-full bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-300 border border-amber-500/30">Tier: Gold</span>
                            <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">Buff Aktif ⚡</span>
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT AREA */}
                <main className="min-w-0 flex-1">
                    {/* HEADER */}
                    <header className={`${panel} mb-4 flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between`}>
                        <div>
                            <p className="text-sm font-bold text-emerald-700">Arena Kompetisi, {studentId.trim() || "Learner"}</p>
                            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Liga Yomu</h1>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                                value={studentId}
                                onChange={(event) => setStudentId(event.target.value)}
                                placeholder="Student ID"
                                className={`${input} sm:w-48`}
                            />
                            <button type="button" className={secondary}>Sync Data</button>
                        </div>
                    </header>

                    {/* STATS CARDS */}
                    <section className="mb-4 grid gap-3 md:grid-cols-3">
                        <StatCard label="Peringkat Klan" value="#4" tone="emerald" />
                        <StatCard label="Total Poin" value="1,240" tone="amber" />
                        <StatCard label="Efek Aktif" value="x1.2 XP" tone="purple" />
                    </section>

                    {/* TAMPILAN LEADERBOARD */}
                    {activeView === "leaderboard" && (
                        <article className={`${panel} p-5 xl:min-h-[calc(100vh-16rem)]`}>
                            <div className="mb-6">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Global Ranking</p>
                                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Klasemen Liga</h2>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                                    <tr>
                                        <th className="border-b border-slate-200 px-4 py-3 font-black w-16 text-center">Rank</th>
                                        <th className="border-b border-slate-200 px-4 py-3 font-black">Nama Klan</th>
                                        <th className="border-b border-slate-200 px-4 py-3 font-black">Tier</th>
                                        <th className="border-b border-slate-200 px-4 py-3 font-black text-right">Poin Skor</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {/* Dummy Data biar langsung keliatan bagus buat presentasi */}
                                    {[
                                        { rank: 1, name: "Harimau Putih", tier: "Diamond", score: 2500, color: "bg-cyan-50" },
                                        { rank: 2, name: "Garuda Yaksa", tier: "Platinum", score: 2100, color: "bg-white" },
                                        { rank: 3, name: "Banteng Merah", tier: "Gold", score: 1850, color: "bg-slate-50" },
                                        { rank: 4, name: "Naga Bonar", tier: "Gold", score: 1240, color: "bg-emerald-50 border-l-4 border-l-emerald-500" },
                                        { rank: 5, name: "Kancil Lari", tier: "Silver", score: 980, color: "bg-white" },
                                    ].map((clan) => (
                                        <tr key={clan.rank} className={clan.color}>
                                            <td className="border-b border-slate-100 px-4 py-4 text-center font-black text-slate-500">#{clan.rank}</td>
                                            <td className="border-b border-slate-100 px-4 py-4 font-bold text-slate-900">{clan.name}</td>
                                            <td className="border-b border-slate-100 px-4 py-4 font-semibold text-slate-600">{clan.tier}</td>
                                            <td className="border-b border-slate-100 px-4 py-4 text-right font-black text-emerald-700">{clan.score.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </article>
                    )}

                    {/* TAMPILAN KLAN SAYA */}
                    {activeView === "clan" && (
                        <section className="grid gap-4 xl:grid-cols-2">
                            <article className={`${panel} p-6`}>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Manajemen Klan</p>
                                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Buat Klan Baru</h2>
                                <p className="mt-2 text-sm text-slate-500 mb-6">Jadilah ketua dan kumpulkan teman-temanmu untuk memanjat tier Liga.</p>

                                <form className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 ml-1">Nama Klan</label>
                                        <input placeholder="Masukkan nama klan yang keren..." className={`${input} mt-1`} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 ml-1">Deskripsi Klan</label>
                                        <textarea rows={3} placeholder="Misi dan visi klanmu..." className={`${input} mt-1`} />
                                    </div>
                                    <button type="button" className={`${primary} w-full mt-2`}>Bentuk Klan Sekarang</button>
                                </form>
                            </article>

                            <article className={`${panel} p-6 bg-gradient-to-br from-white to-slate-50`}>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Atau</p>
                                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Gabung Klan</h2>
                                <p className="mt-2 text-sm text-slate-500 mb-6">Masukkan ID Klan untuk bergabung dengan temanmu.</p>

                                <div className="flex gap-2">
                                    <input placeholder="ID Klan (Contoh: KLN-123)" className={input} />
                                    <button type="button" className={`${secondary} shrink-0`}>Gabung</button>
                                </div>

                                <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                    <p className="font-black text-amber-950">Sistem Buff & Debuff Liga ⚠️</p>
                                    <p className="mt-2 text-sm text-amber-900 leading-relaxed">
                                        Klanmu bisa mendapatkan <strong>Produktivitas x1.2</strong> jika misi harian tercapai. Namun awas, jika rata-rata akurasi kuis anggotamu rendah, klan akan terkena <strong>Debuff x0.8</strong>!
                                    </p>
                                </div>
                            </article>
                        </section>
                    )}

                </main>
            </div>
        </div>
    );
};

// Komponen Card kecil buat di atas
const StatCard = ({ label, value, tone }: { label: string; value: number | string; tone: "emerald" | "amber" | "purple" }) => {
    const toneClass = {
        emerald: "from-emerald-500 to-teal-400",
        amber: "from-amber-400 to-orange-400",
        purple: "from-purple-500 to-fuchsia-400",
    }[tone];

    return (
        <div className={`${subtlePanel} group overflow-hidden p-4 transition hover:-translate-y-1 hover:shadow-lg`}>
            <div className={`mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r ${toneClass}`} />
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
        </div>
    );
};