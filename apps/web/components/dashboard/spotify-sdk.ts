"use client";

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: SpotifyNamespace;
  }
}

export type SpotifyPlayerState = {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: {
      name: string;
      uri: string;
      album: {
        images: Array<{ url: string }>;
      };
      artists: Array<{ name: string }>;
    };
  };
};

type SpotifyListenerMap = {
  ready: { device_id: string };
  not_ready: { device_id: string };
  initialization_error: { message: string };
  authentication_error: { message: string };
  account_error: { message: string };
  playback_error: { message: string };
  player_state_changed: SpotifyPlayerState | null;
};

export interface SpotifyPlayerInstance {
  addListener<K extends keyof SpotifyListenerMap>(
    event: K,
    callback: (payload: SpotifyListenerMap[K]) => void
  ): boolean;
  removeListener<K extends keyof SpotifyListenerMap>(
    event: K,
    callback?: (payload: SpotifyListenerMap[K]) => void
  ): boolean;
  connect(): Promise<boolean>;
  disconnect(): void;
  togglePlay(): Promise<void>;
}

interface SpotifyNamespace {
  Player: new (options: {
    name: string;
    volume?: number;
    getOAuthToken: (callback: (token: string) => void) => void;
  }) => SpotifyPlayerInstance;
}

let sdkPromise: Promise<SpotifyNamespace> | null = null;

export function loadSpotifySdk() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Spotify SDK is only available in the browser."));
  }

  if (window.Spotify) {
    return Promise.resolve(window.Spotify);
  }

  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise<SpotifyNamespace>((resolve, reject) => {
    const existingScript = document.getElementById("spotify-player-sdk");

    const handleReady = () => {
      if (window.Spotify) {
        resolve(window.Spotify);
      } else {
        reject(new Error("Spotify SDK loaded without exposing the player namespace."));
      }
    };

    window.onSpotifyWebPlaybackSDKReady = handleReady;

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.id = "spotify-player-sdk";
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    script.onerror = () => reject(new Error("Spotify SDK script failed to load."));

    document.head.appendChild(script);
  });

  return sdkPromise;
}
