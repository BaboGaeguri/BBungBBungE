# 뿡뿡이

우리 둘의 추억을 쌓아두는 커플 웹앱.
같은 기록을 **시간(타임라인)** 과 **공간(지도)** 두 가지로 본다.

- 공유 타임라인 — 사진과 글을 날짜순으로
- 지도 아카이브 — 사진 위치로 전국 250개 시군구 / 서울 25개 구가 채워짐
- D-day와 기념일 — 100일과 주년은 자동 계산
- 초대코드로 둘만 연결

Next.js + Supabase(Postgres). 배포는 Vercel.

## 시작하기

Supabase 연결이 필요합니다. → **[SETUP.md](SETUP.md)**

```bash
npm install
npm run dev
```

## 구조

```
app/
  (app)/          로그인 + 커플 연결이 끝난 뒤의 화면들
    page.tsx        홈 (D-day, 다가오는 날, 지도 요약, 최근 추억)
    timeline/       타임라인
    map/            지도
    new/            추억 남기기
    settings/       설정
  login/          구글 로그인
  onboarding/     커플 만들기 / 초대코드로 참여 / 사귄 날
  api/region/     좌표 → 행정구역 판정

lib/
  db.ts           DB·Storage 접근을 전부 모아둔 곳
  supabase.ts     클라이언트 생성
  auth.tsx        로그인 상태와 커플 정보
  regions.ts      점-다각형 판정으로 좌표가 어느 시군구인지 찾음
  exif.ts         사진에서 촬영일시·GPS 추출
  dday.ts         D-day, 기념일 계산
  image.ts        업로드 전 리사이즈

supabase/schema.sql  테이블 + 접근 권한(RLS) + 저장소 + 실시간
data/regions.json    지역 판정용 경계 (서버)
public/maps/*.json   지도 렌더링용 SVG 경로 (클라이언트)
scripts/build-maps.mjs
```

화면 코드는 `lib/db.ts` 가 내보내는 함수만 쓴다. 그 아래에 무엇이 있는지 모르기
때문에, 백엔드를 바꿔도 화면은 거의 그대로다. (실제로 Firebase에서 Supabase로
옮길 때 바뀐 건 `lib/` 안쪽뿐이었다.)

## 지도가 동작하는 방식

행정구역 GeoJSON(18MB)을 `npm run build:maps` 로 두 가지로 가공해서 쓴다.

- **그리기**: 실제 지도 타일 대신 경계를 SVG 경로로 직접 그린다.
  색칠하듯 채워지고, 색과 모양을 마음대로 바꿀 수 있다. (209KB / 25KB)
- **판정**: 같은 경계 데이터로 점-다각형 판정을 해서 좌표가 어느 구인지 찾는다.
  외부 지도 API가 필요 없다. (1.5MB, 서버에서만 사용)

사진 EXIF에 GPS가 없는 경우가 많아서(카톡으로 받은 사진, 스크린샷 등)
지역을 직접 고르는 경로가 기본이고, 자동 인식은 보조 수단이다.

"어느 지역을 몇 번 갔나"는 `visited_regions` 뷰가 `posts` 를 집계해서 만든다.
따로 관리하는 카운터가 없으니 원본과 어긋날 일이 없다.
