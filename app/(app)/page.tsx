"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { daysTogether, formatDate, upcomingEvents } from "@/lib/dday";
import { useAnniversaries, usePosts, useVisitedRegions } from "@/lib/hooks";

const TOTAL_REGIONS = 250;
const TOTAL_SEOUL = 25;

export default function HomePage() {
  const { couple } = useAuth();
  const coupleId = couple?.id;

  const anniversaries = useAnniversaries(coupleId);
  const posts = usePosts(coupleId, 4);
  const regions = useVisitedRegions(coupleId);

  if (!couple?.startDate) return null;

  const together = daysTogether(couple.startDate);
  const events = upcomingEvents(couple.startDate, anniversaries);
  const seoulCount = regions?.filter((r) => r.code.startsWith("11")).length ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-blob bg-gradient-to-br from-blush to-lavender px-6 py-8 text-center text-surface shadow-lg shadow-blush/25">
        <p className="text-sm opacity-90">우리 함께한 지</p>
        <p className="mt-1 font-display text-6xl leading-none">
          {together.toLocaleString()}
        </p>
        <p className="mt-2 font-display text-lg">일째</p>
        <p className="mt-3 text-xs opacity-80">
          {formatDate(couple.startDate)}부터
        </p>
      </section>

      {events.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-lg text-ink">다가오는 날</h2>
          <div className="flex flex-col gap-2">
            {events.map((event) => (
              <div
                key={`${event.title}-${event.date.getTime()}`}
                className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-sm"
              >
                <span className="text-2xl">{event.emoji}</span>
                <div className="flex-1">
                  <p className="font-display text-base text-ink">{event.title}</p>
                  <p className="text-xs text-ink-soft">{formatDate(event.date)}</p>
                </div>
                <span className="font-display text-lg text-blush">
                  {event.daysUntil === 0 ? "오늘!" : `D-${event.daysUntil}`}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Link
        href="/map"
        className="rounded-blob bg-surface px-5 py-4 shadow-sm transition active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg text-ink">우리가 다녀온 곳</h2>
            <p className="mt-1 text-sm text-ink-soft">
              전국 {regions?.length ?? 0}곳 · 서울 {seoulCount}개 구
            </p>
          </div>
          <span className="text-3xl">🗺️</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-blush-pale">
          <div
            className="h-full rounded-full bg-blush transition-all"
            style={{
              width: `${Math.min(100, ((regions?.length ?? 0) / TOTAL_REGIONS) * 100)}%`,
            }}
          />
        </div>
        <p className="mt-1.5 text-right text-xs text-ink-soft">
          전국 {TOTAL_REGIONS}곳 중 {regions?.length ?? 0}곳 · 서울 {TOTAL_SEOUL}개 구 중 {seoulCount}개
        </p>
      </Link>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-display text-lg text-ink">최근 추억</h2>
          <Link href="/timeline" className="text-xs text-ink-soft">
            전체 보기
          </Link>
        </div>

        {posts === null ? (
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-2xl bg-blush-pale" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Link
            href="/new"
            className="flex flex-col items-center gap-2 rounded-blob border border-dashed border-blush-soft bg-surface px-5 py-10 text-center"
          >
            <span className="text-3xl">🌸</span>
            <p className="font-display text-base text-ink">첫 추억을 남겨볼까요?</p>
            <p className="text-xs text-ink-soft">사진 한 장이면 충분해요</p>
          </Link>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href="/timeline"
                className="relative aspect-square overflow-hidden rounded-2xl bg-blush-pale"
              >
                {post.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.photos[0].url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-3 text-center text-xs text-ink-soft">
                    {post.text.slice(0, 40)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
