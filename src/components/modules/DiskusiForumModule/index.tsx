"use client";

import React, { useState, useEffect } from "react";

const API_BASE_URL = "http://18.207.58.155:8085/api/comments";
const REACTIONS_API_BASE_URL = "http://18.207.58.155:8085/api/reactions";

type ReactionType = "API" | "ROKET" | "TERTAWA" | "CONFETI" | "EMOT_BERTANYA";

type Reaction = {
  id: string;
  commentId: string;
  userId: string;
  reactionType: ReactionType | string;
};

type CommentItem = {
  id: string;
  content: string;
  parentCommentId?: string | null;
  reactions?: Reaction[];
};

const REACTION_OPTIONS: Array<{
  emoji: string;
  type: ReactionType;
}> = [
  { emoji: "🔥", type: "API" },
  { emoji: "🚀", type: "ROKET" },
  { emoji: "😂", type: "TERTAWA" },
  { emoji: "🎉", type: "CONFETI" },
  { emoji: "🤔", type: "EMOT_BERTANYA" },
];

export const DiskusiForumModule = () => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loadingReactionKey, setLoadingReactionKey] = useState<string | null>(
    null,
  );

  const currentUserId = "550e8400-e29b-41d4-a716-446655440000";

  const fetchComments = async () => {
    try {
      const res = await fetch(API_BASE_URL);
      if (!res.ok) throw new Error("Gagal mengambil data dari AWS");
      const data: CommentItem[] = await res.json();

      const commentsWithReactions = await Promise.all(
        (Array.isArray(data) ? data : []).map(async (comment) => {
          try {
            const reactionRes = await fetch(
              `${REACTIONS_API_BASE_URL}/comment/${comment.id}`,
            );
            const reactions: Reaction[] = reactionRes.ok
              ? await reactionRes.json()
              : [];
            return { ...comment, reactions };
          } catch {
            return { ...comment, reactions: [] };
          }
        }),
      );

      setComments(commentsWithReactions);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal mengambil komentar";
      setErrorMsg(message);
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
          userId: currentUserId,
          readingId: "770e8400-e29b-41d4-a716-446655440001",
          content: content,
          parentCommentId: parentId,
        }),
      });
      if (!res.ok) throw new Error("Gagal mengirim komentar");
      await fetchComments();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal mengirim komentar";
      setErrorMsg(message);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error("Gagal mengupdate komentar");
      setEditingId(null);
      await fetchComments();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal mengupdate komentar";
      setErrorMsg(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus komentar ini?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus komentar");
      await fetchComments();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal menghapus komentar";
      setErrorMsg(message);
    }
  };

  const rootComments = comments.filter((c) => !c.parentCommentId);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parentCommentId === parentId);

  const getReactionCount = (comment: CommentItem, reactionType: ReactionType) =>
    comment.reactions?.filter(
      (reaction) => reaction.reactionType === reactionType,
    ).length || 0;

  const updateCommentsOptimistically = (
    commentId: string,
    reactionType: ReactionType,
  ) => {
    setComments((previousComments) =>
      previousComments.map((comment) => {
        if (comment.id !== commentId) return comment;

        const reactions = comment.reactions ? [...comment.reactions] : [];
        const existingIndex = reactions.findIndex(
          (reaction) => reaction.userId === currentUserId,
        );

        if (existingIndex >= 0) {
          const existingReaction = reactions[existingIndex];
          if (existingReaction.reactionType === reactionType) {
            reactions.splice(existingIndex, 1);
          } else {
            reactions[existingIndex] = {
              ...existingReaction,
              reactionType,
            };
          }
        } else {
          reactions.push({
            id: `temp-${Date.now()}`,
            commentId,
            userId: currentUserId,
            reactionType,
          });
        }

        return { ...comment, reactions };
      }),
    );
  };

  const handleReact = async (commentId: string, reactionType: ReactionType) => {
    const reactionKey = `${commentId}:${reactionType}`;
    setLoadingReactionKey(reactionKey);

    const previousComments = comments;
    const currentComment = previousComments.find(
      (comment) => comment.id === commentId,
    );
    const existingReaction = currentComment?.reactions?.find(
      (reaction) => reaction.userId === currentUserId,
    );

    updateCommentsOptimistically(commentId, reactionType);

    try {
      if (existingReaction && existingReaction.reactionType === reactionType) {
        const deleteRes = await fetch(
          `${REACTIONS_API_BASE_URL}/${existingReaction.id}`,
          {
            method: "DELETE",
          },
        );
        if (!deleteRes.ok) throw new Error("Gagal menghapus reaction");
      } else {
        if (existingReaction) {
          const deleteRes = await fetch(
            `${REACTIONS_API_BASE_URL}/${existingReaction.id}`,
            {
              method: "DELETE",
            },
          );
          if (!deleteRes.ok) throw new Error("Gagal mengganti reaction");
        }

        const addRes = await fetch(REACTIONS_API_BASE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commentId,
            userId: currentUserId,
            reactionType,
          }),
        });
        if (!addRes.ok) throw new Error("Gagal menambahkan reaction");
      }
    } catch (err) {
      setComments(previousComments);
      const message =
        err instanceof Error ? err.message : "Gagal memberikan reaction";
      setErrorMsg(message);
    } finally {
      setLoadingReactionKey(null);
    }
  };

  const renderComment = (comment: CommentItem, isReply = false) => (
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

          <div className="flex flex-wrap gap-2 mb-4">
            {REACTION_OPTIONS.map((option) => {
              const count = getReactionCount(comment, option.type);
              const loading =
                loadingReactionKey === `${comment.id}:${option.type}`;
              const userReacted =
                comment.reactions?.some(
                  (reaction) =>
                    reaction.userId === currentUserId &&
                    reaction.reactionType === option.type,
                ) || false;

              return (
                <button
                  key={option.type}
                  type="button"
                  disabled={loading}
                  onClick={() => handleReact(comment.id, option.type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all ${
                    userReacted
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-blue-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                  } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
                  title={userReacted ? "Hapus reaction" : "Tambah reaction"}>
                  <span>{option.emoji}</span>
                  {count > 0 && <span className="font-semibold">{count}</span>}
                </button>
              );
            })}
          </div>

          <div className="flex gap-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setReplyingToId(comment.id)}
              className="hover:text-blue-600 transition">
              Balas
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingId(comment.id);
                setEditContent(comment.content);
              }}
              className="hover:text-amber-600 transition">
              Edit
            </button>
            <button
              type="button"
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
              type="button"
              onClick={() => handleReply(comment.id)}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-700 transition">
              Balas
            </button>
            <button
              type="button"
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
              type="button"
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
