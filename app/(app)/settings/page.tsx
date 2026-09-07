"use client";

import { useState } from "react";
import { signOutUser, useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/dday";
import {
  addAnniversary,
  removeAnniversary,
  setCoupleStartDate,
  updateDisplayName,
} from "@/lib/db";
import { useAnniversaries, useMembers } from "@/lib/hooks";

const EMOJI_CHOICES = ["🎀", "🎂", "🌸", "✈️", "🍰", "🎁", "⭐", "🐣"];

export default function SettingsPage() {
  const { user, profile, couple } = useAuth();
  const anniversaries = useAnniversaries(couple?.id);
  const members = useMembers(couple?.id);

  const [name, setName] = useState(profile?.displayName ?? "");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [emoji, setEmoji] = useState(EMOJI_CHOICES[0]);
  const [repeatYearly, setRepeatYearly] = useState(true);

  if (!couple || !profile || !user) return null;

  const memberIds = Object.keys(members);
  const partnerUid = memberIds.find((id) => id !== user.id);
  const partner = partnerUid ? members[partnerUid] : undefined;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl text-ink">설정</h1>

      <Section title="내 이름">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-2xl border border-line bg-cream px-4 py-3 outline-none focus:border-blush"
          />
          <button
            onClick={() => updateDisplayName(user.id, name.trim())}
            disabled={!name.trim() || name.trim() === profile.displayName}
            className="rounded-2xl bg-blush px-5 text-sm text-surface disabled:opacity-40"
          >
            저장
          </button>
        </div>
      </Section>

      <Section title="우리">
        <Row label="애인">
          <span className="text-ink">
            {partner ? partner.displayName : "아직 연결되지 않았어요"}
          </span>
        </Row>

        {memberIds.length < 2 && (
          <div className="rounded-2xl bg-blush-pale px-4 py-3 text-center">
            <p className="text-xs text-ink-soft">애인에게 이 코드를 알려주세요</p>
            <p className="mt-1 font-display text-2xl tracking-[0.2em] text-blush">
              {couple.inviteCode}
            </p>
          </div>
        )}

        <Row label="사귄 날">
          <input
            type="date"
            value={couple.startDate ? toInput(couple.startDate) : ""}
            max={toInput(new Date())}
            onChange={(e) =>
              e.target.value &&
              setCoupleStartDate(couple.id, new Date(`${e.target.value}T00:00:00`))
            }
            className="rounded-xl border border-line bg-cream px-3 py-2 text-sm outline-none focus:border-blush"
          />
        </Row>
      </Section>

      <Section title="기념일">
        {anniversaries.length === 0 ? (
          <p className="py-1 text-sm text-ink-soft">
            100일과 주년은 자동으로 계산돼요. 따로 챙기고 싶은 날만 추가하면 돼요.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {anniversaries
              .slice()
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-2.5"
                >
                  <span className="text-xl">{item.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm text-ink">{item.title}</p>
                    <p className="text-xs text-ink-soft">
                      {formatDate(item.date)}
                      {item.repeatYearly && " · 매년"}
                    </p>
                  </div>
                  <button
                    onClick={() => removeAnniversary(item.id)}
                    className="text-xs text-ink-soft"
                  >
                    삭제
                  </button>
                </div>
              ))}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="기념일 이름 (예: 첫 여행)"
            className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm outline-none focus:border-blush"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 rounded-2xl border border-line bg-cream px-4 py-3 text-sm outline-none focus:border-blush"
            />
            <label className="flex items-center gap-1.5 px-1 text-xs text-ink-soft">
              <input
                type="checkbox"
                checked={repeatYearly}
                onChange={(e) => setRepeatYearly(e.target.checked)}
                className="accent-blush"
              />
              매년
            </label>
          </div>

          <div className="flex gap-1.5">
            {EMOJI_CHOICES.map((choice) => (
              <button
                key={choice}
                onClick={() => setEmoji(choice)}
                className={`h-9 w-9 rounded-full text-lg transition ${
                  emoji === choice ? "bg-blush-soft" : "bg-cream"
                }`}
              >
                {choice}
              </button>
            ))}
          </div>

          <button
            disabled={!title.trim() || !date}
            onClick={async () => {
              await addAnniversary(couple.id, {
                title: title.trim(),
                date: new Date(`${date}T00:00:00`),
                repeatYearly,
                emoji,
              });
              setTitle("");
              setDate("");
            }}
            className="rounded-2xl bg-blush py-3 text-sm text-surface disabled:opacity-40"
          >
            기념일 추가
          </button>
        </div>
      </Section>

      <button
        onClick={signOutUser}
        className="rounded-blob border border-line bg-surface py-3.5 text-sm text-ink-soft"
      >
        로그아웃
      </button>
    </div>
  );
}

function toInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-blob bg-surface px-5 py-4 shadow-sm">
      <h2 className="font-display text-base text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-ink-soft">{label}</span>
      {children}
    </div>
  );
}
