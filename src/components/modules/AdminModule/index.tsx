"use client";

import { useState, useEffect, useCallback } from "react";

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
    const [newRole, setNewRole] = useState("USER");
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

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

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">User management</h1>
                    <p className="mt-1 text-sm text-gray-500">{users.length} pengguna terdaftar</p>
                </div>
                <button
                    onClick={fetchUsers}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-3 gap-4">
                {[
                    { label: "Total users", value: users.length, color: "text-gray-900" },
                    { label: "Admin", value: users.filter((u) => u.role === "ADMIN").length, color: "text-blue-600" },
                    { label: "User biasa", value: users.filter((u) => u.role === "USER").length, color: "text-amber-600" },
                ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-white border border-gray-100 p-4">
                        <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                        <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
                {/* Toolbar */}
                <div className="flex gap-3 p-4 border-b border-gray-100">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                        <input
                            type="text"
                            placeholder="Cari nama, email, atau username..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                    >
                        <option value="">Semua role</option>
                        <option value="ADMIN">Admin</option>
                        <option value="USER">User</option>
                    </select>
                </div>

                {loading ? (
                    <div className="py-16 text-center text-sm text-gray-400">Memuat data...</div>
                ) : error ? (
                    <div className="py-16 text-center text-sm text-red-500">{error}</div>
                ) : (
                    <>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs text-gray-500">
                                    <th className="px-4 py-3 text-left font-medium">Pengguna</th>
                                    <th className="px-4 py-3 text-left font-medium">Username</th>
                                    <th className="px-4 py-3 text-left font-medium">Role</th>
                                    <th className="px-4 py-3 text-left font-medium">Bergabung</th>
                                    <th className="px-4 py-3 text-left font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-gray-400">
                                            Tidak ada pengguna ditemukan
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((u) => (
                                        <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
                                                        {getInitials(u.fullName)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{u.fullName || "—"}</p>
                                                        <p className="text-xs text-gray-400">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">@{u.username || "—"}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${u.role === "ADMIN"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-gray-100 text-gray-600"
                                                        }`}
                                                >
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400">{formatDate(u.createdAt)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { setRoleModal({ open: true, user: u }); setNewRole(u.role); }}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                    >
                                                        🛡️ Role
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteModal({ open: true, user: u })}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
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
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                                <span className="text-xs text-gray-400">
                                    {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length}
                                </span>
                                <div className="flex gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                                        <button
                                            key={n}
                                            onClick={() => setPage(n)}
                                            className={`px-3 py-1 text-xs rounded-lg border transition-colors ${n === page
                                                ? "bg-gray-100 border-gray-300 font-medium"
                                                : "border-gray-200 hover:bg-gray-50"
                                                }`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Role Modal */}
            {roleModal.open && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 w-80 shadow-lg">
                        <h3 className="font-semibold text-gray-900 mb-1">Ubah role pengguna</h3>
                        <p className="text-sm text-gray-500 mb-4">Mengubah role untuk {roleModal.user?.fullName}</p>
                        <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="w-full mb-4 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                        >
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setRoleModal({ open: false, user: null })}
                                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleRoleConfirm}
                                disabled={actionLoading}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {actionLoading ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 w-80 shadow-lg">
                        <h3 className="font-semibold text-gray-900 mb-1">Hapus pengguna</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Hapus <strong>{deleteModal.user?.fullName}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setDeleteModal({ open: false, user: null })}
                                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={actionLoading}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {actionLoading ? "Menghapus..." : "Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg border text-sm z-50 ${toast.type === "success"
                        ? "bg-white border-green-200 text-green-700"
                        : "bg-white border-red-200 text-red-700"
                        }`}
                >
                    {toast.msg}
                </div>
            )}
        </div>
    );
};