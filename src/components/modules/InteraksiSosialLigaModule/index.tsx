"use client";

import { useState, useEffect, FormEvent } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_LIGA_API_BASE_URL ?? "http://localhost:8084";

// --- TYPESCRIPT DEFINITIONS ---
type Clan = {
    id: string;
    namaClan: string;
    tier: string;
    totalSkor: number;
    description?: string;
    hasProductivityBuff?: boolean;
    hasLowAccuracyDebuff?: boolean;
};

// --- STYLING VARIABLES (Dari desain sistem Yomu) ---
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
    // --- STATES ---
    const [activeView, setActiveView] = useState<"leaderboard" | "clan">("leaderboard");

    // Otomatisasi Student ID & Nama
    const [studentId, setStudentId] = useState("");
    const [studentName, setStudentName] = useState("");

    // Data States
    const [leaderboard, setLeaderboard] = useState<Clan[]>([]);
    const [myClan, setMyClan] = useState<Clan | null>(null);

    // Loading & UI States
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Form States
    const [newClanName, setNewClanName] = useState("");
    const [newClanDesc, setNewClanDesc] = useState("");
    const [joinClanId, setJoinClanId] = useState("");

    // --- HELPER FUNCTIONS ---
    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // --- API CALLS ---
    const fetchLeaderboard = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/liga/leaderboard`);
            if (!res.ok) throw new Error("Gagal mengambil data klasemen");
            const data = await res.json();
            setLeaderboard(data || []);
        } catch (error) {
            console.error("Fetch leaderboard error:", error);
            setLeaderboard([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Ambil data pas komponen pertama kali dirender
    useEffect(() => {
        fetchLeaderboard();

        // Mengambil Auth Data Nadhif dari Cookie
        try {
            const cookies = document.cookie.split(';');
            const userCookie = cookies.find(c => c.trim().startsWith('user='));

            if (userCookie) {
                // Decode URL encode dan parse JSON-nya
                const cookieValue = userCookie.split('=')[1];
                const userData = JSON.parse(decodeURIComponent(cookieValue));

                if (userData && userData.id) {
                    setStudentId(userData.id);
                    // Ambil username atau fullName untuk sapaan di UI
                    setStudentName(userData.username || userData.fullName || "Learner");
                }
            }
        } catch (error) {
            console.error("Gagal mengambil session user dari cookie:", error);
        }
    }, []);

    const handleCreateClan = async (e: FormEvent) => {
        e.preventDefault();

        if (!studentId) {
            showToast("Sesi login tidak ditemukan. Silakan login ulang.", "error");
            return;
        }

        if (!newClanName.trim()) {
            showToast("Nama Klan wajib diisi!", "error");
            return;
        }

        setIsLoading(true);
        try {
            // TODO: Ganti "/api/clans" dengan endpoint asli kamu
            const res = await fetch(`${API_BASE_URL}/api/clans`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newClanName,
                    description: newClanDesc,
                    leaderId: studentId, // ID dikirim secara gaib dari state
                }),
            });

            if (!res.ok) throw new Error("Gagal membuat klan");

            showToast("Klan berhasil dibuat!", "success");
            setNewClanName("");
            setNewClanDesc("");
            fetchLeaderboard(); // Refresh data klasemen
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Terjadi kesalahan";
            showToast(msg, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinClan = async (e: FormEvent) => {
        e.preventDefault();

        if (!studentId) {
            showToast("Sesi login tidak ditemukan. Silakan login ulang.", "error");
            return;
        }

        if (!joinClanId.trim()) {
            showToast("ID Klan wajib diisi!", "error");
            return;
        }

        setIsLoading(true);
        try {
            // TODO: Ganti endpoint sesuai backend kamu
            const res = await fetch(`${API_BASE_URL}/api/clans/${joinClanId}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId }), // ID dikirim otomatis
            });

            if (!res.ok) throw new Error("Gagal bergabung dengan klan");

            showToast("Berhasil bergabung dengan klan!", "success");
            setJoinClanId("");
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Terjadi kesalahan";
            showToast(msg, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const joinClanDirectly = async (targetClanId: string) => {
        if (!studentId) {
            showToast("Sesi login tidak ditemukan. Silakan login ulang.", "error");
            return;
        }

        // Biar aman, kalau dia udah punya klan, tolak!
        if (myClan) {
            showToast("Kamu sudah berada di dalam sebuah klan!", "error");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/clans/${targetClanId}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId }),
            });

            if (!res.ok) throw new Error("Gagal bergabung dengan klan");

            showToast("Berhasil bergabung dengan klan!", "success");
            // Otomatis refresh data leaderboard biar kelihatan update-nya
            fetchLeaderboard();

            // TODO (Opsional): Lu bisa tambahin fungsi fetchMyClan() di sini
            // biar UI status di sidebar sebelah kiri langsung berubah
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Terjadi kesalahan";
            showToast(msg, "error");
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className={shell}>
            <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-4 px-4 py-4 lg:px-6">

                {/* --- SIDEBAR --- */}
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

                    {/* CLAN STATUS CARD */}
                    <div className="mt-8 rounded-2xl bg-slate-950 p-4 text-white">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Status Klan</p>
                        <p className="mt-2 text-2xl font-black">{myClan?.namaClan || "Belum Bergabung"}</p>
                        {myClan && (
                            <div className="mt-3 flex gap-2 flex-wrap">
                <span className="rounded-full bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                  Tier: {myClan.tier}
                </span>
                                {myClan.hasProductivityBuff && (
                                    <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">Buff Aktif ⚡</span>
                                )}
                                {myClan.hasLowAccuracyDebuff && (
                                    <span className="rounded-full bg-rose-500/20 px-2 py-1 text-[10px] font-bold text-rose-300 border border-rose-500/30">Debuff Aktif ⚠️</span>
                                )}
                            </div>
                        )}
                    </div>
                </aside>

                {/* --- MAIN CONTENT --- */}
                <main className="min-w-0 flex-1">
                    <header className={`${panel} mb-4 flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between`}>
                        <div>
                            {/* Dinamis nampilin nama dari cookie */}
                            <p className="text-sm font-bold text-emerald-700">Arena Kompetisi, {studentName || "Learner"}</p>
                            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Liga Yomu</h1>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            {/* Input Student ID udah dibuang! */}
                            <button type="button" onClick={fetchLeaderboard} className={secondary} disabled={isLoading}>
                                {isLoading ? "Syncing..." : "Sync Data"}
                            </button>
                        </div>
                    </header>

                    {/* STATS CARDS */}
                    <section className="mb-4 grid gap-3 md:grid-cols-3">
                        <StatCard label="Total Klan" value={leaderboard.length.toString()} tone="emerald" />
                        <StatCard label="Poin Tertinggi" value={leaderboard[0]?.totalSkor?.toLocaleString() || "0"} tone="amber" />
                        <StatCard label="Musim" value="Season 1" tone="purple" />
                    </section>

                    {/* --- VIEW: LEADERBOARD --- */}
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
                                        {/* TAMBAHAN: Kolom Baru Buat Tombol */}
                                        <th className="border-b border-slate-200 px-4 py-3 font-black text-center">Aksi</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan={5} className="text-center py-8 text-slate-500 font-medium">Memuat data klasemen...</td></tr>
                                    ) : leaderboard.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center">
                                                    <p className="text-lg font-bold text-slate-700">Belum ada klan yang terdaftar.</p>
                                                    <p className="text-sm text-slate-500 mt-1">Jadilah yang pertama membentuk klan dan raih peringkat puncak!</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        leaderboard.map((clan, index) => {
                                            const rank = index + 1;
                                            let color = "bg-white";
                                            if (rank === 1) color = "bg-amber-50 border-l-4 border-l-amber-500";
                                            else if (rank === 2) color = "bg-slate-50 border-l-4 border-l-slate-400";
                                            else if (rank === 3) color = "bg-orange-50 border-l-4 border-l-orange-400";

                                            return (
                                                <tr key={clan.id} className={color}>
                                                    <td className="border-b border-slate-100 px-4 py-4 text-center font-black text-slate-500">#{rank}</td>
                                                    <td className="border-b border-slate-100 px-4 py-4 font-bold text-slate-900">{clan.namaClan}</td>
                                                    <td className="border-b border-slate-100 px-4 py-4 font-semibold text-slate-600">{clan.tier}</td>
                                                    <td className="border-b border-slate-100 px-4 py-4 text-right font-black text-emerald-700">{clan.totalSkor?.toLocaleString()}</td>

                                                    {/* TAMBAHAN: Tombol Gabung */}
                                                    <td className="border-b border-slate-100 px-4 py-4 text-center">
                                                        {myClan?.id === clan.id ? (
                                                            <span className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600">
                                Klan Kamu
                            </span>
                                                        ) : !myClan ? (
                                                            <button
                                                                onClick={() => joinClanDirectly(clan.id)}
                                                                disabled={isLoading}
                                                                className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                                                            >
                                                                Gabung
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </article>
                    )}

                    {/* --- VIEW: MANAJEMEN KLAN --- */}
                    {activeView === "clan" && (
                        <section className="grid gap-4 xl:grid-cols-2">
                            <article className={`${panel} p-6`}>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Manajemen Klan</p>
                                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Buat Klan Baru</h2>
                                <p className="mt-2 text-sm text-slate-500 mb-6">Jadilah ketua dan kumpulkan teman-temanmu untuk memanjat tier Liga.</p>

                                <form onSubmit={handleCreateClan} className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 ml-1">Nama Klan</label>
                                        <input
                                            value={newClanName}
                                            onChange={(e) => setNewClanName(e.target.value)}
                                            placeholder="Masukkan nama klan yang keren..."
                                            className={`${input} mt-1`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 ml-1">Deskripsi Klan (Opsional)</label>
                                        <textarea
                                            value={newClanDesc}
                                            onChange={(e) => setNewClanDesc(e.target.value)}
                                            rows={3}
                                            placeholder="Misi dan visi klanmu..."
                                            className={`${input} mt-1`}
                                        />
                                    </div>
                                    <button type="submit" disabled={isLoading} className={`${primary} w-full mt-2`}>
                                        {isLoading ? "Memproses..." : "Bentuk Klan Sekarang"}
                                    </button>
                                </form>
                            </article>

                            <article className={`${panel} p-6 bg-gradient-to-br from-white to-slate-50`}>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Atau</p>
                                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Gabung Klan</h2>
                                <p className="mt-2 text-sm text-slate-500 mb-6">Masukkan ID Klan untuk bergabung dengan temanmu.</p>

                                <form onSubmit={handleJoinClan} className="flex gap-2">
                                    <input
                                        value={joinClanId}
                                        onChange={(e) => setJoinClanId(e.target.value)}
                                        placeholder="ID Klan (Contoh: KLN-123)"
                                        className={input}
                                    />
                                    <button type="submit" disabled={isLoading} className={`${secondary} shrink-0`}>
                                        Gabung
                                    </button>
                                </form>

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

            {/* TOAST NOTIFICATION */}
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-2xl ${
                    toast.type === "error" ? "bg-rose-700" : "bg-emerald-700"
                }`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, tone }: { label: string; value: string; tone: "emerald" | "amber" | "purple" }) => {
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