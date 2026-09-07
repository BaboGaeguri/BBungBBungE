"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loading } from "@/components/Loading";
import { useAuth } from "@/lib/auth";
import { createCouple, joinCoupleByInviteCode, setCoupleStartDate } from "@/lib/db";
import { useMembers } from "@/lib/hooks";

export default function OnboardingPage() {
  const { user, profile, couple, loading } = useAuth();
  const router = useRouter();
  const memberCount = Object.keys(useMembers(couple?.id)).length;

  const [mode, setMode] = useState<"choose" | "join">("choose");
  const [code, setCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (couple?.startDate) router.replace("/");
  }, [couple?.startDate, router]);

  if (loading || !user || !profile) return <Loading />;

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "문제가 생겼어요");
    } finally {
      setBusy(false);
    }
  }

  // 커플이 아직 없으면: 새로 만들거나 초대코드로 참여
  if (!profile.coupleId) {
    return (
      <Shell title="시작해볼까요?" subtitle={`${profile.displayName}님, 반가워요!`}>
        {mode === "choose" ? (
          <div className="flex flex-col gap-3">
            <button
              disabled={busy}
              onClick={() => run(() => createCouple())}
              className="rounded-blob bg-blush py-4 font-display text-lg text-surface shadow-lg shadow-blush/30 transition active:scale-[0.98] disabled:opacity-60"
            >
              새로 시작하기
            </button>
            <button
              onClick={() => setMode("join")}
              className="rounded-blob border border-line bg-surface py-4 font-display text-lg text-ink transition active:scale-[0.98]"
            >
              초대코드로 참여하기
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="초대코드 6자리"
              maxLength={6}
              className="rounded-blob border border-line bg-surface px-5 py-4 text-center font-display text-2xl tracking-[0.3em] outline-none focus:border-blush"
            />
            <button
              disabled={busy || code.length < 6}
              onClick={() => run(() => joinCoupleByInviteCode(code))}
              className="rounded-blob bg-blush py-4 font-display text-lg text-surface shadow-lg shadow-blush/30 transition active:scale-[0.98] disabled:opacity-40"
            >
              연결하기
            </button>
            <button
              onClick={() => setMode("choose")}
              className="py-2 text-sm text-ink-soft"
            >
              뒤로
            </button>
          </div>
        )}
        {error && <p className="text-center text-sm text-blush">{error}</p>}
      </Shell>
    );
  }

  if (!couple) return <Loading />;

  // 커플은 만들어졌고, 사귄 날을 정하는 단계
  return (
    <Shell title="언제부터였죠?" subtitle="사귀기 시작한 날을 알려주세요">
      {memberCount < 2 && (
        <div className="rounded-blob bg-blush-pale p-5 text-center">
          <p className="text-sm text-ink-soft">애인에게 이 코드를 알려주세요</p>
          <p className="mt-2 font-display text-3xl tracking-[0.2em] text-blush">
            {couple.inviteCode}
          </p>
        </div>
      )}

      <input
        type="date"
        value={startDate}
        max={new Date().toISOString().slice(0, 10)}
        onChange={(e) => setStartDate(e.target.value)}
        className="rounded-blob border border-line bg-surface px-5 py-4 text-center font-display text-xl outline-none focus:border-blush"
      />

      <button
        disabled={busy || !startDate}
        onClick={() =>
          run(async () => {
            await setCoupleStartDate(couple.id, new Date(`${startDate}T00:00:00`));
            router.replace("/");
          })
        }
        className="rounded-blob bg-blush py-4 font-display text-lg text-surface shadow-lg shadow-blush/30 transition active:scale-[0.98] disabled:opacity-40"
      >
        시작하기
      </button>

      {error && <p className="text-center text-sm text-blush">{error}</p>}
    </Shell>
  );
}

function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-8">
      <div className="text-center">
        <h1 className="font-display text-3xl text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>
      </div>
      {children}
    </main>
  );
}
