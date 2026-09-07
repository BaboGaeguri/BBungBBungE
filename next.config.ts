import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 좌표→지역 판정에 쓰는 데이터. 배포 번들에 포함시킨다.
  outputFileTracingIncludes: {
    "/api/region": ["./data/regions.json"],
  },
};

export default nextConfig;
