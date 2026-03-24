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
