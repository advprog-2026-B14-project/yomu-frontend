"use client";

import { useState } from "react";
import { saveAuth, AuthUser } from "@/lib/auth";

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
      </form>
    </div>
  );
};
