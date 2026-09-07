import fs from "node:fs";
import path from "node:path";

export type Region = {
  code: string;
  name: string;
  sido: string;
  sidoShort: string;
};

type RegionShape = Region & {
  rings: [number, number][][];
  boxes: [number, number, number, number][];
};

let cached: RegionShape[] | null = null;

function load(): RegionShape[] {
  if (cached) return cached;

  const file = path.join(process.cwd(), "data", "regions.json");
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as (Region & {
    rings: [number, number][][];
  })[];

  cached = raw.map((region) => ({
    ...region,
    boxes: region.rings.map((ring) => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const [x, y] of ring) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
      return [minX, minY, maxX, maxY];
    }),
  }));

  return cached;
}

function inRing(lng: number, lat: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat) {
      const x = ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
      if (lng < x) inside = !inside;
    }
  }
  return inside;
}

/** 위경도가 속한 시군구를 찾는다. 바다나 국외면 null. */
export function findRegion(lat: number, lng: number): Region | null {
  for (const region of load()) {
    for (let i = 0; i < region.rings.length; i++) {
      const [minX, minY, maxX, maxY] = region.boxes[i];
      if (lng < minX || lng > maxX || lat < minY || lat > maxY) continue;
      if (inRing(lng, lat, region.rings[i])) {
        return {
          code: region.code,
          name: region.name,
          sido: region.sido,
          sidoShort: region.sidoShort,
        };
      }
    }
  }
  return null;
}
