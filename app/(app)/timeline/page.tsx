"use client";

import Link from "next/link";
import { useState } from "react";
import { PostCard } from "@/components/PostCard";
import { useAuth } from "@/lib/auth";
import { deletePost } from "@/lib/db";
import { usePosts, useMembers } from "@/lib/hooks";
import type { Post } from "@/lib/types";

const PAGE_SIZE = 20;

export default function TimelinePage() {
  const { user, couple } = useAuth();
  const [count, setCount] = useState(PAGE_SIZE);

  const posts = usePosts(couple?.id, count);
  const members = useMembers(couple?.id);

  async function handleDelete(post: Post) {
    if (!couple) return;
    if (!confirm("이 추억을 지울까요? 되돌릴 수 없어요.")) return;
    await deletePost(post);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl text-ink">타임라인</h1>

      {posts === null ? (
        <div className="flex flex-col gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-72 rounded-blob bg-blush-pale" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Link
          href="/new"
          className="flex flex-col items-center gap-2 rounded-blob border border-dashed border-blush-soft bg-surface px-5 py-14 text-center"
        >
          <span className="text-4xl">🌸</span>
          <p className="font-display text-lg text-ink">아직 추억이 없어요</p>
          <p className="text-xs text-ink-soft">첫 사진을 올려볼까요?</p>
        </Link>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              author={members[post.authorId]}
              onDelete={
                post.authorId === user?.id ? () => handleDelete(post) : undefined
              }
            />
          ))}

          {posts.length >= count && (
            <button
              onClick={() => setCount((c) => c + PAGE_SIZE)}
              className="rounded-blob border border-line bg-surface py-3 text-sm text-ink-soft"
            >
              더 보기
            </button>
          )}
        </>
      )}
    </div>
  );
}
