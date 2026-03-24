"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MusicMood, SpotifyPlaylistPreview } from "@wodit/types";
import { apiBase } from "./helpers";
import { loadSpotifySdk, type SpotifyPlayerInstance, type SpotifyPlayerState } from "./spotify-sdk";

export function MusicModal({
  open,
  userEmail,
  spotifyConnected,
  musicMood,
  spotify,
  onPlaybackMetaChange,
  onClose
}: {
  open: boolean;
  userEmail: string;
  spotifyConnected: boolean;
  musicMood?: MusicMood;
  spotify?: SpotifyPlaylistPreview | null;
  onPlaybackMetaChange?: (meta: { title: string; playing: boolean }) => void;
  onClose: () => void;
}) {
  const playerRef = useRef<SpotifyPlayerInstance | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<SpotifyPlayerState | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const currentImage =
    playerState?.track_window.current_track.album.images?.[0]?.url ?? spotify?.imageUrl ?? null;
  const currentTitle =
    playerState?.track_window.current_track.name ??
    spotify?.title ??
    musicMood?.title ??
    "추천 플레이리스트";
  const currentArtist = playerState?.track_window.current_track.artists
    ?.map((artist) => artist.name)
    .join(", ");
  const currentDescription =
    playerState?.paused === false
      ? currentArtist ?? spotify?.description ?? musicMood?.description ?? null
      : spotify?.description ?? musicMood?.description ?? null;

  const progressLabel = useMemo(() => {
    const position = playerState?.position ?? 0;
    const duration = playerState?.duration ?? 0;

    return {
      current: toTime(position),
      duration: toTime(duration),
      ratio: duration > 0 ? Math.min(100, (position / duration) * 100) : 0
    };
  }, [playerState?.duration, playerState?.position]);

  useEffect(() => {
    onPlaybackMetaChange?.({
      title: currentTitle ?? "추천 플레이리스트",
      playing: playerState?.paused === false
    });
  }, [currentTitle, onPlaybackMetaChange, playerState?.paused]);

  useEffect(() => {
    if (!open || !spotifyConnected) {
      return;
    }

    let cancelled = false;

    const setup = async () => {
      try {
        setPlayerError(null);
        const Spotify = await loadSpotifySdk();

        if (cancelled || playerRef.current) {
          return;
        }

        const player = new Spotify.Player({
          name: "Wodit Player",
          volume: 0.72,
          getOAuthToken: async (callback) => {
            try {
              const response = await fetch(
                `${apiBase}/spotify/sdk-token?email=${encodeURIComponent(userEmail)}`
              );

              if (!response.ok) {
                throw new Error("Spotify 토큰을 가져오지 못했습니다.");
              }

              const data = (await response.json()) as { accessToken: string };
              callback(data.accessToken);
            } catch {
              setPlayerError("Spotify 토큰을 불러오지 못했습니다.");
            }
          }
        });

        player.addListener("ready", ({ device_id }) => {
          if (cancelled) return;
          setDeviceId(device_id);
          setSdkReady(true);
        });
        player.addListener("not_ready", () => {
          if (cancelled) return;
          setSdkReady(false);
        });
        player.addListener("player_state_changed", (state) => {
          if (cancelled) return;
          setPlayerState(state);
        });
        player.addListener("initialization_error", ({ message }) => {
          if (cancelled) return;
          setPlayerError(message);
        });
        player.addListener("authentication_error", ({ message }) => {
          if (cancelled) return;
          setPlayerError(message);
        });
        player.addListener("account_error", ({ message }) => {
          if (cancelled) return;
          setPlayerError(message);
        });
        player.addListener("playback_error", ({ message }) => {
          if (cancelled) return;
          setPlayerError(message);
        });

        const connected = await player.connect();

        if (!connected && !cancelled) {
          setPlayerError("Spotify 플레이어를 연결하지 못했습니다.");
        }

        playerRef.current = player;
      } catch (error) {
        if (!cancelled) {
          setPlayerError(
            error instanceof Error ? error.message : "Spotify SDK를 불러오지 못했습니다."
          );
        }
      }
    };

    void setup();

    return () => {
      cancelled = true;
      playerRef.current?.disconnect();
      playerRef.current = null;
      setDeviceId(null);
      setSdkReady(false);
      setPlayerState(null);
    };
  }, [open, spotifyConnected, userEmail]);

  if (!open) return null;

  const openSpotifyConnect = () => {
    const redirectBase =
      process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_BASE ||
      window.location.origin.replace("localhost", "127.0.0.1");
    const redirectUri = `${redirectBase}/api/spotify/callback`;
    window.location.href = `${apiBase}/spotify/oauth/authorize?redirectUri=${encodeURIComponent(
      redirectUri
    )}&state=${encodeURIComponent(userEmail)}`;
  };

  const runPlayerCommand = async (action: "play" | "pause" | "next" | "previous") => {
    if (!deviceId) {
      setPlayerError("Spotify 플레이어가 아직 준비되지 않았습니다.");
      return;
    }

    if (action === "play" && !spotify?.uri) {
      setPlayerError("재생할 Spotify 플레이리스트가 없습니다.");
      return;
    }

    try {
      setPending(true);
      setPlayerError(null);

      const response = await fetch(`${apiBase}/spotify/player/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: userEmail,
          deviceId,
          contextUri: spotify?.uri ?? undefined
        })
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Spotify 재생 제어에 실패했습니다.");
      }

      if (action === "play") {
        onPlaybackMetaChange?.({
          title: currentTitle ?? spotify?.title ?? musicMood?.title ?? "추천 플레이리스트",
          playing: true
        });
      }

      if (action === "pause") {
        setPlayerState((current) => (current ? { ...current, paused: true } : current));
      }
    } catch (error) {
      setPlayerError(
        error instanceof Error
          ? error.message
          : "Spotify 재생 제어 중 오류가 발생했습니다."
      );
    } finally {
      setPending(false);
    }
  };

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
              {currentTitle}
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/60">
              {currentDescription ?? "현재 날씨와 코디 무드에 맞춘 Spotify 추천입니다."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-2 text-xs text-white transition hover:bg-white/16"
          >
            닫기
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[160px_1fr]">
          <div className="rounded-[1.3rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_28%),linear-gradient(135deg,rgba(129,198,245,0.6),rgba(31,47,68,0.92))] p-3 shadow-[0_20px_44px_rgba(0,0,0,0.22)]">
            <div
              className="aspect-square rounded-[1rem] bg-cover bg-center bg-no-repeat"
              style={
                currentImage
                  ? { backgroundImage: `url(${currentImage})` }
                  : {
                      backgroundImage:
                        "linear-gradient(145deg,rgba(255,255,255,0.08),rgba(0,0,0,0.18))"
                    }
              }
            />
          </div>

          <div className="flex flex-col justify-between">
            <div className="flex flex-wrap gap-2">
              {spotify?.title ? (
                <span className="rounded-full border border-emerald-200/20 bg-emerald-300/15 px-3 py-1 text-xs text-emerald-50">
                  Playlist
                </span>
              ) : null}
              {(musicMood?.seedGenres ?? []).map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/74"
                >
                  {genre}
                </span>
              ))}
            </div>

            <div className="mt-5 rounded-[1.2rem] border border-white/10 bg-white/6 p-4">
              {!spotifyConnected ? (
                <div className="space-y-3">
                  <p className="text-sm leading-6 text-white/72">
                    앱 내부 재생을 사용하려면 Spotify 계정을 한 번 연결해야 합니다.
                  </p>
                  <button
                    type="button"
                    onClick={openSpotifyConnect}
                    className="rounded-full border border-emerald-200/20 bg-emerald-300/15 px-4 py-2 text-sm text-emerald-50 transition hover:bg-emerald-300/24"
                  >
                    Spotify 연결
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="h-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-sky-300 transition-all"
                        style={{ width: `${progressLabel.ratio}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-white/55">
                      <span>{progressLabel.current}</span>
                      <span>{progressLabel.duration}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void runPlayerCommand("previous")}
                      disabled={!sdkReady || pending}
                      className="rounded-full bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      이전
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void runPlayerCommand(playerState?.paused === false ? "pause" : "play")
                      }
                      disabled={!sdkReady || pending}
                      className="rounded-full bg-sky-300/20 px-4 py-2 text-sm text-sky-50 transition hover:bg-sky-300/28 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {playerState?.paused === false ? "일시정지" : "재생"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void runPlayerCommand("next")}
                      disabled={!sdkReady || pending}
                      className="rounded-full bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      다음
                    </button>
                    {spotify?.externalUrl ? (
                      <a
                        href={spotify.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-white/78 transition hover:bg-white/14"
                      >
                        Spotify에서 열기
                      </a>
                    ) : null}
                  </div>

                  <p className="text-xs leading-5 text-white/56">
                    {sdkReady
                      ? "Spotify Premium 계정이면 브라우저 안에서 바로 재생됩니다."
                      : "플레이어를 준비 중입니다. 처음 연결 시 몇 초 정도 걸릴 수 있습니다."}
                  </p>
                </div>
              )}
            </div>

            {playerError ? (
              <div className="mt-4 rounded-[1rem] border border-rose-200/15 bg-rose-300/10 px-4 py-3 text-sm text-rose-50">
                {playerError}
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function toTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
