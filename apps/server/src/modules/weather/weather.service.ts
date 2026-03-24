import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { Coordinates, WeatherSnapshot } from "@wodit/types";
import { demoWeatherPresets } from "../../../../../packages/utils/src";

@Injectable()
export class WeatherService {
  private readonly apiKey = process.env.OPENWEATHER_API_KEY?.trim();

  getPreviewWeather(preset?: string) {
    const selected = demoWeatherPresets.find(
      (item) => item.label.toLowerCase() === preset?.toLowerCase()
    );

    return selected ?? demoWeatherPresets[0];
  }

  async getWeatherByCoordinates(location: Coordinates): Promise<WeatherSnapshot> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException("OPENWEATHER_API_KEY is not configured.");
    }

    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.searchParams.set("lat", String(location.lat));
    url.searchParams.set("lon", String(location.lng));
    url.searchParams.set("appid", this.apiKey);
    url.searchParams.set("units", "metric");
    url.searchParams.set("lang", "kr");

    const response = await fetch(url);

    if (!response.ok) {
      throw new ServiceUnavailableException("Failed to fetch weather from OpenWeather.");
    }

    const data = (await response.json()) as OpenWeatherCurrentResponse;
    const rainVolume = data.rain?.["1h"] ?? data.rain?.["3h"] ?? 0;
    const snowVolume = data.snow?.["1h"] ?? data.snow?.["3h"] ?? 0;

    return {
      label: data.name || "Live Weather",
      tempC: Math.round(data.main.temp * 10) / 10,
      feelsLikeC: Math.round(data.main.feels_like * 10) / 10,
      condition: this.mapCondition(data.weather?.[0]?.main),
      precipitationMm: Math.max(rainVolume, snowVolume),
      windSpeedMs: Math.round(data.wind.speed * 10) / 10,
      uvIndex: this.estimateUvIndex(data.clouds?.all ?? 0, data.weather?.[0]?.icon)
    };
  }

  async geocodeAddress(query: string) {
    const normalized = query.trim();

    if (!normalized) {
      throw new ServiceUnavailableException("Address query is required.");
    }

    if (!this.apiKey) {
      const fallback = this.getFallbackLocation(normalized);
      if (fallback) {
        return fallback;
      }

      throw new ServiceUnavailableException("OPENWEATHER_API_KEY is not configured.");
    }

    const url = new URL("https://api.openweathermap.org/geo/1.0/direct");
    url.searchParams.set("q", normalized);
    url.searchParams.set("limit", "5");
    url.searchParams.set("appid", this.apiKey);

    const response = await fetch(url);

    if (!response.ok) {
      const fallback = this.getFallbackLocation(normalized);
      if (fallback) {
        return fallback;
      }

      throw new ServiceUnavailableException("Failed to geocode address from OpenWeather.");
    }

    const results = (await response.json()) as OpenWeatherGeocodeResponse[];
    const first = results[0];

    if (!first) {
      const fallback = this.getFallbackLocation(normalized);
      if (fallback) {
        return fallback;
      }

      throw new ServiceUnavailableException("No matching address was found.");
    }

    return {
      name: [first.name, first.state, first.country].filter(Boolean).join(", "),
      lat: Number(first.lat.toFixed(6)),
      lng: Number(first.lon.toFixed(6))
    };
  }

  private getFallbackLocation(query: string) {
    const lowered = query.toLowerCase();

    const matches = [
      { keys: ["서울", "seoul"], name: "서울특별시", lat: 37.5665, lng: 126.978 },
      { keys: ["대전", "daejeon"], name: "대전광역시", lat: 36.3504, lng: 127.3845 },
      { keys: ["부산", "busan"], name: "부산광역시", lat: 35.1796, lng: 129.0756 },
      { keys: ["대구", "daegu"], name: "대구광역시", lat: 35.8714, lng: 128.6014 },
      { keys: ["광주", "gwangju"], name: "광주광역시", lat: 35.1595, lng: 126.8526 },
      { keys: ["인천", "incheon"], name: "인천광역시", lat: 37.4563, lng: 126.7052 },
      { keys: ["제주", "jeju"], name: "제주시", lat: 33.4996, lng: 126.5312 }
    ].find((candidate) => candidate.keys.some((key) => lowered.includes(key)));

    if (!matches) {
      return null;
    }

    return {
      name: matches.name,
      lat: matches.lat,
      lng: matches.lng
    };
  }

  private mapCondition(condition?: string): WeatherSnapshot["condition"] {
    const normalized = condition?.toLowerCase();

    if (normalized?.includes("rain") || normalized?.includes("drizzle") || normalized?.includes("thunderstorm")) {
      return "rain";
    }

    if (normalized?.includes("snow")) {
      return "snow";
    }

    if (normalized?.includes("mist") || normalized?.includes("fog") || normalized?.includes("haze")) {
      return "mist";
    }

    if (normalized?.includes("cloud")) {
      return "clouds";
    }

    return "clear";
  }

  private estimateUvIndex(cloudCoverage: number, icon?: string) {
    const isDaytime = icon?.endsWith("d") ?? true;
    if (!isDaytime) {
      return 0;
    }

    if (cloudCoverage <= 10) {
      return 8;
    }

    if (cloudCoverage <= 35) {
      return 6;
    }

    if (cloudCoverage <= 65) {
      return 4;
    }

    return 2;
  }
}

type OpenWeatherGeocodeResponse = {
  name: string;
  state?: string;
  country?: string;
  lat: number;
  lon: number;
};

type OpenWeatherCurrentResponse = {
  name?: string;
  weather?: Array<{
    main?: string;
    icon?: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
  };
  wind: {
    speed: number;
  };
  clouds?: {
    all?: number;
  };
  rain?: {
    "1h"?: number;
    "3h"?: number;
  };
  snow?: {
    "1h"?: number;
    "3h"?: number;
  };
};
