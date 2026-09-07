const MAX_EDGE = 1600;
const QUALITY = 0.85;

export type PreparedPhoto = {
  blob: Blob;
  width: number;
  height: number;
  previewUrl: string;
};

/**
 * 업로드 전에 사진을 줄인다. 원본 그대로 올리면 Storage 무료 용량이 금방 찬다.
 * HEIC 는 브라우저가 디코딩하지 못하면 여기서 실패하므로 호출부에서 처리한다.
 */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("캔버스를 만들 수 없습니다");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY)
  );
  if (!blob) throw new Error("이미지를 변환하지 못했습니다");

  return { blob, width, height, previewUrl: URL.createObjectURL(blob) };
}
