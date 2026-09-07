"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS = {
  home: "M3 10.6 12 3.2l9 7.4M5.6 9.4V19.8a1 1 0 0 0 1 1h3.6v-5.2h3.6v5.2h3.6a1 1 0 0 0 1-1V9.4",
  timeline:
    "M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5zM4 15.5l4.2-4a1.5 1.5 0 0 1 2 0L15 16",
  map: "M12 21.2s6.8-5.6 6.8-11a6.8 6.8 0 1 0-13.6 0c0 5.4 6.8 11 6.8 11Z",
  settings: "M4 7.5h16M4 12h16M4 16.5h16",
};

const TABS = [
  { href: "/", label: "홈", icon: ICONS.home },
  { href: "/timeline", label: "타임라인", icon: ICONS.timeline },
  { href: "/map", label: "지도", icon: ICONS.map },
  { href: "/settings", label: "설정", icon: ICONS.settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-end justify-around px-2 pt-2 pb-1">
        {TABS.slice(0, 2).map((tab) => (
          <NavItem key={tab.href} {...tab} active={pathname === tab.href} />
        ))}

        <Link
          href="/new"
          aria-label="추억 남기기"
          className="-mt-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blush text-surface shadow-lg shadow-blush/40 transition active:scale-95"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </Link>

        {TABS.slice(2).map((tab) => (
          <NavItem key={tab.href} {...tab} active={pathname === tab.href} />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex w-16 flex-col items-center gap-1 py-1 transition ${
        active ? "text-blush" : "text-ink-soft"
      }`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d={icon}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[11px]">{label}</span>
    </Link>
  );
}
