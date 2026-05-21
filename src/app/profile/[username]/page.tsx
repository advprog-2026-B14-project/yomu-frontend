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

const shell = "min-h-screen bg-[radial-gradient(circle_at_top_left,#ccfbf1_0,#ffffff_30%,#f8fafc_72%)] text-slate-900 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8";
const panel = "w-full max-w-md rounded-2xl border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur p-8";
const inputStyle = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const primary = "w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300";
const secondary = "w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 disabled:translate-y-0 disabled:cursor-not-allowed disabled:text-slate-400";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const [isOwner, setIsOwner] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Form states
  const [editFormData, setEditFormData] = useState({ fullName: "", username: "" });
  const [pwdFormData, setPwdFormData] = useState({ oldPassword: "", newPassword: "" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
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
    setFormError("");
    setFormSuccess("");

    if (editFormData.username.includes(" ")) {
      setFormError("Username tidak boleh mengandung spasi.");
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
      }

      setFormSuccess("Profil berhasil diperbarui!");
      setTimeout(() => {
        setShowEditProfile(false);
        setFormSuccess("");
      }, 1500);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
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
        throw new Error(errText || "Gagal mengubah password");
      }

      setFormSuccess("Password berhasil diubah!");
      setTimeout(() => {
        setShowChangePassword(false);
        setFormSuccess("");
        setPwdFormData({ oldPassword: "", newPassword: "" });
      }, 1500);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`${shell} justify-center items-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={shell}>
        <div className={`${panel} text-center`}>
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-rose-100 text-xl font-black text-rose-700 shadow-sm">
            !
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-2">Oops!</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className={secondary}
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className={panel}>
        <div className="text-center">
          {/* Avatar Placeholder */}
          <div className="relative mx-auto w-24 h-24 rounded-2xl overflow-hidden shadow-lg shadow-emerald-700/20 mb-4 grid place-items-center bg-emerald-700 text-4xl font-black text-white">
            {profile?.fullName.charAt(0).toUpperCase()}
          </div>

          <h2 className="text-2xl font-black text-slate-950 tracking-tight">
            {profile?.fullName}
          </h2>
          <p className="text-sm font-bold uppercase tracking-[0.1em] text-emerald-700 mb-6">@{profile?.username}</p>

          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Role</p>
            <p className="text-slate-900 font-bold flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              {profile?.role === "ADMIN" ? "Administrator" : "Learner"}
            </p>
          </div>

          {isOwner && (
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { setShowEditProfile(true); setFormError(""); setFormSuccess(""); }}
                className={primary}
              >
                Edit Profil
              </button>
              <button 
                onClick={() => { setShowChangePassword(true); setFormError(""); setFormSuccess(""); }}
                className={secondary}
              >
                Ganti Password
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-center">
          <Link 
            href="/"
            className="text-sm font-bold text-slate-500 hover:text-emerald-700 transition-colors"
          >
            &larr; Kembali ke Beranda
          </Link>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className={`${panel} relative`}>
            <button onClick={() => setShowEditProfile(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 font-bold">✕</button>
            <h3 className="text-xl font-black text-slate-950 mb-6">Edit Profil</h3>
            
            {formError && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">{formError}</div>}
            {formSuccess && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium">{formSuccess}</div>}
            
            <form onSubmit={handleEditProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                  className={inputStyle}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Username</label>
                <input 
                  type="text" 
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                  className={inputStyle}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`${primary} mt-2`}
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className={`${panel} relative`}>
            <button onClick={() => setShowChangePassword(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 font-bold">✕</button>
            <h3 className="text-xl font-black text-slate-950 mb-6">Ganti Password</h3>
            
            {formError && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">{formError}</div>}
            {formSuccess && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium">{formSuccess}</div>}
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password Lama</label>
                <input 
                  type="password" 
                  value={pwdFormData.oldPassword}
                  onChange={(e) => setPwdFormData({...pwdFormData, oldPassword: e.target.value})}
                  className={inputStyle}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password Baru</label>
                <input 
                  type="password" 
                  value={pwdFormData.newPassword}
                  onChange={(e) => setPwdFormData({...pwdFormData, newPassword: e.target.value})}
                  className={inputStyle}
                  required
                  minLength={8}
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`${primary} mt-2`}
              >
                {isSubmitting ? "Mengubah..." : "Ganti Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
