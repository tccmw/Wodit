import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

const apiBase = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
const appBase =
  process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
const spotifyRedirectBase =
  process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_BASE || "http://127.0.0.1:3000";

export async function GET(request: Request) {
  const session = await auth();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state");
  const email = session?.user?.email ?? state;
  const redirectTarget = new URL("/", appBase);

  if (!email) {
    redirectTarget.searchParams.set("spotify", "login_required");
    return NextResponse.redirect(redirectTarget);
  }

  if (error || !code) {
    redirectTarget.searchParams.set("spotify", "connect_failed");
    return NextResponse.redirect(redirectTarget);
  }

  const redirectUri = `${spotifyRedirectBase}/api/spotify/callback`;

  try {
    const response = await fetch(`${apiBase}/spotify/oauth/exchange`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        code,
        redirectUri
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      redirectTarget.searchParams.set("spotify", "connect_failed");
      if (detail) {
        redirectTarget.searchParams.set("spotify_detail", detail.slice(0, 180));
      }
      return NextResponse.redirect(redirectTarget);
    }

    redirectTarget.searchParams.set("spotify", "connected");
    return NextResponse.redirect(redirectTarget);
  } catch (error) {
    redirectTarget.searchParams.set("spotify", "connect_failed");
    if (error instanceof Error) {
      redirectTarget.searchParams.set("spotify_detail", error.message.slice(0, 180));
    }
    return NextResponse.redirect(redirectTarget);
  }
}
