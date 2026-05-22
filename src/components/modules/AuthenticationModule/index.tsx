"use client";

import { useState } from "react";
import { saveAuth, AuthUser } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

const shell = "min-h-screen bg-[radial-gradient(circle_at_top_left,#ccfbf1_0,#ffffff_30%,#f8fafc_72%)] text-slate-900";
const panel = "rounded-2xl border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur";
const input = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const primary = "w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300";
const secondary = "w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50";

export const LoginModule = () => {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Error logging in with Google:", error.message);
      setErrorMessage("Gagal masuk dengan Google: " + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        const token = result.access_token;

        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        const userId = payload.sub;

        const userRes = await fetch(`/api/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userRes.json();

        const user: AuthUser = {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          fullName: userData.fullName,
          username: userData.username,
        };

        saveAuth(token, user);

        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
        document.cookie = `user=${JSON.stringify(user)}; path=/; max-age=${60 * 60 * 24 * 7}`;

        if (user.role === "ADMIN") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/";
        }
      } else {
        let message = "Login gagal. Email/Username atau password salah.";

        try {
          const data = await response.json();
          if (typeof data?.message === "string" && data.message.trim().length > 0) {
            const normalized = data.message.toLowerCase();
            if (!normalized.includes("env") && !normalized.includes("database") && !normalized.includes("secret")) {
              message = data.message;
            }
          }
        } catch {
        }

        setErrorMessage(message);
      }
    } catch (error) {
      setErrorMessage("Tidak dapat terhubung ke server. Silakan coba lagi nanti.");
    }
  };

  return (
    <div className={shell}>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className={`${panel} w-full max-w-md p-8`}>
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-emerald-700 text-xl font-black text-white shadow-lg shadow-emerald-700/20">
              Y
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">Masuk ke Yomu</h1>
            <p className="mt-2 text-sm text-slate-500">Selamat datang kembali di Learning OS</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {errorMessage ? (
              <div className="p-3 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                {errorMessage}
              </div>
            ) : null}
            {successMessage ? (
              <div className="p-3 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
                {successMessage}
              </div>
            ) : null}
            
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Email atau Username
              </label>
              <input 
                name="identifier" 
                placeholder="Masukkan email atau username" 
                className={input}
                onChange={handleChange} 
                required
              />
            </div>
            
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <input 
                name="password" 
                type="password" 
                placeholder="Masukkan password" 
                className={input}
                onChange={handleChange} 
                required
              />
            </div>
            
            <button type="submit" className={primary}>
              Masuk
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white/80 px-2 text-slate-500 font-semibold backdrop-blur">Atau lanjutkan dengan</span>
              </div>
            </div>

            <button type="button" onClick={handleGoogleLogin} className={secondary}>
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20C44 22.659 43.862 21.35 43.611 20.083z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-0.792 2.237-2.231 4.166-4.087 5.571c0.001-0.001 0.002-0.001 0.003-0.002l6.19 5.238C36.971 39.205 44 34 44 24C44 22.659 43.862 21.35 43.611 20.083z"/>
              </svg>
              Google
            </button>
            
            <p className="mt-4 text-center text-sm text-slate-500">
              Belum punya akun? <a href="/register" className="font-bold text-emerald-700 hover:underline">Daftar sekarang</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export const RegisterModule = () => {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    password: "",
    username: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleRegister = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Error registering with Google:", error.message);
      setErrorMessage("Gagal mendaftar dengan Google: " + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (formData.username.includes(" ")) {
      setErrorMessage("Username tidak boleh mengandung spasi.");
      return;
    }

    try {
      const response = await fetch(`/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccessMessage("Register berhasil! Silakan login untuk melanjutkan.");
      } else {
        const fallbackMessage = "Register gagal. Silakan periksa kembali data Anda.";
        let message = fallbackMessage;

        try {
          const data = await response.json();
          if (typeof data?.message === "string" && data.message.trim().length > 0) {
            message = data.message;
          }
        } catch {
        }

        if (message.toLowerCase().includes("env") || message.toLowerCase().includes("database")) {
          message = fallbackMessage;
        }

        setErrorMessage(message);
      }
    } catch (error) {
      setErrorMessage("Tidak dapat terhubung ke server. Silakan coba lagi nanti.");
    }
  };

  return (
    <div className={shell}>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className={`${panel} w-full max-w-md p-8`}>
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-emerald-700 text-xl font-black text-white shadow-lg shadow-emerald-700/20">
              Y
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">Daftar Akun Baru</h1>
            <p className="mt-2 text-sm text-slate-500">Bergabung dengan Yomu Learning OS</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {errorMessage ? (
              <div className="p-3 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                {errorMessage}
              </div>
            ) : null}
            {successMessage ? (
              <div className="p-3 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
                {successMessage}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Nama Lengkap</label>
                <input name="fullName" placeholder="John Doe" className={input} onChange={handleChange} required />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Username</label>
                <input name="username" placeholder="johndoe" className={input} onChange={handleChange} required />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Email</label>
              <input name="email" type="email" placeholder="nama@email.com" className={input} onChange={handleChange} required />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
              <input name="password" type="password" placeholder="Minimal 8 karakter" className={input} onChange={handleChange} required />
            </div>

            <button type="submit" className={primary}>Daftar Sekarang</button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white/80 px-2 text-slate-500 font-semibold backdrop-blur">Atau daftar dengan</span>
              </div>
            </div>

            <button type="button" onClick={handleGoogleRegister} className={secondary}>
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20C44 22.659 43.862 21.35 43.611 20.083z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-0.792 2.237-2.231 4.166-4.087 5.571c0.001-0.001 0.002-0.001 0.003-0.002l6.19 5.238C36.971 39.205 44 34 44 24C44 22.659 43.862 21.35 43.611 20.083z"/>
              </svg>
              Google
            </button>
            
            <p className="mt-4 text-center text-sm text-slate-500">
              Sudah punya akun? <a href="/login" className="font-bold text-emerald-700 hover:underline">Masuk di sini</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
