import type { UserProfile } from "@wodit/types";
import { SignOutButton } from "../auth-buttons";
import type { DashboardUser } from "./store";
import { useWoditStore } from "./store";

export function OnboardingCard({
  user,
  profile,
  completeOnboarding
}: {
  user: DashboardUser;
  profile: UserProfile;
  completeOnboarding: (sensitivity: number, nickname: string) => void;
}) {
  return (
    <section className="glass relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] p-8 shadow-[0_24px_80px_rgba(51,86,113,0.18)]">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(183,224,255,0.54),rgba(255,255,255,0.4),rgba(170,216,233,0.24))]" />
      <div className="relative z-10 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-600">
              First Login
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
              {"\uCD94\uC704\uC640 \uB354\uC704 \uBBFC\uAC10\uB3C4\uB97C \uBA3C\uC800 \uC54C\uB824\uC8FC\uC138\uC694"}
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              {"\uC785\uB825\uD55C \uC131\uD5A5\uC744 \uAE30\uC900\uC73C\uB85C \uCCB4\uAC10 \uC628\uB3C4\uC640 \uCF54\uB514 \uCD94\uCC9C\uC774 \uAC1C\uC778\uD654\uB429\uB2C8\uB2E4."}
            </p>
          </div>
          <SignOutButton />
        </div>

        <div className="rounded-[1.6rem] bg-white/70 p-5">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-slate-950">{"\uBBFC\uAC10\uB3C4"}</p>
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
          <div className="mt-3 flex justify-between text-xs text-slate-500">
            <span>{"\uB354\uC704\uB97C \uB9CE\uC774 \uD0D0"}</span>
            <span>{"\uCD94\uC704\uB97C \uB9CE\uC774 \uD0D0"}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-700">{user.email}</p>
          <button
            type="button"
            onClick={() => completeOnboarding(profile.sensitivity, user.name)}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {"\uC2DC\uC791\uD558\uAE30"}
          </button>
        </div>
      </div>
    </section>
  );
}
