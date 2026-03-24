"use client";

import { motion } from "framer-motion";
import type { MusicMood } from "@wodit/types";

export function MusicModal({
  open,
  musicMood,
  onClose
}: {
  open: boolean;
  musicMood?: MusicMood;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        className="absolute inset-0 bg-black/38 backdrop-blur-[4px]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: -18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="absolute left-1/2 top-24 w-[min(92vw,560px)] -translate-x-1/2 rounded-[1.8rem] border border-white/14 bg-[rgba(23,33,49,0.82)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.36)] backdrop-blur-[22px]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/46">Now Playing</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">
              {musicMood?.title ?? "\uCD94\uCC9C \uD50C\uB808\uC774\uB9AC\uC2A4\uD2B8"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/60">
              {musicMood?.description ??
                "\uD604\uC7AC \uCF54\uB514\uC640 \uB0A0\uC528 \uBB34\uB4DC\uC5D0 \uB9DE\uCDA4 \uD50C\uB808\uC774\uB9AC\uC2A4\uD2B8\uC785\uB2C8\uB2E4."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-2 text-xs text-white transition hover:bg-white/16"
          >
            {"\uB2EB\uAE30"}
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[160px_1fr]">
          <div className="rounded-[1.3rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_28%),linear-gradient(135deg,rgba(129,198,245,0.6),rgba(31,47,68,0.92))] p-3 shadow-[0_20px_44px_rgba(0,0,0,0.22)]">
            <div className="aspect-square rounded-[1rem] bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(0,0,0,0.18))]" />
          </div>
          <div className="flex flex-col justify-between">
            <div className="flex flex-wrap gap-2">
              {(musicMood?.seedGenres ?? []).map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/74"
                >
                  {genre}
                </span>
              ))}
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-white/48">
                <span>0:42</span>
                <span>2:58</span>
              </div>
              <div className="mt-2 h-[4px] rounded-full bg-white/10">
                <div className="h-full w-[34%] rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.38)]" />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                className="rounded-full bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/16"
              >
                {"\uC774\uC804"}
              </button>
              <button
                type="button"
                className="rounded-full bg-emerald-300/20 px-4 py-2 text-sm font-medium text-emerald-50 transition hover:bg-emerald-300/28"
              >
                {"\uC7AC\uC0DD"}
              </button>
              <button
                type="button"
                className="rounded-full bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/16"
              >
                {"\uB2E4\uC74C"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
