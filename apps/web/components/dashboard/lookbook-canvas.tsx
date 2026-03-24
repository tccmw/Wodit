"use client";

import { useEffect, useMemo, useState } from "react";

type LookbookCard = {
  key: string;
  label: string;
  note: string;
  className: string;
  innerClass: string;
  noteClass: string;
};

export function LookbookCanvas({ items }: { items: string[] }) {
  const positionClasses = [
    "left-[30px] top-[42px] rotate-[-14deg]",
    "left-[78px] top-[28px] rotate-[-7deg]",
    "left-[126px] top-[34px] rotate-[0deg]",
    "left-[174px] top-[42px] rotate-[8deg]",
    "left-[214px] top-[56px] rotate-[16deg]"
  ];

  const visualClasses = [
    {
      className:
        "border-white/12 bg-[linear-gradient(180deg,rgba(70,80,99,0.98),rgba(37,46,61,0.96))] text-white",
      innerClass: "lookbook-coat h-[148px] w-[96px] mx-auto",
      noteClass: "text-white/52"
    },
    {
      className:
        "border-white/12 bg-[linear-gradient(180deg,rgba(244,247,252,0.96),rgba(213,223,235,0.9))] text-slate-700",
      innerClass: "lookbook-top h-[134px] w-[92px] mx-auto",
      noteClass: "text-slate-500"
    },
    {
      className:
        "border-white/10 bg-[linear-gradient(180deg,rgba(222,54,67,0.98),rgba(190,24,41,0.95))] text-white",
      innerClass: "lookbook-pants h-[142px] w-[82px] mx-auto",
      noteClass: "text-white/56"
    }
  ];

  const initialCards = useMemo<LookbookCard[]>(
    () =>
      items.map((item, index) => {
        const visual = visualClasses[index % visualClasses.length];
        const note =
          index < 2
            ? "\uC0C1\uC758"
            : index < 4
              ? "\uD558\uC758"
              : "\uC561\uC138\uC11C\uB9AC";

        return {
          key: `${item}-${index}`,
          label: item,
          note,
          className: `${positionClasses[Math.min(index, positionClasses.length - 1)]} ${visual.className}`,
          innerClass: visual.innerClass,
          noteClass: visual.noteClass
        };
      }),
    [items]
  );

  const [stack, setStack] = useState(initialCards);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setStack(initialCards);
  }, [initialCards]);

  return (
    <button
      type="button"
      onClick={() => {
        if (isAnimating) return;
        setIsAnimating(true);
        window.setTimeout(() => {
          setStack((current) => [...current.slice(1), current[0]]);
          setIsAnimating(false);
        }, 260);
      }}
      className="relative flex min-h-[520px] w-full items-center justify-center overflow-hidden rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] text-left"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(133,197,255,0.08),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-[22px] rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background:repeating-linear-gradient(105deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_20px)]" />
      <div className="absolute bottom-10 h-10 w-52 rounded-full bg-sky-200/12 blur-2xl" />

      <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/64">
        tap for next look
      </div>

      <div className="relative z-10 h-[360px] w-[420px]">
        {stack.map((card, index) => {
          const isFront = index === 0;

          return (
            <div
              key={`${card.key}-${index}`}
              className={`absolute h-[248px] w-[172px] rounded-[1.3rem] px-5 py-7 shadow-[0_24px_42px_rgba(0,0,0,0.22)] transition-all duration-300 ${
                isFront && isAnimating
                  ? "translate-x-[112px] translate-y-[18px] rotate-[18deg] opacity-75"
                  : ""
              } ${card.className}`}
              style={{ zIndex: stack.length - index }}
            >
              <div className={card.innerClass} />
              <p className={`mt-4 text-[11px] uppercase tracking-[0.24em] ${card.noteClass}`}>
                {card.note}
              </p>
              <p className="mt-2 text-sm font-semibold">{card.label}</p>
            </div>
          );
        })}
      </div>
    </button>
  );
}
