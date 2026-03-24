"use client";

import { motion } from "framer-motion";
import type { UserProfile } from "@wodit/types";
import type { RecentLocation } from "./store";

type Props = {
  open: boolean;
  profile: UserProfile;
  regionName: string;
  recentLocations: RecentLocation[];
  onClose: () => void;
  onCurrentLocation: () => void | Promise<void>;
  onRegionNameChange: (value: string) => void;
  onLocationFieldChange: (field: "lat" | "lng", value: number) => void;
  onApplyRecent: (location: RecentLocation) => void;
  onSave: () => void;
};

export function LocationSheet({
  open,
  profile,
  regionName,
  recentLocations,
  onClose,
  onCurrentLocation,
  onRegionNameChange,
  onLocationFieldChange,
  onApplyRecent,
  onSave
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/42 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-0 left-0 right-0 mx-auto max-w-3xl rounded-t-[2rem] border border-white/14 bg-[rgba(20,29,44,0.92)] p-6 text-white shadow-[0_-18px_48px_rgba(0,0,0,0.28)] backdrop-blur-[20px]"
      >
        <div className="mx-auto mb-5 h-1.5 w-20 rounded-full bg-white/18" />
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/52">Location</p>
            <h3 className="mt-2 text-2xl font-semibold">{"\uC704\uCE58 \uBCC0\uACBD"}</h3>
          </div>
          <button
            type="button"
            onClick={() => void onCurrentLocation()}
            className="rounded-full bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/16"
          >
            {"\uD604\uC704\uCE58\uB85C \uC124\uC815"}
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="text-sm text-white/76">
            {"\uC704\uCE58 \uC774\uB984"}
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
              placeholder={"예: 서울특별시 강남구"}
              value={regionName}
              onChange={(event) => onRegionNameChange(event.target.value)}
            />
          </label>
          <label className="text-sm text-white/76">
            {"\uC704\uB3C4"}
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none"
              type="number"
              step="0.0001"
              value={profile.location.lat}
              onChange={(event) => onLocationFieldChange("lat", Number(event.target.value))}
            />
          </label>
          <label className="text-sm text-white/76">
            {"\uACBD\uB3C4"}
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none"
              type="number"
              step="0.0001"
              value={profile.location.lng}
              onChange={(event) => onLocationFieldChange("lng", Number(event.target.value))}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {recentLocations.map((location) => (
            <button
              key={`${location.name}-${location.lat}-${location.lng}`}
              type="button"
              onClick={() => onApplyRecent(location)}
              className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs text-white transition hover:bg-white/14"
            >
              {location.name}
            </button>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onSave}
            className="flex-1 rounded-2xl bg-sky-300/20 px-4 py-3 text-sm font-medium text-sky-50 transition hover:bg-sky-300/28"
          >
            {"\uC800\uC7A5\uD558\uACE0 \uBC18\uC601"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/16"
          >
            {"\uB2EB\uAE30"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
