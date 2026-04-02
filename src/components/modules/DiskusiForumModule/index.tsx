"use client";

import React, { useState, useEffect } from "react";

const API_BASE_URL = "http://13.222.228.99:8085/api/comments";

export const DiskusiForumModule = () => {
  const [comments, setComments] = useState<any[]>([]);
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const fetchComments = async () => {
    try {
      const res = await fetch(API_BASE_URL);
      if (!res.ok) throw new Error("Gagal mengambil data dari AWS");
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
    if (!newContent.trim()) return;
    await postComment(newContent, null);
    setNewContent("");
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    await postComment(replyContent, parentId);
    setReplyContent("");
    setReplyingToId(null);
  };

  const postComment = async (content: string, parentId: string | null) => {
    try {
      const res = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "550e8400-e29b-41d4-a716-446655440000",
          readingId: "770e8400-e29b-41d4-a716-446655440001",
          content: content,
          parentCommentId: parentId,
        }),
      });
      if (res.ok) fetchComments();
    } catch (err) {
      setErrorMsg("Gagal mengirim komentar");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchComments();
      }
    } catch (err) {
      setErrorMsg("Gagal mengupdate komentar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus komentar ini?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchComments();
    } catch (err) {
      setErrorMsg("Gagal menghapus komentar");
    }
  };

  const rootComments = comments.filter((c) => !c.parentCommentId);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parentCommentId === parentId);

  const renderComment = (comment: any, isReply = false) => (
    <div
      key={comment.id}
      className={`p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 shadow-sm ${
        isReply ? "ml-10 bg-zinc-50/50" : "bg-white"
      }`}>
      {editingId === comment.id ? (
        <div className="space-y-3">
          <textarea
            className="w-full p-3 rounded-lg border border-zinc-300 dark:bg-zinc-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleUpdate(comment.id)}
              className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-green-700 transition">
              Simpan
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="bg-zinc-500 text-white px-4 py-1.5 rounded-md text-sm hover:bg-zinc-600 transition">
              Batal
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-zinc-800 dark:text-zinc-200 mb-4 whitespace-pre-wrap">
            {comment.content}
          </p>
          <div className="flex gap-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            <button
              onClick={() => setReplyingToId(comment.id)}
              className="hover:text-blue-600 transition">
              Balas
            </button>
            <button
              onClick={() => {
                setEditingId(comment.id);
                setEditContent(comment.content);
              }}
              className="hover:text-amber-600 transition">
              Edit
            </button>
            <button
              onClick={() => handleDelete(comment.id)}
              className="hover:text-red-600 transition">
              Hapus
            </button>
          </div>
        </>
      )}

      {replyingToId === comment.id && (
        <div className="mt-4 space-y-3 pl-4 border-l-2 border-blue-500">
          <textarea
            className="w-full p-3 rounded-lg border border-zinc-300 dark:bg-zinc-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tulis balasan..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleReply(comment.id)}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-700 transition">
              Balas
            </button>
            <button
              onClick={() => setReplyingToId(null)}
              className="bg-zinc-500 text-white px-4 py-1.5 rounded-md text-sm hover:bg-zinc-600 transition">
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {getReplies(comment.id).map((reply) => renderComment(reply, true))}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 p-8 dark:bg-black font-sans">
      <main className="w-full max-w-4xl rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-3xl font-bold text-center mb-8 dark:text-white">
          Yomu Forum Diskusi
        </h1>

        <form onSubmit={handleCreate} className="mb-10">
          <textarea
            className="w-full p-4 rounded-xl border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Apa pendapatmu mengenai bacaan ini?"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            required
          />
          <button className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold shadow-md shadow-blue-500/20">
            Kirim Komentar
          </button>
        </form>

        {errorMsg && (
          <div className="text-red-500 mb-6 bg-red-50 p-4 rounded-lg border border-red-100 flex justify-between items-center">
            <span>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-sm font-bold">
              ×
            </button>
          </div>
        )}

        <div className="space-y-8">
          {rootComments.length > 0 ? (
            rootComments.map((comment) => renderComment(comment))
          ) : (
            <p className="text-center text-zinc-500 py-10 italic">
              Belum ada diskusi. Jadilah yang pertama berkomentar!
            </p>
          )}
        </div>
      </main>
    </div>
  );
};
