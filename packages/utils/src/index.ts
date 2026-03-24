import type {
  Coordinates,
  FeedbackStatus,
  MusicMood,
  OutfitRecommendation,
  RecommendationResult,
  UserPreference,
  WeatherSnapshot
} from "@wodit/types";

export const demoWeatherPresets: WeatherSnapshot[] = [
  {
    label: "Rainy Commute",
    tempC: 9,
    feelsLikeC: 6,
    condition: "rain",
    precipitationMm: 4,
    windSpeedMs: 5.1,
    uvIndex: 1
  },
  {
    label: "Bright Noon",
    tempC: 22,
    feelsLikeC: 23,
    condition: "clear",
    precipitationMm: 0,
    windSpeedMs: 2.2,
    uvIndex: 8
  },
  {
    label: "Humid Evening",
    tempC: 27,
    feelsLikeC: 29,
    condition: "clouds",
    precipitationMm: 0.4,
    windSpeedMs: 1.6,
    uvIndex: 4
  }
];

export function calculateSubjectiveTemp(
  weather: WeatherSnapshot,
  preference: UserPreference
) {
  const base = weather.feelsLikeC ?? weather.tempC;
  const windPenalty = weather.windSpeedMs >= 6 ? -1.5 : weather.windSpeedMs >= 4 ? -0.8 : 0;
  const rainPenalty = weather.precipitationMm > 0 ? -0.6 : 0;

  return base - preference.sensitivity + preference.offset + windPenalty + rainPenalty;
}

export function buildRecommendation(
  weather: WeatherSnapshot,
  preference: UserPreference
): RecommendationResult {
  const subjectiveTemp = calculateSubjectiveTemp(weather, preference);
  const outfit = recommendOutfit(subjectiveTemp, weather);
  const musicMood = recommendMusicMood(subjectiveTemp, weather);

  return {
    subjectiveTemp,
    reason: describeRecommendation(subjectiveTemp, weather),
    outfit,
    musicMood
  };
}

export function recommendOutfit(
  subjectiveTemp: number,
  weather: WeatherSnapshot
): OutfitRecommendation {
  let outfit: OutfitRecommendation;

  if (subjectiveTemp <= 0) {
    outfit = {
      top: ["Padded jacket", "Scarf", "Heattech layer"],
      bottom: ["Fleece pants", "Boots"],
      extras: ["Hand warmer"]
    };
  } else if (subjectiveTemp <= 10) {
    outfit = {
      top: ["Coat", "Jacket", "Knit"],
      bottom: ["Slacks", "Sneakers"],
      extras: []
    };
  } else if (subjectiveTemp <= 17) {
    outfit = {
      top: ["Cardigan", "Light jacket"],
      bottom: ["Jeans", "Cotton pants"],
      extras: []
    };
  } else if (subjectiveTemp <= 23) {
    outfit = {
      top: ["Shirt", "Light knit"],
      bottom: ["Cotton pants", "Loafers"],
      extras: []
    };
  } else {
    outfit = {
      top: ["Short-sleeve tee", "Linen shirt"],
      bottom: ["Shorts", "Sandals"],
      extras: []
    };
  }

  if (weather.precipitationMm > 0) {
    outfit.extras.push("Umbrella", "Waterproof shoes");
  }

  if (weather.uvIndex >= 7) {
    outfit.extras.push("Sunglasses", "Cap");
  }

  return outfit;
}

export function recommendMusicMood(
  subjectiveTemp: number,
  weather: WeatherSnapshot
): MusicMood {
  if (weather.condition === "rain") {
    return {
      title: "Rain Glass",
      description: "Muted lo-fi, jazz pop, and soft indie tracks for a rainy commute.",
      seedGenres: ["lofi", "jazz", "indie"]
    };
  }

  if (subjectiveTemp <= 10) {
    return {
      title: "Soft Layers",
      description: "City pop, ambient pop, and soul that pair well with coats and knit layers.",
      seedGenres: ["city-pop", "ambient", "soul"]
    };
  }

  if (subjectiveTemp >= 23) {
    return {
      title: "Sunlit Sprint",
      description: "Bright pop, funk, and dance tracks that fit a lighter warm-weather outfit.",
      seedGenres: ["dance", "funk", "pop"]
    };
  }

  return {
    title: "Easy Tempo",
    description: "Indie pop, neo soul, and smooth R&B for mild in-between weather.",
    seedGenres: ["indie-pop", "neo-soul", "rnb"]
  };
}

export function applyFeedbackOffset(
  preference: UserPreference,
  status: FeedbackStatus
): UserPreference {
  const nextOffset =
    status === "TOO_COLD"
      ? preference.offset - 1
      : status === "TOO_HOT"
        ? preference.offset + 1
        : preference.offset;

  return {
    ...preference,
    offset: Math.max(-6, Math.min(6, nextOffset))
  };
}

export function createWeatherSummary(
  weather: WeatherSnapshot,
  subjectiveTemp: number,
  nickname: string
) {
  return `The current air temperature is ${weather.tempC}C, but ${nickname}'s personalized temperature reads ${subjectiveTemp.toFixed(
    1
  )}C. ${describeRecommendation(subjectiveTemp, weather)}`;
}

function describeRecommendation(subjectiveTemp: number, weather: WeatherSnapshot) {
  const thermalNote =
    subjectiveTemp <= 10
      ? "A warmth-first layered outfit is the safer choice."
      : subjectiveTemp >= 23
        ? "A breathable, lighter outfit is the better fit."
        : "A light layered outfit should cover indoor and outdoor temperature swings.";

  const weatherNote =
    weather.precipitationMm > 0
      ? "Rain gear was added because precipitation is expected."
      : weather.uvIndex >= 7
        ? "Sun protection was added because the UV index is high."
        : "A standard daily outfit should work without extra gear.";

  return `${thermalNote} ${weatherNote}`;
}

export function formatCoordinates(location: Coordinates) {
  return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
}
