import { NextResponse } from "next/server";
import { findRegion } from "@/lib/regions";

export async function POST(request: Request) {
  const { lat, lng } = await request.json();

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json(
      { error: "lat, lng 가 숫자여야 합니다" },
      { status: 400 }
    );
  }

  return NextResponse.json({ region: findRegion(lat, lng) });
}
