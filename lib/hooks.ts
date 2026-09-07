"use client";

import { useEffect, useState } from "react";
import {
  getCoupleMembers,
  subscribeAnniversaries,
  subscribePosts,
  subscribeVisitedRegions,
} from "./db";
import type { Anniversary, Post, UserProfile, VisitedRegion } from "./types";

export function usePosts(coupleId: string | null | undefined, count: number) {
  const [posts, setPosts] = useState<Post[] | null>(null);

  useEffect(() => {
    if (!coupleId) return;
    return subscribePosts(coupleId, count, setPosts);
  }, [coupleId, count]);

  return posts;
}

export function useAnniversaries(coupleId: string | null | undefined) {
  const [items, setItems] = useState<Anniversary[]>([]);

  useEffect(() => {
    if (!coupleId) return;
    return subscribeAnniversaries(coupleId, setItems);
  }, [coupleId]);

  return items;
}

export function useMembers(coupleId: string | null | undefined) {
  const [members, setMembers] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    if (!coupleId) return;
    let active = true;
    getCoupleMembers(coupleId).then((result) => {
      if (active) setMembers(result);
    });
    return () => {
      active = false;
    };
  }, [coupleId]);

  return members;
}

export function useVisitedRegions(coupleId: string | null | undefined) {
  const [regions, setRegions] = useState<VisitedRegion[] | null>(null);

  useEffect(() => {
    if (!coupleId) return;
    return subscribeVisitedRegions(coupleId, setRegions);
  }, [coupleId]);

  return regions;
}
