export type WeatherCondition = "clear" | "clouds" | "rain" | "snow" | "mist";

export type FeedbackStatus = "TOO_COLD" | "GOOD" | "TOO_HOT";

export interface WeatherSnapshot {
  label: string;
  tempC: number;
  feelsLikeC?: number;
  condition: WeatherCondition;
  precipitationMm: number;
  windSpeedMs: number;
  uvIndex: number;
}

export interface UserPreference {
  sensitivity: number;
  offset: number;
  nickname: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface UserProfile extends UserPreference {
  location: Coordinates;
  onboardingCompleted: boolean;
}

export interface OutfitRecommendation {
  top: string[];
  bottom: string[];
  extras: string[];
}

export interface MusicMood {
  title: string;
  description: string;
  seedGenres: string[];
}

export interface RecommendationResult {
  subjectiveTemp: number;
  reason: string;
  outfit: OutfitRecommendation;
  musicMood: MusicMood;
}
