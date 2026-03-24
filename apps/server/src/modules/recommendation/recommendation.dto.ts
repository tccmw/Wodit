import type { Coordinates, UserPreference, WeatherSnapshot } from "@wodit/types";

export class RecommendationRequestDto {
  weather!: WeatherSnapshot;
  preference!: UserPreference;
}

export class RecommendationQueryDto {
  email?: string;
  lat!: string;
  lon!: string;
  variant?: string;
  sensitivity?: string;
  offset?: string;
  nickname?: string;
  regionName?: string;
}

export interface RecommendationContext {
  email?: string;
  location: Coordinates;
  preference: UserPreference;
  variant?: number;
}
