"use client";

import { useState, useEffect, useCallback } from "react";
import { logout } from "@/lib/auth";

interface User {
    id: string;
    fullName: string;
    email: string;
    username: string;
    role: string;
    createdAt: string;
}

function getInitials(name: string) {
    return (name || "?")
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
}

function formatDate(s: string) {
    if (!s) return "—";
    try {
        return new Date(s).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "—";
    }
}

const PER_PAGE = 10;

const shell = "min-h-screen bg-[radial-gradient(circle_at_top_left,#ccfbf1_0,#ffffff_30%,#f8fafc_72%)] text-slate-900";
const panel = "rounded-2xl border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur";
const subtlePanel = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const inputStyle = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const primary = "rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300";
const secondary = "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 disabled:translate-y-0 disabled:cursor-not-allowed disabled:text-slate-400";
const danger = "rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-slate-300";

export const AdminModule = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [filtered, setFiltered] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [page, setPage] = useState(1);

    const [roleModal, setRoleModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
    const [endSeasonModal, setEndSeasonModal] = useState(false);
    const [newRole, setNewRole] = useState("USER");
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [endSeasonLoading, setEndSeasonLoading] = useState(false);

    const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = getToken();
            const url = `/api/admin/users`;
            console.log("Fetching users from:", url, "with token:", token ? "Exists" : "Null");

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const errText = await res.text().catch(() => "No response body");
                throw new Error(`Error ${res.status}: ${res.statusText} - ${errText}`);
            }

            const data: User[] = (await res.json()).content;
            setUsers(data);
            setFiltered(data);
        } catch (e: unknown) {
            console.error("fetchUsers mengalami error:", e);
            setError(e instanceof Error ? e.message : "Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    useEffect(() => {
        const q = search.toLowerCase();
        const result = users.filter((u) => {
            const matchQ =
                !q ||
                u.fullName?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.username?.toLowerCase().includes(q);
            const matchR = !roleFilter || u.role === roleFilter;
            return matchQ && matchR;
        });
        setFiltered(result);
        setPage(1);
    }, [search, roleFilter, users]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const handleDeleteConfirm = async () => {
        if (!deleteModal.user) return;
        setActionLoading(true);
        try {
            const token = getToken();
            const res = await fetch(
                `/api/admin/users/${deleteModal.user.id}`,
                { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error("Gagal menghapus pengguna");
            setUsers((prev) => prev.filter((u) => u.id !== deleteModal.user!.id));
            showToast(`${deleteModal.user.fullName} berhasil dihapus`);
            setDeleteModal({ open: false, user: null });
        } catch (e: unknown) {
            showToast(e instanceof Error ? e.message : "Terjadi kesalahan", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRoleConfirm = async () => {
        if (!roleModal.user) return;
        setActionLoading(true);
        try {
            const token = getToken();
            const res = await fetch(
                `/api/admin/users/${roleModal.user.id}/role`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ role: newRole }),
                }
            );
            if (!res.ok) throw new Error("Gagal mengubah role");
            const updated: User = await res.json();
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
            showToast(`Role ${roleModal.user.fullName} diubah ke ${newRole}`);
            setRoleModal({ open: false, user: null });
        } catch (e: unknown) {
            showToast(e instanceof Error ? e.message : "Terjadi kesalahan", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEndSeason = async () => {
        setEndSeasonLoading(true);
        try {
            const token = getToken();
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_LIGA_API_BASE_URL}/liga/admin/end-season`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error(`Gagal mengakhiri season (${res.status})`);
            showToast("Season berhasil diakhiri!", "success");
            setEndSeasonModal(false);
        } catch (e: unknown) {
            showToast(e instanceof Error ? e.message : "Terjadi kesalahan", "error");
        } finally {
            setEndSeasonLoading(false);
        }
    };

    const handleLogout = async () => {
        const token = getToken();
        if (token) {
            try {
                await fetch("/api/auth/logout", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            } catch (error) {
                console.error("Logout failed:", error);
            }
        }

        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        logout();
        window.location.href = "/login";
    };

    return (
        <div className={`${shell} p-4 md:p-6 lg:p-8`}>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className={`${panel} p-6 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Yomu Admin</p>
                        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">User Management</h1>
                        <p className="mt-1 text-sm text-slate-500">{users.length} pengguna terdaftar</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchUsers} className={secondary}>
                            🔄 Refresh Data
                        </button>
                        <button
                            onClick={handleLogout}
                            className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total Users", value: users.length, color: "text-slate-900" },
                        { label: "Admin", value: users.filter((u) => u.role === "ADMIN").length, color: "text-emerald-700" },
                        { label: "Learner (User)", value: users.filter((u) => u.role === "USER").length, color: "text-amber-600" },
                    ].map((s) => (
                        <div key={s.label} className={`${subtlePanel} p-5`}>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-1">{s.label}</p>
                            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                        </div>
                    ))}

                    {/* Liga Season Card */}
                    <div className={`${subtlePanel} p-5 flex flex-col justify-between gap-3`}>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-1">Liga Season</p>
                            <p className="text-sm font-medium text-slate-400">Kelola season aktif</p>
                        </div>
                        <button
                            onClick={() => setEndSeasonModal(true)}
                            className="w-full rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-rose-800"
                        >
                            🏁 End Season
                        </button>
                    </div>
                </div>

                {/* Table Panel */}
                <div className={`${panel} overflow-hidden`}>
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-3 p-5 border-b border-slate-100">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                            <input
                                type="text"
                                placeholder="Cari nama, email, atau username..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`${inputStyle} pl-9`}
                            />
                        </div>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className={`${inputStyle} sm:w-48 cursor-pointer`}
                        >
                            <option value="">Semua Role</option>
                            <option value="ADMIN">Admin</option>
                            <option value="USER">User</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="py-16 text-center text-sm font-semibold text-slate-400">Memuat data...</div>
                    ) : error ? (
                        <div className="py-16 text-center text-sm font-semibold text-rose-500">{error}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-500 text-left">
                                    <th className="px-5 py-4">Pengguna</th>
                                    <th className="px-5 py-4">Username</th>
                                    <th className="px-5 py-4">Role</th>
                                    <th className="px-5 py-4">Bergabung</th>
                                    <th className="px-5 py-4">Aksi</th>
                                </tr>
                                </thead>
                                <tbody>
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                                            Tidak ada pengguna ditemukan
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((u) => (
                                        <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-sm font-black text-emerald-700">
                                                        {getInitials(u.fullName)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{u.fullName || "—"}</p>
                                                        <p className="text-xs font-medium text-slate-500">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600 font-medium">@{u.username || "—"}</td>
                                            <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${u.role === "ADMIN"
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : "bg-slate-100 text-slate-600"
                                                        }`}
                                                    >
                                                        {u.role}
                                                    </span>
                                            </td>
                                            <td className="px-5 py-4 text-slate-500 text-xs font-medium">{formatDate(u.createdAt)}</td>
                                            <td className="px-5 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { setRoleModal({ open: true, user: u }); setNewRole(u.role); }}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                                                    >
                                                        🛡️ Role
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteModal({ open: true, user: u })}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors"
                                                    >
                                                        🗑️ Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/30">
                                    <span className="text-xs font-medium text-slate-500">
                                        Menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length}
                                    </span>
                                    <div className="flex gap-1.5">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                                            <button
                                                key={n}
                                                onClick={() => setPage(n)}
                                                className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg transition-colors ${n === page
                                                    ? "bg-emerald-700 text-white shadow-sm shadow-emerald-700/20"
                                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                }`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* End Season Modal */}
            {endSeasonModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className={`${panel} w-full max-w-sm p-6`}>
                        <h3 className="text-xl font-black tracking-tight text-slate-950 mb-1">Akhiri Season</h3>
                        <p className="text-sm font-medium text-slate-600 mb-6 leading-relaxed">
                            Apakah Anda yakin ingin mengakhiri season yang sedang berjalan? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setEndSeasonModal(false)}
                                className="px-4 py-2.5 text-sm font-bold border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleEndSeason}
                                disabled={endSeasonLoading}
                                className={danger}
                            >
                                {endSeasonLoading ? "Memproses..." : "Ya, Akhiri Season"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Modal */}
            {roleModal.open && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className={`${panel} w-full max-w-sm p-6`}>
                        <h3 className="text-xl font-black tracking-tight text-slate-950 mb-1">Ubah Role Pengguna</h3>
                        <p className="text-sm font-medium text-slate-500 mb-5">Mengubah role untuk <span className="font-bold text-slate-800">{roleModal.user?.fullName}</span></p>

                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Pilih Role Baru</label>
                        <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className={`${inputStyle} mb-6`}
                        >
                            <option value="USER">User (Learner)</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setRoleModal({ open: false, user: null })}
                                className="px-4 py-2.5 text-sm font-bold border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleRoleConfirm}
                                disabled={actionLoading}
                                className={primary}
                            >
                                {actionLoading ? "Menyimpan..." : "Simpan Perubahan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className={`${panel} w-full max-w-sm p-6`}>
                        <h3 className="text-xl font-black tracking-tight text-slate-950 mb-1">Hapus Pengguna</h3>
                        <p className="text-sm font-medium text-slate-600 mb-6 leading-relaxed">
                            Apakah Anda yakin ingin menghapus <strong className="text-slate-900">{deleteModal.user?.fullName}</strong>? Tindakan ini permanen dan tidak dapat dibatalkan.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteModal({ open: false, user: null })}
                                className="px-4 py-2.5 text-sm font-bold border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={actionLoading}
                                className={danger}
                            >
                                {actionLoading ? "Menghapus..." : "Ya, Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl border text-sm font-bold shadow-lg z-50 transition-all ${toast.type === "success"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}
                >
                    {toast.msg}
                </div>
            )}
        </div>
    );
};