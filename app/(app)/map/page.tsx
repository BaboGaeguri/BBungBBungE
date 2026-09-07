"use client";

import { useEffect, useMemo, useState } from "react";
import { RegionMap, useMapData } from "@/components/RegionMap";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/dday";
import { listPostsByRegion } from "@/lib/db";
import { useVisitedRegions } from "@/lib/hooks";
import type { Post } from "@/lib/types";

type Scope = "korea" | "seoul";

export default function MapPage() {
  const { couple } = useAuth();
  const [scope, setScope] = useState<Scope>("korea");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [loadedPosts, setLoadedPosts] = useState<{
    code: string;
    posts: Post[];
  } | null>(null);

  const mapData = useMapData(scope);
  const regions = useVisitedRegions(couple?.id);

  const visitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const region of regions ?? []) counts[region.code] = region.visitCount;
    return counts;
  }, [regions]);

  const total = mapData?.regions.length ?? 0;
  const visited = useMemo(() => {
    if (!mapData) return 0;
    return mapData.regions.filter((r) => (visitCounts[r.code] ?? 0) > 0).length;
  }, [mapData, visitCounts]);

  const selectedRegion = regions?.find((r) => r.code === selectedCode);
  const selectedName = mapData?.regions.find((r) => r.code === selectedCode);

  useEffect(() => {
    if (!couple?.id || !selectedCode) return;
    let active = true;
    listPostsByRegion(couple.id, selectedCode).then((posts) => {
      if (active) setLoadedPosts({ code: selectedCode, posts });
    });
    return () => {
      active = false;
    };
  }, [couple?.id, selectedCode]);

  // 다른 지역을 누르면 이전 지역 사진이 남아 보이지 않도록.
  const regionPosts =
    loadedPosts && loadedPosts.code === selectedCode ? loadedPosts.posts : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">우리가 다녀온 곳</h1>
        <div className="flex rounded-full bg-blush-pale p-1">
          {(["korea", "seoul"] as const).map((value) => (
            <button
              key={value}
              onClick={() => {
                setScope(value);
                setSelectedCode(null);
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs transition ${
                scope === value ? "bg-blush text-surface" : "text-ink-soft"
              }`}
            >
              {value === "korea" ? "전국" : "서울"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-blob bg-surface p-4 shadow-sm">
        {mapData ? (
          <RegionMap
            data={mapData}
            visitCounts={visitCounts}
            selectedCode={selectedCode}
            onSelect={(code) =>
              setSelectedCode((current) => (current === code ? null : code))
            }
          />
        ) : (
          <div className="flex h-72 items-center justify-center text-sm text-ink-soft">
            지도 불러오는 중…
          </div>
        )}

        <div className="mt-3 border-t border-line pt-3">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-lg text-blush">
              {visited}
              <span className="text-sm text-ink-soft"> / {total}곳</span>
            </span>
            <span className="text-xs text-ink-soft">
              {total > 0 ? ((visited / total) * 100).toFixed(1) : "0.0"}% 채웠어요
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-blush-pale">
            <div
              className="h-full rounded-full bg-blush transition-all duration-500"
              style={{ width: `${total > 0 ? (visited / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {selectedName && (
        <div className="rounded-blob bg-surface px-5 py-4 shadow-sm">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-lg text-ink">{selectedName.name}</h2>
            <span className="text-xs text-ink-soft">{selectedName.sido}</span>
          </div>

          {selectedRegion ? (
            <p className="mt-1 text-sm text-ink-soft">
              {selectedRegion.visitCount}번의 추억 · 처음 간 날{" "}
              {formatDate(selectedRegion.firstVisitedAt)}
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-soft">아직 함께 가보지 않은 곳이에요</p>
          )}

          {regionPosts && regionPosts.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {regionPosts.map((post) =>
                post.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={post.id}
                    src={post.photos[0].url}
                    alt=""
                    className="h-24 w-24 shrink-0 rounded-2xl object-cover"
                  />
                ) : null
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
