import { Injectable } from "@nestjs/common";
import type { WeatherRecommendationResponse } from "@wodit/types";
import type {
  RecommendationContext,
  RecommendationRequestDto
} from "./recommendation.dto";
import { WeatherService } from "../weather/weather.service";
import { buildRecommendation } from "../../../../../packages/utils/src";
import { UsersService } from "../users/users.service";
import { SpotifyService } from "../spotify/spotify.service";

@Injectable()
export class RecommendationService {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly usersService: UsersService,
    private readonly spotifyService: SpotifyService
  ) {}

  recommend({ weather, preference }: RecommendationRequestDto) {
    return buildRecommendation(weather, preference);
  }

  async recommendByLocation({
    email,
    location,
    preference
  }: RecommendationContext): Promise<WeatherRecommendationResponse> {
    const persistedProfile = email
      ? await this.usersService.getPersistedProfileByEmail(email)
      : null;
    const resolvedPreference = persistedProfile
      ? {
          sensitivity: persistedProfile.sensitivity,
          offset: persistedProfile.offset,
          nickname: persistedProfile.nickname
        }
      : preference;

    try {
      const weather = await this.weatherService.getWeatherByCoordinates(location);
      const recommendation = buildRecommendation(weather, resolvedPreference);
      const spotify = await this.spotifyService.getPlaylistForMood(
        recommendation.musicMood,
        weather
      );

      return {
        source: "openweather",
        location,
        weather,
        recommendation,
        spotify
      };
    } catch {
      const weather = this.weatherService.getPreviewWeather("Rainy Commute");
      const recommendation = buildRecommendation(weather, resolvedPreference);
      const spotify = await this.spotifyService.getPlaylistForMood(
        recommendation.musicMood,
        weather
      );

      return {
        source: "demo",
        location,
        weather,
        recommendation,
        spotify
      };
    }
  }
}
