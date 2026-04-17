"use client";

import { useState } from "react";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        localStorage.setItem("token", result.access_token);
        alert("Login berhasil!");
      } else {
        const errorData = await response.json();
        alert(`Login gagal: ${errorData.message || "Email/Username atau password salah"}`);
      }
    } catch (error) {
      alert("Tidak bisa konek ke server! Pastikan API Gateway/Backend sudah menyala.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-8 border rounded-lg shadow-sm">
        <h1 className="text-xl font-bold">Login Yomu</h1>
        
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
}