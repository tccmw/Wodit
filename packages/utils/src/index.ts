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
  preference: UserPreference,
  variant = 0
): RecommendationResult {
  const subjectiveTemp = calculateSubjectiveTemp(weather, preference);
  const outfit = recommendOutfit(subjectiveTemp, weather, variant);
  const musicMood = recommendMusicMood(subjectiveTemp, weather);

  return {
    subjectiveTemp,
    lookHeadline: createLookHeadline(subjectiveTemp, weather),
    reason: describeRecommendation(subjectiveTemp, weather),
    outfit,
    musicMood
  };
}

export function recommendOutfit(
  subjectiveTemp: number,
  weather: WeatherSnapshot,
  variant = 0
): OutfitRecommendation {
  const band = getThermalBand(subjectiveTemp);
  const catalog = OUTFIT_CATALOG[band];
  const seed = createSeed(subjectiveTemp, weather, variant);

  const top = pickMany(catalog.top, 2, seed + 11);
  const bottom = pickMany(catalog.bottom, 1, seed + 23);
  const shoes = pickMany(catalog.shoes, 1, seed + 31);
  const extras = pickMany(catalog.extras, Math.min(2, catalog.extras.length), seed + 47);

  const outfit: OutfitRecommendation = {
    top,
    bottom: [...bottom, ...shoes],
    extras
  };

  if (weather.precipitationMm > 0) {
    outfit.extras = uniqueItems([...outfit.extras, "\uC6B0\uC0B0", "\uBC29\uC218 \uC288\uC988"]);
  }

  if (weather.windSpeedMs >= 5) {
    outfit.extras = uniqueItems([...outfit.extras, "\uBC14\uB78C\uB9C9\uC774"]);
  }

  if (weather.uvIndex >= 7) {
    outfit.extras = uniqueItems([...outfit.extras, "\uC120\uAE00\uB77C\uC2A4", "\uCEA1 \uBAA8\uC790"]);
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
      description:
        "\uBE44 \uC624\uB294 \uCD9C\uADFC\uAE38\uC5D0 \uC5B4\uC6B8\uB9AC\uB294 \uB85C\uD30C\uC774 \uC7AC\uC988\uC640 \uC794\uC794\uD55C \uC778\uB514 \uC0AC\uC6B4\uB4DC.",
      seedGenres: ["lofi", "jazz", "indie"]
    };
  }

  if (subjectiveTemp <= 10) {
    return {
      title: "Soft Layers",
      description:
        "\uCF54\uD2B8\uC640 \uB2C8\uD2B8 \uBB34\uB4DC\uC5D0 \uB9DE\uB294 \uC2DC\uD2F0\uD31D, \uC570\uBE44\uC5B8\uD2B8, \uC18C\uC6B8 \uD50C\uB808\uC774\uB9AC\uC2A4\uD2B8.",
      seedGenres: ["city-pop", "ambient", "soul"]
    };
  }

  if (subjectiveTemp >= 23) {
    return {
      title: "Sunlit Sprint",
      description:
        "\uAC00\uBCBC\uC6B4 \uC637\uCC28\uB9BC\uC5D0 \uC5B4\uC6B8\uB9AC\uB294 \uBC1D\uC740 \uD31D, \uD391\uD06C, \uB304\uC2A4 \uD2B8\uB799.",
      seedGenres: ["dance", "funk", "pop"]
    };
  }

  return {
    title: "Easy Tempo",
    description:
      "\uC560\uB9E4\uD55C \uAC04\uC808\uAE30\uC5D0 \uC798 \uC5B4\uC6B8\uB9AC\uB294 \uC778\uB514\uD31D\uACFC \uB124\uC624\uC18C\uC6B8, \uBD80\uB4DC\uB7EC\uC6B4 R&B.",
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
  return `\uD604\uC7AC \uAE30\uC628\uC740 ${weather.tempC}\u00B0C\uC9C0\uB9CC ${nickname}\uB2D8\uC758 \uB9DE\uCDA4 \uCCB4\uAC10 \uC628\uB3C4\uB294 ${subjectiveTemp.toFixed(
    1
  )}\u00B0C\uC785\uB2C8\uB2E4. ${describeRecommendation(subjectiveTemp, weather)}`;
}

function describeRecommendation(subjectiveTemp: number, weather: WeatherSnapshot) {
  const thermalNote =
    subjectiveTemp <= 10
      ? "\uBCF4\uC628 \uC704\uC8FC\uC758 \uB808\uC774\uC5B4\uB4DC \uC870\uD569\uC774 \uB354 \uC548\uC815\uC801\uC785\uB2C8\uB2E4."
      : subjectiveTemp >= 23
        ? "\uD1B5\uAE30\uC131\uC774 \uC88B\uC740 \uAC00\uBCBC\uC6B4 \uC637\uCC28\uB9BC\uC774 \uB354 \uC801\uD569\uD569\uB2C8\uB2E4."
        : "\uC2E4\uB0B4\uC678 \uC628\uB3C4 \uCC28\uB97C \uACE0\uB824\uD55C \uAC00\uBCBC\uC6B4 \uB808\uC774\uC5B4\uB4DC \uC870\uD569\uC774 \uC88B\uC2B5\uB2C8\uB2E4.";

  const weatherNote =
    weather.precipitationMm > 0
      ? "\uAC15\uC218\uAC00 \uC788\uC5B4 \uC6B0\uC0B0\uACFC \uBC29\uC218 \uC544\uC774\uD15C\uC744 \uD568\uAED8 \uCD94\uCC9C\uD588\uC2B5\uB2C8\uB2E4."
      : weather.uvIndex >= 7
        ? "\uC790\uC678\uC120 \uC9C0\uC218\uAC00 \uB192\uC544 \uC120\uAE00\uB77C\uC2A4\uC640 \uBAA8\uC790\uB97C \uD568\uAED8 \uCD94\uCC9C\uD588\uC2B5\uB2C8\uB2E4."
        : "\uCD94\uAC00 \uC7A5\uBE44 \uC5C6\uC774\uB3C4 \uBB34\uB09C\uD55C \uC77C\uC0C1 \uCF54\uB514\uC785\uB2C8\uB2E4.";

  return `${thermalNote} ${weatherNote}`;
}

function createLookHeadline(subjectiveTemp: number, weather: WeatherSnapshot) {
  if (weather.precipitationMm > 0) {
    return "\uBE44 \uC624\uB294 \uB0A0 \uAE30\uBCF8\uC5D0 \uCD5C\uC801\uD654\uB41C \uBC29\uC218 \uB808\uC774\uC5B4\uB4DC \uB8E9";
  }

  if (subjectiveTemp <= 10) {
    return "\uCC28\uAC00\uC6B4 \uACF5\uAE30\uC5D0 \uB9DE\uCD98 \uB3C4\uC2DC\uD615 \uBCF4\uC628 \uB8E9";
  }

  if (subjectiveTemp >= 23) {
    return "\uAC00\uBCBC\uACE0 \uC2DC\uC6D0\uD55C \uD558\uC808 \uB370\uC77C\uB9AC \uB8E9";
  }

  return "\uC77C\uAD50\uCC28\uC5D0 \uC798 \uBC84\uD2F0\uB294 \uAC04\uC808\uAE30 \uB808\uC774\uC5B4\uB4DC \uB8E9";
}

export function formatCoordinates(location: Coordinates) {
  return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
}

type ThermalBand = "freezing" | "cold" | "cool" | "mild" | "warm";

type OutfitCatalog = {
  top: string[];
  bottom: string[];
  shoes: string[];
  extras: string[];
};

const OUTFIT_CATALOG: Record<ThermalBand, OutfitCatalog> = {
  freezing: {
    top: ["\uD328\uB529", "\uB871\uD328\uB529", "\uD50C\uB9AC\uC2A4", "\uD6C4\uB4DC \uB2C8\uD2B8", "\uAE30\uBAA8 \uB9E8\uD22C\uB9E8"],
    bottom: ["\uAE30\uBAA8 \uC2AC\uB799\uC2A4", "\uAE30\uBAA8 \uCCAD\uBC14\uC9C0", "\uC6B8 \uD32C\uCE20"],
    shoes: ["\uBD80\uCE20", "\uD558\uC774\uD0D1 \uC2A4\uB2C8\uCEE4\uC988"],
    extras: ["\uBAA9\uB3C4\uB9AC", "\uB0B4\uC758", "\uBE44\uB2C8", "\uD56B\uD329"]
  },
  cold: {
    top: ["\uCF54\uD2B8", "\uC6B8 \uC790\uCF13", "\uBD80\uD074 \uC790\uCF13", "\uD3F4\uB77C \uB2C8\uD2B8", "\uAC00\uB514\uAC74"],
    bottom: ["\uC2AC\uB799\uC2A4", "\uCCAD\uBC14\uC9C0", "\uC640\uC774\uB4DC \uD32C\uCE20"],
    shoes: ["\uC6B4\uB3D9\uD654", "\uB85C\uD37C", "\uC571\uD074\uBD80\uCE20"],
    extras: ["\uBAA9\uB3C4\uB9AC", "\uB2C8\uD2B8 \uBAA8\uC790", "\uAC00\uC8FD \uC7A5\uAC11"]
  },
  cool: {
    top: ["\uAC00\uB514\uAC74", "\uC587\uC740 \uC790\uCF13", "\uB9E8\uD22C\uB9E8", "\uC154\uCE20", "\uC9D1\uC5C5 \uB2C8\uD2B8"],
    bottom: ["\uCCAD\uBC14\uC9C0", "\uBA74\uBC14\uC9C0", "\uC2AC\uB799\uC2A4"],
    shoes: ["\uC2A4\uB2C8\uCEE4\uC988", "\uB85C\uD37C", "\uB354\uBE44 \uC288\uC988"],
    extras: ["\uC5D0\uCF54\uBC31", "\uBCFC\uCEA1", "\uAC00\uBCBC\uC6B4 \uC2A4\uCE74\uD504"]
  },
  mild: {
    top: ["\uC154\uCE20", "\uB9B0\uB128 \uC154\uCE20", "\uBC18\uD314 \uB2C8\uD2B8", "\uD53C\uCF00 \uD2F0\uC154\uCE20", "\uAC00\uB514\uAC74"],
    bottom: ["\uBA74\uBC14\uC9C0", "\uC2AC\uB799\uC2A4", "\uD06C\uB9BC \uCCAD\uBC14\uC9C0"],
    shoes: ["\uB85C\uD37C", "\uC2A4\uB2C8\uCEE4\uC988", "\uC2AC\uB9BD\uC628"],
    extras: ["\uC120\uAE00\uB77C\uC2A4", "\uAC00\uBCBC\uC6B4 \uAC00\uBC29"]
  },
  warm: {
    top: ["\uBC18\uD314 \uD2F0\uC154\uCE20", "\uB9B0\uB128 \uC154\uCE20", "\uB178\uC2AC\uB9AC\uBE0C", "\uD53C\uCF00 \uD2F0\uC154\uCE20"],
    bottom: ["\uBC18\uBC14\uC9C0", "\uB9B0\uB128 \uD32C\uCE20", "\uC870\uAC70 \uC20F\uCE20"],
    shoes: ["\uC0CC\uB4E4", "\uCEE8\uBC84\uC2A4", "\uC2AC\uB9AC\uD37C"],
    extras: ["\uBCFC\uCEA1", "\uC120\uAE00\uB77C\uC2A4", "\uD140\uBE14\uB7EC"]
  }
};

function getThermalBand(subjectiveTemp: number): ThermalBand {
  if (subjectiveTemp <= 0) return "freezing";
  if (subjectiveTemp <= 10) return "cold";
  if (subjectiveTemp <= 17) return "cool";
  if (subjectiveTemp <= 23) return "mild";
  return "warm";
}

function createSeed(subjectiveTemp: number, weather: WeatherSnapshot, variant: number) {
  const labelScore = weather.label
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return (
    Math.round(subjectiveTemp * 10) +
    Math.round(weather.tempC * 10) +
    Math.round(weather.windSpeedMs * 10) +
    Math.round(weather.precipitationMm * 10) +
    weather.uvIndex * 7 +
    labelScore +
    variant * 97
  );
}

function pickMany(source: string[], count: number, seed: number) {
  const pool = [...source];
  const picked: string[] = [];

  for (let index = 0; index < count && pool.length > 0; index += 1) {
    const nextIndex = Math.abs(seed + index * 17) % pool.length;
    picked.push(pool.splice(nextIndex, 1)[0]);
  }

  return picked;
}

function uniqueItems(items: string[]) {
  return items.filter((item, index) => items.indexOf(item) === index);
}
