"use client";

import { useState } from "react";
import { saveAuth, AuthUser } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

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
          window.location.href = "/dashboard";
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
          // jika respons tidak dapat diparsing, gunakan pesan umum
        }

        setErrorMessage(message);
      }
    } catch (error) {
      setErrorMessage("Tidak dapat terhubung ke server. Silakan coba lagi nanti.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-8 border rounded-lg shadow-sm">
        <h1 className="text-xl font-bold">Login Yomu</h1>

        {errorMessage ? (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded">
            {errorMessage}
          </div>
        ) : null}
        {successMessage ? (
          <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded">
            {successMessage}
          </div>
        ) : null}
        
        <input 
          name="identifier" 
          placeholder="Email or Username" 
          className="p-2 border rounded"
          onChange={handleChange} 
          required
        />
        
        <input 
          name="password" 
          type="password" 
          placeholder="Password" 
          className="p-2 border rounded"
          onChange={handleChange} 
          required
        />
        
        <button 
          type="submit" 
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Login
        </button>

        <div className="flex items-center justify-center my-2 text-sm text-gray-500">
          <span className="w-1/3 border-b"></span>
          <span className="px-2">Atau</span>
          <span className="w-1/3 border-b"></span>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="p-2 border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20C44 22.659 43.862 21.35 43.611 20.083z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-0.792 2.237-2.231 4.166-4.087 5.571c0.001-0.001 0.002-0.001 0.003-0.002l6.19 5.238C36.971 39.205 44 34 44 24C44 22.659 43.862 21.35 43.611 20.083z"/>
          </svg>
          Masuk dengan Google
        </button>
      </form>
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
          // Jika respons bukan JSON, tetap gunakan pesan fallback
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
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-8 border rounded-lg shadow-sm">
        <h1 className="text-xl font-bold">Register Yomu</h1>
        {errorMessage ? (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded">
            {errorMessage}
          </div>
        ) : null}
        {successMessage ? (
          <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded">
            {successMessage}
          </div>
        ) : null}

        <input name="email" placeholder="Email" className="p-2 border rounded" onChange={handleChange} required />
        <input name="fullName" placeholder="Full Name" className="p-2 border rounded" onChange={handleChange} required />
        <input name="username" placeholder="Username" className="p-2 border rounded" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" className="p-2 border rounded" onChange={handleChange} required />
        <button type="submit" className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">Register</button>

        <div className="flex items-center justify-center my-2 text-sm text-gray-500">
          <span className="w-1/3 border-b"></span>
          <span className="px-2">Atau</span>
          <span className="w-1/3 border-b"></span>
        </div>

        <button
          type="button"
          onClick={handleGoogleRegister}
          className="p-2 border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20C44 22.659 43.862 21.35 43.611 20.083z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-0.792 2.237-2.231 4.166-4.087 5.571c0.001-0.001 0.002-0.001 0.003-0.002l6.19 5.238C36.971 39.205 44 34 44 24C44 22.659 43.862 21.35 43.611 20.083z"/>
          </svg>
          Daftar dengan Google
        </button>
      </form>
    </div>
  );
};
