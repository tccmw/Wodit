import { Injectable } from "@nestjs/common";
import type { WeatherRecommendationResponse } from "@wodit/types";
import type {
  RecommendationContext,
  RecommendationRequestDto
} from "./recommendation.dto";
import { WeatherService } from "../weather/weather.service";
import { buildRecommendation } from "../../../../../packages/utils/src";

@Injectable()
export class RecommendationService {
  constructor(private readonly weatherService: WeatherService) {}

  recommend({ weather, preference }: RecommendationRequestDto) {
    return buildRecommendation(weather, preference);
  }

  async recommendByLocation({
    location,
    preference
  }: RecommendationContext): Promise<WeatherRecommendationResponse> {
    try {
      const weather = await this.weatherService.getWeatherByCoordinates(location);

      return {
        source: "openweather",
        location,
        weather,
        recommendation: buildRecommendation(weather, preference)
      };
    } catch {
      const weather = this.weatherService.getPreviewWeather("Rainy Commute");

      return {
        source: "demo",
        location,
        weather,
        recommendation: buildRecommendation(weather, preference)
      };
    }
  }
}
