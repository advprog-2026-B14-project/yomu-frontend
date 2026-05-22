"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getToken, getUser } from "@/lib/auth";
import Link from "next/link";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  username: string;
  role: string;
  createdAt: string;
}

const shell = "min-h-screen bg-[radial-gradient(circle_at_top_left,#ccfbf1_0,#ffffff_30%,#f8fafc_72%)] text-slate-900 py-12 px-4 sm:px-6 lg:px-8";
const panel = "rounded-2xl border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur p-8";
const inputStyle = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const primary = "rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300";
const secondary = "rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 disabled:translate-y-0 disabled:cursor-not-allowed disabled:text-slate-400";
const danger = "w-full rounded-xl bg-rose-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const [isOwner, setIsOwner] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  // Form states
  const [editFormData, setEditFormData] = useState({ fullName: "", username: "" });
  const [pwdFormData, setPwdFormData] = useState({ oldPassword: "", newPassword: "" });
  const [deletePassword, setDeletePassword] = useState("");
  
  // Status messages
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [pwdMsg, setPwdMsg] = useState({ type: "", text: "" });
  const [deleteMsg, setDeleteMsg] = useState({ type: "", text: "" });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = getToken();
      const currentUser = getUser();
      
      if (!token) {
        router.push("/login");
        return;
      }
      
      const username = params?.username as string;
      if (currentUser && currentUser.username === username) {
        setIsOwner(true);
      }

      try {
        if (!username) return;
        const res = await fetch(`/api/user/username/${username}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 403) throw new Error("Akses ditolak: Anda tidak memiliki izin untuk melihat profil ini.");
          if (res.status === 404) throw new Error("Profil tidak ditemukan.");
          throw new Error("Gagal mengambil data profil.");
        }

        const data = await res.json();
        setProfile(data);
        setEditFormData({ fullName: data.fullName, username: data.username });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [params?.username, router]);

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg({ type: "", text: "" });

    if (editFormData.username.includes(" ")) {
      setProfileMsg({ type: "error", text: "Username tidak boleh mengandung spasi." });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = getToken();
      const res = await fetch(`/api/user/profile/${profile?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Gagal mengubah profil");
      }

      const updatedProfile = await res.json();
      setProfile(updatedProfile);
      
      // Update local storage user if owner
      const currentUser = getUser();
      if (currentUser && currentUser.id === profile?.id) {
        currentUser.fullName = updatedProfile.fullName;
        currentUser.username = updatedProfile.username;
        localStorage.setItem("user", JSON.stringify(currentUser));
        document.cookie = `user=${JSON.stringify(currentUser)}; path=/; max-age=${60 * 60 * 24 * 7}`;
        
        // If username changed, redirect to new profile URL
        if (params?.username !== updatedProfile.username) {
          router.replace(`/profile/${updatedProfile.username}`);
        }
      }

      setProfileMsg({ type: "success", text: "Profil berhasil diperbarui!" });
      setTimeout(() => setProfileMsg({ type: "", text: "" }), 3000);
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg({ type: "", text: "" });

    if (pwdFormData.oldPassword === pwdFormData.newPassword) {
      setPwdMsg({ type: "error", text: "Password baru tidak boleh sama dengan password lama." });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = getToken();
      const res = await fetch(`/api/user/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pwdFormData),
      });

      if (!res.ok) {
        const errText = await res.text();
        // Parse Supabase ugly error JSON inside the string if it exists
        if (errText.includes("same_password") || errText.includes("different from the old password")) {
          throw new Error("Password baru tidak boleh sama dengan password lama.");
        }
        
        try {
          const match = errText.match(/\{.*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed.msg) throw new Error(parsed.msg);
          }
        } catch (e) {
          // ignore parsing error
        }
        throw new Error(errText || "Gagal mengubah password");
      }

      setPwdMsg({ type: "success", text: "Password berhasil diubah!" });
      setPwdFormData({ oldPassword: "", newPassword: "" });
      setTimeout(() => setPwdMsg({ type: "", text: "" }), 3000);
    } catch (err: any) {
      setPwdMsg({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteMsg({ type: "", text: "" });
    setIsSubmitting(true);
    
    try {
      const token = getToken();
      const res = await fetch(`/api/user/account`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Gagal menghapus akun");
      }

      setDeleteMsg({ type: "success", text: "Akun berhasil dihapus! Mengalihkan..." });
      setTimeout(() => {
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login";
      }, 1500);
    } catch (err: any) {
      setDeleteMsg({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`${shell} flex justify-center items-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${shell} flex justify-center items-center`}>
        <div className={`${panel} text-center max-w-md`}>
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-rose-100 text-xl font-black text-rose-700 shadow-sm">
            !
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-2">Oops!</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className={`${secondary} w-full`}
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* L E F T   S I D E */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className={`${panel} text-center`}>
            <div className="relative mx-auto w-32 h-32 rounded-3xl overflow-hidden shadow-lg shadow-emerald-700/20 mb-6 grid place-items-center bg-emerald-700 text-6xl font-black text-white">
              {profile?.fullName.charAt(0).toUpperCase()}
            </div>

            <h2 className="text-2xl font-black text-slate-950 tracking-tight mb-1">
              {profile?.fullName}
            </h2>
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-emerald-700 mb-6">@{profile?.username}</p>

            <div className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Role</span>
              <span className="text-slate-900 font-bold flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                {profile?.role === "ADMIN" ? "Administrator" : "Learner"}
              </span>
            </div>
          </div>

          {/* Achievement Placeholders */}
          <div className={panel}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">Pencapaian (Segera Hadir)</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-3 w-full bg-slate-100 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* R I G H T   S I D E */}
        <div className="lg:col-span-2 space-y-6">
          <div className={panel}>
            <h3 className="text-2xl font-black text-slate-950 mb-6 border-b border-slate-100 pb-4">Data Diri</h3>
            
            {isOwner ? (
              <form onSubmit={handleEditProfile} className="space-y-6">
                {profileMsg.text && (
                  <div className={`p-4 rounded-xl text-sm font-medium ${profileMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    {profileMsg.text}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Username</label>
                    <input 
                      type="text" 
                      value={editFormData.username}
                      onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                      className={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={editFormData.fullName}
                      onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                      className={inputStyle}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={isSubmitting} className={primary}>
                    {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Username</p>
                  <p className="text-slate-900 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">@{profile?.username}</p>
                </div>
                <div>
                  <p className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Nama Lengkap</p>
                  <p className="text-slate-900 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">{profile?.fullName}</p>
                </div>
              </div>
            )}
          </div>

          {isOwner && (
            <>
              <div className={panel}>
                <h3 className="text-2xl font-black text-slate-950 mb-6 border-b border-slate-100 pb-4">Ganti Password</h3>
                <form onSubmit={handleChangePassword} className="space-y-6">
                  {pwdMsg.text && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${pwdMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                      {pwdMsg.text}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Password Lama</label>
                      <input 
                        type="password" 
                        value={pwdFormData.oldPassword}
                        onChange={(e) => setPwdFormData({...pwdFormData, oldPassword: e.target.value})}
                        className={inputStyle}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Password Baru</label>
                      <input 
                        type="password" 
                        value={pwdFormData.newPassword}
                        onChange={(e) => setPwdFormData({...pwdFormData, newPassword: e.target.value})}
                        className={inputStyle}
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={isSubmitting} className={primary}>
                      {isSubmitting ? "Mengubah..." : "Simpan Password"}
                    </button>
                  </div>
                </form>
              </div>

              <div className={`${panel} border-rose-200`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-rose-700 mb-1">Hapus Akun</h3>
                    <p className="text-sm text-slate-600">Tindakan ini tidak dapat dibatalkan. Semua data akan terhapus.</p>
                  </div>
                  <button 
                    onClick={() => { setShowDeleteAccount(true); setDeleteMsg({ type: "", text: "" }); setDeletePassword(""); }}
                    className={`${danger} w-auto whitespace-nowrap`}
                  >
                    Hapus Akun Permanen
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Account Modal (Only for Owner) */}
      {isOwner && showDeleteAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className={`${panel} relative border-rose-200 max-w-md w-full`}>
            <button onClick={() => setShowDeleteAccount(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 font-bold">✕</button>
            
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-rose-100 text-xl font-black text-rose-700 shadow-sm">
              !
            </div>
            
            <h3 className="text-xl font-black text-slate-950 mb-2 text-center">Yakin ingin hapus akun?</h3>
            <p className="text-sm text-slate-600 mb-6 text-center leading-relaxed">
              Tindakan ini tidak dapat dibatalkan. Semua data kamu akan terhapus secara permanen.
            </p>
            
            {deleteMsg.text && (
              <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${deleteMsg.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                {deleteMsg.text}
              </div>
            )}
            
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Masukkan Password untuk konfirmasi</label>
                <input 
                  type="password" 
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className={inputStyle}
                  placeholder="Password Anda..."
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowDeleteAccount(false)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !deletePassword}
                  className="w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Menghapus..." : "Ya, Hapus Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
