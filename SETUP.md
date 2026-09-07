# 설정하기

앱 코드는 다 있고, Supabase 프로젝트만 연결하면 돌아갑니다. 20분 정도 걸려요.
가장 손이 많이 가는 건 3번(구글 로그인)이니 마음의 준비를 하고 가세요.

## 1. Supabase 프로젝트 만들기

1. [supabase.com](https://supabase.com) 가입 후 **New project**
2. 이름은 아무거나 (예: `bbungbbunge`)
3. **Database Password**는 안 쓸 것 같아도 어딘가 적어두세요
4. **Region은 `Northeast Asia (Seoul)`** 로. 한국에서 쓸 거라 응답이 빨라집니다

만들어지는 데 1~2분 걸립니다.

## 2. 스키마 만들기

왼쪽 메뉴 **SQL Editor** → **New query** →
이 저장소의 [`supabase/schema.sql`](supabase/schema.sql) 내용을 **통째로** 붙여넣고 **Run**.

테이블, 접근 권한(RLS), 사진 저장소, 실시간 동기화가 한 번에 설정됩니다.
여러 번 실행해도 안전하니, 나중에 스키마를 고치면 다시 돌리면 돼요.

## 3. 구글 로그인 연결하기

Supabase는 구글 로그인을 쓰려면 구글 쪽에서 열쇠를 발급받아 와야 합니다.
(Firebase는 이걸 대신 해주는데, Supabase는 직접 해야 해요. 이 조합의 유일한 번거로운 부분입니다.)

### 3-1. 내 Supabase 주소 확인

Supabase 대시보드 **Project Settings → General** 의 **Project ID** 를 확인하세요.
`elpikegaykwzcnweiliz` 같은 문자열이고, 내 프로젝트 주소는 여기에서 나옵니다.

```
https://<Project ID>.supabase.co
```

### 3-2. 구글에서 OAuth 클라이언트 만들기

1. [console.cloud.google.com](https://console.cloud.google.com) 접속
2. 상단에서 프로젝트 새로 만들기 (아무 이름)
3. **API 및 서비스 → OAuth 동의 화면**
   - User Type: **외부(External)**
   - 앱 이름, 지원 이메일만 채우고 나머지는 넘어가기
   - 테스트 사용자에 **본인과 애인의 지메일 주소**를 추가 (안 하면 로그인 거부됩니다)
4. **API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
   - 애플리케이션 유형: **웹 애플리케이션**
   - **승인된 리디렉션 URI** 에 아래를 추가:
     ```
     https://<내-프로젝트>.supabase.co/auth/v1/callback
     ```
   - 만들기를 누르면 **클라이언트 ID** 와 **클라이언트 보안 비밀번호**가 나옵니다

### 3-3. Supabase에 붙여넣기

Supabase **Authentication → Sign In / Providers → Google** →
사용 설정 켜고, 방금 받은 **Client ID** 와 **Client Secret** 을 넣고 저장.

## 4. 돌아올 주소 등록하기

Supabase **Authentication → URL Configuration**

- **Site URL**: `http://localhost:3000`
- **Redirect URLs** 에 추가: `http://localhost:3000/**`

나중에 Vercel에 배포하면 그 주소도 여기에 추가해야 합니다. 안 하면 로그인 후
엉뚱한 곳으로 튕겨요.

## 5. 키 넣기

프로젝트 루트에 `.env.local` 파일을 만들고 두 값을 채웁니다.

| 값 | 어디서 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project Settings → General** 의 Project ID 로 만든 `https://<Project ID>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Project Settings → API Keys** 의 `publishable` (또는 `anon` / `public`) 키 |

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

> 이 키는 브라우저에 노출되는 게 정상입니다. 키만으로는 아무것도 못 봐요.
> 실제 접근 통제는 2번에서 넣은 RLS 정책이 담당합니다. 반면 같은 화면에 있는
> **`service_role` / `secret` 키는 RLS를 전부 우회하니 절대 코드나 `.env.local`에 넣지 마세요.**

## 6. 실행

```bash
npm install
npm run dev
```

http://localhost:3000 → 구글로 로그인 → 커플 만들기 → 사귄 날 입력

애인은 같은 주소에서 로그인한 뒤 **초대코드 6자리**를 입력하면 연결됩니다.

## 7. Vercel 배포

1. GitHub에 푸시
2. [vercel.com](https://vercel.com) → New Project → 저장소 선택
3. **Framework Preset** 이 `Next.js` 로 잡혔는지 확인
4. **Environment Variables** 에 `.env.local` 의 두 값을 등록
5. Deploy

배포 후 **4번으로 돌아가서** Vercel 주소를 등록하세요.

- Site URL: `https://xxx.vercel.app`
- Redirect URLs: `https://xxx.vercel.app/**` (localhost 것도 그대로 두면 둘 다 됩니다)

## 8. 홈 화면에 추가 (아이폰)

사파리로 접속 → 공유 버튼 → **홈 화면에 추가**.

---

## 알아두면 좋은 것

**무료 플랜으로 충분합니다.** 카드 등록이 필요 없고, DB 500MB에 사진 저장 1GB까지
무료예요. 사진은 올릴 때 자동으로 줄여서 저장하니 한참 씁니다.

**한 가지 주의:** 무료 프로젝트는 **일주일 넘게 아무도 안 쓰면 잠깐 멈춥니다.**
대시보드에서 버튼 한 번 누르면 다시 살아나요. 둘이 꾸준히 쓸 거면 겪을 일이 거의 없습니다.

## 지도 데이터를 다시 만들어야 할 때

`public/maps/*.json` 과 `data/regions.json` 은 이미 저장소에 들어 있어서
평소엔 건드릴 일이 없습니다. 경계 데이터를 바꾸거나 단순화 정도를 조정하려면:

```bash
npm run build:maps
```

원본 18MB GeoJSON을 `.cache/` 로 자동으로 내려받은 뒤 가공합니다.
