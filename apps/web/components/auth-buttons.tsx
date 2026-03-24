"use client";

import { signIn, signOut } from "next-auth/react";

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21.805 12.23c0-.75-.067-1.47-.19-2.16H12v4.09h5.5a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.045-4.4 3.045-7.57Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.07-.91 6.76-2.46l-3.3-2.56c-.91.61-2.07.98-3.46.98-2.66 0-4.91-1.79-5.72-4.2H2.87v2.64A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.28 13.76a5.98 5.98 0 0 1 0-3.52V7.6H2.87a10 10 0 0 0 0 8.8l3.41-2.64Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.04c1.5 0 2.86.52 3.92 1.53l2.94-2.94C17.06 2.98 14.75 2 12 2A10 10 0 0 0 2.87 7.6l3.41 2.64c.81-2.41 3.06-4.2 5.72-4.2Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleSignInButton() {
  return (
    <button
      type="button"
      onClick={() => void signIn("google", { callbackUrl: "/" })}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#cfd9df] bg-white px-4 py-3 text-sm font-medium text-[#31424d] shadow-[0_8px_20px_rgba(124,150,167,0.12)] transition hover:bg-[#fafdff]"
    >
      <GoogleMark />
      <span>{"Google \uACC4\uC815\uC73C\uB85C \uB85C\uADF8\uC778"}</span>
    </button>
  );
}

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => void signOut({ callbackUrl: "/" })}
      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
    >
      {"\uB85C\uADF8\uC544\uC6C3"}
    </button>
  );
}
