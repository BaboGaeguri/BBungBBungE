// 행정구역 GeoJSON(18MB)을 두 개의 작은 파일로 가공한다.
//   public/maps/korea.json, public/maps/seoul.json  — SVG 경로 (그리기용)
//   data/regions.json                               — 단순화된 위경도 폴리곤 (좌표→지역 판정용)
// 실행: npm run build:maps

import fs from "node:fs";
import path from "node:path";
import { geoMercator } from "d3-geo";

const SRC_URL =
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-geo.json";
const CACHE_PATH = ".cache/skorea-municipalities-2018-geo.json";

const SIDO = {
  "11": ["서울특별시", "서울"],
  "21": ["부산광역시", "부산"],
  "22": ["대구광역시", "대구"],
  "23": ["인천광역시", "인천"],
  "24": ["광주광역시", "광주"],
  "25": ["대전광역시", "대전"],
  "26": ["울산광역시", "울산"],
  "29": ["세종특별자치시", "세종"],
  "31": ["경기도", "경기"],
  "32": ["강원특별자치도", "강원"],
  "33": ["충청북도", "충북"],
  "34": ["충청남도", "충남"],
  "35": ["전북특별자치도", "전북"],
  "36": ["전라남도", "전남"],
  "37": ["경상북도", "경북"],
  "38": ["경상남도", "경남"],
  "39": ["제주특별자치도", "제주"],
};

// "수원시장안구" 처럼 붙어 있는 이름을 "수원시 장안구" 로 띄운다.
function prettyName(name) {
  const m = name.match(/^(.+시)(.+구)$/);
  return m ? `${m[1]} ${m[2]}` : name;
}

// Douglas-Peucker. tolerance 단위는 입력 좌표 단위와 같다.
function simplify(points, tolerance) {
  if (points.length <= 2) return points;
  const sqTol = tolerance * tolerance;

  const sqSegDist = (p, a, b) => {
    let [x, y] = a;
    let dx = b[0] - x;
    let dy = b[1] - y;
    if (dx !== 0 || dy !== 0) {
      const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) [x, y] = b;
      else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }
    dx = p[0] - x;
    dy = p[1] - y;
    return dx * dx + dy * dy;
  };

  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let maxSq = sqTol;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const sq = sqSegDist(points[i], points[first], points[last]);
      if (sq > maxSq) {
        maxSq = sq;
        index = i;
      }
    }
    if (index !== -1) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function ringExtent(ring) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return [maxX - minX, maxY - minY];
}

// GeoJSON Polygon/MultiPolygon 을 바깥 링 배열로 펼친다. 구멍(hole)은 버린다.
// 행정구역에는 실질적인 구멍이 거의 없고, 없어도 판정/렌더에 지장이 없다.
function outerRings(geometry) {
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.map((polygon) => polygon[0]);
}

async function loadSource() {
  if (!fs.existsSync(CACHE_PATH)) {
    console.log("원본 행정구역 데이터를 내려받는 중… (18MB, 한 번만)");
    const response = await fetch(SRC_URL);
    if (!response.ok) throw new Error(`내려받기 실패: HTTP ${response.status}`);
    fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
    fs.writeFileSync(CACHE_PATH, Buffer.from(await response.arrayBuffer()));
  }
  return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
}

function buildSvgMap(features, width, height, tolerancePx) {
  const collection = { type: "FeatureCollection", features };
  const projection = geoMercator().fitExtent(
    [
      [4, 4],
      [width - 4, height - 4],
    ],
    collection
  );

  const regions = features.map((feature) => {
    const parts = [];
    for (const ring of outerRings(feature.geometry)) {
      const projected = ring.map((coord) => projection(coord));
      const [w, h] = ringExtent(projected);
      if (w < 1.5 && h < 1.5) continue; // 1.5px 미만 섬은 렌더해도 안 보인다
      const simplified = simplify(projected, tolerancePx);
      if (simplified.length < 4) continue;
      parts.push(
        "M" +
          simplified
            .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
            .join("L") +
          "Z"
      );
    }
    return {
      code: feature.properties.code,
      name: prettyName(feature.properties.name),
      sido: SIDO[feature.properties.code.slice(0, 2)][0],
      sidoShort: SIDO[feature.properties.code.slice(0, 2)][1],
      d: parts.join(""),
    };
  });

  return { width, height, regions: regions.filter((r) => r.d) };
}

function buildLookupData(features, toleranceDeg) {
  return features.map((feature) => {
    const rings = [];
    for (const ring of outerRings(feature.geometry)) {
      const simplified = simplify(ring, toleranceDeg).map(([lng, lat]) => [
        Number(lng.toFixed(4)),
        Number(lat.toFixed(4)),
      ]);
      if (simplified.length >= 4) rings.push(simplified);
    }
    const prefix = feature.properties.code.slice(0, 2);
    return {
      code: feature.properties.code,
      name: prettyName(feature.properties.name),
      sido: SIDO[prefix][0],
      sidoShort: SIDO[prefix][1],
      rings,
    };
  });
}

function write(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value));
  const kb = (fs.statSync(filePath).size / 1024).toFixed(0);
  console.log(`  ${filePath}  ${kb}KB`);
}

const source = await loadSource();
const features = source.features;
const seoul = features.filter((f) => f.properties.code.startsWith("11"));

console.log(`원본 ${features.length}개 지역 (서울 ${seoul.length}개 구)`);

write("public/maps/korea.json", buildSvgMap(features, 600, 780, 0.35));
write("public/maps/seoul.json", buildSvgMap(seoul, 760, 560, 0.3));
write("data/regions.json", buildLookupData(features, 0.0004));

console.log("완료");
