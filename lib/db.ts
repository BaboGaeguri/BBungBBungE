// DB / Storage 접근은 전부 이 파일에 모은다.
// 화면 코드는 여기서 내보내는 함수만 쓰고, 그 아래에 뭐가 있는지는 모른다.

import { getSupabase } from "./supabase";
import type {
  Anniversary,
  Couple,
  PhotoRef,
  Post,
  PostLocation,
  UserProfile,
  VisitedRegion,
} from "./types";

const BUCKET = "photos";
const SIGNED_URL_TTL = 60 * 60; // 1시간

type StoredPhoto = { storagePath: string; width: number; height: number };

type PostRow = {
  id: string;
  author_id: string;
  body: string;
  photos: StoredPhoto[];
  taken_at: string;
  created_at: string;
  lat: number | null;
  lng: number | null;
  place_name: string | null;
  region_code: string | null;
  region_sido: string | null;
  region_sido_short: string | null;
  region_sigungu: string | null;
  location_source: "exif" | "manual" | null;
};

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

/** "2026-09-07" 을 그 날 정오로. 시간대 때문에 하루가 밀리는 걸 막는다. */
function parseDay(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

function toDayString(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

// ─── 사진 주소 ─────────────────────────────────────────────
// 버킷이 비공개라 저장된 건 경로뿐이다. 읽을 때 서명된 주소를 만들어 붙인다.

async function signPhotos(rows: PostRow[]): Promise<Map<string, string>> {
  const paths = rows.flatMap((row) =>
    (row.photos ?? []).map((photo) => photo.storagePath)
  );
  if (paths.length === 0) return new Map();

  const { data } = await getSupabase()
    .storage.from(BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL);

  const entries: [string, string][] = [];
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) entries.push([item.path, item.signedUrl]);
  }
  return new Map(entries);
}

function toPost(row: PostRow, urls: Map<string, string>): Post {
  const photos: PhotoRef[] = (row.photos ?? []).map((photo) => ({
    ...photo,
    url: urls.get(photo.storagePath) ?? "",
  }));

  const location: PostLocation | null = row.region_code
    ? {
        lat: row.lat,
        lng: row.lng,
        placeName: row.place_name ?? "",
        regionCode: row.region_code,
        sido: row.region_sido ?? "",
        sidoShort: row.region_sido_short ?? "",
        sigungu: row.region_sigungu ?? "",
        source: row.location_source ?? "manual",
      }
    : null;

  return {
    id: row.id,
    authorId: row.author_id,
    text: row.body,
    photos,
    takenAt: parseDay(row.taken_at),
    createdAt: new Date(row.created_at),
    location,
  };
}

// ─── 실시간 구독 ───────────────────────────────────────────
// 변경 내용을 하나씩 반영하는 대신 그냥 다시 읽는다.
// 두 명이 쓰는 앱이라 이게 훨씬 단순하고 어긋날 여지가 없다.

function subscribe<T>(
  table: string,
  filter: string,
  load: () => Promise<T>,
  onData: (value: T) => void
): () => void {
  let active = true;

  const reload = () => {
    load().then(
      (value) => active && onData(value),
      () => {}
    );
  };
  reload();

  const channel = getSupabase()
    .channel(`${table}-${filter}-${Math.random().toString(36).slice(2, 8)}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table, filter },
      reload
    )
    .subscribe();

  return () => {
    active = false;
    getSupabase().removeChannel(channel);
  };
}

// ─── 사용자 ────────────────────────────────────────────────

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await getSupabase()
    .from("profiles")
    .select("id, display_name, photo_url, couple_id")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    displayName: data.display_name ?? "",
    photoURL: data.photo_url,
    coupleId: data.couple_id,
  };
}

export function subscribeUserProfile(
  userId: string,
  callback: (profile: UserProfile | null) => void
) {
  return subscribe(
    "profiles",
    `id=eq.${userId}`,
    () => fetchProfile(userId),
    callback
  );
}

export async function updateDisplayName(userId: string, displayName: string) {
  fail(
    (
      await getSupabase()
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", userId)
    ).error
  );
}

export async function getCoupleMembers(
  coupleId: string
): Promise<Record<string, UserProfile>> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("id, display_name, photo_url, couple_id")
    .eq("couple_id", coupleId);
  fail(error);

  return Object.fromEntries(
    (data ?? []).map((row) => [
      row.id,
      {
        id: row.id,
        displayName: row.display_name ?? "",
        photoURL: row.photo_url,
        coupleId: row.couple_id,
      },
    ])
  );
}

// ─── 커플 ──────────────────────────────────────────────────

export async function createCouple(): Promise<string> {
  const { data, error } = await getSupabase().rpc("create_couple");
  fail(error);
  return data as string;
}

export async function joinCoupleByInviteCode(code: string): Promise<string> {
  const { data, error } = await getSupabase().rpc("join_couple", { code });
  fail(error);
  return data as string;
}

async function fetchCouple(coupleId: string): Promise<Couple | null> {
  const { data } = await getSupabase()
    .from("couples")
    .select("id, invite_code, start_date, created_at")
    .eq("id", coupleId)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    inviteCode: data.invite_code,
    startDate: data.start_date ? parseDay(data.start_date) : null,
    createdAt: new Date(data.created_at),
  };
}

export function subscribeCouple(
  coupleId: string,
  callback: (couple: Couple | null) => void
) {
  return subscribe(
    "couples",
    `id=eq.${coupleId}`,
    () => fetchCouple(coupleId),
    callback
  );
}

export async function setCoupleStartDate(coupleId: string, startDate: Date) {
  fail(
    (
      await getSupabase()
        .from("couples")
        .update({ start_date: toDayString(startDate) })
        .eq("id", coupleId)
    ).error
  );
}

// ─── 추억(글) ──────────────────────────────────────────────

const POST_COLUMNS =
  "id, author_id, body, photos, taken_at, created_at, lat, lng, place_name, region_code, region_sido, region_sido_short, region_sigungu, location_source";

async function fetchPosts(coupleId: string, count: number): Promise<Post[]> {
  const { data, error } = await getSupabase()
    .from("posts")
    .select(POST_COLUMNS)
    .eq("couple_id", coupleId)
    .order("taken_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(count);
  fail(error);

  const rows = (data ?? []) as PostRow[];
  const urls = await signPhotos(rows);
  return rows.map((row) => toPost(row, urls));
}

export function subscribePosts(
  coupleId: string,
  count: number,
  callback: (posts: Post[]) => void
) {
  return subscribe(
    "posts",
    `couple_id=eq.${coupleId}`,
    () => fetchPosts(coupleId, count),
    callback
  );
}

export async function listPostsByRegion(
  coupleId: string,
  regionCode: string
): Promise<Post[]> {
  const { data, error } = await getSupabase()
    .from("posts")
    .select(POST_COLUMNS)
    .eq("couple_id", coupleId)
    .eq("region_code", regionCode)
    .order("taken_at", { ascending: false });
  fail(error);

  const rows = (data ?? []) as PostRow[];
  const urls = await signPhotos(rows);
  return rows.map((row) => toPost(row, urls));
}

export async function createPost(params: {
  coupleId: string;
  authorId: string;
  text: string;
  photos: { blob: Blob; width: number; height: number }[];
  takenAt: Date;
  location: PostLocation | null;
}): Promise<string> {
  const { coupleId, authorId, text, photos, takenAt, location } = params;
  const supabase = getSupabase();
  const postId = crypto.randomUUID();

  const stored: StoredPhoto[] = [];
  for (const [index, photo] of photos.entries()) {
    const storagePath = `${coupleId}/${postId}/${index}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, photo.blob, { contentType: "image/jpeg" });
    fail(error);
    stored.push({ storagePath, width: photo.width, height: photo.height });
  }

  const { error } = await supabase.from("posts").insert({
    id: postId,
    couple_id: coupleId,
    author_id: authorId,
    body: text,
    photos: stored,
    taken_at: toDayString(takenAt),
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
    place_name: location?.placeName || null,
    region_code: location?.regionCode ?? null,
    region_sido: location?.sido ?? null,
    region_sido_short: location?.sidoShort ?? null,
    region_sigungu: location?.sigungu ?? null,
    location_source: location?.source ?? null,
  });
  fail(error);

  return postId;
}

export async function deletePost(post: Post) {
  const supabase = getSupabase();

  if (post.photos.length > 0) {
    await supabase.storage
      .from(BUCKET)
      .remove(post.photos.map((photo) => photo.storagePath));
  }

  fail((await supabase.from("posts").delete().eq("id", post.id)).error);
}

// ─── 기념일 ────────────────────────────────────────────────

async function fetchAnniversaries(coupleId: string): Promise<Anniversary[]> {
  const { data, error } = await getSupabase()
    .from("anniversaries")
    .select("id, title, date, repeat_yearly, emoji")
    .eq("couple_id", coupleId)
    .order("date");
  fail(error);

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    date: parseDay(row.date),
    repeatYearly: row.repeat_yearly,
    emoji: row.emoji,
  }));
}

export function subscribeAnniversaries(
  coupleId: string,
  callback: (items: Anniversary[]) => void
) {
  return subscribe(
    "anniversaries",
    `couple_id=eq.${coupleId}`,
    () => fetchAnniversaries(coupleId),
    callback
  );
}

export async function addAnniversary(
  coupleId: string,
  item: Omit<Anniversary, "id">
) {
  fail(
    (
      await getSupabase().from("anniversaries").insert({
        couple_id: coupleId,
        title: item.title,
        date: toDayString(item.date),
        repeat_yearly: item.repeatYearly,
        emoji: item.emoji,
      })
    ).error
  );
}

export async function removeAnniversary(id: string) {
  fail((await getSupabase().from("anniversaries").delete().eq("id", id)).error);
}

// ─── 다녀온 지역 ───────────────────────────────────────────
// posts 를 집계한 뷰라서 따로 관리할 게 없다.

async function fetchVisitedRegions(coupleId: string): Promise<VisitedRegion[]> {
  const { data, error } = await getSupabase()
    .from("visited_regions")
    .select("code, name, sido, sido_short, visit_count, first_visited_at, last_visited_at")
    .eq("couple_id", coupleId);
  fail(error);

  return (data ?? []).map((row) => ({
    code: row.code,
    name: row.name,
    sido: row.sido,
    sidoShort: row.sido_short,
    visitCount: row.visit_count,
    firstVisitedAt: parseDay(row.first_visited_at),
    lastVisitedAt: parseDay(row.last_visited_at),
  }));
}

export function subscribeVisitedRegions(
  coupleId: string,
  callback: (regions: VisitedRegion[]) => void
) {
  // 뷰에는 변경 알림이 오지 않으므로 원본인 posts 를 지켜본다.
  return subscribe(
    "posts",
    `couple_id=eq.${coupleId}`,
    () => fetchVisitedRegions(coupleId),
    callback
  );
}
