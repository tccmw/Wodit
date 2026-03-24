import { Injectable } from "@nestjs/common";
import type { MusicMood, SpotifyPlaylistPreview, WeatherSnapshot } from "@wodit/types";

@Injectable()
export class SpotifyService {
  private readonly clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  private readonly clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  private accessToken: string | null = null;
  private expiresAt = 0;

  async getPlaylistForMood(
    musicMood: MusicMood,
    weather: WeatherSnapshot
  ): Promise<SpotifyPlaylistPreview | null> {
    if (!this.clientId || !this.clientSecret) {
      return null;
    }

    try {
      const token = await this.getAccessToken();
      const query = [musicMood.title, weather.label, musicMood.seedGenres[0]]
        .filter(Boolean)
        .join(" ");
      const url = new URL("https://api.spotify.com/v1/search");
      url.searchParams.set("q", query);
      url.searchParams.set("type", "playlist");
      url.searchParams.set("limit", "1");

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as SpotifySearchResponse;
      const playlist = data.playlists?.items?.[0];

      if (!playlist) {
        return null;
      }

      return {
        provider: "spotify",
        title: playlist.name,
        externalUrl: playlist.external_urls?.spotify ?? null,
        imageUrl: playlist.images?.[0]?.url ?? null
      };
    } catch {
      return null;
    }
  }

  private async getAccessToken() {
    const now = Date.now();

    if (this.accessToken && now < this.expiresAt) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
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
};

type SpotifySearchResponse = {
  playlists?: {
    items?: Array<{
      name: string;
      external_urls?: {
        spotify?: string;
      };
      images?: Array<{
        url?: string;
      }>;
    }>;
  };
};
