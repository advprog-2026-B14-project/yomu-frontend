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
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="bg-red-500/10 border border-red-500/50 backdrop-blur-md text-red-200 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
          <h2 className="text-xl font-bold mb-2">Oops!</h2>
          <p>{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-20 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-purple-500/10 hover:border-white/30">
          <div className="px-8 py-10">
            <div className="text-center">
              {/* Avatar Placeholder */}
              <div className="relative mx-auto w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-lg mb-6 group">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-blue-500 opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-white z-10">
                  {profile?.fullName.charAt(0).toUpperCase()}
                </div>
              </div>

              <h2 className="text-3xl font-extrabold text-white tracking-tight mb-1">
                {profile?.fullName}
              </h2>
              <p className="text-purple-300 font-medium text-lg mb-6">@{profile?.username}</p>

              <div className="space-y-4 text-left mb-6">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-sm text-gray-400 mb-1">Role</p>
                  <p className="text-white font-medium flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                    {profile?.role === "ADMIN" ? "Administrator" : "Pengguna"}
                  </p>
                </div>
              </div>

              {isOwner && (
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => { setShowEditProfile(true); setFormError(""); setFormSuccess(""); }}
                    className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors duration-300 border border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  >
                    Edit Profil
                  </button>
                  <button 
                    onClick={() => { setShowChangePassword(true); setFormError(""); setFormSuccess(""); }}
                    className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors duration-300 border border-white/20"
                  >
                    Ganti Password
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-black/40 px-8 py-5 flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/"
              className="flex-1 text-center py-2 px-4 rounded-lg bg-transparent hover:bg-white/10 text-gray-300 hover:text-white font-medium transition-all duration-300 text-sm"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowEditProfile(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <h3 className="text-2xl font-bold text-white mb-6">Edit Profil</h3>
            
            {formError && <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-200 rounded-lg text-sm">{formError}</div>}
            {formSuccess && <div className="mb-4 p-3 bg-green-500/20 border border-green-500 text-green-200 rounded-lg text-sm">{formSuccess}</div>}
            
            <form onSubmit={handleEditProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                <input 
                  type="text" 
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-xl font-medium transition-colors duration-300 mt-2"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowChangePassword(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <h3 className="text-2xl font-bold text-white mb-6">Ganti Password</h3>
            
            {formError && <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-200 rounded-lg text-sm">{formError}</div>}
            {formSuccess && <div className="mb-4 p-3 bg-green-500/20 border border-green-500 text-green-200 rounded-lg text-sm">{formSuccess}</div>}
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password Lama</label>
                <input 
                  type="password" 
                  value={pwdFormData.oldPassword}
                  onChange={(e) => setPwdFormData({...pwdFormData, oldPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password Baru</label>
                <input 
                  type="password" 
                  value={pwdFormData.newPassword}
                  onChange={(e) => setPwdFormData({...pwdFormData, newPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  required
                  minLength={8}
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-xl font-medium transition-colors duration-300 mt-2"
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
