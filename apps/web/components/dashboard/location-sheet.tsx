"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { UserProfile } from "@wodit/types";
import type { RecentLocation } from "./store";

type Props = {
  open: boolean;
  profile: UserProfile;
  regionName: string;
  recentLocations: RecentLocation[];
  onClose: () => void;
  onCurrentLocation: () => void | Promise<void>;
  onSearchAddress: (query: string) => Promise<void>;
  onApplyRecent: (location: RecentLocation) => void;
  onSave: () => void;
};

const inputStyle = {
  color: "#f8fbff",
  backgroundColor: "rgba(7, 15, 27, 0.88)",
  WebkitTextFillColor: "#f8fbff",
  caretColor: "#f8fbff"
} as const;

export function LocationSheet({
  open,
  profile,
  regionName,
  recentLocations,
  onClose,
  onCurrentLocation,
  onSearchAddress,
  onApplyRecent,
  onSave
}: Props) {
  const [query, setQuery] = useState(regionName);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setQuery(regionName);
      setError(null);
    }
  }, [open, regionName]);

  if (!open) return null;

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("주소를 입력해 주세요.");
      return;
    }

    try {
      setPending(true);
      setError(null);
      await onSearchAddress(query);
    } catch (searchError) {
      setError(
        searchError instanceof Error ? searchError.message : "주소를 찾지 못했습니다."
      );
    } finally {
      setPending(false);
    }
  };

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
        className="absolute bottom-0 left-0 right-0 mx-auto max-w-3xl rounded-t-[2rem] border border-white/14 bg-[rgba(20,29,44,0.94)] p-6 text-white shadow-[0_-18px_48px_rgba(0,0,0,0.28)] backdrop-blur-[20px]"
      >
        <div className="mx-auto mb-5 h-1.5 w-20 rounded-full bg-white/18" />
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/52">Location</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">위치 변경</h3>
          </div>
          <button
            type="button"
            onClick={() => void onCurrentLocation()}
            className="rounded-full bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/16"
          >
            현위치로 설정
          </button>
        </div>

        <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
          <label className="text-sm text-white/76">
            주소 검색
            <div className="mt-2 flex gap-3">
              <input
                className="w-full rounded-2xl border border-white/12 px-4 py-3 text-sm text-white outline-none placeholder:text-white/42"
                placeholder="예: 서울 강남구, 대전 유성구, 제주"
                style={inputStyle}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSearch();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => void handleSearch()}
                disabled={pending}
                className="rounded-2xl bg-sky-300/20 px-4 py-3 text-sm font-medium text-sky-50 transition hover:bg-sky-300/28 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {pending ? "검색 중" : "검색"}
              </button>
            </div>
          </label>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/18 px-4 py-3 text-sm text-white/72">
            <p className="font-medium text-white/88">{regionName}</p>
            <p className="mt-1 text-white/60">
              위도 {profile.location.lat.toFixed(4)} / 경도 {profile.location.lng.toFixed(4)}
            </p>
          </div>

          {error ? (
            <div className="mt-3 rounded-2xl border border-rose-200/15 bg-rose-300/10 px-4 py-3 text-sm text-rose-50">
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {recentLocations.map((location) => (
            <button
              key={`${location.name}-${location.lat}-${location.lng}`}
              type="button"
              onClick={() => {
                onApplyRecent(location);
                setQuery(location.name);
              }}
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
            이 위치 저장
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/16"
          >
            닫기
          </button>
        </div>
      </motion.div>
    </div>
  );
}
