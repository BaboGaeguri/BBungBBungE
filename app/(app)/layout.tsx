"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Loading } from "@/components/Loading";
import { useAuth } from "@/lib/auth";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, profile, couple, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (profile && !profile.coupleId) router.replace("/onboarding");
    else if (couple && !couple.startDate) router.replace("/onboarding");
  }, [loading, user, profile, couple, router]);

  if (loading || !user || !profile?.coupleId || !couple?.startDate) {
    return <Loading />;
  }

  return (
    <>
      <main className="mx-auto min-h-screen w-full max-w-md px-5 pt-6 pb-28">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
