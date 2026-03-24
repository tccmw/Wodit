"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { create } from "zustand";
import type {
  Coordinates,
  FeedbackStatus,
  UserProfile,
  WeatherSnapshot
} from "@wodit/types";
import {
  applyFeedbackOffset,
  buildRecommendation,
  createWeatherSummary,
  demoWeatherPresets,
  formatCoordinates
} from "@wodit/utils";
import { SignOutButton } from "./auth-buttons";

type DashboardUser = {
  email: string;
  name: string;
  image: string | null;
};

type Store = {
  activePreset: number;
  profile: UserProfile;
  hydrate: (user: DashboardUser) => void;
  completeOnboarding: (sensitivity: number, nickname: string) => void;
  setSensitivity: (value: number) => void;
  setLocationField: (field: keyof Coordinates, value: number) => void;
  applyCurrentLocation: () => Promise<void>;
  setActivePreset: (index: number) => void;
  submitFeedback: (status: FeedbackStatus) => void;
};

const defaultProfile: UserProfile = {
  sensitivity: 0,
  offset: 0,
  nickname: "Wodit User",
  location: {
    lat: 37.5665,
    lng: 126.978
  },
  onboardingCompleted: false
};

function profileStorageKey(email: string) {
  return `wodit-profile:${email}`;
}

const useWoditStore = create<Store>((set) => ({
  activePreset: 0,
  profile: defaultProfile,
  hydrate: (user) => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(profileStorageKey(user.email));
    if (!raw) {
      set({
        profile: {
          ...defaultProfile,
          nickname: user.name
        }
      });
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<UserProfile>;
      set({
        profile: {
          ...defaultProfile,
          ...parsed,
          nickname: parsed.nickname || user.name
        }
      });
    } catch {
      window.localStorage.removeItem(profileStorageKey(user.email));
      set({
        profile: {
          ...defaultProfile,
          nickname: user.name
        }
      });
    }
  },
  completeOnboarding: (sensitivity, nickname) =>
    set((state) => ({
      profile: {
        ...state.profile,
        sensitivity,
        nickname,
        onboardingCompleted: true
      }
    })),
  setSensitivity: (value) =>
    set((state) => ({
      profile: {
        ...state.profile,
        sensitivity: value
      }
    })),
  setLocationField: (field, value) =>
    set((state) => ({
      profile: {
        ...state.profile,
        location: {
          ...state.profile.location,
          [field]: Number.isFinite(value) ? value : 0
        }
      }
    })),
  applyCurrentLocation: async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return;
    }

    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    }).catch(() => null);

    if (!position) {
      return;
    }

    set((state) => ({
      profile: {
        ...state.profile,
        location: {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6))
        }
      }
    }));
  },
  setActivePreset: (index) => set({ activePreset: index }),
  submitFeedback: (status) =>
    set((state) => ({
      profile: applyFeedbackOffset(state.profile, status)
    }))
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

function OnboardingCard({
  user,
  profile,
  completeOnboarding
}: {
  user: DashboardUser;
  profile: UserProfile;
  completeOnboarding: (sensitivity: number, nickname: string) => void;
}) {
  return (
    <section className="glass relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] p-8 shadow-panel">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,204,112,0.64),rgba(120,170,255,0.24),rgba(255,255,255,0.22))]" />
      <div className="relative z-10 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-700">
              First Login
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-950">
              Set your personal temperature baseline.
            </h1>
            <p className="max-w-xl text-sm leading-6 text-slate-800 sm:text-base">
              Google login is complete. Before showing recommendations, Wodit needs your cold
              or heat sensitivity. Latitude and longitude stay editable on the main page at all
              times.
            </p>
          </div>
          <SignOutButton />
        </div>

        <div className="rounded-[1.6rem] bg-white/70 p-5">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-slate-950">Sensitivity</p>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-sm text-white">
              {profile.sensitivity > 0 ? "+" : ""}
              {profile.sensitivity}
            </span>
          </div>
          <input
            className="mt-4 w-full accent-slate-900"
            type="range"
            min={-5}
            max={5}
            step={1}
            value={profile.sensitivity}
            onChange={(event) =>
              useWoditStore.getState().setSensitivity(Number(event.target.value))
            }
          />
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Negative values mean you get warm easily. Positive values mean you get cold easily.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-700">Signed in as {user.email}</p>
          <button
            type="button"
            onClick={() => completeOnboarding(profile.sensitivity, user.name)}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Save sensitivity and continue
          </button>
        </div>
      </div>
    </section>
  );
}

export function WoditDashboard({ user }: { user: DashboardUser }) {
  const {
    activePreset,
    profile,
    hydrate,
    completeOnboarding,
    setSensitivity,
    setLocationField,
    applyCurrentLocation,
    setActivePreset,
    submitFeedback
  } = useWoditStore();

  useEffect(() => {
    hydrate(user);
  }, [hydrate, user]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(profileStorageKey(user.email), JSON.stringify(profile));
  }, [profile, user.email]);

  if (!profile.onboardingCompleted) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-10 text-slate-900 sm:px-8">
        <div className="mesh" />
        <OnboardingCard
          user={user}
          profile={profile}
          completeOnboarding={completeOnboarding}
        />
      </main>
    );
  }

  const weather = demoWeatherPresets[activePreset];
  const result = buildRecommendation(weather, profile);
  const summary = createWeatherSummary(weather, result.subjectiveTemp, profile.nickname);

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
                  Dress for how you feel, not just what the forecast says.
                </h1>
                <p className="max-w-lg text-sm leading-6 text-slate-800 sm:text-base">
                  {summary}
                </p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <SignOutButton />
                <div className="rounded-[1.5rem] bg-slate-950/80 px-5 py-4 text-white">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/60">
                    Subjective Temp
                  </p>
                  <p className="mt-2 text-4xl font-semibold">
                    {result.subjectiveTemp.toFixed(1)}C
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    Actual {weather.tempC}C / Offset {profile.offset.toFixed(1)}C
                  </p>
                </div>
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
                  <p className="mt-2 text-xl font-semibold">{preset.tempC}C</p>
                  <p className="mt-1 text-sm">
                    {preset.precipitationMm > 0 ? "Rain expected" : "Dry"} / Wind{" "}
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
                      Bottom / Extras
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
            Personal Controls
          </p>
          <div className="mt-5 space-y-7">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">Sensitivity</p>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-sm text-white">
                  {profile.sensitivity > 0 ? "+" : ""}
                  {profile.sensitivity}
                </span>
              </div>
              <input
                className="mt-4 w-full accent-slate-900"
                type="range"
                min={-5}
                max={5}
                step={1}
                value={profile.sensitivity}
                onChange={(event) => setSensitivity(Number(event.target.value))}
              />
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Negative means you get warm easily. Positive means you get cold easily.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-semibold">Latitude / Longitude</p>
                <button
                  type="button"
                  onClick={() => void applyCurrentLocation()}
                  className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  Use current location
                </button>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                These coordinates stay editable directly from the main page at any time.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Latitude
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950"
                    type="number"
                    step="0.0001"
                    value={profile.location.lat}
                    onChange={(event) => setLocationField("lat", Number(event.target.value))}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Longitude
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950"
                    type="number"
                    step="0.0001"
                    value={profile.location.lng}
                    onChange={(event) => setLocationField("lng", Number(event.target.value))}
                  />
                </label>
              </div>
              <p className="mt-3 text-sm text-slate-700">
                Active coordinates: {formatCoordinates(profile.location)}
              </p>
            </div>

            <div>
              <p className="text-lg font-semibold">Feedback Loop</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Use feedback after going outside to adjust the learned offset.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: "Too cold", value: "TOO_COLD" },
                  { label: "Just right", value: "GOOD" },
                  { label: "Too hot", value: "TOO_HOT" }
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
                Learned offset: {profile.offset.toFixed(1)}C
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
