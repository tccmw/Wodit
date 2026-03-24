import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  MusicMood,
  SpotifyOauthExchangeRequest,
  SpotifyPlayerCommandRequest,
  SpotifyPlaylistPreview,
  WeatherSnapshot
} from "@wodit/types";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class SpotifyService {
  private readonly fallbackPlaylist = {
    title: "새벽 인디 감성",
    externalUrl: "https://open.spotify.com/playlist/3gPSenyxZMdB3A54HeEruz",
    uri: "spotify:playlist:3gPSenyxZMdB3A54HeEruz"
  };
  private readonly clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  private readonly clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  private accessToken: string | null = null;
  private expiresAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  getAuthorizeUrl(redirectUri: string, state?: string) {
    if (!this.clientId) {
      throw new Error("Spotify Client ID is not configured.");
    }

    const url = new URL("https://accounts.spotify.com/authorize");
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", redirectUri);

    if (state) {
      url.searchParams.set("state", state);
    }

    url.searchParams.set(
      "scope",
      [
        "streaming",
        "user-read-email",
        "user-read-private",
        "user-modify-playback-state",
        "user-read-playback-state"
      ].join(" ")
    );

    return url.toString();
  }

  async exchangeUserCode(input: SpotifyOauthExchangeRequest) {
    this.ensureOAuthConfig();

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${this.getBasicAuthHeader()}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: input.code,
        redirect_uri: input.redirectUri
      })
    });

    if (!response.ok) {
      const reason = await response.text();
      throw new Error(`Spotify code exchange failed: ${reason}`);
    }

    const token = (await response.json()) as SpotifyTokenResponse;
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.trim().toLowerCase() },
      include: { profile: true }
    });

    if (!user?.profile) {
      throw new NotFoundException("User profile was not found.");
    }

    await this.prisma.profile.update({
      where: { userId: user.id },
      data: {
        spotifyConnected: true,
        spotifyAccessToken: token.access_token,
        spotifyRefreshToken: token.refresh_token ?? user.profile.spotifyRefreshToken,
        spotifyTokenExpires: new Date(Date.now() + token.expires_in * 1000)
      }
    });
  }

  async getSdkAccessToken(email: string) {
    const profile = await this.getConnectedProfile(email);
    return this.ensureFreshUserAccessToken(profile.userId);
  }

  async playContext(input: SpotifyPlayerCommandRequest) {
    const token = await this.getSdkAccessToken(input.email);

    if (!input.deviceId || !input.contextUri) {
      throw new Error("Device ID and context URI are required.");
    }

    await fetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        device_ids: [input.deviceId],
        play: false
      })
    });

    const response = await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(input.deviceId)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          context_uri: input.contextUri
        })
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }
  }

  async pause(email: string, deviceId?: string) {
    await this.playerCommand(email, "pause", deviceId);
  }

  async next(email: string, deviceId?: string) {
    await this.playerCommand(email, "next", deviceId);
  }

  async previous(email: string, deviceId?: string) {
    await this.playerCommand(email, "previous", deviceId);
  }

  async getPlaylistForMood(
    musicMood: MusicMood,
    weather: WeatherSnapshot
  ): Promise<SpotifyPlaylistPreview> {
    if (!this.clientId || !this.clientSecret) {
      return this.buildStaticFallbackPlaylist(musicMood, weather);
    }

    try {
      const token = await this.getAccessToken();
      const playlist = await this.searchBestPlaylist(token, musicMood, weather);

      if (!playlist) {
        return this.buildStaticFallbackPlaylist(musicMood, weather);
      }

      return {
        provider: "spotify",
        title: playlist.name,
        description: this.cleanDescription(playlist.description),
        externalUrl: playlist.external_urls?.spotify ?? this.fallbackPlaylist.externalUrl,
        imageUrl: playlist.images?.[0]?.url ?? null,
        uri: playlist.uri ?? this.fallbackPlaylist.uri
      };
    } catch {
      return this.buildStaticFallbackPlaylist(musicMood, weather);
    }
  }

  private async searchBestPlaylist(
    token: string,
    musicMood: MusicMood,
    weather: WeatherSnapshot
  ) {
    const candidates = await this.collectPlaylistCandidates(
      token,
      this.buildPlaylistQueries(musicMood, weather)
    );

    if (!candidates.length) {
      candidates.push(
        ...(await this.collectPlaylistCandidates(token, this.buildFallbackPlaylistQueries(weather)))
      );
    }

    const uniqueCandidates = candidates.filter(
      (playlist, index, list) =>
        list.findIndex((candidate) => candidate.uri === playlist.uri) === index
    );

    uniqueCandidates.sort(
      (left, right) =>
        this.scorePlaylist(right, musicMood, weather) - this.scorePlaylist(left, musicMood, weather)
    );

    return uniqueCandidates[0] ?? null;
  }

  private async collectPlaylistCandidates(token: string, queries: string[]) {
    const candidates: SpotifySearchPlaylistItem[] = [];

    for (const query of queries) {
      const url = new URL("https://api.spotify.com/v1/search");
      url.searchParams.set("q", query);
      url.searchParams.set("type", "playlist");
      url.searchParams.set("limit", "8");

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as SpotifySearchResponse;
      candidates.push(...(data.playlists?.items ?? []));
    }

    return candidates;
  }

  private buildPlaylistQueries(musicMood: MusicMood, weather: WeatherSnapshot) {
    const primaryGenre = musicMood.seedGenres[0] ?? "indie";
    const normalizedGenres = musicMood.seedGenres.map((genre) => genre.replace(/-/g, " "));
    const weatherMood =
      weather.condition === "rain"
        ? "rainy"
        : weather.condition === "snow"
          ? "winter"
          : weather.condition === "clear"
            ? "sunny"
            : "cloudy";

    return [
      `"${primaryGenre}" playlist`,
      `"${primaryGenre.replace(/-/g, " ")}" playlist`,
      `${primaryGenre} ${weatherMood} playlist`,
      `${normalizedGenres.join(" ")} mood playlist`,
      `${normalizedGenres.join(" ")} playlist`,
      `${this.mapWeatherToKoreanKeyword(weather)} ${this.mapGenreToKoreanKeyword(primaryGenre)} 플레이리스트`,
      `${musicMood.title} playlist`
    ];
  }

  private buildFallbackPlaylistQueries(weather: WeatherSnapshot) {
    const weatherKeyword = this.mapWeatherToKoreanKeyword(weather);

    return [
      `${weatherKeyword} 로파이 플레이리스트`,
      `${weatherKeyword} 앰비언트 플레이리스트`,
      `${weatherKeyword} 인디 플레이리스트`,
      "시티팝 플레이리스트",
      "ambient chill playlist",
      "lofi jazz playlist",
      "k-indie playlist",
      "soft mood playlist"
    ];
  }

  private scorePlaylist(
    playlist: SpotifySearchPlaylistItem,
    musicMood: MusicMood,
    weather: WeatherSnapshot
  ) {
    const haystack = `${playlist.name} ${playlist.description ?? ""}`.toLowerCase();
    let score = 0;

    for (const genre of musicMood.seedGenres) {
      const normalizedGenre = genre.toLowerCase();

      if (haystack.includes(normalizedGenre) || haystack.includes(normalizedGenre.replace(/-/g, " "))) {
        score += 6;
      }
    }

    if (haystack.includes(musicMood.title.toLowerCase())) {
      score += 4;
    }

    if (weather.condition === "rain" && /rain|lofi|jazz|chill|ambient|indie/.test(haystack)) {
      score += 3;
    }

    if (weather.condition === "clear" && /sun|city pop|pop|bright|soul/.test(haystack)) {
      score += 3;
    }

    if (/drive|driving|workout|gym|car|party|edm/.test(haystack)) {
      score -= 8;
    }

    if (/운전|드라이브|헬스|운동|파티/.test(haystack)) {
      score -= 8;
    }

    return score;
  }

  private buildStaticFallbackPlaylist(
    musicMood: MusicMood,
    weather: WeatherSnapshot
  ): SpotifyPlaylistPreview {
    return {
      provider: "spotify",
      title: `${this.mapWeatherToKoreanKeyword(weather)} · ${this.fallbackPlaylist.title}`,
      description: musicMood.description,
      externalUrl: this.fallbackPlaylist.externalUrl,
      imageUrl: null,
      uri: this.fallbackPlaylist.uri
    };
  }

  private mapWeatherToKoreanKeyword(weather: WeatherSnapshot) {
    switch (weather.condition) {
      case "rain":
        return "비 오는 날";
      case "snow":
        return "눈 오는 날";
      case "clear":
        return "맑은 날";
      default:
        return "흐린 날";
    }
  }

  private mapGenreToKoreanKeyword(genre: string) {
    const normalized = genre.toLowerCase();

    if (normalized.includes("city-pop")) return "시티팝";
    if (normalized.includes("ambient")) return "앰비언트";
    if (normalized.includes("soul")) return "소울";
    if (normalized.includes("lofi")) return "로파이";
    if (normalized.includes("jazz")) return "재즈";
    if (normalized.includes("indie")) return "인디";

    return genre.replace(/-/g, " ");
  }

  private cleanDescription(description?: string | null) {
    if (!description) {
      return null;
    }

    return description.replace(/<[^>]+>/g, "").trim() || null;
  }

  private async playerCommand(
    email: string,
    action: "pause" | "next" | "previous",
    deviceId?: string
  ) {
    const token = await this.getSdkAccessToken(email);
    const url = new URL(`https://api.spotify.com/v1/me/player/${action}`);

    if (deviceId) {
      url.searchParams.set("device_id", deviceId);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(await response.text());
    }
  }

  private async getConnectedProfile(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { profile: true }
    });

    if (!user?.profile?.spotifyConnected) {
      throw new NotFoundException("Spotify is not connected for this user.");
    }

    return {
      userId: user.id,
      profile: user.profile
    };
  }

  private async ensureFreshUserAccessToken(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId }
    });

    if (!profile?.spotifyConnected || !profile.spotifyRefreshToken) {
      throw new NotFoundException("Spotify is not connected for this user.");
    }

    const currentToken = profile.spotifyAccessToken;
    const expiresAt = profile.spotifyTokenExpires?.getTime() ?? 0;

    if (currentToken && Date.now() < expiresAt - 60_000) {
      return currentToken;
    }

    this.ensureOAuthConfig();

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${this.getBasicAuthHeader()}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: profile.spotifyRefreshToken
      })
    });

    if (!response.ok) {
      const reason = await response.text();
      throw new Error(`Spotify token refresh failed: ${reason}`);
    }

    const token = (await response.json()) as SpotifyTokenResponse;

    await this.prisma.profile.update({
      where: { userId },
      data: {
        spotifyConnected: true,
        spotifyAccessToken: token.access_token,
        spotifyRefreshToken: token.refresh_token ?? profile.spotifyRefreshToken,
        spotifyTokenExpires: new Date(Date.now() + token.expires_in * 1000)
      }
    });

    return token.access_token;
  }

  private ensureOAuthConfig() {
    if (!this.clientId || !this.clientSecret) {
      throw new Error("Spotify OAuth is not configured.");
    }
  }

  private getBasicAuthHeader() {
    return Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
  }

  private async getAccessToken() {
    const now = Date.now();

    if (this.accessToken && now < this.expiresAt) {
      return this.accessToken;
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${this.getBasicAuthHeader()}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    if (!response.ok) {
      throw new Error("Failed to authenticate with Spotify.");
    }

    const data = (await response.json()) as SpotifyTokenResponse;
    this.accessToken = data.access_token;
    this.expiresAt = now + (data.expires_in - 60) * 1000;

    return data.access_token;
  }
}

type SpotifyTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

type SpotifySearchResponse = {
  playlists?: {
    items?: SpotifySearchPlaylistItem[];
  };
};

type SpotifySearchPlaylistItem = {
  name: string;
  description?: string;
  uri?: string;
  external_urls?: {
    spotify?: string;
  };
  images?: Array<{
    url?: string;
  }>;
};
