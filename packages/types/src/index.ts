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

export interface SpotifyPlaylistPreview {
  provider: "spotify";
  title: string;
  externalUrl: string | null;
  imageUrl: string | null;
}

export interface RecommendationResult {
  subjectiveTemp: number;
  reason: string;
  outfit: OutfitRecommendation;
  musicMood: MusicMood;
}

export interface WeatherRecommendationResponse {
  source: "openweather" | "demo";
  location: Coordinates;
  weather: WeatherSnapshot;
  recommendation: RecommendationResult;
  spotify: SpotifyPlaylistPreview | null;
}

export interface PersistedUserProfile {
  email: string;
  name: string | null;
  image: string | null;
  nickname: string;
  sensitivity: number;
  offset: number;
  location: Coordinates;
  regionName: string;
  onboardingCompleted: boolean;
  spotifyConnected: boolean;
}

export interface SyncUserRequest {
  email: string;
  name?: string | null;
  image?: string | null;
}

export interface UpdateProfileRequest {
  email: string;
  nickname?: string;
  sensitivity?: number;
  offset?: number;
  location?: Coordinates;
  regionName?: string;
  onboardingCompleted?: boolean;
}

export interface SubmitFeedbackRequest {
  email: string;
  status: FeedbackStatus;
  weather: WeatherSnapshot;
  location: Coordinates;
  recommendation?: RecommendationResult | null;
}

export interface SubmitFeedbackResponse {
  profile: PersistedUserProfile;
}
