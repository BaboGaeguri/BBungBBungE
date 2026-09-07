"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signInWithGoogle, useAuth } from "@/lib/auth";
import { supabaseReady } from "@/lib/supabase";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError("로그인을 시작하지 못했어요. 잠시 후 다시 시도해주세요.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-8 px-8">
      <div className="text-center">
        <div className="text-6xl">💕</div>
        <h1 className="mt-5 font-display text-4xl text-blush">뿡뿡이</h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          우리 둘의 추억을 쌓아두는 곳
        </p>
      </div>

      {supabaseReady ? (
        <button
          onClick={handleSignIn}
          disabled={busy}
          className="w-full rounded-blob bg-blush py-4 font-display text-lg text-surface shadow-lg shadow-blush/30 transition active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "잠시만요…" : "구글로 시작하기"}
        </button>
      ) : (
        <div className="w-full rounded-blob border border-line bg-surface p-5 text-sm leading-6 text-ink-soft">
          <p className="font-display text-base text-ink">Supabase 설정이 필요해요</p>
          <p className="mt-2">
            프로젝트 루트에 <code className="text-blush">.env.local</code> 파일을 만들고
            Supabase 주소와 키를 넣어주세요. 자세한 순서는{" "}
            <code className="text-blush">SETUP.md</code> 에 적어뒀어요.
          </p>
        </div>
      )}

      {error && <p className="text-center text-sm text-blush">{error}</p>}
    </main>
  );
}
