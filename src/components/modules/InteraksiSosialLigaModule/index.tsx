"use client";

import { useState, useEffect, FormEvent } from "react";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_LIGA_API_BASE_URL ?? "https://yomu-interaksi-sosial-liga-production.up.railway.app";

// --- TYPESCRIPT DEFINITIONS (Udah sesuai DTO Backend & Fide) ---
type ClanMember = {
    userId: string;
    fullName?: string;
    username?: string;
    role: string;
    skorIndividu: number;
    level?: number;
    pinnedAchievements?: { badgeUrl?: string; nama: string }[];
};

type Clan = {
    id: string;
    namaClan: string;
    tier: string;
    totalSkor: number;
    hasProductivityBuff?: boolean;
    hasLowAccuracyDebuff?: boolean;
    members?: ClanMember[];
    memberCount?: number;
};

// ─── TIER CONFIG ───────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<string, {
    label: string;
    icon: string;
    accent: string;
    accentLight: string;
    accentText: string;
    border: string;
    headerBg: string;
    rowTop: string;
    rowSub: string;
    divider: string;
    badge: string;
    badgeText: string;
    medal: [string, string, string];
}> = {
    DIAMOND: {
        label: "Diamond",
        icon: "◆",
        accent: "#06b6d4",
        accentLight: "rgba(6,182,212,0.12)",
        accentText: "#0e7490",
        border: "#a5f3fc",
        headerBg: "linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)",
        rowTop: "rgba(6,182,212,0.08)",
        rowSub: "rgba(6,182,212,0.04)",
        divider: "#cffafe",
        badge: "#cffafe",
        badgeText: "#0e7490",
        medal: ["#06b6d4", "#0891b2", "#0e7490"],
    },
    GOLD: {
        label: "Gold",
        icon: "★",
        accent: "#f59e0b",
        accentLight: "rgba(245,158,11,0.12)",
        accentText: "#92400e",
        border: "#fde68a",
        headerBg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
        rowTop: "rgba(245,158,11,0.10)",
        rowSub: "rgba(245,158,11,0.05)",
        divider: "#fde68a",
        badge: "#fef3c7",
        badgeText: "#92400e",
        medal: ["#f59e0b", "#d97706", "#b45309"],
    },
    SILVER: {
        label: "Silver",
        icon: "●",
        accent: "#64748b",
        accentLight: "rgba(100,116,139,0.10)",
        accentText: "#334155",
        border: "#cbd5e1",
        headerBg: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        rowTop: "rgba(100,116,139,0.08)",
        rowSub: "rgba(100,116,139,0.04)",
        divider: "#e2e8f0",
        badge: "#f1f5f9",
        badgeText: "#334155",
        medal: ["#64748b", "#475569", "#334155"],
    },
    BRONZE: {
        label: "Bronze",
        icon: "▲",
        accent: "#d97706",
        accentLight: "rgba(217,119,6,0.10)",
        accentText: "#78350f",
        border: "#fed7aa",
        headerBg: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
        rowTop: "rgba(217,119,6,0.10)",
        rowSub: "rgba(217,119,6,0.05)",
        divider: "#fed7aa",
        badge: "#ffedd5",
        badgeText: "#78350f",
        medal: ["#d97706", "#b45309", "#92400e"],
    },
};

const DEFAULT_TIER = {
    label: "Unranked",
    icon: "○",
    accent: "#94a3b8",
    accentLight: "rgba(148,163,184,0.08)",
    accentText: "#475569",
    border: "#e2e8f0",
    headerBg: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    rowTop: "rgba(148,163,184,0.08)",
    rowSub: "rgba(148,163,184,0.04)",
    divider: "#e2e8f0",
    badge: "#f1f5f9",
    badgeText: "#475569",
    medal: ["#94a3b8", "#64748b", "#475569"] as [string, string, string],
};

const getTierConfig = (tier: string) => {
    if (!tier) return DEFAULT_TIER;
    const key = tier.toUpperCase().replace(/\s/g, "");
    for (const k of Object.keys(TIER_CONFIG)) {
        if (key.includes(k)) return TIER_CONFIG[k];
    }
    return DEFAULT_TIER;
};

const MEDAL_EMOJI = ["🥇", "🥈", "🥉"];

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export const InteraksiSosialLigaModule = () => {
    const [activeView, setActiveView] = useState<"leaderboard" | "clan">("leaderboard");
    const [studentId, setStudentId] = useState("");
    const [studentName, setStudentName] = useState("");
    const [leaderboard, setLeaderboard] = useState<Clan[]>([]);
    const [myClan, setMyClan] = useState<Clan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [newClanName, setNewClanName] = useState("");
    const [joinClanId, setJoinClanId] = useState("");

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const groupedLeaderboard = leaderboard.reduce((acc, clan) => {
        const tier = clan.tier || "Unranked";
        if (!acc[tier]) acc[tier] = [];
        acc[tier].push(clan);
        return acc;
    }, {} as Record<string, Clan[]>);

    const TIER_ORDER = ["DIAMOND", "GOLD", "SILVER", "BRONZE"];
    const sortedTiers = Object.entries(groupedLeaderboard).sort((a, b) => {
        const ai = TIER_ORDER.findIndex(t => a[0].toUpperCase().includes(t));
        const bi = TIER_ORDER.findIndex(t => b[0].toUpperCase().includes(t));
        const aIdx = ai === -1 ? 99 : ai;
        const bIdx = bi === -1 ? 99 : bi;
        if (aIdx !== bIdx) return aIdx - bIdx;
        return Math.max(...b[1].map(c => c.totalSkor || 0)) - Math.max(...a[1].map(c => c.totalSkor || 0));
    });

    const fetchLeaderboard = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/liga/leaderboard`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setLeaderboard(data || []);
        } catch {
            setLeaderboard([]);
        } finally {
            setIsLoading(false);
        }
    };

    // ─── FUNGSI NARIK DATA KLAN SENDIRI ───
    const fetchMyClan = async (userId: string) => {
        try {
            let token = "";
            if (typeof window !== "undefined") {
                token = localStorage.getItem("token") || localStorage.getItem("accessToken") || "";
            }
            if (!token) {
                const cookies = document.cookie.split("; ");
                const tokenCookie = cookies.find(c => c.startsWith("token=") || c.startsWith("auth_token="));
                token = tokenCookie ? tokenCookie.split("=")[1] : "";
            }

            const headers: HeadersInit = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch(`${API_BASE_URL}/liga/clan/me?userId=${userId}`, {
                method: "GET",
                headers: headers
            });

            if (res.ok) {
                const data = await res.json();
                setMyClan(data);
            } else {
                setMyClan(null);
            }
        } catch (e) {
            console.error("Gagal nyambung ke server buat fetch my clan:", e);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
        try {
            let userData = null;

            const localUser = localStorage.getItem("user") || localStorage.getItem("userData");
            if (localUser) {
                userData = JSON.parse(localUser);
            }

            if (!userData) {
                const cookies = document.cookie.split(";");
                const userCookie = cookies.find(c => c.trim().startsWith("user="));
                if (userCookie) {
                    // Pake decodeURIComponent buat jaga-jaga formatnya aneh
                    const cookieValue = userCookie.split("=")[1];
                    userData = JSON.parse(decodeURIComponent(cookieValue));
                }
            }

            if (userData && userData.id) {
                setStudentId(userData.id);
                setStudentName(userData.username || userData.fullName || "Learner");

                fetchMyClan(userData.id);
            } else {
                console.warn("⚠️ Data user ga ketemu! Cookie atau localStorage kosong. Harap login ulang.");
            }
        } catch (e) {
            console.error("Error pas baca data login:", e);
        }
    }, []);

    const handleCreateClan = async (e: FormEvent) => {
        e.preventDefault();
        if (!studentId) return showToast("Sesi login tidak ditemukan.", "error");
        if (!newClanName.trim()) return showToast("Nama Klan wajib diisi!", "error");
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/liga/clan/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nama: newClanName, ketuaId: studentId }),
            });
            if (!res.ok) throw new Error("Gagal membuat klan");

            showToast("Klan berhasil dibuat!", "success");
            await fetchMyClan(studentId);
            setActiveView("clan");
            setNewClanName("");
            fetchLeaderboard();
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Terjadi kesalahan", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinClan = async (e: FormEvent) => {
        e.preventDefault();
        if (!studentId) return showToast("Sesi login tidak ditemukan.", "error");
        if (!joinClanId.trim()) return showToast("ID Klan wajib diisi!", "error");
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/liga/clan/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clanId: joinClanId, userId: studentId }),
            });
            if (!res.ok) throw new Error("Gagal bergabung dengan klan");

            showToast("Berhasil bergabung!", "success");
            await fetchMyClan(studentId);
            setActiveView("clan");
            setJoinClanId("");
            fetchLeaderboard();
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Terjadi kesalahan", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const joinClanDirectly = async (targetClanId: string, targetClanName: string) => {
        if (!studentId) return showToast("Sesi login tidak ditemukan.", "error");
        if (myClan) return showToast("Kamu sudah berada di dalam sebuah klan!", "error");
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/liga/clan/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clanId: targetClanId, userId: studentId }),
            });
            if (!res.ok) throw new Error("Gagal bergabung");

            showToast("Berhasil bergabung!", "success");
            await fetchMyClan(studentId);
            setActiveView("clan");
            fetchLeaderboard();
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Terjadi kesalahan", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // ── JSX ──────────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", gap: 24, padding: "24px 20px", minHeight: "100vh" }}>

                {/* ── SIDEBAR ── */}
                <aside style={{
                    width: 240, flexShrink: 0, position: "sticky", top: 24,
                    height: "calc(100vh - 48px)", display: "flex", flexDirection: "column", gap: 8,
                }}>
                    <div style={{
                        background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16,
                        padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, marginBottom: 4,
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 18, fontWeight: 900, color: "#fff",
                        }}>Y</div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>Yomu</div>
                            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Liga & Sosial</div>
                        </div>
                    </div>

                    <nav style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 8 }}>
                        {([
                            ["leaderboard", "Klasemen Liga", "🏆"],
                            ["clan", "Klan Saya", "⚔️"],
                        ] as const).map(([view, label, icon]) => (
                            <button key={view} onClick={() => setActiveView(view as any)}
                                    style={{
                                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                                        padding: "10px 12px", borderRadius: 10, border: "none",
                                        background: activeView === view ? "#059669" : "transparent",
                                        color: activeView === view ? "#fff" : "#475569",
                                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                                        transition: "all 0.15s", marginBottom: 2,
                                    }}>
                                <span style={{ fontSize: 15 }}>{icon}</span>
                                {label}
                            </button>
                        ))}
                    </nav>

                    <div style={{
                        background: "#0f172a", borderRadius: 16, padding: 16, color: "#fff", marginTop: "auto",
                    }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#34d399", textTransform: "uppercase", marginBottom: 8 }}>Status Klan</div>
                        <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.3 }}>
                            {myClan?.namaClan ?? "Belum Bergabung"}
                        </div>
                        {myClan && (
                            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(245,158,11,0.2)", color: "#fbbf24", borderRadius: 6, padding: "3px 8px", border: "1px solid rgba(245,158,11,0.3)" }}>
                                    {myClan.tier || "Unranked"}
                                </span>
                                {myClan.hasProductivityBuff && (
                                    <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(52,211,153,0.2)", color: "#34d399", borderRadius: 6, padding: "3px 8px", border: "1px solid rgba(52,211,153,0.3)" }}>
                                        ⚡ Buff Aktif
                                    </span>
                                )}
                                {myClan.hasLowAccuracyDebuff && (
                                    <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(248,113,113,0.2)", color: "#f87171", borderRadius: 6, padding: "3px 8px", border: "1px solid rgba(248,113,113,0.3)" }}>
                                        ⚠️ Debuff
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </aside>

                {/* ── MAIN ── */}
                <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>

                    <div style={{
                        background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "18px 24px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", marginBottom: 4 }}>
                                Arena Kompetisi · {studentName || "Learner"}
                            </div>
                            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em" }}>Liga Yomu</h1>
                        </div>
                        <button onClick={fetchLeaderboard} disabled={isLoading} style={{
                            padding: "8px 18px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff",
                            fontSize: 13, fontWeight: 700, color: "#475569", cursor: "pointer", transition: "all 0.15s",
                        }}>
                            {isLoading ? "Syncing…" : "↻ Sync"}
                        </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                        {([
                            ["Total Klan", leaderboard.length.toString(), "#059669"],
                            ["Poin Tertinggi", leaderboard[0]?.totalSkor?.toLocaleString() ?? "0", "#d97706"],
                            ["Musim", "Season 1", "#7c3aed"],
                        ] as const).map(([label, value, color]) => (
                            <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 18px" }}>
                                <div style={{ width: 32, height: 3, borderRadius: 2, background: color, marginBottom: 10 }} />
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                                <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", marginTop: 4 }}>{value}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── LEADERBOARD VIEW ── */}
                    {activeView === "leaderboard" && (
                        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px 24px 32px" }}>
                            <div style={{ marginBottom: 28 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "#059669", textTransform: "uppercase" }}>Global Ranking</div>
                                <h2 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em" }}>Klasemen Liga</h2>
                            </div>

                            {isLoading ? (
                                <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8", fontSize: 14, fontWeight: 600, background: "#f8fafc", borderRadius: 12 }}>
                                    Memuat data klasemen…
                                </div>
                            ) : leaderboard.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "48px 0", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: "#334155" }}>Belum ada klan terdaftar</div>
                                    <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>Jadilah yang pertama membentuk klan!</div>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
                                    {sortedTiers.map(([tierName, clansInTier]) => {
                                        const cfg = getTierConfig(tierName);
                                        return (
                                            <TierSection
                                                key={tierName} tierName={tierName} clans={clansInTier} cfg={cfg}
                                                myClanId={myClan?.id || myClan?.namaClan} onJoin={joinClanDirectly} isLoading={isLoading}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── CLAN VIEW (DASHBOARD KLAN / BUAT GABUNG) ── */}
                    {activeView === "clan" && (
                        myClan ?(
                            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32 }}>
                                <div style={{ marginBottom: 32 }}>
                                    <h2 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>{myClan.namaClan}</h2>
                                    <div style={{ color: "#64748b", marginTop: 4 }}>Dashboard Statistik Klan</div>
                                </div>

                                {/* Stats Grid */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                                    <StatCard label="Jumlah Anggota" value={`${myClan.memberCount || myClan.members?.length || 0} Orang`} tone="emerald" />
                                    <StatCard label="Total Skor Klan" value={(myClan.totalSkor || 0).toLocaleString()} tone="amber" />
                                </div>

                                <div style={{ marginTop: 24, padding: 20, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                                    <h4 style={{ margin: "0 0 8px 0", fontWeight: 800 }}>Tier Saat Ini: <span style={{ color: "#059669" }}>{myClan.tier || "Unranked"}</span></h4>
                                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                                        Terus kumpulkan skor individu untuk membantu klanmu naik ke tier selanjutnya!
                                    </p>
                                </div>

                                {/* ── DAFTAR ANGGOTA SECTION ── */}
                                <div style={{ marginTop: 32 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
                                        <div>
                                            <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#0f172a" }}>Anggota Klan</h3>
                                            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Kontribusi poin di season ini</div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                        {myClan.members?.map((member, idx) => {
                                            const displayName = member.fullName || member.username || `User-${String(member.userId).substring(0, 4)}`;
                                            const initial = displayName.charAt(0).toUpperCase();
                                            const score = member.skorIndividu || 0;

                                            return (
                                                <div key={member.userId || idx} style={{
                                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                                    padding: "16px 20px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12,
                                                    transition: "all 0.2s"
                                                }}>

                                                    {/* SISI KIRI (Identitas & Role) */}
                                                    <div style={{ display: "flex", alignItems: "center", gap: 16, width: "30%" }}>
                                                        <div style={{
                                                            width: 42, height: 42, borderRadius: "50%", background: "#e2e8f0",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            fontSize: 16, fontWeight: 800, color: "#475569"
                                                        }}>
                                                            {initial}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{displayName}</div>
                                                            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4, color: member.role === "Ketua" ? "#d97706" : "#64748b" }}>
                                                                {member.role === "Ketua" ? "👑 Ketua Klan" : "👤 Anggota"}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* SISI TENGAH (Showcase Achievement dengan Jurus Ilusi UI) */}
                                                    <div style={{ display: "flex", gap: 8, flex: 1, justifyContent: "center" }}>
                                                        {member.pinnedAchievements && member.pinnedAchievements.length > 0 ? (
                                                            member.pinnedAchievements.map((ach, i) => {
                                                                const fallbackEmojis = ["1️⃣", "2️⃣", "3️⃣"];
                                                                const fallbackEmoji = fallbackEmojis[i] || "🏅";

                                                                return (
                                                                    <div key={i} title={ach.nama} style={{
                                                                        width: 32, height: 32, background: "#fff", border: "1px solid #e2e8f0",
                                                                        borderRadius: 8, display: "flex", alignItems: "center",
                                                                        justifyContent: "center", overflow: "hidden", cursor: "help",
                                                                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                                                                    }}>
                                                                        {ach.badgeUrl ? (
                                                                            <img src={ach.badgeUrl} alt={ach.nama} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                                        ) : (
                                                                            <span style={{fontSize: 16}}>{fallbackEmoji}</span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>Belum ada pencapaian</div>
                                                        )}
                                                    </div>

                                                    {/* SISI KANAN (Skor) */}
                                                    <div style={{ width: "30%", textAlign: "right" }}>
                                                        <div style={{ fontSize: 18, fontWeight: 900, color: "#059669", letterSpacing: "-0.02em" }}>
                                                            +{score.toLocaleString()}
                                                        </div>
                                                        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>
                                                            Skor Season Ini
                                                        </div>
                                                    </div>

                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                            </div>
                        ) : (
                            // HALAMAN BUAT / GABUNG KLAN
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                {/* Buat Klan */}
                                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "#059669", textTransform: "uppercase" }}>Manajemen Klan</div>
                                    <h2 style={{ margin: "4px 0 8px", fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>Buat Klan Baru</h2>
                                    <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>Jadilah ketua dan kumpulkan teman-temanmu untuk memanjat tier Liga.</p>
                                    <form onSubmit={handleCreateClan}>
                                        <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>Nama Klan</label>
                                        <input
                                            value={newClanName} onChange={e => setNewClanName(e.target.value)}
                                            placeholder="Masukkan nama klan yang keren…"
                                            style={{
                                                width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12,
                                            }}
                                        />
                                        <button type="submit" disabled={isLoading} style={{
                                            width: "100%", padding: "11px", borderRadius: 10, border: "none", background: "#059669", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                                        }}>
                                            {isLoading ? "Memproses…" : "Bentuk Klan Sekarang"}
                                        </button>
                                    </form>
                                </div>

                                {/* Gabung Klan */}
                                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "#64748b", textTransform: "uppercase" }}>Atau</div>
                                    <h2 style={{ margin: "4px 0 8px", fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>Gabung Klan</h2>
                                    <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>Masukkan ID Klan untuk bergabung dengan temanmu.</p>
                                    <form onSubmit={handleJoinClan} style={{ display: "flex", gap: 8 }}>
                                        <input
                                            value={joinClanId} onChange={e => setJoinClanId(e.target.value)} placeholder="ID Klan (contoh: df71…)"
                                            style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none" }}
                                        />
                                        <button type="submit" disabled={isLoading} style={{
                                            padding: "10px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 700, color: "#334155", cursor: "pointer", whiteSpace: "nowrap",
                                        }}>Gabung</button>
                                    </form>

                                    <div style={{ marginTop: 24, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: 16 }}>
                                        <div style={{ fontWeight: 800, color: "#78350f", marginBottom: 8 }}>Sistem Buff & Debuff ⚠️</div>
                                        <p style={{ fontSize: 13, color: "#92400e", lineHeight: 1.7, margin: 0 }}>
                                            Klanmu bisa mendapatkan <strong>Produktivitas ×1.2</strong> jika misi harian tercapai. Namun jika rata-rata akurasi kuis anggotamu rendah, klan akan terkena <strong>Debuff ×0.8</strong>!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </main>
            </div>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", bottom: 20, right: 20, zIndex: 50, padding: "12px 18px", borderRadius: 12,
                    background: toast.type === "error" ? "#dc2626" : "#059669", color: "#fff", fontSize: 13, fontWeight: 700,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)", animation: "slideUp 0.2s ease",
                }}>
                    {toast.message}
                </div>
            )}
        </div>
    );
};

// ─── TIER SECTION ──────────────────────────────────────────────────────────────
const StatCard = ({ label, value, tone }: { label: string; value: string; tone: "emerald" | "amber" | "purple" }) => {
    const colors: Record<string, string> = {
        emerald: "#059669",
        amber: "#d97706",
        purple: "#7c3aed",
    };
    const color = colors[tone];
    return (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
            <div style={{ width: 32, height: 4, borderRadius: 2, background: color, marginBottom: 10 }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>{value}</div>
        </div>
    );
};

const TierSection = ({ tierName, clans, cfg, myClanId, onJoin, isLoading }: {
    tierName: string; clans: Clan[]; cfg: ReturnType<typeof getTierConfig>; myClanId?: string; onJoin: (id: string, name: string) => void; isLoading: boolean;
}) => (
    <div>
        {/* Tier Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.accentLight, border: `2px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: cfg.accent, fontWeight: 900, flexShrink: 0 }}>
                {cfg.icon}
            </div>
            <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.01em", color: cfg.accentText, textTransform: "uppercase" }}>{cfg.label}</div>
            <div style={{ flex: 1, height: 2, background: cfg.border, borderRadius: 2 }} />
            <div style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: cfg.badge, color: cfg.badgeText, border: `1px solid ${cfg.border}` }}>
                {clans.length} Klan
            </div>
        </div>

        {/* Table */}
        <div style={{ borderRadius: 14, border: `1.5px solid ${cfg.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "56px 1fr 140px 100px", padding: "10px 16px", background: cfg.headerBg, borderBottom: `1px solid ${cfg.divider}` }}>
                {["Rank", "Nama Klan", "Poin Skor", "Aksi"].map((h, i) => (
                    <div key={h} style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: cfg.accentText, textAlign: i === 0 ? "center" : i >= 2 ? "right" : "left" }}>{h}</div>
                ))}
            </div>

            {/* Rows */}
            {clans.map((clan, idx) => {
                const rank = idx + 1;
                // Cek kesamaan lewat ID atau Nama Klan biar fiturnya jalan
                const isMe = myClanId === clan.id || myClanId === clan.namaClan;

                const baseBg = rank === 1 ? cfg.rowTop : rank === 2 ? cfg.rowSub : "#fff";
                const rowBg = isMe ? "#ecfdf5" : baseBg;
                const highlightBorder = isMe ? "inset 4px 0 0 #10b981" : "none";

                return (
                    <div key={clan.id || idx} style={{
                        display: "grid", gridTemplateColumns: "56px 1fr 140px 100px", padding: "14px 16px",
                        background: rowBg, borderTop: idx > 0 ? `1px solid ${cfg.divider}` : "none", alignItems: "center",
                        boxShadow: highlightBorder, transition: "background 0.15s",
                    }}>
                        {/* Rank */}
                        <div style={{ textAlign: "center" }}>
                            {rank <= 3 ? (
                                <span style={{ fontSize: 18 }}>{MEDAL_EMOJI[rank - 1]}</span>
                            ) : (
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>#{rank}</span>
                            )}
                        </div>

                        {/* Name */}
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: isMe ? "#065f46" : "#0f172a" }}>{clan.namaClan}</div>
                            <div style={{ fontSize: 11, color: isMe ? "#10b981" : "#94a3b8", marginTop: 2, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>
                                {clan.id}
                            </div>
                        </div>

                        {/* Score */}
                        <div style={{ textAlign: "right", fontWeight: 900, fontSize: 16, color: cfg.accent, letterSpacing: "-0.02em" }}>
                            {clan.totalSkor?.toLocaleString() ?? "0"}
                        </div>

                        {/* Action */}
                        <div style={{ textAlign: "right" }}>
                            {isMe ? (
                                <span style={{ fontSize: 11, fontWeight: 800, padding: "5px 10px", borderRadius: 8, background: "#10b981", color: "#fff", boxShadow: "0 2px 10px rgba(16,185,129,0.3)" }}>
                                    Klanmu
                                </span>
                            ) : !myClanId ? (
                                <button onClick={() => onJoin(clan.id, clan.namaClan)} disabled={isLoading} style={{
                                    fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${cfg.border}`, background: cfg.accentLight, color: cfg.accentText, cursor: "pointer", transition: "all 0.15s",
                                }}>Gabung</button>
                            ) : (
                                <span style={{ color: "#e2e8f0", fontSize: 16 }}>—</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);
