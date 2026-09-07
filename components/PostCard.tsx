"use client";

import { formatDateWithWeekday } from "@/lib/dday";
import type { Post, UserProfile } from "@/lib/types";

export function PostCard({
  post,
  author,
  onDelete,
}: {
  post: Post;
  author?: UserProfile;
  onDelete?: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-blob bg-surface shadow-sm">
      {post.photos.length > 0 && (
        <div
          className={
            post.photos.length === 1
              ? ""
              : "flex snap-x snap-mandatory gap-1 overflow-x-auto"
          }
        >
          {post.photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.storagePath}
              src={photo.url}
              alt=""
              className={
                post.photos.length === 1
                  ? "w-full object-cover"
                  : "aspect-square w-[85%] shrink-0 snap-center object-cover"
              }
              style={
                post.photos.length === 1
                  ? { maxHeight: "70vh" }
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 px-5 py-4">
        <div className="flex items-center gap-2 text-xs text-ink-soft">
          <span>{formatDateWithWeekday(post.takenAt)}</span>
          {author && (
            <>
              <span>·</span>
              <span>{author.displayName}</span>
            </>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="ml-auto text-ink-soft transition active:text-blush"
              aria-label="삭제"
            >
              지우기
            </button>
          )}
        </div>

        {post.text && (
          <p className="whitespace-pre-wrap text-[15px] leading-6 text-ink">
            {post.text}
          </p>
        )}

        {post.location && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="rounded-full bg-blush-pale px-3 py-1 text-xs text-blush">
              📍 {post.location.sidoShort} {post.location.sigungu}
            </span>
            {post.location.placeName && (
              <span className="text-xs text-ink-soft">
                {post.location.placeName}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
