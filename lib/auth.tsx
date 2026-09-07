"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { subscribeCouple, subscribeUserProfile } from "./db";
import { getSupabase, supabaseReady } from "./supabase";
import type { Couple, UserProfile } from "./types";

type AuthState = {
  user: User | null;
  profile: UserProfile | null;
  couple: Couple | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  couple: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(supabaseReady);

  useEffect(() => {
    if (!supabaseReady) return;
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    return subscribeUserProfile(userId, setProfile);
  }, [userId]);

  // 로그아웃 직후 이전 사용자 정보가 남아 보이지 않도록 id 가 맞을 때만 넘긴다.
  const currentProfile = profile?.id === userId ? profile : null;
  const coupleId = currentProfile?.coupleId ?? null;

  useEffect(() => {
    if (!coupleId) return;
    return subscribeCouple(coupleId, setCouple);
  }, [coupleId]);

  const currentCouple = couple?.id === coupleId ? couple : null;

  return (
    <AuthContext.Provider
      value={{ user, profile: currentProfile, couple: currentCouple, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function signInWithGoogle() {
  return getSupabase().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
}

export function signOutUser() {
  return getSupabase().auth.signOut();
}
