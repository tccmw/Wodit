"use client";

import { create } from "zustand";
import type { Coordinates, FeedbackStatus, UserProfile } from "@wodit/types";
import { applyFeedbackOffset } from "@wodit/utils";

export type DashboardUser = {
  email: string;
  name: string;
  image: string | null;
};

export type RecentLocation = {
  name: string;
  lat: number;
  lng: number;
};

type Store = {
  profile: UserProfile;
  regionName: string;
  recentLocations: RecentLocation[];
  hydrate: (user: DashboardUser) => void;
  completeOnboarding: (sensitivity: number, nickname: string) => void;
  setSensitivity: (value: number) => void;
  setRegionName: (value: string) => void;
  setLocationField: (field: keyof Coordinates, value: number) => void;
  applyCurrentLocation: () => Promise<void>;
  saveRecentLocation: () => void;
  applyRecentLocation: (location: RecentLocation) => void;
  submitFeedback: (status: FeedbackStatus) => void;
};

export const defaultProfile: UserProfile = {
  sensitivity: 0,
  offset: 0,
  nickname: "Wodit User",
  location: {
    lat: 37.5665,
    lng: 126.978
  },
  onboardingCompleted: false
};

export const defaultRegionName = "\uC11C\uC6B8\uD2B9\uBCC4\uC2DC \uAC15\uB0A8\uAD6C";

export function profileStorageKey(email: string) {
  return `wodit-profile:${email}`;
}

export function recentStorageKey(email: string) {
  return `wodit-recent-locations:${email}`;
}

export const useWoditStore = create<Store>((set, get) => ({
  profile: defaultProfile,
  regionName: defaultRegionName,
  recentLocations: [],
  hydrate: (user) => {
    if (typeof window === "undefined") return;

    const profileRaw = window.localStorage.getItem(profileStorageKey(user.email));
    const recentRaw = window.localStorage.getItem(recentStorageKey(user.email));

    let nextProfile: UserProfile = {
      ...defaultProfile,
      nickname: user.name
    };

    if (profileRaw) {
      try {
        const parsed = JSON.parse(profileRaw) as Partial<UserProfile> & {
          regionName?: string;
        };
        nextProfile = {
          ...nextProfile,
          ...parsed,
          nickname: parsed.nickname || user.name
        };
        set({ regionName: parsed.regionName || defaultRegionName });
      } catch {
        window.localStorage.removeItem(profileStorageKey(user.email));
      }
    }

    if (recentRaw) {
      try {
        set({ recentLocations: JSON.parse(recentRaw) as RecentLocation[] });
      } catch {
        window.localStorage.removeItem(recentStorageKey(user.email));
      }
    }

    set({ profile: nextProfile });
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
  setRegionName: (value) => set({ regionName: value }),
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
    if (typeof window === "undefined" || !navigator.geolocation) return;

    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    }).catch(() => null);

    if (!position) return;

    set((state) => ({
      profile: {
        ...state.profile,
        location: {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6))
        }
      },
      regionName: "\uD604\uC704\uCE58"
    }));
  },
  saveRecentLocation: () => {
    const { profile, regionName, recentLocations } = get();
    const next = [
      {
        name: regionName.trim() || "\uC9C1\uC811 \uC785\uB825 \uC704\uCE58",
        lat: Number(profile.location.lat.toFixed(4)),
        lng: Number(profile.location.lng.toFixed(4))
      },
      ...recentLocations
    ]
      .filter(
        (item, index, list) =>
          list.findIndex(
            (candidate) =>
              candidate.name === item.name &&
              candidate.lat === item.lat &&
              candidate.lng === item.lng
          ) === index
      )
      .slice(0, 5);

    set({ recentLocations: next });
  },
  applyRecentLocation: (location) =>
    set((state) => ({
      profile: {
        ...state.profile,
        location: {
          lat: location.lat,
          lng: location.lng
        }
      },
      regionName: location.name
    })),
  submitFeedback: (status) =>
    set((state) => ({
      profile: {
        ...state.profile,
        ...applyFeedbackOffset(state.profile, status)
      }
    }))
}));
