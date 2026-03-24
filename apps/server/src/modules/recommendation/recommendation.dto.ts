import type { Coordinates, UserPreference, WeatherSnapshot } from "@wodit/types";

export class RecommendationRequestDto {
  weather!: WeatherSnapshot;
  preference!: UserPreference;
}

export class RecommendationQueryDto {
  lat!: string;
  lon!: string;
  sensitivity?: string;
  offset?: string;
  nickname?: string;
}

export interface RecommendationContext {
  location: Coordinates;
  preference: UserPreference;
}
