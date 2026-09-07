"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { RegionPicker } from "@/components/RegionPicker";
import type { MapRegion } from "@/components/RegionMap";
import { useAuth } from "@/lib/auth";
import { createPost } from "@/lib/db";
import { readPhotoMeta } from "@/lib/exif";
import { preparePhoto, type PreparedPhoto } from "@/lib/image";
import type { PostLocation } from "@/lib/types";

type PickedRegion = Pick<MapRegion, "code" | "name" | "sido" | "sidoShort">;

function toDateInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export default function NewPostPage() {
  const { user, couple } = useAuth();
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
  const [takenAt, setTakenAt] = useState(toDateInput(new Date()));
  const [region, setRegion] = useState<PickedRegion | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [placeName, setPlaceName] = useState("");
  const [text, setText] = useState("");

  const [pickerOpen, setPickerOpen] = useState(false);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).slice(0, 6);

    setReading(true);
    setError(null);
    setNotice(null);

    try {
      setPhotos(await Promise.all(files.map(preparePhoto)));
    } catch {
      setError(
        "사진을 읽지 못했어요. 아이폰 HEIC 사진이면 '가장 호환성 높게' 로 저장하거나 캡처해서 올려주세요."
      );
      setReading(false);
      return;
    }

    const meta = await readPhotoMeta(files[0]);
    setTakenAt(toDateInput(meta.takenAt ?? new Date(files[0].lastModified)));

    if (meta.lat !== null && meta.lng !== null) {
      setCoords({ lat: meta.lat, lng: meta.lng });
      const response = await fetch("/api/region", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: meta.lat, lng: meta.lng }),
      });
      const { region: found } = await response.json();
      if (found) {
        setRegion(found);
        setNotice(`사진에서 ${found.sidoShort} ${found.name} 로 찍혔다고 나와요`);
      } else {
        setNotice("사진에 위치는 있는데 국내 지역이 아니에요. 직접 골라주세요.");
      }
    } else {
      setCoords(null);
      setNotice("사진에 위치 정보가 없어요. 어디였는지 직접 골라주세요.");
    }

    setReading(false);
  }

  async function handleSave() {
    if (!user || !couple) return;
    if (photos.length === 0 && !text.trim()) {
      setError("사진이나 글 중 하나는 있어야 해요");
      return;
    }

    setSaving(true);
    setError(null);

    const location: PostLocation | null = region
      ? {
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          placeName: placeName.trim(),
          regionCode: region.code,
          sido: region.sido,
          sidoShort: region.sidoShort,
          sigungu: region.name,
          source: coords ? "exif" : "manual",
        }
      : null;

    try {
      await createPost({
        coupleId: couple.id,
        authorId: user.id,
        text: text.trim(),
        photos: photos.map((photo) => ({
          blob: photo.blob,
          width: photo.width,
          height: photo.height,
        })),
        takenAt: new Date(`${takenAt}T12:00:00`),
        location,
      });
      router.replace("/timeline");
    } catch {
      setError("저장하지 못했어요. 잠시 후 다시 해볼까요?");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl text-ink">추억 남기기</h1>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {photos.length === 0 ? (
        <button
          onClick={() => fileInput.current?.click()}
          disabled={reading}
          className="flex flex-col items-center gap-2 rounded-blob border border-dashed border-blush-soft bg-surface py-14"
        >
          <span className="text-4xl">📷</span>
          <span className="font-display text-base text-ink">
            {reading ? "사진 읽는 중…" : "사진 고르기"}
          </span>
          <span className="text-xs text-ink-soft">최대 6장</span>
        </button>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.previewUrl}
              src={photo.previewUrl}
              alt=""
              className="h-32 w-32 shrink-0 rounded-2xl object-cover"
            />
          ))}
          <button
            onClick={() => fileInput.current?.click()}
            className="h-32 w-32 shrink-0 rounded-2xl border border-dashed border-blush-soft text-sm text-ink-soft"
          >
            다시 고르기
          </button>
        </div>
      )}

      {notice && (
        <p className="rounded-2xl bg-blush-pale px-4 py-3 text-xs leading-5 text-ink-soft">
          {notice}
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-ink-soft">언제였나요?</span>
        <input
          type="date"
          value={takenAt}
          onChange={(e) => setTakenAt(e.target.value)}
          className="rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-blush"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-ink-soft">어디였나요?</span>
        <button
          onClick={() => setPickerOpen(true)}
          className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 text-left"
        >
          {region ? (
            <span className="text-ink">
              📍 {region.sidoShort} {region.name}
            </span>
          ) : (
            <span className="text-ink-soft">지역 고르기</span>
          )}
          <span className="text-xs text-blush">
            {region ? "바꾸기" : "고르기"}
          </span>
        </button>

        {region && (
          <input
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            placeholder="장소 이름 (예: 성수동 어니언) — 없어도 괜찮아요"
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-blush"
          />
        )}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-ink-soft">한 줄 남기기</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="오늘 어땠어?"
          className="resize-none rounded-2xl border border-line bg-surface px-4 py-3 leading-6 outline-none focus:border-blush"
        />
      </label>

      {error && <p className="text-sm text-blush">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || reading}
        className="rounded-blob bg-blush py-4 font-display text-lg text-surface shadow-lg shadow-blush/30 transition active:scale-[0.98] disabled:opacity-50"
      >
        {saving ? "저장하는 중…" : "저장하기"}
      </button>

      {pickerOpen && (
        <RegionPicker
          onClose={() => setPickerOpen(false)}
          onSelect={(picked) => {
            setRegion(picked);
            setCoords(null);
            setPickerOpen(false);
            setNotice(null);
          }}
        />
      )}
    </div>
  );
}
