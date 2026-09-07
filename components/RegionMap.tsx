"use client";

import { useEffect, useState } from "react";

export type MapRegion = {
  code: string;
  name: string;
  sido: string;
  sidoShort: string;
  d: string;
};

export type MapData = {
  width: number;
  height: number;
  regions: MapRegion[];
};

export function useMapData(name: "korea" | "seoul") {
  const [data, setData] = useState<MapData | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/maps/${name}.json`)
      .then((res) => res.json())
      .then((loaded: MapData) => {
        if (active) setData(loaded);
      });
    return () => {
      active = false;
    };
  }, [name]);

  return data;
}

// 많이 갈수록 진해진다.
function fillFor(visits: number): string {
  if (visits <= 0) return "#f3e9ee";
  if (visits === 1) return "#ffd6de";
  if (visits <= 3) return "#ffb0c1";
  return "#ff8fa3";
}

export function RegionMap({
  data,
  visitCounts,
  selectedCode,
  onSelect,
}: {
  data: MapData;
  visitCounts: Record<string, number>;
  selectedCode: string | null;
  onSelect: (code: string) => void;
}) {
  const selected = data.regions.find((r) => r.code === selectedCode);

  return (
    <svg
      viewBox={`0 0 ${data.width} ${data.height}`}
      className="w-full"
      role="img"
      aria-label="다녀온 지역 지도"
    >
      {data.regions.map((region) => (
        <path
          key={region.code}
          d={region.d}
          fill={fillFor(visitCounts[region.code] ?? 0)}
          stroke="#ffffff"
          strokeWidth={0.7}
          strokeLinejoin="round"
          onClick={() => onSelect(region.code)}
          className="cursor-pointer transition-[fill] duration-300"
        />
      ))}

      {selected && (
        <path
          d={selected.d}
          fill="none"
          stroke="#4a4048"
          strokeWidth={1.8}
          strokeLinejoin="round"
          pointerEvents="none"
        />
      )}
    </svg>
  );
}
