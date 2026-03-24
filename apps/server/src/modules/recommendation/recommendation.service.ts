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
import { OutfitCatalogService } from "../outfit/outfit-catalog.service";

@Injectable()
export class RecommendationService {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly usersService: UsersService,
    private readonly spotifyService: SpotifyService,
    private readonly outfitCatalogService: OutfitCatalogService
  ) {}

  recommend({ weather, preference }: RecommendationRequestDto) {
    return buildRecommendation(weather, preference);
  }

  async recommendByLocation({
    email,
    location,
    variant = 0,
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
      const recommendation = buildRecommendation(weather, resolvedPreference, variant);
      const catalogOutfit = await this.outfitCatalogService.buildOutfit(
        recommendation.subjectiveTemp,
        weather,
        variant
      );
      recommendation.outfit = catalogOutfit.outfit;
      recommendation.lookHeadline = catalogOutfit.headline;
      const spotify = await this.spotifyService.getPlaylistForMood(
        recommendation.musicMood,
        weather
      );

      return {
        source: "openweather",
        variant,
        location,
        weather,
        recommendation,
        spotify
      };
    } catch {
      const weather = this.weatherService.getPreviewWeather("Rainy Commute");
      const recommendation = buildRecommendation(weather, resolvedPreference, variant);
      const catalogOutfit = await this.outfitCatalogService.buildOutfit(
        recommendation.subjectiveTemp,
        weather,
        variant
      );
      recommendation.outfit = catalogOutfit.outfit;
      recommendation.lookHeadline = catalogOutfit.headline;
      const spotify = await this.spotifyService.getPlaylistForMood(
        recommendation.musicMood,
        weather
      );

      return {
        source: "demo",
        variant,
        location,
        weather,
        recommendation,
        spotify
      };
    }
  }
}
