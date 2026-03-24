import type { UserPreference, WeatherSnapshot } from "@wodit/types";

export class RecommendationRequestDto {
  weather!: WeatherSnapshot;
  preference!: UserPreference;
}
