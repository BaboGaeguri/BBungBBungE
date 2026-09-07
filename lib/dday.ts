import type { Anniversary } from "./types";

export type UpcomingEvent = {
  title: string;
  emoji: string;
  date: Date;
  daysUntil: number;
};

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = startOfDay(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round(
    (startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000
  );
}

/** 사귄 날이 1일째. 오늘이 며칠째인지. */
export function daysTogether(startDate: Date, today = new Date()): number {
  return daysBetween(startDate, today) + 1;
}

/** N일째가 되는 날짜. (100일 = 사귄 날 + 99일) */
export function milestoneDate(startDate: Date, nthDay: number): Date {
  return addDays(startDate, nthDay - 1);
}

function nextYearlyOccurrence(date: Date, today: Date): Date {
  const candidate = startOfDay(date);
  candidate.setFullYear(today.getFullYear());
  if (candidate.getTime() < startOfDay(today).getTime()) {
    candidate.setFullYear(today.getFullYear() + 1);
  }
  return candidate;
}

/**
 * 다가오는 기념일을 가까운 순으로 돌려준다.
 * 100일 단위와 N주년은 사귄 날로부터 자동 생성하고, 직접 등록한 기념일과 합친다.
 */
export function upcomingEvents(
  startDate: Date | null,
  anniversaries: Anniversary[],
  today = new Date(),
  count = 3
): UpcomingEvent[] {
  const events: UpcomingEvent[] = [];
  const todayStart = startOfDay(today);

  if (startDate) {
    const elapsed = daysTogether(startDate, today);

    for (let nth = Math.ceil(elapsed / 100) * 100; nth <= elapsed + 400; nth += 100) {
      const date = milestoneDate(startDate, nth);
      if (date.getTime() < todayStart.getTime()) continue;
      events.push({
        title: `${nth.toLocaleString()}일`,
        emoji: "💝",
        date,
        daysUntil: daysBetween(today, date),
      });
    }

    const years = today.getFullYear() - startDate.getFullYear() + 1;
    for (let year = 1; year <= years + 1; year++) {
      const date = startOfDay(startDate);
      date.setFullYear(startDate.getFullYear() + year);
      if (date.getTime() < todayStart.getTime()) continue;
      events.push({
        title: `${year}주년`,
        emoji: "🎂",
        date,
        daysUntil: daysBetween(today, date),
      });
    }
  }

  for (const anniversary of anniversaries) {
    const date = anniversary.repeatYearly
      ? nextYearlyOccurrence(anniversary.date, today)
      : startOfDay(anniversary.date);
    if (date.getTime() < todayStart.getTime()) continue;
    events.push({
      title: anniversary.title,
      emoji: anniversary.emoji,
      date,
      daysUntil: daysBetween(today, date),
    });
  }

  return events
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, count);
}

export function formatDate(date: Date): string {
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;
}

export function formatDateWithWeekday(date: Date): string {
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${formatDate(date)} (${weekday})`;
}
