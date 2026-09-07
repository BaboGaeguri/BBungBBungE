import exifr from "exifr";

export type PhotoMeta = {
  takenAt: Date | null;
  lat: number | null;
  lng: number | null;
};

/**
 * 사진에서 촬영일시와 GPS 를 꺼낸다.
 * 카톡으로 주고받은 사진, 스크린샷, 위치 권한이 꺼진 상태로 찍은 사진에는
 * 아무것도 안 들어 있다. 실패는 정상이고 호출부에서 직접 입력으로 넘어가면 된다.
 */
export async function readPhotoMeta(file: File): Promise<PhotoMeta> {
  try {
    const parsed = await exifr.parse(file, { tiff: true, exif: true, gps: true });
    if (!parsed) return { takenAt: null, lat: null, lng: null };

    const taken = parsed.DateTimeOriginal ?? parsed.CreateDate ?? null;
    return {
      takenAt: taken instanceof Date && !isNaN(taken.getTime()) ? taken : null,
      lat: typeof parsed.latitude === "number" ? parsed.latitude : null,
      lng: typeof parsed.longitude === "number" ? parsed.longitude : null,
    };
  } catch {
    return { takenAt: null, lat: null, lng: null };
  }
}
