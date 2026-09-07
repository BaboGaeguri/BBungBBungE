"use client";

import { useMemo, useState } from "react";
import { useMapData, type MapRegion } from "./RegionMap";

export function RegionPicker({
  onSelect,
  onClose,
}: {
  onSelect: (region: MapRegion) => void;
  onClose: () => void;
}) {
  const data = useMapData("korea");
  const [keyword, setKeyword] = useState("");

  const results = useMemo(() => {
    if (!data) return [];
    const query = keyword.trim();
    if (!query) return data.regions;
    return data.regions.filter(
      (region) =>
        region.name.includes(query) ||
        region.sido.includes(query) ||
        region.sidoShort.includes(query)
    );
  }, [data, keyword]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-cream">
      <div className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3">
        <input
          autoFocus
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="지역 이름 검색 (예: 성동구, 강릉)"
          className="flex-1 rounded-full bg-blush-pale px-4 py-2.5 text-sm outline-none"
        />
        <button onClick={onClose} className="text-sm text-ink-soft">
          닫기
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-2">
        {!data ? (
          <p className="py-10 text-center text-sm text-ink-soft">불러오는 중…</p>
        ) : results.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-soft">
            그런 지역이 없어요
          </p>
        ) : (
          results.map((region) => (
            <button
              key={region.code}
              onClick={() => onSelect(region)}
              className="flex w-full items-baseline gap-2 border-b border-line py-3 text-left"
            >
              <span className="text-[15px] text-ink">{region.name}</span>
              <span className="text-xs text-ink-soft">{region.sido}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
