export type PhotoRef = {
  storagePath: string;
  width: number;
  height: number;
  /** 비공개 버킷이라 읽을 때마다 서명된 주소를 새로 만들어 채운다. */
  url: string;
};

export type PostLocation = {
  // 사진에서 GPS 를 못 읽고 지역만 직접 고른 경우 좌표는 없다.
  lat: number | null;
  lng: number | null;
  placeName: string;
  regionCode: string;
  sido: string;
  sidoShort: string;
  sigungu: string;
  source: "exif" | "manual";
};

export type Post = {
  id: string;
  authorId: string;
  text: string;
  photos: PhotoRef[];
  takenAt: Date;
  createdAt: Date;
  location: PostLocation | null;
};

export type Couple = {
  id: string;
  inviteCode: string;
  startDate: Date | null;
  createdAt: Date;
};

export type UserProfile = {
  id: string;
  displayName: string;
  photoURL: string | null;
  coupleId: string | null;
};

export type Anniversary = {
  id: string;
  title: string;
  date: Date;
  repeatYearly: boolean;
  emoji: string;
};

export type VisitedRegion = {
  code: string;
  name: string;
  sido: string;
  sidoShort: string;
  visitCount: number;
  firstVisitedAt: Date;
  lastVisitedAt: Date;
};
