"use client";

import React, { useState, useEffect } from "react";

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
      const res = await fetch("http://localhost:8085/api/comments", {
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
      const res = await fetch(`http://localhost:8085/api/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchComments();
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
      if (res.ok) fetchComments();
    } catch (err) {
      setErrorMsg("Gagal menghapus komentar");
    }
  };

  const rootComments = comments.filter((c) => !c.parentCommentId);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parentCommentId === parentId);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-8 dark:bg-black font-sans">
      <main className="w-full max-w-4xl rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-3xl font-bold text-center mb-8 dark:text-white">
          Yomu Forum Diskusi
        </h1>

        <form onSubmit={handleCreate} className="mb-10">
          <textarea
            className="w-full p-4 rounded-xl border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Tulis pendapatmu..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            required
          />
          <button className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
            Kirim Komentar
          </button>
        </form>

        {errorMsg && (
          <p className="text-red-500 mb-4 bg-red-50 p-3 rounded-lg border border-red-100">
            {errorMsg}
          </p>
        )}

        <div className="space-y-6">
          {rootComments.map((comment) => (
            <div key={comment.id} className="space-y-4">
              {}
              <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 shadow-sm">
                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full p-2 border rounded dark:bg-zinc-800 dark:text-white"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                    <div className="flex gap-2">
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
                    <p className="text-zinc-800 dark:text-zinc-200 text-lg">
                      {comment.content}
                    </p>
                    <div className="mt-4 flex justify-between items-center border-t pt-4 dark:border-zinc-800">
                      <span className="text-xs text-zinc-500 font-mono">
                        User: {comment.userId.substring(0, 8)}
                      </span>
                      <div className="flex gap-4 items-center">
                        <button
                          onClick={() => setReplyingToId(comment.id)}
                          className="text-blue-500 text-xs font-bold hover:underline">
                          Balas
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditContent(comment.content);
                          }}
                          className="text-zinc-400 text-xs hover:text-blue-500">
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-zinc-400 text-xs hover:text-red-500">
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {}
              {replyingToId === comment.id && (
                <div className="ml-12 p-4 bg-blue-50 dark:bg-zinc-800 rounded-xl border border-blue-100 dark:border-zinc-700">
                  <textarea
                    className="w-full p-2 border rounded dark:bg-zinc-900 dark:text-white text-sm"
                    placeholder="Tulis balasan..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleReply(comment.id)}
                      className="bg-blue-600 text-white px-4 py-1 rounded text-xs">
                      Balas
                    </button>
                    <button
                      onClick={() => setReplyingToId(null)}
                      className="text-zinc-500 text-xs">
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {}
              {getReplies(comment.id).map((reply) => (
                <div
                  key={reply.id}
                  className="ml-12 p-4 rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 shadow-inner">
                  {editingId === reply.id ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full p-2 border rounded dark:bg-zinc-800 dark:text-white text-sm"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(reply.id)}
                          className="text-green-500 text-xs font-bold">
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-zinc-500 text-xs">
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-zinc-700 dark:text-zinc-300 text-sm">
                        {reply.content}
                      </p>
                      <div className="mt-2 flex justify-between items-center opacity-70">
                        <span className="text-[10px] text-zinc-500 font-mono">
                          User: {reply.userId.substring(0, 8)}
                        </span>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setEditingId(reply.id);
                              setEditContent(reply.content);
                            }}
                            className="text-blue-500 text-[10px] hover:underline">
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(reply.id)}
                            className="text-red-400 text-[10px] hover:underline">
                            Hapus Balasan
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
