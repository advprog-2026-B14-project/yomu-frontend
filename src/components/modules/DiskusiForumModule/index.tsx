"use client";

import React, { useCallback, useEffect, useState } from "react";
import { getUser, getToken } from "@/lib/auth";

const API_BASE_PATH = "/api/diskusi-forum";

const COMMENTS_API_BASE_URL = `${API_BASE_PATH}/comments`;
const REACTIONS_API_BASE_URL = `${API_BASE_PATH}/reactions`;

type ReactionType =
  | "UPVOTE"
  | "DOWNVOTE"
  | "EMOJI_CELEBRATE"
  | "EMOJI_THUMBS_UP"
  | "EMOJI_LAUGH"
  | "EMOJI_HEART"
  | "EMOJI_THINKING";

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
  readingId?: string;
  userId?: string;
  authorName?: string;
  createdAt?: string;
  reactions?: Reaction[];
};

type DiskusiForumModuleProps = {
  readingId?: string;
  readingTitle?: string;
  className?: string;
};

const shell = "w-full font-sans";
const panel =
  "rounded-3xl border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur mx-auto w-full max-w-6xl p-5 sm:p-6";
const input =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const primary =
  "rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300";
const secondary =
  "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 disabled:translate-y-0 disabled:cursor-not-allowed disabled:text-slate-400";
const danger =
  "rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-slate-300";

const REACTION_OPTIONS: Array<{
  emoji: string;
  type: ReactionType;
}> = [
  { emoji: "🔥", type: "EMOJI_HEART" },
  { emoji: "🚀", type: "EMOJI_THUMBS_UP" },
  { emoji: "😂", type: "EMOJI_LAUGH" },
  { emoji: "🎉", type: "EMOJI_CELEBRATE" },
  { emoji: "🤔", type: "EMOJI_THINKING" },
];

export const DiskusiForumModule = ({
  readingId,
  readingTitle,
  className = "",
}: DiskusiForumModuleProps) => {
  const formatDate = (iso?: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loadingReactions, setLoadingReactions] = useState<Set<string>>(
    () => new Set(),
  );

  const session = getUser();
  const token = getToken();
  const loggedInUserId = session?.id ?? "";

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`${COMMENTS_API_BASE_URL}/reading/${readingId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store",
      });
      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(
          `Gagal mengambil data (${res.status} ${res.statusText})${
            errorBody ? `: ${errorBody}` : ""
          }`,
        );
      }
      const data: CommentItem[] = await res.json();
      const dataArray = Array.isArray(data) ? data : [];

      const commentsWithReactions: CommentItem[] = [];
      const CHUNK_SIZE = 5; // Batasi request ke server maks 5 bersamaan agar tidak 504 Timeout

      for (let i = 0; i < dataArray.length; i += CHUNK_SIZE) {
        const chunk = dataArray.slice(i, i + CHUNK_SIZE);

        const chunkResults = await Promise.all(
          chunk.map(async (comment) => {
            try {
              const reactionRes = await fetch(
                `${REACTIONS_API_BASE_URL}/comment/${comment.id}`,
                {
                  headers: token
                    ? { Authorization: `Bearer ${token}` }
                    : undefined,
                },
              );
              const reactions: Reaction[] = reactionRes.ok
                ? await reactionRes.json()
                : [];
              const enriched = { ...comment, reactions } as CommentItem;

              if (
                !enriched.authorName &&
                session &&
                enriched.userId === session.id
              ) {
                enriched.authorName =
                  session.username ?? session.fullName ?? undefined;
              }
              if (session && !enriched.userId && enriched.authorName) {
                const author = String(enriched.authorName);
                if (
                  author === session.username ||
                  (session.fullName && author === session.fullName)
                ) {
                  enriched.userId = session.id;
                }
              }
              return enriched;
            } catch {
              const enriched = { ...comment, reactions: [] } as CommentItem;
              if (
                !enriched.authorName &&
                session &&
                enriched.userId === session.id
              ) {
                enriched.authorName =
                  session.username ?? session.fullName ?? undefined;
              }
              if (session && !enriched.userId && enriched.authorName) {
                const author = String(enriched.authorName);
                if (
                  author === session.username ||
                  (session.fullName && author === session.fullName)
                ) {
                  enriched.userId = session.id;
                }
              }
              return enriched;
            }
          }),
        );
        commentsWithReactions.push(...chunkResults);
      }

      setComments(commentsWithReactions);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal mengambil komentar";
      setErrorMsg(message);
    }
  }, [readingId, session, token]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  if (!readingId) {
    return (
      <section className={`${shell} ${className}`.trim()}>
        <div className={panel}>
          <div className="py-20 text-center">
            <h2 className="text-2xl font-black text-slate-800">
              Pilih bacaan terlebih dahulu
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              Silakan pilih bacaan pada panel sebelah kiri untuk melihat dan
              mengikuti diskusi forum.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    if (!session?.id) {
      setErrorMsg("Silakan login ulang sebelum menambah komentar.");
      return;
    }
    await postComment(newContent, null);
    setNewContent("");
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    if (!session?.id) {
      setErrorMsg("Silakan login ulang sebelum membalas komentar.");
      return;
    }
    await postComment(replyContent, parentId);
    setReplyContent("");
    setReplyingToId(null);
  };

  const postComment = async (content: string, parentId: string | null) => {
    if (!session?.id) {
      setErrorMsg("Silakan login ulang sebelum menambah komentar.");
      return;
    }

    const sessionName =
      session?.username ?? session?.fullName ?? session.id.slice(0, 6) ?? null;
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();

    const tempComment: CommentItem = {
      id: tempId,
      content,
      parentCommentId: parentId,
      readingId,
      userId: session?.id,
      authorName: sessionName ?? undefined,
      createdAt: now,
      reactions: [],
    };

    setComments((prev) => [tempComment, ...prev]);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(COMMENTS_API_BASE_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          readingId,
          content: content,
          parentCommentId: parentId,
        }),
      });
      if (!res.ok) throw new Error("Gagal mengirim komentar");

      await fetchComments();
    } catch (err) {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      const message =
        err instanceof Error ? err.message : "Gagal mengirim komentar";
      setErrorMsg(message);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!session?.id) {
      setErrorMsg("Silakan login ulang sebelum memperbarui komentar.");
      return;
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${COMMENTS_API_BASE_URL}/${id}`, {
        method: "PUT",
        headers,
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
    if (!session?.id) {
      setErrorMsg("Silakan login ulang sebelum menghapus komentar.");
      return;
    }

    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${COMMENTS_API_BASE_URL}/${id}`, {
        method: "DELETE",
        headers,
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

  const syncCommentReactions = async (commentId: string) => {
    try {
      const reactionRes = await fetch(
        `${REACTIONS_API_BASE_URL}/comment/${commentId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
      );
      const reactions: Reaction[] = reactionRes.ok
        ? await reactionRes.json()
        : [];

      setComments((previousComments) =>
        previousComments.map((comment) =>
          comment.id === commentId ? { ...comment, reactions } : comment,
        ),
      );
    } catch {}
  };

  const updateCommentsOptimistically = (
    commentId: string,
    reactionType: ReactionType,
  ) => {
    setComments((previousComments) =>
      previousComments.map((comment) => {
        if (comment.id !== commentId) return comment;

        const reactions = comment.reactions ? [...comment.reactions] : [];
        const existingIndex = reactions.findIndex(
          (reaction) => reaction.userId === loggedInUserId,
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
            userId: loggedInUserId,
            reactionType,
          });
        }

        return { ...comment, reactions };
      }),
    );
  };

  const handleReact = async (commentId: string, reactionType: ReactionType) => {
    const reactionKey = `${commentId}:${reactionType}`;

    if (loadingReactions.has(reactionKey)) return;
    setLoadingReactions((prev) => new Set(prev).add(reactionKey));

    const previousComments = comments;
    const currentComment = previousComments.find(
      (comment) => comment.id === commentId,
    );
    const existingReaction = currentComment?.reactions?.find(
      (reaction) => reaction.userId === loggedInUserId,
    );

    updateCommentsOptimistically(commentId, reactionType);

    try {
      if (existingReaction && existingReaction.reactionType === reactionType) {
        const deleteRes = await fetch(
          `${REACTIONS_API_BASE_URL}/${existingReaction.id}?userId=${loggedInUserId}`,
          {
            method: "DELETE",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          },
        );
        if (!deleteRes.ok) throw new Error("Gagal menghapus reaction");
      } else {
        const reactionHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) reactionHeaders.Authorization = `Bearer ${token}`;
        const addRes = await fetch(REACTIONS_API_BASE_URL, {
          method: "POST",
          headers: reactionHeaders,
          body: JSON.stringify({
            commentId,
            userId: loggedInUserId,
            reactionType,
          }),
        });
        if (!addRes.ok) throw new Error("Gagal menambahkan reaction");
      }

      void syncCommentReactions(commentId);
    } catch (err) {
      setComments(previousComments);
      const message =
        err instanceof Error ? err.message : "Gagal memberikan reaction";
      setErrorMsg(message);
    } finally {
      setLoadingReactions((prev) => {
        const next = new Set(prev);
        next.delete(reactionKey);
        return next;
      });
    }
  };

  const renderComment = (comment: CommentItem, isReply = false) => {
    const optionsWithCount = REACTION_OPTIONS.map((option) => ({
      ...option,
      count: getReactionCount(comment, option.type),
    }));
    const sortedOptions = optionsWithCount.sort((a, b) => b.count - a.count);
    const isOwner =
      comment.userId === loggedInUserId ||
      (session &&
        comment.authorName &&
        (comment.authorName === session.username ||
          (session.fullName && comment.authorName === session.fullName)));

    return (
      <div
        key={comment.id}
        className={`p-5 rounded-xl border shadow-sm ${isReply ? "ml-10 bg-white" : "bg-white"}`}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
              {comment.authorName
                ? comment.authorName.charAt(0).toUpperCase()
                : comment.userId
                  ? comment.userId.charAt(0).toUpperCase()
                  : "U"}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">
                {comment.authorName ??
                  (comment.userId
                    ? `User ${comment.userId.slice(0, 6)}`
                    : "Unknown")}
              </div>
              {comment.createdAt && (
                <div className="text-xs text-slate-500">
                  {formatDate(comment.createdAt)}
                </div>
              )}
            </div>
          </div>
        </div>

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
              {sortedOptions.map((option) => {
                const count = option.count;
                const loading = loadingReactions.has(
                  `${comment.id}:${option.type}`,
                );
                const userReacted =
                  comment.reactions?.some(
                    (reaction) =>
                      reaction.userId === loggedInUserId &&
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
                    {count > 0 && (
                      <span className="font-semibold">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setReplyingToId(comment.id)}
                className={`${secondary} px-3`}>
                Balas
              </button>
              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditContent(comment.content);
                    }}
                    className={`${secondary} px-3`}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    className={`${danger}`}>
                    Hapus
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {replyingToId === comment.id && (
          <div className="mt-4 space-y-3 pl-4 border-l-2 border-emerald-200">
            <textarea
              className={`${input} p-3 bg-transparent`}
              placeholder="Tulis balasan..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleReply(comment.id)}
                className={`${primary} px-3 py-1.5 text-sm`}>
                Balas
              </button>
              <button
                type="button"
                onClick={() => setReplyingToId(null)}
                className={`${secondary} px-3 py-1.5 text-sm`}>
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
  };

  return (
    <section className={`${shell} ${className}`.trim()}>
      <div className={panel}>
        <div className="space-y-6">
          {readingTitle ? (
            <div className="space-y-2 text-center">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Diskusi bacaan
              </p>
              <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {readingTitle}
              </h2>
              <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-500">
                Thread ini mengikuti bacaan yang sedang aktif, jadi konteks
                diskusi tetap nyambung dengan materi yang dibaca.
              </p>
            </div>
          ) : null}

          <form
            onSubmit={handleCreate}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <textarea
              className={`${input} p-4 bg-transparent`}
              placeholder="Apa pendapatmu mengenai bacaan ini?"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              required
            />
            <button className={`${primary}`}>Kirim Komentar</button>
          </form>

          {errorMsg && (
            <div className="flex items-center justify-between rounded-lg border border-red-200 px-4 py-3 text-red-600 dark:border-red-900/60 dark:text-red-300">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-sm font-bold">
                ×
              </button>
            </div>
          )}

          <div className="space-y-6 rounded-3xl border border-slate-100 bg-slate-50/60 p-4 sm:p-5">
            {rootComments.length > 0 ? (
              rootComments.map((comment) => renderComment(comment))
            ) : (
              <p className="py-10 text-center italic text-zinc-500">
                Belum ada diskusi. Jadilah yang pertama berkomentar!
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
