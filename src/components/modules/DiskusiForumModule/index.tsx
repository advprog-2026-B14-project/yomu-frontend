"use client";

import React, { useState, useEffect } from "react";

export const DiskusiForumModule = () => {
  const [comments, setComments] = useState<any[]>([]);
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      const res = await fetch("http://localhost:8085/api/comments");
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8085/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "550e8400-e29b-41d4-a716-446655440000",
          readingId: "770e8400-e29b-41d4-a716-446655440001",
          content: newContent,
        }),
      });
      if (res.ok) {
        setNewContent("");
        fetchComments();
      }
    } catch (err) {
      setErrorMsg("Gagal menambah komentar");
    }
  };
  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8085/api/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (res.ok) {
        setEditingId(null);
        fetchComments();
      } else {
        const errorData = await res
          .json()
          .catch(() => ({ message: "Unknown Error" }));
        console.error("Gagal update:", errorData);
        setErrorMsg(`Gagal update: ${errorData.message || res.status}`);
      }
    } catch (err) {
      setErrorMsg("Gagal menghubungi server");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus komentar ini?")) return;
    try {
      const res = await fetch(`http://localhost:8085/api/comments/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchComments();
      } else {
        setErrorMsg(`Gagal hapus: Status ${res.status}`);
      }
    } catch (err) {
      setErrorMsg("Gagal menghubungi server");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-8 dark:bg-black">
      <main className="w-full max-w-4xl rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-3xl font-bold text-center mb-8 dark:text-white">
          Yomu Forum Diskusi
        </h1>

        {}
        <form onSubmit={handleCreate} className="mb-10">
          <textarea
            className="w-full p-4 rounded-xl border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Tulis pendapatmu..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            required
          />
          <button className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
            Kirim Komentar
          </button>
        </form>

        {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}

        {}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950">
              {editingId === comment.id ? (
                <div>
                  <textarea
                    className="w-full p-2 border rounded dark:bg-zinc-800 dark:text-white"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleUpdate(comment.id)}
                      className="text-green-500 text-sm font-bold">
                      Simpan
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-zinc-500 text-sm">
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    {comment.content}
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-zinc-500">
                      User: {comment.userId.substring(0, 8)}
                    </span>
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditContent(comment.content);
                        }}
                        className="text-blue-500 text-xs hover:underline">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-red-500 text-xs hover:underline">
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
