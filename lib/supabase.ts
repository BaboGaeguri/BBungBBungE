import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** .env.local 이 아직 채워지지 않았으면 false. 로그인 화면 안내에 쓴다. */
export const supabaseReady = Boolean(url && anonKey);

// 빌드 중 서버 렌더링에서 만들어지지 않도록 첫 호출 때까지 미룬다.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) client = createClient(url, anonKey);
  return client;
}
