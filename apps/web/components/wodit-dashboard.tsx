"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { create } from "zustand";
import type { FeedbackStatus, UserPreference, WeatherSnapshot } from "@wodit/types";
import {
  applyFeedbackOffset,
  buildRecommendation,
  createWeatherSummary,
  demoWeatherPresets
} from "@wodit/utils";

type Store = {
  activePreset: number;
  preference: UserPreference;
  setActivePreset: (index: number) => void;
  setSensitivity: (value: number) => void;
  submitFeedback: (status: FeedbackStatus) => void;
  hydrate: () => void;
};

const storageKey = "wodit-preferences";

const defaultPreference: UserPreference = {
  sensitivity: 0,
  offset: 0,
  nickname: "Wodit User"
};

const useWoditStore = create<Store>((set, get) => ({
  activePreset: 0,
  preference: defaultPreference,
  setActivePreset: (index) => set({ activePreset: index }),
  setSensitivity: (value) =>
    set((state) => ({
      preference: {
        ...state.preference,
        sensitivity: value
      }
    })),
  submitFeedback: (status) =>
    set((state) => ({
      preference: applyFeedbackOffset(state.preference, status)
    })),
  hydrate: () => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return;
    }

    try {
      const preference = JSON.parse(raw) as UserPreference;
      set({ preference: { ...defaultPreference, ...preference } });
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }
}));

function ThemeBackdrop({ weather }: { weather: WeatherSnapshot }) {
  const cloudy = weather.condition === "clouds" || weather.condition === "rain";
  const warm = weather.tempC >= 23;

  return (
    <motion.div
      className="absolute inset-0 rounded-[2rem]"
      animate={{
        background: cloudy
          ? "linear-gradient(150deg, rgba(131,146,167,0.78), rgba(240,244,248,0.52))"
          : warm
            ? "linear-gradient(150deg, rgba(255,191,105,0.85), rgba(255,234,182,0.52))"
            : "linear-gradient(150deg, rgba(101,163,255,0.85), rgba(229,241,255,0.48))"
      }}
      transition={{ duration: 0.6 }}
    />
  );
}

export function WoditDashboard() {
  const { activePreset, preference, setActivePreset, setSensitivity, submitFeedback } =
    useWoditStore();

  useEffect(() => {
    useWoditStore.getState().hydrate();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(preference));
  }, [preference]);

  const weather = demoWeatherPresets[activePreset];
  const result = buildRecommendation(weather, preference);
  const summary = createWeatherSummary(weather, result.subjectiveTemp, preference.nickname);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 text-slate-900 sm:px-8">
      <div className="mesh" />
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.5fr_1fr]">
        <motion.article
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass relative overflow-hidden rounded-[2rem] p-6 shadow-panel sm:p-8"
        >
          <ThemeBackdrop weather={weather} />
          <div className="relative z-10 space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-xl space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-700">
                  Subjective Weather Styling
                </p>
                <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                  오늘 기온보다, 당신이 느끼는 온도에 맞춥니다.
                </h1>
                <p className="max-w-lg text-sm leading-6 text-slate-800 sm:text-base">
                  {summary}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-950/80 px-5 py-4 text-white">
                <p className="text-xs uppercase tracking-[0.28em] text-white/60">
                  Subjective Temp
                </p>
                <p className="mt-2 text-4xl font-semibold">
                  {result.subjectiveTemp.toFixed(1)}°C
                </p>
                <p className="mt-1 text-sm text-white/70">
                  실제 {weather.tempC}°C / 보정 {preference.offset.toFixed(1)}°C
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {demoWeatherPresets.map((preset, index) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setActivePreset(index)}
                  className={`rounded-[1.4rem] border px-4 py-4 text-left transition ${
                    index === activePreset
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-white/50 bg-white/45 text-slate-800"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.24em] opacity-70">{preset.label}</p>
                  <p className="mt-2 text-xl font-semibold">{preset.tempC}°C</p>
                  <p className="mt-1 text-sm">
                    {preset.precipitationMm > 0 ? "비 가능성 있음" : "강수 없음"} / 풍속{" "}
                    {preset.windSpeedMs}m/s
                  </p>
                </button>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-[1.6rem] bg-white/55 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-600">
                  Outfit Recommendation
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Outer / Top</p>
                    <ul className="mt-3 space-y-2 text-base">
                      {result.outfit.top.map((item) => (
                        <li key={item} className="rounded-2xl bg-slate-950/5 px-3 py-2">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      Bottom / Shoes / Extras
                    </p>
                    <ul className="mt-3 space-y-2 text-base">
                      {[...result.outfit.bottom, ...result.outfit.extras].map((item) => (
                        <li key={item} className="rounded-2xl bg-slate-950/5 px-3 py-2">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <section className="rounded-[1.6rem] bg-slate-950 px-5 py-5 text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/55">
                  Music Mood
                </p>
                <p className="mt-4 text-3xl font-semibold">{result.musicMood.title}</p>
                <p className="mt-3 text-sm leading-6 text-white/75">
                  {result.musicMood.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {result.musicMood.seedGenres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.2em]"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </motion.article>

        <motion.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-[2rem] p-6 shadow-panel"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">
            Personal Tuning
          </p>
          <div className="mt-5 space-y-7">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">추위/더위 민감도</p>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-sm text-white">
                  {preference.sensitivity > 0 ? "+" : ""}
                  {preference.sensitivity}
                </span>
              </div>
              <input
                className="mt-4 w-full accent-slate-900"
                type="range"
                min={-5}
                max={5}
                step={1}
                value={preference.sensitivity}
                onChange={(event) => setSensitivity(Number(event.target.value))}
              />
              <p className="mt-3 text-sm leading-6 text-slate-700">
                음수는 더위를 잘 타는 편, 양수는 추위를 잘 타는 편입니다. 추위를 잘 탈수록
                체감 온도는 더 낮게 계산됩니다.
              </p>
            </div>

            <div>
              <p className="text-lg font-semibold">피드백 학습</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                외출 후 느낌을 남기면 보정치가 누적되어 다음 추천 정확도가 올라갑니다.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: "추웠어요", value: "TOO_COLD" },
                  { label: "딱 좋아요", value: "GOOD" },
                  { label: "더웠어요", value: "TOO_HOT" }
                ].map((action) => (
                  <button
                    key={action.value}
                    type="button"
                    onClick={() => submitFeedback(action.value as FeedbackStatus)}
                    className="rounded-2xl bg-slate-950 px-3 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-slate-700">
                현재 학습 오프셋: {preference.offset.toFixed(1)}°C
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white/60 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Weather Inputs
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt>Condition</dt>
                  <dd className="font-semibold uppercase">{weather.condition}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Precipitation</dt>
                  <dd className="font-semibold">{weather.precipitationMm} mm</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Wind</dt>
                  <dd className="font-semibold">{weather.windSpeedMs} m/s</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>UV Index</dt>
                  <dd className="font-semibold">{weather.uvIndex}</dd>
                </div>
              </dl>
            </div>
          </div>
        </motion.aside>
      </section>
    </main>
  );
}
