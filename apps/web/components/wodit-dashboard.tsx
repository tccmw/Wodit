"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type {
  SubmitFeedbackRequest,
  SubmitFeedbackResponse,
  WeatherRecommendationResponse
} from "@wodit/types";
import { SignOutButton } from "./auth-buttons";
import { GlassCard } from "./dashboard/glass-card";
import {
  apiBase,
  buildLookbookItems,
  getConditionLabel,
  getThemeMode
} from "./dashboard/helpers";
import { LocationSheet } from "./dashboard/location-sheet";
import { LookbookCanvas } from "./dashboard/lookbook-canvas";
import { MusicModal } from "./dashboard/music-modal";
import { OnboardingCard } from "./dashboard/onboarding-card";
import {
  profileStorageKey,
  recentStorageKey,
  type DashboardUser,
  useWoditStore
} from "./dashboard/store";

export function WoditDashboard({ user }: { user: DashboardUser }) {
  const {
    profile,
    regionName,
    recentLocations,
    hydrate,
    applyRemoteProfile,
    completeOnboarding,
    setSensitivity,
    applyResolvedLocation,
    applyCurrentLocation,
    saveRecentLocation,
    applyRecentLocation,
    submitFeedback
  } = useWoditStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [outfitVariant, setOutfitVariant] = useState(0);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [musicBarState, setMusicBarState] = useState<{
    title: string;
    playing: boolean;
  }>({
    title: "추천 플레이리스트",
    playing: false
  });
  const [liveData, setLiveData] = useState<WeatherRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate(user);
  }, [hydrate, user]);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(`${apiBase}/users/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            image: user.image
          }),
          signal: controller.signal
        });

        if (!response.ok) return;
        const syncedProfile = await response.json();
        applyRemoteProfile(syncedProfile);
        setSpotifyConnected(Boolean(syncedProfile.spotifyConnected));
      } catch {
        // keep local state when sync is unavailable
      }
    })();

    return () => controller.abort();
  }, [applyRemoteProfile, user.email, user.image, user.name]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const spotifyStatus = url.searchParams.get("spotify");
    const spotifyDetail = url.searchParams.get("spotify_detail");

    if (!spotifyStatus) return;

    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(
          `${apiBase}/users/profile?email=${encodeURIComponent(user.email)}`,
          {
            signal: controller.signal
          }
        );

        if (!response.ok) return;

        const persistedProfile = await response.json();
        if (persistedProfile) {
          applyRemoteProfile(persistedProfile);
          setSpotifyConnected(Boolean(persistedProfile.spotifyConnected));
        }

        if (spotifyStatus === "connect_failed") {
          setError(spotifyDetail || "Spotify 연결에 실패했습니다.");
        }
      } catch {
        // keep current state when profile refresh fails
      } finally {
        url.searchParams.delete("spotify");
        url.searchParams.delete("spotify_detail");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }
    })();

    return () => controller.abort();
  }, [applyRemoteProfile, user.email]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      profileStorageKey(user.email),
      JSON.stringify({ ...profile, regionName })
    );
    window.localStorage.setItem(recentStorageKey(user.email), JSON.stringify(recentLocations));
  }, [profile, recentLocations, regionName, user.email]);

  useEffect(() => {
    if (!profile.onboardingCompleted) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        await fetch(`${apiBase}/users/profile`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: user.email,
            nickname: profile.nickname,
            sensitivity: profile.sensitivity,
            offset: profile.offset,
            location: profile.location,
            regionName,
            onboardingCompleted: profile.onboardingCompleted
          }),
          signal: controller.signal
        });
      } catch {
        // local state remains authoritative when save fails
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [
    profile.location,
    profile.nickname,
    profile.offset,
    profile.onboardingCompleted,
    profile.sensitivity,
    regionName,
    user.email
  ]);

  useEffect(() => {
    if (!profile.onboardingCompleted) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          email: user.email,
          lat: String(profile.location.lat),
          lon: String(profile.location.lng),
          variant: String(outfitVariant),
          sensitivity: String(profile.sensitivity),
          offset: String(profile.offset),
          nickname: profile.nickname
        });

        const response = await fetch(`${apiBase}/recommendations/weather?${params}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("\uCD94\uCC9C \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
        }

        const data = (await response.json()) as WeatherRecommendationResponse;
        setLiveData(data);
        setMusicBarState((current) => ({
          title:
            data.spotify?.title ??
            data.recommendation.musicMood.title ??
            current.title,
          playing: current.playing
        }));
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "\uC11C\uBC84\uC640 \uC5F0\uACB0\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [
    profile.location.lat,
    profile.location.lng,
    profile.nickname,
    profile.offset,
    profile.onboardingCompleted,
    profile.sensitivity,
    outfitVariant,
    user.email
  ]);

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

  const weather = liveData?.weather;
  const recommendation = liveData?.recommendation;
  const lookbookItems = buildLookbookItems(liveData);
  const outfitItems = recommendation
    ? [
        ...recommendation.outfit.top,
        ...recommendation.outfit.bottom,
        ...recommendation.outfit.extras
      ]
    : [];

  return (
    <main className="rainy-dashboard relative min-h-screen overflow-hidden text-white">
      <div className="rain-streaks" />
      <div className="rain-droplets-overlay" />

      <section className="relative mx-auto max-w-7xl px-4 py-6 sm:px-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void applyCurrentLocation()}
              className="rain-glass-chip"
            >
              {"\uD604\uC704\uCE58\uB85C \uC124\uC815"}
            </button>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="rain-glass-chip"
            >
              {"\uC704\uCE58 \uBCC0\uACBD"}
            </button>
            <span className="rain-glass-chip">{regionName}</span>
            {weather?.label ? (
              <span className="rain-glass-chip">{weather.label}</span>
            ) : null}
            {liveData ? (
              <span className="rain-glass-chip">
                {liveData.source === "openweather"
                  ? "\uC2E4\uC2DC\uAC04 \uB0A0\uC528"
                  : "\uB370\uBAA8 \uB0A0\uC528"}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMusicOpen(true)}
              className="rain-glass-chip"
            >
              {musicBarState.playing ? "재생 중" : "Playlist"}
              {" · "}
              {musicBarState.title}
            </button>
            <SignOutButton />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.82fr_1.38fr_0.74fr]">
          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="h-full p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-white/55">Visual Proof</p>
              <p className="mt-4 text-sm leading-7 text-white/72">
                {weather && recommendation
                  ? `\uC2E4\uC81C ${weather.tempC}\u00B0C\uC9C0\uB9CC ${profile.nickname}\uB2D8 \uB9DE\uCDA4 \uCCB4\uAC10 \uC628\uB3C4\uB294 ${recommendation.subjectiveTemp.toFixed(
                      1
                    )}\u00B0C\uC785\uB2C8\uB2E4.`
                  : "\uC2E4\uC2DC\uAC04 \uCD94\uCC9C \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4."}
              </p>

              <div className="mt-7 rounded-[1.4rem] bg-black/16 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/52">
                  Subjective Temp
                </p>
                <p className="mt-2 text-6xl font-black tracking-[-0.08em] text-white">
                  {recommendation ? recommendation.subjectiveTemp.toFixed(1) : "--"}
                </p>
                <p className="mt-2 text-sm text-white/62">
                  {weather
                    ? `${getConditionLabel(weather.condition)} / \uD48D\uC18D ${weather.windSpeedMs}m/s`
                    : "\uB0A0\uC528 \uB85C\uB529 \uC911"}
                </p>
                <div className="mt-5">
                  <div className="glow-meter">
                    <motion.div
                      className="glow-meter-fill"
                      animate={{
                        width: `${Math.max(
                          8,
                          Math.min(100, (((recommendation?.subjectiveTemp ?? 0) + 5) / 35) * 100)
                        )}%`
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[1.2rem] border border-white/10 bg-white/6 p-4 text-sm leading-6 text-white/72">
                {loading
                  ? "\uC11C\uBC84\uC5D0\uC11C \uCD5C\uC2E0 \uB0A0\uC528\uC640 \uCD94\uCC9C\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4."
                  : null}
                {!loading && error ? error : null}
                {!loading && !error && recommendation ? recommendation.reason : null}
              </div>
            </GlassCard>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <GlassCard className="h-full p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/55">
                    Outfit Canvas
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                    {"\uC624\uB298\uC758 \uCF54\uB514"}
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-sm text-white/68">
                {recommendation?.lookHeadline ?? getThemeMode(weather?.condition)}
              </p>

              <div className="mt-6">
                <LookbookCanvas items={lookbookItems} />
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/8 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/55">This Look</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {outfitItems.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/84"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOutfitVariant((current) => current + 1)}
                    className="rounded-full bg-[linear-gradient(180deg,rgba(120,170,255,0.24),rgba(87,125,222,0.18))] px-5 py-3 text-sm font-medium text-sky-50 transition hover:bg-[linear-gradient(180deg,rgba(120,170,255,0.32),rgba(87,125,222,0.24))]"
                  >
                    다음 코디
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      submitFeedback("GOOD");
                      void sendFeedback("GOOD");
                    }}
                    className="rounded-full bg-[linear-gradient(180deg,rgba(120,213,184,0.28),rgba(73,167,142,0.18))] px-5 py-3 text-sm font-medium text-emerald-50 transition hover:bg-[linear-gradient(180deg,rgba(120,213,184,0.36),rgba(73,167,142,0.26))]"
                  >
                    {"\uC88B\uC544\uC694"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      submitFeedback("TOO_COLD");
                      void sendFeedback("TOO_COLD");
                    }}
                    className="rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.08))] px-5 py-3 text-sm font-medium text-white transition hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.12))]"
                  >
                    {"\uC870\uAE08 \uCD94\uC6E0\uC5B4\uC694"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      submitFeedback("TOO_HOT");
                      void sendFeedback("TOO_HOT");
                    }}
                    className="rounded-full bg-[linear-gradient(180deg,rgba(255,188,128,0.22),rgba(255,154,96,0.16))] px-5 py-3 text-sm font-medium text-orange-50 transition hover:bg-[linear-gradient(180deg,rgba(255,188,128,0.3),rgba(255,154,96,0.22))]"
                  >
                    {"\uC870\uAE08 \uB354\uC6E0\uC5B4\uC694"}
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="h-full p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-white/55">Quick Info</p>

              <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-black/10 p-4">
                <p className="text-sm font-semibold text-white/84">
                  {"\uBBFC\uAC10\uB3C4 \uC870\uC808"}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                    {profile.sensitivity > 0 ? "+" : ""}
                    {profile.sensitivity}
                  </span>
                  <span className="text-xs text-white/56">
                    {`offset ${profile.offset.toFixed(1)}°C`}
                  </span>
                </div>
                <input
                  className="mt-4 w-full accent-sky-300"
                  type="range"
                  min={-5}
                  max={5}
                  step={1}
                  value={profile.sensitivity}
                  onChange={(event) => setSensitivity(Number(event.target.value))}
                />
              </div>

              <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-black/10 p-4">
                <p className="text-sm font-semibold text-white/84">
                  {"\uC2E4\uC2DC\uAC04 \uB0A0\uC528"}
                </p>
                <dl className="mt-4 space-y-3 text-sm text-white/76">
                  <div className="flex items-center justify-between">
                    <dt>{"\uC0C1\uD0DC"}</dt>
                    <dd className="font-semibold">{getConditionLabel(weather?.condition)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>{"\uAE30\uC628"}</dt>
                    <dd className="font-semibold">{weather ? `${weather.tempC}°C` : "-"}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>{"\uAC15\uC218\uB7C9"}</dt>
                    <dd className="font-semibold">
                      {weather ? `${weather.precipitationMm} mm` : "-"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>{"UV \uC9C0\uC218"}</dt>
                    <dd className="font-semibold">{weather?.uvIndex ?? "-"}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>{"\uC704\uB3C4"}</dt>
                    <dd className="font-semibold">{profile.location.lat.toFixed(4)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>{"\uACBD\uB3C4"}</dt>
                    <dd className="font-semibold">{profile.location.lng.toFixed(4)}</dd>
                  </div>
                </dl>
              </div>
            </GlassCard>
          </motion.aside>
        </div>
      </section>

      <LocationSheet
        open={sheetOpen}
        profile={profile}
        regionName={regionName}
        recentLocations={recentLocations}
        onClose={() => setSheetOpen(false)}
        onCurrentLocation={() => void applyCurrentLocation()}
        onSearchAddress={async (query) => {
          const response = await fetch(
            `${apiBase}/weather/geocode?q=${encodeURIComponent(query)}`
          );

          if (!response.ok) {
            throw new Error("주소를 찾지 못했습니다.");
          }

          const data = (await response.json()) as {
            name: string;
            lat: number;
            lng: number;
          };

          applyResolvedLocation({
            name: data.name,
            lat: data.lat,
            lng: data.lng
          });
        }}
        onApplyRecent={applyRecentLocation}
        onSave={() => {
          saveRecentLocation();
          setSheetOpen(false);
        }}
      />

      <MusicModal
        open={musicOpen}
        userEmail={user.email}
        spotifyConnected={spotifyConnected}
        musicMood={recommendation?.musicMood}
        spotify={liveData?.spotify}
        onPlaybackMetaChange={setMusicBarState}
        onClose={() => setMusicOpen(false)}
      />
    </main>
  );

  async function sendFeedback(status: SubmitFeedbackRequest["status"]) {
    if (!weather || !recommendation) return;

    try {
      const response = await fetch(`${apiBase}/users/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: user.email,
          status,
          weather,
          location: profile.location,
          recommendation
        } satisfies SubmitFeedbackRequest)
      });

      if (!response.ok) return;

      const data = (await response.json()) as SubmitFeedbackResponse;
      applyRemoteProfile(data.profile);
      setSpotifyConnected(Boolean(data.profile.spotifyConnected));
    } catch {
      // keep local optimistic feedback when API fails
    }
  }
}
